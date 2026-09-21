attribute vec2 aPosition;
uniform float uTime;
// flat interpolation: every fragment of a triangle gets the color
// computed at its provoking vertex, ignoring interpolation
flat varying vec3 vColor;

// 3d gaussian bump
float gaussianHeight(vec2 p) {
  return exp(-dot(p, p) * .18) * (.85 + .15);
}

// cosine color palette
vec3 palette(float t) {
  return vec3(.42, .36, .55) + vec3(.38, .34, .38) * cos(6.28318 * (vec3(1., .9, .7) * t));
}

mat4 translation(vec3 t) {
  return mat4(1., 0., 0., 0., 0., 1., 0., 0., 0., 0., 1., 0., t.x, t.y, t.z, 1.);
}

mat4 rotationX(float a) {
  float c = cos(a), s = sin(a);
  return mat4(1., 0., 0., 0., 0., c, -s, 0., 0., s, c, 0., 0., 0., 0., 1.);
}

mat4 rotationY(float a) {
  float c = cos(a), s = sin(a);
  return mat4(c, 0., -s, 0., 0., 1., 0., 0., s, 0., c, 0., 0., 0., 0., 1.);
}

mat4 perspective(float fov, float aspect, float near, float far) {
  float f = 1. / tan(fov * .5);
  return mat4(
    f / aspect, 0., 0., 0.,
    0., f, 0., 0.,
    0., 0., (far + near) / (near - far), -1.,
    0., 0., 2. * far * near / (near - far), 0.
  );
}

void main() {
  vec2 p = aPosition * 5.;
  float h = gaussianHeight(p);

  mat4 model = rotationY(uTime * .15);
  mat4 view = translation(vec3(0., -.4, -4.)) * rotationX(radians(-10.));
  mat4 projection = perspective(radians(40.), 1., .1, 20.);

  vec4 world = model * vec4(aPosition.x, h, aPosition.y, 1.);
  gl_Position = projection * view * world;

  vColor = palette(h * 0.8 + .5);
}
