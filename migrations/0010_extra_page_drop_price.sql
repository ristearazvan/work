-- Drop the price column from extra_page_items: phase-2 catalogue is text-only.
ALTER TABLE extra_page_items DROP COLUMN price;
