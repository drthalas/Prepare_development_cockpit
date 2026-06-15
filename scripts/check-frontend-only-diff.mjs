#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const protectedPatterns = [
  /^prisma\//,
  /^src\/app\/api\//,
  /^src\/lib\/ai\//,
  /^src\/lib\/db\//,
  /^src\/lib\/export\//,
  /^src\/lib\/linear\//,
  /^src\/lib\/projects\/project-store\.ts$/,
  /^src\/lib\/projects\/project-workflow\.ts$/,
  /^src\/lib\/questionnaire\/questionnaire-store\.ts$/,
  /^src\/lib\/roadmap\/roadmap-store\.ts$/,
  /^src\/lib\/spec\/spec-store\.ts$/,
  /^src\/lib\/.*store.*\.ts$/,
  /^src\/app\/.*\/actions\.ts$/,
  /^src\/app\/.*\/route\.ts$/,
  /^\.env/,
];

const allowedDocumentationPatterns = [
  /^docs\//,
  /^scripts\/check-frontend-only-diff\.mjs$/,
  /^package\.json$/,
];

const changedFiles = getChangedFiles();
const protectedChanges = changedFiles.filter(
  (file) =>
    protectedPatterns.some((pattern) => pattern.test(file)) &&
    !allowedDocumentationPatterns.some((pattern) => pattern.test(file)),
);

if (protectedChanges.length > 0) {
  console.error("Frontend-only guard failed. Protected paths changed:");
  for (const file of protectedChanges) {
    console.error(`- ${file}`);
  }
  console.error(
    "Stop and get explicit permission before changing backend/data/business logic.",
  );
  process.exit(1);
}

console.log("Frontend-only guard passed. No protected paths changed.");

function getChangedFiles() {
  const output = execFileSync("git", ["diff", "--name-only", "HEAD"], {
    encoding: "utf8",
  });

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
