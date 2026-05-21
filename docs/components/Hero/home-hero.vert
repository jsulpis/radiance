#version 300 es
precision highp float;

uniform sampler2D uParticles;
uniform vec3 uBaseColor;
uniform vec3 uMainColor;
uniform vec2 uResolution;
uniform float uBaseRadius;
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

  float pointSize = 10. / (position.z + 2.);
  gl_PointSize = mix(12., pointSize, smoothstep(0., .2, lifetime)) * uDpr;

  float alpha = smoothstep(.8 * uBaseRadius, .2 * uBaseRadius, position.y) * smoothstep(1.5, 0., position.z);
  vec3 color = mix(uBaseColor, uMainColor, smoothstep(-2.5 * uBaseRadius, -0.5 * uBaseRadius, position.y));
  vColor = vec4(color, alpha);
}
