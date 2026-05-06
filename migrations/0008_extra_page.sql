-- Phase 1 of the configurable extra page: a CTA button on /book/<slug> that
-- links to an internal sub-page rendered at /book/<slug>/page. Drops the
-- external-URL column from 0007 (the link is now always internal) and renames
-- the remaining columns so the field names match the new feature.

ALTER TABLE config DROP COLUMN external_link_url;
ALTER TABLE config RENAME COLUMN external_link_label   TO extra_page_title;
ALTER TABLE config RENAME COLUMN external_link_enabled TO extra_page_enabled;
