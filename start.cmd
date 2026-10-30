@echo off
rem Project-only launcher: puts .tools\node (Node 24) first on PATH for this window only. System Node 20 untouched.
cd /d "%~dp0"
set "PATH=%~dp0.tools\node;%PATH%"
node -v
claude %*
