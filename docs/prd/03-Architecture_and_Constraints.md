# 시스템 아키텍처 및 제약 사항 (Architecture, Differentiators & Constraints)

[← 이전: 핵심 기능 명세 (Core Features Specifications)](./02-Features.md) | [메인으로 돌아가기 (Return to Overview)](./README.md)

## 5. 시스템 아키텍처 및 기술 스택 (Tech Stack)
- **Frontend**: React, TypeScript, Vite로 구성되며, TailwindCSS, Framer Motion, Lucide-react를 스타일링 및 애니메이션에 사용합니다. 재사용성을 위해 Components와 Custom Hooks를 분리하여 상태를 관리합니다.
- **Backend & Data**: Supabase Edge Functions(Deno 기반)를 서버리스 백엔드로 사용하며, 부품 검색 엔진은 FastAPI로 구축되었습니다. 데이터베이스는 순수 정형 데이터 처리를 위한 PostgreSQL을 사용합니다.
- **External APIs**: 금융/시장 수치 데이터 수집을 위해 Alpha Vantage와 Finnhub만을 활용합니다. (OpenAI 등 추론형 API 배제)

---

## 7. 유사 서비스와의 차별점 (Differentiators)
- **결정론적(Deterministic) 퀀트 특화 모델**: AI의 블랙박스 추론이나 Hallucination(환각) 리스크를 완전히 배제하고, 사용자에게 100% 투명하게 공개될 수 있는 수학적 알고리즘(RSI, 가중치 평가 모델)만을 사용하여 높은 신뢰도를 보장합니다.
- **단일 검색을 넘어선 메타 통합과 프리미엄 UX**: 단순 데이터베이스 조회에 그치는 기존 부품 서비스와 달리, 다중 소스 실시간 병렬 스캔 및 터미널 로그 형태의 시각적 피드백을 통해 정보의 투명성과 프리미엄 경험을 제공합니다.
- **금융과 실물 자산의 인프라 공유**: 금융 자산(주식)과 실물 자산(부품) 분석이라는 전혀 다른 도메인을 단일 플랫폼(MuzeBIZ.Lab) 안에서 '데이터 수집 → 알고리즘 필터링 → 시각화'라는 공통 파이프라인으로 묶어낸 B2B/B2C 하이브리드 구조입니다.

---

## 8. 기술적 제약 사항 (Constraints)
- **외부 데이터 의존성 및 스크래핑 불안정성**: AI 추론으로 빈 데이터를 메꿀 수 없는 순수 룰 기반 시스템이므로, 외부 API(Alpha Vantage, Finnhub)나 대상 사이트(Finviz, 브로커 네트워크)의 데이터 누락, 구조 변경, API 호출 한도(Rate Limit) 초과 시 분석 로직 자체가 멈추거나 필터링 오류가 발생할 수 있습니다.
- **백테스트 과최적화(Overfitting) 리스크**: AI의 동적 대응 능력이 배제된 상태이므로, 과거 데이터에만 최적화된 고정 알고리즘(DNA 스코어링 가중치 등)이 새로운 시장 충격이나 트렌드 변화에 유연하게 대응하지 못할 가능성이 있습니다.
- **결제 및 에스크로 연동의 부재**: 현재 Muzepart의 재고 동결 플로우는 시뮬레이션 수준이며, 실제 상거래를 위해서는 B2B 에스크로 서비스 및 PG사와의 보안 통합 과정이 필수적으로 요구됩니다.
