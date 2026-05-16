import type { NotificationChannel } from "../../database/drizzle/schema/notification-channels";
import { createDiscordNotifier } from "./discord";
import { createSlackNotifier } from "./slack";
import { createTelegramNotifier } from "./telegram";
import { createTwilioNotifier } from "./twilio";
import type { Notifier, NotifyPayload } from "./types";
import { createZapierNotifier } from "./zapier";

export type { Notifier, NotifyPayload };

function channelMeta(channel: NotificationChannel) {
  return { channelId: channel.id, channelName: channel.name, channelType: channel.type };
}

function logNotifierBuildSkipped(channel: NotificationChannel, reason: string) {
  console.info({
    event: "notification.notifier.build.skipped",
    reason,
    ...channelMeta(channel),
  });
}

function attachChannel(notifier: Notifier, channel: NotificationChannel): Notifier {
  return {
    ...notifier,
    channel: {
      id: channel.id,
      name: channel.name,
      type: channel.type,
    },
  };
}

export function buildNotifiersFromChannels(channels: NotificationChannel[]): Notifier[] {
  return channels
    .map((ch) => {
      switch (ch.type) {
        case "discord":
          if (!ch.webhookUrl) {
            logNotifierBuildSkipped(ch, "missing_webhook_url");
            return null;
          }
          return attachChannel(
            createDiscordNotifier({
              webhookUrl: ch.webhookUrl,
              channelId: ch.id,
              channelName: ch.name,
              channelType: ch.type,
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
            }),
            ch,
          );
        case "slack":
          return attachChannel(
            createSlackNotifier({
              webhookUrl: ch.webhookUrl,
              slackBotToken: ch.slackBotToken,
              slackChannel: ch.slackChannel,
              template: ch.template,
              downTemplate: ch.downTemplate,
              upTemplate: ch.upTemplate,
            }),
            ch,
          );
        case "telegram":
          if (!ch.telegramBotToken || !ch.telegramChatId) {
            logNotifierBuildSkipped(ch, "missing_telegram_bot_token_or_chat_id");
            return null;
          }
          return attachChannel(
            createTelegramNotifier({
              telegramBotToken: ch.telegramBotToken,
              telegramChatId: ch.telegramChatId,
              template: ch.template,
              downTemplate: ch.downTemplate,
              upTemplate: ch.upTemplate,
            }),
            ch,
          );
        case "zapier":
          if (!ch.webhookUrl) {
            logNotifierBuildSkipped(ch, "missing_webhook_url");
            return null;
          }
          return attachChannel(
            createZapierNotifier({
              webhookUrl: ch.webhookUrl,
              template: ch.template,
              downTemplate: ch.downTemplate,
              upTemplate: ch.upTemplate,
            }),
            ch,
          );
        case "twilio":
          if (!ch.twilioAccountSid || !ch.twilioAuthToken || !ch.twilioFrom || !ch.twilioTo) {
            logNotifierBuildSkipped(ch, "missing_twilio_credentials_or_numbers");
            return null;
          }
          return attachChannel(
            createTwilioNotifier({
              twilioAccountSid: ch.twilioAccountSid,
              twilioAuthToken: ch.twilioAuthToken,
              twilioFrom: ch.twilioFrom,
              twilioTo: ch.twilioTo,
              template: ch.template,
              downTemplate: ch.downTemplate,
              upTemplate: ch.upTemplate,
            }),
            ch,
          );
        default:
          logNotifierBuildSkipped(ch, "unsupported_channel_type");
          return null;
      }
    })
    .filter((n): n is Notifier => n !== null);
}

export async function sendNotifications(notifiers: Notifier[], payload: NotifyPayload) {
  const results = await Promise.allSettled(notifiers.map((n) => n.notify(payload)));
  const rejected = results.filter((result) => result.status === "rejected");

  console.info({
    event: "notification.dispatch.completed",
    monitorId: payload.monitor.id,
    monitorName: payload.monitor.name,
    previouslyUp: payload.previouslyUp,
    isUp: payload.result.isUp,
    notifierCount: notifiers.length,
    fulfilledCount: results.length - rejected.length,
    rejectedCount: rejected.length,
  });

  results.forEach((result, index) => {
    if (result.status !== "rejected") return;

    const notifier = notifiers[index];
    console.error({
      event: "notification.dispatch.notifier.failed",
      monitorId: payload.monitor.id,
      monitorName: payload.monitor.name,
      notifierName: notifier?.name,
      channelId: notifier?.channel?.id,
      channelName: notifier?.channel?.name,
      channelType: notifier?.channel?.type,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    });
  });
}
