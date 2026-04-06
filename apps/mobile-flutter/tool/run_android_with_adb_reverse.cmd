@echo off
setlocal
REM Forward emulator TCP 3000 -> host TCP 3000, then run Flutter using 127.0.0.1 (loopback on device = your PC API).
REM Requires: API on host port 3000, adb in PATH, emulator connected.
REM Usage (from apps\mobile-flutter):
REM   tool\run_android_with_adb_reverse.cmd
REM   tool\run_android_with_adb_reverse.cmd emulator-5556

cd /d "%~dp0.."

set "DEVICE=%~1"
if "%DEVICE%"=="" set "DEVICE=emulator-5556"

where adb >nul 2>nul
if errorlevel 1 (
  echo ERROR: adb not in PATH. Add Android SDK platform-tools ^(e.g. ...\Android\Sdk\platform-tools^) to PATH.
  exit /b 1
)

echo == ADB reverse: device %DEVICE% tcp:3000 -^> host tcp:3000 ==
echo.
adb -s "%DEVICE%" reverse tcp:3000 tcp:3000
if errorlevel 1 (
  echo ERROR: adb reverse failed. Run: adb devices
  exit /b 1
)

echo.
adb -s "%DEVICE%" reverse --list
echo.

echo == Flutter: API_BASE_URL=http://127.0.0.1:3000/api/v1 ==
call flutter run -d "%DEVICE%" --dart-define=API_BASE_URL=http://127.0.0.1:3000/api/v1

endlocal
