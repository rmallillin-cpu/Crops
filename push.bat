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

REM --- Pull and merge any changes that exist on GitHub but not locally ---
REM (e.g. edits made directly in the GitHub web editor) before pushing,
REM so a normal push never gets rejected for being behind.
echo.
echo Checking for changes on GitHub not yet in your local copy...
git fetch origin main >nul 2>nul

git merge-base --is-ancestor origin/main HEAD >nul 2>nul
if errorlevel 1 (
    echo Remote has commits you don't have locally - merging them in...
    echo (If anything conflicts, your LOCAL files will automatically win.)
    git pull --no-rebase --allow-unrelated-histories -X ours --no-edit origin main
    if errorlevel 1 (
        echo.
        echo [ERROR] Merge failed for a reason auto-resolution couldn't handle
        echo ^(e.g. a deleted file vs. an edited file^). Run "git status" to see
        echo what's unresolved, fix it by hand, then run:
        echo     git add .
        echo     git commit -m "Merge remote changes"
        echo     git push -u origin main
        echo Do NOT use --force unless you are certain you want to permanently
        echo overwrite what's currently on GitHub.
        pause
        exit /b 1
    )
    echo Merge complete - local files were kept wherever content differed.
)

echo.
echo Pushing to !REPO_URL! ...
git push -u origin main

if errorlevel 1 (
    echo.
    echo [ERROR] Push still failed after merging. Run "git status" to see
    echo what's going on, resolve any remaining issues, then re-run this
    echo script. Do NOT use --force unless you are certain you want to
    echo permanently overwrite what's currently on GitHub.
    pause
    exit /b 1
)

echo.
echo ==========================================================
echo  Done. Check your repo on GitHub - src/ and public/ should
echo  now both be there. Render will redeploy automatically.
echo ==========================================================
pause
