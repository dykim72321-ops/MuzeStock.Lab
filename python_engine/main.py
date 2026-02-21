from fastapi import (
    FastAPI,
    HTTPException,
    BackgroundTasks,
    Security,
    status,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from typing import Optional, List
import yfinance as yf
import ta
import os
from dotenv import load_dotenv
from scraper import FinvizHunter
from db_manager import DBManager
import asyncio
from datetime import datetime
from supabase import create_client, Client
import pandas as pd
import numpy as np
from cachetools import TTLCache
import requests_cache
import random
from webhook_manager import WebhookManager
from paper_engine import PaperTradingManager

# Realtime Engine용 캐시 세션 (15초 만료: 불필요한 중복 요청 방지)
yf_session = requests_cache.CachedSession('yfinance_main.cache', expire_after=15)
webhook = WebhookManager()
# PaperTradingManager 인스턴스 (Supabase가 초기화된 후 설정)
paper_engine = None



# .env 파일에서 환경변수 로드
# .env 파일에서 환경변수 로드 (Updated for Realtime Pulse) (Verified)
load_dotenv()

app = FastAPI(
    title="MuzeStock Technical Analysis API",
    description="Unified Python Platform for Stock Analysis & Discovery",
    version="2.1.0",
)

# Security Configuration
API_KEY_NAME = "X-Admin-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)


# --- Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


async def get_api_key(header_value: str = Security(api_key_header)):
    """ADMIN_SECRET_KEY 환경변수와 헤더 값을 비교하여 인증"""
    admin_key = os.getenv("ADMIN_SECRET_KEY")
    if not admin_key:
        # 보안을 위해 키가 설정되지 않은 경우 모든 요청 거부
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin secret key not configured on server",
        )

    if header_value == admin_key:
        return header_value

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="Could not validate credentials"
    )


# Global instances
db = DBManager()
hunter = FinvizHunter()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    ticker: str
    period: str = "1mo"


class TechnicalIndicators(BaseModel):
    ticker: str
    period: str
    current_price: float
    rsi_14: Optional[float] = None
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    ema_12: Optional[float] = None
    ema_26: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_diff: Optional[float] = None
    signal: str
    strength: str = "NORMAL"
    reasoning: str


@app.get("/")
def root():
    return {"message": "MuzeStock Unified Python Platform is running!"}


@app.websocket("/ws/pulse")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


analyze_cache = TTLCache(maxsize=100, ttl=900)


@app.get("/api/portfolio")
async def get_portfolio():
    """가상 계좌 잔고 및 보유 포지션 데이터 반환"""
    if not supabase:
        raise HTTPException(status_code=500, detail="DB connection not initialized")
    
    try:
        acc_task = asyncio.to_thread(supabase.table("paper_account").select("*").limit(1).execute)
        pos_task = asyncio.to_thread(supabase.table("paper_positions").select("*").execute)
        
        acc_res, pos_res = await asyncio.gather(acc_task, pos_task)
        
        acc = acc_res.data[0] if acc_res.data else {"total_assets": 100000.0, "cash_available": 100000.0}
        positions = pos_res.data
        
        invested_capital = sum([p["current_price"] * p["units"] for p in positions])
        # DB의 total_assets는 수동 업데이트 전까지 구식일 수 있으므로 여기서 동적으로 계산
        current_total = acc["cash_available"] + invested_capital
        
        return {
            "totalAssets": round(float(current_total), 2),
            "cashAvailable": round(float(acc["cash_available"]), 2),
            "investedCapital": round(float(invested_capital), 2),

            "dailyPnL": 0.0, # TODO: 실시간 손익 계산 로직 추가 가능
            "dailyPnLPct": 0.0,
            "positions": [
                {
                    "ticker": p["ticker"],
                    "status": p["status"],
                    "weight": round(p["weight"], 4),
                    "entryPrice": p["entry_price"],
                    "currentPrice": p["current_price"],
                    "tsThreshold": p["ts_threshold"],
                    "pnlPct": round((p["current_price"] / p["entry_price"] - 1) * 100, 2)
                }
                for p in positions
            ]
        }
    except Exception as e:
        print(f"❌ Portfolio Fetch Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze", response_model=TechnicalIndicators)
