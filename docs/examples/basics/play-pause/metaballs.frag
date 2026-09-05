varying vec2 uv;
uniform float uTime;

// polynomial smooth min (https://iquilezles.org/articles/smin/)
float smin(float a, float b, float k) {
  float h = clamp(.5 + .5 * (b - a) / k, 0., 1.);
  return mix(b, a, h) - k * h * (1. - h);
}

void main() {
  vec2 p = (uv - .5) * 2.;
  float t = uTime;

  // three orbiting blobs
  vec2 c1 = vec2(cos(t * .8) * .5, sin(t * 1.1) * .4);
  vec2 c2 = vec2(cos(t * .6 + 2.1) * .55, sin(t * .9 + 1.3) * .45);
  vec2 c3 = vec2(sin(t * .5 + 4.2) * .45, cos(t + 3.1) * .35);

  float d = smin(length(p - c1) - .26, length(p - c2) - .2, .35);
  d = smin(d, length(p - c3) - .23, .35);

  float body = 1. - smoothstep(-.005, .005, d);
  float depth = clamp(-d * 2.5, 0., 1.); // deeper inside the field
  float rim = smoothstep(.06, -.02, abs(d)); // bright edge
  float halo = exp(-5. * max(d, 0.)); // outer glow

  vec3 color = mix(vec3(.05, .03, .12), vec3(.13, .05, .22), uv.y);
  color += vec3(.9, .3, .5) * halo * .45;
  color = mix(color, mix(vec3(.98, .5, .2), vec3(.8, .1, .6), depth), body);
  color += vec3(1., .8, .7) * rim * .6;

  gl_FragColor = vec4(color, 1.);
}
