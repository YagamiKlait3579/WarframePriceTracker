@echo off
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
    start "" http://localhost:8000
    py libs\server.py
    exit /b
)

where python >nul 2>nul
if %errorlevel%==0 (
    start "" http://localhost:8000
    python libs\server.py
    exit /b
)

echo Python 3 не найден.
echo Установите Python 3 с официального сайта: https://www.python.org/downloads/
echo Затем запустите этот файл снова.
pause
