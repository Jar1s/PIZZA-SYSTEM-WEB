/**
 * fetch() with a hard timeout. External calls (payment gateways, Wolt, Storyous)
 * must never hang the request/event loop — a stuck upstream would otherwise tie up
 * Node and DB connections and cascade into an outage.
 *
 * Drop-in for fetch(url, init): a default timeout signal is injected unless the
 * caller already supplied its own AbortSignal.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 15000,
): Promise<Response> {
  if (init.signal) {
    return fetch(url, init);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