def analyze_stock(request: AnalyzeRequest):
    """지표 계산 API (기본 기능 - 인메모리 캐시)"""
    cache_key = f"{request.ticker}_{request.period}"
    if cache_key in analyze_cache:
        return analyze_cache[cache_key]

    try:
        ticker = yf.Ticker(request.ticker, session=yf_session)
        df = ticker.history(period=request.period)
        if df is None or df.empty:

            raise HTTPException(status_code=404, detail=f"No data for {request.ticker}")

        close = df["Close"]
        rsi = (
            ta.momentum.RSIIndicator(close=close).rsi().iloc[-1]
            if len(close) >= 14
            else None
        )
        sma_20 = (
            ta.trend.SMAIndicator(close=close, window=20).sma_indicator().iloc[-1]
            if len(close) >= 20
            else None
        )
        sma_50 = (
            ta.trend.SMAIndicator(close=close, window=50).sma_indicator().iloc[-1]
            if len(close) >= 50
            else None
        )
        ema_12 = (
            ta.trend.EMAIndicator(close=close, window=12).ema_indicator().iloc[-1]
            if len(close) >= 12
            else None
        )
        ema_26 = (
            ta.trend.EMAIndicator(close=close, window=26).ema_indicator().iloc[-1]
            if len(close) >= 26
            else None
        )
        macd_ind = ta.trend.MACD(close=close)
        macd = macd_ind.macd().iloc[-1] if len(close) >= 26 else None
        macd_signal = macd_ind.macd_signal().iloc[-1] if len(close) >= 26 else None

        current_price = close.iloc[-1]

        # Simple signal logic
        signal = "HOLD"
        reasoning = []
        if rsi and rsi < 30:
            signal, reasoning.append("RSI 과매도")
        elif rsi and rsi > 70:
            signal, reasoning.append("RSI 과매수")

        result = TechnicalIndicators(
            ticker=request.ticker.upper(),
            period=request.period,
            current_price=round(current_price, 2),
            rsi_14=round(rsi, 2) if rsi else None,
            sma_20=round(sma_20, 2) if sma_20 else None,
            sma_50=round(sma_50, 2) if sma_50 else None,
            ema_12=round(ema_12, 2) if ema_12 else None,
            ema_26=round(ema_26, 2) if ema_26 else None,
            macd=round(macd, 4) if macd else None,
            macd_signal=round(macd_signal, 4) if macd_signal else None,
            signal=signal,
            reasoning=" ".join(reasoning) if reasoning else "지표 분석 완료",
        )
        analyze_cache[cache_key] = result
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/hunt")
async def trigger_hunt(
    background_tasks: BackgroundTasks, api_key: str = Security(get_api_key)
):
    """수동 수집 트리거 (인증 필수, 백그라운드 실행)"""
    background_tasks.add_task(hunter.scrape)
    return {"message": "🚀 Hunter Bot has been launched in the background."}


@app.get("/api/discoveries")
def get_recent_discoveries(limit: int = 10, sort_by: str = "updated_at"):
    """최근 발견된 종목 조회 (sort_by: 'updated_at' 또는 'performance')"""
    data = db.get_latest_discoveries(limit, sort_by)
    return data


# Backtesting endpoint
from backtester import run_backtest


class BacktestRequest(BaseModel):
    ticker: str
    period: str = "1y"
    initial_capital: float = 10000.0


backtest_cache = TTLCache(maxsize=100, ttl=900)


