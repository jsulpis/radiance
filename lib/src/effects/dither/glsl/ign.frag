#include "./_common.glsl"

// Interleaved gradient noise, after Jorge Jimenez.
float ditherThreshold() {
  vec2 cell = floor(ditherCell());
  return fract(52.9829189 * fract(dot(cell, vec2(0.06711056, 0.00583715))));
}

#include "./_main.glsl"
