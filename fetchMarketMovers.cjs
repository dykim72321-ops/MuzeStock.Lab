const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

/**
 * 미국 시장 거래량 상위 종목을 가져옵니다.
 * @param {number} count 가져올 종목 수
 */
async function getMarketMovers(count = 20) {
    console.log(`📡 [Yahoo Finance] 시장 주도주(Most Actives) 상위 ${count}개 스캔 시도...`);

    // API 실패 시 사용할 백업 리스트 (방어 코드)
    const BACKUP_SYMBOLS = [
        'TSLA', 'NVDA', 'AAPL', 'AMD', 'AMZN', 'MSFT', 'GOOGL', 'META', 'NFLX', 'INTC',
        'PLTR', 'SOFI', 'MARA', 'COIN', 'LCID', 'RIVN', 'F', 'BAC', 'T', 'VZ'
    ];

    try {
        // Yahoo Finance Screener 호출
        const queryOptions = {
            scrIds: 'most_actives',
            count: count,
            region: 'US',
            lang: 'en-US'
        };

        const results = await yahooFinance.screener(queryOptions);

        // 데이터 유효성 검사
        if (!results || !results.quotes || !Array.isArray(results.quotes)) {
            throw new Error("API 응답 형식이 올바르지 않습니다.");
        }

        if (results.quotes.length === 0) {
            throw new Error("검색된 종목이 0개입니다.");
        }

        const symbols = results.quotes.map(q => q.symbol);
        console.log(`✅ [수집 성공] 총 ${symbols.length}개 종목 리스트 확보 완료.`);
        return symbols;

    } catch (error) {
        console.error(`⚠️ [API Error] Yahoo 연결 실패 (${error.message}).`);
        console.log(`🔄 백업 리스트(${BACKUP_SYMBOLS.length}개)로 전환합니다.`);
        return BACKUP_SYMBOLS.slice(0, count);
    }
}

module.exports = { getMarketMovers };