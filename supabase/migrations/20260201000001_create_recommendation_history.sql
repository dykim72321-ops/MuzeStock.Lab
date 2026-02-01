-- recommendation_history 테이블
CREATE TABLE IF NOT EXISTS recommendation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  recommended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dna_score INTEGER,
  action TEXT, -- 'buy', 'watch', 'avoid'
  confidence TEXT -- 'high', 'medium', 'low'
);

-- 최근 N일간 추천된 종목 조회 함수
CREATE OR REPLACE FUNCTION get_recent_recommendations(days_ago INT DEFAULT 7)
RETURNS TABLE (ticker TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT recommendation_history.ticker
  FROM recommendation_history
  WHERE recommended_at > NOW() - (days_ago || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_recommendation_history_ticker ON recommendation_history(ticker);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_date ON recommendation_history(recommended_at DESC);

-- 추천 히스토리 자동 기록 함수 (optional helper)
CREATE OR REPLACE FUNCTION log_recommendation(
  p_ticker TEXT,
  p_dna_score INT,
  p_action TEXT,
  p_confidence TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO recommendation_history (ticker, dna_score, action, confidence)
  VALUES (p_ticker, p_dna_score, p_action, p_confidence);
END;
$$ LANGUAGE plpgsql;
