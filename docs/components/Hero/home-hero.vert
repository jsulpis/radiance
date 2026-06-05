#version 300 es
precision highp float;

uniform sampler2D uParticles;
uniform vec3 uBaseColor;
uniform vec3 uMainColor;
uniform vec2 uResolution;
uniform float uBaseRadius;
uniform vec2 uPointer;
uniform float uDpr;

in vec2 aCoords;
out vec4 vColor;

void main() {
  vec4 state = texture(uParticles, aCoords);
  float lifetime = state.w;

  if (lifetime < 0.0) {
    gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
    gl_PointSize = 0.0;
    vColor = vec4(0.0);
    return;
  }

  vec3 position = state.xyz;

  vec2 projected = position.xy / (position.z + 2.45) * 1.72;
  projected.x /= uResolution.x / uResolution.y;
  gl_Position = vec4(projected, 0.0, 1.0);

  gl_PointSize = 10. / (position.z + 3.) * uDpr;

  vec3 topColor = mix(uMainColor, vec3(0.8, 0.25, 0.1), smoothstep(0., 1.,uPointer.y));
  vec3 color = mix(uBaseColor, topColor, smoothstep(-1.8 * uBaseRadius, -.5 * uBaseRadius, position.y));

  float alpha = smoothstep(1., .5, lifetime)
          * (1. - smoothstep(.5, 1., abs(projected.y)))
          * (1. - smoothstep(.5, 1., abs(projected.x)));

  vColor = vec4(color, alpha);
}
