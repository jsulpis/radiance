import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const output = process.env.CONSUMER_ENTRY;

if (!output) {
  throw new Error("CONSUMER_ENTRY is required");
}

await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `import { glCanvas } from "@radiancejs/gl";

glCanvas({
  canvas: "canvas",
  fragment: await fetch("/shaders/fullscreen.frag").then((res) => res.text()),
});
`,
);
