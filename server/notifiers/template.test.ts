import { describe, expect, test } from "vite-plus/test";
import { DEFAULT_TEMPLATE, renderTemplate, resolveTemplate } from "./template";
import type { NotifyPayload } from "./types";

const basePayload: NotifyPayload = {
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

test("renders RECOVERED for an up notification with the default template", () => {
  const rendered = renderTemplate(DEFAULT_TEMPLATE, {
    ...basePayload,
    result: {
      ...basePayload.result,
      isUp: true,
      status: "up",
      statusCode: 200,
      errorMessage: null,
    },
    previouslyUp: false,
  });

  expect(rendered).toContain("[RECOVERED] API");
  expect(rendered).not.toContain("[DOWN]");
});

describe("resolveTemplate", () => {
  test("prefers the down template for down notifications", () => {
    expect(resolveTemplate({ template: "shared", downTemplate: "down" }, basePayload)).toBe("down");
  });

  test("prefers the up template for recovery notifications", () => {
    expect(
      resolveTemplate(
        { template: "shared", upTemplate: "up" },
        { ...basePayload, result: { ...basePayload.result, isUp: true, status: "up" } },
      ),
    ).toBe("up");
  });

  test("falls back to the shared template", () => {
    expect(resolveTemplate({ template: "shared" }, basePayload)).toBe("shared");
  });
});
