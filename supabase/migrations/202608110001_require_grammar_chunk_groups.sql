ALTER TABLE public.grammar_chunks
  DROP CONSTRAINT IF EXISTS grammar_name_key,
  DROP CONSTRAINT IF EXISTS grammar_chunks_name_key,
  DROP CONSTRAINT IF EXISTS grammar_chunks_group_name_key,
  DROP CONSTRAINT IF EXISTS grammar_chunks_sort_order_key,
  DROP CONSTRAINT IF EXISTS grammar_chunks_grammar_group_id_fkey;

ALTER TABLE public.grammar_chunks
  ALTER COLUMN grammar_group_id SET NOT NULL,
  ADD CONSTRAINT grammar_chunks_grammar_group_id_fkey
    FOREIGN KEY (grammar_group_id)
    REFERENCES public.grammar_groups(id)
    ON DELETE RESTRICT,
  ADD CONSTRAINT grammar_chunks_group_name_key
    UNIQUE (grammar_group_id, name),
  ADD CONSTRAINT grammar_chunks_sort_order_key
    UNIQUE (grammar_group_id, sort_order)
    DEFERRABLE INITIALLY DEFERRED;

DROP INDEX IF EXISTS public.idx_grammar_chunks_group_id;
