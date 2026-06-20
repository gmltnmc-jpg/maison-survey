-- ============================================================
-- 이 마이그레이션은 2026-06-17경 Supabase 콘솔에서 수동으로 이미 적용됨.
-- 신규 환경 구축 시 재현용으로 기록. IF NOT EXISTS로 작성되어
-- 기존 운영 DB에 재실행해도 안전함.
-- ============================================================
--
-- 아래 컬럼들은 0001_init.sql 또는 0002에 이미 포함되어 있어 이 파일에서 제외함:
--   status, risk_flags, primary_goal_text, chief_complaints,
--   current_weight, height, target_weight, bmi  → 0001_init.sql
--   admin_memo                                   → 0002_add_admin_memo.sql
--
-- 이 파일에서 기록하는 컬럼: 실제로 누락된 4개만 추가.
-- ============================================================

-- ── survey_responses 누락 컬럼 추가 ──────────────────────────

-- 설문 제출 시각 (route.ts INSERT에서 사용 중)
ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz DEFAULT now();

-- 건강 점수 (향후 구현 예정, 공식 미정)
ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS health_score numeric;

-- PDF 생성 완료 여부
ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS pdf_generated boolean DEFAULT false;

-- 건강 점수 구성 요소 (향후 구현 예정)
ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS score_components jsonb;
