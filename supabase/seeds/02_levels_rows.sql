-- Generated from seeds/remote_data.sql by scripts/extract-catalog-seeds.ps1.
-- Contains shared catalog data only.

INSERT INTO "public"."levels" ("id", "name", "note", "sort_order", "updated_at", "deleted_at") VALUES
	(3, 'B1', 'Intermediate', 3, '2026-07-15 08:24:48.214302+00', NULL),
	(2, 'A2', 'Elementary', 2, '2026-07-15 08:25:04.033493+00', NULL),
	(4, 'B2', 'Upper-intermediate', 4, '2026-07-15 08:25:32.653513+00', NULL),
	(5, 'C1', 'Advanced', 5, '2026-07-15 08:25:48.936448+00', NULL),
	(6, 'C2', 'Proficient', 6, '2026-07-15 08:26:15.141799+00', NULL),
	(1, 'A1', 'Beginner', 1, '2026-07-17 12:17:16.034722+00', NULL);

SELECT pg_catalog.setval('public.levels_id_seq', (SELECT MAX(id) FROM public.levels), true);
