@echo off
rem Temporary public URL via Cloudflare quick tunnel (no account). Run serve.cmd first.
rem The https://....trycloudflare.com address is printed below and changes every run.
cd /d "%~dp0"
.tools\cloudflared\cloudflared.exe tunnel --url http://127.0.0.1:3000 --no-autoupdate
