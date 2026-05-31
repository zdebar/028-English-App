Krátce

- Tento adresář slouží jako lokální pracovní kopie Supabase migrací a konfigurace.

Postup (rychle):

1. Nainstalujte `supabase` CLI a Docker.
2. Spusťte lokální stack:

```
supabase start
```

3. Importujte dump do lokální DB (PowerShell):

```
./scripts/import_dump.ps1 -DumpPath ../backend/supabase/remote_full.sql
```

4. Vytvořte migration z aktuálního stavu (volitelné):

```
supabase db diff --file supabase/migrations/$(Get-Date -Format yyyyMMdd_HHmmss)_initial.sql
```

Poznámky

- Necommitujte tajné klíče. Použijte `.env` / CI secrets pro produkci.
- Dump může obsahovat rozšíření, triggers a policies — zkontrolujte je ručně.

Další kroky

- Chcete, abych vytvořil skutečný migration soubor založený na `backend/supabase/remote_full.sql`? Pokud ano, potvrdťe a já ho vložím do `supabase/migrations/`.
