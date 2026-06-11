import { appConfig } from "@/config/app";
import type { HealthStatus } from "@/types/health";

export function getHealthStatus(): HealthStatus {
  return {
    status: "ok",
    service: appConfig.slug,
    phase: appConfig.phase,
  };
}
