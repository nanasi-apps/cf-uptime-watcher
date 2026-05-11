import { smsChannel, type RenderedSms } from "@betternotify/sms";
import { twilioSmsTransport } from "@betternotify/twilio";
import { renderTemplate, resolveTemplate, type NotificationTemplates } from "./template";
import type { Notifier, NotifyPayload } from "./types";

type TwilioNotifierConfig = NotificationTemplates & {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioFrom: string;
  twilioTo: string;
};

export function buildTwilioMessage(
  config: TwilioNotifierConfig,
  payload: NotifyPayload,
): RenderedSms {
  return {
    body: renderTemplate(resolveTemplate(config, payload), payload),
    to: config.twilioTo,
  };
}

export function createTwilioNotifier(config: TwilioNotifierConfig): Notifier {
  smsChannel();
  return {
    name: "twilio",
    async notify(payload) {
      const transport = twilioSmsTransport({
        accountSid: config.twilioAccountSid,
        authToken: config.twilioAuthToken,
        fromNumber: config.twilioFrom,
      });
      await transport.send(buildTwilioMessage(config, payload), {
        route: "healthcheck.twilio",
        messageId: crypto.randomUUID(),
        attempt: 1,
      });
    },
  };
}
