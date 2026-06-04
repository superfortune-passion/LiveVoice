# Start ngrok (web + signaling), write URLs for Computer B, update web/.env.local
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path $PSScriptRoot -Parent
$NgrokConfig = Join-Path $RepoRoot "ngrok.yml"
$EnvLocal = Join-Path $RepoRoot "web\.env.local"
$TunnelJson = Join-Path $RepoRoot "tunnel-urls.json"

function Test-Command($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Set-DotEnvLine($path, $key, $value) {
  $lines = @()
  if (Test-Path $path) {
    $lines = @(Get-Content $path -Encoding UTF8)
  }
  $found = $false
  $out = foreach ($line in $lines) {
    if ($line -match "^\s*$([regex]::Escape($key))\s*=") {
      $found = $true
      "$key=$value"
    } else {
      $line
    }
  }
  if (-not $found) {
    $out += "$key=$value"
  }
  $out | Set-Content $path -Encoding UTF8
}

function Get-TunnelUrls {
  try {
    $api = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 3
  } catch {
    return $null
  }
  $web = $null
  $signal = $null
  foreach ($t in $api.tunnels) {
    $url = $t.public_url
    if (-not $url) { continue }
    $name = $t.name
    $addr = $t.config.addr
    if ($name -eq "voicelink-web" -or $addr -match ":3000$") {
      $web = $url
    }
    if ($name -eq "voicelink-signaling" -or $addr -match ":3001$") {
      $signal = $url
    }
  }
  if ($web -and $signal) {
    return @{ Web = $web; Signaling = $signal }
  }
  return $null
}

if (-not (Test-Command "ngrok")) {
  Write-Host "ngrok is not installed." -ForegroundColor Red
  Write-Host "Install: https://ngrok.com/download" -ForegroundColor Yellow
  Write-Host "Then: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor Yellow
  exit 1
}

$existing = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Stopping existing ngrok..." -ForegroundColor DarkGray
  $existing | Stop-Process -Force
  Start-Sleep -Seconds 1
}

Write-Host "Starting ngrok (web :3000, signaling :3001)..." -ForegroundColor Cyan
$ngrokArgs = @(
  "start", "voicelink-web", "voicelink-signaling",
  "--config", $NgrokConfig,
  "--log", "stdout"
)
$ngrokProc = Start-Process -FilePath "ngrok" -ArgumentList $ngrokArgs `
  -WorkingDirectory $RepoRoot -PassThru -WindowStyle Hidden

$urls = $null
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Milliseconds 500
  $urls = Get-TunnelUrls
  if ($urls) { break }
}

if (-not $urls) {
  Write-Host "Could not read tunnel URLs from http://127.0.0.1:4040/api/tunnels" -ForegroundColor Red
  Write-Host "Check ngrok authtoken: ngrok config add-authtoken <token>" -ForegroundColor Yellow
  if ($ngrokProc -and -not $ngrokProc.HasExited) {
    $ngrokProc | Stop-Process -Force
  }
  exit 1
}

$webHost = ([Uri]$urls.Web).Host
$signalUrl = $urls.Signaling.TrimEnd("/")

if (-not (Test-Path $EnvLocal)) {
  Copy-Item (Join-Path $RepoRoot "web\.env.example") $EnvLocal -ErrorAction SilentlyContinue
  if (-not (Test-Path $EnvLocal)) {
    "# VoiceLink local" | Set-Content $EnvLocal -Encoding UTF8
  }
}

Set-DotEnvLine $EnvLocal "NEXT_PUBLIC_SOCKET_URL" $signalUrl
Set-DotEnvLine $EnvLocal "ALLOWED_DEV_ORIGINS" $webHost

$payload = @{
  webUrl          = $urls.Web
  signalingUrl    = $signalUrl
  shareWithComputerB = $urls.Web
  updatedAt       = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json -Depth 3
$payload | Set-Content $TunnelJson -Encoding UTF8

Write-Host ""
Write-Host "Internet test ready" -ForegroundColor Green
Write-Host "  Computer B (internet) open:" -ForegroundColor White
Write-Host "  $($urls.Web)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Signaling (auto in web/.env.local):" -ForegroundColor DarkGray
Write-Host "  $signalUrl" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Next: restart web if already running (Ctrl+C -> npm run dev:web)" -ForegroundColor Yellow
Write-Host "      or: npm run dev:server + npm run dev:web" -ForegroundColor Yellow
Write-Host "Stop tunnel: npm run tunnel:stop" -ForegroundColor DarkGray
