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
    // placeholder texture: 6x4 downscale of the image loaded below
    uTexture: {
      data: new Uint8Array(
        [
          [13, 24, 41, 255], [24, 43, 72, 255], [27, 55, 90, 255], [44, 70, 99, 255], [83, 109, 97, 255], [59, 79, 69, 255],
          [18, 28, 46, 255], [18, 43, 76, 255], [91, 109, 149, 255], [189, 115, 139, 255], [150, 112, 119, 255], [74, 99, 87, 255],
          [16, 26, 44, 255], [19, 43, 72, 255], [104, 106, 124, 255], [187, 82, 102, 255], [135, 75, 89, 255], [50, 62, 53, 255],
          [13, 24, 40, 255], [22, 40, 68, 255], [29, 39, 55, 255], [28, 22, 21, 255], [5, 8, 7, 255], [5, 12, 22, 255],
        ].flat(),
      ),
      width: 6,
      height: 4,
    } as TextureParams,
  },
});

loadTexture("https://www.radiancejs.dev/images/lotus.jpg").then((texture) => {
  setTimeout(() => {
    uniforms.uTexture = texture;
  }, 300);
});
