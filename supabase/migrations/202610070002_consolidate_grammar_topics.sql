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

DO $$
DECLARE
  v_other_topic_id INTEGER;
BEGIN
  INSERT INTO public.grammar_topics (name, sort_order, deleted_at)
  VALUES ('Ostatní', 1, NULL)
  ON CONFLICT (name) DO UPDATE
    SET sort_order = 1,
        deleted_at = NULL,
        updated_at = NOW();

  SELECT id
  INTO v_other_topic_id
  FROM public.grammar_topics
  WHERE name = 'Ostatní';

  WITH ranked_groups AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY id)::INTEGER AS new_sort_order
    FROM public.grammar_groups
  )
  UPDATE public.grammar_groups AS grammar_group
  SET grammar_topic_id = v_other_topic_id,
      sort_order = ranked_groups.new_sort_order,
      updated_at = NOW()
  FROM ranked_groups
  WHERE grammar_group.id = ranked_groups.id;

  DELETE FROM public.grammar_topics
  WHERE id <> v_other_topic_id;
END;
$$;

SELECT setval(
  'public.grammar_topics_id_seq',
  GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.grammar_topics), 1),
  TRUE
);

COMMIT;