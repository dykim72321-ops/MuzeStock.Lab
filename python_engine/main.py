from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import yfinance as yf
import pandas as pd
import ta
import asyncio
from scraper import FinvizHunter
from db_manager import DBManager

app = FastAPI(
    title="MuzeStock Technical Analysis API",
    description="Unified Python Platform for Stock Analysis & Discovery",
    version="2.0.0",
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
    signal: str 
    reasoning: str

@app.get("/")
def root():
    return {"message": "MuzeStock Unified Python Platform is running!"}

@app.post("/api/analyze", response_model=TechnicalIndicators)
def analyze_stock(request: AnalyzeRequest):
    """지표 계산 API (기존 기능 유지)"""
    try:
        ticker = yf.Ticker(request.ticker)
        df = ticker.history(period=request.period)
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data for {request.ticker}")
        
        close = df["Close"]
        rsi = ta.momentum.RSIIndicator(close=close).rsi().iloc[-1] if len(close) >= 14 else None
        sma_20 = ta.trend.SMAIndicator(close=close, window=20).sma_indicator().iloc[-1] if len(close) >= 20 else None
        sma_50 = ta.trend.SMAIndicator(close=close, window=50).sma_indicator().iloc[-1] if len(close) >= 50 else None
        ema_12 = ta.trend.EMAIndicator(close=close, window=12).ema_indicator().iloc[-1] if len(close) >= 12 else None
        ema_26 = ta.trend.EMAIndicator(close=close, window=26).ema_indicator().iloc[-1] if len(close) >= 26 else None
        macd_ind = ta.trend.MACD(close=close)
        macd = macd_ind.macd().iloc[-1] if len(close) >= 26 else None
        macd_signal = macd_ind.macd_signal().iloc[-1] if len(close) >= 26 else None
        
        current_price = close.iloc[-1]
        
        # Simple signal logic
        signal = "HOLD"
        reasoning = []
        if rsi and rsi < 30: signal, reasoning.append("RSI 과매도")
        elif rsi and rsi > 70: signal, reasoning.append("RSI 과매수")
        
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
            reasoning=" ".join(reasoning) if reasoning else "지표 분석 완료"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/hunt")
async def trigger_hunt(background_tasks: BackgroundTasks):
    """수동 수집 트리거 (백그라운드 실행)"""
    background_tasks.add_task(hunter.scrape)
    return {"message": "🚀 Hunter Bot has been launched in the background."}

@app.get("/api/discoveries")
def get_recent_discoveries(limit: int = 10):
    """최근 발견된 종목 조회"""
    data = db.get_latest_discoveries(limit)
    return data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
