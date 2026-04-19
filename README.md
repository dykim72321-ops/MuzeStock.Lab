# MuzeStock.Lab: Pure Quant System Trading Engine

**100% Quant Algorithm Architecture — Zero AI Heuristics**

> **v4 Paper Trading Auto-Sell fully implemented.** The Operations Command (작전지휘소) dashboard now supports real-time position monitoring, automated 2-stage exits (Scale-Out + Trailing Stop), and manual sell buttons per position.

MuzeStock.Lab is a fully systematic, data-driven quantitative trading engine engineered for robust alpha generation. Every position taken is backed by mathematically structured statistical models, specifically tailored for volatile penny stocks and high-beta assets. There are **no LLM outputs, no AI-generated text, and no black-box heuristics** in any execution path.

---

## Table of Contents

1. [Alpha Source](#alpha-source)
2. [Core Philosophy](#core-philosophy)
3. [Key Engine Implementations](#key-engine-implementations)
4. [Paper Trading Auto-Sell System](#paper-trading-auto-sell-system)
5. [Operations Command Dashboard](#operations-command-dashboard)
6. [Architecture](#architecture)
7. [Prerequisites](#prerequisites)
8. [Environment Variables](#environment-variables)
9. [Setup & Installation](#setup--installation)
10. [Usage](#usage)
11. [CI/CD](#cicd)
12. [Disclaimer](#disclaimer)

---

## Alpha Source

### Mean Reversion & Dead Cat Bounces

Instead of chasing false breakouts, MuzeStock.Lab exploits extreme market micro-structure inefficiencies — Panic Selling & Capitulation.

| Signal | Condition |
|---|---|
| **Super Oversold Setup** | RSI(2) < 10 combined with a −7% deviation from the 5-day SMA |
| **Volume Exhaustion** | Relative Volume (RVOL) > 3.0 during the crash to confirm capitulation |
| **Asymmetric Payoff** | Targets a 5.0 ATR snap-back recovery within a strict **3-day Time Stop** window |

---

## Core Philosophy

> *"In God we trust, all others must bring data." — W. Edwards Deming*

1. **Zero LLM Dependency**: No GPT, no NLP, no AI. All action paths rely entirely on raw price-action dynamics, mathematical transformations, and non-linear scoring.
2. **Trade Reject Logic**: If the natural ATR-based R/R ratio is below 1.5x, the system issues a `REJECT` action rather than force-correcting the target. *If there's no edge, we don't enter.*
3. **Strict Time Limits**: Dynamic time decay via a `λ` penalty function enforces strict capital rotation and punishes idle money.
4. **Statistical Robustness**: Slippage-adjusted backtests on Out-Of-Sample (OOS) data via Walk-Forward Analysis (WFA).

---

## Key Engine Implementations

### 1. DNA Scoring Engine (Dynamic Non-linear Analysis)

Replaces binary buy/sell flags with a continuous score matrix (0–100).

| Parameter | Role |
|---|---|
| **γ (Profit Momentum)** | Caps aggressive expectations, secures profit non-linearly |
| **δ (Loss Fear)** | Accelerates score drops under severe drawdown |
| **λ (Time Decay)** | Penalizes idle capital per trading day held, modulated by Efficiency Ratio (ER) |

Default values: `γ = 0.8`, `δ = 1.5`, `λ = 2.0` — optimized via `optimize_dna.py`.

### 2. Tiered Volatility Fallback

When live ATR data is unavailable, a price-tiered fallback is applied:

| Tier | Price Range | Volatility Assumption |
|---|---|---|
| Penny Stock | < $5 | 20% (Shakeout defense) |
| Swing / Mid-Cap | ≥ $5 | 8% (Precision entries) |
| Sub-dollar Protection | < $1 | Min ATR hard-capped at `0.0005` |

### 3. Chandelier Exit (Trailing Stop)

Stop prices use a Time-based Tightening multiplier. As holding days increase, the multiplier tightens from **2.5× ATR → 1.5× ATR**, protecting gains without premature exits.

### 4. R/R Reject Gate

```text
Natural R/R = (Target - Entry) / (Entry - Stop)
If R/R < 1.5x → Action: REJECT (no forced target adjustment)
```

The system will never artificially inflate the target price to meet a ratio. If the market doesn't offer a valid edge, the position is rejected outright.

### 5. Fractional Kelly Position Sizing

Allocations dynamically shrink with low conviction scores and high-variance regimes. Quarter-Kelly is applied with a Max R/R cap of 5.0 for safety.

### 6. Walk-Forward Analysis (WFA) Module

Located in `python_engine/portfolio_backtester.py`. Parameters are dynamically retrained on rolling windows and applied strictly to the subsequent unseen (OOS) window.

---

## Paper Trading Auto-Sell System

The v4 paper trading engine (`python_engine/paper_engine.py`) implements a fully automated 2-stage exit state machine triggered on every 1-minute Alpaca bar close.

### Automated Exit Flow

```
Alpaca 1-min bar → on_minute_bar_closed() → paper_engine.process_signal()
    │
    ├─ [Stage 1 — Scale-Out]  RSI > 60 & not scaled-out & ARMED
    │   → Sell 50% of position at market price
    │   → Raise trailing stop to entry_price × 1.01 (break-even +1%)
    │   → Status: HOLD → SCALE_OUT
    │   → Discord 🟠 alert
    │
    ├─ [Stage 2 — Trailing Stop]  price < ts_threshold & ARMED
    │   → Liquidate remaining units at market price
    │   → Record PnL to paper_history table
    │   → Delete from paper_positions
    │   → Discord ✅ / 🛑 alert
    │
    └─ [Normal]  Update current_price, highest_price, ts_threshold
```

### Trailing Stop Tightening

| Phase | Multiplier | Trigger |
|---|---|---|
| Initial entry | 90% of entry price | Set on BUY |
| Price rise | 90% of highest_high | Dynamic update |
| After Scale-Out | entry_price × 1.01 | RSI > 60 |

### Manual Sell (사령관 수동 매도)

The Operations Command dashboard provides a **per-position SELL button**. On click:

1. Fetches live price via yfinance (fallback: last streamed `current_price`)
2. Calculates PnL vs entry price
3. Posts to `POST /api/broker/paper/sell`
4. Backend liquidates position, writes `paper_history`, sends Discord alert
5. UI refreshes automatically

### API Endpoints (Paper Trading)

| Endpoint | Method | Description |
|---|---|---|
| `/api/broker/paper/account` | GET | Virtual account cash & equity |
| `/api/broker/paper/positions` | GET | All open paper positions |
| `/api/broker/paper/history` | GET | Last 30 closed trades |
| `/api/broker/paper/sell` | POST | Manual position liquidation |
| `/api/broker/arm` | POST | Toggle SYSTEM_ARMED (auto-trade on/off) |

---

## Operations Command Dashboard

The **작전지휘소** (`/stock/dashboard`) is the real-time command center for monitoring and controlling the trading engine.

### Dashboard Sections

| Section | Component | Data Source |
|---|---|---|
| **System Defense (MDD)** | `Dashboard.tsx` | `GET /api/strategy/stats` via FastAPI |
| **Engine Win Rate** | `Dashboard.tsx` | `GET /api/strategy/stats` via FastAPI |
| **Live Detection** | `Dashboard.tsx` + `useMarketEngine` | `GET /api/pulse/status` + `WS /ws/pulse` |
| **Virtual Portfolio** | `PortfolioStatus.tsx` | `GET /api/broker/paper/*` via FastAPI |
| **System Control Panel** | `CommandSettings.tsx` | `system_settings` table via Supabase client |
| **Quant Signal Feed** | `QuantSignalCard.tsx` | WebSocket `WS /ws/pulse` real-time stream |

### Dashboard Connection Map

```
Browser
  ├─ WS  ws://<host>/py-api/ws/pulse  ──────────────────► FastAPI :8001 /ws/pulse
  │        (Vite proxy: /py-api → localhost:8001)
  │
  ├─ REST /py-api/api/broker/paper/*  ──────────────────► FastAPI :8001 (X-Admin-Key auth)
  ├─ REST /py-api/api/strategy/stats  ──────────────────► FastAPI :8001
  ├─ REST /py-api/api/pulse/status    ──────────────────► FastAPI :8001
  │
  ├─ Supabase JS  system_settings     ──────────────────► Supabase DB (RLS: anon UPDATE ok)
  ├─ Supabase JS  watchlist / paper_* ──────────────────► Supabase DB
  │
  └─ Edge Fn  admin-proxy/api/hunt    ──────────────────► Supabase Edge Function
```

### Known Constraints

| Item | Detail |
|---|---|
| **Backend required** | FastAPI must be running on `:8001` for Portfolio, Stats, Pulse feed |
| **Market hours** | WebSocket pulse only fires during Alpaca market hours; off-hours shows last snapshot |
| **Trigger Hunt** | Calls `admin-proxy` Supabase Edge Function — requires it to be deployed |

### System Armed State

The `SYSTEM_ARMED` flag (toggled via **System Control Panel**) gates all automated buy and sell execution. When disarmed, the engine streams and scores but does not trade.

---

## Architecture

### Stack

| Layer | Stack |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite + TailwindCSS + Recharts |
| **Backend API** | FastAPI (Python 3.11) + Uvicorn + WebSocket |
| **Broker** | Alpaca Markets API (Paper & Live trading) |
| **Database** | PostgreSQL via Supabase |
| **Edge Functions** | Supabase Edge Functions (Deno/TypeScript) — 12 functions |
| **Alerts** | Discord Webhook (`webhook_manager.py`) |
| **CI** | GitHub Actions (`python-ci.yml`) |

### Component Flow

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend (Vite)              │
│   Dashboard · Portfolio · Scanner · Backtester UI  │
└────────────┬───────────────────┬────────────────────┘
             │ REST / WebSocket  │ Supabase JS Client
             ▼                   ▼
┌────────────────────┐  ┌─────────────────────────────┐
│  FastAPI Backend   │  │   Supabase Edge Functions   │
│  main.py :8001     │  │   run-quant-scanner         │
│                    │  │   analyze-stock             │
│  /api/analyze      │  │   execute-trades            │
│  /api/portfolio    │  │   monitor-positions         │
│  /api/broker/*     │  │   run-backtest  · +8 more   │
│  /ws/pulse (WS)    │  └──────────────┬──────────────┘
└────────┬───────────┘                 │
         │                            │
         ▼                            ▼
┌────────────────┐          ┌─────────────────┐
│  Alpaca API    │          │  PostgreSQL DB  │
│  (Paper/Live)  │          │  (Supabase)     │
└────────────────┘          └─────────────────┘
         │
         ▼
┌────────────────────┐
│  Discord Webhook   │
│  Super Oversold    │
│  & Standard Alerts │
└────────────────────┘
```

### Python Engine Modules

| Module | Purpose |
|---|---|
| `main.py` | FastAPI server — analysis, broker, paper trading, WebSocket endpoints |
| `paper_engine.py` | Paper trading state machine — auto buy/sell/scale-out/trailing stop |
| `portfolio_backtester.py` | DNA Validator + Walk-Forward Analysis |
| `optimize_dna.py` | Grid-search optimizer for γ, δ, λ parameters |
| `scraper.py` | Playwright-based market data scraper |
| `db_manager.py` | Supabase client factory |
| `cache_manager.py` | Request caching layer |
| `news_manager.py` | Finnhub news feed integration |
| `webhook_manager.py` | Discord alert dispatcher |
| `inventory_service.py` | Position inventory tracking |
| `utils.py` | Shared utilities |

### Supabase Tables (Paper Trading)

| Table | Purpose |
|---|---|
| `paper_account` | Virtual cash balance |
| `paper_positions` | Active positions: entry/current/highest price, TS threshold, units, status |
| `paper_history` | Closed trades: entry/exit price, PnL%, exit reason |

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| **Python** | 3.11 | Required for CI and local dev |
| **Node.js** | 18+ | For the React frontend |
| **Docker** | 24+ | Optional — for containerized backend |
| **Supabase account** | — | Project URL + keys required |
| **Alpaca account** | — | Paper trading free; live trading requires funded account |
| **Finnhub account** | — | Free tier sufficient for news feed |
| **Discord Webhook** | — | Optional — for trade alerts |

---

## Environment Variables

Create a `.env` file in the project root and a separate `.env` inside `python_engine/`:

### Frontend (`/.env`)

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
VITE_FINNHUB_API_KEY=<your-finnhub-key>
VITE_ADMIN_SECRET_KEY=<your-admin-secret>
```

### Python Backend (`/python_engine/.env`)

```env
# Supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<your-service-role-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Alpaca Markets
APCA_API_KEY_ID=<your-alpaca-key>
APCA_API_SECRET_KEY=<your-alpaca-secret>
APCA_PAPER=true   # Set to false for live trading

# Alerts
DISCORD_WEBHOOK_URL=<your-discord-webhook-url>

# Admin
ADMIN_SECRET_KEY=<your-admin-secret>
```

> **Note**: `APCA_PAPER=true` enables paper trading mode (default). Set to `false` only with a funded Alpaca live account.

---

## Setup & Installation

### 1. Clone & Install Frontend

```bash
git clone https://github.com/dykim72321-ops/muzestock.lab.git
cd MuzeStock.Lab

npm install
```

### 2. Configure Supabase

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Apply database migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy
```

### 3a. Run Python Backend (Local)

```bash
cd python_engine
pip install -r requirements.txt

uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

### 3b. Run Python Backend (Docker)

```bash
cd python_engine
docker-compose up --build
```

The FastAPI server will be available at `http://localhost:8001`.

---

## Usage

### Launch the Quant Terminal UI

```bash
# From project root
npm run dev
```

The React terminal will start at `http://localhost:5173`.

### Run DNA Scoring Backtester (Walk-Forward)

```bash
cd python_engine
python portfolio_backtester.py
```

### Optimize DNA Parameters

```bash
cd python_engine
python optimize_dna.py
```

Runs a grid search over γ, δ, λ and outputs the parameter set with the best OOS Sharpe ratio.

### Check Monitored Stocks

```bash
cd python_engine
python check_stocks.py
```

Queries the `daily_discovery` table and prints the top 5 stocks by DNA score.

### Paper Trading vs Live Trading

Toggle the `APCA_PAPER` environment variable:

```env
APCA_PAPER=true    # Paper trading (default, no real money)
APCA_PAPER=false   # Live trading (real money — use with caution)
```

Paper trading state is persisted in the `paper_account` and `paper_positions` Supabase tables.

### API Endpoints (FastAPI)

| Endpoint | Method | Description |
|---|---|---|
| `/api/analyze` | POST | Run DNA scoring on a ticker |
| `/api/portfolio` | GET | Current portfolio state |
| `/api/broker/status` | GET | Alpaca broker connection status |
| `/api/broker/account` | GET | Account equity & buying power |
| `/api/broker/order` | POST | Place a new order |
| `/api/broker/positions` | GET | Open positions |
| `/api/broker/close-position` | POST | Close a specific Alpaca position |
| `/api/broker/liquidate-all` | POST | Liquidate all Alpaca positions |
| `/api/broker/paper/account` | GET | Paper trading account balance |
| `/api/broker/paper/positions` | GET | Open paper positions |
| `/api/broker/paper/history` | GET | Closed paper trade history |
| `/api/broker/paper/sell` | POST | Manual paper position liquidation |
| `/api/broker/arm` | POST | Toggle SYSTEM_ARMED auto-trade flag |
| `/api/validate_candidates` | POST | Batch-validate candidate tickers |
| `/api/strategy/stats` | GET | Strategy performance statistics |
| `/ws/pulse` | WebSocket | Live market data stream |

---

## CI/CD

GitHub Actions (`python-ci.yml`) runs on every push or PR to `main` that touches `python_engine/**`:

- **Lint**: `flake8` checks for syntax errors and undefined names
- **Format**: `black` formatting validation
- **Import check**: Verifies FastAPI, Alpaca, Supabase, and pandas are importable
- **Tests**: `pytest` suite

---

## Disclaimer

> This system contains zero AI-generated predictions. All signals are derived from mathematical models applied to publicly available market data. **This is not financial advice.** Past backtest performance does not guarantee future results. Live trading involves real financial risk. Use `APCA_PAPER=true` until you have thoroughly validated the system's behavior on your own data.
