uniform float uDeltaTime;
uniform vec2 uPointer;
uniform sampler2D tPositions;

in vec2 uv;
out vec4 fragColor;

const float PI = 3.14159265359;
const float COUNT = 200.;
const float SPEED = 2.;
const float GOLDEN_ANGLE = PI * (3. - sqrt(5.));

mat2 rotate2d(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec3 fibonacciSphere(float index, float angleOffset) {
  float wrappedIndex = mod(index, COUNT);
  float y = 1. - 2. * (wrappedIndex + 0.5) / COUNT;
  float radius = sqrt(max(0., 1. - y * y));
  float phi = GOLDEN_ANGLE * wrappedIndex + angleOffset;
  return vec3(cos(phi) * radius, y, sin(phi) * radius) * 0.9;
}

vec2 projectToScreen(vec3 position) {
  // position.yz *= rotate2d(-0.35);
  // position.xz *= rotate2d(-0.55);

  vec3 view = position;
  view.z += 2.6;
  return view.xy / view.z * 1.75;
}

void main() {
  vec4 state = texture(tPositions, uv);
  float progress = state.w;
  float randomAngle = hash(uv + 0.17) * 2. * PI;
  float nextProgress = mod(progress + uDeltaTime * SPEED, COUNT);

  vec3 position = fibonacciSphere(nextProgress, randomAngle);
  vec2 projected = projectToScreen(position);

  vec2 pointer = vec2(uPointer.x, -uPointer.y) * 2.;
  float pointerActive = step(0.001, length(uPointer));
  float attraction = pointerActive * pow(smoothstep(1.05, 0.0, distance(projected, pointer)), 0.35);
  vec2 attracted = mix(projected, pointer, attraction);
  float swallowed = pointerActive * (1. - step(0.08, distance(attracted, pointer)));

  vec3 respawn = fibonacciSphere(0., randomAngle);
  fragColor = vec4(mix(position, respawn, swallowed), mix(nextProgress, 0., swallowed));
}