@app.post("/api/backtest")
def backtest_strategy(request: BacktestRequest):
    """RSI 역추세 전략 백테스팅 실행"""
    cache_key = f"{request.ticker}_{request.period}_{request.initial_capital}"
    if cache_key in backtest_cache:
        return backtest_cache[cache_key]

    try:
        result = run_backtest(
            ticker=request.ticker,
            period=request.period,
            initial_capital=request.initial_capital,
        )
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        backtest_cache[cache_key] = result
        return result
    except HTTPException:
        # HTTPException은 그대로 전달 (404 등)
        raise
    except Exception as e:
        import traceback

        error_msg = f"Backtest failed: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


def calculate_advanced_signals(df: pd.DataFrame):
    """
    RSI와 MACD를 결합한 고도화된 신호 엔진
    """
    # 1. RSI 계산 (14일)
    df["RSI"] = ta.momentum.RSIIndicator(df["Close"], window=14).rsi()

    # 2. MACD 계산 (12, 26, 9)
    macd_indicator = ta.trend.MACD(
        df["Close"], window_slow=26, window_fast=12, window_sign=9
    )
    df["MACD_Line"] = macd_indicator.macd()
    df["MACD_Signal"] = macd_indicator.macd_signal()
    df["MACD_Diff"] = macd_indicator.macd_diff()  # Histogram

    # 3. 전략적 합치 (Confluence) 로직
    # Strong Buy: RSI < 35 AND MACD Golden Cross
    df["Strong_Buy"] = (
        (df["RSI"] < 35) & (df["MACD_Diff"] > 0) & (df["MACD_Diff"].shift(1) <= 0)
    )

    # Strong Sell: RSI > 65 AND MACD Dead Cross
    df["Strong_Sell"] = (
        (df["RSI"] > 65) & (df["MACD_Diff"] < 0) & (df["MACD_Diff"].shift(1) >= 0)
    )

    return df


def calculate_position_sizing(
    df: pd.DataFrame,
    win_rate: float = 0.55,
    profit_ratio: float = 2.0,
    target_vol: float = 0.15,
    kelly_fraction: float = 0.5,
):
    """
    1단계(변동성 조절)와 3단계(켈리 공식)를 결합한 포지션 사이징 엔진
    """
    # --- [Step 1] 변동성 조절 (Volatility Targeting) ---
    # 일간 로그 수익률 계산
    df["log_return"] = np.log(df["Close"] / df["Close"].shift(1))

    # 최근 20일 표준편차 계산 및 연율화
    daily_vol = df["log_return"].rolling(window=20).std().iloc[-1]
    ann_vol = daily_vol * np.sqrt(252)

    # 변동성 기반 비중 (시장이 과열되면 비중 축소)
    vol_weight = target_vol / (ann_vol + 1e-9)

    # --- [Step 2 & 3] 켈리 공식 (Kelly Criterion) ---
    p = win_rate
    q = 1 - p
    b = profit_ratio

    kelly_f = (b * p - q) / b if b > 0 else 0

    # 보수적 운용을 위해 kelly_fraction 적용
    optimal_kelly = max(0, kelly_f) * kelly_fraction

    # --- [Step 4] 최종 결합 및 제한 ---
    final_weight = vol_weight * optimal_kelly
    final_weight = min(final_weight, 1.0)

    return {
        "annualized_volatility": round(float(ann_vol), 4),
        "vol_weight": round(float(vol_weight), 4),
        "kelly_f": round(float(kelly_f), 4),
        "recommended_weight": round(float(final_weight) * 100, 2),
        "is_safe_to_trade": final_weight > 0,
    }


def generate_ai_investment_report(data: dict):
    """
    규칙 기반(Deterministic) 동적 리포트 생성 엔진. (OpenAI API 완전 분리)
    """
    rsi = data.get("rsi", 50.0)
    signal = data.get("signal", "HOLD")
    vol = data.get("volatility_ann", 0.0)
    rec_weight = data.get("recommended_weight", 0.0)

    report = []

    # 1. 시그널 요약
    if signal == "BUY":
        report.append(
            f"📈 [초강력 매수 시그널] RSI {rsi} 및 MACD 상향 돌파가 확인되었습니다."
        )
    elif signal == "SELL":
        report.append(f"📉 [위험 구간] RSI {rsi} 및 MACD 하방 압력 가중.")
    else:
        report.append(f"⚖️ [관망] 뚜렷한 추세가 관찰되지 않습니다 (RSI: {rsi}).")

    # 2. 리스크 관리 조언
    report.append(
        f"현재 타겟의 연율화 변동성은 {vol}% 수준이며, 켈리 공식(Kelly Criterion) 기반 최대 안전 권장 비중은 {rec_weight}%입니다."
    )

    # 3. 추가 조언 및 면책 조항
    report.append(
        "※ 본 리포트는 순수 수학적 알고리즘 기반 분석 결과일 뿐, 투자의 절대적 권유가 아님을 명시합니다."
    )

    return "\n".join(report)


