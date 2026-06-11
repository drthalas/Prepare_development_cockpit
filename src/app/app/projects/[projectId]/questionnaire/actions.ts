"use server";

import { redirect } from "next/navigation";

import { saveQuestionnaireAnswers } from "@/lib/questionnaire/questionnaire-store";

export async function completeQuestionnaireAction(
  projectId: string,
  sessionId: string,
  formData: FormData,
) {
  const result = await saveQuestionnaireAnswers(projectId, sessionId, formData);

  if (!result.ok) {
    redirect(
      `/app/projects/${projectId}/questionnaire?questionnaire=${result.reason}`,
    );
  }

  redirect(`/app/projects/${projectId}/questionnaire?questionnaire=completed`);
}
