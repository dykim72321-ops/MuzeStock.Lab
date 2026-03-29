# Muzepart (공급망 도메인) 화면 UI 명세

[← 이전: MuzeStock (금융 도메인) 화면 UI 명세 (02-MuzeStock_UI.md)](./02-MuzeStock_UI.md) | [메인으로 돌아가기 (Return to UI_SPEC.md)](./UI_SPEC.md)

## 04. 글로벌 소싱 통합 검색 (Muzepart Search)

- **경로 (Path)**: `/part/search`
- **목적**: 전 세계 브로커 네트워크에서 부품 번호(MPN)를 기반으로 병렬 검색 수집, 고급 필터링
- **연관 PRD 기능**: 4.2 (통합 검색 UI, 고급 필터링 및 정렬, Global Scout)

### 🧩 UI 구성 요소 및 설계 가이드
1. **메인 검색 바 (Persistent Search Header)**:
   - 검색창(Search Input) 상단 고정, MPN(부품번호) 엔터 허용.
   - 검색 중 'Global Scout' 애니메이션(터미널 로그 형식으로 다중 소스 접속/응답 과정을 텍스트 스트리밍)을 검색 바 우측 혹은 팝오버(Popover) 툴팁으로 시각화하여 프리미엄 UX 획득.
2. **필터링 & 정렬 컨트롤 부 (Filter Sidebar/Bar)**:
   - 'In Stock (재고 있음)' 토글 스위치를 아주 접근하기 쉬운 위치에 배치.
   - 제조사(Manufacturer), 판매처(Vendor/Broker), 패키지 타입 필터 드롭다운 혹은 사이드바 체크리스트 제공.
   - 그리드/리스트 뷰 전환 버튼. 정렬(가격 오름차순, 재고량 순) 토글.
3. **제품 탐색 결과 목록 (Results List/Grid)**:
   - 각 Row 또는 Card에 부품 이미지 썸네일, 파트넘버(MPN), 가격, 가용 재고량 명확하게 렌더링.
   - 신뢰도를 상징하는 공급망 뱃지 부여 (e.g., Authorized, Independent).

---

## 05. 딥 스펙 뷰어 모달/서랍 (Deep Spec Viewer)

- **경로 (Path)**: `/part/search` (현재 검색 화면 위에 Overlay 되거나 우측 서랍 패널로 동작), 또는 `/part/spec/:mpn` 별도 화면
- **목적**: 개별 부품의 상세 코어 스펙, 데이터시트 확인 및 RoHS 등 규제 준수 여부 확정 정보 표기.
- **연관 PRD 기능**: 4.2 (Global Scout 및 딥 스펙 뷰어)

### 🧩 UI 구성 요소 및 설계 가이드
1. **상세 서랍 (Side Drawer Panel)**:
   - 화면을 떠나지 않고도 부품 스펙을 읽을 수 있도록 우측에서 슬라이드-인(Slide-In) 되는 레이아웃 선호.
   - 상단: 제품 사진 및 핵심 정보, 다운로드 가능한 데이터시트(PDF) 버튼.
2. **기술 스펙 테이블 (Specs Table)**:
   - 여러 소스에서 취합된 메타 데이터를 세련된 2-Col Data Table로 렌더링.
   - RoHS 준수 마크, Life Cycle(단종 여부 등), 코어 스펙값 강조.

---

## 06. 재고 동결 및 모의 결제 (Secure Checkout Simulation)

- **경로 (Path)**: `/part/checkout/:tracking_id`
- **목적**: 'Proceed to Lock' 버튼을 누른 후, 부품의 수급 동결 단계 및 결제 연결 직전의 모의 플로우 진입.
- **연관 PRD 기능**: 4.2 (Secure Transaction), 8 (결제/에스크로 통합 부재 한계점)

### 🧩 UI 구성 요소 및 설계 가이드
1. **결제 대기 모의 화면 (Simulation Checkout Form)**:
   - 실제 결제가 이루어지지 않더라도 (현재 에스크로/PG 연동 부재로 인해), 사용자가 심리적으로 '내가 이 재고 물량을 확보했다'는 확신을 줄 수 있는 견고한 UI 요구.
   - 상단에 `Tracking ID: #MZP-XXXX` 노출.
2. **진행 상태 바 (Stepper / Progress Bar)**:
   - `Inventory Checking` → `Proceed to Lock` → `Payment Pending (Simulator)` 3단계 스텝바 애니메이션.
3. **오더 써머리 (Order Summary Card)**:
   - 동결(Lock)한 부품 수량, 개당 단가, 총 합계(Total Cost) 명세서 스타일 렌더링.
