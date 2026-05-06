-- Per-account external link displayed as a CTA on the public /book/<slug> page.
ALTER TABLE config ADD COLUMN external_link_url     TEXT;
ALTER TABLE config ADD COLUMN external_link_label   TEXT;
ALTER TABLE config ADD COLUMN external_link_enabled INTEGER NOT NULL DEFAULT 0;
