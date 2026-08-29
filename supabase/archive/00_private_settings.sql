INSERT INTO private.settings (key, value)
VALUES ('soft_delete_retention', '"30 days"'::JSONB)
ON CONFLICT (key) DO UPDATE
SET value = excluded.value,
    updated_at = NOW();

INSERT INTO private.settings (key, value)
VALUES ('is_anonymous_deletion', '"30 days"'::JSONB)
ON CONFLICT (key) DO UPDATE
SET value = excluded.value,
    updated_at = NOW();
