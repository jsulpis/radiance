import { createFloatDataTexture, glCanvas, glContext, loop, pingPongFBO } from "@radiancejs/gl";
import "./styles.css";

const { gl, canvas } = glContext({ canvas: "#glCanvas" });

const positionsFragment = /* glsl */ `
  uniform float uDeltaTime;
  uniform sampler2D tPositions;
  uniform sampler2D tVelocities;

  in vec2 uv;
  out vec4 fragColor;

  vec2 wrapToRange(vec2 value) {
    vec2 shifted = value + 1.0;
    vec2 wrapped = mod(mod(shifted, 2.0) + 2.0, 2.0);
    return wrapped - 1.0;
  }

  void main() {
    vec2 position = texture(tPositions, uv).xy;
    vec2 velocity = texture(tVelocities, uv).xy;

    fragColor = vec4(wrapToRange(position + velocity * uDeltaTime), 0.0, 0.0);
  }
`;

const count = 100;

const positions = pingPongFBO({
  gl,
  fragment: positionsFragment,
  uniforms: {
    uDeltaTime: 0,
    tVelocities: createFloatDataTexture(
      Array.from({ length: count }).flatMap(() => [
        /* R */ Math.random() * 0.2 - 0.1,
        /* G */ Math.random() * 0.2 - 0.1,
        /* B */ 0,
        /* A */ 0,
      ]),
    ),
  },
  dataTexture: {
    name: "tPositions",
    initialData: Array.from({ length: count }).flatMap(() => [
      /* R */ Math.random() * 2 - 1,
      /* G */ Math.random() * 2 - 1,
      /* B */ 0,
      /* A */ 0,
    ]),
  },
});

const renderPass = glCanvas({
  canvas,
  vertex: `
    uniform sampler2D uPositions;
    in vec2 aCoords;

    void main() {
      gl_Position = vec4(texture2D(uPositions, aCoords).xy, 0, 1);
      gl_PointSize = 20.0;
    }
  `,
  fragment: `
    in vec2 uv;
    out vec4 outColor;

    void main() {
      vec2 uv = gl_PointCoord.xy;
      outColor.a = smoothstep(0.5, 0.4, length(uv - 0.5));
      outColor.rgb = vec3(0, 1, .5) * outColor.a; // alpha must be premultiplied
    }
  `,
  uniforms: {
    uPositions: () => positions.texture,
  },
  attributes: {
    aCoords: positions.coords,
  },
  blending: "normal",
});

loop(({ deltaTime }) => {
  positions.uniforms.uDeltaTime = deltaTime / 500;
  positions.render();
  renderPass.render();
});
