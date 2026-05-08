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
            discordContent: ch.discordContent,
            discordUsername: ch.discordUsername,
            discordAvatarUrl: ch.discordAvatarUrl,
            discordTts: ch.discordTts,
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
