import asyncio
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async
from datetime import datetime
from db_manager import DBManager
from news_manager import NewsManager
import yfinance as yf
import ta
import pandas as pd
from sklearn.ensemble import IsolationForest
import random


class FinvizHunter:
    def __init__(self):
        self.db = DBManager()
        self.news = NewsManager()
        self.user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"

        # S&P 500 등 기준 유니버스 (Anomaly Hunting용 기본 풀)
        self.base_universe = [
            "AAPL",
            "MSFT",
            "GOOGL",
            "AMZN",
            "NVDA",
            "META",
            "TSLA",
            "BRK-B",
            "JNJ",
            "V",
            "JPM",
            "PG",
            "UNH",
            "HD",
            "MA",
            "DIS",
            "PYPL",
            "VZ",
            "ADBE",
            "NFLX",
            "INTC",
            "CMCSA",
            "PFE",
            "CSCO",
            "PEP",
            "KO",
            "MRK",
            "ABT",
            "CRM",
            "AVGO",
            "COST",
            "T",
            "WMT",
            "MCD",
            "MDT",
            "NKE",
            "TXN",
            "HON",
            "UNP",
            "QCOM",
        ]

    def get_discovery_mode(self):
        day = datetime.now().weekday()  # 0: Mon, 6: Sun
        modes = [
            {
                "name": "🚀 모멘텀 폭발 (상승 추세 + 거래량)",
                "url": "https://finviz.com/screener.ashx?v=111&f=ta_perf_52wup,ta_relvol_o1.5,ta_volatility_mo3&o=-change",
            },  # Mon
            {
                "name": "🏛️ 기관 매집 (기관 비중 10% 이상 + 거래량 상위)",
                "url": "https://finviz.com/screener.ashx?v=111&f=sh_instown_o10,ta_relvol_o1&o=-volume",
            },  # Tue
            {
                "name": "💎 세력 매집 (기관 & 내부자 동반 매수)",
                "url": "https://finviz.com/screener.ashx?v=111&f=sh_insiderown_o5,sh_instown_o5&o=-volume",
            },  # Wed
            {
                "name": "🔥 숏 스퀴즈 후보 (높은 숏 비중 + 반등 시그널)",
                "url": "https://finviz.com/screener.ashx?v=111&f=sh_short_o15,ta_rsi_u40&o=-volume",
            },  # Thu
            {
                "name": "🌟 저평가 성장주 (P/E 20이하 + 매출 성장)",
                "url": "https://finviz.com/screener.ashx?v=111&f=fa_eps5y_pos,fa_pe_u20,fa_sales5y_pos&o=-volume",
            },  # Fri
            {
                "name": "🌊 과매도 반등 (RSI 바닥 탈출)",
                "url": "https://finviz.com/screener.ashx?v=111&f=ta_rsi_u30,ta_relvol_o1&o=-volume",
            },  # Sat
            {
                "name": "🎯 유동성 대장 (Rel Vol 2.0 이상 조용한 매집)",
                "url": "https://finviz.com/screener.ashx?v=111&f=ta_relvol_o2,ta_volatility_mo2&o=-volume",
            },  # Sun
        ]
        return modes[day]

    def _run_anomaly_hunter(self) -> list:
        """
        Track B: Isolation Forest를 이용한 비정상 수급/변동성 탐지 (Anomaly Hunter)
        """
        print("🕵️♂️ Starting Track B: Anomaly Hunter (Isolation Forest)...")
        data_records = []

        for ticker in self.base_universe:
            try:
                tk = yf.Ticker(ticker)
                hist = tk.history(period="3mo")
                if len(hist) < 30:
                    continue

                # 피처 엔지니어링 (다차원 데이터 구성)
                close_prices = hist["Close"]
                volumes = hist["Volume"]

                # 1. 20일 거래량 변화율
                vol_change = volumes.iloc[-5:].mean() / (
                    volumes.iloc[-20:-5].mean() + 1e-9
                )

                # 2. RSI (14일)
                rsi = ta.momentum.RSIIndicator(close_prices).rsi().iloc[-1]

                # 3. 일간 변동성 (최근 20일)
                returns = close_prices.pct_change().dropna()
                volatility = returns.tail(20).std()

                # 4. 가격 모멘텀 (20일)
                momentum = (close_prices.iloc[-1] / close_prices.iloc[-20]) - 1

                if (
                    not pd.isna(vol_change)
                    and not pd.isna(rsi)
                    and not pd.isna(volatility)
                    and not pd.isna(momentum)
                ):
                    data_records.append(
                        {
                            "ticker": ticker,
                            "vol_change": vol_change,
                            "rsi": rsi,
                            "volatility": volatility,
                            "momentum": momentum,
                        }
                    )
            except Exception as e:
                print(f"⚠️ Anomaly extraction failed for {ticker}: {e}")

        if len(data_records) < 10:
            print("⚠️ Not enough data for Anomaly Hunting.")
            return []

        df = pd.DataFrame(data_records)
        features = df[["vol_change", "rsi", "volatility", "momentum"]].values

        # Isolation Forest 모델 적용 (가장 이질적인 5% 추출)
        model = IsolationForest(contamination=0.05, random_state=42)
        model.fit(features)

        # -1은 이상치(Anomaly), 1은 정상(Normal)
        df["anomaly"] = model.predict(features)

        # 이상치로 판별된 종목 리스트 반환
        anomalies = df[df["anomaly"] == -1]

        results = []
        for _, row in anomalies.iterrows():
            results.append(
                {
                    "ticker": row["ticker"],
                    "sector": "Anomaly (AI Detected)",
                    "reason": f"Vol Change: {row['vol_change']:.2f}x, RSI: {row['rsi']:.1f}",
                }
            )

        print(f"🎯 Anomaly Hunter found {len(results)} outlier stocks.")
        return results

    async def _run_finviz_scraper(self) -> list:
        """
        Track A: 기존 Finviz 스크래핑 로직 (Trend Follower)
        """
        mode = self.get_discovery_mode()
        print(f"🚀 Track A Launched: [{mode['name']}]")
        results = []

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(user_agent=self.user_agent)
                page = await context.new_page()
                await stealth_async(page)

                print(f"🌐 Navigating to {mode['url']}")
                await page.goto(
                    mode["url"], wait_until="domcontentloaded", timeout=60000
                )

                try:
                    await page.wait_for_selector(
                        'table[width="100%"] tr[valign="top"]', timeout=15000
                    )
                except Exception as e:
                    print(f"⚠️ No results found or selector changed: {e}")
                    await browser.close()
                    return []

                stocks = await page.evaluate(
                    """() => {
                    const rows = Array.from(document.querySelectorAll('table[width="100%"] tr[valign="top"]'));
                    return rows.slice(0, 5).map(row => { // 5개로 축소하여 Anomaly와 합칠 여유 확보
                        const cells = row.querySelectorAll('td');
                        if (cells.length < 10) return null;
                        return {
                            ticker: cells[1].innerText.trim(),
                            sector: cells[3].innerText.trim(),
                            reason: "Finviz Screened"
                        };
                    }).filter(item => item !== null);
                }"""
                )
                results = stocks
                await browser.close()
                return results
        except Exception as e:
            print(f"❌ Scraper critical failure: {e}")
            return []

    async def scrape(self):
        print("⚙️ Starting Hybrid Quant Funnel (Dual-Track Stage 1)...")

        # 1. 듀얼 트랙 실행
        # Track A: Finviz (비동기)
        finviz_candidates = await self._run_finviz_scraper()

        # Track B: Isolation Forest (동기 연산이므로 asyncio.to_thread로 오프로드)
        anomaly_candidates = await asyncio.to_thread(self._run_anomaly_hunter)

        # 두 결과 병합 및 중복 제거
        combined_candidates = list(
            {c["ticker"]: c for c in finviz_candidates + anomaly_candidates}.values()
        )

        print(
            f"✅ Stage 1 Complete. Total Unique Candidates: {len(combined_candidates)}. Starting Deep Analysis..."
        )

        for stock in combined_candidates:
            ticker_symbol = stock["ticker"]
            print(f"\n🔍 Analyzing {ticker_symbol} [{stock.get('reason', '')}]...")

            # 1. Technical Indicators (using yfinance)
            try:
                # 지터(Jitter) 추가: 요청 간 랜덤 딜레이 스로틀링 (Rate Limit 방어)
                await asyncio.sleep(random.uniform(0.5, 1.5))

                tk = yf.Ticker(ticker_symbol)
                # I/O 블로킹 방지를 위해 to_thread 사용
                df = await asyncio.to_thread(tk.history, period="1mo")
                if df is None or df.empty:

                    continue

                price = df["Close"].iloc[-1]
                change = (
                    (df["Close"].iloc[-1] / df["Close"].iloc[-2] - 1) * 100
                    if len(df) > 1
                    else 0
                )
                volume = int(df["Volume"].iloc[-1])

                rsi = ta.momentum.RSIIndicator(close=df["Close"]).rsi().iloc[-1]
                indicators_summary = (
                    f"Price: ${price:.2f}, RSI: {rsi:.1f}, Change: {change:.2f}%"
                )
            except Exception as e:
                print(f"⚠️ Failed to get technicals for {ticker_symbol}: {e}")
                continue

            # 2. Fetch News
            headlines = self.news.fetch_company_news(ticker_symbol)

            # 3. AI Deep Analysis
            ai_context_ext = (
                f"Detection Source: {stock.get('reason', 'Unknown')}. \n"
                + indicators_summary
            )

            ai_input = {
                "ticker": ticker_symbol,
                "price": price,
                "change": f"{change:.2f}%",
                "indicators": ai_context_ext,
                "news": headlines,
            }
            ai_result = {
                "tags": [ticker_symbol, "QUANT"],
                "bull_case": "자동 분석 기능 비활성화 (순수 퀀트 모드)",
                "bear_case": "자동 분석 기능 비활성화 (순수 퀀트 모드)",
                "reasoning_ko": "OpenAI 모듈이 제거되어 퀀트 지표 기반으로만 탐지되었습니다.",
            }
            # 4. Auto Backtest (1년 RSI 전략)
            from backtester import run_backtest

            backtest_result = await asyncio.to_thread(
                run_backtest, ticker_symbol, period="1y"
            )
            backtest_return = None
            if "error" not in backtest_result:
                backtest_return = backtest_result.get("total_return_pct", 0)
                print(f"📈 Backtest: {ticker_symbol} → {backtest_return:.2f}% (1Y RSI)")
            else:
                print(
                    f"⚠️ Backtest skipped for {ticker_symbol}: {backtest_result.get('error')}"
                )

            # 5. Save to DB
            tags_str = " ".join(ai_result.get("tags", []))
            ai_summary_text = (f"{tags_str}\n\n" if tags_str else "") + (
                f"🐂 Bull: {ai_result.get('bull_case')}\n"
                f"🐻 Bear: {ai_result.get('bear_case')}\n\n"
                f"💡 {ai_result.get('reasoning_ko')}"
            )

            db_data = {
                "ticker": ticker_symbol,
                "sector": stock["sector"],
                "price": round(price, 2),
                "volume": str(volume),
                "change": f"{change:.2f}%",
                "dna_score": ai_result.get("dna_score", 50),
                "ai_summary": ai_summary_text,
                "backtest_return": backtest_return,
                "updated_at": datetime.now().isoformat(),
            }

            self.db.upsert_discovery(db_data)
            print(
                f"💾 Saved {ticker_symbol} (DNA: {db_data['dna_score']}, BT: {backtest_return}%)"
            )

            await asyncio.sleep(1)  # Be polite

        print("\n🎉 Hybrid Mission Complete.")


if __name__ == "__main__":
    hunter = FinvizHunter()
    asyncio.run(hunter.scrape())
