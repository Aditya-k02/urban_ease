@echo off
REM Run server in background
start "Server" cmd /k "cd Server && nodemon server.js"

REM Run client in background
start "Client" cmd /k "cd Client && npx vite"

echo Both services are starting in separate windows.
echo Close the windows to stop the services.