# Debug shader compilation errors

If a shader will not compile, Radiance logs the GLSL info log to the console and the pass fails to initialize — `glCanvas`, `renderPass` and friends throw `could not initialize the render pass`. This page is how to read that log and how to avoid the errors behind it.

## Where the errors go

`createShader` and `createProgram` report through `console.error`:

```
could not compile shader: ERROR: 0:12: 'vUv' : undeclared identifier
could not link program: Varyings with the same name but different type…
```

Open the browser console first — the thrown error only names the pass, while the log has the GLSL details. (If the canvas is black for other reasons, see [Fix a black or frozen canvas](./fix-a-black-canvas).)

To inspect the result yourself in development, compile and link ahead of time:

```ts
import { createProgram, glContext } from "@radiancejs/gl";

const { gl } = glContext({ canvas: "#glCanvas" });
const program = createProgram(gl, fragment, vertex);
if (!program) throw new Error("shader failed to compile");
```

(`createShader` logs compile errors but still returns a shader object — checking `createProgram` for `null` is the reliable test.)

## What Radiance rewrites

Every shader is upgraded to GLSL 3.00 ES before compiling, which explains most line-number surprises. The `gl_FragColor` marker is what tells Radiance "this is a fragment shader, convert `varying` to `in`". If you write a fragment shader in GLSL 3.00 style (`out vec4 fragColor;` instead of `gl_FragColor`), declare the `out` and use `in` for varyings yourself.

The full rewrite table and both dialects side by side: [Shader conventions](../reference/shader-conventions#glsl-dialect).

## The usual mistakes

### Mixing the two dialects

```glsl
out vec4 fragColor; // GLSL 3.00 style
void main() {
  gl_FragColor = …; // GLSL 1.00 style → the converter adds a second `out vec4 fragColor;`
}
```

Pick one per shader: either `varying` + `gl_FragColor`, or `in`/`out` + `out vec4 fragColor`.

### A varying that does not match

Vertex `out` (or `varying`) and fragment `in` (or `varying`) must have the same name and type. A mismatch surfaces at link time: _"Varyings with the same name but different type"_.

### Precision missing on integers

The rewrite adds `precision highp float;` only for floats. Integer-heavy shaders (like Game of Life) can need their own:

```glsl
precision highp int;
```

### Using a uniform you never declared

An undeclared name is a compile error (`undeclared identifier`). A **declared but unused** uniform is silent — the driver drops it, `getUniformLocation` returns `null`, and your updates go nowhere. If a value does nothing, check for typos in the name first.

### Sampling the wrong texture unit

Several `sampler2D` uniforms are fine, but each needs its own unit. Radiance assigns one per sampler name, in the order the entries appear in the `uniforms` object; if you feed the same texture to two uniforms, expect two units — usually what you want, but worth knowing when a `sampler2D` renders black.

## Narrow it down fast

1. **Comment out the half of `main()` that you just wrote** and recompile. The log is much easier to read on a small shader.
2. **Print the source.** `createShader` sees a transformed string — when the error line number looks wrong (the `#version` line shifts everything by one), log `pass.fragment` or keep your source in a variable and log it next to the error.
3. **Check the stage.** Errors in a vertex shader often show up as a black canvas with a clean fragment log. `createShader(…, gl.VERTEX_SHADER)` compiles it on its own to find out which side failed.
4. **Reduce to a constant.** `gl_FragColor = vec4(1., 0., 1., 1.);` — if the canvas turns magenta, the pipeline is fine and the bug is in the maths.

::: tip Line numbers
Because of the prepended `#version 300 es` (and possibly `precision highp float;` and `out vec4 fragColor;`), reported line numbers can be offset by one to three lines from your source. Look a little above the reported line before rewriting anything.
:::

## See also

- [Shader conventions](../reference/shader-conventions) — the full dialect table and what the default vertex shader provides.
- [Fix a black or frozen canvas](./fix-a-black-canvas) — when it compiles but shows nothing.
- [Recommended Tooling](../introduction/recommended-tooling) — keeping shaders in files with `vite-plugin-glsl`, which reports errors with file names.
