// Minimal IndexedDB queue for offline inquiry submissions.
// Stores plain form fields (no secrets) with an idempotency key.

const DB_NAME = "elfo-offline";
const DB_VERSION = 1;
const STORE = "inquiries";

export type QueuedInquiry = {
  id: string;
  createdAt: number;
  payload: Record<string, unknown>;
  status: "pending" | "syncing" | "done" | "failed";
  attempts: number;
  lastError?: string;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no-idb"));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => Promise<T> | T): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const s = t.objectStore(STORE);
    Promise.resolve(fn(s)).then((v) => {
      t.oncomplete = () => resolve(v);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    }, reject);
  });
}

export async function enqueueInquiry(payload: Record<string, unknown>): Promise<QueuedInquiry> {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `q_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const item: QueuedInquiry = { id, createdAt: Date.now(), payload, status: "pending", attempts: 0 };
  await tx("readwrite", (s) => new Promise<void>((res, rej) => {
    const r = s.put(item);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  }));
  return item;
}

export async function listPending(): Promise<QueuedInquiry[]> {
  try {
    return await tx("readonly", (s) => new Promise<QueuedInquiry[]>((res, rej) => {
      const r = s.getAll();
      r.onsuccess = () => res(((r.result as QueuedInquiry[]) || []).filter((i) => i.status === "pending" || i.status === "failed"));
      r.onerror = () => rej(r.error);
    }));
  } catch {
    return [];
  }
}

export async function markDone(id: string): Promise<void> {
  await tx("readwrite", (s) => new Promise<void>((res, rej) => {
    const g = s.get(id);
    g.onsuccess = () => {
      const item = g.result as QueuedInquiry | undefined;
      if (!item) return res();
      item.status = "done";
      const p = s.put(item);
      p.onsuccess = () => res();
      p.onerror = () => rej(p.error);
    };
    g.onerror = () => rej(g.error);
  }));
}

export async function markFailed(id: string, err: string): Promise<void> {
  await tx("readwrite", (s) => new Promise<void>((res, rej) => {
    const g = s.get(id);
    g.onsuccess = () => {
      const item = g.result as QueuedInquiry | undefined;
      if (!item) return res();
      item.status = "failed";
      item.attempts = (item.attempts || 0) + 1;
      item.lastError = err.slice(0, 500);
      const p = s.put(item);
      p.onsuccess = () => res();
      p.onerror = () => rej(p.error);
    };
    g.onerror = () => rej(g.error);
  }));
}
