import { defineNuxtConfig } from "nuxt/config";

const i18nConfig = {
  i18n: {
    defaultLocale: "ja",
    strategy: "no_prefix",
    locales: [
      { code: "ja", name: "日本語", file: "ja.json" },
      { code: "en", name: "English", file: "en.json" },
    ],
    langDir: "locales",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "cf_hc_locale",
      redirectOn: "root",
    },
  },
};

export default Object.assign(
  defineNuxtConfig({
    modules: ["@nuxtjs/i18n"],

    css: [
      "element-plus/dist/index.css",
      "element-plus/theme-chalk/dark/css-vars.css",
      "~/assets/css/app.css",
    ],

    components: [{ path: "~/components", pathPrefix: false }],

    vite: {
      optimizeDeps: {
        include: ["element-plus", "@orpc/client", "@orpc/client/fetch"],
      },
    },

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
        link: [
          { rel: "preconnect", href: "https://fonts.googleapis.com" },
          { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
          {
            rel: "stylesheet",
            href: "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@300;400;500;700;900&family=Noto+Sans+JP:wght@100..900&display=swap",
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
  }),
  i18nConfig,
);
