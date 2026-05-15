#version 300 es
precision highp float;

uniform sampler2D tParticles;
uniform float uCount;
uniform float uBaseRadius;
uniform float uDeltaTime;

in vec2 uv;
out vec4 fragColor;

#define PI 3.14159265359
#define GOLDEN_RATIO 1.618

float hash(float value) {
  return fract(sin(value) * 43758.5453123);
}

void main() {
  vec4 state = texture(tParticles, uv);
  float lifetime = state.w;
  ivec2 texel = ivec2(gl_FragCoord.xy - vec2(0.5));
  ivec2 particlesTextureSize = textureSize(tParticles, 0);
  float index = float(texel.y * particlesTextureSize.x + texel.x);
  float radialJitter = hash(index + 1.) * 2. - 1.;

  lifetime += uDeltaTime * 0.0003;

  if (lifetime < 0.) {
    state.w = lifetime;
    fragColor = vec4(state);
    return;
  }

  lifetime = mod(lifetime, 1.);

  float phi = acos(1. - 2. * ((index / uCount) * lifetime));
  float theta = 2. * PI * fract(index / GOLDEN_RATIO);
  float chaos = smoothstep(0., PI, phi);

  phi += chaos * radialJitter;
  theta += chaos * radialJitter;

  theta += lifetime * 1.5;

  float radiusNoise = radialJitter * pow(phi / PI, 3.);

  float x = cos(theta) * sin(phi) * (uBaseRadius + radiusNoise);
  float y = -cos(phi) * uBaseRadius;
  float z = sin(theta) * sin(phi) * (uBaseRadius + radiusNoise);

  vec3 position = vec3(x, y, z);

  fragColor = vec4(position, lifetime);
}
