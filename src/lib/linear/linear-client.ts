import type {
  LinearProjectStructure,
  LinearStructureIssue,
} from "@/lib/linear/types";

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export type LinearApiStatus = {
  configured: boolean;
  message: string;
};

export type LinearCreateResult =
  | {
      createdIssueCount: number;
      errors: string[];
      ok: true;
      project: { id: string; name: string; url: string | null };
      skippedLabels: string[];
    }
  | { errors: string[]; ok: false };

export function getLinearApiStatus(): LinearApiStatus {
  return process.env.LINEAR_API_KEY
    ? {
        configured: true,
        message:
          "LINEAR_API_KEY is configured. Real creation still requires explicit confirmation.",
      }
    : {
        configured: false,
        message:
          "LINEAR_API_KEY is not configured. Manual export and preview remain available.",
      };
}

export async function createLinearEntities(
  structure: LinearProjectStructure,
): Promise<LinearCreateResult> {
  const apiKey = process.env.LINEAR_API_KEY;

  if (!apiKey) {
    return {
      errors: ["LINEAR_API_KEY is not configured."],
      ok: false,
    };
  }

  const teams = await linearGraphQL<{
    teams: { nodes: Array<{ id: string; key: string; name: string }> };
  }>(
    apiKey,
    `query Teams {
      teams(first: 1) {
        nodes { id key name }
      }
    }`,
  );
  const team = teams.teams.nodes[0];

  if (!team) {
    return { errors: ["No Linear team is available for this API key."], ok: false };
  }

  const projectResult = await linearGraphQL<{
    projectCreate: {
      project: { id: string; name: string; url: string | null };
      success: boolean;
    };
  }>(
    apiKey,
    `mutation CreateProject($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        success
        project { id name url }
      }
    }`,
    {
      input: {
        description: structure.project.description,
        name: structure.project.name,
        teamIds: [team.id],
      },
    },
  );

  if (!projectResult.projectCreate.success) {
    return { errors: ["Linear projectCreate did not succeed."], ok: false };
  }

  const createdProject = projectResult.projectCreate.project;
  const errors: string[] = [];
  let createdIssueCount = 0;

  for (const issue of structure.issues) {
    try {
      await createLinearIssue(apiKey, {
        issue,
        projectId: createdProject.id,
        teamId: team.id,
      });
      createdIssueCount += 1;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Issue create failed.");
    }
  }

  return {
    createdIssueCount,
    errors,
    ok: true,
    project: createdProject,
    skippedLabels: structure.labels,
  };
}

async function createLinearIssue(
  apiKey: string,
  input: {
    issue: LinearStructureIssue;
    projectId: string;
    teamId: string;
  },
) {
  await linearGraphQL<{
    issueCreate: { success: boolean };
  }>(
    apiKey,
    `mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
      }
    }`,
    {
      input: {
        description: [
          input.issue.description,
          "",
          `Milestone/group: ${input.issue.milestoneTitle}`,
          `Labels: ${input.issue.labels.join(", ")}`,
          `Suggested status: ${input.issue.statusSuggestion}`,
        ].join("\n"),
        estimate: input.issue.estimate,
        priority: input.issue.priority,
        projectId: input.projectId,
        teamId: input.teamId,
        title: input.issue.title,
      },
    },
  );
}

async function linearGraphQL<T>(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>,
) {
  const response = await fetch("https://api.linear.app/graphql", {
    body: JSON.stringify({ query, variables }),
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as GraphQLResponse<T>;

  if (!response.ok || payload.errors?.length) {
    throw new Error(
      payload.errors?.map((error) => error.message).join("; ") ??
        "Linear API request failed.",
    );
  }

  if (!payload.data) {
    throw new Error("Linear API response did not include data.");
  }

  return payload.data;
}
