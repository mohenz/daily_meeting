# Daily Meeting Memo

Supabase 기반의 간소화된 데일리 미팅 메모 앱입니다. 날짜별 미팅 세션, 작업자별 진행현황, 관리자용 작업자 관리까지 포함한 정적 SPA MVP입니다.

## 빠른 실행
- 실행: `npm.cmd start`
- 문법 검증: `npm.cmd run check:syntax`
- 기본 주소: `http://localhost:4173`
- GitHub 저장소: `https://github.com/mohenz/daily_meeting.git`

## 현재 MVP 범위
- 이메일 + 비밀번호 기반 로그인
- 이름 + 이메일 + 비밀번호 기반 회원가입
- 날짜별 미팅 목록 조회
- 날짜별 작업자 리스트 조회
- 작업자별 `Daily Scrum`, `Daily Wrap-Up`, `Emergency` 메모 등록/수정
- 관리자용 작업자 등록/수정
- 관리자용 기본 미팅 생성과 Emergency 미팅 추가
- 관리자용 작업진행현황 soft delete

## 구현 방식
- 정적 SPA
- Supabase Browser Client 연동
- 앱 내부 사용자 테이블 기반 로그인/회원가입
- `awesome-design-md`의 `ElevenLabs` 디자인 MD를 참고한 밝은 웜톤 UI 적용

## 보안 단계 계획
- 현재 기획 기준은 `defect_manage`와 유사한 앱 내부 사용자 관리 방식으로 단순 운영하는 것입니다.
- `Supabase Auth + RLS`는 스크럼보드가 플랫폼 구조로 확대될 때 2단계로 도입합니다.
- 현재 단계는 앱 서비스 계층에서 로그인과 권한을 처리합니다.

## 현재 구조
- `js/app.js`: 앱 진입점과 이벤트 바인딩
- `js/config/`: Supabase URL / publishable key
- `js/core/`: DOM, 포맷터, 모달 매니저, 공통 유틸
- `js/services/`: Auth, Supabase client, daily meeting 데이터 접근
- `js/state/`: 앱 상태와 날짜/작업자 선택 selector
- `js/views/`: 가입, 사이드바, 작업공간 렌더링
- `js/modals/`: 메모, 작업자, Emergency 세션 입력 모달

## Supabase 전제
- 프로젝트 URL: `https://gtbnmydtzexqrcgvwygg.supabase.co`
- 브라우저 클라이언트는 publishable key 사용
- `docs/daily_meeting_password_auth_migration.sql` 적용 필요
- `docs/daily_meeting_admin_seed.sql`로 초기 관리자 1명 등록 필요
- `docs/daily_meeting_rls.sql`은 플랫폼 확장 시점의 보안 고도화 참고 문서로 유지하며 현재 단계에서는 적용하지 않음

## 문서
- [docs/README.md](./docs/README.md)
- [docs/scrum_board_design.md](./docs/scrum_board_design.md)
- [docs/daily_meeting_memo_app_spec.md](./docs/daily_meeting_memo_app_spec.md)
- [docs/daily_meeting_supabase_schema.sql](./docs/daily_meeting_supabase_schema.sql)
- [docs/daily_meeting_password_auth_migration.sql](./docs/daily_meeting_password_auth_migration.sql)
- [docs/daily_meeting_admin_seed.sql](./docs/daily_meeting_admin_seed.sql)
- [docs/daily_meeting_rls.sql](./docs/daily_meeting_rls.sql)
- [docs/platform_security_roadmap.md](./docs/platform_security_roadmap.md)

## 다음 개선 후보
- 작업자 본인 프로필 수정 화면
- 날짜별 기본 미팅 자동 생성 전략
- 단기 사용자 관리 구조를 `defect_manage` 방식으로 단순화
- 플랫폼 확장 시 Supabase Auth + RLS 전환 설계 구체화

## 배포
- GitHub Pages는 `.github/workflows/deploy-pages.yml` 기준으로 `main` 브랜치 push 시 자동 배포됩니다.
