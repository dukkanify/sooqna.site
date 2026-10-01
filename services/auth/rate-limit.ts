import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";

type RateLimitRecord = {
  id: string;
  key: string;
  count: number;
  windowStart: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 10;

const store = createPayloadCollectionStore<RateLimitRecord>({
  table: "auth_rate_limits",
  fileName: "auth-rate-limits.json",
});

export async function checkRateLimit(key: string): Promise<boolean> {
  const all = await store.listAll();
  const now = Date.now();

  const others = all.filter(
    (item) =>
      item.id !== key &&
      item.key !== key &&
      now - item.windowStart <= WINDOW_MS,
  );
  const existing = all.find((item) => item.id === key || item.key === key);
  const inWindow =
    existing && now - existing.windowStart <= WINDOW_MS ? existing : null;

  if (!inWindow) {
    await store.replaceAll([
      ...others,
      { id: key, key, count: 1, windowStart: now },
    ]);
    return true;
  }

  if (inWindow.count >= MAX_REQUESTS) {
    await store.replaceAll([
      ...others,
      {
        id: inWindow.id || key,
        key: inWindow.key || key,
        count: inWindow.count,
        windowStart: inWindow.windowStart,
      },
    ]);
    return false;
  }

  await store.replaceAll([
    ...others,
    {
      id: inWindow.id || key,
      key: inWindow.key || key,
      count: inWindow.count + 1,
      windowStart: inWindow.windowStart,
    },
  ]);
  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
