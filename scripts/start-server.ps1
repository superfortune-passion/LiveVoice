# Manual start: signaling server only (http://localhost:3001)
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root
Write-Host "VoiceLink signaling — Ctrl+C to quit" -ForegroundColor Magenta
npm run dev:server
