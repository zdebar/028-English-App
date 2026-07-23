param(
  [string]$DumpPath = (Join-Path $PSScriptRoot '..\seeds\remote_data.sql'),
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\seeds')
)

$ErrorActionPreference = 'Stop'

$catalogSeeds = [ordered]@{
  levels  = '02_levels_rows.sql'
  lessons = '03_lessons_rows.sql'
  grammar_chunks = '04_grammar_rows.sql'
  notes   = '05_notes_rows.sql'
  blocks  = '06_blocks_rows.sql'
  items   = '07_items_rows.sql'
}

$dumpLines = Get-Content -LiteralPath $DumpPath -Encoding UTF8
$utf8WithoutBom = [System.Text.UTF8Encoding]::new($false)

foreach ($entry in $catalogSeeds.GetEnumerator()) {
  $table = $entry.Key
  $startPattern = '^INSERT INTO "public"\."' + [regex]::Escape($table) + '" '
  $startIndex = -1

  for ($index = 0; $index -lt $dumpLines.Count; $index++) {
    if ($dumpLines[$index] -match $startPattern) {
      $startIndex = $index
      break
    }
  }

  if ($startIndex -lt 0) {
    throw "No INSERT statement found for public.$table in $DumpPath"
  }

  $statement = [System.Collections.Generic.List[string]]::new()
  for ($index = $startIndex; $index -lt $dumpLines.Count; $index++) {
    $statement.Add($dumpLines[$index])
    if ($dumpLines[$index].TrimEnd().EndsWith(';')) {
      break
    }
  }

  if (-not $statement[$statement.Count - 1].TrimEnd().EndsWith(';')) {
    throw "Unterminated INSERT statement for public.$table in $DumpPath"
  }

  $sequenceSql =
    "SELECT pg_catalog.setval('public.${table}_id_seq', (SELECT MAX(id) FROM public.$table), true);"
  $output = @(
    "-- Generated from seeds/remote_data.sql by scripts/extract-catalog-seeds.ps1."
    "-- Contains shared catalog data only."
    ''
  ) + $statement + @('', $sequenceSql, '')
  $outputPath = Join-Path $OutputDirectory $entry.Value
  [System.IO.File]::WriteAllText(
    $outputPath,
    ($output -join [Environment]::NewLine),
    $utf8WithoutBom
  )
}

Write-Host "Generated $($catalogSeeds.Count) catalog seed files in $OutputDirectory"
