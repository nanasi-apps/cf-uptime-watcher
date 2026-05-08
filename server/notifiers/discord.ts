import { renderTemplate, resolveTemplate, type NotificationTemplates } from "./template";
import type { Notifier, NotifyPayload } from "./types";

type DiscordWebhookConfig = NotificationTemplates & {
  discordContent?: string | null;
  discordUsername?: string | null;
  discordAvatarUrl?: string | null;
  discordTts?: boolean | null;
};

type DiscordPayload = Record<string, unknown>;

export function buildDiscordPayload(
  config: DiscordWebhookConfig,
  payload: NotifyPayload,
): DiscordPayload {
  const message = renderTemplate(resolveTemplate(config, payload), payload);
  const content = config.discordContent ? renderTemplate(config.discordContent, payload) : null;
  const color = payload.result.isUp ? 0x00ff00 : 0xff0000;
  const discordPayload: DiscordPayload = {
    content: content || undefined,
    username: config.discordUsername ? renderTemplate(config.discordUsername, payload) : undefined,
    avatar_url: config.discordAvatarUrl
      ? renderTemplate(config.discordAvatarUrl, payload)
      : undefined,
    tts: config.discordTts ?? undefined,
    embeds: [
      {
        description: message,
        color,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return Object.fromEntries(
    Object.entries(discordPayload).filter(([, value]) => value !== undefined),
  );
}

export function createDiscordNotifier(
  config: { webhookUrl: string } & DiscordWebhookConfig,
): Notifier {
  return {
    name: "discord",
    async notify(payload: NotifyPayload) {
      await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildDiscordPayload(config, payload)),
      });
    },
  };
}
