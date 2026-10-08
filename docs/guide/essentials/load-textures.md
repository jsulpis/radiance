# Sample images, videos and data

If a shader needs pixels that are not computed on the fly, bind a texture uniform. Radiance uploads the source for you and re-renders when it is ready.

## Image

`loadTexture` fetches an URL and resolves to texture parameters. Pass the promise straight into `uniforms` — it is a valid uniform source, and the render happens when it settles:

```ts
import { glCanvas, loadTexture } from "@radiancejs/gl";

glCanvas({
  canvas: "#glCanvas",
  fragment: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main() {
      gl_FragColor = texture2D(uTexture, vUv);
    }
  `,
  uniforms: {
    uTexture: loadTexture("https://example.com/photo.jpg"),
  },
});
```

To show a placeholder first and upgrade later, assign both times:

```ts
const { uniforms } = glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: {
    uTexture: { data: placeholderBytes, width: 1, height: 1 },
  },
});

loadTexture("https://example.com/photo.jpg").then((texture) => {
  uniforms.uTexture = texture; // schedules another render
});
```

See [Image](../../examples/textures/image/) for that pattern live.

::: info CORS
`loadTexture` goes through `fetch`, and `loadVideoTexture` sets `crossOrigin = "anonymous"` for cross-origin URLs. The server has to send the right CORS headers, or the load fails — a common cause of a texture that never arrives. See [Fix a black or frozen canvas](../troubleshooting/fix-a-black-canvas).
:::

## Video

`loadVideoTexture` creates a muted, looping, autoplaying `<video>` element and returns it as a texture source. Sampling it in the fragment shader gives you the current frame:

```ts
import { glCanvas, loadVideoTexture } from "@radiancejs/gl";

glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: {
    uVideo: loadVideoTexture("https://example.com/clip.mp4"),
  },
});
```

Add `startTime` to begin mid-clip. Video textures schedule their own renders: every frame the video presents updates the uniform and requests a frame, so the default `auto` mode keeps up — see [About reactive rendering](../concepts/reactive-rendering). Only `renderMode: "manual"` needs an explicit `render()`. Live demo: [Video](../../examples/textures/video/).

## Raw data

For arrays of numbers (gradients, noise tiles, simulation seeds), pass texture parameters directly — no loader involved:

```ts
uniforms: {
  uDataTexture: {
    data: new Uint8Array([
      255, 0, 0, 255, // one RGBA texel…
      0, 255, 0, 255,
    ]),
    width: 2,
    height: 1,
    magFilter: "nearest",
  },
}
```

`width` × `height` must match the data length (4 components per texel). `magFilter: "nearest"` keeps texels crisp — otherwise they interpolate. Full demo: [Data](../../examples/textures/data/).

### Float data

`createFloatDataTexture` packs a flat list of RGBA floats into a square float texture — the standard input for [GPU simulations](../gpgpu/ping-pong-simulations):

```ts
import { createFloatDataTexture } from "@radiancejs/gl";

uniforms: {
  tPositions: createFloatDataTexture(
    Array.from({ length: 100 }).flatMap(() => [x, y, 0, 0]), // 4 floats per element
  ),
}
```

## Canvas 2D as a source

Anything WebGL accepts as `TexImageSource` works in `src`: an `HTMLCanvasElement`, an `ImageBitmap`, a video element you manage yourself. Draw with Canvas 2D and hand the element over:

```ts
uniforms: {
  uTexture: { src: canvas2dElement, flipY: true },
}
```

See [Canvas 2D](../../examples/textures/canvas2d/).

## Sampler uniforms

Declare the uniform as `sampler2D` and sample it with `texture` (or `texture2D`, which Radiance rewrites):

```glsl
uniform sampler2D uTexture;

void main() {
  vec4 color = texture(uTexture, vUv);
  // textureSize(uTexture, 0) → the dimensions, when you need texel maths
}
```

Each sampler needs its own texture unit — Radiance assigns one per sampler name the first time it uploads it, in the order the entries appear in the `uniforms` object. Sampling the same texture at two spots in one shader is fine; two uniforms pointing at the same texture are two units.

## Filters, wrapping and color space

Every loader takes the same [texture options](/api/core/texture/type-aliases/BaseTextureParams):

| Option            | Values                                                              | Default                                       |
| ----------------- | ------------------------------------------------------------------- | --------------------------------------------- |
| `minFilter`       | `linear`, `nearest`, `linear-mipmap-linear`, `nearest-mipmap-linear` | `linear-mipmap-linear` with mipmaps, else `linear` |
| `magFilter`       | `linear`, `nearest`                                                 | `linear`                                      |
| `wrapS` / `wrapT` | `clamp-to-edge`, `repeat`, `mirrored-repeat`                        | `clamp-to-edge`                               |
| `generateMipmaps` | `boolean`                                                           | `true` for media, `false` for data            |
| `anisotropy`      | `number`                                                            | `1`                                           |
| `flipY`           | `boolean`                                                           | `true`                                        |
| `colorSpace`      | `"srgb"`, `"linear-rgb"`                                            | `"linear-rgb"`                                |

Set `colorSpace: "srgb"` for photographs and UI artwork — the GPU then converts to linear on sample, which is what the rest of the pipeline expects. See [About color management](../concepts/color-management).

## See also

- [Uniform values and sources](../reference/uniform-sources) — how texture sources are resolved.
- [About reactive rendering](../concepts/reactive-rendering) — loading a texture schedules a render.
- The [Textures](../../examples/textures/) examples — image, video, data and Canvas 2D side by side.
