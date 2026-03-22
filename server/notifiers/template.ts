import type { NotifyPayload } from "./types";

/**
 * Available template variables:
 *
 * {{monitor.name}}     - Monitor name
 * {{monitor.url}}      - Monitor URL
 * {{monitor.method}}   - HTTP method (GET/POST)
 * {{status}}           - "DOWN" or "RECOVERED"
 * {{statusCode}}       - HTTP status code or "N/A"
 * {{responseTime}}     - Response time in ms or "N/A"
 * {{error}}            - Error message or empty
 * {{timestamp}}        - ISO timestamp
 *
 * Mentions can be written directly:
 *   Discord: <@USER_ID> <@&ROLE_ID> <#CHANNEL_ID>
 *   Slack:   <@USER_ID> <!channel> <!here> <!everyone>
 */

export function renderTemplate(template: string, payload: NotifyPayload): string {
  const { monitor, result } = payload;
  const status = result.isUp ? "RECOVERED" : "DOWN";

  const vars: Record<string, string> = {
    "monitor.name": monitor.name,
    "monitor.url": monitor.url,
    "monitor.method": monitor.method,
    status,
    statusCode: result.statusCode?.toString() ?? "N/A",
    responseTime: result.responseTime ? `${result.responseTime}ms` : "N/A",
    error: result.errorMessage ?? "",
    timestamp: new Date().toISOString(),
  };

  return template.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (_, key: string) => {
    const trimmed = key.trim();
    return vars[trimmed] ?? `{{${trimmed}}}`;
  });
}

export const DEFAULT_TEMPLATE =
  "[{{status}}] {{monitor.name}}\nURL: {{monitor.url}}\nStatus: {{statusCode}} | Response: {{responseTime}}\n{{error}}";
