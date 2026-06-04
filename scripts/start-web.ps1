# Manual start: Next.js frontend only (http://localhost:3000)
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root
Write-Host "VoiceLink web — Ctrl+C to quit" -ForegroundColor Cyan
Write-Host "Ensure signaling is running: npm run dev:server" -ForegroundColor DarkGray
npm run dev:web
