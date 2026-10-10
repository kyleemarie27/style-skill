/**
 * Local stand-in for Vercel's function runtime: serves /api/<name> from api/<name>.ts.
 * Vite (port 5173) proxies /api here. On Vercel this file isn't used.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";

// Load .env.local / .env without extra dependencies.
for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const PORT = Number(process.env.API_PORT ?? 3001);

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function decorate(res: ServerResponse) {
  const r = res as ServerResponse & Record<string, any>;
  r.status = (code: number) => {
    r.statusCode = code;
    return r;
  };
  r.json = (obj: unknown) => {
    r.setHeader("Content-Type", "application/json");
    r.end(JSON.stringify(obj));
    return r;
  };
  r.send = (body: unknown) => {
    r.end(body as any);
    return r;
  };
  return r;
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const name = url.pathname.replace(/^\/api\//, "").replace(/[^a-z-]/g, "");
  const file = new URL(`../api/${name}.ts`, import.meta.url);
  if (!name || name.startsWith("_") || !existsSync(file)) {
    res.statusCode = 404;
    return res.end("Not found");
  }
  const vreq = req as IncomingMessage & Record<string, any>;
  vreq.query = Object.fromEntries(url.searchParams);
  vreq.body = await readBody(req);
  const mod = await import(file.href);
  await mod.default(vreq, decorate(res));
}).listen(PORT, () => console.log(`Bloom API on http://localhost:${PORT}`));
