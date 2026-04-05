/**
 * ScoutRex Contact Worker
 *
 * Contact form routes (public):
 *   POST  /api/contact                — save a new contact message
 *
 * Messages routes (admin — requires Bearer token):
 *   GET   /api/messages               — list all messages
 *   PATCH /api/messages/:id           — update status
 *   POST  /api/messages/:id/reply     — save reply text + mark replied
 *
 * Team routes:
 *   GET   /api/team                   — public: list visible team members
 *   POST  /api/team                   — admin: create team member
 *   PATCH /api/team/:id               — admin: update team member
 *   DELETE /api/team/:id              — admin: delete team member
 *   PATCH /api/team/reorder           — admin: update display_order for multiple
 *
 * Authentication:
 *   Admin routes require  Authorization: Bearer <ADMIN_API_KEY>
 *   Set via:  npx wrangler secret put ADMIN_API_KEY
 */

const CORS_ORIGIN = 'https://scoutrex.com';

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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
    const url    = new URL(request.url);
    const origin = request.headers.get('Origin') || CORS_ORIGIN;
    const path   = url.pathname;
    const method = request.method;

    // ── Preflight ──────────────────────────────────────────────────────────
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    // ══════════════════════════════════════════════════════════════════════
    //  CONTACT MESSAGES
    // ══════════════════════════════════════════════════════════════════════

    // POST /api/contact
    if (method === 'POST' && path === '/api/contact') {
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }

      const { name, email, subject, message } = body;
      if (!name || !email || !message) {
        return json({ error: 'Missing required fields: name, email, message' }, 422, origin);
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: 'Invalid email address' }, 422, origin);
      }

      await env.DB.prepare(
        `INSERT INTO messages (name, email, subject, message, status, created_at)
         VALUES (?, ?, ?, ?, 'unread', datetime('now'))`
      ).bind(name, email, subject || 'general', message).run();

      return json({ success: true, message: 'Message received. We will be in touch soon.' }, 201, origin);
    }

    // GET /api/messages
    if (method === 'GET' && path === '/api/messages') {
      if (!isAdmin(request, env)) return unauthorized(origin);
      const { results } = await env.DB.prepare(
        `SELECT id, name, email, subject, message, status, created_at, reply_text, replied_at
         FROM messages ORDER BY created_at DESC LIMIT 200`
      ).all();
      return json({ messages: results || [] }, 200, origin);
    }

    // PATCH /api/messages/:id
    const msgPatch = path.match(/^\/api\/messages\/(\d+)$/);
    if (method === 'PATCH' && msgPatch) {
      if (!isAdmin(request, env)) return unauthorized(origin);
      const id = msgPatch[1];
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }
      const allowed = ['unread', 'read', 'replied', 'archived'];
      if (!body.status || !allowed.includes(body.status)) {
        return json({ error: `status must be one of: ${allowed.join(', ')}` }, 422, origin);
      }
      await env.DB.prepare(`UPDATE messages SET status = ? WHERE id = ?`).bind(body.status, id).run();
      return json({ success: true }, 200, origin);
    }

    // POST /api/messages/:id/reply
    const msgReply = path.match(/^\/api\/messages\/(\d+)\/reply$/);
    if (method === 'POST' && msgReply) {
      if (!isAdmin(request, env)) return unauthorized(origin);
      const id = msgReply[1];
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }
      if (!body.reply_text) return json({ error: 'reply_text is required' }, 422, origin);
      await env.DB.prepare(
        `UPDATE messages SET status = 'replied', reply_text = ?, replied_at = datetime('now') WHERE id = ?`
      ).bind(body.reply_text, id).run();
      return json({ success: true }, 200, origin);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  TEAM MEMBERS
    // ══════════════════════════════════════════════════════════════════════

    // GET /api/team  — public
    if (method === 'GET' && path === '/api/team') {
      const adminReq = isAdmin(request, env);
      // Admins see all members; public sees only visible ones
      const query = adminReq
        ? `SELECT * FROM team_members ORDER BY display_order ASC, id ASC`
        : `SELECT * FROM team_members WHERE visible = 1 ORDER BY display_order ASC, id ASC`;
      const { results } = await env.DB.prepare(query).all();
      return json({ team: results || [] }, 200, origin);
    }

    // POST /api/team  — admin: create
    if (method === 'POST' && path === '/api/team') {
      if (!isAdmin(request, env)) return unauthorized(origin);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }

      const { name, role, department, email, linkedin, photo, display_order, visible } = body;
      if (!name || !role) return json({ error: 'name and role are required' }, 422, origin);

      const result = await env.DB.prepare(
        `INSERT INTO team_members (name, role, department, email, linkedin, photo, display_order, visible, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).bind(
        name, role,
        department || '',
        email      || '',
        linkedin   || '',
        photo      || '',
        display_order ?? 99,
        visible === false ? 0 : 1
      ).run();

      return json({ success: true, id: result.meta.last_row_id }, 201, origin);
    }

    // PATCH /api/team/:id  — admin: update
    const teamPatch = path.match(/^\/api\/team\/(\d+)$/);
    if (method === 'PATCH' && teamPatch) {
      if (!isAdmin(request, env)) return unauthorized(origin);
      const id = teamPatch[1];
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }

      const fields = ['name','role','department','email','linkedin','photo','display_order','visible'];
      const sets   = [];
      const vals   = [];
      for (const f of fields) {
        if (body[f] !== undefined) {
          sets.push(`${f} = ?`);
          vals.push(f === 'visible' ? (body[f] ? 1 : 0) : body[f]);
        }
      }
      if (sets.length === 0) return json({ error: 'No fields to update' }, 422, origin);
      vals.push(id);
      await env.DB.prepare(`UPDATE team_members SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
      return json({ success: true }, 200, origin);
    }

    // DELETE /api/team/:id  — admin: delete
    const teamDelete = path.match(/^\/api\/team\/(\d+)$/);
    if (method === 'DELETE' && teamDelete) {
      if (!isAdmin(request, env)) return unauthorized(origin);
      const id = teamDelete[1];
      await env.DB.prepare(`DELETE FROM team_members WHERE id = ?`).bind(id).run();
      return json({ success: true }, 200, origin);
    }

    return json({ error: 'Not found' }, 404, origin);
  },
};
