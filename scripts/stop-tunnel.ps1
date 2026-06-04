# Stop ngrok and restore web/.env.local socket mode to auto
$RepoRoot = Split-Path $PSScriptRoot -Parent
$EnvLocal = Join-Path $RepoRoot "web\.env.local"
$TunnelJson = Join-Path $RepoRoot "tunnel-urls.json"

$procs = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($procs) {
  $procs | Stop-Process -Force
  Write-Host "Stopped ngrok." -ForegroundColor Green
} else {
  Write-Host "No ngrok process running." -ForegroundColor DarkGray
}

if (Test-Path $EnvLocal) {
  $content = Get-Content $EnvLocal -Encoding UTF8
  $content = $content | ForEach-Object {
    if ($_ -match "^\s*NEXT_PUBLIC_SOCKET_URL\s*=") {
      "NEXT_PUBLIC_SOCKET_URL=auto"
    } elseif ($_ -match "^\s*ALLOWED_DEV_ORIGINS\s*=") {
      $null
    } else {
      $_
    }
  } | Where-Object { $_ -ne $null }
  $content | Set-Content $EnvLocal -Encoding UTF8
  Write-Host "Restored web/.env.local (SOCKET_URL=auto)." -ForegroundColor Green
}

if (Test-Path $TunnelJson) {
  Remove-Item $TunnelJson -Force
}
