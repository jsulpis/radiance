import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const output = process.env.CONSUMER_ENTRY;
const libraryEntry = process.env.LIBRARY_ENTRY;

if (!output || !libraryEntry) {
  throw new Error("CONSUMER_ENTRY and LIBRARY_ENTRY are required");
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `export { glCanvas } from ${JSON.stringify(libraryEntry)};`);
