#include "./_common.glsl"

uniform float uMatrix;

const int bayer2[4] = int[](
  0, 2,
  3, 1
);

const int bayer4[16] = int[](
  0,  8,  2, 10,
  12, 4, 14,  6,
  3, 11,  1,  9,
  15, 7, 13,  5
);

const int bayer8[64] = int[](
  0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21
);

// Threshold in ]0, 1[ for the given cell: (1 + M) / (1 + m * n)
float ditherThreshold() {
  ivec2 cell = ivec2(floor(ditherCell()));
  int matrix = int(uMatrix + 0.5);

  if (matrix == 2) {
    return (float(bayer2[(cell.x & 1) + (cell.y & 1) * 2]) + 1.0) / 5.0;
  }
  if (matrix == 4) {
    return (float(bayer4[(cell.x & 3) + (cell.y & 3) * 4]) + 1.0) / 17.0;
  }
  return (float(bayer8[(cell.x & 7) + (cell.y & 7) * 8]) + 1.0) / 65.0;
}

#include "./_main.glsl"
