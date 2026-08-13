import { glCanvas, glContext, loop, pingPongFBO } from "@radiancejs/gl";
import "./styles.css";

const { gl, canvas } = glContext({ canvas: "#glCanvas" });

const gridSize = 100;

const lifeUpdateFragment = /* glsl */ `
  uniform sampler2D tCurrentState;
  varying vec2 vUv;

  int getCellState(vec2 coord) {
    vec4 color = texture2D(tCurrentState, coord);
    return color.r > 0.5 ? 1 : 0;
  }

  void main() {
    int neighbors = 0;
    float dx = 1.0 / float(${gridSize});
    float dy = 1.0 / float(${gridSize});

    neighbors += getCellState(vUv + vec2(-dx, -dy));
    neighbors += getCellState(vUv + vec2(-dx, 0.0));
    neighbors += getCellState(vUv + vec2(-dx, dy));
    neighbors += getCellState(vUv + vec2(0.0, -dy));
    neighbors += getCellState(vUv + vec2(0.0, dy));
    neighbors += getCellState(vUv + vec2(dx, -dy));
    neighbors += getCellState(vUv + vec2(dx, 0.0));
    neighbors += getCellState(vUv + vec2(dx, dy));

    int currentState = getCellState(vUv);
    float newState = 0.0;

    if (currentState == 0 && neighbors == 3) {
      newState = 1.0; // Birth
    } else if (currentState == 1 && (neighbors == 2 || neighbors == 3)) {
      newState = 1.0; // Survival
    }

    gl_FragColor = vec4(newState, newState, newState, 1.0);
  }
`;

const initialData = new Float32Array(gridSize * gridSize * 4);
for (let i = 0; i < gridSize * gridSize; i++) {
  const alive = Math.random() < 0.5 ? 1 : 0;
  initialData.set([alive, alive, alive, 1], i * 4);
}

const gameState = pingPongFBO({
  gl,
  fragment: lifeUpdateFragment,
  dataTexture: {
    name: "tCurrentState",
    initialData,
  },
});

const renderPass = glCanvas({
  canvas,
  fragment: /* glsl */ `
    uniform sampler2D tCurrentState;
    attribute vec2 vUv;

    void main() {
      gl_FragColor = texture2D(tCurrentState, vUv);
    }
  `,
  uniforms: {
    tCurrentState: () => gameState.texture,
  },
});

let lastTime = 0;
loop(({ elapsedTime }) => {
  if (elapsedTime - lastTime < 50) return;
  gameState.render();
  renderPass.render();
  lastTime = elapsedTime;
});
