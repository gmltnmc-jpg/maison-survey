---
name: project-progress
description: "Stage-by-stage implementation progress for the Maison de Balance rebuild — what's done, what's next, and pending decisions"
metadata:
  node_type: memory
  type: project
  originSessionId: f142f688-e2f0-4497-91ce-b1d73ab9b9d8
---

## 현재 진행 상황 (2026-06-20 갱신)

### 완료된 단계 전체

**A단계 — Next.js 스캐폴딩 (완료)**
- Next.js 16.2.9, React 19.2.4, TypeScript, App Router
- 설문 라이브러리: questions.ts, sections.ts, conditions.ts, validation.ts, riskFlags.ts, derive.ts, scoreMeta.ts
- 암호화: `src/lib/crypto/rrn.ts` (AES-256-GCM)
- `/api/submit`: prunedAnswers 패턴, raw_answers → 구조화 컬럼 동시 저장

**B·C·D·E단계 (완료)**
- Supabase 프로젝트: `acoqlblawnlonoaexobw` (서울 ap-northeast-2)
- 마이그레이션: `0001_init.sql`(초기 스키마), `0002_add_admin_memo.sql`(admin_memo 컬럼)
- 관리자 계정: Supabase Auth, `app_metadata.role = 'admin'`

**F단계 — Admin Dashboard (완료)**
- 인증: `src/proxy.ts`(Next.js 16 방식, middleware.ts 대신), login/page.tsx
- 목록: `src/app/admin/page.tsx` + `ResponseTable.tsx`(StatusDropdown 인라인 즉시 저장)
- 상세: `src/app/admin/responses/[id]/page.tsx` + `AdminWorkArea.tsx`(메모 전용)
- 데이터: `src/lib/admin/queries.ts`, `src/lib/admin/utils.ts`

**Status 4단계 (완료)**
- "신규 제출" → "상담 예정" → "상담 완료" → "보류·취소"
- "검토 중" 제거: src/ 전체 + DB CHECK 제약 (0001_init.sql은 역사적 기록 유지)

**P0 보안 수정 (완료, 배포됨)**
- P0-1: `[id]/page.tsx` select(*) → 명시적 컬럼 (rrn_encrypted 제외)
- P0-2: `updateStatus` auth guard 추가 (service_role 사용 전 세션 재검증)
- P0-3: RLS SELECT — admin role만 허용 (Supabase MCP로 적용 완료)
- P0-4: RLS UPDATE — status·admin_memo·updated_at 컬럼만 허용 (컬럼 GRANT 완료)
- P0-5: `queries.ts` + `actions.ts` — phone 마스킹 서버 처리 (maskPatients, searchByName)

**P1 보안 수정 (완료, 배포됨)**
- P1-1: `updateResponseStatus` + `updateStatus` — DB 현재 상태 조회 후 `allowedNextStatus` 기반 전환 규칙 검증
- P1-2: `fetchResponses`, `fetchResponseDetail`, `searchByName` — getUser() + role === 'admin' 코드 레벨 이중 방어 가드
- P1-3: 여성 건강 섹션 — `getFemaleHealthFields()`로 section==='female' 자동 추출 (queries.ts에 배치, utils.ts 제외 이유: ResponseTable.tsx use client 번들 차단)

**마이그레이션 기록 (완료)**
- `supabase/migrations/0003_rls_admin_policies.sql` — 운영 DB 수동 적용 내용 참고용 기록
  (검토 중 데이터 정리, CHECK 제약 갱신, SELECT/UPDATE 정책, 컬럼 GRANT 포함)

**현재 프로덕션 상태**
- 배포: [maison-survey.vercel.app](https://maison-survey.vercel.app)
- 최신 커밋: `ef0f8a7` (P1 보안 수정)
- Supabase DB: 모든 RLS 정책·컬럼 권한 적용 완료

---

### 다음 단계 후보

- PDF 내보내기 (scoreMeta.ts에 구조만 있음, 실제 구현 미착수)
- 건강점수 계산 공식 (공식 미정, scoreMeta.ts 구조만 존재)
- P2 보안 검수 (있다면)

---

### 핵심 설계 결정 (향후 참고)

- `getFemaleHealthFields()` → `queries.ts`(server-only)에 배치. `utils.ts`는 `ResponseTable.tsx`(use client)가 임포트하므로 QUESTIONS 번들 노출 방지.
- `updateStatus`(legacy `/admin/[id]` 페이지)는 삭제하지 않고 auth guard 유지. 현재 `/admin/responses/[id]`가 메인이지만 레거시 라우트 접근 가능.
- 마이그레이션 재작성 금지 원칙 유지: 이미 적용된 파일은 건드리지 않고 새 번호 파일로 추가.

### 프로토콜
- 되돌리기 어려운 작업(migration 실행, Supabase 조작 등)은 사용자 승인 후 실행.
- 각 단계 완료 후 검수 후 다음 진행.

**How to apply:** 다음 세션에서 어떤 작업을 요청받든, "다음 단계 후보"와 "핵심 설계 결정"을 먼저 파악하고 진행.
