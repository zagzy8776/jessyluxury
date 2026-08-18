@echo off
cd /d "E:\jessy-luxury-website\jessy-luxury"
del build.log 2>nul
npm run build > build.log 2>&1
echo BUILD_DONE_EXIT_%ERRORLEVEL% >> build.log

