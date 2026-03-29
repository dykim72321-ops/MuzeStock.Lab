# 핵심 기능 명세 (Core Features Specifications)

[← 이전: 프로젝트 개요, 목표 및 페르소나 (Overview, Goals & Personas)](./01-Overview.md) | [메인으로 돌아가기 (Return to Overview)](./README.md)

## 4. 핵심 기능 명세 (Core Features Specifications)

### 4.1. 금융 도메인: MuzeStock (퀀트 지휘소)
- **대시보드 (작전 지휘소)**: 실시간 시장 감시 및 퀀트 발굴 시스템을 모니터링합니다.
- **시스템 성능 지표**: 퀀트 엔진 백테스트 기준의 시스템 방어력(MDD)과 엔진 승률(Win Rate, Profit Factor) 등 객관적 성과 지표를 실시간 계산하여 제공합니다.
- **실시간 시그널 피드**: '하이브리드 헌팅 트리거'를 통해 발굴된 실시간 매수(BUY) 시그널 종목을 표시하며, RSI 지표, 기술적 분석 조건에 부합하는 Bull/Bear 케이스를 카드 형태로 렌더링합니다.
- **자동 종목 발굴 (Discovery)**: Finviz Hunter 봇을 통해 매일 아침 시장에서 거래량, 시총 등 특정 수치 조건에 부합하는 종목을 자동으로 스크래핑합니다.
- **DNA 스코어링 (자체 평가 시스템)**: AI 추론 없이, 재무 건전성, 거래량 변동성, 기술적 보조지표(RSI, MACD 등)를 가중치 조합한 순수 알고리즘 수식 기반의 자체 스코어링 시스템을 제공합니다.

### 4.2. 공급망 도메인: Muzepart (글로벌 소싱)
- **통합 검색 UI**: 부품번호(MPN) 기반 검색을 지원하며, Verical, Win Source, Meta Aggregator 등 다중 소스의 데이터베이스를 통합 스캔합니다.
- **고급 필터링 및 정렬**: '재고 있음(In Stock)' 토글 및 판매처, 제조사, 패키지별 필터링을 지원하며, 가격 및 재고량 순으로 데이터를 정렬하고 리스트/그리드 뷰 전환이 가능합니다.
- **Global Scout 및 딥 스펙 뷰어**: 전 세계 브로커 네트워크를 탐색하는 시각적 피드백(Global Scout 애니메이션)으로 프리미엄 UX를 제공하며, 부품의 RoHS 준수 여부 및 확정된 코어 기술 스펙을 표시하는 상세 모달을 제공합니다.
- **Secure Transaction (재고 동결)**: 'Proceed to Lock' 액션을 통해 안전하게 부품의 수급 동결(Tracking ID 발급)을 진행하고 결제 대기로 넘기는 시뮬레이션 플로우를 갖춥니다.

---
[다음: 시스템 아키텍처 및 제약 사항 (Architecture, Differentiators & Constraints)](./03-Architecture_and_Constraints.md)
