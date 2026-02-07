import yfinance as yf
import pandas as pd
import ta
import numpy as np


def run_backtest(ticker: str, period: str = "1y", initial_capital: float = 10000.0):
    """
    RSI 역추세 전략 백테스팅
    매수: RSI < 30
    매도: RSI > 70
    """
    # 1. 데이터 다운로드
    df = yf.download(ticker, period=period, progress=False)

    if df.empty:
        return {"error": "No data found"}

    # yfinance multi-index 처리 (최신 버전 대응)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    # 종가 데이터 추출 및 NaN 제거
    close_prices = df["Close"].copy()
    if isinstance(close_prices, pd.DataFrame):
        close_prices = close_prices.iloc[:, 0]

    # 2. 지표 계산 (ta 라이브러리 사용)
    df["RSI"] = ta.momentum.RSIIndicator(close_prices, window=14).rsi()

    # 3. 전략 로직 (Vectorized Backtesting)
    df["Signal"] = 0
    # RSI < 30 이면 매수 신호 (1), RSI > 70 이면 매도 신호 (-1)
    df.loc[df["RSI"] < 30, "Signal"] = 1
    df.loc[df["RSI"] > 70, "Signal"] = -1

    # 포지션 유지 (매수 신호 후에는 계속 1, 매도 신호 후에는 0)
    df["Position"] = df["Signal"].replace(0, np.nan).ffill().fillna(0)
    # 매도 신호(-1)를 0(현금 보유)으로 변경
    df["Position"] = df["Position"].replace(-1, 0)

    # 4. 수익률 계산
    # 일간 수익률 (종가 기준)
    df["Market_Return"] = df["Close"].pct_change()
    # 내 전략 수익률 = 시장 수익률 * 전날 포지션
    df["Strategy_Return"] = df["Market_Return"] * df["Position"].shift(1)

    # 5. 누적 수익금 계산 (Equity Curve)
    df["Benchmark_Equity"] = initial_capital * (1 + df["Market_Return"]).cumprod()
    df["Strategy_Equity"] = initial_capital * (1 + df["Strategy_Return"]).cumprod()

    # 6. 결과 정리 (JSON 변환용)
    result = []
    for date, row in df.iterrows():
        if pd.isna(row["Strategy_Equity"]):
            continue
        result.append(
            {
                "date": date.strftime("%Y-%m-%d"),
                "benchmark": round(float(row["Benchmark_Equity"]), 2),
                "strategy": round(float(row["Strategy_Equity"]), 2),
                "rsi": round(float(row["RSI"]), 2) if not pd.isna(row["RSI"]) else 0,
            }
        )

    # 최종 통계
    total_return = (
        (df["Strategy_Equity"].iloc[-1] - initial_capital) / initial_capital * 100
    )
    benchmark_return = (
        (df["Benchmark_Equity"].iloc[-1] - initial_capital) / initial_capital * 100
    )

    return {
        "ticker": ticker,
        "period": period,
        "initial_capital": initial_capital,
        "total_return_pct": round(float(total_return), 2),
        "benchmark_return_pct": round(float(benchmark_return), 2),
        "outperformance": round(float(total_return - benchmark_return), 2),
        "chart_data": result,
    }
