-- Per-account background image for the public /book/<slug> page.
-- Bytes live in R2 under the stored key; these columns are metadata only.

ALTER TABLE config ADD COLUMN background_r2_key    TEXT;
ALTER TABLE config ADD COLUMN background_mime_type TEXT;
ALTER TABLE config ADD COLUMN background_size      INTEGER;
ALTER TABLE config ADD COLUMN background_updated_at INTEGER;
