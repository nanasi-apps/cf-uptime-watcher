import { defineNuxtConfig } from "nuxt/config";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  css: [
    "element-plus/dist/index.css",
    "element-plus/theme-chalk/dark/css-vars.css",
    "~/assets/css/tailwind.css",
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  components: [{ path: "~/components", pathPrefix: false }],

  nitro: {
    preset: "cloudflare-module",
    experimental: { tasks: true },
    scheduledTasks: { "*/5 * * * *": ["healthcheck"] },
  },

  app: {
    head: {
      title: "Uptime Monitor",
      meta: [
        {
          name: "description",
          content: "Uptime monitoring powered by Cloudflare Workers",
        },
      ],
      script: [
        {
          src: "https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js",
          "data-name": "BMC-Widget",
          "data-cfasync": "false",
          "data-id": "mattyatea",
          "data-description": "Support me on Buy me a coffee!",
          "data-message": "",
          "data-color": "#40DCA5",
          "data-position": "Right",
          "data-x_margin": "18",
          "data-y_margin": "18",
        },
      ],
    },
  },

  compatibilityDate: "2026-03-12",
});
