#version 300 es
precision highp float;

uniform sampler2D uParticles;
uniform vec3 uBaseColor;
uniform vec3 uMainColor;
uniform vec3 uHighlightColor;
uniform vec2 uResolution;
uniform float uBaseRadius;
uniform vec2 uPointer;
uniform float uPointerStrength;
uniform float uEnergy;
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

  // Turn the sphere towards the cursor so its 3D shape reads immediately.
  vec3 position = state.xyz;
  float yaw = -uPointer.x * 0.6 * uPointerStrength;
  float pitch = -uPointer.y * 0.45 * uPointerStrength;

  position.xz = mat2(cos(yaw), -sin(yaw), sin(yaw), cos(yaw)) * position.xz;
  position.yz = mat2(cos(pitch), -sin(pitch), sin(pitch), cos(pitch)) * position.yz;

  float aspect = uResolution.x / uResolution.y;

  vec2 projected = position.xy / (position.z + 2.45) * 1.72;
  projected.x /= aspect;
  gl_Position = vec4(projected, 0.0, 1.0);

  vec2 screenPosition = vec2(projected.x * aspect, projected.y);
  float highlight =
    smoothstep(0.9, 0.0, length(screenPosition - uPointer)) * uPointerStrength;

  gl_PointSize = 10. / (position.z + 3.) * uDpr * (1. + highlight * 0.8);

  vec3 color = mix(
    uBaseColor,
    uMainColor,
    smoothstep(-1.8 * uBaseRadius, -.5 * uBaseRadius, position.y)
  );
  color = mix(color, uHighlightColor, min(1., highlight * 0.55 + uEnergy * 0.2));

  float alpha = smoothstep(1., .5, lifetime)
          * (1. - smoothstep(.5, 1., abs(projected.y)))
          * (1. - smoothstep(.5, 1., abs(projected.x)));

  // Flash newborn particles so the growing tips stand out.
  float birth = 1. - smoothstep(0., 0.15, lifetime);
  alpha *= 1. + birth * 2.;

  alpha *= 1. + highlight * 0.6;

  vColor = vec4(color, alpha);
}
