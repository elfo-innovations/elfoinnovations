/**
 * Finding 19 — automated regression test for Finding 1.
 *
 * This test proves that public.generate_project_invoice() (the
 * trg_generate_project_invoice AFTER INSERT trigger on public.projects)
 * never trusts a client-submitted price, and instead always uses the
 * authoritative price from public.services.
 *
 * It is a REAL integration test: it connects to an isolated local
 * PostgreSQL database, installs the actual trigger/function SQL pulled
 * verbatim from the live Supabase project, inserts real rows, lets the
 * real AFTER INSERT trigger fire, and asserts on the resulting invoice
 * row. It does NOT reimplement the trigger's logic in JavaScript.
 *
 * This never touches the production Supabase database. Connection info
 * points only at a local test-only PostgreSQL instance/role created for
 * this purpose (see HISTORY.md, Finding 19 entry).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_DB_URL =
  process.env.FINDING19_TEST_DATABASE_URL ??
  "postgresql://finding19_test:finding19_test_local_only@127.0.0.1:5432/finding19_test";

const client = new Client({ connectionString: TEST_DB_URL });

async function resetSchema() {
  await client.query(`
    drop schema public cascade;
    create schema public;
  `);
  const schemaSql = readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const triggerSql = readFileSync(path.join(__dirname, "trigger.sql"), "utf8");
  await client.query(schemaSql);
  await client.query(triggerSql);
}

beforeAll(async () => {
  await client.connect();
  await resetSchema();
});

afterAll(async () => {
  await client.end();
});

describe("Finding 1 — generate_project_invoice trigger trusts services.price, not the submitted price", () => {
  it("uses the authoritative service price, ignoring a manipulated submitted price", async () => {
    const clientRes = await client.query(
      `insert into clients (full_name, email) values ('Test Client', 'test-client@example.test') returning id`,
    );
    const clientId = clientRes.rows[0].id;

    const serviceRes = await client.query(
      `insert into services (title, is_active, price) values ('Test Service', true, 5000) returning id`,
    );
    const serviceId = serviceRes.rows[0].id;

    const maliciousSelectedServices = JSON.stringify([{ service_id: serviceId, price: 999999 }]);

    const projectRes = await client.query(
      `insert into projects (name, client_id, selected_services)
       values ('Test Project', $1, $2::jsonb)
       returning id`,
      [clientId, maliciousSelectedServices],
    );
    const projectId = projectRes.rows[0].id;

    const invoiceRes = await client.query(`select * from project_invoices where project_id = $1`, [
      projectId,
    ]);

    expect(invoiceRes.rowCount).toBe(1);
    const invoice = invoiceRes.rows[0];

    // The real service price (5000) must win, never the submitted price (999999).
    expect(Number(invoice.subtotal)).toBe(5000);
    expect(Number(invoice.total)).toBe(5000);
    expect(Number(invoice.items[0].unit_price)).toBe(5000);
    expect(Number(invoice.items[0].unit_price)).not.toBe(999999);
  });

  it("skips a service_id that does not exist and does not fall back to the submitted price", async () => {
    const clientRes = await client.query(
      `insert into clients (full_name, email) values ('Test Client 2', 'test-client-2@example.test') returning id`,
    );
    const clientId = clientRes.rows[0].id;

    const nonExistentServiceId = "00000000-0000-0000-0000-000000000000";
    const maliciousSelectedServices = JSON.stringify([
      { service_id: nonExistentServiceId, price: 999999 },
    ]);

    const projectRes = await client.query(
      `insert into projects (name, client_id, selected_services)
       values ('Test Project With Invalid Service', $1, $2::jsonb)
       returning id`,
      [clientId, maliciousSelectedServices],
    );
    const projectId = projectRes.rows[0].id;

    const invoiceRes = await client.query(`select * from project_invoices where project_id = $1`, [
      projectId,
    ]);

    // The trigger still runs (selected_services is non-empty) and still inserts
    // an invoice row, but the invalid service is skipped inside the loop, so
    // the invoice has no line items and a subtotal of 0 — never 999999.
    expect(invoiceRes.rowCount).toBe(1);
    const invoice = invoiceRes.rows[0];
    expect(invoice.items).toEqual([]);
    expect(Number(invoice.subtotal)).toBe(0);
    expect(Number(invoice.total)).toBe(0);
  });

  it("skips an inactive service and does not use its price or the submitted price", async () => {
    const clientRes = await client.query(
      `insert into clients (full_name, email) values ('Test Client 3', 'test-client-3@example.test') returning id`,
    );
    const clientId = clientRes.rows[0].id;

    const inactiveServiceRes = await client.query(
      `insert into services (title, is_active, price) values ('Inactive Service', false, 5000) returning id`,
    );
    const inactiveServiceId = inactiveServiceRes.rows[0].id;

    const maliciousSelectedServices = JSON.stringify([
      { service_id: inactiveServiceId, price: 999999 },
    ]);

    const projectRes = await client.query(
      `insert into projects (name, client_id, selected_services)
       values ('Test Project With Inactive Service', $1, $2::jsonb)
       returning id`,
      [clientId, maliciousSelectedServices],
    );
    const projectId = projectRes.rows[0].id;

    const invoiceRes = await client.query(`select * from project_invoices where project_id = $1`, [
      projectId,
    ]);

    expect(invoiceRes.rowCount).toBe(1);
    const invoice = invoiceRes.rows[0];
    expect(invoice.items).toEqual([]);
    expect(Number(invoice.subtotal)).toBe(0);
  });
});
