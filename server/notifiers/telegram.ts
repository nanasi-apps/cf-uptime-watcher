import { telegramTransport, type RenderedTelegram } from "@betternotify/telegram";
import { renderTemplate, resolveTemplate, type NotificationTemplates } from "./template";
import type { Notifier, NotifyPayload } from "./types";

type TelegramNotifierConfig = NotificationTemplates & {
  telegramBotToken: string;
  telegramChatId: string;
};

export function buildTelegramMessage(
  config: TelegramNotifierConfig,
  payload: NotifyPayload,
): RenderedTelegram {
  return {
    body: renderTemplate(resolveTemplate(config, payload), payload),
    to: config.telegramChatId,
  };
}

export function createTelegramNotifier(config: TelegramNotifierConfig): Notifier {
  return {
    name: "telegram",
    async notify(payload) {
      const transport = telegramTransport({ token: config.telegramBotToken });
      await transport.send(buildTelegramMessage(config, payload), {
        route: "healthcheck.telegram",
        messageId: crypto.randomUUID(),
        attempt: 1,
      });
    },
  };
}
