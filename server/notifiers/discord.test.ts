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
    status: "down",
    errorMessage: "Server error",
  },
  previouslyUp: true,
};

describe("buildDiscordPayload", () => {
  test("builds the default Better Notify Discord payload", () => {
    const body = buildDiscordPayload({}, payload);

    expect(body.body).toBe("");
    expect(body.embeds).toMatchObject([
      {
        title: "ダウンした時のレポート",
        description: expect.stringContaining("対象: API"),
        color: 0xff0000,
      },
    ]);
  });

  test("adds Better Notify Discord identity fields", () => {
    const body = buildDiscordPayload(
      {
        discordUsername: "Healthcheck",
        discordAvatarUrl: "https://example.com/avatar.png",
      },
      payload,
    );

    expect(body).toMatchObject({
      username: "Healthcheck",
      avatarUrl: "https://example.com/avatar.png",
      embeds: [{ title: "ダウンした時のレポート" }],
    });
  });

  test("uses custom content as the Discord body and disables embeds when configured", () => {
    const body = buildDiscordPayload(
      {
        discordContent: "{{monitor.name}} plain text",
        discordEmbedEnabled: false,
      },
      payload,
    );

    expect(body).toMatchObject({ body: "API plain text" });
    expect(body.embeds).toBeUndefined();
  });

  test("builds extended Better Notify Discord embeds", () => {
    const body = buildDiscordPayload(
      {
        discordEmbedTitle: "{{monitor.name}} alert",
        discordEmbedDescription: "{{monitor.name}} report {{responseTime}}",
        discordEmbedUrl: "{{monitor.url}}",
        discordEmbedColor: "#336699",
        discordEmbedAuthorName: "{{monitor.name}} author",
        discordEmbedAuthorUrl: "{{monitor.url}}",
        discordEmbedAuthorIconUrl: "https://example.com/author.png",
        discordEmbedThumbnailUrl: "https://example.com/thumb.png",
        discordEmbedImageUrl: "https://example.com/image.png",
        discordEmbedFooterText: "{{responseTime}}",
        discordEmbedFooterIconUrl: "https://example.com/footer.png",
        discordEmbedTimestamp: false,
      },
      payload,
    );

    expect(body).toMatchObject({
      embeds: [
        {
          title: "API alert",
          description: "API report 123ms",
          url: "https://example.com/health",
          color: 0x336699,
          author: {
            name: "API author",
            url: "https://example.com/health",
            icon_url: "https://example.com/author.png",
          },
          thumbnail: { url: "https://example.com/thumb.png" },
          image: { url: "https://example.com/image.png" },
          footer: { text: "123ms", icon_url: "https://example.com/footer.png" },
        },
      ],
    });

    if (!Array.isArray(body.embeds) || typeof body.embeds[0] !== "object" || !body.embeds[0]) {
      throw new Error("Expected embeds to include one object");
    }

    expect(body.embeds[0].timestamp).toBeUndefined();
  });
  test("uses down and recovery template overrides for Discord content and embeds", () => {
    const downBody = buildDiscordPayload(
      {
        discordContent: "standard content",
        downTemplate: "down content {{monitor.name}}",
        upTemplate: "up content {{monitor.name}}",
        discordEmbedDescription: "standard embed",
        discordDownEmbedDescription: "down embed {{monitor.name}}",
        discordUpEmbedDescription: "up embed {{monitor.name}}",
      },
      payload,
    );

    const recoveryBody = buildDiscordPayload(
      {
        discordContent: "standard content",
        downTemplate: "down content {{monitor.name}}",
        upTemplate: "up content {{monitor.name}}",
        discordEmbedDescription: "standard embed",
        discordDownEmbedDescription: "down embed {{monitor.name}}",
        discordUpEmbedDescription: "up embed {{monitor.name}}",
      },
      { ...payload, result: { ...payload.result, isUp: true, status: "up" } },
    );

    expect(downBody.body).toBe("down content API");
    expect(downBody.embeds).toMatchObject([{ description: "down embed API" }]);
    expect(recoveryBody.body).toBe("up content API");
    expect(recoveryBody.embeds).toMatchObject([{ description: "up embed API" }]);
  });
});
