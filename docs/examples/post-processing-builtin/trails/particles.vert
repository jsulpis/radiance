attribute vec3 random;
uniform float uTime;
uniform float uParticleSize;
varying vec4 vColor;

#define PI 3.141592653589793

void main() {
  float t = uTime * 0.1;

  float rho = pow(random.x, .1) * .8;
  float theta = acos(2. * random.z - 1.) * (1. +  t);
  float phi = random.y * 2. * PI * (1. + t);

  gl_Position = vec4(
    rho * sin(theta) * sin(phi),
    rho * cos(theta),
    rho * sin(theta) * cos(phi),
    1.
  );
  gl_PointSize = (gl_Position.z + 2.) * uParticleSize;

  vColor.rgb = mix(
    vec3(0.1, 0.3, 0.6), // dark blue
    vec3(1.0, 0.7, 0.2), // yellow
    smoothstep(-1.5, 1., dot(gl_Position.xyz, vec3(1., 1., -.5)))
  );
  vColor.rgb *= smoothstep(-2., .8, gl_Position.z);
  vColor.a = 1.;
}
