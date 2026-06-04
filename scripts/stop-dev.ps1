# Stop processes listening on VoiceLink dev ports (3000, 3001)
$ports = @(3000, 3001)
$stopped = 0
$seen = @{}

foreach ($port in $ports) {
  $lines = netstat -ano | Select-String "LISTENING" | Select-String ":$port\s"
  foreach ($line in $lines) {
    $parts = ($line -replace '\s+', ' ').Trim().Split(' ')
    $processId = $parts[-1]
    if ($processId -match '^\d+$' -and -not $seen.ContainsKey($processId)) {
      $seen[$processId] = $true
      Write-Host "Stopping PID $processId (port $port)..."
      taskkill /PID $processId /F 2>$null | Out-Null
      if ($LASTEXITCODE -eq 0) { $stopped++ }
    }
  }
}

$ngrok = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($ngrok) {
  $ngrok | Stop-Process -Force
  Write-Host "Stopped ngrok tunnel." -ForegroundColor Green
}

if ($stopped -eq 0) {
  Write-Host "No listeners on ports 3000 or 3001." -ForegroundColor DarkGray
} else {
  Write-Host "Done. Stopped $stopped process(es)." -ForegroundColor Green
}
