import { describe, expect, test } from "vite-plus/test";
import { buildSlackWebhookPayload } from "./slack";
import { buildTelegramMessage } from "./telegram";
import { buildTwilioMessage } from "./twilio";
import type { NotifyPayload } from "./types";
import { buildZapierPayload } from "./zapier";

const payload: NotifyPayload = {
  monitor: {
    id: 1,
    name: "API",
    displayName: null,
    url: "https://example.com/health",
    method: "GET",
    headers: null,
    body: null,
    timeout: 30,
    expectedStatus: 200,
    active: true,
    createdAt: "2026-05-08T00:00:00.000Z",
  },
  result: {
    statusCode: 500,
    responseTime: 123,
    isUp: false,
    status: "down",
    errorMessage: "Server error",
  },
  previouslyUp: true,
};

describe("provider payload builders", () => {
  test("builds Slack webhook attachments from templates", () => {
    const body = buildSlackWebhookPayload({ downTemplate: "{{monitor.name}} {{status}}" }, payload);

    expect(body).toEqual({ attachments: [{ color: "#ff0000", text: "API DOWN" }] });
  });

  test("builds Telegram messages with chat destination", () => {
    const body = buildTelegramMessage(
      {
        telegramBotToken: "bot-token",
        telegramChatId: "12345",
        downTemplate: "{{monitor.name}} {{statusCode}}",
      },
      payload,
    );

    expect(body).toEqual({ body: "API 500", to: "12345" });
  });

  test("builds Zapier event payloads with monitor data", () => {
    const body = buildZapierPayload(
      { webhookUrl: "https://hooks.zapier.com/hooks/catch/1/abc", downTemplate: "{{error}}" },
      payload,
    );

    expect(body).toMatchObject({
      event: "monitor.down",
      data: {
        message: "Server error",
        monitorName: "API",
        status: "DOWN",
        statusCode: 500,
        responseTime: 123,
      },
      meta: { provider: "cf-healthcheck" },
    });
  });

  test("builds Twilio SMS messages with phone destination", () => {
    const body = buildTwilioMessage(
      {
        twilioAccountSid: "AC123",
        twilioAuthToken: "auth-token",
        twilioFrom: "+15551234567",
        twilioTo: "+15557654321",
        downTemplate: "{{monitor.name}} {{status}}",
      },
      payload,
    );

    expect(body).toEqual({ body: "API DOWN", to: "+15557654321" });
  });
});
