import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

export default defineConfig({
  site: "https://bryandong24.github.io",
  base: "/research-notes",
  output: "static",
  trailingSlash: "always",
  integrations: [mdx()],
  markdown: {
    shikiConfig: {
      theme: "github-light",
      wrap: true
    }
  }
});
