in vec2 vUv;
uniform float uTime;

const vec2 center = vec2(0.5, 0.5);
const float ringRadius = 0.3;
const float dotRadius = 0.05;

float circle(vec2 uv, vec2 center, float radius) {
  float d = length(uv - center);
  return 1.0 - smoothstep(radius - 0.003, radius + 0.003, d);
}

void main() {
  vec3 color = vec3(0.0);
  float t = - uTime * 0.15;

  float offset = 0.;
  for (int i = 0; i < 8; i++) {
    vec2 p = center + vec2(cos(t + offset), sin(t + offset)) * ringRadius;
    float r = dotRadius * (1.8 - 0.24 * float(i));
    color += vec3(1., vUv) * circle(vUv, p, r);
    offset += atan(4. * r, ringRadius);
  }

  // important!
  // - the colors need to be in linear space for the bloom calculation to be correct
  // - a final pass is needed to convert linear RGB back to sRGB (can be done with a builtin tone mapping pass)
  color = pow(color, vec3(2.2));

  gl_FragColor = vec4(color, 1.0);
}
