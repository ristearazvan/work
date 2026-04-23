-- Agenda — split public page visibility from booking acceptance.
-- public_enabled  : profile page is live at all
-- bookings_enabled: page accepts appointment requests (default on)

ALTER TABLE config ADD COLUMN bookings_enabled INTEGER NOT NULL DEFAULT 1;
