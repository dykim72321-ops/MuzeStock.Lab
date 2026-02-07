from fastapi import FastAPI, HTTPException, BackgroundTasks, Security, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from typing import Optional
import yfinance as yf
import ta
import os
from dotenv import load_dotenv
from scraper import FinvizHunter
from scraper import FinvizHunter
from db_manager import DBManager
import asyncio
from datetime import datetime
from supabase import create_client, Client
from openai import OpenAI
import pandas as pd
import numpy as np

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


@app.post("/api/analyze", response_model=TechnicalIndicators)
def analyze_stock(request: AnalyzeRequest):
    """지표 계산 API (기본 기능)"""
    try:
        ticker = yf.Ticker(request.ticker)
        df = ticker.history(period=request.period)
        if df.empty:
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

        return TechnicalIndicators(
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


@app.post("/api/backtest")
def backtest_strategy(request: BacktestRequest):
    """RSI 역추세 전략 백테스팅 실행"""
    try:
        result = run_backtest(
            ticker=request.ticker,
            period=request.period,
            initial_capital=request.initial_capital,
        )
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
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
    수학적 지표를 바탕으로 AI 투자 조언 생성 (한국어 고도화 버전)
    """
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    if not client.api_key:
        return "AI 리포트 생성을 위한 API 키가 설정되지 않았습니다."

    prompt = f"""
    당신은 전문 퀀트 애널리스트입니다. 아래 제공된 수학적 지표를 바탕으로 한국어로 투자 조언을 작성하세요.
    
    [데이터]
    - 종목: {data['ticker']}
    - RSI: {data['rsi']} (30 미만은 과매도)
    - MACD 상태: {data['signal']} ({data['strength']})
    - 연율화 변동성: {data['volatility_ann']}%
    - 켈리 공식 추천 비중: {data['recommended_weight']}%
    
    [지침]
    1. 현재 상태를 '수학적 근거'를 들어 요약하세요.
    2. 변동성과 켈리 비중을 근거로 리스크 관리 조언을 포함하세요.
    3. 어투는 전문적이고 신뢰감 있게 작성하세요.
    4. "※ 본 리포트는 데이터 분석 결과일 뿐, 투자의 절대적 권유가 아님을 명시합니다."라는 문구를 반드시 포함하세요.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "당신은 데이터에 기반한 냉철한 퀀트 투자 시스템의 분석 엔진입니다.",
                },
                {"role": "user", "content": prompt},
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"AI 리포트 생성 중 오류 발생: {str(e)}"


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
        payload["ai_report"] = generate_ai_investment_report(payload)
    else:
        payload["ai_report"] = (
            "시장 신호 강도가 보통(NORMAL)이며, 정밀 AI 분석 조건에 도달하지 않았습니다."
        )

    return payload


# --- REALTIME PULSE ENGINE (Start) ---

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
try:
    supabase: Client = (
        create_client(SUPABASE_URL, SUPABASE_KEY)
        if SUPABASE_URL and SUPABASE_KEY
        else None
    )
except:
    supabase = None


async def market_pulse_check():
    """10초마다 지표를 체크하여 Supabase Realtime으로 쏘는 심장박동 (의사결정 최적화 엔진)"""
    print("💓 Advanced Market Pulse Engine Started...")
    ticker_symbol = "TSLA"

    while True:
        try:
            tk = yf.Ticker(ticker_symbol)
            # 1분봉 데이터로 실시간성 확보 (충분한 계산을 위해 1일치 로드)
            hist = tk.history(period="1d", interval="1m")

            if not hist.empty and len(hist) > 30:  # MACD 26+9를 위해 충분한 데이터 필요
                # 고도화된 페이로드 생성
                payload = run_pulse_engine(ticker_symbol, hist)

                # 3. Supabase에 Push
                if supabase:
                    try:
                        supabase.table("realtime_signals").insert(payload).execute()
                        print(
                            f"📡 Pulse Sent: {ticker_symbol} RSI={payload['rsi']} "
                            f"MACD_Diff={payload['macd_diff']} ({payload['signal']} - {payload['strength']})"
                        )
                    except Exception as db_err:
                        print(f"⚠️ DB Push Error: {db_err}")
                else:
                    print(f"⚠️ Supabase credentials missing. Pulse simulated: {payload}")

        except Exception as e:
            print(f"❌ Pulse Error: {e}")

        await asyncio.sleep(10)  # 10초 대기


@app.on_event("startup")
async def start_pulse():
    # 백그라운드 태스크로 실행
    asyncio.create_task(market_pulse_check())


# --- REALTIME PULSE ENGINE (End) ---

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
