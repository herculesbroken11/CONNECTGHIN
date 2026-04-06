# Run when errno 32 locks Pub Cache / build outputs.
# Usage (from apps\mobile-flutter):
#   PowerShell:  powershell -ExecutionPolicy Bypass -File tool\windows_prep_build.ps1
#   CMD:         tool\windows_prep_build.cmd
$ErrorActionPreference = 'Continue'
$mobileRoot = Split-Path -Parent $PSScriptRoot
Set-Location $mobileRoot

Write-Host "== ConnectGHIN: prep Flutter Android build (Windows) ==" -ForegroundColor Cyan
Write-Host "Project: $mobileRoot"

$gradlew = Join-Path $mobileRoot 'android\gradlew.bat'
if (Test-Path $gradlew) {
  Write-Host "`nStopping Gradle daemons..."
  & $gradlew --stop 2>$null
}

Write-Host "`nflutter clean..."
flutter clean
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nflutter pub get..."
flutter pub get
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nDone. Close other flutter run / Android Studio if needed, then:" -ForegroundColor Green
Write-Host "  flutter run -d emulator-5556" -ForegroundColor Green
