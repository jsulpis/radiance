export const fragment = /* glsl */ `
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float uHappyCursor;

in vec2 vUv;

out vec4 fragColor;

const float PI = 3.1415926535897932384626433832795;
const float BODY_RADIUS = 1.0;
const float LEG_RADIUS = 0.08;
const float TOP_RADIUS = 0.05;
const float LEG_COUNT = 5.0;
const float LEG_RING_COUNT = 8.0;
const float SMOOTHING = 4.5;
const float EPSILON = 0.01;

float distSphere(vec3 p, float radius) {
  return length(p) - radius;
}

mat3 calcLookAtMatrix(in vec3 ro, in vec3 target, in float roll) {
  vec3 ww = normalize(target - ro);
  vec3 uu = normalize(cross(ww, vec3(sin(roll), cos(roll), 0.0)));
  vec3 vv = normalize(cross(uu, ww));
  return mat3(uu, vv, ww);
}

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

// 3D simplex noise used to slightly deform the body surface.
float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1),
                               dot(p2,x2), dot(p3,x3)));
}

float hash(float n) { return fract(sin(n) * 753.5453123); }

float smin(float a, float b, float k) {
  float res = exp(-k * a) + exp(-k * b);
  return -log(res) / k;
}

vec3 getLegPos(float index, float bodyRadius) {
  float legsRadius = bodyRadius;
  float phase = hash(index + 1.0) * 2.0 * PI;
  float angle = index * PI * 2.0 / LEG_RING_COUNT;
  vec3 legPos = vec3(
    cos(angle) * legsRadius,
    -0.7 * bodyRadius,
    sin(angle) * legsRadius
  );

  float staticMovement = sin(iTime * 0.5 + phase) * 0.03;
  float dynamicMovement = sin(iTime * 9.0 + phase) * 0.08 * bodyRadius;
  legPos.y += mix(staticMovement, dynamicMovement, uHappyCursor);
  return legPos;
}

vec2 map(vec3 pos) {
  vec3 bodyPos = vec3(pos.x, pos.y * 1.1 + 0.05, pos.z);
  float body = distSphere(bodyPos, BODY_RADIUS);
  body += snoise(pos * 0.5 + iTime) * 0.015;

  // The whole character is a smooth union of the body, a small top sphere and five legs.
  float topSphere = distSphere(pos + vec3(0.0, -0.7 * BODY_RADIUS, 0.0), TOP_RADIUS);
  float scene = smin(body, topSphere, SMOOTHING);

  for (int i = 0; i < int(LEG_COUNT); ++i) {
    vec3 legPos = getLegPos(float(i), BODY_RADIUS);
    float legDist = distSphere(pos - legPos, LEG_RADIUS * BODY_RADIUS);
    scene = smin(scene, legDist, SMOOTHING);
  }

  return vec2(scene, 1.0);
}

vec3 calcNormal(in vec3 pos) {
  const vec2 k = vec2(1.0, -1.0);

  // Four-tap tetrahedral normal approximation: cheaper than central differences.
  return normalize(
    k.xyy * map(pos + k.xyy * EPSILON).x +
    k.yyx * map(pos + k.yyx * EPSILON).x +
    k.yxy * map(pos + k.yxy * EPSILON).x +
    k.xxx * map(pos + k.xxx * EPSILON).x
  );
}

void renderColor(vec3 ro, vec3 rd, inout vec3 color, vec3 currPos) {
  vec3 lightDir = normalize(vec3(1., 1., 0.0));
  vec3 normal = calcNormal(currPos);

  float ndotl = abs(dot(-rd, normal));
  float rim = pow(1.0 - ndotl, 6.0);

  color = mix(color, vec3(normal.r, normal.g/2., normal.b) + vec3(0, 0.7, .6), rim + 0.5);
  color += rim * .5;
  color *= dot(normal, lightDir)/2. + .75;
}

bool renderRayMarch(vec3 ro, vec3 rd, inout vec3 color) {
  // March only inside a coarse bounding sphere to skip obvious misses quickly.
  vec3 boundCenter = vec3(0.0, -0.1, 0.0);
  float boundRadius = 1.4;
  vec3 oc = ro - boundCenter;
  float boundB = dot(oc, rd);
  float boundC = dot(oc, oc) - boundRadius * boundRadius;
  float boundH = boundB * boundB - boundC;

  if (boundH < 0.0) {
    return false;
  }

  boundH = sqrt(boundH);
  float boundNear = max(0.0, -boundB - boundH);
  float boundFar = -boundB + boundH;

  const int maxSteps = 40;
  float t = boundNear;
  float d = 0.0;

  for (int i = 0; i < maxSteps; ++i) {
    vec3 currPos = ro + rd * t;
    d = map(currPos).x;
    if (d < EPSILON) {
      break;
    }
    t += d;
    if (t > boundFar) {
      return false;
    }
  }

  if (d < EPSILON) {
    vec3 currPos = ro + rd * t;
    renderColor(ro, rd, color, currPos);
    return true;
  }

  return false;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 p = (-iResolution.xy + 2.0 * fragCoord.xy) / iResolution.y;

  if (length(p - vec2(0., -0.08)) > .7) {
    discard;
  }

  vec3 ro = vec3(0, 0, 4);
  vec3 target = vec3(0.0, 0.0, 0.0);

  mat3 camera = calcLookAtMatrix(ro, target, 0.0);
  vec3 rd = normalize(camera * vec3(p.xy, 2.0));

  vec3 col = vec3(0.0);

  bool hit = renderRayMarch(ro, rd, col);

  vec4 color = vec4(col, hit ? 1.0 : 0.0);

  // Convert to linear space required for post processing
  fragColor = pow(color, vec4(2.2));
}
`;
