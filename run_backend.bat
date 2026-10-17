@echo off
echo Starting SentinelVoice FastAPI Backend on port 8000...
cd backend
call .venv\Scripts\activate.bat
python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
pause
