attribute vec2 aCoords;

uniform sampler2D uPositions;
uniform float uTheme;

varying vec4 vColor;

mat2 rotate2d(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec4 state = texture2D(uPositions, aCoords);
  vec3 position = state.xyz;
  float seed = hash(aCoords + 0.37);

  // position.yz *= rotate2d(-0.35);
  // position.xz *= rotate2d(-0.55);

  vec3 view = position;
  view.z += 2.6;
  gl_Position = vec4(view.xy / view.z * 1.75, 0., 1.);

  float depthFade = smoothstep(1.2, 3.4, view.z);
  float band = 0.5 + 0.5 * sin(seed * 31.4159);
  gl_PointSize = mix(3.8, 6.2, band) / view.z * 4.6;

  vec3 darkBase = mix(vec3(0.82, 0.35, 1.1), vec3(1.45, 0.55, 1.32), band);
  vec3 lightBase = mix(vec3(0.78, 0.1, 0.68), vec3(1.18, 0.2, 0.9), band);
  vec3 color = mix(lightBase, darkBase, uTheme);
  float alpha = mix(0.55, 0.72, band) * depthFade;

  vColor = vec4(color, alpha);
}
