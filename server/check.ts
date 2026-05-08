import type { Monitor } from "../database/drizzle/schema/monitors";

export interface CheckResultData {
  statusCode: number | null;
  responseTime: number | null;
  isUp: boolean;
  status: "up" | "down" | "maintenance";
  errorMessage: string | null;
}

const MAX_ERROR_BODY_LENGTH = 300;

async function buildHttpErrorMessage(response: Response, expectedStatus: number) {
  const parts = [`Expected ${expectedStatus}, got ${response.status}`];

  if (response.statusText) {
    parts.push(response.statusText);
  }

  try {
    const bodyText = (await response.text()).trim();
    if (bodyText) {
      const compactBody = bodyText.replace(/\s+/g, " ").slice(0, MAX_ERROR_BODY_LENGTH);
      parts.push(`Reason: ${compactBody}`);
    }
  } catch {
    // Ignore response body read failures and keep the status-based message.
  }

  return parts.join(" - ");
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
      status: isUp ? "up" : "down",
      errorMessage: isUp ? null : await buildHttpErrorMessage(response, monitor.expectedStatus),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = message.includes("abort");

    return {
      statusCode: null,
      responseTime,
      isUp: false,
      status: "down",
      errorMessage: isTimeout ? `Timeout after ${monitor.timeout}s` : message,
    };
  }
}
