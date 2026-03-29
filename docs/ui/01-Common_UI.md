# 공통 프레임워크 및 랜딩 화면 UI 명세 (Common UI & Landing)

[← 메인으로 돌아가기 (Return to UI_SPEC.md)](./UI_SPEC.md)

## 01. 통합 로그인 및 랜딩 (Auth / Portal)

- **경로 (Path)**: `/` 또는 `/auth/login`
- **목적**: B2B/B2C 사용자(퀀트 투자자와 구매 담당자) 통합 인증 및 서비스 진입점.
- **연관 PRD 기능**: 3 (사용자 페르소나), 7 (디지털 자산/실물 자산 인프라 공유)

### 🧩 UI 구성 요소 및 설계 가이드
1. **히어로 영역 (Hero Section)**: 강력한 데이터/퀀트 통합 플랫폼의 정체성을 비주얼라이징. 배경에는 은은한 노드 애니메이션이나 데이터 스트림 효과(Framer Motion) 부여.
2. **도메인 분기 카드 (Domain Split Cards)**: 로그인 성공 직후 나타나며 사용자에게 명확히 경로를 묻는다.
   - **카드 A (Finance - MuzeStock)**: 퀀트 시스템 모니터링 아이콘 혹은 차트 썸네일 배치.
   - **카드 B (Supply Chain - Muzepart)**: 글로벌 네트워크 브로커 스탬프 및 칩(IC) 아이콘 배치.
3. **사용자 인증 블록 (Auth Modal/Block)**: Supabase Auth 기반 로그인. 보안/신뢰를 최우선으로 하기 때문에 매우 심플하고 안정적인 폼 디자인 (이메일/소셜 로그인).
4. **글로벌 헤더 (Global Header)**: "MuzeBIZ.Lab" 로고 좌상단 배치. 테마 스위처(다크 모드 기본)와 유저 프로필 아바타(우측 상단) 기본 배치.

---
[다음: MuzeStock (금융 도메인) 화면 UI 명세 (02-MuzeStock_UI.md)](./02-MuzeStock_UI.md)
