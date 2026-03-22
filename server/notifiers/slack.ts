import { DEFAULT_TEMPLATE, renderTemplate } from "./template";
import type { Notifier, NotifyPayload } from "./types";

export function createSlackNotifier(webhookUrl: string, template?: string | null): Notifier {
  return {
    name: "slack",
    async notify(payload: NotifyPayload) {
      const message = renderTemplate(template ?? DEFAULT_TEMPLATE, payload);
      const isDown = !payload.result.isUp;
      const color = isDown ? "#ff0000" : "#00ff00";

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachments: [{ color, text: message }],
        }),
      });
    },
  };
}
