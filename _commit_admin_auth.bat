@echo off
cd /d "%~dp0"
git add admin.html
git commit -m "Add admin login gate - require authentication to access admin panel"
git push origin main
echo.
echo Done!
pause
