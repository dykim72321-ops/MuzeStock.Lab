# CLAUDE.md — MuzeStock.Lab 핵심 시스템 가이드

## 프로젝트 철학

**100% 퀀트 알고리즘** — LLM 예측, AI 생성 시그널 없음. 모든 매매는 수학적 모델(가격·거래량·기술적 지표)로만 결정된다.

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS (`src/`)
- **Backend**: FastAPI + Python 3.11 + Uvicorn (`python_engine/`)
- **Database**: Supabase (PostgreSQL + Edge Functions + RLS)
- **Broker**: Alpaca Markets API (paper mode 기본)
- **Alerts**: Discord Webhook

---

## 핵심 시스템 플로우

```
[1] 퀀트 스캐너 (DNA ≥ 80)
        │
        ▼
[2] 관심종목 자동 등록 (watchlist, status=WATCHING)
        │
        ▼
[3] STRONG BUY 조건 충족 시 Alpaca 가상 매수
    - paper_positions 생성 (status=HOLD)
    - watchlist status → HOLDING
    - Discord 🚀 알림
        │
        ▼
[4] 실시간 모니터링 (1분봉 스트림)
    ├─ RSI > 60 → 50% Scale-Out + TS 상향 + watchlist stop_loss 동기화
    └─ 가격 < Trailing Stop → 전량 청산
           - paper_history 기록
           - watchlist status → EXITED
           - Discord ✅/🛑 알림
```

---

## 1단계 — 퀀트 스캐너 (DNA ≥ 80 종목 발굴)

### 두 가지 스캐너

| 스캐너 | 위치 | 실행 주기 |
|---|---|---|
| **Edge Function 스캐너** | `supabase/functions/run-quant-scanner/index.ts` | 수동 또는 스케줄 |
| **Pulse Engine 스캐너** | `python_engine/main.py → run_pulse_engine()` | Alpaca 1분봉 실시간 |

### DNA 점수 기준

```
BUY 시그널  → DNA 85
HOLD 시그널 → DNA 60
SELL 시그널 → DNA 40
```

### STRONG BUY 조건 (`python_engine/main.py:1667-1674`)

```python
Strong_Buy = (
    RSI < 45          # 과매도권
    AND MACD 골든크로스  # MACD > Signal, 직전 봉은 MACD ≤ Signal
    AND ADX > 20       # 추세 강도
    AND RVOL > 3.0     # 거래량 폭증 (3배 이상)
    AND NOT Is_Extended # 당일 50% 이상 급등 종목 제외
)
```

### Edge Function 스캐너 필터

```
dnaScore ≥ 70 AND rvol > 2.0 AND close > SMA20 AND uptrend
→ dnaScore ≥ alert_threshold(기본 85) → Discord STRONG BUY 알림
→ quant_signals 테이블 upsert
```

---

## 2단계 — 관심종목 자동 등록

### 테이블: `watchlist`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `ticker` | TEXT NOT NULL | 종목 심볼 |
| `status` | TEXT | `WATCHING` / `HOLDING` / `EXITED` |
| `buy_price` | NUMERIC | 매수 진입가 |
| `stop_loss` | NUMERIC | 현재 트레일링 스탑 (TS와 실시간 동기화) |
| `initial_dna_score` | NUMERIC | 매수 시점 DNA 점수 |
| `created_at` | TIMESTAMPTZ | 등록일 (그래프 시작점) |
| `user_id` | UUID | 수동 등록 시 사용자 ID (자동 등록 시 null) |

### 등록 경로

1. **수동**: `WatchlistPage.tsx` → 티커 입력 → `addToWatchlist()` (status=WATCHING)
2. **자동**: 퀀트 엔진이 매수 실행 시 → `paper_engine._sync_watchlist_buy()` → status=HOLDING

### 상태 전이

```
WATCHING → HOLDING   : 퀀트 엔진 매수 실행 시 자동
HOLDING  → EXITED    : 트레일링 스탑 발동 시 자동
(수동 제거도 가능)
```

---

## 3단계 — Alpaca 가상 매수 자동화

**파일**: `python_engine/paper_engine.py → process_signal()`

**조건**: `signal_type == "BUY" AND strength == "STRONG" AND SYSTEM_ARMED == True AND DNA ≥ 80`

**진입 로직**:

```python
buy_budget = cash_available * 0.15   # 3/4 Kelly ≈ 가용 현금의 15%
units = buy_budget / price
ts_threshold = price * 0.90          # 초기 손절선 -10%
```

**실행 시 처리**:
1. `paper_positions` INSERT (status=HOLD)
2. `paper_account.cash_available` 차감
3. `watchlist` UPSERT (status=HOLDING, buy_price, stop_loss, initial_dna_score)
4. Discord 🚀 알림

---

## 4단계 — 자동 매도 (관심종목 탈출 기준)

**트리거**: Alpaca 1분봉 스트림 → `on_minute_bar_closed()` → `process_signal()`

### 탈출 기준 A — Scale-Out (50% 부분 익절)

