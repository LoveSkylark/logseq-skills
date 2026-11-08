#requires -Version 5.1
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$OutputPath = Join-Path $PSScriptRoot 'logseq-native.mcpb'
$SourceBuild = Join-Path $PSScriptRoot 'source\build.ps1'

if (-not (Test-Path -LiteralPath $SourceBuild)) {
  throw "Claude Desktop extension source was not found at $SourceBuild."
}

& $SourceBuild -OutputPath $OutputPath
