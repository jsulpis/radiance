import { defineConfig } from "vite";

export default defineConfig({
  appType: "mpa",
  build: {
    target: "es2022",
    cssCodeSplit: false,
    modulePreload: false,
  },
});
