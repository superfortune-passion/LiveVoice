# Tunnel + dev servers (Computer B over internet). Stops with Ctrl+C; run tunnel:stop separately for ngrok.
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $RepoRoot

& "$PSScriptRoot\start-tunnel.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Starting web + signaling on this PC..." -ForegroundColor Cyan
npm run dev
