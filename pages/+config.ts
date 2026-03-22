import type { Config } from "vike/types";
import vikePhoton from "vike-photon/config";
import vikeVue from "vike-vue/config";

export default {
  title: "CF Healthcheck",
  description: "Uptime monitoring powered by Cloudflare Workers",
  extends: [vikeVue, vikePhoton],
  prerender: false,
  photon: {
    server: "../server/entry.ts",
  },
} as Config;
