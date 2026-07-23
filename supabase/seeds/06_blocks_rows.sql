-- Generated from seeds/remote_data.sql by scripts/extract-catalog-seeds.ps1.
-- Contains shared catalog data only.

INSERT INTO "public"."blocks" ("id", "name", "note", "lesson_id", "grammar_chunk_id", "sort_order", "updated_at", "deleted_at", "show_in_topics", "is_practice_block", "requires_initial_training") VALUES
	(2, 'být - základní tvary', NULL, 1, 1, 2, '2026-07-17 09:44:00.993319+00', NULL, false, true, true),
	(3, 'být - zkrácené tvary', NULL, 1, 1, 3, '2026-07-17 09:44:25.8369+00', NULL, false, true, true),
	(4, 'být - věty s přídavnýmí jmény #1', NULL, 1, 2, 4, '2026-07-17 09:44:56.249945+00', NULL, false, true, true),
	(5, 'být - věty s přídavnými jmény #2', NULL, 1, 2, 5, '2026-07-17 09:45:31.889596+00', NULL, false, true, true),
	(6, 'být - věty s přídavnými jmény #3', NULL, 1, 2, 6, '2026-07-17 09:46:10.209435+00', NULL, false, true, true),
	(7, 'slovíčka', NULL, 1, NULL, 7, '2026-07-17 09:57:54.738876+00', NULL, false, true, false),
	(1, 'osobní zájmena', NULL, 1, NULL, 1, '2026-07-15 08:53:02.826619+00', NULL, true, true, false);

SELECT pg_catalog.setval('public.blocks_id_seq', (SELECT MAX(id) FROM public.blocks), true);
