-- ScoutRex contact messages table
-- Run once against your D1 database:
--   npx wrangler d1 execute scoutrex-messages --file=workers/schema.sql

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
