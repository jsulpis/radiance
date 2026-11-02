# Render live HTML as a texture

If you want styled text, UI panels or forms in a WebGL scene, render a DOM element
as a texture instead of drawing text in a shader: mark the element with the
`drawable` attribute, and the browser paints real HTML and CSS while the element
stays live DOM.

::: info Browser support
HTML-in-Canvas is a web platform incubation (WICG). For now it needs the
`chrome://flags/#canvas-draw-element` flag in a Chromium-based browser. Where the
API is not available, the element texture falls back to a black texture and logs an
error, so a scene never crashes.
:::

## Put the element inside the canvas

The element must be a descendant of the rendered canvas. This is what keeps it
accessible: it is the canvas's fallback content, so text selection, find-in-page
and screen readers keep working on it.

Set `layoutsubtree` on the canvas and `drawable` on the element:

```html
<canvas id="glCanvas" layoutsubtree>
  <article id="card" drawable>
    <h1>Styled text</h1>
    <p>Real DOM, rendered as a texture.</p>
  </article>
</canvas>
```

An element created in code works the same way: append it to the canvas and set
the same two attributes.

## Pass it as a texture uniform

An element is a texture source like images and videos, so pass it as `src`:

```ts
import { glCanvas } from "@radiancejs/gl";

glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: {
    uTexture: { src: document.querySelector<HTMLElement>("#card")! },
  },
});
```

Sample it with `texture(uTexture, vUv)` as usual. By default the element is drawn
where the layout puts it, so hit testing and the accessibility geometry follow the
rendering. All the usual [texture options](/api/core/texture/type-aliases/BaseTextureParams) still apply.

## Let the content update

The texture follows the DOM: any change to the element fires the canvas `paint`
event, which schedules another render in the default `auto` mode — the same
reactive path as video textures. Update the element however you like (text,
classes, CSS animations…) and the shader sees it on the next frame.

```ts
card.querySelector("p").textContent = "The texture follows."; // schedules a render
```

## Place the element in a 3D scene

By default the element stays where the layout puts it. When you draw its texture
on a quad in a 3D scene, tell the browser where the element ended up, so the DOM
position, hit testing and accessibility bounds follow the pixels. Build the quad's
model-view-projection matrix, pass it as a uniform, and give it to
`updateElementMatrix` after each render:

```ts
import { glCanvas, updateElementMatrix } from "@radiancejs/gl";

const card = document.querySelector("#card")!;

// mvp = projection * view * model, built from your math library
function createMvpMatrix(time: number) {
  // ...
}

const { onAfterRender } = glCanvas({
  canvas: "#glCanvas",
  vertex,
  fragment,
  uniforms: {
    uTexture: { src: card },
    uMvpMatrix: ({ time }) => createMvpMatrix(time),
  },
  renderMode: "continuous",
  attributes,
});

onAfterRender(({ uniforms }) => updateElementMatrix(card, uniforms.uMvpMatrix));
```

The quad's vertices must span `[-1, 1]` on both axes, and its aspect ratio must
match the element's (the `aspect` scale above), or the text is distorted.

Call it on every render, since the quad moves and the element's placement must
follow it. The matrix is a flat, column-major array of 16 numbers, which is what
`gl-matrix` produces.

## Place the element in a 2D canvas

For a rectangle drawn at a screen position, such as a lens that follows the
pointer, pass its rectangle to `updateElementRect` after each render. Coordinates
are CSS pixels relative to the canvas, with the origin at the top left. `width`
and `height` are optional and default to the element's current size:

```ts
import { glCanvas, updateElementRect } from "@radiancejs/gl";

let pointer = { x: 0, y: 0 };
const lens = document.querySelector("#lens")!;

const { onAfterRender } = glCanvas({ canvas: "#glCanvas", fragment });

onAfterRender(() =>
  updateElementRect(lens, { x: pointer.x - 80, y: pointer.y - 80, width: 160, height: 160 }),
);
```

## See also

- The [HTML](../../examples/textures/html/) example — live HTML as a texture.
- [Uniform values and sources](../reference/uniform-sources) — how texture sources are resolved.
- [About reactive rendering](../concepts/reactive-rendering) — repaints schedule renders.
