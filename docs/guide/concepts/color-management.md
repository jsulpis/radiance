# About color management

Shaders do maths in linear space; screens show sRGB. Something has to translate, and if nothing does, colors look washed out, blending looks wrong, and photos look like they were edited in the dark. This page is the short version of the linear workflow Radiance follows.

## Linear where it counts

Light adds linearly. Two half-bright lights make a full-bright one — in **linear** values (0.5 + 0.5 = 1.0). In sRGB they do not: 0.5 sRGB is about 0.21 linear, so "two halves" make 0.42 and the sum looks dark.

Every operation that mixes colors — lighting, blending, bloom, a blur — wants linear values. Radiance's effects work in floating-point linear buffers for exactly that reason (see [About the rendering pipeline](./rendering-pipeline)). The transfer to sRGB happens at the edge: in tone mapping on the way out, and in texture formats on the way in.

## Textures in

A photograph or a UI asset is stored in sRGB. Sampling it raw gives the shader the sRGB numbers, and every subsequent computation treats them as light — which they are not.

Mark those textures `colorSpace: "srgb"` and the GPU converts to linear during sampling (via the `SRGB8_ALPHA8` internal format):

```ts
const { uniforms } = glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: {
    uPhoto: loadTexture("photo.jpg", { colorSpace: "srgb" }), // authored in sRGB
    uData: createFloatDataTexture(rawNumbers), // data, already linear
  },
});
```

| Content                              | `colorSpace`     | Why                                          |
| ------------------------------------ | ---------------- | -------------------------------------------- |
| Photos, video, UI artwork            | `"srgb"`         | authored to look right on an sRGB display    |
| Normal maps, data textures, LUTs*    | `"linear-rgb"`   | numbers, not display colors                  |
| Masks and single-channel fields      | `"linear-rgb"`   | a mask must not be gamma-corrected           |

The default is `"linear-rgb"`, which is right for data and wrong for photographs — an easy one to forget. *A display LUT that is itself stored in sRGB would be `"srgb"`; a maths LUT is linear.

Canvas 2D sources and videos are in sRGB too. See [Sample images, videos and data](../essentials/load-textures) for the loaders.

## Through the pipeline

Inside the chain, values are linear and unbounded — above 1.0 is allowed and meaningful (that is what bloom feeds on). Two consequences:

- Do not clamp or LUT mid-chain if you can avoid it; work in HDR and compress once at the end.
- A custom effect that prints or screenshots an intermediate texture shows **linear** colors. To preview one, apply the sRGB transfer yourself (`pow(color, vec3(1.0 / 2.2))`, or the exact piecewise version in the library's tone mapping chunk).

## Out of the pipeline

Two knobs close the loop.

**Tone mapping** compresses HDR to display range and, by default, applies the linear → sRGB transfer (`outputColorSpace: "sRGB"`). It belongs last:

```ts
postEffects: [bloom(), acesToneMapping({ exposure: 1.2 }), fxaa()],
```

If you would rather keep values linear (to chain your own transfer, or to render into another surface), pass `outputColorSpace: "linear"`. Choosing an operator is [Tone map the output](../post-processing/tone-map-the-output); the parameters are in [Built-in effects](../reference/built-in-effects).

**The drawing buffer** declares what the canvas holds. By default it is sRGB (what CSS and every screenshot expect). For wide-gamut displays, ask for P3:

```ts
glCanvas({
  canvas: "#glCanvas",
  fragment,
  colorSpace: "display-p3", // or "srgb"
  postEffects: [acesToneMapping()],
});
```

This sets `gl.drawingBufferColorSpace`. Colors outside sRGB then survive to a P3 display; on an sRGB display the browser clips them. It changes nothing about the maths inside your shaders — only how the final values are interpreted.

## A worked example

The home page hero ray-marches a cube and calls `sRGBToLinear` on its colors before writing them:

```glsl
vec4 sRGBToLinear(vec4 color) { /* the piecewise transfer */ }

void main() {
  // …
  gl_FragColor = sRGBToLinear(color);
}
```

Those cube colors were picked as sRGB values (the usual way to choose a color by eye). The explicit transfer puts them in the linear space the buffer and the tone mapper expect. If the cube colors were already computed as light, the call would be wrong — which is the whole subject of this page: know which side of the transfer each number is on.

## Checklist

1. Photos and artwork in → `colorSpace: "srgb"`.
2. Data and masks in → leave the default linear.
3. Mix, light, blur in linear HDR. Do not clamp mid-chain.
4. Tone map at the end with `outputColorSpace: "sRGB"` (the default).
5. Set `colorSpace: "display-p3"` on `glCanvas` only if you are targeting wide-gamut output.

## See also

- [Tone map the output](../post-processing/tone-map-the-output) — the operators and their parameters.
- [Sample images, videos and data](../essentials/load-textures) — where `colorSpace` is set on textures.
- [Built-in effects](../reference/built-in-effects) — `outputColorSpace` on every tone mapper.
