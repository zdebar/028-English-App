param(
    [string]$DumpPath = "backend/supabase/remote_full.sql",
    [int]$Port = 54322,
    [string]$User = "postgres",
    [string]$Db = "postgres"
)

if (-not (Test-Path $DumpPath)) {
    Write-Error "Dump file not found: $DumpPath"
    exit 1
}

Write-Host "Importing $DumpPath into local supabase DB on port $Port..."

# Přes psql import (supabase start spustí Postgres na 54322)
psql -h localhost -p $Port -U $User -d $Db -f $DumpPath

if ($LASTEXITCODE -ne 0) {
    Write-Error "Import selhal (psql exit code $LASTEXITCODE)"
    exit $LASTEXITCODE
}

Write-Host "Import dokončen."
