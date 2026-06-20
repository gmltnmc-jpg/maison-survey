"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { maskPhone } from "@/lib/admin/utils";
import type { ResponseStatus } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SignInState = { error: string } | null;

/** Shared row type used by list page, search, and detail page. */
export type PatientRow = {
  id: string;
  patient_id: string;
  created_at: string;
  status: ResponseStatus;
  admin_memo: string | null;
  primary_goal_text: string | null;
  chief_complaints: string[] | null;
  current_weight: number | null;
  height: number | null;
  target_weight: number | null;
  bmi: number | null;
  risk_flags: Array<{ code: string; label: string }>;
  patients:
    | PatientInfo
    | PatientInfo[]
    | null;
};

export type PatientInfo = {
  id: string;
  name: string | null;
  rrn_mask: string | null;
  phone: string | null;
  sex: string | null;
  created_at: string;
};

export type UpdateResponseState = { error?: string; success?: boolean } | null;

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = (formData.get("email") ?? "") as string;
  const password = (formData.get("password") ?? "") as string;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다" };
  }

  if (data.user.app_metadata?.role !== "admin") {
    await supabase.auth.signOut();
    redirect("/admin/login?unauthorized=1");
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ── Status (legacy — kept for StatusSelect in old [id] page) ─────────────────

export async function updateStatus(responseId: string, status: ResponseStatus) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") {
    throw new Error("권한이 없습니다");
  }
  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient
    .from("survey_responses")
    .update({ status })
    .eq("id", responseId);
  if (error) throw new Error("상태 업데이트에 실패했습니다.");
}

// ── Update response (with session re-validation) ──────────────────────────────

export async function updateResponseStatus(
  _prevState: UpdateResponseState,
  formData: FormData,
): Promise<UpdateResponseState> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    return { error: "인증이 필요합니다" };
  }

  const responseId = (formData.get("responseId") ?? "") as string;
  const status = (formData.get("status") ?? "") as ResponseStatus;
  const adminMemo = (formData.get("adminMemo") ?? "") as string;

  const ALLOWED_STATUSES: ResponseStatus[] = [
    "신규 제출",
    "상담 예정",
    "상담 완료",
    "보류·취소",
  ];

  if (!responseId || !ALLOWED_STATUSES.includes(status)) {
    return { error: "잘못된 요청입니다" };
  }

  const { error } = await supabase
    .from("survey_responses")
    .update({ status, admin_memo: adminMemo })
    .eq("id", responseId);

  if (error) return { error: "저장에 실패했습니다. 잠시 후 다시 시도하세요." };

  revalidatePath(`/admin/responses/${responseId}`);
  revalidatePath("/admin");

  return { success: true };
}

// ── Name search (no URL exposure) ─────────────────────────────────────────────

const RESPONSE_SELECT = `
  id, patient_id, created_at, status, admin_memo,
  primary_goal_text, chief_complaints,
  current_weight, height, target_weight, bmi, risk_flags,
  patients!patient_id (
    id, name, rrn_mask, phone, sex, created_at
  )
` as const;

export async function searchByName(
  _prevState: { results: PatientRow[] } | null,
  formData: FormData,
): Promise<{ results: PatientRow[] }> {
  const name = ((formData.get("name") ?? "") as string).trim();
  if (!name) return { results: [] };

  const supabase = await createSupabaseServerClient();

  // Step 1: find matching patient IDs (ilike for partial match)
  const { data: patients } = await supabase
    .from("patients")
    .select("id")
    .ilike("name", `%${name}%`);

  if (!patients?.length) return { results: [] };

  // Step 2: fetch responses for those patients
  const { data } = await supabase
    .from("survey_responses")
    .select(RESPONSE_SELECT)
    .in("patient_id", patients.map((p) => p.id))
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as PatientRow[];
  return {
    results: rows.map((row) => {
      const p = Array.isArray(row.patients) ? row.patients[0] : row.patients;
      if (!p) return row;
      const masked = { ...p, phone: p.phone ? maskPhone(p.phone) : null };
      return { ...row, patients: Array.isArray(row.patients) ? [masked] : masked };
    }),
  };
}
