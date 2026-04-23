-- Agenda — public page title + per-service pricing/durations.
-- page_title:          custom h1 shown on /book/<slug> (null → "Program")
-- service_prices_json: enriched per-service config
--   timed: { flat: false, rows: [{ duration, price }, ...] }
--   flat:  { flat: true,  duration, price }

ALTER TABLE config ADD COLUMN page_title TEXT;
ALTER TABLE config ADD COLUMN service_prices_json TEXT;
