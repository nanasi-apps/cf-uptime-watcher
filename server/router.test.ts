import { describe, expect, test } from "vite-plus/test";
import { maskMonitorData } from "./router";

const monitor = {
  id: 1,
  name: "Internal API",
  displayName: "Public API",
  url: "https://internal.example.com/health",
  method: "GET",
  headers: "{}",
  body: null,
  timeout: 30,
  expectedStatus: 200,
  active: true,
  createdAt: "2026-05-08T00:00:00.000Z",
};

describe("maskMonitorData", () => {
  test("omits URLs from unauthenticated responses", () => {
    const masked = maskMonitorData(monitor, false);

    expect("url" in masked).toBe(false);
    expect(masked.name).toBe("Public API");
    expect(masked.headers).toBeNull();
    expect(masked.body).toBeNull();
  });

  test("keeps URLs for authenticated responses", () => {
    const visible = maskMonitorData(monitor, true);

    expect(visible.url).toBe("https://internal.example.com/health");
  });
});
