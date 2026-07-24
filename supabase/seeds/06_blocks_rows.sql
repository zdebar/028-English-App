-- Generated from seeds/remote_data.sql by scripts/extract-catalog-seeds.ps1.
-- Contains shared catalog data only.

INSERT INTO "public"."blocks" ("id", "name", "note", "grammar_chunk_id", "sort_order", "updated_at", "deleted_at", "show_in_topics", "is_removed_from_practice", "requires_initial_training") VALUES
	(2, 'být - základní tvary', NULL, 1, NULL, '2026-07-17 09:44:00.993319+00', NULL, false, false, true),
	(3, 'být - zkrácené tvary', NULL, 1, NULL, '2026-07-17 09:44:25.8369+00', NULL, false, false, true),
	(4, 'být - věty s přídavnýmí jmény #1', NULL, 2, NULL, '2026-07-17 09:44:56.249945+00', NULL, false, false, true),
	(5, 'být - věty s přídavnými jmény #2', NULL, 2, NULL, '2026-07-17 09:45:31.889596+00', NULL, false, false, true),
	(6, 'být - věty s přídavnými jmény #3', NULL, 2, NULL, '2026-07-17 09:46:10.209435+00', NULL, false, false, true),
	(7, 'slovíčka', NULL, NULL, NULL, '2026-07-17 09:57:54.738876+00', NULL, false, false, false),
	(1, 'osobní zájmena', NULL, NULL, NULL, '2026-07-15 08:53:02.826619+00', NULL, true, false, false);

SELECT pg_catalog.setval('public.blocks_id_seq', (SELECT MAX(id) FROM public.blocks), true);
