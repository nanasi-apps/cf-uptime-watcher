import { slackTransport, type RenderedSlack } from "@betternotify/slack";
import { createTransport } from "@betternotify/core/transports";
import { renderTemplate, resolveTemplate, type NotificationTemplates } from "./template";
import type { Notifier, NotifyPayload } from "./types";

type SlackNotifierConfig = NotificationTemplates & {
  webhookUrl?: string | null;
  slackBotToken?: string | null;
  slackChannel?: string | null;
};

type SlackWebhookPayload = {
  attachments: { color: string; text: string }[];
};

function transportContext() {
  return { route: "healthcheck.slack", messageId: crypto.randomUUID(), attempt: 1 };
}

export function buildSlackMessage(config: NotificationTemplates, payload: NotifyPayload) {
  const message = renderTemplate(resolveTemplate(config, payload), payload);
  const color = payload.result.isUp ? "#00ff00" : "#ff0000";
  return { message, color };
}

export function buildSlackWebhookPayload(
  config: NotificationTemplates,
  payload: NotifyPayload,
): SlackWebhookPayload {
  const { message, color } = buildSlackMessage(config, payload);
  return { attachments: [{ color, text: message }] };
}

export function createSlackNotifier(config: SlackNotifierConfig): Notifier {
  return {
    name: "slack",
    async notify(payload: NotifyPayload) {
      if (config.slackBotToken && config.slackChannel) {
        const { message } = buildSlackMessage(config, payload);
        const transport = slackTransport({
          token: config.slackBotToken,
          defaultChannel: config.slackChannel,
        });
        await transport.send({ text: message } satisfies RenderedSlack, transportContext());
        return;
      }

      const webhookUrl = config.webhookUrl;
      if (!webhookUrl) {
        throw new Error(
          "Slack notifier is not configured: expected webhookUrl or slackBotToken and slackChannel",
        );
      }

      const transport = createTransport<SlackWebhookPayload, { status: number }>({
        name: "slack-webhook",
        async send(rendered) {
          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rendered),
          });
          if (response.ok) return { ok: true, data: { status: response.status } };
          return { ok: false, error: new Error(`Slack webhook failed: ${response.status}`) };
        },
      });
      await transport.send(buildSlackWebhookPayload(config, payload), transportContext());
    },
  };
}
