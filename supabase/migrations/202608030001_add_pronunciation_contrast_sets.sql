ALTER TABLE public.pronunciation_group_items
  ADD COLUMN contrast_set INTEGER CHECK (contrast_set >= 1);

CREATE INDEX idx_pronunciation_group_items_group_contrast_sort
  ON public.pronunciation_group_items (pronunciation_group_id, contrast_set, sort_order);

-- Existing memberships intentionally remain NULL. Contrast sets are semantic
-- catalog data and must be assigned explicitly rather than inferred from order.
