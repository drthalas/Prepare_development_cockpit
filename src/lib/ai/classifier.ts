import { getAIProvider } from "@/lib/ai/provider";
import type {
  ProjectClassificationInput,
  ProjectClassificationResult,
} from "@/lib/ai/types";

export async function classifyProjectIdea(
  input: ProjectClassificationInput,
): Promise<ProjectClassificationResult> {
  const provider = getAIProvider();
  const result = await provider.classifyProjectIdea(input);

  return {
    ...result,
    mode: provider.mode,
  };
}
