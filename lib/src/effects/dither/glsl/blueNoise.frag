#include "./_common.glsl"

uniform sampler2D uBlueNoise;

// Threshold read straight from the blue-noise mask, one texel per dither cell.
float ditherThreshold() {
  vec2 uv = ditherCell() / vec2(textureSize(uBlueNoise, 0));
  float texel = texture(uBlueNoise, uv).r * 255.0;
  return (texel + 0.5) / 256.0;
}

#include "./_main.glsl"
