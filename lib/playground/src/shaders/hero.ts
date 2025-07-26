export const fragment = /* glsl */ `
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float uHappyCursor;

in vec2 vUv;

out vec4 fragColor;

const float PI = 3.1415926535897932384626433832795;

float distSphere(vec3 p, float radius) {
    return length(p) - radius;
}

mat3 calcLookAtMatrix(in vec3 ro, in vec3 ta, in float roll) {
    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize(cross(ww, vec3(sin(roll), cos(roll), 0.0)));
    vec3 vv = normalize(cross(uu, ww));
    return mat3(uu, vv, ww);
}

void doCamera(out vec3 camPos, out vec3 camTar, in float time, in vec2 mouse) {
    float radius = 4.0;
    float theta = 0. + 5.0 * mouse.x - iTime * 0.5 * 0.;
    float phi = PI * 0.5;

    float pos_x = radius * cos(theta) * sin(phi);
    float pos_z = radius * sin(theta) * sin(phi);
    float pos_y = radius * cos(phi);

    camPos = vec3(pos_x, pos_y, pos_z);
    camPos = vec3(0, 0, 4);
    camTar = vec3(0.0, 0.0, 0.0);
}

float smin(float a, float b, float k) {
    float res = exp(-k * a) + exp(-k * b);
    return -log(res) / k;
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

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // Calcul des coordonnées du simplexe
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Autres sommets du simplexe
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // Permutations
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients
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

  // Normalisation des gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mélange des contributions
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1),
                               dot(p2,x2), dot(p3,x3)));
}


float hash(float n) { return fract(sin(n) * 753.5453123); }
float noise(in vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    float n = p.x + p.y * 157.0 + 113.0 * p.z;
    return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                   mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
               mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                   mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z);
}

vec2 map(vec3 pos) {
    float bodyRadius = 1.;
    float sphere = distSphere(vec3(pos.x, pos.y*1.1 + .05, pos.z), bodyRadius) + snoise(pos * .5 + iTime) * 0.015;
    sphere = smin(sphere, distSphere(pos + vec3(0., -.7 * bodyRadius, 0.), .05), 5.);

    float legs = 8.;
    float legsRadius = bodyRadius * 1.;
    for (float i = 0.; i < 5.; i++) {
      vec3 legPos = vec3(cos(i * PI * 2. / legs) * legsRadius, -0.7 * bodyRadius, sin(i * PI * 2. / legs) * legsRadius);
      float staticMovement = snoise(legPos *.5 + iTime * .5) / 15.;
      float dynamicMovement = sin(snoise(legPos * 50.) * 2. * PI + iTime * 9.) * 0.08 * bodyRadius;
      legPos.y += mix(staticMovement, dynamicMovement, uHappyCursor);
      sphere = smin(sphere, distSphere(pos - legPos, .08 * bodyRadius), 5.);
    }
    return vec2(sphere, 1.0);
}

vec3 calcNormal(in vec3 pos) {
    vec3 eps = vec3(0.001, 0.0, 0.0);
	vec3 nor = vec3(
        map(pos + eps.xyy).x - map(pos - eps.xyy).x,
        map(pos + eps.yxy).x - map(pos - eps.yxy).x,
        map(pos + eps.yyx).x - map(pos - eps.yyx).x
    );
	return normalize(nor);
}

void renderColor(vec3 ro, vec3 rd, inout vec3 color, vec3 currPos) {
    vec3 lightDir = normalize(vec3(1., 1., 0.0));
    vec3 normal = calcNormal(currPos);

    float ndotl = abs(dot(-rd, normal));
    float rim = pow(1.0 - ndotl, 6.0);

    color = mix(color, vec3(normal.r, normal.g/2., normal.b) * 0.5 + vec3(0, 0.7, .6), rim + 0.5);
    color += rim * .5;
    color *= dot(normal, lightDir)/2. + .75;
}

bool renderRayMarch(vec3 ro, vec3 rd, inout vec3 color) {
    const int maxSteps = 40;
    float t = 0.0;
    float d = 0.0;

    for (int i = 0; i < maxSteps; ++i) {
        vec3 currPos = ro + rd * t;
        d = map(currPos).x;
        if (d < 0.011) {
            break;
        }
        t += d;
    }

    if (d < 0.011) {
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
    } else {
    vec2 m = iMouse.xy / iResolution.xy;

   vec3 ro, ta;
    doCamera(ro, ta, iTime, m);

    mat3 camMat = calcLookAtMatrix(ro, ta, 0.0);
    vec3 rd = normalize(camMat * vec3(p.xy, 2.0));

   vec3 col = vec3(0.);

  bool hit = renderRayMarch(ro, rd, col);

  vec4 color = vec4(col, hit == true ? 1. : 0.);

    fragColor = color;//vec4(col, 1.0);
  }

}
`;
