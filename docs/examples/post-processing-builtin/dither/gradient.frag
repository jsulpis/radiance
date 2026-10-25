uniform float uTime;
uniform vec2 uResolution;

in vec2 vUv;
out vec4 fragColor;

// Gradient (Perlin) noise: smooth, without the axis-aligned creases that value
// noise leaves along its lattice.
vec2 hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

  float a = dot(hash22(i), f);
  float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 0.5 + 0.5;
}

// Rotate each octave so the lattice never lines up into a cross-hatch.
float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += amp * noise(p);
    p = mat2(0.8, 0.6, -0.6, 0.8) * p * 2.0;
    amp *= 0.5;
  }
  return sum;
}

vec3 palette(float t, float phase) {
  const vec3 a = vec3(0.5);
  const vec3 b = vec3(0.5);
  const vec3 c = vec3(1.0, 0.9, 0.7);
  const vec3 d = vec3(0.15, 0.45, 0.75);
  return a + b * cos(6.28318 * (c * t + d + phase));
}

void main() {
  float t = uTime * 0.2;

  // Keep the noise square whatever the canvas ratio: scale UVs by the smaller
  // canvas dimension so circles stay circles on wide and tall viewports.
  vec2 p = (vUv - 0.5) * uResolution / min(uResolution.x, uResolution.y) * 3.0;

  // Domain warping: two noise fields push the third one around, which is what
  // makes the gradient drift instead of merely scrolling.
  vec2 warp = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, t * 0.8)));
  float n = fbm(p + 2.5 * (warp - 0.5) + vec2(t * 0.6, -t * 0.35));

  // Gradient noise has a narrower range than value noise: stretch it back so
  // the palette is used end to end.
  n = clamp((n - 0.5) * 2.4 + 0.5, 0.0, 1.0);

  // Shift the palette by a second, slower field so some areas run warm and
  // others stay cool instead of the whole image sharing one hue band.
  float region = smoothstep(0.38, 0.62, fbm(p * 0.45 + vec2(-t * 0.2, t * 0.3) + 31.7));
  vec3 color = palette(n * 0.85 + 0.1, (region - 0.5) * 0.55);

  // Keep every channel inside [0, 1] so bright areas do not flatten into
  // clipped plateaus, which reads as banding.
  color *= 0.55 + 0.45 * n;

  fragColor = vec4(color, 1.0);
}
