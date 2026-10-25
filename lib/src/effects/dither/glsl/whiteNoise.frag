#include "./_common.glsl"
#include "../../../internal/glsl/hash.glsl"

// Uncorrelated random threshold per cell.
float ditherThreshold() {
  return hash12(floor(ditherCell()));
}

#include "./_main.glsl"
