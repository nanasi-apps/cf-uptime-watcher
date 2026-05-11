import type { NotificationChannel } from "../../database/drizzle/schema/notification-channels";
import { createDiscordNotifier } from "./discord";
import { createSlackNotifier } from "./slack";
import { createTelegramNotifier } from "./telegram";
import { createTwilioNotifier } from "./twilio";
import type { Notifier, NotifyPayload } from "./types";
import { createZapierNotifier } from "./zapier";

export type { Notifier, NotifyPayload };

export function buildNotifiersFromChannels(channels: NotificationChannel[]): Notifier[] {
  return channels
    .map((ch) => {
      switch (ch.type) {
        case "discord":
          if (!ch.webhookUrl) return null;
          return createDiscordNotifier({
            webhookUrl: ch.webhookUrl,
            template: ch.template,
            downTemplate: ch.downTemplate,
            upTemplate: ch.upTemplate,
            discordContent: ch.discordContent,
            discordUsername: ch.discordUsername,
            discordAvatarUrl: ch.discordAvatarUrl,
            discordTts: ch.discordTts,
            discordEmbedTitle: ch.discordEmbedTitle,
            discordEmbedDescription: ch.discordEmbedDescription,
            discordDownEmbedDescription: ch.discordDownEmbedDescription,
            discordUpEmbedDescription: ch.discordUpEmbedDescription,
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
          return createSlackNotifier({
            webhookUrl: ch.webhookUrl,
            slackBotToken: ch.slackBotToken,
            slackChannel: ch.slackChannel,
            template: ch.template,
            downTemplate: ch.downTemplate,
            upTemplate: ch.upTemplate,
          });
        case "telegram":
          if (!ch.telegramBotToken || !ch.telegramChatId) return null;
          return createTelegramNotifier({
            telegramBotToken: ch.telegramBotToken,
            telegramChatId: ch.telegramChatId,
            template: ch.template,
            downTemplate: ch.downTemplate,
            upTemplate: ch.upTemplate,
          });
        case "zapier":
          if (!ch.webhookUrl) return null;
          return createZapierNotifier({
            webhookUrl: ch.webhookUrl,
            template: ch.template,
            downTemplate: ch.downTemplate,
            upTemplate: ch.upTemplate,
          });
        case "twilio":
          if (!ch.twilioAccountSid || !ch.twilioAuthToken || !ch.twilioFrom || !ch.twilioTo) {
            return null;
          }
          return createTwilioNotifier({
            twilioAccountSid: ch.twilioAccountSid,
            twilioAuthToken: ch.twilioAuthToken,
            twilioFrom: ch.twilioFrom,
            twilioTo: ch.twilioTo,
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
