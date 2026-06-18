/** @type {Partial<import("typedoc").TypeDocOptions & import("typedoc-plugin-markdown").PluginOptions>} */
const config = {
  plugin: ["typedoc-plugin-markdown", "typedoc-vitepress-theme"],
  entryPointStrategy: "expand",
  entryPoints: [
    "./src/core",
    "./src/effects",
    "./src/global",
    "./src/helpers",
    "./src/passes",
    "./src/types",
  ],
  out: "../docs/api",
  cleanOutputDir: true,
  exclude: ["**/buffer.ts", "**/watchBoundingRect.ts", "**/core/constants.ts"],
  disableSources: true,
  excludeInternal: true,
  navigation: {
    includeCategories: false,
    includeFolders: true,
    includeGroups: false,
  },
  sort: ["source-order"],
  // typedoc-plugin-vitepress options
  docsRoot: "../docs",
  // typedoc-plugin-markdown options
  useCodeBlocks: true,
  hideBreadcrumbs: true,
  expandObjects: true,
  expandParameters: true,
  indexFormat: "table",
  typeDeclarationFormat: "table",
  typeAliasPropertiesFormat: "table",
  pageTitleTemplates: {
    member: "{name}",
    module: "{name}",
  },
};

export default config;
