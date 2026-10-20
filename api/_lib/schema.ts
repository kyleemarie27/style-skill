// Applied automatically on first API call, so there is no manual database setup step.
export const SCHEMA = `
-- Bloom schema. Applied automatically on first API call (see api/_lib/db.ts); kept here for reference.
CREATE TABLE IF NOT EXISTS import_batches (
  id          SERIAL PRIMARY KEY,
  source      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  counts      JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS day_logs (
  date            DATE PRIMARY KEY,
  flow            TEXT CHECK (flow IN ('none','spotting','light','medium','heavy')),
  intercourse     BOOLEAN,
  symptoms        TEXT[],
  mood            TEXT,
  cervical_mucus  TEXT CHECK (cervical_mucus IN ('dry','sticky','creamy','watery','egg_white')),
  bbt             NUMERIC(5,2),
  pregnancy_test  TEXT CHECK (pregnancy_test IN ('negative','positive','faint')),
  notes           TEXT,
  source          TEXT NOT NULL DEFAULT 'manual',
  batch_id        INTEGER REFERENCES import_batches(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lh_tests (
  id          SERIAL PRIMARY KEY,
  date        DATE NOT NULL,
  taken_at    TEXT,
  ratio       NUMERIC(4,2),
  level       TEXT NOT NULL CHECK (level IN ('low','high','peak')),
  ai_ratio    NUMERIC(4,2),
  ai_level    TEXT,
  photo       BYTEA,
  source      TEXT NOT NULL DEFAULT 'manual',
  batch_id    INTEGER REFERENCES import_batches(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lh_tests_date ON lh_tests(date);

-- Added later: a day an app (e.g. Premom) or the user marked as confirmed ovulation.
ALTER TABLE day_logs ADD COLUMN IF NOT EXISTS ovulation BOOLEAN;

-- Added for pregnancy mode: nausea, bleeding, blood pressure and the rest, as one JSON object.
ALTER TABLE day_logs ADD COLUMN IF NOT EXISTS preg JSONB;

CREATE TABLE IF NOT EXISTS daily_notes (
  date        DATE PRIMARY KEY,
  phase       TEXT,
  ai_line     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Added for pregnancy mode: the daily deep-dive article, written once per day.
CREATE TABLE IF NOT EXISTS deep_dives (
  date        DATE PRIMARY KEY,
  key         TEXT,
  content     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Added for keepsakes: answers to the daily question, and one bump photo per pregnancy week.
-- preg is the pregnancy's positive-test date, so a later pregnancy starts with a fresh album.
CREATE TABLE IF NOT EXISTS journal (
  date        DATE PRIMARY KEY,
  prompt      TEXT NOT NULL,
  answer      TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bump_photos (
  preg        DATE NOT NULL,
  week        INTEGER NOT NULL,
  date        DATE NOT NULL,
  photo       BYTEA NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (preg, week)
);

-- Added with separate logins: the partner writes their own answers. Each person has one answer per day.
ALTER TABLE journal ADD COLUMN IF NOT EXISTS author TEXT NOT NULL DEFAULT 'me';
ALTER TABLE journal DROP CONSTRAINT IF EXISTS journal_pkey;
CREATE UNIQUE INDEX IF NOT EXISTS journal_date_author ON journal(date, author);

-- Logins. role is 'me' or 'partner'; hash is scrypt. Without a 'me' row, APP_PASSWORD works as hers.
CREATE TABLE IF NOT EXISTS accounts (
  role        TEXT PRIMARY KEY CHECK (role IN ('me','partner')),
  hash        TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per signed-in device. id_hash is a SHA-256 of the cookie, so a database leak can't be replayed.
CREATE TABLE IF NOT EXISTS sessions (
  id_hash     TEXT PRIMARY KEY,
  role        TEXT NOT NULL,
  label       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);

-- Wrong passwords, to pause logins after too many guesses.
CREATE TABLE IF NOT EXISTS login_attempts (
  ip  TEXT NOT NULL,
  at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_at ON login_attempts(at);

CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  JSONB NOT NULL
);
`;
