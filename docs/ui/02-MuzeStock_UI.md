# MuzeStock (금융 도메인) 화면 UI 명세

[← 이전: 공통 프레임워크 및 랜딩 화면 UI 명세 (01-Common_UI.md)](./01-Common_UI.md) | [메인으로 돌아가기 (Return to UI_SPEC.md)](./UI_SPEC.md)

## 02. 작전 지휘소 (MuzeStock Main Dashboard)

- **경로 (Path)**: `/stock/dashboard`
- **목적**: 실시간 시장 감시 및 알고리즘 성과 지표(MDD, Win Rate) 모니터링, 실시간 '하이브리드 헌팅 트리거' 시그널 확인
- **연관 PRD 기능**: 4.1 (대시보드, 시스템 성능, 실시간 시그널 피드, 자동 종목 발굴)

### 🧩 UI 구성 요소 및 설계 가이드
1. **헤더 통계 패널 (System Performance Widget)**: 
   - 화면 최상단 고정 배치.
   - 핵심 지표: `MDD` (최대 낙폭, 방어력 의미), `Win Rate` (승률), `Profit Factor` (수익 계수).
   - 직관성이 생명이며, 녹색(우상향)/빨간색(우하향) 스파크라인(Sparkline) 차트를 작게 곁들여 수치를 강조.
2. **라이브 헌팅 타임라인 (Live Signal Feed List)**:
   - 좌측 또는 중앙 메인 영역에 리스트 혹은 카드 그리드로 배치.
   - 새로 발굴된 티커(Ticker)가 애니메이션 요소와 함께 자동 등장.
   - 각 카드 내부 정보: 종목 심볼명, 'BUY' 뱃지(Bull/Bear 타입 마킹), RSI 점수 등을 한눈에 식별 가능하도록 배치.
3. **상태 모니터 (Bot Status Tracker)**:
   - 우측 사이드 패널 느낌.
   - 'Finviz Hunter 봇' 및 백테스팅 엔진의 활성화/동작 상태(Active, Scanning 등)를 깜빡이는 LED 인디케이터 스타일로 구현.

---

## 03. DNA 스코어링 상세 뷰 (Ticker Detail)

- **경로 (Path)**: `/stock/detail/:ticker`
- **목적**: 특정 종목의 알고리즘 기반 자체 평가 점수(DNA 스코어링) 분석. 재무 건전성 및 기술적 지표 시각화.
- **연관 PRD 기능**: 4.1 (DNA 스코어링), 7 (투명한 퀀트 로직)

### 🧩 UI 구성 요소 및 설계 가이드
1. **스코어 썸머리 (Score Header)**: 
   - 총점 및 등급(A, B, C 등급 또는 숫자 점수) 명확하게 노출. 
   - 블랙박스를 거부하는 100% 투명한 가중치 수식 파라미터를 Tooltip 아이콘 등을 통해 설명.
2. **다차원 평가 웹 (Radar/Spider Chart)**:
   - 주요 지표군 (재무 건전성, 거래 변동폭, 추세 강도, 모멘텀 등)을 육각형 모양 레이더 차트로 렌더링.
3. **상세 지표 블록 (Metric Cards)**:
   - RSI, MACD, Volume Profile 등 통계적 보조지표의 팩트 데이터를 그리드 레이아웃 카드로 배열. 
   - 직관이 개입되지 않은 '순수 계산 수식치'를 강조하기 위해 테크니컬한 폰트(Mono) 사용 권장.
4. **CTA (Call to Action)**: "Add to Watchlist" (관심 종목 편입) 또는 "Follow Signal" (시그널 추적) 버튼 하단부 플로팅 배치.

---
[다음: Muzepart (공급망 도메인) 화면 UI 명세 (03-Muzepart_UI.md)](./03-Muzepart_UI.md)
