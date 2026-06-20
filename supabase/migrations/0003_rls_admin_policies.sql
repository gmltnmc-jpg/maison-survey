-- ============================================================
-- 이 마이그레이션은 기존 운영 DB에 이미 수동 적용되어 있음.
-- 재현/신규 환경 구축 시 참고용으로만 사용하라.
-- 적용 시점: 2026-06-20 (보안 검수 P0 수정 세션)
-- ============================================================

-- ── Step 1. 상태 데이터 정리 ──────────────────────────────────
-- '검토 중'은 4단계 단순화(0002 이후)로 제거된 값.
-- 남아있는 행을 '신규 제출'로 전환한다.
UPDATE survey_responses
  SET status = '신규 제출'
  WHERE status = '검토 중';

-- ── Step 2. CHECK 제약 갱신 ('검토 중' 제거) ─────────────────
ALTER TABLE survey_responses
  DROP CONSTRAINT IF EXISTS survey_responses_status_check;

ALTER TABLE survey_responses
  ADD CONSTRAINT survey_responses_status_check
  CHECK (status IN ('신규 제출', '상담 예정', '상담 완료', '보류·취소'));

-- ── Step 3. SELECT 정책: admin role만 허용 ────────────────────
-- patients
DROP POLICY IF EXISTS "admin_select_patients" ON patients;
CREATE POLICY "admin_select_patients"
  ON patients FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- survey_responses
DROP POLICY IF EXISTS "admin_select_responses" ON survey_responses;
CREATE POLICY "admin_select_responses"
  ON survey_responses FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ── Step 4. UPDATE 정책: admin role + 컬럼 제한 ──────────────
DROP POLICY IF EXISTS "admin_update_status" ON survey_responses;
CREATE POLICY "admin_update_status"
  ON survey_responses FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- status, admin_memo, updated_at 컬럼만 UPDATE 허용
REVOKE UPDATE ON TABLE survey_responses FROM authenticated;
GRANT UPDATE (status, admin_memo, updated_at) ON TABLE survey_responses TO authenticated;
