import { RankingError, type RankingDevice } from "./ranking.ts";

export const ENROLLMENT_RETRY_MS = 60_000;

export function isEnrolled(device: RankingDevice | null): boolean {
  return Boolean(device && !device.registrationPending);
}

export function enrollmentFailure(error: unknown): "validate" | "storage" | "defer" {
  if (error instanceof RankingError) {
    if (error.code === "storage_unavailable") return "storage";
    if (["invalid_alias", "alias_taken", "device_exists"].includes(error.code)) return "validate";
  }
  return "defer";
}

export function safeEnrollmentMoment(screen: string, overlayOpen: boolean): boolean {
  return (screen === "home" || screen === "map") && !overlayOpen;
}

export function createEnrollmentRecovery(
  retryAt: { current: number },
  isSafe: () => boolean,
  request: () => void,
  now: () => number = Date.now,
) {
  const retry = () => {
    if (now() < retryAt.current || !isSafe()) return;
    request();
  };
  const online = () => { retryAt.current = 0; retry(); };
  return { retry, online };
}
