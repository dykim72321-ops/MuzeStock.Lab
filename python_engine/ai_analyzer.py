import re
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from typing import Dict, Any, List, Union


class AIAnalyzer:
    """
    OpenAI 의존성을 제거하고, 수치 데이터와 NLTK 감성 분석을 기반으로
    0.001초 만에 확정적(Deterministic) 투자 리포트를 생성하는 동적 템플릿 엔진.
    (기존 코드 호환성을 위해 클래스명 AIAnalyzer 유지: Algorithmic Intelligence)
    """

    def __init__(self):
        # Initialize NLTK VADER (오프라인 감성 분석기)
        try:
            self.sia = SentimentIntensityAnalyzer()
        except LookupError:
            nltk.download("vader_lexicon", quiet=True)
            self.sia = SentimentIntensityAnalyzer()

    def _analyze_news_sentiment(
        self, news_list: Union[List[str], List[Dict], str]
    ) -> Dict[str, Any]:
        """뉴스의 긍정/부정 스코어를 정량화하여 반환"""
        if not news_list:
            return {"score": 0.0, "status": "Neutral", "headlines": []}

        if isinstance(news_list, str):
            news_list = [news_list]

        total_compound = 0
        impactful_headlines = []

        for news in news_list:
            text = news.get("title", "") if isinstance(news, dict) else str(news)
            if not text:
                continue

            scores = self.sia.polarity_scores(text)
            compound = scores["compound"]
            total_compound += compound

            if abs(compound) > 0.3:
                sentiment_mark = "🟢" if compound > 0 else "🔴"
                impactful_headlines.append(f"{sentiment_mark} {text}")

        valid_count = len(news_list)
        avg_score = total_compound / valid_count if valid_count > 0 else 0.0

        status = (
            "Bullish"
            if avg_score > 0.15
            else ("Bearish" if avg_score < -0.15 else "Neutral")
        )

        return {
            "score": avg_score,
            "status": status,
            "headlines": impactful_headlines[:3],  # 최대 3개 핵심 기사만 유지
        }

    def _parse_indicators(self, ind_str: str) -> Dict[str, Any]:
        """문자열로 전달된 지표에서 핵심 수치를 추출하는 파서"""
        data = {"source": "Normal", "rsi": 50.0, "change": 0.0}

        if not ind_str or ind_str == "N/A":
            return data

        # 정규표현식으로 수치 추출 ([\d\.]+ 대신 \d+(?:\.\d+)? 사용 — 후행 마침표 방지)
        if "Anomaly" in ind_str:
            data["source"] = "Anomaly"
        elif "Finviz Screened" in ind_str:
            data["source"] = "Finviz"

        rsi_match = re.search(r"RSI:\s*(\d+(?:\.\d+)?)", ind_str)
        if rsi_match:
            data["rsi"] = float(rsi_match.group(1))

        change_match = re.search(
            r"(?:Vol Change|Change):\s*([-\d]+(?:\.\d+)?)", ind_str
        )
        if change_match:
            data["change"] = float(change_match.group(1))

        return data

    async def analyze_stock(self, stock_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        규칙 기반 DNA 스코어링 및 동적 텍스트 생성 (비동기 처리 구조 유지)
        """
        ticker = stock_context.get("ticker", "UNKNOWN")
        news_data = self._analyze_news_sentiment(stock_context.get("news", []))
        ind_data = self._parse_indicators(stock_context.get("indicators", ""))

        # --- [1단계] DNA 스코어 산출 시스템 ---
        base_score = 50
        tags = []
        bull_factors = []
        bear_factors = []

        # 1. 수급 탐지 소스 가점
        if ind_data["source"] == "Anomaly":
            base_score += 15
            bull_factors.append("고립 숲(Isolation Forest) 비정상 수급 스퀴즈 포착.")
            tags.append("🚨 Anomaly Detected")
        elif ind_data["source"] == "Finviz":
            base_score += 5
            bull_factors.append("Finviz 퀀트 필터링 조건 충족.")
            tags.append("🎯 Screened")

        # 2. RSI 기반 기술적 분석
        rsi = ind_data["rsi"]
        if rsi < 30:
            base_score += 15
            bull_factors.append(
                f"RSI {rsi}로 극단적 과매도 구간 진입 (기술적 반등 유력)."
            )
            tags.append("🌊 Oversold")
        elif rsi > 70:
            base_score -= 15
            bear_factors.append(f"RSI {rsi}로 과매수 구간 (단기 조정 리스크).")
            tags.append("🔥 Overbought")
        else:
            bull_factors.append(f"RSI {rsi}로 안정적인 추세 유지 중.")

        # 3. 뉴스 감성 스코어 반영 (-20 ~ +20 점수 반영)
        news_impact = int(news_data["score"] * 20)
        base_score += news_impact

        if news_data["status"] == "Bullish":
            bull_factors.append(
                f"뉴스 감성 분석 압도적 긍정 (Score: {news_data['score']:.2f})."
            )
            tags.append("📈 Bullish News")
        elif news_data["status"] == "Bearish":
            bear_factors.append(
                f"부정적 미디어 센티먼트 감지 (Score: {news_data['score']:.2f})."
            )
            tags.append("📉 Bearish News")

        # 최종 스코어 보정 (0 ~ 100)
        final_score = max(0, min(100, base_score))

        # --- [2단계] 동적 리포트 생성 (String Formatting) ---
        if not bull_factors:
            bull_factors.append("뚜렷한 상승 모멘텀이 포착되지 않음.")
        if not bear_factors:
            bear_factors.append("현재 구간에서 특별한 하락 리스크 지표 없음.")

        reasoning = (
            f"[{ind_data['source']} 트랙 기반 분석]\n"
            f"해당 종목은 기술적, 수급적, 미디어 데이터를 종합한 결과 DNA Score {final_score}점을 기록했습니다. "
            f"RSI 지표({rsi})와 NLTK 감성 점수({news_data['score']:.2f})를 바탕으로 산출된 확정적(Deterministic) 수치입니다."
        )

        return {
            "dna_score": final_score,
            "bull_case": " ".join(bull_factors),
            "bear_case": " ".join(bear_factors),
            "reasoning_ko": reasoning,
            "tags": tags,  # 프롬프트 대신 프론트엔드 UI 렌더링용 배열 추가
        }


# 비동기 테스트 블록
if __name__ == "__main__":
    import asyncio
    import json

    async def run_test():
        analyzer = AIAnalyzer()
        sample_context = {
            "ticker": "TSLA",
            "price": 250.0,
            "change": "+2.5%",
            "indicators": "Detection Source: Anomaly. Price: $250, RSI: 28.5, Change: 2.5%",
            "news": [
                "Tesla announces record breaking autonomous driving data",
                "Tesla factory upgrades completed",
            ],
        }
        result = await analyzer.analyze_stock(sample_context)
        print(
            f"✅ Fast Algorithmic Analysis for TSLA:\n{json.dumps(result, indent=2, ensure_ascii=False)}"
        )

    asyncio.run(run_test())
