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

CREATE TABLE IF NOT EXISTS daily_notes (
  date        DATE PRIMARY KEY,
  phase       TEXT,
  ai_line     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  JSONB NOT NULL
);
`;
