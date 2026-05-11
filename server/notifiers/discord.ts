import { discordTransport, type DiscordEmbed, type RenderedDiscord } from "@betternotify/discord";
import { renderTemplate, resolveTemplate, type NotificationTemplates } from "./template";
import type { Notifier, NotifyPayload } from "./types";

type DiscordWebhookConfig = NotificationTemplates & {
  discordContent?: string | null;
  discordUsername?: string | null;
  discordAvatarUrl?: string | null;
  discordTts?: boolean | null;
  discordEmbedEnabled?: boolean | null;
  discordEmbedTitle?: string | null;
  discordEmbedUrl?: string | null;
  discordEmbedColor?: string | null;
  discordEmbedAuthorName?: string | null;
  discordEmbedAuthorUrl?: string | null;
  discordEmbedAuthorIconUrl?: string | null;
  discordEmbedThumbnailUrl?: string | null;
  discordEmbedImageUrl?: string | null;
  discordEmbedFooterText?: string | null;
  discordEmbedFooterIconUrl?: string | null;
  discordEmbedTimestamp?: boolean | null;
  discordAllowUserMentions?: boolean | null;
  discordAllowRoleMentions?: boolean | null;
  discordAllowEveryoneMentions?: boolean | null;
  discordSuppressEmbeds?: boolean | null;
  discordSuppressNotifications?: boolean | null;
  discordThreadName?: string | null;
  discordAppliedTags?: string | null;
};

function renderOptional(value: string | null | undefined, payload: NotifyPayload) {
  return value ? renderTemplate(value, payload) : undefined;
}

function parseColor(value: string | null | undefined, fallback: number) {
  if (!value) return fallback;

  const normalized = value.trim().replace(/^#/, "").replace(/^0x/i, "");
  const color = Number.parseInt(normalized, 16);
  return Number.isFinite(color) ? color : fallback;
}

function compactObject<T extends Record<string, unknown>>(object: T) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

function buildEmbed(
  config: DiscordWebhookConfig,
  payload: NotifyPayload,
  defaultMessage: string,
): DiscordEmbed {
  const defaultColor = payload.result.isUp ? 0x00ff00 : 0xff0000;
  return compactObject({
    title: renderOptional(config.discordEmbedTitle, payload),
    description: defaultMessage,
    url: renderOptional(config.discordEmbedUrl, payload),
    color: parseColor(config.discordEmbedColor, defaultColor),
    timestamp: config.discordEmbedTimestamp === false ? undefined : new Date().toISOString(),
    author: config.discordEmbedAuthorName
      ? compactObject({
          name: renderTemplate(config.discordEmbedAuthorName, payload),
          url: renderOptional(config.discordEmbedAuthorUrl, payload),
          icon_url: renderOptional(config.discordEmbedAuthorIconUrl, payload),
        })
      : undefined,
    thumbnail: config.discordEmbedThumbnailUrl
      ? { url: renderTemplate(config.discordEmbedThumbnailUrl, payload) }
      : undefined,
    image: config.discordEmbedImageUrl
      ? { url: renderTemplate(config.discordEmbedImageUrl, payload) }
      : undefined,
    footer: config.discordEmbedFooterText
      ? compactObject({
          text: renderTemplate(config.discordEmbedFooterText, payload),
          icon_url: renderOptional(config.discordEmbedFooterIconUrl, payload),
        })
      : undefined,
  });
}

export function buildDiscordPayload(
  config: DiscordWebhookConfig,
  payload: NotifyPayload,
): RenderedDiscord {
  const message = renderTemplate(resolveTemplate(config, payload), payload);
  const content = renderOptional(config.discordContent, payload);
  const discordPayload: RenderedDiscord = {
    body: content ?? message,
    username: renderOptional(config.discordUsername, payload),
    avatarUrl: renderOptional(config.discordAvatarUrl, payload),
    embeds:
      config.discordEmbedEnabled === false ? undefined : [buildEmbed(config, payload, message)],
  };

  return discordPayload;
}

export function createDiscordNotifier(
  config: { webhookUrl: string } & DiscordWebhookConfig,
): Notifier {
  return {
    name: "discord",
    async notify(payload: NotifyPayload) {
      const transport = discordTransport({
        webhookUrl: config.webhookUrl,
        username: config.discordUsername ?? undefined,
        avatarUrl: config.discordAvatarUrl ?? undefined,
      });
      await transport.send(buildDiscordPayload(config, payload), {
        route: "healthcheck.discord",
        messageId: crypto.randomUUID(),
        attempt: 1,
      });
    },
  };
}
