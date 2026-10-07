#requires -Version 5.1
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$RepoRoot = $PSScriptRoot
$SkillsRoot = Join-Path $RepoRoot 'skills'
$SkillDirectories = Get-ChildItem -Path $SkillsRoot -Directory

if (-not $SkillDirectories) {
  throw "No skill folders were found in $SkillsRoot"
}

foreach ($SkillDirectory in $SkillDirectories) {
  $SkillFile = Join-Path $SkillDirectory.FullName 'SKILL.md'
  if (-not (Test-Path $SkillFile)) {
    throw "Required skill file was not found: $SkillFile"
  }

  $OutputPath = Join-Path $SkillsRoot "$($SkillDirectory.Name).zip"
  $SkillContents = Join-Path $SkillDirectory.FullName '*'
  Compress-Archive -Path $SkillContents -DestinationPath $OutputPath -Force

  if (-not (Test-Path $OutputPath)) {
    throw "Package was not created at $OutputPath"
  }

  Write-Host "Created $OutputPath"
}