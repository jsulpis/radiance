attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aInstanceOffset;
attribute float aInstanceScale;
attribute vec3 aInstanceColor;
attribute float aInstancePhase;

uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vColor;

void main() {
  // every vertex of an instance reads the same aInstance* values,
  // so the whole cube moves as one
  float bob = sin(uTime * 1.5 + aInstancePhase) * 0.35;
  float angle = uTime * 0.6 + aInstancePhase;

  float c = cos(angle);
  float s = sin(angle);
  mat3 rotation = mat3(
    c, 0.0, -s,
    0.0, 1.0, 0.0,
    s, 0.0, c
  );

  vec3 local = rotation * (aPosition * aInstanceScale);
  vec3 world = local + aInstanceOffset + vec3(0.0, bob, 0.0);

  gl_Position = uProjectionMatrix * uViewMatrix * vec4(world, 1.0);

  vWorldPosition = world;
  vNormal = normalize(rotation * aNormal);
  vColor = aInstanceColor;
}
