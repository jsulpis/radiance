uniform float uTime;

in vec2 vUv;
out vec4 fragColor;

// https://iquilezles.org/articles/palettes/
vec3 cosinePalette(float t) {
  const vec3 a = vec3(0.5);
  const vec3 b = vec3(0.5);
  const vec3 c = vec3(.85);
  const vec3 d = vec3(0.0, 0.1, 0.2);
  return a + b * cos(6.28318 * (c * t + d));
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  float field = 0.0;

  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    vec2 center = vec2(
      0.5 + 0.35 * sin(uTime * (0.7 + fi * 0.08) + fi * 2.4),
      0.5 + 0.35 * cos(uTime * (0.55 + fi * 0.1) + fi * 1.7)
    );
    float radius = mix(0.12, 0.25, hash21(vec2(fi, 4.2)));
    vec2 offset = vUv - center;
    field += radius * radius / (dot(offset, offset) + 0.025);
  }

  float blob = smoothstep(0.65, 1.35, field);
  float gradient = field * 0.22 + vUv.x * 0.25 - vUv.y * 0.15;
  vec3 color = cosinePalette(gradient);
  color = mix(vec3(0.05, 0.05, 0.1), color, blob);
  color += cosinePalette(field * 0.12 + 0.5) * blob * 0.25;

  fragColor = vec4(color, 1.0);
}
