# Rollout checklist (breaking DB contract)

## 1) Pre-deploy

- Confirm frontend branch with new RPC params and renamed fields is ready.
- Schedule a short maintenance window (DB + frontend must roll out together).
- Ensure recent backup/snapshot exists.

## 2) Deploy order

1. Deploy SQL in this order:
   - `postgresql.sql`
   - `TRIGGER_update_updated_at.sql`
   - `TRIGGER_handle_new_auth_user.sql`
   - `TRIGGER_restore_user_on_signin.sql`
   - `RPC_upsert_user_items.sql`
   - `RPC_fetch_user_items.sql`
   - `RPC_upsert_user_scores.sql`
   - `RPC_fetch_user_scores.sql`
2. Verify SQL objects exist and signatures match:
   - `public.fetch_user_items(p_user_id uuid, p_last_synced_at timestamptz)`
   - `public.upsert_user_items(p_user_id uuid, p_user_items jsonb)`
   - `public.fetch_user_scores(p_last_synced_at timestamptz, p_user_id uuid)`
   - `public.upsert_user_scores(p_user_scores jsonb)`
3. Deploy frontend immediately after SQL validation.

## 3) Smoke tests

- Login creates/keeps `public.users` row.
- Practice page loads and shows items.
- Complete/skip actions update progress and daily score.
- Sync push + pull works without RPC argument errors.
- Vocabulary detail renders lesson/level sort order correctly.

## 4) Post-deploy checks

- No RPC 400/500 errors in logs.
- No client-side TypeScript/runtime errors in sync flows.
- Spot-check `user_items` and `user_scores` updates for one test user.

## 5) Rollback note

- This rollout removes legacy compatibility. Rollback requires restoring previous SQL function signatures and frontend bundle together.
