import { renderTemplate, resolveTemplate, type NotificationTemplates } from "./template";
import type { Notifier, NotifyPayload } from "./types";

type DiscordWebhookConfig = NotificationTemplates & {
  discordContent?: string | null;
  discordUsername?: string | null;
  discordAvatarUrl?: string | null;
  discordTts?: boolean | null;
  discordEmbedEnabled?: boolean | null;
  discordEmbedTitle?: string | null;
  discordEmbedDescription?: string | null;
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

type DiscordPayload = Record<string, unknown>;
type DiscordEmbed = Record<string, unknown>;

const FLAG_SUPPRESS_EMBEDS = 1 << 2;
const FLAG_SUPPRESS_NOTIFICATIONS = 1 << 12;

function renderOptional(value: string | null | undefined, payload: NotifyPayload) {
  return value ? renderTemplate(value, payload) : undefined;
}

function parseColor(value: string | null | undefined, fallback: number) {
  if (!value) return fallback;

  const normalized = value.trim().replace(/^#/, "").replace(/^0x/i, "");
  const color = Number.parseInt(normalized, 16);
  return Number.isFinite(color) ? color : fallback;
}

function parseTags(value: string | null | undefined) {
  if (!value) return undefined;

  const tags = value
    .split(/[\s,]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  return tags.length > 0 ? tags : undefined;
}

function buildAllowedMentions(config: DiscordWebhookConfig) {
  const parse: string[] = [];
  if (config.discordAllowUserMentions) parse.push("users");
  if (config.discordAllowRoleMentions) parse.push("roles");
  if (config.discordAllowEveryoneMentions) parse.push("everyone");
  return { parse };
}

function buildFlags(config: DiscordWebhookConfig) {
  let flags = 0;
  if (config.discordSuppressEmbeds) flags |= FLAG_SUPPRESS_EMBEDS;
  if (config.discordSuppressNotifications) flags |= FLAG_SUPPRESS_NOTIFICATIONS;
  return flags || undefined;
}

function compactObject(object: DiscordEmbed) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));
}

function buildEmbed(config: DiscordWebhookConfig, payload: NotifyPayload, defaultMessage: string) {
  const defaultColor = payload.result.isUp ? 0x00ff00 : 0xff0000;
  const description = renderOptional(config.discordEmbedDescription, payload) ?? defaultMessage;
  const embed = compactObject({
    title: renderOptional(config.discordEmbedTitle, payload),
    description,
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

  return embed;
}

export function buildDiscordPayload(
  config: DiscordWebhookConfig,
  payload: NotifyPayload,
): DiscordPayload {
  const message = renderTemplate(resolveTemplate(config, payload), payload);
  const content = renderOptional(config.discordContent, payload);
  const embedEnabled = config.discordEmbedEnabled !== false;
  const discordPayload: DiscordPayload = {
    content: content || (embedEnabled ? undefined : message),
    username: renderOptional(config.discordUsername, payload),
    avatar_url: renderOptional(config.discordAvatarUrl, payload),
    tts: config.discordTts ?? undefined,
    embeds: embedEnabled ? [buildEmbed(config, payload, message)] : undefined,
    allowed_mentions: buildAllowedMentions(config),
    flags: buildFlags(config),
    thread_name: renderOptional(config.discordThreadName, payload),
    applied_tags: parseTags(config.discordAppliedTags),
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
