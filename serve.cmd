@echo off
rem Campsite server - uses this folder's .tools\node (Node 24). Open http://localhost:3000/
cd /d "%~dp0"
set "PATH=%~dp0.tools\node;%PATH%"
if not exist node_modules\three (
  echo Installing three.js...
  call npm install
)
node server.mjs
