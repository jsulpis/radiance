#!/usr/bin/env node
/**
 * Generates src/effects/dither/blueNoiseMask.ts with a void-and-cluster blue-noise
 * threshold mask (Ulichney 1993).
 *
 * The mask is embedded as base64 in the library, so its size is part of the bundle:
 * a 32x32 mask costs ~1 kB gzipped vs ~4 kB for 64x64, and the difference is not
 * visible at the default dither cell size. Bump SIZE only if you really need it.
 *
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SIZE = 32;
/** Gaussian standard deviation in pixels, as proposed by Ulichney. */
const SIGMA = 1.5;
/** Fraction of pixels set in the initial pattern. */
const SEED_FRACTION = 0.1;
/** Fixed seed, so the generated mask is reproducible. */
const SEED = 1;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(scriptDir, "../src/effects/dither/blueNoiseMask.ts");

const N = SIZE * SIZE;
const RADIUS = Math.ceil(SIGMA * 3);
const HALF = Math.floor(N / 2);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d_2b_79_f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Wrapped gaussian weights, flat: index = (dy * width + dx) offset into the torus. */
const { offsets, weights } = (() => {
  const offsets = [];
  const weights = [];
  let sum = 0;
  for (let dy = -RADIUS; dy <= RADIUS; dy++) {
    for (let dx = -RADIUS; dx <= RADIUS; dx++) {
      const w = Math.exp(-(dx * dx + dy * dy) / (2 * SIGMA * SIGMA));
      offsets.push([dx, dy]);
      weights.push(w);
      sum += w;
    }
  }
  return { offsets, weights: weights.map((w) => w / sum) };
})();

const wrap = (v) => ((v % SIZE) + SIZE) % SIZE;

function createField() {
  const bits = new Uint8Array(N);
  const energy = new Float64Array(N);

  const set = (p, value) => {
    const x = p % SIZE;
    const y = Math.floor(p / SIZE);
    const delta = value === 1 ? 1 : -1;
    bits[p] = value;
    for (const [k, [dx, dy]] of offsets.entries()) {
      energy[wrap(y + dy) * SIZE + wrap(x + dx)] += delta * weights[k];
    }
  };

  return { bits, energy, set };
}

/** Highest energy among set pixels. */
function tightestCluster({ bits, energy }) {
  let best = -1;
  let bestEnergy = -Infinity;
  for (let p = 0; p < N; p++) {
    if (bits[p] === 1 && energy[p] > bestEnergy) {
      bestEnergy = energy[p];
      best = p;
    }
  }
  return best;
}

/** Lowest energy among unset pixels. */
function largestVoid({ bits, energy }) {
  let best = -1;
  let bestEnergy = Infinity;
  for (let p = 0; p < N; p++) {
    if (bits[p] === 0 && energy[p] < bestEnergy) {
      bestEnergy = energy[p];
      best = p;
    }
  }
  return best;
}

function generate() {
  const random = mulberry32(SEED);
  const initialCount = Math.max(1, Math.min(HALF, Math.round(N * SEED_FRACTION)));

  // Initial pattern: random points, then relax until the tightest cluster is the largest void.
  const order = Array.from({ length: N }, (_, i) => i);
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const pattern = order.slice(0, initialCount);

  const field = createField();
  for (const p of pattern) field.set(p, 1);

  for (let guard = 0; guard < N * 10; guard++) {
    const cluster = tightestCluster(field);
    field.set(cluster, 0);
    const void_ = largestVoid(field);
    if (void_ === cluster) {
      field.set(cluster, 1);
      break;
    }
    field.set(void_, 1);
  }

  const prototype = [...field.bits];
  const ranks = new Int32Array(N).fill(-1);

  // Phase 1: remove the initial points from tightest cluster to largest void, ranking
  // them from initialCount - 1 down to 0.
  let working = createField();
  for (let p = 0; p < N; p++) if (prototype[p]) working.set(p, 1);

  for (let rank = initialCount - 1; rank >= 0; rank--) {
    const cluster = tightestCluster(working);
    working.set(cluster, 0);
    ranks[cluster] = rank;
  }

  // Phase 2 and 3: refill from the largest voids, ranking upward. Past half density the
  // minority is the unset pixels, which is the same operation on the inverted field.
  working = createField();
  for (let p = 0; p < N; p++) if (prototype[p]) working.set(p, 1);

  for (let rank = initialCount; rank < N; rank++) {
    const void_ = largestVoid(working);
    working.set(void_, 1);
    ranks[void_] = rank;
  }

  return ranks;
}

