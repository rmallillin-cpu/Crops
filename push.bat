@echo off
setlocal enabledelayedexpansion

echo ==========================================================
echo  PSA Cavite Crop List Registry - Push to GitHub
echo ==========================================================
echo.

REM --- Check that git is installed ---
where git >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Git is not installed or not on your PATH.
    echo Download it from https://git-scm.com/download/win and try again.
    pause
    exit /b 1
)

REM --- Ask for the GitHub repo URL if not already configured ---
git remote get-url origin >nul 2>nul
if errorlevel 1 (
    set /p REPO_URL="Paste your GitHub repo URL (e.g. https://github.com/YOUR-USERNAME/Crops.git): "
) else (
    for /f "delims=" %%i in ('git remote get-url origin') do set REPO_URL=%%i
    echo Using existing remote: !REPO_URL!
)

REM --- Init repo if needed ---
if not exist ".git" (
    echo.
    echo Initializing git repo...
    git init
    git branch -M main
)

REM --- Set/replace the remote ---
git remote remove origin >nul 2>nul
git remote add origin "!REPO_URL!"

REM --- Stage, commit, push ---
echo.
echo Staging all files (src, public, config files)...
git add .

echo.
set /p COMMIT_MSG="Commit message (Enter for default): "
if "!COMMIT_MSG!"=="" set COMMIT_MSG=Update PSA Cavite Crop List Registry

git commit -m "!COMMIT_MSG!"
if errorlevel 1 (
    echo.
    echo Nothing new to commit, or commit failed - continuing to push anyway.
)

echo.
echo Pushing to !REPO_URL! ...
git push -u origin main

if errorlevel 1 (
    echo.
    echo [ERROR] Push failed. If this is your first push and the repo already
    echo has commits on GitHub ^(like a README^), try:
    echo     git push -u origin main --force
    echo Only use --force if you're sure you want to overwrite what's on GitHub.
    pause
    exit /b 1
)

echo.
echo ==========================================================
echo  Done. Check your repo on GitHub - src/ and public/ should
echo  now both be there. Then redeploy on Vercel.
echo ==========================================================
pause
