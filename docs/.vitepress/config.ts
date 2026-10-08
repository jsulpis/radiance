import { defineConfig, loadEnv } from "vitepress";
import { readFileSync } from "node:fs";
import { groupIconMdPlugin, groupIconVitePlugin } from "vitepress-plugin-group-icons";
import container from "markdown-it-container";
import llmstxt from "vitepress-plugin-llms";
import { apiSidebar, examplesSidebar } from "./sidebars";
import pkg from "../../lib/package.json";

const env = loadEnv(process.env.VERCEL_ENV || "development", process.cwd(), "");

// https://vitepress.dev/reference/site-config
const config = defineConfig({
  title: "Radiance",
  description: "A toolkit for building shader-driven experiences.",
  appearance: "force-dark",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: "Guide",
        link: "/guide/introduction/getting-started",
        activeMatch: "/guide/",
      },
      {
        text: "Examples",
        link: "/examples/basics/full-screen/",
        activeMatch: "/examples/",
      },
      {
        text: "API",
        link: "/api/",
        activeMatch: "/api/",
      },
      {
        text: `v${pkg.version}`,
        items: [
          {
            text: "Changelog",
            link: "https://github.com/jsulpis/radiance/releases",
          },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          base: "/guide/introduction/",
          items: [
            { text: "Why this lib?", link: "why-this-lib" },
            { text: "Getting Started", link: "getting-started" },
            { text: "Recommended Tooling", link: "recommended-tooling" },
          ],
        },
        {
          text: "Essentials",
          base: "/guide/essentials/",
          items: [
            { text: "Update uniforms at runtime", link: "update-uniforms" },
            { text: "Choose when to render", link: "render-modes" },
            { text: "Handle resize and device pixel ratio", link: "resize-and-dpr" },
            { text: "Draw custom geometry", link: "draw-geometry" },
            { text: "Sample images, videos and data", link: "load-textures" },
            { text: "React to pointer events", link: "pointer-events" },
          ],
        },
        {
          text: "Post-processing",
          base: "/guide/post-processing/",
          items: [
            { text: "Write a custom post-processing effect", link: "custom-effect" },
            { text: "Chain and order post effects", link: "effect-chain" },
            { text: "Tone map the output", link: "tone-map-the-output" },
          ],
        },
        {
          text: "GPU Simulations",
          base: "/guide/gpgpu/",
          items: [
            { text: "Run a simulation with ping-pong framebuffers", link: "ping-pong-simulations" },
            { text: "Capture vertex output with transform feedback", link: "transform-feedback" },
          ],
        },
        {
          text: "Advanced Usage",
          base: "/guide/advanced/",
          items: [
            { text: "Mount and unmount in a UI framework", link: "mount-in-a-ui-framework" },
            { text: "Render in a worker with OffscreenCanvas", link: "offscreen-worker" },
          ],
        },
        {
          text: "Troubleshooting",
          base: "/guide/troubleshooting/",
          items: [
            { text: "Debug shader compilation errors", link: "debug-shader-errors" },
            { text: "Fix a black or frozen canvas", link: "fix-a-black-canvas" },
          ],
        },
        {
          text: "Concepts",
          base: "/guide/concepts/",
          items: [
            { text: "About reactive rendering", link: "reactive-rendering" },
            { text: "About the rendering pipeline", link: "rendering-pipeline" },
            { text: "About GPU computation", link: "gpgpu" },
            { text: "About color management", link: "color-management" },
            { text: "About performance", link: "performance" },
          ],
        },
        {
          text: "Reference",
          base: "/guide/reference/",
          items: [
            { text: "Shader conventions", link: "shader-conventions" },
            { text: "Uniform values and sources", link: "uniform-sources" },
            { text: "Built-in effects", link: "built-in-effects" },
          ],
        },
      ],
      "/examples/": examplesSidebar,
      "/api/": apiSidebar,
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/jsulpis/radiance" },
      { icon: "npm", link: "https://npmx.dev/package/@radiancejs/gl" },
    ],

    outline: {
      level: "deep",
    },

    search: {
      provider: "local",
    },

    footer: {
      message: "Released under the MIT License.",
      copyright: "© 2024-present Julien Sulpis",
    },
  },

  head: [
    [
      "script",
      {
        defer: "true",
        src: "https://gateway.jsulpis.cloud/api/script.js",
        "data-site-id": "3e3c7b222054",
      },
    ],
    [
      "script",
      {
        defer: "true",
        src: env.UMAMI_SCRIPT_URL || "",
        "data-website-id": env.UMAMI_WEBSITE_ID || "",
      },
    ],
  ],

  markdown: {
    languageAlias: {
      frag: "glsl",
      vert: "glsl",
    },
    config(md) {
      md.use(groupIconMdPlugin);
      md.use(container, "example-editor", {
        render(tokens: unknown[], idx: number) {
          const token = tokens[idx] as {
            nesting: number;
            attrs?: [string, string][];
          };
          if (token.nesting === -1) return "</ExampleEditor>";

          const files = [];
          for (
            let index = idx + 1;
            tokens[index]?.type !== token.type.replace("_open", "_close");
            index++
          ) {
            const item = tokens[index] as any;
            if (item.type === "fence") {
              const source = item.src?.[0];
              files.push({
                info: item.info || "",
                code: item.content || (source ? readFileSync(source, "utf8") : ""),
              });
            }
          }
          const attrs = (token.attrs || [])
            .map(([name, value]) => `${name}="${value || ""}"`)
            .join(" ");

          return `<ExampleEditor source-files="${encodeURIComponent(JSON.stringify(files))}" ${attrs}>`;
        },
      });
    },
  },

  transformPageData(pageData) {
    if (pageData.relativePath.startsWith("examples/")) {
      return {
        ...pageData,
        title: `${pageData.frontmatter.title} example`,
        frontmatter: {
          prev: false,
          next: false,
          aside: false,
          layout: "doc",
          pageClass: "example-page",
          ...pageData.frontmatter,
        },
      };
    }
    return pageData;
  },

  outDir: "dist",

  srcExclude: ["AGENTS.md"],

  vite: {
    plugins: [
      groupIconVitePlugin(),
      llmstxt({
        customLLMsTxtTemplate: `# {title}

{description} {details}

You can find below three groups of links:

1. User guides to get started with the library and learn how to use it (starting from "### Introduction")
2. Code samples for different use cases (starting from "### Basics")
3. Documentation of the API: functions, types etc (starting from "### Core")

## Table of Contents

{toc}`,
        ignoreFiles: ["api/*/*", "api/index.md", "AGENTS.md"],
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern",
        },
      },
    },
  },

  ignoreDeadLinks: [/\.agents/],
});

export default config;
