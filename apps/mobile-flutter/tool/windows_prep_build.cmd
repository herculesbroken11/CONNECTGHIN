@echo off
setlocal
REM Prep Flutter Android build on Windows (errno 32 / file locks).
REM Run from Command Prompt (double-click OK). Working directory becomes apps\mobile-flutter.
REM Usage (from apps\mobile-flutter):
REM   tool\windows_prep_build.cmd

cd /d "%~dp0.."
echo == ConnectGHIN: prep Flutter Android build (Windows) ==
echo Project: %CD%
echo.

if exist "android\gradlew.bat" (
  echo Stopping Gradle daemons...
  call android\gradlew.bat --stop 2>nul
  echo.
)

echo flutter clean...
call flutter clean
if errorlevel 1 exit /b 1

echo.
echo flutter pub get...
call flutter pub get
if errorlevel 1 exit /b 1

echo.
echo Done. Close other flutter run / Android Studio if needed, then:
echo   flutter run -d emulator-5556
endlocal
exit /b 0
