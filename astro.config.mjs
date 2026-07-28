import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

export default defineConfig({
  site: "https://bryandong24.github.io",
  base: "/research-notes",
  output: "static",
  trailingSlash: "always",
  integrations: [mdx()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex]
    }),
    shikiConfig: {
      theme: "github-light",
      wrap: true
    }
  }
});