def run_pulse_engine(ticker: str, df_raw: pd.DataFrame):
    """
    의사결정 최적화 엔진: 지표 + 포지션 사이징 + AI 결합
    """
    # 1. 기술적 분석
    df = calculate_advanced_signals(df_raw)
    latest = df.iloc[-1]

    # 2. 포지션 사이징 (변동성 조절 + 켈리)
    sizing = calculate_position_sizing(df_raw)

    signal_type = "HOLD"
    if latest["Strong_Buy"]:
        signal_type = "BUY"
    elif latest["Strong_Sell"]:
        signal_type = "SELL"

    strength = "STRONG" if latest["Strong_Buy"] or latest["Strong_Sell"] else "NORMAL"

    payload = {
        "ticker": ticker.upper(),
        "rsi": round(float(latest["RSI"]), 2) if not pd.isna(latest["RSI"]) else None,
        "macd_line": (
            round(float(latest["MACD_Line"]), 4)
            if not pd.isna(latest["MACD_Line"])
            else None
        ),
        "macd_signal": (
            round(float(latest["MACD_Signal"]), 4)
            if not pd.isna(latest["MACD_Signal"])
            else None
        ),
        "macd_diff": (
            round(float(latest["MACD_Diff"]), 4)
            if not pd.isna(latest["MACD_Diff"])
            else None
        ),
        "volatility_ann": round(sizing["annualized_volatility"] * 100, 2),
        "vol_weight": sizing["vol_weight"],
        "kelly_f": sizing["kelly_f"],
        "recommended_weight": sizing["recommended_weight"],
        "price": round(float(latest["Close"]), 2),
        "signal": signal_type,
        "strength": strength,
        "timestamp": datetime.now().isoformat(),
    }

    # 3. AI 리포트 생성 (STRONG 신호일 때만 생성하여 비용/속도 최적화)
    if strength == "STRONG":
        # AIAnalyzer의 분석 로직 연계 (메모리 내 AIAnalyzer 인스턴스 활용 권장하나, 여기선 직접 리포트 생성 로직 활용)
        payload["ai_report"] = generate_ai_investment_report(payload)
        # 프론트엔드 QuantSignalCard를 위한 구조화된 데이터 추가
        payload["ai_metadata"] = {
            "dna_score": (
                85 if signal_type == "BUY" else (40 if signal_type == "SELL" else 60)
            ),
            "bull_case": (
                "수학적 지표상 반등 모멘텀 임계치 도달"
                if signal_type == "BUY"
                else "현재 구간 하방 방어선 구축 중"
            ),
            "bear_case": (
                "매물 출회 가능성 및 시장 변동성 리스크"
                if signal_type == "SELL"
                else "상단 저항선 돌파 에너지 필요"
            ),
            "reasoning_ko": payload["ai_report"],
            "tags": [ticker.upper(), signal_type, strength],
        }
    else:
        payload["ai_report"] = (
            "시장 신호 강도가 보통(NORMAL)이며, 정밀 AI 분석 조건에 도달하지 않았습니다."
        )
        payload["ai_metadata"] = None

    return payload


