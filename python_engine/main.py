"""
MuzeStock.Lab - Python Technical Analysis Engine
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import yfinance as yf
import pandas as pd
import ta

app = FastAPI(
    title="MuzeStock Technical Analysis API",
    description="Python-based technical analysis engine for MuzeStock.Lab",
    version="1.0.0",
)

# CORS 미들웨어 설정 (모든 도메인 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    ticker: str
    period: str = "1mo"  # Default: 1 month


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
    signal: str  # "BUY", "SELL", "HOLD"
    reasoning: str


@app.get("/")
def root():
    return {"message": "MuzeStock Technical Analysis Engine is running!"}


@app.post("/api/analyze", response_model=TechnicalIndicators)
def analyze_stock(request: AnalyzeRequest):
    """
    주어진 종목의 기술적 지표(RSI, 이동평균선, MACD)를 계산합니다.
    """
    try:
        # 1. yfinance로 주가 데이터 가져오기
        ticker = yf.Ticker(request.ticker)
        df = ticker.history(period=request.period)

        if df.empty:
            raise HTTPException(
                status_code=404, detail=f"No data found for ticker: {request.ticker}"
            )

        # 2. 기술적 지표 계산 (ta 라이브러리 사용)
        close = df["Close"]

        # RSI (14일)
        rsi_indicator = ta.momentum.RSIIndicator(close=close, window=14)
        rsi_14 = rsi_indicator.rsi().iloc[-1] if len(close) >= 14 else None

        # SMA (20일, 50일)
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

        # EMA (12일, 26일)
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

        # MACD
        macd_indicator = ta.trend.MACD(close=close)
        macd = macd_indicator.macd().iloc[-1] if len(close) >= 26 else None
        macd_signal = (
            macd_indicator.macd_signal().iloc[-1] if len(close) >= 26 else None
        )

        # 3. 현재가
        current_price = close.iloc[-1]

        # 4. 매수/매도 시그널 생성
        signal = "HOLD"
        reasoning = []

        if rsi_14 is not None:
            if rsi_14 < 30:
                signal = "BUY"
                reasoning.append(f"RSI({rsi_14:.1f})가 과매도 구간(30 이하)입니다.")
            elif rsi_14 > 70:
                signal = "SELL"
                reasoning.append(f"RSI({rsi_14:.1f})가 과매수 구간(70 이상)입니다.")
            else:
                reasoning.append(f"RSI({rsi_14:.1f})는 중립 구간입니다.")

        if sma_20 is not None and sma_50 is not None:
            if sma_20 > sma_50:
                reasoning.append("20일 이동평균선이 50일선 위에 있어 상승 추세입니다.")
            else:
                reasoning.append(
                    "20일 이동평균선이 50일선 아래에 있어 하락 추세입니다."
                )

        if macd is not None and macd_signal is not None:
            if macd > macd_signal:
                reasoning.append(
                    "MACD가 시그널선 위로 골든크로스 발생 가능성이 있습니다."
                )
            else:
                reasoning.append("MACD가 시그널선 아래로 데드크로스 가능성이 있습니다.")

        return TechnicalIndicators(
            ticker=request.ticker.upper(),
            period=request.period,
            current_price=round(current_price, 2),
            rsi_14=round(rsi_14, 2) if rsi_14 is not None else None,
            sma_20=round(sma_20, 2) if sma_20 is not None else None,
            sma_50=round(sma_50, 2) if sma_50 is not None else None,
            ema_12=round(ema_12, 2) if ema_12 is not None else None,
            ema_26=round(ema_26, 2) if ema_26 is not None else None,
            macd=round(macd, 4) if macd is not None else None,
            macd_signal=round(macd_signal, 4) if macd_signal is not None else None,
            signal=signal,
            reasoning=" ".join(reasoning),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
