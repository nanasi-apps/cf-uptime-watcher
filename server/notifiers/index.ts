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
          return createDiscordNotifier(ch.webhookUrl, ch.template);
        case "slack":
          return createSlackNotifier(ch.webhookUrl, ch.template);
        default:
          return null;
      }
    })
    .filter((n): n is Notifier => n !== null);
}

export async function sendNotifications(notifiers: Notifier[], payload: NotifyPayload) {
  await Promise.allSettled(notifiers.map((n) => n.notify(payload)));
}
