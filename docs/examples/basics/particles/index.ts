import { glCanvas } from "@radiancejs/gl";
import "./styles.css";

const vertex = /* glsl */ `
  attribute vec3 random;
  uniform float uTime;
  varying vec4 vColor;

  #define PI acos(-1.)

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
    gl_PointSize = (gl_Position.z + 2.) * 5.;

    vColor.rgb = mix(
      vec3(0.1, 0.2, 0.4), // dark blue
      vec3(0.41, 0.84, 0.98), // light blue
      smoothstep(-1.5, 1., dot(gl_Position.xyz, vec3(1., 1., -.5)))
    );
    vColor.a = smoothstep(-2., .8, gl_Position.z);
  }
`;

const fragment = /* glsl */ `
  varying vec4 vColor;

  void main() {
    vec2 uv = gl_PointCoord.xy;
    gl_FragColor.a = vColor.a * smoothstep(0.5, 0.4, length(uv - 0.5));
    gl_FragColor.rgb = vColor.rgb * gl_FragColor.a; // alpha must be premultiplied
  }
`;

const count = 200;

glCanvas({
  canvas: "#glCanvas",
  fragment,
  vertex,
  attributes: {
    random: {
      data: Array.from({ length: count * 3 }).map(() => Math.random()),
      size: 3,
    },
  },
  uniforms: {
    uTime: ({ time }) => time / 500,
  },
  blending: "normal",
});
