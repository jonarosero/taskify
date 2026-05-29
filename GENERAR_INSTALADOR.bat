@echo off
title Generar Instalador Taskify
cd /d "%~dp0"
echo.
echo  =====================================================
echo    Taskify - Generando instalador .exe
echo  =====================================================
echo.
echo  Esto tomara varios minutos...
echo.
call npm run dist:win
echo.
if %ERRORLEVEL%==0 (
  echo  [OK] Instalador generado en: dist-electron\
  echo  Busca el archivo: Taskify-Setup-*.exe
  start "" "dist-electron"
) else (
  echo  [ERROR] Ocurrio un error al generar el instalador.
  echo  Revisa que tienes conexion a internet la primera vez.
)
echo.
pause
