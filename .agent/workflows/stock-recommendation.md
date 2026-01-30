---
description: 오늘의 추천 종목 생성 워크플로우 (Penny Stock Scanner)
---

# 🧬 오늘의 추천 종목 워크플로우

## 개요

MuzeStock.Lab의 "오늘의 추천 종목"이 어떻게 생성되는지 단계별로 정의합니다.

---

## 1단계: 스캐너 대상 종목 정의

**파일**: `src/services/stockService.ts`

```typescript
export const WATCHLIST_TICKERS = [
  'SNDL', 'MULN', 'IDEX', 'ZOM', 'FCEL', ...  // Sub $1-$2
  'CLOV', 'BB', 'AMC', 'GME', ...             // Volatile
  'MARA', 'RIOT', 'HUT', 'BITF', ...          // Crypto Miners
];
```

> 28개의 "페니 스탁" 및 고변동성 종목이 고정 리스트로 지정되어 있음.

---

## 2단계: 실시간 시세 수집 (Finnhub API)

**함수**: `get-market-scanner` Edge Function

1. 프론트엔드가 `getTopStocks()` 호출
2. Supabase Edge Function `get-market-scanner` 트리거
3. Finnhub API로 28개 종목의 실시간 시세 수집 (5개씩 배치 처리)
4. 응답 데이터: `{ ticker, price, changePercent, volume }`

---

## 3단계: DNA 점수 계산 (Heuristic)

**함수**: `calculateDnaScore(price, change, volume)`

| 조건            | 가산점  |
| --------------- | ------- |
| 가격 < $1       | **+30** |
| 가격 < $3       | +20     |
| 가격 > $20      | -20     |
| 등락률 > 15%    | **+20** |
| 거래량 > 5000만 | **+20** |

> 기본 50점에서 시작하여 조건에 따라 가감.

---

## 4단계: 정렬 및 표시

```typescript
return stocks.sort((a, b) => b.dnaScore - a.dnaScore);
```

> DNA 점수가 높은 순서대로 UI에 표시됨.

---

## 5단계: 상세 분석 (On-Demand)

사용자가 종목 클릭 시:

1. `get-stock-quote` (Alpha Vantage) → 재무 데이터 수집
2. `analyze-stock` (OpenAI GPT-4o-mini) → AI 분석 리포트 생성

---

## 데이터 흐름도

```
[WATCHLIST_TICKERS]
       ↓
[Finnhub API] ─(실시간 시세)→ [get-market-scanner]
       ↓
[calculateDnaScore] ─(점수 계산)→ [정렬]
       ↓
[UI: 추천 종목 리스트]
       ↓ (클릭 시)
[Alpha Vantage + OpenAI] → [상세 분석 페이지]
```

---

## 관련 파일

- `src/services/stockService.ts`: 스캐너 로직
- `supabase/functions/get-market-scanner/index.ts`: Finnhub API 호출
- `supabase/functions/get-stock-quote/index.ts`: 상세 데이터 (Alpha Vantage)
- `supabase/functions/analyze-stock/index.ts`: AI 분석
