#include "../../../internal/glsl/color.glsl"

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uSize;
uniform float uDpr;
uniform float uLevels;
uniform bool uColor;

in vec2 vUv;
out vec4 fragColor;

// Continuous coordinate in dither cells, one cell being uSize CSS pixels
// rounded to whole device pixels so the pattern stays regular on fractional DPRs.
vec2 ditherCell() {
  return vUv * uResolution / max(round(uSize * uDpr), 1.0);
}

// Snaps linear values to the palette: uLevels values per channel, evenly spaced
// in sRGB. Between the two nearest levels the pattern is mixed in linear light,
// so the average light matches the source. Returns sRGB-encoded values.
vec3 quantize(vec3 linear, float threshold) {
  float steps = max(round(uLevels), 2.0) - 1.0;
  vec3 c = clamp(linear, 0.0, 1.0);
  vec3 k = min(floor(linearToSRGB(c) * steps), steps - 1.0);
  vec3 loLinear = sRGBToLinear(k / steps);
  vec3 hiLinear = sRGBToLinear((k + 1.0) / steps);
  vec3 t = (c - loLinear) / (hiLinear - loLinear);
  return mix(loLinear, hiLinear, vec3(greaterThan(t, vec3(threshold))));
}

// Dithers the input against the pattern computed by ditherThreshold(), a value
// in [0, 1). Expects linear input and writes sRGB-encoded output.
vec4 applyDither(float threshold) {
  vec4 color = texture(uTexture, vUv);
  vec3 rgb = color.rgb;

  vec3 result;
  if (uColor) {
    result = quantize(rgb, threshold);
  } else {
    // Black and white: dither Rec.709 linear luminance.
    float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
    result = quantize(vec3(luma), threshold);
  }

  return vec4(linearToSRGB(result), color.a);}
