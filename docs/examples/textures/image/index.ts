import { glCanvas, loadTexture, TextureParams } from "@radiancejs/gl";
import "./styles.css";
import fragment from "./fragment.glsl?raw";
import vertex from "./vertex.glsl?raw";

const { uniforms } = glCanvas({
  canvas: "#glCanvas",
  vertex,
  fragment,
  uniforms: {
    uResolution: ({ canvasResolution }) => canvasResolution,
    // placeholder texture. You can use another lighter image
    uTexture: {
      data: new Uint8Array(
        [
          [255, 255, 255, 255],
          [255, 255, 255, 255],
          [255, 255, 255, 255],
          [255, 255, 255, 255],
          [99, 46, 22, 255],
          [255, 255, 255, 255],
        ].flat(),
      ),
      width: 3,
      height: 2,
    } as TextureParams,
  },
});

loadTexture("https://picsum.photos/id/669/600/400").then((texture) => {
  setTimeout(() => {
    uniforms.uTexture = texture;
  }, 300);
});
