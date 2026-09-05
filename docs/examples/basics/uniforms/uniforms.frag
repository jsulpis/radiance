varying vec2 vUv;
uniform float uScale;
uniform float uWarp;
uniform float uLacunarity;
uniform vec2 uResolution;

// hash & value noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(
    mix(hash(i), hash(i + vec2(1., 0.)), u.x),
    mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x),
    u.y
  );
}

// fractal brownian motion
float fbm(vec2 p) {
  float value = 0.;
  float amplitude = .5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * uLacunarity + vec2(1.7, 9.2);
    amplitude *= .5;
  }
  return value;
}

// cosine color palette
vec3 palette(float t) {
  return vec3(.42, .36, .55) + vec3(.38, .34, .38) * cos(6.28318 * (vec3(1., .9, .7) * t + vec3(.1, .25, .55)));
}

void main() {
  vec2 uv = vUv;

  // domain-warped fbm: q warps r, r warps the final value
  vec2 q = vec2(fbm(uv * uScale), fbm(uv * uScale + vec2(5.2, 1.3)));
  vec2 r = vec2(
    fbm(uv * uScale + uWarp * q + vec2(1.7, 9.2)),
    fbm(uv * uScale + uWarp * q + vec2(8.3, 2.8))
  );
  float f = fbm(uv * uScale + uWarp * .8 * r);

  vec3 color = palette(f + .2 * length(q));
  color = mix(color, palette(f * f + .5), clamp(length(r.x), 0., 1.) * .5);

  // soft vertical falloff
  color *= smoothstep(.0, .5, gl_FragCoord.y / uResolution.y) * .6 + .5;

  gl_FragColor = vec4(color, 1.);
}
