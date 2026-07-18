-- Generated from seeds/remote_data.sql by scripts/extract-catalog-seeds.ps1.
-- Contains shared catalog data only.

INSERT INTO "public"."notes" ("id", "name", "note", "sort_order", "updated_at", "deleted_at") VALUES
	(1, 'short', 'Přídavné jméno "short" se v angličtině používá označení malé (nevysoké) postavy.', 1, '2026-07-15 08:28:28.144793+00', NULL);

SELECT pg_catalog.setval('public.notes_id_seq', (SELECT MAX(id) FROM public.notes), true);
