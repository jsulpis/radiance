import { glCanvas, updateElementMatrix } from "@radiancejs/gl";
import { mat4 } from "gl-matrix";
import "./styles.css";
import "./cards.css";

const glCanvasElement = document.querySelector<HTMLCanvasElement>("#glCanvas")!;
if (typeof glCanvasElement.captureElementImage !== "function") {
  throw new Error(
    "HTML-in-Canvas API is not available. Use a Chromium-based browser version 157 or later.",
  );
}

const QUAD_SIZE = 0.8;
const quadPositions = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0];

const card = document.querySelector<HTMLElement>("#card")!;
const card2 = document.querySelector<HTMLElement>("#card2")!;
const field = card.querySelector<HTMLInputElement>("#text")!;
const messages = [card.querySelector("p")!, card2.querySelector("p")!];

const projectionMatrix = mat4.perspective(mat4.create(), Math.PI / 4, 1, 0.1, 100);
const viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 5], [0, 0, 0], [0, 1, 0]);
const viewProjectionMatrix = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);

function createMvpMatrix(time: number, element: HTMLElement, x: number, y: number, size: number) {
  const seconds = time / 2000;
  const aspect = element.offsetWidth / element.offsetHeight;
  const modelMatrix = mat4.create();
  mat4.translate(modelMatrix, modelMatrix, [x, y + Math.sin(seconds * 1.2) * 0.08, 0]);
  mat4.rotateY(modelMatrix, modelMatrix, Math.sin(seconds * 0.6) * 0.5);
  mat4.rotateX(modelMatrix, modelMatrix, Math.sin(seconds * 0.9) * 0.15);
  mat4.scale(modelMatrix, modelMatrix, [size * aspect, size, 1]);
  return mat4.multiply(mat4.create(), viewProjectionMatrix, modelMatrix);
}

const { onAfterRender } = glCanvas({
  canvas: "canvas",
  vertex: /* glsl */ `
    in vec3 aPosition;
    in vec2 aUv;
    in float aElement;
    uniform mat4 uMvpMatrix;
    uniform mat4 uMvpMatrix2;
    out vec2 vUv;
    out float vElement;

    void main() {
      gl_Position = (aElement < 0.5 ? uMvpMatrix : uMvpMatrix2) * vec4(aPosition, 1.0);
      vUv = aUv;
      vElement = aElement;
    }
  `,
  fragment: /* glsl */ `
    in vec2 vUv;
    in float vElement;
    uniform sampler2D uTexture;
    uniform sampler2D uTexture2;
    out vec4 fragColor;

    void main() {
      fragColor = vElement < 0.5 ? texture(uTexture, vUv) : texture(uTexture2, vUv);
    }
  `,
  uniforms: {
    uTexture: { src: card },
    uTexture2: { src: card2 },
    uMvpMatrix: ({ time }) => createMvpMatrix(time + 2000, card, 0, 0, QUAD_SIZE),
    uMvpMatrix2: ({ time }) => createMvpMatrix(time - 1000, card2, 1, -1, QUAD_SIZE * 0.5),
  },
  renderMode: "continuous",
  attributes: {
    aPosition: {
      size: 3,
      data: [...quadPositions, ...quadPositions],
    },
    aUv: {
      size: 2,
      data: [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1],
    },
    aElement: {
      size: 1,
      data: [0, 0, 0, 0, 1, 1, 1, 1],
    },
    index: {
      size: 1,
      data: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7],
    },
  },
});

onAfterRender(({ uniforms }) => {
  updateElementMatrix(card, uniforms.uMvpMatrix);
  updateElementMatrix(card2, uniforms.uMvpMatrix2);
});

field.addEventListener("input", () => {
  for (const message of messages) {
    message.textContent = field.value || "Type above to change the DOM.";
  }
});
