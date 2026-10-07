BEGIN;

CREATE TABLE IF NOT EXISTS public.grammar_topics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT grammar_topics_sort_order_key
    UNIQUE (sort_order) DEFERRABLE INITIALLY DEFERRED
);

INSERT INTO public.grammar_topics (id, name, sort_order)
VALUES
  (1, 'Present Simple', 1),
  (2, 'Množné číslo', 2),
  (3, 'Přivlastňování', 3),
  (4, 'Členy', 4),
  (5, 'Čísla', 5),
  (6, 'Časy a datumy', 6),
  (7, 'Předložky času', 7),
  (8, 'Předložky místa', 8)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.grammar_groups
  ADD COLUMN IF NOT EXISTS grammar_topic_id INTEGER;

UPDATE public.grammar_groups
SET grammar_topic_id = CASE
  WHEN id IN (1, 2, 3, 4, 12) THEN 1
  WHEN id = 5 THEN 2
  WHEN id = 6 THEN 3
  WHEN id = 7 THEN 4
  WHEN id = 8 THEN 5
  WHEN id = 9 THEN 6
  WHEN id = 10 THEN 7
  WHEN id = 11 THEN 8
  ELSE 1
END,
updated_at = NOW()
WHERE grammar_topic_id IS NULL;

ALTER TABLE public.grammar_groups
  DROP CONSTRAINT IF EXISTS grammar_groups_name_key,
  DROP CONSTRAINT IF EXISTS grammar_groups_sort_order_key,
  ALTER COLUMN grammar_topic_id SET NOT NULL,
  ADD CONSTRAINT grammar_groups_grammar_topic_id_fkey
    FOREIGN KEY (grammar_topic_id)
    REFERENCES public.grammar_topics(id)
    ON DELETE RESTRICT,
  ADD CONSTRAINT grammar_groups_topic_name_key
    UNIQUE (grammar_topic_id, name),
  ADD CONSTRAINT grammar_groups_topic_sort_order_key
    UNIQUE (grammar_topic_id, sort_order)
    DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX IF NOT EXISTS idx_grammar_groups_topic_id
  ON public.grammar_groups (grammar_topic_id, sort_order);

SELECT setval(
  'public.grammar_topics_id_seq',
  GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.grammar_topics), 1),
  TRUE
);

DROP TRIGGER IF EXISTS trg_set_updated_at__grammar_topics ON public.grammar_topics;
CREATE TRIGGER trg_set_updated_at__grammar_topics
BEFORE UPDATE ON public.grammar_topics
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL PRIVILEGES ON TABLE public.grammar_topics FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.grammar_topics TO authenticated;
ALTER TABLE public.grammar_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.grammar_topics;
CREATE POLICY catalog_select_authenticated ON public.grammar_topics
  FOR SELECT TO authenticated
  USING (TRUE);

COMMIT;