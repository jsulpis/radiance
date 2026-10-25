#include "../../../internal/glsl/hash.glsl"

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uTime;
uniform float uIntensity;
uniform float uSize;
uniform float uColorMix;

in vec2 vUv;
out vec4 fragColor;

vec3 blendSoftLight(vec3 base, vec3 blend) {
  return mix(
    sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
    2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
    step(base, vec3(0.5))
  );
}

vec3 hash33(vec3 p3) {
	p3 = fract(p3 * vec3(.1031, .1030, .0973));
  p3 += dot(p3, p3.yxz+33.33);
  return fract((p3.xxy + p3.yxx)*p3.zyx);
}

vec3 noise(vec2 p) {
  float v = float(0+1)*.152;
  float time = mod(uTime, 100.); // Prevent patterns from appearing after long periods of time
  vec3 hashMonochromatic = vec3(hash12((p * v + time * 1500. + 50.0)));
  vec3 hashColor = hash33(vec3(p, time * 3.) + time * 500. + 50.0);

  return mix(hashMonochromatic, hashColor, uColorMix);
}

void main() {
  vec4 color = texture(uTexture, vUv);

  vec2 cellCount = uResolution / max(uSize, 0.01);
  vec2 cellUv = floor(vUv * cellCount) / cellCount;

  vec3 noiseColor = noise(cellUv * uResolution);
  vec3 colorWithNoise = blendSoftLight(color.rgb, noiseColor);

  color.rgb = mix(color.rgb, colorWithNoise, uIntensity);

  fragColor = color;
}
