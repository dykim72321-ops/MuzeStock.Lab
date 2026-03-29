# MuzeBIZ.Lab UI 명세서 (UI Specification)

본 문서는 MuzeBIZ.Lab (MuzeStock 및 Muzepart) 통합 플랫폼의 사이트맵, 디자인 가이드, 그리고 각 도메인별 화면 UI/UX 상세 명세를 정의합니다. 문서의 가독성과 관리를 위해 상세 명세는 별도 파일로 분할되었습니다.

## 목차 (Table of Contents)

1. **사이트맵 (Sitemap)**
2. **디자인 플랫폼 가이드 (Design Guidelines)**
3. [**공통 프레임워크 및 랜딩 화면 UI 명세**](./01-Common_UI.md)
4. [**MuzeStock (금융 도메인) 화면 UI 명세**](./02-MuzeStock_UI.md)
5. [**Muzepart (공급망 도메인) 화면 UI 명세**](./03-Muzepart_UI.md)

---

## 1. 사이트맵 (Sitemap)

- **`/` (Root)** - 로그인 및 B2B/B2C 포털 랜딩 페이지
  - `└─ /auth/login` (인증 처리 모듈)
- **`/stock` (MuzeStock - Finance)**
  - `├─ /stock/dashboard` - 작전 지휘소 (대시보드 / 실시간 시그널 피드)
  - `└─ /stock/detail/:ticker` - 종목 상세 및 DNA 스코어링 분석 뷰
- **`/part` (Muzepart - Supply Chain)**
  - `├─ /part/search` - 글로벌 소싱 통합 검색
  - `├─ /part/spec/:mpn` - 딥 스펙 뷰어 (상세 모달)
  - `└─ /part/checkout/:tracking_id` - 재고 동결 및 모의 결제 (Lock & Checkout)

---

## 2. 디자인 플랫폼 가이드 (Design Guidelines)

MuzeBIZ.Lab은 금융 자산과 실물 자산을 아우르는 '프리미엄 데이터 통합 플랫폼'으로서 일관되고 신뢰감 있는 디자인 언어를 사용합니다.

### 2.1. 컬러 팔레트 (Color Palette)
* **Background & Surface (Dark Mode Default)**: 심도 깊은 분석을 상징하는 슬릭(Sleek)한 다크 테마 위주로 구성. (e.g., `bg-slate-900`, `bg-gray-950`).
* **Primary Accent (신뢰 및 기술)**: 데이터와 프리미엄을 상징하는 블루스케일 (`text-blue-500`, `bg-blue-600`).
* **Signal Indicator (상태 표시)**:
  * 상승/긍정 (Bull/Buy/In Stock): `text-emerald-500`
  * 하락/주의 (Bear/Sell/Out of Stock): `text-rose-500`

### 2.2. 타이포그래피 (Typography)
* **기본 폰트**: 'Inter' 또는 'Roboto' 폰트 계열의 모던 산세리프. 숫자 데이터를 렌더링할 때 고정 폭(Monospaced) 처리를 곁들여 데이터의 가독성을 극대화합니다.
* **위계 (Hierarchy)**: `<h1>` 페이지 메인 타이틀(명확하고 단호하게), 사이드 통계 수치는 Bold로 강조하여 가독성 강화.

### 2.3. 컴포넌트 & 인터랙션 (Interaction & UX)
* **Framer Motion 활용**: 화면 전환 및 데이터 패칭 시 과도하지 않은 'Subtle Micro-animations' 적용으로 고급감을 줍니다.
* **터미널/로그 스타일 UX (Global Scout)**: 단순 로딩 스피너 대신, 백엔드 엔진이 작동하는 것을 시각적으로 보여주는 터미널 로그 느낌의 피드백을 주어 신뢰감과 강력한 퀀트 엔진의 인상을 부여합니다.

---
[다음: 공통 프레임워크 및 랜딩 화면 UI 명세 (01-Common_UI.md)](./01-Common_UI.md)
