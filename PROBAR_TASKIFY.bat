@echo off
title Probar Taskify
cd /d "%~dp0"

echo.
echo  =====================================================
echo    Taskify - Modo prueba
echo  =====================================================
echo.

if not exist "package.json" (
  echo  [ERROR] No se encontro package.json en esta carpeta.
  echo  Ejecuta este archivo desde la raiz del proyecto Taskify.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo  Instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo.
    echo  [ERROR] No se pudieron instalar las dependencias.
    pause
    exit /b 1
  )
)

if not exist "node_modules\electron\dist\electron.exe" (
  echo  Reparando instalacion de Electron...
  call npm rebuild electron
  if errorlevel 1 (
    echo.
    echo  [ERROR] Electron no se pudo reparar.
    echo  Prueba borrar node_modules y ejecutar npm install otra vez.
    pause
    exit /b 1
  )
)

if not exist "dist\index.html" (
  echo  Generando build de prueba...
  call npm run build
  if errorlevel 1 (
    echo.
    echo  [ERROR] No se pudo generar el build.
    pause
    exit /b 1
  )
)

echo  Iniciando Taskify...
echo  Si es la primera vez, elige tu carpeta workspace cuando la app lo pida.
echo.
start "" /B node_modules\.bin\electron.cmd .

echo.
pause
