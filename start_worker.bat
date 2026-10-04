@echo off
echo ========================================================
echo  Starting PromisePocket Temporal Background Worker
echo ========================================================
cd backend
python -m app.worker
pause
