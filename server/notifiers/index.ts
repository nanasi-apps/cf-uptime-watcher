import type { NotificationChannel } from "../../database/drizzle/schema/notification-channels";
import { createDiscordNotifier } from "./discord";
import { createSlackNotifier } from "./slack";
import type { Notifier, NotifyPayload } from "./types";

export type { Notifier, NotifyPayload };

export function buildNotifiersFromChannels(channels: NotificationChannel[]): Notifier[] {
  return channels
    .map((ch) => {
      switch (ch.type) {
        case "discord":
          return createDiscordNotifier({
            webhookUrl: ch.webhookUrl,
            template: ch.template,
            downTemplate: ch.downTemplate,
            upTemplate: ch.upTemplate,
            discordUsername: ch.discordUsername,
            discordAvatarUrl: ch.discordAvatarUrl,
            discordTts: ch.discordTts,
            discordEmbedTitle: ch.discordEmbedTitle,
            discordEmbedUrl: ch.discordEmbedUrl,
            discordEmbedColor: ch.discordEmbedColor,
            discordEmbedAuthorName: ch.discordEmbedAuthorName,
            discordEmbedAuthorUrl: ch.discordEmbedAuthorUrl,
            discordEmbedAuthorIconUrl: ch.discordEmbedAuthorIconUrl,
            discordEmbedThumbnailUrl: ch.discordEmbedThumbnailUrl,
            discordEmbedImageUrl: ch.discordEmbedImageUrl,
            discordEmbedFooterText: ch.discordEmbedFooterText,
            discordEmbedFooterIconUrl: ch.discordEmbedFooterIconUrl,
            discordEmbedTimestamp: ch.discordEmbedTimestamp,
            discordAllowUserMentions: ch.discordAllowUserMentions,
            discordAllowRoleMentions: ch.discordAllowRoleMentions,
            discordAllowEveryoneMentions: ch.discordAllowEveryoneMentions,
            discordSuppressEmbeds: ch.discordSuppressEmbeds,
            discordSuppressNotifications: ch.discordSuppressNotifications,
          });
        case "slack":
          return createSlackNotifier(ch.webhookUrl, {
            template: ch.template,
            downTemplate: ch.downTemplate,
            upTemplate: ch.upTemplate,
          });
        default:
          return null;
      }
    })
    .filter((n): n is Notifier => n !== null);
}

export async function sendNotifications(notifiers: Notifier[], payload: NotifyPayload) {
  await Promise.allSettled(notifiers.map((n) => n.notify(payload)));
}
