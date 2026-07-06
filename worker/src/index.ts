import { neon } from '@neondatabase/serverless';

interface Env {
  DATABASE_URL: string;
  API_KEY: string;
  FICHA_RATE_LIMITER: RateLimit;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Password',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function error(msg: string, status = 400) {
  return json({ error: msg }, status);
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const { success } = await env.FICHA_RATE_LIMITER.limit({ key: ip });
    if (!success) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== env.API_KEY) {
      return error('Unauthorized', 401);
    }

    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);

    if (parts[0] !== 'api' || parts[1] !== 'characters') {
      return error('Not Found', 404);
    }

    const id = parts[2] || null;
    const sql = neon(env.DATABASE_URL);

    try {
      switch (request.method) {
        case 'GET': {
          if (id) {
            const rows = await sql`SELECT id, data, created_at, updated_at FROM characters WHERE id = ${id}`;
            if (!rows.length) return error('Not Found', 404);
            return json(rows[0]);
          }
          const rows = await sql`SELECT id, data->>'name' AS name, data->>'classe' AS classe, updated_at FROM characters ORDER BY updated_at DESC`;
          return json(rows);
        }

        case 'POST': {
          const body = await request.json() as { data: Record<string, unknown>; password: string };
          if (!body.data || !body.password) return error('Missing data or password');
          const id = crypto.randomUUID();
          const passwordHash = await hashPassword(body.password);
          await sql`INSERT INTO characters (id, data, password_hash) VALUES (${id}, ${JSON.stringify(body.data)}::jsonb, ${passwordHash})`;
          return json({ id }, 201);
        }

        case 'PUT': {
          if (!id) return error('ID required');
          const body = await request.json() as { data: Record<string, unknown>; password: string };
          if (!body.data || !body.password) return error('Missing data or password');
          const rows = await sql`SELECT password_hash FROM characters WHERE id = ${id}`;
          if (!rows.length) return error('Not Found', 404);
          const passwordHash = await hashPassword(body.password);
          if (passwordHash !== rows[0].password_hash) return error('Wrong password', 403);
          await sql`UPDATE characters SET data = ${JSON.stringify(body.data)}::jsonb, updated_at = NOW() WHERE id = ${id}`;
          return json({ ok: true });
        }

        case 'DELETE': {
          if (!id) return error('ID required');
          const body = await request.json() as { password: string };
          if (!body.password) return error('Password required');
          const rows = await sql`SELECT password_hash FROM characters WHERE id = ${id}`;
          if (!rows.length) return error('Not Found', 404);
          const passwordHash = await hashPassword(body.password);
          if (passwordHash !== rows[0].password_hash) return error('Wrong password', 403);
          await sql`DELETE FROM characters WHERE id = ${id}`;
          return json({ ok: true });
        }

        default:
          return error('Method not allowed', 405);
      }
    } catch (e: any) {
      return error(e.message || 'Internal Server Error', 500);
    }
  },
};
