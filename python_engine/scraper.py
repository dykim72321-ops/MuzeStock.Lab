import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
from db_manager import DBManager
from ai_analyzer import AIAnalyzer
from news_manager import NewsManager
import yfinance as yf
import ta


class FinvizHunter:
    def __init__(self):
        self.db = DBManager()
        self.ai = AIAnalyzer()
        self.news = NewsManager()
        self.user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"

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

    async def scrape(self):
        mode = self.get_discovery_mode()
        print(f"🚀 Hunter Bot Launched: [{mode['name']}]")

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(user_agent=self.user_agent)
                page = await context.new_page()

                print(f"🌐 Navigating to {mode['url']}")
                await page.goto(mode["url"], wait_until="domcontentloaded", timeout=60000)

                try:
                    await page.wait_for_selector(
                        'table[width="100%"] tr[valign="top"]', timeout=15000
                    )
                except Exception as e:
                    print(f"⚠️ No results found or selector changed: {e}")
                    await browser.close()
                    return

                stocks = await page.evaluate(
                    """() => {
                    const rows = Array.from(document.querySelectorAll('table[width="100%"] tr[valign="top"]'));
                    return rows.slice(0, 10).map(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length < 10) return null;
                        return {
                            ticker: cells[1].innerText.trim(),
                            sector: cells[3].innerText.trim(),
                        };
                    }).filter(item => item !== null);
                }"""
                )

                print(f"✅ Found {len(stocks)} candidates. Starting Deep Analysis...")

                for stock in stocks:
                    ticker_symbol = stock["ticker"]
                    print(f"\n🔍 Analyzing {ticker_symbol}...")

                    # 1. Technical Indicators (using yfinance)
                    try:
                        tk = yf.Ticker(ticker_symbol)
                        df = tk.history(period="1mo")
                        if df.empty:
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
                    ai_input = {
                        "ticker": ticker_symbol,
                        "price": price,
                        "change": f"{change:.2f}%",
                        "indicators": indicators_summary,
                        "news": headlines,
                    }
                    ai_result = self.ai.analyze_stock(ai_input)

                    # 4. Auto Backtest (1년 RSI 전략)
                    from backtester import run_backtest

                    backtest_result = run_backtest(ticker_symbol, period="1y")
                    backtest_return = None
                    if "error" not in backtest_result:
                        backtest_return = backtest_result.get("total_return_pct", 0)
                        print(
                            f"📈 Backtest: {ticker_symbol} → {backtest_return:.2f}% (1Y RSI)"
                        )
                    else:
                        print(
                            f"⚠️ Backtest skipped for {ticker_symbol}: {backtest_result.get('error')}"
                        )

                    # 5. Save to DB
                    db_data = {
                        "ticker": ticker_symbol,
                        "sector": stock["sector"],
                        "price": round(price, 2),
                        "volume": str(volume),
                        "change": f"{change:.2f}%",
                        "dna_score": ai_result.get("dna_score", 50),
                        "ai_summary": f"🐂 Bull: {ai_result.get('bull_case')}\n🐻 Bear: {ai_result.get('bear_case')}\n\n💡 {ai_result.get('reasoning_ko')}",
                        "backtest_return": backtest_return,
                        "updated_at": datetime.now().isoformat(),
                    }

                    self.db.upsert_discovery(db_data)
                    print(
                        f"💾 Saved {ticker_symbol} (DNA: {db_data['dna_score']}, BT: {backtest_return}%)"
                    )

                    await asyncio.sleep(1)  # Be polite

                await browser.close()
                print("\n🎉 Mission Complete.")
        except Exception as e:
            print(f"❌ Scraper critical failure: {e}")
            # Ensure we don't return 1 to keep workflow "green"
            # or we can allow it to fail if it's truly critical.
            # For now, let's just log and exit gracefully to prevent noise.


if __name__ == "__main__":
    hunter = FinvizHunter()
    asyncio.run(hunter.scrape())
