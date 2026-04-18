-- ScoutRex D1 schema
-- Run once:  npx wrangler d1 execute scoutrex-messages --file=workers/schema.sql

-- ── Contact messages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  name        TEXT     NOT NULL,
  email       TEXT     NOT NULL,
  subject     TEXT     NOT NULL DEFAULT 'general',
  message     TEXT     NOT NULL,
  status      TEXT     NOT NULL DEFAULT 'unread',   -- unread | read | replied | archived
  reply_text  TEXT,
  replied_at  DATETIME,
  created_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_status     ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ── Team members ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id            INTEGER  PRIMARY KEY AUTOINCREMENT,
  name          TEXT     NOT NULL,
  role          TEXT     NOT NULL,
  department    TEXT     NOT NULL DEFAULT '',
  email         TEXT     NOT NULL DEFAULT '',
  linkedin      TEXT     NOT NULL DEFAULT '',
  photo         TEXT     NOT NULL DEFAULT '',   -- filename (e.g. majid.jpg) or full URL
  display_order INTEGER  NOT NULL DEFAULT 99,
  visible       INTEGER  NOT NULL DEFAULT 1,    -- 1 = shown on team page, 0 = hidden
  created_at    DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_team_order ON team_members(display_order ASC);

-- ── CMS content overrides ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_overrides (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  page        TEXT     NOT NULL,
  selector    TEXT     NOT NULL,
  idx         INTEGER  NOT NULL DEFAULT 0,
  value       TEXT     NOT NULL,
  updated_at  DATETIME NOT NULL DEFAULT (datetime('now')),
  UNIQUE(page, selector, idx)
);

CREATE INDEX IF NOT EXISTS idx_content_page ON content_overrides(page);

-- ── Job listings ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_listings (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  title       TEXT     NOT NULL,
  company     TEXT     NOT NULL DEFAULT '',
  location    TEXT     NOT NULL DEFAULT '',
  department  TEXT     NOT NULL DEFAULT '',
  type        TEXT     NOT NULL DEFAULT 'Full-time',
  salary      TEXT     NOT NULL DEFAULT '',
  description TEXT     NOT NULL DEFAULT '',
  deadline    TEXT     NOT NULL DEFAULT '',
  status      TEXT     NOT NULL DEFAULT 'active',  -- active | draft | closed
  created_at  DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_listings(status);

-- ── Pricing plans ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_plans (
  id            INTEGER  PRIMARY KEY AUTOINCREMENT,
  name          TEXT     NOT NULL,
  price         TEXT     NOT NULL DEFAULT '',
  billing       TEXT     NOT NULL DEFAULT 'month',  -- month | year | ''
  currency      TEXT     NOT NULL DEFAULT 'EUR',
  description   TEXT     NOT NULL DEFAULT '',
  features      TEXT     NOT NULL DEFAULT '',       -- newline-separated list
  product       TEXT     NOT NULL DEFAULT 'hirerex', -- hirerex | jobrex
  popular       INTEGER  NOT NULL DEFAULT 0,
  visible       INTEGER  NOT NULL DEFAULT 1,
  display_order INTEGER  NOT NULL DEFAULT 99,
  created_at    DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at    DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_plans_product ON pricing_plans(product);

-- ── Seed: real team members ───────────────────────────────────────────────────
-- Run this only once after creating the table (skip if already seeded).
INSERT OR IGNORE INTO team_members (id, name, role, department, email, linkedin, photo, display_order, visible)
VALUES
  (1, 'Majid Dehghanpir', 'CEO & Co-Founder',
      'Leadership · AI Research',
      'majid.dehghanpir@scoutrex.com',
      'https://www.linkedin.com/in/majid-dehghanpir/',
      'majid.jpg', 1, 1),
  (2, 'Hamed Markazi', 'CTO & Co-Founder',
      'Engineering · Product',
      'hamed.markazi@scoutrex.com',
      'https://www.linkedin.com/in/hamed-markazi-62214410/',
      'hamed.jpg', 2, 1),
  (3, 'Shadi Moghaddam', 'Marketing',
      'Marketing',
      'shadi.moghaddam@scoutrex.com',
      'https://www.linkedin.com/in/shadi-moghaddam-1a9325258/',
      'Shadi.jpg', 3, 1);
