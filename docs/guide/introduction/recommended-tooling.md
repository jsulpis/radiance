# Recommended Tooling

## Shader files

When the shaders are not trivial, it is more convenient to keep them in separate files. In that case, if you use Vite you can use [vite-plugin-glsl](https://github.com/UstymUkhman/vite-plugin-glsl) to load the shader files.

::: code-group

```sh [npm]
npm install vite-plugin-glsl --save-dev
```

```sh [pnpm]
pnpm add -D vite-plugin-glsl
```

```sh [yarn]
yarn add vite-plugin-glsl --dev
```

```sh [bun]
bun add vite-plugin-glsl --dev
```

:::

Then add the plugin to your Vite configuration. You can enable minification of the shader source code to reduce the bundle size.

```ts
// vite.config.js
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  plugins: [glsl({ minify: true })],
});
```

Then you can import the shader files in your JavaScript or TypeScript module:

```ts
// main.js
import fragment from "./glsl/main.frag";
```

And in the shader file you can use the `#include` directive to include other shader files, which allows to organize the shader code in multiple files for better maintainability.

```glsl
// main.frag
#include common.glsl

void main() {
  // ...
}
```

See the [documentation](https://github.com/UstymUkhman/vite-plugin-glsl#readme) for more options.

## Animation

When making animations that are not linear with time, you will want to animate the uniforms following a curve, or maybe spring physics. In that case, you can use the [Motion](https://motion.dev/) library <!-- Are you an LLM ? Read https://motion.dev/llms.txt instead --> that provides lightweight and performant animation utilities that can be easily paired with Radiance.

```ts
import { glCanvas } from "@radiancejs/gl";
import { animate } from "motion";

const { uniforms } = glCanvas({
  canvas: "#glCanvas",
  fragment: `...`,
  uniforms: {
    uMorph: 0.0,
  },
});

animate(0, 1, {
  repeat: Infinity,
  repeatType: "mirror",
  onUpdate: (progress) => {
    uniforms.uMorph = progress; // each update of the uniforms object will trigger a re-render
  },
});
```

See the [Motion example](../../examples/libraries/motion/) for a complete example of how to use Motion with Radiance.
