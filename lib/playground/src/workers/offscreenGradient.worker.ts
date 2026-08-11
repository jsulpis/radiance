import { glCanvas, loadTexture, type GLCanvas } from "@radiancejs/gl";

type InitMessage = {
  type: "init";
  canvas: OffscreenCanvas;
};

type ResizeMessage = {
  type: "resize";
  size: {
    width: number;
    height: number;
  };
};

type WorkerMessage = InitMessage | ResizeMessage;

addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
  switch (event.data.type) {
    case "init": {
      init(event.data);
      break;
    }
    case "resize": {
      resize(event.data);
      break;
    }
  }
});

let scene: GLCanvas;

function init(message: InitMessage) {
  scene = glCanvas({
    canvas: message.canvas,
    fragment: /* glsl */ `
      in vec2 vUv;
      uniform sampler2D uTexture;
      uniform vec2 uResolution;
      out vec4 fragColor;

      #define CONTAIN 1
      #define COVER 2
      #define OBJECT_FIT CONTAIN

      void main() {
        vec2 textureResolution = vec2(textureSize(uTexture, 0));
        float canvasRatio = uResolution.x / uResolution.y;
        float textureRatio = textureResolution.x / textureResolution.y;

        vec2 uv = vUv - 0.5;
        if (OBJECT_FIT == CONTAIN ? canvasRatio > textureRatio : canvasRatio < textureRatio) {
          uv.x *= canvasRatio / textureRatio;
        } else {
          uv.y *= textureRatio / canvasRatio;
        }
        uv += 0.5;

        vec3 color = texture(uTexture, uv).rgb;
        color *= step(0., uv.x) * (1. - step(1., uv.x));
        color *= step(0., uv.y) * (1. - step(1., uv.y));

        fragColor = vec4(color, 1.);
      }
    `,
    uniforms: {
      uResolution: ({ canvasResolution }) => canvasResolution,
    },
  });

  scene.onAfterRender(() => {
    postMessage({ type: "rendered" });
  });

  scene.uniforms.uTexture = loadTexture("https://picsum.photos/id/669/600/400");
}

function resize(message: ResizeMessage) {
  scene?.setSize(message.size);
}
