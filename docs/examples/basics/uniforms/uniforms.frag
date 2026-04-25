varying vec2 vUv;
uniform vec2 uResolution;
uniform float uRadius;
uniform float uSize;
uniform float uRotation;
uniform vec2 uPosition;

mat2 rotateZ(float angle) {
  return mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
}

// https://iquilezles.org/articles/distfunctions2d/
float sdRoundedBox( in vec2 p, in vec2 b, in vec4 r ) {
  r.xy = (p.x>0.0)?r.xy : r.zw;
  r.x  = (p.y>0.0)?r.x  : r.y;
  vec2 q = abs(p)-b+r.x;
  return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
}

void main() {
  vec2 p = (vUv - uPosition) * uResolution / min(uResolution.x, uResolution.y) * rotateZ(uRotation);
  vec4 radius = vec4(min(uRadius, uSize));
  float squareDist = sdRoundedBox(p, vec2(uSize), radius);
  float squareMask = 1. - smoothstep(-.001, .001, squareDist);
  float gradient = length(p + uSize) / (2. * uSize * sqrt(2.));
  vec3 color = mix(vec3(0.1, 0.2, 0.4), vec3(0.1, 0.7, 1.), gradient) * squareMask;

  gl_FragColor = vec4(color, squareMask);
}
