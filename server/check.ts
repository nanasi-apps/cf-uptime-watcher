import type { Monitor } from "../database/drizzle/schema/monitors";

export interface CheckResultData {
  statusCode: number | null;
  responseTime: number | null;
  isUp: boolean;
  errorMessage: string | null;
}

export async function performCheck(monitor: Monitor): Promise<CheckResultData> {
  const startTime = Date.now();

  try {
    const headers: Record<string, string> = {};
    if (monitor.headers) {
      try {
        Object.assign(headers, JSON.parse(monitor.headers));
      } catch {
        // ignore invalid headers JSON
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), monitor.timeout * 1000);

    const response = await fetch(monitor.url, {
      method: monitor.method,
      headers,
      body: monitor.method === "POST" ? (monitor.body ?? undefined) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    const isUp = response.status === monitor.expectedStatus;

    return {
      statusCode: response.status,
      responseTime,
      isUp,
      errorMessage: isUp ? null : `Expected ${monitor.expectedStatus}, got ${response.status}`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = message.includes("abort");

    return {
      statusCode: null,
      responseTime,
      isUp: false,
      errorMessage: isTimeout ? `Timeout after ${monitor.timeout}s` : message,
    };
  }
}
