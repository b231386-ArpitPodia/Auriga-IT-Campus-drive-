@echo off
echo ==================================================================
echo   Setting up PharmaFEFO - Neighbourhood Pharmacy Inventory System
echo ==================================================================

python -m venv venv
call .\venv\Scripts\activate.bat

echo [1/2] Installing Python backend packages...
pip install -r backend\requirements.txt

echo [2/2] Installing Node frontend packages...
cd frontend
call npm install
cd ..

echo ==================================================================
echo   Setup Complete! To start the full-stack system, run:
echo   python run.py
echo ==================================================================
pause
