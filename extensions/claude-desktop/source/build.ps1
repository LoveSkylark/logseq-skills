#requires -Version 5.1
[CmdletBinding()]
param(
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$ExtensionRoot = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path (Split-Path -Parent $ExtensionRoot) 'logseq-native.mcpb'
}
$OutputPath = [System.IO.Path]::GetFullPath($OutputPath)
$OutputDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

Push-Location $ExtensionRoot
try {
  npm ci --omit=dev --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) {
    throw "npm ci failed with exit code $LASTEXITCODE."
  }

  npx --yes @anthropic-ai/mcpb validate manifest.json
  if ($LASTEXITCODE -ne 0) {
    throw "MCPB manifest validation failed with exit code $LASTEXITCODE."
  }

  npx --yes @anthropic-ai/mcpb pack . $OutputPath
  if ($LASTEXITCODE -ne 0) {
    throw "MCPB packaging failed with exit code $LASTEXITCODE."
  }

  if (-not (Test-Path $OutputPath)) {
    throw "MCPB package was not created at $OutputPath."
  }

  Write-Host "Created $OutputPath"
} finally {
  Pop-Location
}