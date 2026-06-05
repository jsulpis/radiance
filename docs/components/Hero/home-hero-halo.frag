#version 300 es
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec3 uMainColor;
uniform vec3 uBaseColor;
uniform float uBaseRadius;
uniform float uTime;

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec4 color = texture(uTexture, vUv);

  vec2 uv = 2. * (vUv - .5) * uResolution / min(uResolution.x, uResolution.y);

  float distToCenter = length(uv);

  float radius = uBaseRadius * .78;
  float disk = smoothstep(radius * 1.05, radius, distToCenter);
  float distFromEdge = abs(distToCenter - radius);
  float edge = max(radius - distFromEdge, 0.) / radius;

  vec4 halo = vec4(pow(edge, 20.)) * .3;
  halo += vec4(pow(edge, 4.)) * .1;

  halo *= smoothstep(1.2, 2., length(uv - vec2(0., uBaseRadius))) * vec4(mix(uBaseColor, uMainColor, .5), 1.0);

  halo.a *= smoothstep(1000., 8000., uTime);
  halo.rgb *= halo.a;

  float backgroundGradientMask = pow(1.8 - min(length(uv - vec2(0., -0.8)), 1.8), 2.) * disk;
  vec4 backgroundGradient = vec4(uMainColor * backgroundGradientMask, backgroundGradientMask) * .1;

  backgroundGradient += vec4(1. - smoothstep(-.5, .6, length(uv - vec2(0., -0.8)))) * backgroundGradientMask * backgroundGradientMask * .1;

  backgroundGradient.a *= smoothstep(1000., 8000., uTime);
  backgroundGradient.rgb *= backgroundGradient.a;

  color += backgroundGradient;
  color += halo;

  fragColor = vec4(color);
}
