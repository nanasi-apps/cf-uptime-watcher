import { describe, expect, test } from "vite-plus/test";
import { buildDiscordPayload } from "./discord";
import type { NotifyPayload } from "./types";

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
    errorMessage: "Server error",
  },
  previouslyUp: true,
};

describe("buildDiscordPayload", () => {
  test("builds the default embed payload", () => {
    const body = buildDiscordPayload({}, payload);

    expect(body.embeds).toMatchObject([
      {
        description: expect.stringContaining("[DOWN] API"),
        color: 0xff0000,
      },
    ]);
  });

  test("adds configured Discord webhook fields", () => {
    const body = buildDiscordPayload(
      {
        discordContent: "{{status}} {{monitor.name}}",
        discordUsername: "Healthcheck",
        discordAvatarUrl: "https://example.com/avatar.png",
        discordTts: true,
      },
      payload,
    );

    expect(body).toMatchObject({
      content: "DOWN API",
      username: "Healthcheck",
      avatar_url: "https://example.com/avatar.png",
      tts: true,
      embeds: [{ description: expect.stringContaining("[DOWN] API") }],
    });
  });
});
