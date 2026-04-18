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

      // Fetch the original message so we have the contact's name, email, and subject
      const msg = await env.DB.prepare(
        `SELECT name, email, subject FROM messages WHERE id = ?`
      ).bind(id).first();

      if (!msg) return json({ error: 'Message not found' }, 404, origin);

      // Save reply to DB
      await env.DB.prepare(
        `UPDATE messages SET status = 'replied', reply_text = ?, replied_at = datetime('now') WHERE id = ?`
      ).bind(body.reply_text, id).run();

      // Send email via Resend (if API key is configured)
      let emailSent = false;
      if (env.RESEND_API_KEY) {
        const subjectLine = `Re: ${msg.subject === 'general' ? 'Your enquiry' : msg.subject} — ScoutRex`;
        const replyHtml = `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;color:#1E1256">
            <div style="background:linear-gradient(135deg,#1E1256,#3D2CAE);padding:32px 40px;border-radius:12px 12px 0 0">
              <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">ScoutRex</h1>
            </div>
            <div style="background:#fff;padding:32px 40px;border:1px solid #e5e7eb;border-top:none">
              <p style="margin:0 0 16px;font-size:16px">Hi ${msg.name},</p>
              <div style="white-space:pre-wrap;font-size:15px;line-height:1.7;color:#374151">${body.reply_text}</div>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>
              <p style="font-size:13px;color:#6b7280;margin:0">
                ScoutRex · <a href="https://www.scoutrex.com" style="color:#3D2CAE">www.scoutrex.com</a>
              </p>
            </div>
          </div>`;

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ScoutRex <contact@scoutrex.com>',
            to:   [msg.email],
            subject: subjectLine,
            html: replyHtml,
            reply_to: 'contact@scoutrex.com',
          }),
        });
        emailSent = resendRes.ok;
      }

      return json({ success: true, email_sent: emailSent }, 200, origin);
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

    // ══════════════════════════════════════════════════════════════════════
    //  CMS CONTENT OVERRIDES
    // ══════════════════════════════════════════════════════════════════════

    // GET /api/content?page=xxx  — public: fetch all overrides for a page
    if (method === 'GET' && path === '/api/content') {
      const page = url.searchParams.get('page');
      if (!page) return json({ error: 'page param required' }, 400, origin);
      const { results } = await env.DB.prepare(
        `SELECT id, selector, idx, value, updated_at FROM content_overrides WHERE page = ? ORDER BY id ASC`
      ).bind(page).all();
      return json({ content: results || [] }, 200, origin);
    }

    // PUT /api/content  — admin: upsert array of changes for a page
    if (method === 'PUT' && path === '/api/content') {
      if (!isAdmin(request, env)) return unauthorized(origin);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }
      const { page, changes } = body;
      if (!page || !Array.isArray(changes)) return json({ error: 'page and changes[] required' }, 422, origin);
      for (const c of changes) {
        const { selector, idx = 0, value } = c;
        if (!selector || value == null) continue;
        await env.DB.prepare(
          `INSERT INTO content_overrides (page, selector, idx, value, updated_at)
           VALUES (?, ?, ?, ?, datetime('now'))
           ON CONFLICT(page, selector, idx) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
        ).bind(page, selector, idx, value).run();
      }
      return json({ success: true, saved: changes.length }, 200, origin);
    }

    // DELETE /api/content  — admin: remove a specific override or all overrides for a page
    if (method === 'DELETE' && path === '/api/content') {
      if (!isAdmin(request, env)) return unauthorized(origin);
      const page = url.searchParams.get('page');
      const id   = url.searchParams.get('id');
      if (!page) return json({ error: 'page param required' }, 400, origin);
      if (id) {
        await env.DB.prepare(`DELETE FROM content_overrides WHERE id = ? AND page = ?`).bind(id, page).run();
      } else {
        await env.DB.prepare(`DELETE FROM content_overrides WHERE page = ?`).bind(page).run();
      }
      return json({ success: true }, 200, origin);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  JOB LISTINGS
    // ══════════════════════════════════════════════════════════════════════

    // GET /api/jobs  — public: active; admin: all
    if (method === 'GET' && path === '/api/jobs') {
      const admin = isAdmin(request, env);
      const { results } = await env.DB.prepare(
        admin
          ? `SELECT * FROM job_listings ORDER BY created_at DESC LIMIT 200`
          : `SELECT * FROM job_listings WHERE status = 'active' ORDER BY created_at DESC`
      ).all();
      return json({ jobs: results || [] }, 200, origin);
    }

    // POST /api/jobs  — admin: create
    if (method === 'POST' && path === '/api/jobs') {
      if (!isAdmin(request, env)) return unauthorized(origin);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }
      const { title, company = '', location = '', department = '', type = 'Full-time', salary = '', description = '', deadline = '', status = 'active' } = body;
      if (!title) return json({ error: 'title required' }, 422, origin);
      const { meta } = await env.DB.prepare(
        `INSERT INTO job_listings (title, company, location, department, type, salary, description, deadline, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(title, company, location, department, type, salary, description, deadline, status).run();
      return json({ success: true, id: meta.last_row_id }, 201, origin);
    }

    // PATCH /api/jobs/:id  — admin: update
    const jobPatch = path.match(/^\/api\/jobs\/(\d+)$/);
    if (jobPatch) {
      if (method === 'PATCH') {
        if (!isAdmin(request, env)) return unauthorized(origin);
        const id = jobPatch[1];
        let body;
        try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }
        const allowed = ['title','company','location','department','type','salary','description','deadline','status'];
        const sets = []; const vals = [];
        for (const k of allowed) { if (body[k] !== undefined) { sets.push(`${k} = ?`); vals.push(body[k]); } }
        sets.push(`updated_at = datetime('now')`);
        if (vals.length === 0) return json({ error: 'No fields to update' }, 422, origin);
        vals.push(id);
        await env.DB.prepare(`UPDATE job_listings SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
        return json({ success: true }, 200, origin);
      }
      if (method === 'DELETE') {
        if (!isAdmin(request, env)) return unauthorized(origin);
        const id = jobPatch[1];
        await env.DB.prepare(`DELETE FROM job_listings WHERE id = ?`).bind(id).run();
        return json({ success: true }, 200, origin);
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  PRICING PLANS
    // ══════════════════════════════════════════════════════════════════════

    // GET /api/plans  — public: visible; admin: all
    if (method === 'GET' && path === '/api/plans') {
      const admin = isAdmin(request, env);
      const { results } = await env.DB.prepare(
        admin
          ? `SELECT * FROM pricing_plans ORDER BY display_order ASC, id ASC`
          : `SELECT * FROM pricing_plans WHERE visible = 1 ORDER BY display_order ASC, id ASC`
      ).all();
      return json({ plans: results || [] }, 200, origin);
    }

    // POST /api/plans  — admin: create
    if (method === 'POST' && path === '/api/plans') {
      if (!isAdmin(request, env)) return unauthorized(origin);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }
      const { name, price = '', billing = 'month', currency = 'EUR', description = '', features = '', product = 'hirerex', popular = 0, visible = 1 } = body;
      if (!name) return json({ error: 'name required' }, 422, origin);
      const { meta } = await env.DB.prepare(
        `INSERT INTO pricing_plans (name, price, billing, currency, description, features, product, popular, visible)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(name, price, billing, currency, description, features, product, popular ? 1 : 0, visible ? 1 : 0).run();
      return json({ success: true, id: meta.last_row_id }, 201, origin);
    }

    // PATCH /api/plans/:id  — admin: update
    const planPatch = path.match(/^\/api\/plans\/(\d+)$/);
    if (planPatch) {
      if (method === 'PATCH') {
        if (!isAdmin(request, env)) return unauthorized(origin);
        const id = planPatch[1];
        let body;
        try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }
        const allowed = ['name','price','billing','currency','description','features','product','popular','visible','display_order'];
        const sets = []; const vals = [];
        for (const k of allowed) { if (body[k] !== undefined) { sets.push(`${k} = ?`); vals.push(body[k]); } }
        sets.push(`updated_at = datetime('now')`);
        if (vals.length === 0) return json({ error: 'No fields to update' }, 422, origin);
        vals.push(id);
        await env.DB.prepare(`UPDATE pricing_plans SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
        return json({ success: true }, 200, origin);
      }
      if (method === 'DELETE') {
        if (!isAdmin(request, env)) return unauthorized(origin);
        const id = planPatch[1];
        await env.DB.prepare(`DELETE FROM pricing_plans WHERE id = ?`).bind(id).run();
        return json({ success: true }, 200, origin);
      }
    }

    return json({ error: 'Not found' }, 404, origin);
  },
};
