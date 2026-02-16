const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

/**
 * 시장에서 가장 뜨거운 종목(Trending & Most Active) Top 100을 가져옵니다.
 * @returns {Promise<string[]>} Ticker 리스트
 */
async function fetchMarketMovers() {
    console.log("🔥 시장에서 가장 뜨거운 Top 100 종목을 스캔 중...");

    try {
        // 1. Trending Symbols (US 시장 기준)
        const trending = await yahooFinance.trendingSymbols('US');
        const trendingTickers = trending.quotes.map(q => q.symbol);

        // 2. 추가적인 추천 종목 (Volatility가 높은 인기 종목들)
        const fixedTickers = ['MULN', 'SNDL', 'GME', 'TSLA', 'NVDA', 'AAPL', 'AMD', 'PLTR', 'SOFI', 'MARA', 'RIOT', 'COIN'];

        // 중복 제거 및 합치기
        const combined = [...new Set([...trendingTickers, ...fixedTickers])];

        console.log(`   ✅ ${combined.length}개의 종목을 발굴했습니다.`);
        return combined;
    } catch (error) {
        console.error("   ❌ 시장 종목 수집 중 오류 발생:", error.message);
        // 오류 발생 시 최소한의 기본 리스트 반환
        return ['MULN', 'SNDL', 'GME', 'TSLA', 'NVDA'];
    }
}

module.exports = { fetchMarketMovers };
