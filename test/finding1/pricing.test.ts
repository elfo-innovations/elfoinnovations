/**
 * Finding 19 — automated regression test for Finding 1.
 *
 * This test proves that public.generate_project_invoice() (the
 * trg_generate_project_invoice AFTER INSERT trigger on public.projects)
 * never trusts a client-submitted price, and instead always uses the
 * authoritative price from public.services.
 *
 * It is a REAL integration test: it spins up an isolated, in-process
 * PostgreSQL engine (PGlite — real Postgres compiled to WASM, no external
 * server required), installs the actual trigger/function SQL pulled
 * verbatim from the live Supabase project, inserts real rows, lets the
 * real AFTER INSERT trigger fire, and asserts on the resulting invoice
 * row. It does NOT reimplement the trigger's logic in JavaScript.
 *
 * This never touches the production Supabase database, and it never
 * requires a locally-running PostgreSQL server (no 127.0.0.1:5432
 * dependency) — PGlite runs the real Postgres/PL/pgSQL engine in-process,
 * so `npm test` works the same way locally and in CI (see HISTORY.md,
 * Finding 19 entry).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Kept the name `client` so the rest of this file's `client.query(...)`
// calls need no structural changes — PGlite's query() result shape
// (rows / rowCount) matches the `pg` Client closely enough for this test.
const client = new PGlite();

async function resetSchema() {
  // PGlite's query() uses the extended/prepared-statement protocol, which
  // only accepts one statement at a time. schema.sql/trigger.sql are
  // multi-statement scripts, so they're loaded with exec() instead, which
  // supports multi-statement SQL (same engine, simple-query protocol).
  await client.exec(`
    drop schema public cascade;
    create schema public;
  `);
  let schemaSql = readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  // gen_random_uuid() has been part of core PostgreSQL since v13, and
  // PGlite ships Postgres 16, so the pgcrypto extension this line used to
  // provide it is unnecessary — and PGlite doesn't bundle pgcrypto anyway.
  schemaSql = schemaSql.replace(
    /create extension if not exists pgcrypto;.*\n/i,
    "-- pgcrypto not needed here: gen_random_uuid() is built into PGlite's Postgres 16 core\n",
  );
  const triggerSql = readFileSync(path.join(__dirname, "trigger.sql"), "utf8");
  await client.exec(schemaSql);
  await client.exec(triggerSql);
}

beforeAll(async () => {
  await resetSchema();
});

afterAll(async () => {
  await client.close();
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
