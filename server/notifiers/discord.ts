import { DEFAULT_TEMPLATE, renderTemplate } from "./template";
import type { Notifier, NotifyPayload } from "./types";

export function createDiscordNotifier(webhookUrl: string, template?: string | null): Notifier {
  return {
    name: "discord",
    async notify(payload: NotifyPayload) {
      const message = renderTemplate(template ?? DEFAULT_TEMPLATE, payload);
      const isDown = !payload.result.isUp;
      const color = isDown ? 0xff0000 : 0x00ff00;

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              description: message,
              color,
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    },
  };
}
