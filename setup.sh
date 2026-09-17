#!/bin/bash
echo "=================================================================="
echo "  Setting up PharmaFEFO - Neighbourhood Pharmacy Inventory System"
echo "=================================================================="

# Create virtualenv
python3 -m venv venv
source venv/bin/activate

# Install Backend Dependencies
echo "[1/2] Installing Python backend packages..."
pip install -r backend/requirements.txt

# Install Frontend Dependencies
echo "[2/2] Installing Node frontend packages..."
cd frontend
npm install
cd ..

echo "=================================================================="
echo "  Setup Complete! To start the full-stack system, run:"
echo "  python3 run.py"
echo "=================================================================="
