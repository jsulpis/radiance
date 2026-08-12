import { gzipSync } from "node:zlib";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const reportDir = process.env.REPORT_DIR;
const libraryDist = process.env.LIBRARY_DIST;
const consumerDist = process.env.CONSUMER_DIST;

if (!reportDir || !libraryDist || !consumerDist) {
  throw new Error("REPORT_DIR, LIBRARY_DIST, and CONSUMER_DIST are required");
}

const [library, consumer] = await Promise.all([
  readFile(join(libraryDist, "index.js")),
  readFile(join(consumerDist, "glcanvas-entry.js")),
]);
const report = {
  libraryGzipBytes: gzipSync(library).byteLength,
  glCanvasGzipBytes: gzipSync(consumer).byteLength,
};

await mkdir(reportDir, { recursive: true });
await writeFile(join(reportDir, "report.json"), `${JSON.stringify(report)}\n`);
console.log(report);