function check(ranks) {
  const seen = new Uint8Array(N);
  for (let p = 0; p < N; p++) {
    const rank = ranks[p];
    if (rank < 0 || rank >= N) throw new Error(`rank ${rank} out of range at ${p}`);
    if (seen[rank]) throw new Error(`duplicate rank ${rank}`);
    seen[rank] = 1;
  }

  // The 10% prototype must be perfectly packed: no two points side by side or diagonal.
  const countAdjacent = (density) => {
    const on = (x, y) => ranks[wrap(y) * SIZE + wrap(x)] < N * density;
    let adjacent = 0;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (!on(x, y)) continue;
        if (on(x + 1, y)) adjacent++;
        if (on(x, y + 1)) adjacent++;
      }
    }
    return adjacent;
  };

  const prototypeAdjacent = countAdjacent(0.1);
  if (prototypeAdjacent > 0) {
    throw new Error(`not blue noise: ${prototypeAdjacent} adjacent pairs in the initial pattern`);
  }

  // At 25% density a blue-noise mask stays well under the white-noise pair count
  // (2 * N * 0.25^2 = 128 for 32x32), even though the square lattice allows some pairs.
  const denseAdjacent = countAdjacent(0.25);
  if (denseAdjacent > N * 0.25 * 0.25 * 2 * 0.5) {
    throw new Error(`not blue noise: ${denseAdjacent} adjacent pairs at 25% density`);
  }
}

function preview(ranks) {
  const ramp = " .:-=+*#%@";
  for (let y = 0; y < SIZE; y++) {
    let line = "";
    for (let x = 0; x < SIZE; x++) {
      line += ramp[Math.floor((ranks[y * SIZE + x] / N) * ramp.length)];
    }
    console.info(line);
  }
}

const ranks = generate();
check(ranks);
preview(ranks);

const bytes = Uint8Array.from(ranks, (rank) => Math.floor((rank * 256) / N));
const encoded = Buffer.from(bytes).toString("base64");

const source = `import { GL_R8, GL_RED, GL_UNSIGNED_BYTE } from "../../core/constants";
import type { DataTextureParams } from "../../core/texture";

// ${SIZE}x${SIZE} void-and-cluster blue-noise threshold mask, one byte per pixel,
// each byte being floor(rank * 256 / ${N}). Generated by
// scripts/gen-blue-noise.mjs (sigma ${SIGMA}), do not edit by hand.
const encoded =
  "${encoded}";

let _mask: DataTextureParams | undefined;

/**
 * Returns the shared blue-noise threshold mask as a texture description.
 * Decoded on first use so nothing runs at module load time.
 * @internal
 */
export function blueNoiseMask(): DataTextureParams {
  if (_mask) return _mask;

  const data = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));

  _mask = {
    data,
    width: ${SIZE},
    height: ${SIZE},
    format: GL_RED,
    internalFormat: GL_R8,
    type: GL_UNSIGNED_BYTE,
    minFilter: "nearest",
    magFilter: "nearest",
    wrapS: "repeat",
    wrapT: "repeat",
    flipY: false,
  };

  return _mask;
}
`;

await writeFile(outputPath, source);
const decoded = Buffer.from(encoded, "base64");
if (decoded.length !== N) throw new Error("round-trip failed");
console.info(
  `\nWrote ${path.relative(process.cwd(), outputPath)} (${N} bytes, ${encoded.length} base64 chars)`,
);
