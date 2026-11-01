#!/bin/bash
echo "Starting Penetration Testing Web Application..."
echo ""
echo "Setting Gemini API Key..."
if [ -f .env ]; then
    set -a
    source .env
    set +a
else
    echo "WARNING: .env file not found. Create one to set your GEMINI_API_KEY."
fi
echo ""
echo "Make sure you have installed all dependencies:"
echo "  pip install -r requirements.txt"
echo ""
python3 app.py

