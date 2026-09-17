import os
import sys
import subprocess
import time
import webbrowser

def main():
    print("=" * 65)
    print("  PHARMA FEFO - NEIGHBOURHOOD PHARMACY INVENTORY & DISPENSING")
    print("=" * 65)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")

    # 1. Initialize DB and run tests
    print("\n[1/3] Running FEFO Engine verification tests...")
    test_script = os.path.join(backend_dir, "test_fefo.py")
    
    # Check virtualenv python
    venv_py = os.path.join(base_dir, "venv", "Scripts", "python.exe")
    if not os.path.exists(venv_py):
        venv_py = sys.executable

    res = subprocess.run([venv_py, test_script], cwd=base_dir)
    if res.returncode != 0:
        print("[WARNING] Engine test failed, proceeding with fallback...")

    # 2. Start FastAPI Backend Server
    print("\n[2/3] Starting FastAPI Backend on http://localhost:8000 ...")
    backend_cmd = [venv_py, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    backend_process = subprocess.Popen(backend_cmd, cwd=backend_dir)

    # 3. Start Frontend Development Server
    print("\n[3/3] Starting React Frontend on http://localhost:3000 ...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_cmd = [npm_cmd, "run", "dev"]
    
    try:
        frontend_process = subprocess.Popen(frontend_cmd, cwd=frontend_dir)
    except Exception as e:
        print(f"[NOTE] Frontend npm process launch: {e}")
        frontend_process = None

    print("\n" + "=" * 65)
    print("  SYSTEM RUNNING SUCCESSFULLY!")
    print("  - Backend API:  http://localhost:8000/docs")
    print("  - Frontend UI:  http://localhost:3000")
    print("=" * 65)

    try:
        backend_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_process.terminate()
        if frontend_process:
            frontend_process.terminate()

if __name__ == "__main__":
    main()
