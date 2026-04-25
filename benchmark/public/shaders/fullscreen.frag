precision highp float;

varying vec2 vUv;
uniform float uTime;

void main() {
  vec2 uv = vUv;
  vec2 centeredUv = uv - 0.5;
  float angle = atan(centeredUv.y, centeredUv.x);
  float radius = length(centeredUv);
  float wave = 0.5 + 0.5 * sin(uTime + radius * 14.0 - angle * 3.0);

  vec3 base = vec3(0.95, 0.54, 0.20);
  vec3 accent = vec3(0.07, 0.30, 0.58);
  vec3 color = mix(accent, base, wave);
  color += 0.12 * vec3(uv.x, uv.y, 1.0 - uv.x);

  gl_FragColor = vec4(color, 1.0);
}
