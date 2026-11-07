-- Categories inside the extra-page album ("Ținute"). The provider defines the
-- list in settings (stored as JSON on config, pushed with the rest of the
-- config) and assigns each item to one category from the editor. Items whose
-- category_id no longer matches a defined category are shown as uncategorised.

ALTER TABLE config ADD COLUMN extra_page_categories_json TEXT;
ALTER TABLE extra_page_items ADD COLUMN category_id TEXT;
