"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ResponseStatus } from "@/lib/types";

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updateStatus(responseId: string, status: ResponseStatus) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("survey_responses")
    .update({ status })
    .eq("id", responseId);

  if (error) throw new Error("상태 업데이트에 실패했습니다.");
}
