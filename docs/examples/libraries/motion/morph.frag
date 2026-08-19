uniform vec2 uResolution;
uniform float uOffset;
uniform float uRotation;
uniform float uMorph;

vec3 rotateX(in vec3 p, in float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

vec3 rotateY(in vec3 p, in float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

float roundedBoxDistance(in vec3 p, in vec3 size, in float radius) {
  vec3 q = abs(p) - size;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - radius;
}

float torusDistance(in vec3 p, in vec2 tor) {
  // The torus has a different rest orientation from the cube.
  vec3 torusSpace = rotateX(p, -1.5707963);
  vec2 q = vec2(length(torusSpace.xz) - tor.x, torusSpace.y);
  return length(q) - tor.y;
}

float morphDistance(in vec3 p, in vec3 boxSize, in float boxRadius, in vec2 torus, in float morph) {
  return mix(
    roundedBoxDistance(p, boxSize, boxRadius),
    torusDistance(p, torus),
    smoothstep(0., 1., morph)
  );
}

float morphIntersect(in vec3 ro, in vec3 rd, in vec3 boxSize, in float boxRadius, in vec2 torus, in float morph) {
  float boundRadius = max(length(boxSize + boxRadius), torus.x + torus.y);
  float sphereB = dot(ro, rd);
  float sphereC = dot(ro, ro) - boundRadius * boundRadius;
  float sphereH = sphereB * sphereB - sphereC;
  if (sphereH < 0.0) return -1.0;

  float sphereNear = -sphereB - sqrt(sphereH);
  float sphereFar = -sphereB + sqrt(sphereH);
  float t = 0.0;
  if (sphereFar < 0.0) return -1.0;
  if (sphereNear > 0.0) t = sphereNear;

  for (int i = 0; i < 160; i++) {
    vec3 p = ro + rd * t;
    float distance = morphDistance(p, boxSize, boxRadius, torus, morph);
    if (distance < 0.0004) return t;
    t += distance * 0.5;
    if (t > sphereFar) break;
  }
  return -1.0;
}

vec3 morphNormal(in vec3 p, in vec3 boxSize, in float boxRadius, in vec2 torus, in float morph) {
  vec2 e = vec2(0.0005, 0.0);
  return normalize(vec3(
    morphDistance(p + e.xyy, boxSize, boxRadius, torus, morph) - morphDistance(p - e.xyy, boxSize, boxRadius, torus, morph),
    morphDistance(p + e.yxy, boxSize, boxRadius, torus, morph) - morphDistance(p - e.yxy, boxSize, boxRadius, torus, morph),
    morphDistance(p + e.yyx, boxSize, boxRadius, torus, morph) - morphDistance(p - e.yyx, boxSize, boxRadius, torus, morph)
  ));
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
  vec3 ro = vec3(0.0, 0.0, 3.2);
  uv.x -= uOffset;
  vec3 rd = normalize(vec3(uv, -2.8));
  float turn = uRotation;
  vec3 localRo = rotateY(ro, -turn);
  vec3 localRd = rotateY(rd, -turn);

  vec3 boxSize = vec3(0.29);
  float boxRadius = 0.072;
  vec2 torus = vec2(0.26, 0.13);
  vec3 color = vec3(0.005, 0.007, 0.018);

  float hit = morphIntersect(localRo, localRd, boxSize, boxRadius, torus, uMorph);
  vec3 normal = vec3(0.0);
  if (hit > 0.0) {
    normal = morphNormal(localRo + localRd * hit, boxSize, boxRadius, torus, uMorph);
  }

  if (hit > 0.0) {
    vec3 worldNormal = rotateY(normal, turn);
    vec3 light = normalize(vec3(-0.6, 0.9, 1.2));
    float diffuse = max(dot(worldNormal, light), 0.0);
    float rim = pow(1.0 - max(dot(worldNormal, -rd), 0.0), 3.0);
    vec3 base = mix(vec3(0., .5, 1.), vec3(.7, 0.2, 0.), uMorph);
    color = base * (0.18 + diffuse * 0.82);
    color += mix(vec3(0.08, 0.65, 1.0), vec3(0.82, 0.3, 0.24), uMorph) * rim * 0.5;
    color += mix(vec3(0.25, 0.08, 0.7), vec3(0.9, 0.5, 0.35), uMorph) * pow(max(dot(reflect(-light, worldNormal), -rd), 0.0), 32.0);
  }

  float vignette = 1.0 - smoothstep(0.7, 1.7, length(uv));
  color *= 0.72 + vignette * 0.28;
  gl_FragColor = vec4(color, 1.0);
}
