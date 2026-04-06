# Forward emulator port 3000 to host 3000, then flutter run with loopback API URL.
# Usage (from apps\mobile-flutter):
#   .\tool\run_android_with_adb_reverse.ps1
#   .\tool\run_android_with_adb_reverse.ps1 -Device emulator-5556
param(
  [string] $Device = 'emulator-5556'
)

$ErrorActionPreference = 'Stop'
$mobileRoot = Split-Path -Parent $PSScriptRoot
Set-Location $mobileRoot

$null = Get-Command adb -ErrorAction Stop

Write-Host "== ADB reverse: device $Device tcp:3000 -> host tcp:3000 ==" -ForegroundColor Cyan
adb -s $Device reverse tcp:3000 tcp:3000
Write-Host ""
adb -s $Device reverse --list
Write-Host ""
Write-Host "== Flutter: API_BASE_URL=http://127.0.0.1:3000/api/v1 ==" -ForegroundColor Cyan
flutter run -d $Device --dart-define=API_BASE_URL=http://127.0.0.1:3000/api/v1
