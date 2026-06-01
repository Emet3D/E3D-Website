@echo off
cd /d "%~dp0"
set MP_ACCESS_TOKEN=TEST-123456-ABCDEF
echo EDITÁ este archivo: reemplazá TEST-123456-ABCDEF con tu token real de Mercado Pago
echo.
echo Después ejecutá de nuevo. El server arranca sin ventana.
echo Abrí http://localhost:8080 en el navegador.
pause
start /B pythonw.exe mp_local_server.py
exit
