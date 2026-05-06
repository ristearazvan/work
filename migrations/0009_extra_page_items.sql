-- Phase 2 of the configurable extra page: a catalogue of items rendered on
-- /book/<slug>/page. Each item carries an image stored in R2 alongside a
-- price (RON, integer) and free-text note.

CREATE TABLE IF NOT EXISTS extra_page_items (
  id            TEXT    PRIMARY KEY,
  account_id    TEXT    NOT NULL REFERENCES accounts(id),
  r2_key        TEXT    NOT NULL,
  mime_type     TEXT    NOT NULL,
  size_bytes    INTEGER NOT NULL,
  price         INTEGER NOT NULL DEFAULT 0,
  note          TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  uploaded_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_extra_page_items_account_order
  ON extra_page_items(account_id, display_order);