```
조건: RSI > 60 AND is_scaled_out == False AND SYSTEM_ARMED
처리:
  - 보유 수량의 50% 시장가 매도
  - TS 상향: entry_price × 1.01 (본절+1%)
  - paper_positions.status → SCALE_OUT
  - watchlist.stop_loss 동기화
  - Discord 🟠 SCALE-OUT 알림
```

### 탈출 기준 B — 트레일링 스탑 (전량 청산)

```
조건: price < ts_threshold AND SYSTEM_ARMED
처리:
  - 전량 시장가 매도
  - paper_history INSERT (exit_reason="Trailing Stop")
  - paper_positions DELETE
  - paper_account.cash_available 복구
  - watchlist.status → EXITED
  - Discord ✅(이익)/🛑(손실) 알림
```

### 트레일링 스탑 계산

```
일반 보유 중:  ts_threshold = max(ts_threshold, highest_price × 0.90)
Scale-Out 후: ts_threshold = entry_price × 1.01  (고정)
```

### 수동 매도 (사령관 매도)

```
POST /api/broker/paper/sell { ticker }
→ yfinance 현재가 조회 (fallback: DB current_price)
→ paper_history INSERT (exit_reason="Manual Sell")
→ paper_positions DELETE
→ paper_account 현금 복구
→ watchlist.status → EXITED
→ Discord 알림
```

---

## 5단계 — 관심종목 그래프 (등록일~현재)

**컴포넌트**: `src/components/dashboard/OrbitChartPanel.tsx`

```
addedAt (등록일) → 오늘
  └─ Yahoo Finance API: /v8/finance/chart/{ticker}?period1={addedTs}&period2={now}&interval=1d
```

**표시 항목**:
- **실선 (Cyan)**: 일별 종가
- **점선 (Rose)**: Chandelier Exit (트레일링 스탑선)
- **P&L %**: 진입가 대비 현재 수익률
- **DNA Match Rate**: 초기 DNA vs 현재 DNA 비율
- **탈출 신호**: HOLD / SELL 상태

**Chandelier Exit 계산**:
```
trail = 12% (penny, price < $5) or 8% (regular)
stop = highest_price_since_entry × (1 - trail)
```

---

## 데이터베이스 테이블 전체 맵

### Paper Trading (Python Engine)

| 테이블 | 역할 |
|---|---|
| `paper_account` | 가상 계좌 잔고 |
| `paper_positions` | 현재 보유 포지션 (TS, 수량, 상태) |
| `paper_history` | 청산된 거래 이력 (PnL, 사유) |

### 관심종목 / 발굴

| 테이블 | 역할 |
|---|---|
| `watchlist` | 관심종목 (수동+자동 등록, 그래프 기준일) |
| `daily_discovery` | 스캐너 발굴 종목 (DNA, 섹터, 가격) |
| `quant_signals` | Edge Function 시그널 아카이브 |
| `realtime_signals` | Pulse Engine 실시간 시그널 |

### 설정 / 백테스트

| 테이블 | 역할 |
|---|---|
| `system_settings` | DNA 임계값, Discord 웹훅 URL |
| `backtest_cache` | 백테스트 결과 캐시 |
| `trade_history` | Edge Function 청산 이력 |
| `active_positions` | Edge Function 포지션 추적 |

---

## API 엔드포인트 전체 맵

### Paper Trading

| Endpoint | Method | 설명 |
|---|---|---|
| `/api/broker/paper/account` | GET | 가상 계좌 잔고 |
| `/api/broker/paper/positions` | GET | 현재 보유 포지션 |
| `/api/broker/paper/history` | GET | 최근 30건 거래 이력 |
| `/api/broker/paper/sell` | POST | 수동 청산 `{ticker}` |
| `/api/broker/arm` | POST | 자동 매매 ON/OFF `{arm: bool}` |

### 분석 / 포트폴리오

| Endpoint | Method | 설명 |
|---|---|---|
| `/api/analyze` | POST | DNA 분석 `{ticker, period}` |
| `/api/strategy/stats` | GET | 승률, PF, MDD 통계 |
| `/api/broker/status` | GET | Alpaca 연결 상태 |
| `/api/broker/account` | GET | Alpaca 계좌 현황 |
| `/api/pulse/status` | GET | 펄스 엔진 시장 상태 |
| `/ws/pulse` | WebSocket | 1분봉 실시간 스트림 |

---

## SYSTEM_ARMED 플래그

`python_engine/main.py` 전역 변수. `False`이면 스캐닝은 하되 매수/매도 실행 없음.

```python
# Toggle via:
POST /api/broker/arm { "arm": true }   # 전투 모드 (자동 매매 활성화)
POST /api/broker/arm { "arm": false }  # 안전 모드 (관제만)
```

UI에서: **작전지휘소 → System Control Panel → ARMED 토글**

---

## 작전지휘소 대시보드 컴포넌트 맵

