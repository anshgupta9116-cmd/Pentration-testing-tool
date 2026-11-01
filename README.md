# 🛡️ Penetration Testing Suite - Hybrid Web Application

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![Security](https://img.shields.io/badge/Security-Audit-red?style=for-the-badge&logo=security)

A full-stack, AI-powered web application for automated penetration testing. It features real-time progress updates, comprehensive HTML reporting, and AI-driven vulnerability remediation suggestions using the Google Gemini API.

---

## ✨ Key Features

- 🌐 **Web-Based Dashboard**: Modern, responsive, and intuitive web UI.
- 🤖 **AI-Powered Remediation**: Uses Google Gemini API to analyze vulnerabilities and provide step-by-step mitigation advice.
- 🔄 **Real-Time Updates**: Live scan progress tracking via WebSockets.
- 🕷️ **Intelligent Web Crawler**: Automatically discovers hidden pages, forms, and endpoints.
- 🔌 **Hybrid Port Scanner**: High-speed port and service discovery.
- 🔍 **Passive Security Scanner**: Analyzes security headers, cookies, TLS/SSL, and sensitive paths.
- 🐛 **Active Vulnerability Scanner**: Detects SQL injection (SQLi) and Cross-Site Scripting (XSS).
- 📊 **Executive Reports**: Generates beautiful, detailed HTML security reports.

## 🚀 Quick Setup

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

2. **Configure your AI Remediation Engine**:
Create a `.env` file in the root directory and add your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## 💻 Running the Application

### The Easiest Way (Recommended)
You can start the web application instantly using the provided startup scripts.

**On Windows:**
Double-click `start_web.bat` or run:
```powershell
.\start_web.bat
```

**On Linux/macOS:**
```bash
./start_web.sh
```

### Manual Startup
Alternatively, you can start the Flask web server manually:
```bash
python app.py
```

Then open your browser and navigate to: **`http://localhost:5000`**

## 📖 How to Use

1. **Configure Your Target**: Enter the Target URL, select crawl depth (1-5), and set the port range.
2. **Launch the Scan**: Hit "Start Scan" and watch the real-time WebSocket logs as the tool attacks the target.
3. **Analyze Findings**: Once completed, view the summary statistics and download the comprehensive HTML report.
4. **AI Remediation**: Send your scan results to the Gemini AI module to get intelligent fixes for the discovered vulnerabilities.

## 🗂️ Project Architecture

```text
pentest_project/
├── app.py                 # Core Flask web application
├── start_web.bat / .sh    # Environment setup and launch scripts
├── .env.example           # Template for API keys
├── docs/                  # Documentation and Reports
│   ├── API_REMEDIATION.md
│   └── Project_Report.pdf
├── scripts/               # Utility scripts
├── modules/               # Security Engine
│   ├── ai_remediation.py  # Gemini AI Integration
│   ├── crawler.py         # Web Spider
│   ├── portscanner.py     # Network Scanner
│   ├── passivescan.py     # Header & Cookie Analysis
│   ├── activescan.py      # SQLi & XSS Detection
│   ├── poc.py             # Proof of Concept generator
│   └── reporter.py        # Report Generation
├── templates/             # HTML UI templates
└── static/                # CSS and JavaScript assets
```

## ⚠️ Disclaimer & Security Notes

**This tool is designed strictly for authorized security testing and educational purposes only.** 

- Only use this tool on systems you own or have explicit, written permission to test.
- The PoC (Proof of Concept) module requires interactive confirmation and is built for validation, not exploitation.
- The author is not responsible for any misuse or illegal activities performed with this tool.

---
*Built with ❤️ for the Cybersecurity Community.*
