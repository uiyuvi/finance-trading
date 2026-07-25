# Zerodha Kite Connect Learning Dashboard

A compact, high-performance React + Vite frontend and Python FastAPI backend for exploring Zerodha Kite Connect API features, built in the Zerodha Varsity visual theme (calm light-blue accents, clean white cards, crisp typography, and professional work-focused spacing).

---

## Features & Modules

1. **Secure Session Authentication**:
   - Split login page with Varsity blue hero panel.
   - Collects `API Key`, `API Secret`, and `Request Token`.
   - Generates access token via official `kiteconnect` Python SDK.
   - Saves ONLY `api_key` and `access_token` in `backend/session.json`.
   - Never exposes access token to the browser.
   - Persists session locally across refreshes (`GET /api/session`).
   - Includes Demo Sandbox Mode for testing without active live API credentials.

2. **6 Learning Modules**:
   - **User Tab**: Calls `kite.profile()` to display User Name, User ID, Products, and Exchanges.
   - **Instruments Tab**: Searchable/filterable explorer for exchange (combining NFO under NSE, BFO under BSE), underlying, stock/symbol, instrument type (EQ/FUT/CE/PE), and expiry. Includes dual clean table & raw API views.
   - **Snapshot Tab**: Multi-symbol quote snapshot (`kite.quote()`) with clean data cards, market depth (bids/asks), and raw API response view.
   - **Realtime Tab**: Live WebSocket stream controller (`KiteTicker`) with real-time incoming tick cards, status indicators, and raw payload viewer.
   - **Historical Tab**: Interactive OHLCV Candlestick Chart (with hover tooltip), 10-row candle table, interval selection, date range, continuous/OI modes, and full API JSON view (`kite.historical_data()`).
   - **SMA Backtest Tab**: 10/40 Simple Moving Average crossover backtest engine (`POST /api/backtest/sma`) with next-day open executions (zero lookahead bias), interactive OHLCV chart with dual SMA lines, Buy/Sell markers, metric cards, trade log table, and raw response viewer.

---

## Security Audit & GitHub Readiness

> [!IMPORTANT]
> **No hardcoded API credentials, secrets, or access tokens exist in the codebase.**

- All API credentials (`API Key`, `API Secret`, `Request Token`) are submitted dynamically through the UI.
- Local sessions are stored in `backend/session.json` which is strictly ignored by `.gitignore`.
- Run-time artifacts, virtual environments (`venv`), `node_modules`, and build folders are git-ignored.

### Pushing to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Zerodha Kite Connect Learning Dashboard with SMA Backtest"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/zerodha-kite-dashboard.git
git push -u origin main
```

---

## Setup & Run Instructions

### Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**

---

### Windows Setup & Run

#### 1. Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
*(Backend API will start at `http://127.0.0.1:8000`)*

#### 2. Frontend Setup
Open a new terminal window:
```powershell
cd frontend
npm install
npm run dev
```
*(Frontend dev server will start at `http://localhost:5173`)*

---

### macOS Setup & Run

#### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

#### 2. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

---

## Project Structure & Adding New Tabs

```
dashboard-prod/
├── .gitignore               # Protects session.json, node_modules, & secrets
├── backend/
│   ├── main.py              # FastAPI endpoints & models
│   ├── kite_service.py      # KiteConnect SDK wrapper, SMA backtest & session logic
│   ├── ticker_service.py    # KiteTicker WebSocket streamer
│   ├── requirements.txt     # Python dependencies
│   └── session.json         # Local session file (git-ignored)
└── frontend/
    ├── src/
    │   ├── components/      # Shared UI (Navbar, Sidebar, JsonView, Candlestick, SmaChart)
    │   ├── pages/           # Login & Dashboard page containers
    │   └── tabs/            # Tab views (User, Instruments, Snapshot, Realtime, Historical, SmaBacktest)
    ├── index.html           # HTML template with Tailwind CSS v3 engine
    ├── index.css            # Varsity CSS layout & tokens
    └── vite.config.js       # Vite dev proxy configuration
```
