import { zapierChannelTransport, type RenderedZapier } from "@betternotify/zapier";
import { renderTemplate, resolveTemplate, type NotificationTemplates } from "./template";
import type { Notifier, NotifyPayload } from "./types";

type ZapierNotifierConfig = NotificationTemplates & {
  webhookUrl: string;
};

export function buildZapierPayload(
  config: ZapierNotifierConfig,
  payload: NotifyPayload,
): RenderedZapier {
  return {
    event: payload.result.isUp ? "monitor.recovered" : "monitor.down",
    data: {
      message: renderTemplate(resolveTemplate(config, payload), payload),
      monitorName: payload.monitor.name,
      monitorUrl: payload.monitor.url,
      status: payload.result.isUp ? "RECOVERED" : "DOWN",
      statusCode: payload.result.statusCode,
      responseTime: payload.result.responseTime,
      error: payload.result.errorMessage,
      previouslyUp: payload.previouslyUp,
    },
    meta: { provider: "cf-healthcheck" },
  };
}

export function createZapierNotifier(config: ZapierNotifierConfig): Notifier {
  return {
    name: "zapier",
    async notify(payload) {
      const transport = zapierChannelTransport({ webhookUrl: config.webhookUrl });
      await transport.send(buildZapierPayload(config, payload), {
        route: "healthcheck.zapier",
        messageId: crypto.randomUUID(),
        attempt: 1,
      });
    },
  };
}
