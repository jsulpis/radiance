attribute vec3 random;
uniform float uTime;
uniform vec2 uResolution;
varying vec4 vColor;

// ——— shape ———
#define ARMS 3.             // number of spiral arms
#define CORE_SHARPNESS 1.2  // radius exponent: higher = denser core
#define WINDING 3.          // how tightly the arms curl outwards
#define ARM_SPREAD_CORE .55 // arm width near the core, in arm-spacing units
#define ARM_SPREAD_RIM .7   // arm width at the rim, in arm-spacing units
#define CORE_RADIUS .12     // distance at which the arms fade into the core
#define CORE_FADE .4       // how much the arms fade at the centre (1 = fully round)
#define HALO .25            // share of stars scattered off the arms
#define ARM_THICKNESS .55   // radial wobble of the arms

// ——— size ———
#define SIZE 1.             // galaxy radius on screen
#define STAR_SIZE 5.        // core star size; rim stars are smaller

// ——— animation ———
#define SPIN -.16           // base angular speed, radians per second
#define SPIN_SHEAR -.04      // extra speed for inner stars

#define PI acos(-1.)

void main() {
  // disc radius, denser towards the core
  float radius = pow(random.x, CORE_SHARPNESS);

  // which arm the star belongs to, and how far it drifts from the arm centre
  float armPhase = random.y * ARMS;
  float arm = floor(armPhase);
  float offsetInArms = fract(armPhase) - .5;

  // cubic falloff keeps stars dense on the arm centreline with soft edges
  float dispersion = offsetInArms * abs(offsetInArms);

  // logarithmic winding: arms curve smoothly instead of converging to points
  float angle = (arm + .5 + dispersion * mix(ARM_SPREAD_CORE, ARM_SPREAD_RIM, radius)) * (2. * PI) / ARMS
              + log(1. + 6. * radius) * WINDING;

  // inner stars orbit slightly faster
  angle += uTime * (SPIN + SPIN_SHEAR * (1. - radius));

  // a share of stars ignores the arms and fills the disc smoothly
  float halo = step(fract(random.x * 137.1), HALO);
  angle = mix(angle, random.y * 2. * PI, halo);
  radius = mix(radius, radius * (.4 + .6 * fract(random.y * 57.3)), halo);

  // fade the arms out towards the centre so the core stays round
  angle = mix(angle, random.y * 2. * PI, smoothstep(CORE_RADIUS, 0., radius) * CORE_FADE);

  // slight radial wobble keeps some thickness in the arms
  radius *= 1. + (fract(random.z * 23.7) - .5) * ARM_THICKNESS;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius * SIZE;
  pos.x /= uResolution.x / uResolution.y;
  gl_Position = vec4(pos, 0., 1.);
  gl_PointSize = mix(STAR_SIZE, STAR_SIZE * .7, radius) * (.5 + fract(random.y * 91.7));

  // gold core -> pink arms -> blue rim
  vec3 color = mix(vec3(1., .85, .6), vec3(.9, .4, .6), smoothstep(.05, .45, radius));
  color = mix(color, vec3(.3, .4, .95), smoothstep(.4, 1., radius));
  vColor.rgb = color * (.6 + .8 * fract(random.z * 13.7));
  vColor.a = mix(1., .4, radius);
}
