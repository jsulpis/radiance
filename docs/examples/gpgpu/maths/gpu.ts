import { glContext, transformFeedback, createFloatDataTexture } from "@radiancejs/gl";

export function square(flatMatrix: number[], matrixSize: number) {
  const indicesN: number[] = [];
  const indicesP: number[] = [];

  for (let p = 0; p < matrixSize; p++) {
    for (let n = 0; n < matrixSize; n++) {
      indicesN.push(n);
      indicesP.push(p);
    }
  }

  const { gl } = glContext({ canvas: "#glCanvas" });

  const tf = transformFeedback({
    gl,
    vertex: /* glsl */ `
    in float n;
    in float p;
    uniform sampler2D matrixContent;
    out float product;

    void main() {
      product = 0.0;
      int matrixSize = textureSize(matrixContent, 0).x;

      for (int i = 0; i < matrixSize; i++) {
        float a = texelFetch(matrixContent, ivec2(int(n), i), 0).x;
        float b = texelFetch(matrixContent, ivec2(i, int(p)), 0).x;
        product += a * b;
      }
    }
    `,
    uniforms: {
      matrixContent: createFloatDataTexture(flatMatrix.flatMap((v) => [v, 0, 0, 0])), // RGBA texture
    },
    attributes: {
      n: { size: 1, data: indicesN },
      p: { size: 1, data: indicesP },
    },
    outputs: {
      product: { size: 1 },
    },
  });

  tf.render();

  return tf.getOutputData("product");
}
