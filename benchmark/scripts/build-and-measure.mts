import { brotliCompressSync, gzipSync } from "node:zlib";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const benchmarkRoot = resolve(__dirname, "..");
const distRoot = resolve(benchmarkRoot, "dist");
const resultsDir = resolve(benchmarkRoot, "results");
const docsDataDir = resolve(benchmarkRoot, "..", "docs", ".vitepress", "data");
const docsBundleDataPath = resolve(docsDataDir, "bundle-size.json");
const benchmarkPackageJsonPath = resolve(benchmarkRoot, "package.json");
const libPackageJsonPath = resolve(benchmarkRoot, "..", "lib", "package.json");

const apps = [
  { id: "radiance", name: "@radiancejs/gl" },
  { id: "three", name: "three" },
  { id: "ogl", name: "ogl" },
  { id: "twgl", name: "twgl.js" },
  { id: "vanilla", name: "vanilla WebGL" },
] as const;

type AppResult = {
  id: string;
  name: string;
  version: string;
  sloc: number;
  outputDir: string;
  rawBytes: number;
  gzipBytes: number;
  brotliBytes: number;
  jsFiles: Array<{
    file: string;
    rawBytes: number;
    gzipBytes: number;
    brotliBytes: number;
  }>;
};

type PackageJson = {
  version?: string;
  dependencies?: Record<string, string>;
};

async function main() {
  const versions = await loadAppVersions();
  await rm(distRoot, { recursive: true, force: true });
  await rm(resultsDir, { recursive: true, force: true });
  await mkdir(resultsDir, { recursive: true });
  await mkdir(docsDataDir, { recursive: true });

  const results: AppResult[] = [];
  const generatedAt = new Date().toISOString();

  for (const app of apps) {
    const outputDir = resolve(distRoot, app.id);
    await buildApp(app.id, outputDir);
    results.push(await measureApp(app.id, app.name, versions[app.id], outputDir));
  }

  const resultsJsonPath = resolve(resultsDir, "results.json");
  const resultsMarkdownPath = resolve(resultsDir, "results.md");

  await writeFile(resultsJsonPath, `${JSON.stringify({ generatedAt, results }, null, 2)}\n`);
  await writeFile(resultsMarkdownPath, `${toMarkdown(results)}\n`);
  await writeFile(
    docsBundleDataPath,
    `${JSON.stringify(toDocsBundleData(results, generatedAt), null, 2)}\n`,
  );

  printTable(results);
  console.log(`\nSaved JSON report to ${relativeToBenchmark(resultsJsonPath)}`);
  console.log(`Saved Markdown report to ${relativeToBenchmark(resultsMarkdownPath)}`);
  console.log(`Saved docs data to ${relativeToRepo(docsBundleDataPath)}`);
}

async function buildApp(appId: string, outputDir: string) {
  const input = resolve(benchmarkRoot, "apps", `${appId}.html`);

  await build({
    configFile: resolve(benchmarkRoot, "vite.config.ts"),
    root: benchmarkRoot,
    logLevel: "error",
    build: {
      emptyOutDir: true,
      outDir: outputDir,
      reportCompressedSize: false,
      rollupOptions: {
        input,
        output: {
          manualChunks: undefined,
          inlineDynamicImports: true,
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name][extname]",
        },
      },
    },
  });
}

async function measureApp(
  id: string,
  name: string,
  version: string,
  outputDir: string,
): Promise<AppResult> {
  const sourceFile = resolve(benchmarkRoot, "src", "apps", id, "main.ts");
  const sourceContent = await readFile(sourceFile, "utf8");
  const jsFiles = await collectJsFiles(outputDir);
  const measurements = await Promise.all(
    jsFiles.map(async (file) => {
      const content = await readFile(file);
      return {
        file: relativeToBenchmark(file),
        rawBytes: content.byteLength,
        gzipBytes: gzipSync(content).byteLength,
        brotliBytes: brotliCompressSync(content).byteLength,
      };
    }),
  );

  return {
    id,
    name,
    version,
    sloc: countSloc(sourceContent),
    outputDir: relativeToBenchmark(outputDir),
    rawBytes: sum(measurements.map((item) => item.rawBytes)),
    gzipBytes: sum(measurements.map((item) => item.gzipBytes)),
    brotliBytes: sum(measurements.map((item) => item.brotliBytes)),
    jsFiles: measurements,
  };
}

