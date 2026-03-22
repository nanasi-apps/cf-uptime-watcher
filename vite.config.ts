import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import vike from "vike/plugin";
import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  lint: {
    plugins: ["eslint", "typescript", "unicorn", "oxc", "vue"],
    jsPlugins: [],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  plugins: [vike(), tailwindcss(), vue()],

  build: {
    rollupOptions: {
      external: ["wrangler"],
    },
  },
});
