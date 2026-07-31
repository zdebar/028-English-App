ALTER TABLE public.pronunciation_groups
  ALTER COLUMN note DROP NOT NULL,
  ALTER COLUMN note DROP DEFAULT;