| 컴포넌트 | 파일 | 데이터 소스 | 상태 |
|---|---|---|---|
| `Dashboard` (페이지) | `src/pages/Dashboard.tsx` | `/api/strategy/stats`, `/api/pulse/status` | ✅ |
| `MarketCommandHeader` | `src/components/layout/MarketCommandHeader.tsx` | Edge Fn `admin-proxy` (헌팅 트리거) | ✅ |
| `PortfolioStatus` | `src/components/ui/PortfolioStatus.tsx` | `/api/broker/paper/*` FastAPI | ✅ |
| `CommandSettings` | `src/components/dashboard/CommandSettings.tsx` | `system_settings` Supabase 직접 | ✅ |
| `QuantSignalCard` | `src/components/ui/QuantSignalCard.tsx` | `WS /ws/pulse` 실시간 | ✅ |

| 컴포넌트 | 파일 | 데이터 소스 | 상태 |
|---|---|---|---|
| `WatchlistPage` | `src/pages/WatchlistPage.tsx` | `watchlist` Supabase | ✅ |
| `WatchlistItemCard` | `src/components/watchlist/WatchlistItemCard.tsx` | `useDNACalculator` 훅 | ✅ |
| `OrbitChartPanel` | `src/components/dashboard/OrbitChartPanel.tsx` | `/yahoo-api` Vite 프록시 | ✅ |

### 대시보드 연결 구조

```
Frontend (Vite :5173)
  ├─ WS   /py-api/ws/pulse          → FastAPI :8001  (Vite proxy: ws 지원)
  ├─ REST /py-api/api/broker/paper/* → FastAPI :8001  (X-Admin-Key 인증)
  ├─ REST /py-api/api/strategy/stats → FastAPI :8001
  ├─ REST /py-api/api/pulse/status   → FastAPI :8001
  ├─ REST /yahoo-api/...             → Yahoo Finance  (Vite proxy, CORS 우회)
  ├─ Supabase JS  system_settings    → Supabase DB    (RLS: anon UPDATE 허용)
  └─ Edge Fn  admin-proxy/api/hunt   → Supabase Edge Function
```

### 과거 버그 및 수정 이력

| 버그 | 파일 | 원인 | 수정 |
|---|---|---|---|
| Save Configuration 버튼 크래시 | `CommandSettings.tsx:31` | `(window as any).apiFetch` 미정의 전역 사용 | `supabase.from('system_settings').update()` 직접 호출로 교체 |
| Dashboard 계좌 잔고 $0 표시 | `main.py` + `LiveExecutionCenter.tsx` | `paper/account` 응답 필드가 `buying_power`/`equity`인데 프론트는 `cash_available`/`total_assets` 기대 | 백엔드 반환 필드명 통일, 컴포넌트 인터페이스 수정 |
| watchlist 타 유저 행 덮어쓰기 | `paper_engine.py` | `eq("ticker")` 필터만 사용 | `.is_("user_id", "null")` 필터 추가 |
| 수동 매도 시 watchlist 미동기화 | `main.py` | `_sync_watchlist_exit()` 미호출 | position 삭제 후 sync 호출 추가 |
| BUY 조건에 DNA 게이트 없음 | `paper_engine.py:129` | `dna_score >= 80` 조건 누락 | BUY 조건에 `and dna_score >= 80` 추가 |
| 손실 구간 Scale-Out | `paper_engine.py:188` | `price > entry_price` 체크 없음 | SCALE_OUT 조건에 수익 확인 추가 |

---

## 개발 명령어

```bash
# Frontend (port 5173)
npm run dev

# Backend (port 8001)
cd python_engine && uvicorn main:app --host 127.0.0.1 --port 8001 --reload

# Supabase Edge Functions 배포
supabase functions deploy

# DNA 백테스트
cd python_engine && python portfolio_backtester.py

# DNA 파라미터 최적화 (γ, δ, λ 그리드 서치)
cd python_engine && python optimize_dna.py
```

---

## 환경 변수

### Frontend (`/.env`)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_SERVICE_ROLE_KEY
VITE_FINNHUB_API_KEY
VITE_ADMIN_SECRET_KEY
```

### Backend (`/python_engine/.env`)
```
SUPABASE_URL
SUPABASE_KEY                  # service role key (RLS 우회)
SUPABASE_SERVICE_ROLE_KEY
APCA_API_KEY_ID
APCA_API_SECRET_KEY
APCA_PAPER=true               # false = 실제 자금 (주의)
DISCORD_WEBHOOK_URL
ADMIN_SECRET_KEY
```

---

## 새 기능 추가 가이드

### FastAPI 엔드포인트 추가
`python_engine/main.py` — Pydantic `BaseModel`로 요청 스키마 정의 후 `api_key: str = Security(get_api_key)` 인증 패턴 사용.

### Frontend API 호출 추가
`src/services/pythonApiService.ts` — `brokerApiFetch()` (인증 필요) 또는 `apiFetch()` (공개) 사용.

### Supabase 테이블 추가
`supabase/migrations/` 에 타임스탬프 prefix로 마이그레이션 파일 생성 → `supabase db push`.
