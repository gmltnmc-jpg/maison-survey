import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PatientRow, PatientInfo } from "@/app/admin/actions";

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

  let query = supabase
    .from("survey_responses")
    .select(LIST_SELECT)
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo + "T23:59:59");

  const { data, error } = await query;
  if (error) throw new Error("응답 목록을 불러오지 못했습니다.");
  return (data ?? []) as PatientRow[];
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
  return data as ResponseDetail;
}
