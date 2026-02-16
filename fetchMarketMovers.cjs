const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

/**
 * Yahoo Finance의 'Most Actives' 스크리너를 사용하여 상위 종목을 가져옵니다.
 * @param {number} count 가져올 종목 수
 * @returns {Promise<string[]>} Ticker 리스트
 */
async function getMarketMovers(count = 100) {
    console.log(`📡 시장에서 가장 뜨거운 종목 ${count}개를 스캔 중입니다...`);

    try {
        // Yahoo Finance의 'Most Actives' (거래량 상위) 스크리너 활용
        const queryOptions = { scrIds: 'most_actives', count: count, region: 'US', lang: 'en-US' };
        const results = await yahooFinance.screener(queryOptions);

        if (!results || !results.quotes || results.quotes.length === 0) {
            throw new Error("데이터를 가져오지 못했습니다.");
        }

        // 심볼(Ticker)만 추출
        const symbols = results.quotes.map(q => q.symbol);

        console.log(`✅ 종목 리스트 확보 완료: ${symbols.length}개`);
        return symbols;

    } catch (error) {
        console.error("❌ 야후 파이낸스 연동 실패. 기본 리스트(Top Tech)를 사용합니다.", error.message);
        // API 실패 시 사용할 백업 리스트 (안전 장치)
        return [
            'TSLA', 'NVDA', 'AAPL', 'AMD', 'AMZN', 'MSFT', 'GOOGL', 'META', 'NFLX', 'INTC',
            'PLTR', 'SOFI', 'MARA', 'COIN', 'LCID', 'RIVN', 'F', 'BAC', 'T', 'VZ'
        ];
    }
}

module.exports = { getMarketMovers };
