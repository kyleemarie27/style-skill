import pg from "pg";
import { SCHEMA } from "./schema.js";

// Keep one pool per serverless instance.
let pool: pg.Pool | null = null;
let ready: Promise<void> | null = null;

// DATE columns come back as plain YYYY-MM-DD strings, not JS Dates shifted by timezone.
pg.types.setTypeParser(1082, (v) => v);
// NUMERIC → number
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));

function connectionString(): string {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new HttpError(500, "DATABASE_URL is not set. Add a Neon Postgres database in Vercel → Storage.");
  return url;
}

export function getPool(): pg.Pool {
  if (!pool) {
    const url = connectionString();
    const local = /localhost|127\.0\.0\.1|\/var\/run/.test(url);
    pool = new pg.Pool({ connectionString: url, max: 3, ssl: local ? undefined : { rejectUnauthorized: false } });
  }
  return pool;
}

/** Run a query, creating the tables on first use so there's no manual DB setup step. */
export async function q<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params: unknown[] = []) {
  const p = getPool();
  ready ??= ensureSchema(p).catch((e) => {
    ready = null;
    throw e;
  });
  await ready;
  return p.query<T>(text, params);
}

/**
 * Serverless instances start in parallel, and concurrent CREATE TABLE IF NOT EXISTS can collide in
 * Postgres's catalog. An advisory lock makes the first instance create the tables while the rest wait.
 */
async function ensureSchema(p: pg.Pool) {
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(727274)");
    await client.query(SCHEMA);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
