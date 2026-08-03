CREATE TABLE public.grammar_chunk_examples (
  grammar_chunk_id INTEGER NOT NULL
    REFERENCES public.grammar_chunks(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (grammar_chunk_id, item_id),
  CONSTRAINT grammar_chunk_examples_chunk_sort_order_key
    UNIQUE (grammar_chunk_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_grammar_chunk_examples_item_id
  ON public.grammar_chunk_examples (item_id);

CREATE TRIGGER trg_set_updated_at__grammar_chunk_examples
BEFORE UPDATE ON public.grammar_chunk_examples
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL PRIVILEGES ON TABLE public.grammar_chunk_examples
FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.grammar_chunk_examples TO authenticated;

ALTER TABLE public.grammar_chunk_examples ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalog_select_authenticated ON public.grammar_chunk_examples
  FOR SELECT TO authenticated
  USING (TRUE);
