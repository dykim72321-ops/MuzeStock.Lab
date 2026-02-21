import yfinance as yf
import pandas as pd
import numpy as np
import ta
import warnings

warnings.filterwarnings("ignore")


def run_backtest(ticker: str, period: str = "1y", initial_capital: float = 10000.0):
    """
    v4 펄스 엔진 백테스트 (State Machine + 3/4 Kelly + Target Volatility 0.30)
    - 진입: RSI < 45 + MACD 히스토그램 기울기 개선 (우량주 눌림목 포착)
    - 청산 A: 트레일링 스탑 (최고가 대비 -10%)
    - 청산 B: 수익보전 룰 (+5% 달성 후 손절선 +1%로 상향)
    - 청산 C: RSI 60 돌파 시 50% 선제 분할 익절
    - 청산 D: RSI > 65 AND MACD 기울기 꺾임 전량 청산
    프론트엔드 Recharts 렌더링용 JSON 반환
    """
    # 1. 데이터 다운로드 및 전처리
    df = yf.download(ticker, period=period, progress=False)

    if df.empty:
        return {"error": "No data found"}

    # yfinance multi-index 대응
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df = df[["Close"]].copy()
    if isinstance(df["Close"], pd.DataFrame):
        df["Close"] = df["Close"].iloc[:, 0]

    if len(df) < 50:
        return {"error": "Not enough data (need 50+ bars)"}

    # 2. 기술적 지표 계산
    df["RSI"] = ta.momentum.RSIIndicator(df["Close"], window=14).rsi()
    macd = ta.trend.MACD(df["Close"], window_slow=26, window_fast=12, window_sign=9)
    df["MACD_Diff"] = macd.macd_diff()

    # 3. 전략 시그널 (MOMENTUM 모드)
    #    매수: RSI < 45 (우량주 눌림목) + MACD 기울기 개선 시작
    #    매도: RSI > 65 AND MACD 기울기 꺾임 (추세 홀딩 후 과열 청산)
    df["Strong_Buy"] = (df["RSI"] < 45) & (df["MACD_Diff"] > df["MACD_Diff"].shift(1))
    df["Strong_Sell"] = (df["RSI"] > 65) & (df["MACD_Diff"] < df["MACD_Diff"].shift(1))

    # 4. 포지션 사이징 파라미터 (Target Vol 0.30 + 3/4 Kelly)
    TARGET_VOL = 0.30
    KELLY_FRACTION = 0.75
    BASE_KELLY = (2.0 * 0.55 - 0.45) / 2.0  # = 0.325
    OPTIMAL_KELLY = max(0.0, BASE_KELLY) * KELLY_FRACTION  # = 0.24375

    df["log_return"] = np.log(df["Close"] / df["Close"].shift(1))
    df["ann_vol"] = df["log_return"].rolling(window=20).std() * np.sqrt(252)
    df["vol_weight"] = TARGET_VOL / (df["ann_vol"] + 1e-9)
    df["Weight"] = (df["vol_weight"] * OPTIMAL_KELLY).clip(upper=1.0).fillna(0)

    # 벡터 추출 (루프 성능 최적화)
    close_arr = df["Close"].values
    rsi_arr = df["RSI"].values
    buy_arr = df["Strong_Buy"].values
    sell_arr = df["Strong_Sell"].values
    weight_arr = df["Weight"].values

    # 5. State Machine — 포지션 추적
    positions = []
    strategy_returns = []

    position = 0.0
    entry_price = 0.0
    highest_price = 0.0
    scaled_out = False
    prev_position = 0.0
    prev_weight = 0.0

    for i in range(len(df)):
        cp = float(close_arr[i])
        rsi = float(rsi_arr[i]) if not np.isnan(rsi_arr[i]) else 50.0
        strong_buy = bool(buy_arr[i])
        strong_sell = bool(sell_arr[i])
        kelly_w = float(weight_arr[i]) if not np.isnan(weight_arr[i]) else 0.0

        if position == 0.0:
            # ── 진입
            if strong_buy and not np.isnan(cp):
                position = 1.0
                entry_price = cp
                highest_price = cp
                scaled_out = False
        else:
            # 최고가 갱신
            if cp > highest_price:
                highest_price = cp

            # ── 청산 A: 트레일링 스탑 (최고가 대비 -10%)
            ts_threshold = highest_price * 0.90
            # ── 청산 B: 수익보전 룰 — +5% 이상 이익 달성 시 손절선 +1%로 상향
            if highest_price > entry_price * 1.05:
                ts_threshold = max(ts_threshold, entry_price * 1.01)

            if cp < ts_threshold:
                position = 0.0
                entry_price = 0.0
            elif strong_sell:
                # ── 청산 D: 정규 매도 (RSI 과열 + MACD 꺾임)
                position = 0.0
                entry_price = 0.0
            elif position == 1.0 and rsi > 60 and not scaled_out:
                # ── 청산 C: RSI 60 돌파 시 50% 선제 분할 익절
                position = 0.5
                scaled_out = True

        # 일간 전략 수익률 (전 봉 포지션 × 켈리 비중 × 당일 등락)
        if i == 0:
            sr = 0.0
        else:
            prev_cp = float(close_arr[i - 1])
            mr = (cp - prev_cp) / prev_cp if prev_cp != 0 else 0.0
            sr = mr * prev_position * prev_weight

        strategy_returns.append(sr)
        positions.append(position)
        prev_position = position
        prev_weight = kelly_w

    df["Position"] = positions
    df["Strategy_Return"] = strategy_returns
    df["Market_Return"] = df["Close"].pct_change().fillna(0)

    # 6. 누적 자산 곡선 (Equity Curve)
    df["Benchmark_Equity"] = initial_capital * (1 + df["Market_Return"]).cumprod()
    df["Strategy_Equity"] = initial_capital * (1 + df["Strategy_Return"]).cumprod()

    # 7. MDD 계산
    rolling_max = df["Strategy_Equity"].cummax()
    drawdown = (df["Strategy_Equity"] - rolling_max) / rolling_max
    mdd = float(drawdown.min() * 100)

    # 8. React / Recharts 포맷으로 변환
    chart_data = []
    for date, row in df.iterrows():
        if pd.isna(row["Strategy_Equity"]):
            continue
        chart_data.append(
            {
                "date": date.strftime("%Y-%m-%d"),
                "benchmark": round(float(row["Benchmark_Equity"]), 2),
                "strategy": round(float(row["Strategy_Equity"]), 2),
                "rsi": round(float(row["RSI"]), 2) if not pd.isna(row["RSI"]) else 0,
            }
        )

    total_return_pct = (
        (df["Strategy_Equity"].iloc[-1] - initial_capital) / initial_capital * 100
    )
    benchmark_return_pct = (
        (df["Benchmark_Equity"].iloc[-1] - initial_capital) / initial_capital * 100
    )

    return {
        "ticker": ticker,
        "period": period,
        "initial_capital": initial_capital,
        "engine_version": "v4",
        "strategy": "MOMENTUM (RSI<45 + MACD Slope + State Machine Exit)",
        "total_return_pct": round(float(total_return_pct), 2),
        "benchmark_return_pct": round(float(benchmark_return_pct), 2),
        "outperformance": round(float(total_return_pct - benchmark_return_pct), 2),
        "mdd_pct": round(mdd, 2),
        "chart_data": chart_data,
    }
