-- ============================================================
-- Maison de Balance 초진 설문 — 초기 스키마
-- ============================================================

-- ── patients ─────────────────────────────────────────────────
-- 환자 신원 정보. RRN은 암호화(rrn_encrypted)만 저장하고
-- 마스킹 표시(rrn_mask)를 목록/상세에 사용한다.
create table patients (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  rrn_encrypted text,          -- AES-256-GCM "iv:tag:ciphertext"
  rrn_mask      text,          -- "901010-1******"
  phone         text,
  address       text,
  sex           text,
  birth_count   text,          -- 출산 횟수
  referral      text,          -- 내원 경로
  referrer      text,          -- 소개자 이름 (지인소개일 때만)
  consent_agree boolean not null default false,
  consent_at    timestamptz,
  created_at    timestamptz not null default now()
);

-- ── survey_responses ─────────────────────────────────────────
-- 제출 1건 = 1행. raw_answers 에는 prunedAnswers(RRN 제거) 저장.
create table survey_responses (
  id                 uuid primary key default gen_random_uuid(),
  patient_id         uuid not null references patients(id) on delete cascade,
  raw_answers        jsonb not null default '{}',
  primary_goal_text  text,
  chief_complaints   text[],
  current_weight     numeric,
  height             numeric,
  target_weight      numeric,
  bmi                numeric,
  risk_flags         jsonb not null default '[]',  -- RiskFlag[]
  status             text not null default '신규 제출'
                       check (status in ('신규 제출','검토 중','상담 예정','상담 완료','보류·취소')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- updated_at 자동 갱신
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger survey_responses_updated_at
  before update on survey_responses
  for each row execute function set_updated_at();

-- ── 인덱스 ───────────────────────────────────────────────────
create index on patients (created_at desc);
create index on survey_responses (patient_id);
create index on survey_responses (created_at desc);
create index on survey_responses (status);

-- ── RLS ──────────────────────────────────────────────────────
-- anon: 전면 차단 (service_role은 RLS 우회 → /api/submit 전용)
-- authenticated: Supabase Auth 로그인한 관리자만 읽기/상태변경
alter table patients         enable row level security;
alter table survey_responses enable row level security;

-- patients: 관리자 읽기
create policy "admin_select_patients"
  on patients for select
  to authenticated
  using (true);

-- survey_responses: 관리자 읽기
create policy "admin_select_responses"
  on survey_responses for select
  to authenticated
  using (true);

-- survey_responses: 관리자 status 업데이트
create policy "admin_update_status"
  on survey_responses for update
  to authenticated
  using (true)
  with check (true);
