---
name: feedback-admin-security
description: Security constraints the user has explicitly mandated for admin code — what to never touch or expose
metadata:
  node_type: memory
  type: feedback
  originSessionId: 15d4fe9b-24bf-4fd3-af6f-90a1f148f503
---

**rrn_encrypted는 어떤 쿼리에도 SELECT하지 마라.** DB에 존재해도 admin queries에서 절대 읽지 않는다. `src/lib/admin/queries.ts`의 RESPONSE_SELECT와 fetchResponseDetail에서 이 컬럼은 제외된 상태.

**Why:** 복호화 키와 함께 있으면 서버 메모리에서 노출 가능. RRN은 법적으로 민감한 정보.

**basic_rrn 키가 raw_answers에 있어도 화면에 표시하지 마라.** raw_answers 섹션을 렌더링할 때 key === 'basic_rrn' (또는 포함)이면 skip.

**Why:** 사용자가 명시적으로 RRN 표시 금지 지시.

**기존 인증·미들웨어·로그인 코드는 건드리지 마라.** `src/proxy.ts`, `src/app/admin/login/`, `src/lib/supabase/` 수정 요청이 없는 한 읽기만 하고 수정 금지.

**Why:** 인증 코드는 이미 검증된 상태. 부주의한 수정이 auth bypass 취약점을 만들 수 있음.

**raw_answers, rrn_encrypted 관련 코드는 건드리지 마라.** 이 컬럼을 다루는 코드(`/api/submit/route.ts`의 저장 로직 등)는 요청 없이 수정 금지.

**How to apply:** admin 기능 추가/수정 시 위 4가지 제약을 항상 먼저 확인. 위반 가능성이 있는 변경은 진행 전 사용자에게 명시적으로 확인받는다.

**마이그레이션 재작성 금지.** 이미 적용된 마이그레이션 파일(0001_init.sql 등)은 내용을 수정하지 않는다. 스키마 변경은 항상 새 번호의 마이그레이션 파일로 추가한다(0003_, 0004_ ...).

**Why:** 이미 적용된 파일을 수정하면 마이그레이션 도구의 체크섬 오류 + 환경 간 스키마 불일치 발생. 역사적 기록으로 보존.

**How to apply:** 스키마 변경 요청 시 기존 파일 편집 대신 `supabase/migrations/` 아래 다음 번호 파일 신규 생성.
