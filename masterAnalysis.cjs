// masterAnalysis.cjs - 실전(Live) 버전
require('dotenv').config(); // 🔑 환경변수(.env) 로드 필수!

const { getMarketMovers } = require('./fetchMarketMovers.cjs');

// =================================================================
// 🔌 [매우 중요] 기존에 만드신 AI 및 DB 모듈을 여기에 연결하세요!
// =================================================================
// 💡 팁: 만약 파일명이 다르면 아래 경로를 수정해야 합니다.
const { analyzeStock } = require('./analyzeStockModule.cjs'); // ✅ 실제 분석 모듈 경로로 수정
const { saveToSupabase } = require('./databaseModule.cjs');   // ✅ 실제 DB 저장 모듈 경로로 수정

// ====================================================
// ⚙️ [설정] 시스템 파라미터
// ====================================================
const CONFIG = {
    // ⚠️ FALSE로 설정하여 실전 모드 가동
    TEST_MODE: false,

    // 💰 비용 절약을 위해 처음엔 3~5개만 테스트하세요!
    SCAN_COUNT: 5,

    // 🛡️ API 보호를 위해 3초 대기 (안전 제일)
    DELAY_MS: 3000,

    FILTER: {
        MIN_SCORE: 0,          // 👈 0점으로 변경 (무조건 통과)
        FORBIDDEN_RISKS: [],   // 👈 빈 배열 (모든 리스크 허용)
        ALLOWED_RECS: ['Sell', 'Hold', 'Buy', 'Strong Buy'] // 👈 모두 허용
    }
};

// [유틸리티] Sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// [유틸리티] 문자열 길이 보정
function padLog(str, length) {
    const safeStr = str ? str.toString() : "";
    const realLength = safeStr.replace(/[^\x00-\xff]/g, "xx").length;
    const padding = Math.max(0, length - realLength);
    return safeStr + " ".repeat(padding);
}

// [Main] 실행 로직
async function runRealScanner() {
    console.clear();
    console.log(`🚀 [MuzeStock.Lab] 실전 광역 스캐너 가동 (LIVE DATA)`);
    console.log(`💰 [주의] 실제 AI 비용이 발생하며, 실제 DB에 기록됩니다.`);
    console.log(`🎯 필터: ${CONFIG.FILTER.MIN_SCORE}점+ | Risk Low/Med | Buy/Strong Buy\n`);

    // 1. 실제 시장 주도주 가져오기
    const symbols = await getMarketMovers(CONFIG.SCAN_COUNT);

    let stats = { total: 0, saved: 0, filtered: 0, errors: 0 };
    const savedList = [];

    console.log("==================================================================================");
    console.log(`| ${padLog("종목", 6)} | ${padLog("점수", 4)} | ${padLog("위험도", 9)} | ${padLog("투자의견", 10)} | ${padLog("판정 결과", 20)} |`);
    console.log("==================================================================================");

    for (const symbol of symbols) {
        try {
            // (1) 실제 AI 분석 수행
            // 💡 팁: AI 분석은 시간이 좀 걸립니다 (약 10~30초)
            const result = await analyzeStock(symbol); // 🤖 실제 AI 호출!

            stats.total++;

            // (2) 3중 정밀 필터링
            // 혹시 AI가 riskLevel을 안 줄 경우를 대비해 기본값 처리
            const currentRisk = result.riskLevel || "Unknown";
            const currentRec = result.recommendation || "Hold";
            const currentScore = result.totalScore || 0;

            const passScore = currentScore >= CONFIG.FILTER.MIN_SCORE;
            const passRisk = !CONFIG.FILTER.FORBIDDEN_RISKS.includes(currentRisk);
            const passRec = CONFIG.FILTER.ALLOWED_RECS.includes(currentRec);

            const isPassed = passScore && passRisk && passRec;

            // (3) 로그 및 저장
            let statusIcon = "";
            let rejectReasons = [];

            if (isPassed) {
                statusIcon = "💎 [DB 저장] 성공!";

                // 💾 실제 Supabase DB 저장!
                await saveToSupabase(result);

                stats.saved++;
                savedList.push(result);
            } else {
                if (!passScore) rejectReasons.push("점수");
                if (!passRisk) rejectReasons.push("위험");
                if (!passRec) rejectReasons.push("의견");
                statusIcon = `🧹 [필터] ${rejectReasons.join(',')}`;
                stats.filtered++;
            }

            console.log(`| ${padLog(symbol, 6)} | ${padLog(currentScore, 4)} | ${padLog(currentRisk, 9)} | ${padLog(currentRec, 10)} | ${padLog(statusIcon, 20)} |`);

        } catch (err) {
            stats.errors++;
            console.error(`| ${padLog(symbol, 6)} | ❌ Error: ${err.message}`);
        }

        // (4) 쿨다운
        if (stats.total < symbols.length) await sleep(CONFIG.DELAY_MS);
    }

    // 최종 결과
    console.log("==================================================================================");
    console.log(`\n🏁 [실전 스캔 완료]`);
    console.log(`- 총 분석: ${stats.total} | 💎 저장됨: ${stats.saved} | 🧹 필터링: ${stats.filtered} | ❌ 에러: ${stats.errors}`);

    if (savedList.length > 0) {
        console.log(`\n🎉 [성공] 웹 대시보드에서 다음 종목이 보이는지 확인하세요:`);
        console.log(savedList.map(item => item.symbol).join(', '));
    } else {
        console.log("\n🌪 오늘은 시장 조건에 맞는 종목이 없습니다. (시스템 정상 작동 중)");
    }
}

runRealScanner();