async function collectJsFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectJsFiles(entryPath);
      }

      return entry.name.endsWith(".js") ? [entryPath] : [];
    }),
  );

  return files.flat().sort();
}

function toMarkdown(results: AppResult[]) {
  const lines = [
    "# Bundle size benchmark",
    "",
    "| App | Version | main.ts SLOC | Raw JS | Gzip | Brotli |",
    "| --- | --- | ---: | ---: | ---: | ---: |",
    ...results.map(
      (result) =>
        `| ${result.name} | ${result.version} | ${result.sloc} | ${formatBytes(result.rawBytes)} | ${formatBytes(result.gzipBytes)} | ${formatBytes(result.brotliBytes)} |`,
    ),
    "",
  ];

  return lines.join("\n");
}

function printTable(results: AppResult[]) {
  const rows = results.map((result) => ({
    App: result.name,
    Version: result.version,
    "main.ts SLOC": result.sloc,
    Raw: formatBytes(result.rawBytes),
    Gzip: formatBytes(result.gzipBytes),
    Brotli: formatBytes(result.brotliBytes),
  }));

  console.table(rows);
}

function toDocsBundleData(results: AppResult[], generatedAt: string) {
  const metric = "gzipBytes" as const;

  return {
    generatedAt,
    items: [...results]
      .sort((a, b) => a[metric] - b[metric])
      .map((result) => ({
        id: result.id,
        label: result.name,
        version: result.version,
        sloc: result.sloc,
        gzip: formatBytes(result[metric]),
      })),
  };
}

function formatBytes(bytes: number) {
  return Number((bytes / 1024).toFixed(2));
}

async function loadAppVersions() {
  const benchmarkPackageJson = await readJsonFile<PackageJson>(benchmarkPackageJsonPath);
  const libPackageJson = await readJsonFile<PackageJson>(libPackageJsonPath);

  return {
    radiance: libPackageJson.version ?? "unknown",
    three: benchmarkPackageJson.dependencies?.three ?? "unknown",
    ogl: benchmarkPackageJson.dependencies?.ogl ?? "unknown",
    twgl: benchmarkPackageJson.dependencies?.["twgl.js"] ?? "unknown",
    vanilla: "",
  } satisfies Record<(typeof apps)[number]["id"], string>;
}

async function readJsonFile<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function countSloc(source: string) {
  let inBlockComment = false;

  return source.split(/\r?\n/).reduce((count, line) => {
    let code = "";
    let index = 0;

    while (index < line.length) {
      if (inBlockComment) {
        const blockEnd = line.indexOf("*/", index);

        if (blockEnd === -1) {
          index = line.length;
          break;
        }

        inBlockComment = false;
        index = blockEnd + 2;
        continue;
      }

      const blockStart = line.indexOf("/*", index);
      const lineComment = line.indexOf("//", index);

      if (lineComment !== -1 && (blockStart === -1 || lineComment < blockStart)) {
        code += line.slice(index, lineComment);
        break;
      }

      if (blockStart !== -1) {
        code += line.slice(index, blockStart);
        inBlockComment = true;
        index = blockStart + 2;
        continue;
      }

      code += line.slice(index);
      break;
    }

    return code.trim() ? count + 1 : count;
  }, 0);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function relativeToBenchmark(path: string) {
  return path.replace(`${benchmarkRoot}/`, "");
}

function relativeToRepo(path: string) {
  return path.replace(`${resolve(benchmarkRoot, "..")}/`, "");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
