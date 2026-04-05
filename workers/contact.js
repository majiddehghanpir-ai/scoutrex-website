/**
 * ScoutRex Contact Worker
 * Handles contact form submissions and serves messages to the admin panel.
 *
 * Routes:
 *   POST  /api/contact           — public: save a new message
 *   GET   /api/messages          — admin: list all messages
 *   PATCH /api/messages/:id      — admin: update status (read/replied/archived)
 *   POST  /api/messages/:id/reply — admin: save reply text + mark replied
 *
 * Authentication:
 *   Admin routes require  Authorization: Bearer <ADMIN_API_KEY>
 *   ADMIN_API_KEY is set as a Cloudflare Worker secret via wrangler.
 */

const CORS_ORIGIN = 'https://scoutrex.com';

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data, status = 200, origin = CORS_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(origin) },
  });
}

function unauthorized(origin) {
  return json({ error: 'Unauthorized' }, 401, origin);
}

function isAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  return auth === `Bearer ${env.ADMIN_API_KEY}`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || CORS_ORIGIN;
    const path = url.pathname;

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    // ── POST /api/contact ──────────────────────────────────────────────────
    if (request.method === 'POST' && path === '/api/contact') {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Invalid JSON' }, 400, origin);
      }

      const { name, email, subject, message } = body;

      if (!name || !email || !message) {
        return json({ error: 'Missing required fields: name, email, message' }, 422, origin);
      }

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: 'Invalid email address' }, 422, origin);
      }

      await env.DB.prepare(
        `INSERT INTO messages (name, email, subject, message, status, created_at)
         VALUES (?, ?, ?, ?, 'unread', datetime('now'))`
      ).bind(name, email, subject || 'general', message).run();

      return json({ success: true, message: 'Message received. We will be in touch soon.' }, 201, origin);
    }

    // ── GET /api/messages ──────────────────────────────────────────────────
    if (request.method === 'GET' && path === '/api/messages') {
      if (!isAdmin(request, env)) return unauthorized(origin);

      const { results } = await env.DB.prepare(
        `SELECT id, name, email, subject, message, status, created_at, reply_text, replied_at
         FROM messages ORDER BY created_at DESC LIMIT 200`
      ).all();

      return json({ messages: results || [] }, 200, origin);
    }

    // ── PATCH /api/messages/:id ────────────────────────────────────────────
    const patchMatch = path.match(/^\/api\/messages\/(\d+)$/);
    if (request.method === 'PATCH' && patchMatch) {
      if (!isAdmin(request, env)) return unauthorized(origin);

      const id = patchMatch[1];
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }

      const allowed = ['unread', 'read', 'replied', 'archived'];
      if (!body.status || !allowed.includes(body.status)) {
        return json({ error: `status must be one of: ${allowed.join(', ')}` }, 422, origin);
      }

      await env.DB.prepare(
        `UPDATE messages SET status = ? WHERE id = ?`
      ).bind(body.status, id).run();

      return json({ success: true }, 200, origin);
    }

    // ── POST /api/messages/:id/reply ───────────────────────────────────────
    const replyMatch = path.match(/^\/api\/messages\/(\d+)\/reply$/);
    if (request.method === 'POST' && replyMatch) {
      if (!isAdmin(request, env)) return unauthorized(origin);

      const id = replyMatch[1];
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }

      if (!body.reply_text) return json({ error: 'reply_text is required' }, 422, origin);

      await env.DB.prepare(
        `UPDATE messages SET status = 'replied', reply_text = ?, replied_at = datetime('now') WHERE id = ?`
      ).bind(body.reply_text, id).run();

      return json({ success: true }, 200, origin);
    }

    return json({ error: 'Not found' }, 404, origin);
  },
};
