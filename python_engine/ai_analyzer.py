import os
from openai import OpenAI
from dotenv import load_dotenv
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

load_dotenv(dotenv_path="../.env.local")
load_dotenv(dotenv_path="../.env")


class AIAnalyzer:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("❌ Missing OpenAI API key")
        self.client = OpenAI(api_key=api_key)
        
        # Initialize NLTK VADER
        try:
            self.sia = SentimentIntensityAnalyzer()
        except LookupError:
            nltk.download('vader_lexicon', quiet=True)
            self.sia = SentimentIntensityAnalyzer()

    def _summarize_news(self, news_list):
        if not news_list:
            return "No recent news"
            
        if isinstance(news_list, str):
            news_list = [news_list]
            
        summaries = []
        total_compound = 0
        
        for news in news_list:
            # We assume news is a string, if it's a dict, adjust accordingly
            text = news.get("title", "") if isinstance(news, dict) else str(news)
            if not text:
                continue
                
            scores = self.sia.polarity_scores(text)
            total_compound += scores['compound']
            
            # Keep only the most impactful news (either very positive or very negative)
            if abs(scores['compound']) > 0.3:
                sentiment = "Positive" if scores['compound'] > 0 else "Negative"
                summaries.append(f"[{sentiment}] {text}")
                
        avg_sentiment = total_compound / len(news_list) if news_list else 0
        overall = "Bullish" if avg_sentiment > 0.1 else ("Bearish" if avg_sentiment < -0.1 else "Neutral")
        
        if not summaries:
            summaries = [str(news) for news in news_list[:3]] # fallback to top 3 if none are highly impactful
            
        # Join to string
        news_text = "\n".join(summaries[:5]) # limit to 5
        return f"Overall Sentiment: {overall} (Avg Score: {avg_sentiment:.2f})\nKey Headlines:\n{news_text}"

    def analyze_stock(self, stock_context: dict):
        """
        수집된 지표와 뉴스를 바탕으로 AI 투자 의견 생성
        """
        ticker = stock_context.get("ticker", "UNKNOWN")

        prompt = f"""
Analyze the following stock data for {ticker} and identify its "Multi-bagger Potential".
Look for patterns of unusual accumulation, institutional interest, and technical setups that precede exponential growth.

Context:
- Price: ${stock_context.get('price')}
- Change: {stock_context.get('change')}
- Technical Indicators: {stock_context.get('indicators')}
- Recent News Summary:
{self._summarize_news(stock_context.get('news', []))}

Instructions:
1. Provide a professional Bull Case (focus on potential) and Bear Case (focus on risks).
2. Assign a DNA Score (0-100):
   - 80+: Strong potential for explosive growth.
   - 60-79: Solid trend, but requires confirmation.
   - Below 60: High risk or lack of clear momentum.
3. reasoning_ko must be deep, professional, and explain WHY this stock has potential.
4. Output Format (Strict JSON):
{{
  "dna_score": 85,
  "bull_case": "Summary focusing on growth potential",
  "bear_case": "Summary focusing on critical risks",
  "reasoning_ko": "잠재력의 근거와 향후 전망에 대한 전문적 분석"
}}
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # 가성비 모델 사용
                messages=[
                    {
                        "role": "system",
                        "content": "You are a top-tier institutional stock analyst specializing in identifying high-growth potential stocks using a combination of fundamental and technical 'Confluence'.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
            )

            import json

            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"❌ AI Analysis Error for {ticker}: {e}")
            return {
                "dna_score": 50,
                "bull_case": "Error during analysis",
                "bear_case": "Error during analysis",
                "reasoning_ko": "AI 분석 중 오류가 발생했습니다.",
            }


if __name__ == "__main__":
    analyzer = AIAnalyzer()
    sample_context = {
        "ticker": "TSLA",
        "price": 250.0,
        "change": "+2.5%",
        "indicators": "RSI 65, MACD Bullish Cross",
        "news": ["Tesla reports record deliveries"],
    }
    result = analyzer.analyze_stock(sample_context)
    print(f"✅ AI Analysis for TSLA: {result}")
