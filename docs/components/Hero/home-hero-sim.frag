#version 300 es
precision highp float;

uniform sampler2D tParticles;
uniform float uCount;
uniform float uBaseRadius;
uniform float uDeltaTime;
uniform vec2 uPointer;

in vec2 uv;
out vec4 fragColor;

#define PI 3.14159265359
#define GOLDEN_RATIO 1.618

float hash(float value) {
  return fract(sin(value) * 43758.5453123);
}

vec3 getSpherePosition(float index, float lifetime) {
  float radialJitter = (hash(index + 1.) * 2. - 1.) * (uPointer.y + 1.);

  float phi = acos(1. - 2. * ((index / uCount) * lifetime));
  float theta = 2. * PI * fract(index / GOLDEN_RATIO);
  float chaos = smoothstep(0., PI, phi);

  phi += chaos * radialJitter;
  theta += chaos * radialJitter;
  theta += lifetime * 2. * uPointer.x;

  float radiusNoise = radialJitter * pow(phi / PI, 3.);
  float radius = uBaseRadius + radiusNoise;

  float x = cos(theta) * sin(phi) * radius;
  float y = -cos(phi) * radius;
  float z = sin(theta) * sin(phi) * radius;

  return vec3(x, y, z);
}

void main() {
  vec4 state = texture(tParticles, uv);
  ivec2 texel = ivec2(gl_FragCoord.xy - vec2(0.5));
  ivec2 particlesTextureSize = textureSize(tParticles, 0);
  float index = float(texel.y * particlesTextureSize.x + texel.x);

  float lifetime = state.w;
  lifetime += uDeltaTime * 0.0003 * smoothstep(-1.5, 0., uPointer.y);

  if (lifetime < 0.) {
    fragColor = vec4(state.xyz, lifetime);
    return;
  }
  if (lifetime > 1.) {
    fragColor = vec4(getSpherePosition(index, 0.), 0.);
    return;
  }

  vec3 position = getSpherePosition(index, lifetime);

  fragColor = vec4(position, lifetime);
}
