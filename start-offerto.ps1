# start-offerto.ps1
param(
  [switch]$web,
  [switch]$android,
  [switch]$ios
)

# Bepaal scriptmap robuust (werkt ook bij direct uitvoeren)
$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
Set-Location -Path $ScriptDir

Write-Host "== Offerto: Expo start met schone cache ==" -ForegroundColor Cyan

# Indien een specifiek target is meegegeven, start direct gericht; anders interactieve start
if ($web) {
  npx expo start --web -c
  exit $LASTEXITCODE
} elseif ($android) {
  npx expo start --android -c
  exit $LASTEXITCODE
} elseif ($ios) {
  npx expo start --ios -c
  exit $LASTEXITCODE
} else {
  npx expo start -c
  exit $LASTEXITCODE
}
