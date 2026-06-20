import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { maskPhone } from "@/lib/admin/utils";
import { QUESTIONS } from "@/lib/survey/questions";
import type { PatientRow, PatientInfo } from "@/app/admin/actions";

// ── Female health fields (section === "female") ───────────────────────────────
// QUESTIONS is server-only in this file to avoid bundling the full question
// list in client components that import from utils.ts.
export function getFemaleHealthFields(): { id: string; label: string }[] {
  return QUESTIONS
    .filter((q) => q.section === "female")
    .sort((a, b) => a.order - b.order)
    .map((q) => ({ id: q.id, label: q.label }));
}

function maskPatients(
  patients: PatientInfo | PatientInfo[] | null,
): PatientInfo | PatientInfo[] | null {
  if (!patients) return null;
  if (Array.isArray(patients)) {
    return patients.map((p) => ({ ...p, phone: p.phone ? maskPhone(p.phone) : null }));
  }
  return { ...patients, phone: patients.phone ? maskPhone(patients.phone) : null };
}

export type ResponseFilters = {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};

const LIST_SELECT = `
  id, patient_id, created_at, status, admin_memo,
  primary_goal_text, chief_complaints,
  current_weight, height, target_weight, bmi, risk_flags,
  patients!patient_id (
    id, name, rrn_mask, phone, sex, created_at
  )
` as const;

export async function fetchResponses(
  filters: ResponseFilters = {},
): Promise<PatientRow[]> {
  const supabase = await createSupabaseServerClient();

  // P1-2: 코드 레벨 admin role 재검증 (proxy.ts + RLS에 더한 이중 방어)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") {
    throw new Error("인증이 필요합니다");
  }

  let query = supabase
    .from("survey_responses")
    .select(LIST_SELECT)
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo + "T23:59:59");

  const { data, error } = await query;
  if (error) throw new Error("응답 목록을 불러오지 못했습니다.");
  return (data ?? []).map((row) => {
    const r = row as PatientRow;
    return { ...r, patients: maskPatients(r.patients) };
  });
}

// ── Detail ────────────────────────────────────────────────────────────────────

export type ResponseDetail = {
  id: string;
  patient_id: string;
  created_at: string;
  updated_at: string;
  status: string;
  admin_memo: string | null;
  primary_goal_text: string | null;
  chief_complaints: string[] | null;
  current_weight: number | null;
  height: number | null;
  target_weight: number | null;
  bmi: number | null;
  risk_flags: Array<{ code: string; label: string }>;
  raw_answers: Record<string, unknown>;
  patients: PatientInfo | PatientInfo[] | null;
};

export async function fetchResponseDetail(id: string): Promise<ResponseDetail | null> {
  const supabase = await createSupabaseServerClient();

  // P1-2: 코드 레벨 admin role 재검증 (proxy.ts + RLS에 더한 이중 방어)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") {
    return null;
  }

  // raw_answers is included so the detail page can render lifestyle/signal
  // sections. rrn_encrypted is NEVER selected; basic_rrn is already stripped
  // from raw_answers at submit time.
  const { data, error } = await supabase
    .from("survey_responses")
    .select(
      `
      id, patient_id, created_at, updated_at, status, admin_memo,
      primary_goal_text, chief_complaints,
      current_weight, height, target_weight, bmi, risk_flags, raw_answers,
      patients!patient_id (
        id, name, rrn_mask, phone, sex, created_at
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  const detail = data as ResponseDetail;
  return { ...detail, patients: maskPatients(detail.patients) } as ResponseDetail;
}
