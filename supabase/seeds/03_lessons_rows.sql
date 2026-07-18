-- Generated from seeds/remote_data.sql by scripts/extract-catalog-seeds.ps1.
-- Contains shared catalog data only.

INSERT INTO "public"."lessons" ("id", "name", "note", "level_id", "sort_order", "updated_at", "deleted_at") VALUES
	(2, 'být - zápor', NULL, 1, 2, '2026-07-17 09:10:00.865519+00', NULL),
	(3, 'být - otázky ano/ne', NULL, 1, 3, '2026-07-17 09:10:00.865519+00', NULL),
	(4, 'být - otázky s tázacím zájmenem', NULL, 1, 4, '2026-07-17 09:10:00.865519+00', NULL),
	(5, 'množné číslo', NULL, 1, 5, '2026-07-17 09:10:00.865519+00', NULL),
	(6, 'přivlastňování', NULL, 1, 6, '2026-07-17 09:10:00.865519+00', NULL),
	(7, 'členy', NULL, 1, 7, '2026-07-17 09:10:00.865519+00', NULL),
	(8, 'čísla', NULL, 1, 8, '2026-07-17 09:10:00.865519+00', NULL),
	(9, 'čas a datumy', NULL, 1, 9, '2026-07-17 09:10:00.865519+00', NULL),
	(10, 'předložky čas in, on, at', NULL, 1, 10, '2026-07-17 09:10:00.865519+00', NULL),
	(11, 'předložky místa, in, on, at', NULL, 1, 11, '2026-07-17 09:10:00.865519+00', NULL),
	(12, 'přítomný čas prostý', NULL, 1, 12, '2026-07-17 09:10:00.865519+00', NULL),
	(13, 'přítomný čas prostý - zápor', NULL, 1, 13, '2026-07-17 09:10:00.865519+00', NULL),
	(14, 'pravidlo jednoho záporu', NULL, 1, 14, '2026-07-17 09:10:00.865519+00', NULL),
	(15, 'zvratná zájmena', NULL, 1, 15, '2026-07-17 09:10:00.865519+00', NULL),
	(16, 'zájmena v předmětu', NULL, 1, 16, '2026-07-17 09:10:00.865519+00', NULL),
	(1, 'být', NULL, 1, 1, '2026-07-17 09:10:00.865519+00', NULL);

SELECT pg_catalog.setval('public.lessons_id_seq', (SELECT MAX(id) FROM public.lessons), true);
