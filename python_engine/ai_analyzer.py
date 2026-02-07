import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env.local")
load_dotenv(dotenv_path="../.env")

class AIAnalyzer:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("❌ Missing OpenAI API key")
        self.client = OpenAI(api_key=api_key)

    def analyze_stock(self, stock_context: dict):
        """
        수집된 지표와 뉴스를 바탕으로 AI 투자 의견 생성
        """
        ticker = stock_context.get("ticker", "UNKNOWN")
        
        prompt = f"""
Analyze the following stock data for {ticker} and provide a professional investment summary.

Context:
- Price: ${stock_context.get('price')}
- Change: {stock_context.get('change')}
- Technical Indicators: {stock_context.get('indicators')}
- Recent News: {stock_context.get('news', 'No recent news')}

Instructions:
1. Provide a concise Bull Case and Bear Case.
2. Assign a DNA Score (0-100) based on your overall confidence in a technical breakout.
3. Keep the "reasoning" section in Korean (한국어) for the user.
4. Output Format (Strict JSON):
{{
  "dna_score": 85,
  "bull_case": "Summary of bull case",
  "bear_case": "Summary of bear case",
  "reasoning_ko": "한국어로 작성된 상세 근거"
}}
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini", # 가성비 모델 사용
                messages=[
                    {{"role": "system", "content": "You are a professional stock analyst specializing in penny stocks and technical analysis."}},
                    {{"role": "user", "content": prompt}}
                ],
                response_format={{ "type": "json_object" }}
            )
            
            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"❌ AI Analysis Error for {ticker}: {e}")
            return {{
                "dna_score": 50,
                "bull_case": "Error during analysis",
                "bear_case": "Error during analysis",
                "reasoning_ko": "AI 분석 중 오류가 발생했습니다."
            }}

if __name__ == "__main__":
    analyzer = AIAnalyzer()
    sample_context = {{
        "ticker": "TSLA",
        "price": 250.0,
        "change": "+2.5%",
        "indicators": "RSI 65, MACD Bullish Cross",
        "news": ["Tesla reports record deliveries"]
    }}
    result = analyzer.analyze_stock(sample_context)
    print(f"✅ AI Analysis for TSLA: {result}")
