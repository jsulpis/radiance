import { gzipSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";

const { build } = createRequire(`${process.cwd()}/package.json`)(
  "tsdown",
) as typeof import("tsdown");

const reportDir = process.env.REPORT_DIR;
const consumerEntry = process.env.CONSUMER_ENTRY;

if (!reportDir || !consumerEntry) {
  throw new Error("REPORT_DIR and CONSUMER_ENTRY are required");
}

const options = {
  format: "esm" as const,
  platform: "browser" as const,
  target: "esnext",
  minify: true,
  config: false,
  write: false,
  publint: false,
  attw: false,
};
const [[libraryResult], [consumerResult]] = await Promise.all([
  build({ ...options, entry: ["dist/index.js"], outDir: ".size-library" }),
  build({ ...options, entry: [consumerEntry], outDir: ".size-consumer" }),
]);
const library = Buffer.from(libraryResult.chunks[0].code);
const consumer = Buffer.from(consumerResult.chunks[0].code);
const report = {
  libraryGzipBytes: gzipSync(library).byteLength,
  glCanvasGzipBytes: gzipSync(consumer).byteLength,
};

await mkdir(reportDir, { recursive: true });
await writeFile(join(reportDir, "report.json"), `${JSON.stringify(report)}\n`);
console.log(report);