# --- REALTIME PULSE ENGINE (Start) ---

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_KEY")
    or os.getenv("VITE_SUPABASE_SERVICE_ROLE_KEY")
)
try:
    supabase: Client = (
        create_client(SUPABASE_URL, SUPABASE_KEY)
        if SUPABASE_URL and SUPABASE_KEY
        else None
    )
    if supabase:
        paper_engine = PaperTradingManager(supabase)
except:
    supabase = None



async def process_ticker_pulse(ticker_symbol: str):
    try:
        # 지터(Jitter): 실시간 병렬 요청 분산 
        await asyncio.sleep(random.uniform(0.1, 1.0))

        # 1. 1분봉 데이터로 실시간성 확보 (충분한 계산을 위해 1일치 로드) - 별도 스레드에서 I/O 실행
        tk = yf.Ticker(ticker_symbol, session=yf_session)
        hist = await asyncio.to_thread(tk.history, period="1d", interval="1m")

        if hist is not None and not hist.empty and len(hist) > 30:  # MACD 26+9를 위해 충분한 데이터 필요
            # 2. 고도화된 페이로드 생성 (수학적 및 AI 로직을 스레드로 분리하여 이벤트 루프 보호)
            payload = await asyncio.to_thread(run_pulse_engine, ticker_symbol, hist)

            # 3. WebSocket 프론트엔드 실시간 전송
            await manager.broadcast(payload)

            # 4. Supabase DB 전송 (비동기 I/O 오프로드)
            if supabase:
                try:
                    await asyncio.to_thread(
                        supabase.table("realtime_signals").insert(payload).execute
                    )
                    print(
                        f"📡 Pulse Sent: {ticker_symbol} RSI={payload.get('rsi')} "
                        f"({payload.get('signal')} - {payload.get('strength')})"
                    )

                    # 5. Discord Webhook 전송 (강력한 신호일 때만 모바일 알림 푸시)
                    if payload.get("strength") == "STRONG":
                        color = 0x2ecc71 if payload.get("signal") == "BUY" else 0xe74c3c
                        action = "🟢 STRONG BUY" if payload.get("signal") == "BUY" else "🔴 STRONG SELL / SCALE_OUT"
                        title = f"[MuzeStock Pulse] {ticker_symbol} {action}"
                        desc = f"현재가: ${payload.get('price'):.2f} | RSI: {payload.get('rsi')}\n\n💡 {payload.get('ai_report', '')}"
                        await webhook.send_alert(title=title, description=desc, color=color)

                    # 6. Paper Trading 자동 실행 (v2.0)
                    if paper_engine:
                        await paper_engine.process_signal(
                            ticker=ticker_symbol,
                            price=payload.get("price"),
                            signal_type=payload.get("signal"),
                            strength=payload.get("strength"),
                            rsi=payload.get("rsi"),
                            ai_report=payload.get("ai_report", "")
                        )

                except Exception as db_err:

                    print(f"⚠️ DB Push Error (Realtime Signal): {db_err}")
            else:
                print(
                    f"⚠️ Supabase credentials missing (Pulse Engine). Pulse simulated for {ticker_symbol}"
                )
    except Exception as e:
        print(f"❌ Pulse Error for {ticker_symbol}: {e}")


async def market_pulse_check():
    """10초마다 여러 종목의 지표를 병렬로 체크하여 실시간 방출 (논블로킹 의사결정 엔진)"""
    print("💓 Advanced Market Pulse Engine Started...")

    while True:
        try:
            # DB에서 관리중인 리스트 로드 (별도 스레드 오프로드)
            active_tickers = await asyncio.to_thread(db.get_active_tickers, limit=5)

            # 티커들을 동시에 비동기 처리
            tasks = [process_ticker_pulse(ticker) for ticker in active_tickers]
            if tasks:
                await asyncio.gather(*tasks)

        except Exception as e:
            print(f"❌ Pulse Engine Core Error: {e}")

        await asyncio.sleep(10)  # 10초 대기


@app.on_event("startup")
async def start_pulse():
    # 백그라운드 태스크로 실행
    asyncio.create_task(market_pulse_check())


# --- REALTIME PULSE ENGINE (End) ---

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
