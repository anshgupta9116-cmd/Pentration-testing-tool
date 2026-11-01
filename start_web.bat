@echo off
echo Starting Penetration Testing Web Application...
echo.
echo Setting Gemini API Key...
if exist .env (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do set "%%a=%%b"
) else (
    echo WARNING: .env file not found. Create one to set your GEMINI_API_KEY.
)
echo.
echo Make sure you have installed all dependencies:
echo   pip install -r requirements.txt
echo.
if exist .venv\Scripts\python.exe (
    echo Using virtual environment...
    .venv\Scripts\python.exe app.py
) else (
    python app.py
)
pause

