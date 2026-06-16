import "server-only";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { encryptRrn, maskRrn } from "@/lib/crypto/rrn";
import { validateAnswers, normalizeRrn } from "@/lib/survey/validation";
import { pruneHiddenAnswers } from "@/lib/survey/conditions";
import { deriveFields } from "@/lib/survey/derive";
import { computeRiskFlags } from "@/lib/survey/riskFlags";
import type { Answers } from "@/lib/survey/types";

export const runtime = "nodejs";

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export async function POST(request: Request) {
  let body: { answers?: Answers };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const answers = body.answers ?? {};

  // Server-side re-validation (never trust the client). Uses the full payload
  // because RRN/phone formats must be checked before anything else.
  const errors = validateAnswers(answers);
  if (errors.length) {
    return NextResponse.json(
      { error: "입력값을 다시 확인해 주세요.", fields: errors },
      { status: 400 },
    );
  }

  // RRN is read from the raw payload ONLY for encryption/masking, then dropped.
  const rrnRaw = normalizeRrn(
    typeof answers["basic_rrn"] === "string" ? answers["basic_rrn"] : "",
  );
  let rrnEncrypted: string;
  try {
    rrnEncrypted = encryptRrn(rrnRaw);
  } catch {
    // Misconfigured encryption key — fail closed rather than store plaintext.
    return NextResponse.json(
      { error: "서버 설정 오류로 제출을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  // Single canonical dataset for ALL storage/derivation/risk: conditionally
  // hidden questions removed, and basic_rrn stripped so the plaintext RRN never
  // reaches raw_answers, derived fields, risk flags, or patient scalars.
  const prunedAnswers = pruneHiddenAnswers(answers);
  delete prunedAnswers["basic_rrn"];

  const derived = deriveFields(prunedAnswers);
  const riskFlags = computeRiskFlags(prunedAnswers);
  const consented = prunedAnswers["consent_agree"] === "동의합니다";

  const supabase = createSupabaseAdminClient();

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .insert({
      name: str(prunedAnswers["basic_name"]),
      rrn_encrypted: rrnEncrypted,
      rrn_mask: maskRrn(rrnRaw),
      phone: str(prunedAnswers["basic_phone"]),
      address: str(prunedAnswers["basic_address"]),
      sex: str(prunedAnswers["basic_sex"]),
      birth_count: str(prunedAnswers["basic_birth_count"]),
      referral: str(prunedAnswers["basic_referral"]),
      referrer: str(prunedAnswers["basic_referrer"]),
      consent_agree: consented,
      consent_at: consented ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (patientError || !patient) {
    return NextResponse.json(
      { error: "저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  const { error: responseError } = await supabase.from("survey_responses").insert({
    patient_id: patient.id,
    raw_answers: prunedAnswers,
    primary_goal_text: derived.primary_goal_text,
    chief_complaints: derived.chief_complaints,
    current_weight: derived.current_weight,
    height: derived.height,
    target_weight: derived.target_weight,
    bmi: derived.bmi,
    risk_flags: riskFlags,
  });

  if (responseError) {
    return NextResponse.json(
      { error: "저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
