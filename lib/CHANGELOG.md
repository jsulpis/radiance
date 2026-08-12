# Changelog

## v0.12.0

[compare changes](https://github.com/jsulpis/radiance/compare/v0.11.1...v0.12.0)

### 🚀 Enhancements

- Set a max devicePixelRatio to 2 ([f7504ec](https://github.com/jsulpis/radiance/commit/f7504ec))
- **postprocessing:** Add procedural noise effect ([b136434](https://github.com/jsulpis/radiance/commit/b136434))
- Implement resource disposal mechanisms ([3b41df3](https://github.com/jsulpis/radiance/commit/3b41df3))
- ⚠️  Overhaul of uniforms resolution ([ad282e9](https://github.com/jsulpis/radiance/commit/ad282e9))

### 💅 Refactors

- ⚠️  Separate `targetParams` and `target` options for the `effectPass` ([9e4a15f](https://github.com/jsulpis/radiance/commit/9e4a15f))
- ⚠️  Update functions signatures with a single object parameter ([b55b1ba](https://github.com/jsulpis/radiance/commit/b55b1ba))
- ⚠️  Update the signature of `glContext` and `compositor` to accept a single object params ([bbe4fa3](https://github.com/jsulpis/radiance/commit/bbe4fa3))
- Update Uniforms types ([5fe86b2](https://github.com/jsulpis/radiance/commit/5fe86b2))

### 📖 Documentation

- Update readme ([895045b](https://github.com/jsulpis/radiance/commit/895045b))

### 🏡 Chore

- **release:** V0.11.1 ([538aed3](https://github.com/jsulpis/radiance/commit/538aed3))
- Run publint when building the lib ([8f2e084](https://github.com/jsulpis/radiance/commit/8f2e084))
- Fix repository url in package.json ([51051d1](https://github.com/jsulpis/radiance/commit/51051d1))
- Run attw check when building the lib ([b1ad54f](https://github.com/jsulpis/radiance/commit/b1ad54f))
- Configure Renovate ([#60](https://github.com/jsulpis/radiance/pull/60))

#### ⚠️ Breaking Changes

- ⚠️  Overhaul of uniforms resolution ([ad282e9](https://github.com/jsulpis/radiance/commit/ad282e9))
- ⚠️  Separate `targetParams` and `target` options for the `effectPass` ([9e4a15f](https://github.com/jsulpis/radiance/commit/9e4a15f))
- ⚠️  Update functions signatures with a single object parameter ([b55b1ba](https://github.com/jsulpis/radiance/commit/b55b1ba))
- ⚠️  Update the signature of `glContext` and `compositor` to accept a single object params ([bbe4fa3](https://github.com/jsulpis/radiance/commit/bbe4fa3))

## v0.11.1

[compare changes](https://github.com/jsulpis/radiance/compare/v0.11.0...v0.11.1)

### 🩹 Fixes

- Fix broken shader transpilation to GLSL 300 ([57c9f8a](https://github.com/jsulpis/radiance/commit/57c9f8a))

### 📖 Documentation

- Update benchmark ([7ae8ed8](https://github.com/jsulpis/radiance/commit/7ae8ed8))

## v0.11.0

[compare changes](https://github.com/jsulpis/radiance/compare/v0.10.0...v0.11.0)

### 🚀 Enhancements

- **benchmark:** Add a benchmark to compare webgl libs ([3d9d022](https://github.com/jsulpis/radiance/commit/3d9d022))

### 🔥 Performance

- Optimize the compiled size of the quadRenderPass ([5f98f30](https://github.com/jsulpis/radiance/commit/5f98f30))

### 🩹 Fixes

- Avoid an error when a fragment shader already has a precision declaration ([beae048](https://github.com/jsulpis/radiance/commit/beae048))

### 💅 Refactors

- ⚠️  Modify the signature of useBoundingRect and usePointerEvents ([b67069d](https://github.com/jsulpis/radiance/commit/b67069d))
- ⚠️  Update the signature of onPointerEvents handlers ([17c40a0](https://github.com/jsulpis/radiance/commit/17c40a0))
- Create WebGL constants for server side compatibility ([1bad83e](https://github.com/jsulpis/radiance/commit/1bad83e))

### 📖 Documentation

- Setup API documentation generation from TSDoc ([cd71cba](https://github.com/jsulpis/radiance/commit/cd71cba))
- Update the API documentation ([b7b25b9](https://github.com/jsulpis/radiance/commit/b7b25b9))
- Add mermaid diagram in the API overview ([f30a35c](https://github.com/jsulpis/radiance/commit/f30a35c))
- Update the examples with the new API ([88e7ac6](https://github.com/jsulpis/radiance/commit/88e7ac6))
- Revamp the home page ([654d046](https://github.com/jsulpis/radiance/commit/654d046))
- Add llms.txt and markdown files for LLMs ([c08aabb](https://github.com/jsulpis/radiance/commit/c08aabb))
- Add an example of maths using Transform Feedback ([fdb3232](https://github.com/jsulpis/radiance/commit/fdb3232))
- Add hero particles animation ([da90a0c](https://github.com/jsulpis/radiance/commit/da90a0c))
- Force dark mode ([693d061](https://github.com/jsulpis/radiance/commit/693d061))

### 🏡 Chore

- Add BundleSizeGraph component ([a7b8c39](https://github.com/jsulpis/radiance/commit/a7b8c39))
- Add size-limit script ([3196994](https://github.com/jsulpis/radiance/commit/3196994))
- Add size-limit GitHub Action ([e91bbbc](https://github.com/jsulpis/radiance/commit/e91bbbc))
- Update lib dependencies ([423f6d9](https://github.com/jsulpis/radiance/commit/423f6d9))
- Update playwright ([a667e24](https://github.com/jsulpis/radiance/commit/a667e24))
- Update documentation dependencies ([58f5d03](https://github.com/jsulpis/radiance/commit/58f5d03))
- Remove WebGL constants from generated API docs ([b188cf5](https://github.com/jsulpis/radiance/commit/b188cf5))

#### ⚠️ Breaking Changes

- ⚠️  Modify the signature of useBoundingRect and usePointerEvents ([b67069d](https://github.com/jsulpis/radiance/commit/b67069d))
- ⚠️  Update the signature of onPointerEvents handlers ([17c40a0](https://github.com/jsulpis/radiance/commit/17c40a0))

## v0.10.0

[compare changes](https://github.com/jsulpis/radiance/compare/v0.9.0...v0.10.0)

### 🚀 Enhancements

- Add support for matrix uniforms ([877c622](https://github.com/jsulpis/radiance/commit/877c622))
- Add support for depthTest ([9f590d7](https://github.com/jsulpis/radiance/commit/9f590d7))
- Add support for OffscreenCanvas in a Worker ([1153e21](https://github.com/jsulpis/radiance/commit/1153e21))
- Add support for async uniforms ([cc195b2](https://github.com/jsulpis/radiance/commit/cc195b2))

### 💅 Refactors

- ⚠️ Rename all functions ([5bb3c88](https://github.com/jsulpis/radiance/commit/5bb3c88))
- ⚠️ Rename the lib to @radiance/gl ([53de62c](https://github.com/jsulpis/radiance/commit/53de62c))
- Reorganize project structure and rename hooks to passes ([0756a13](https://github.com/jsulpis/radiance/commit/0756a13))
- Add JSDoc and move type definitions ([51c02e6](https://github.com/jsulpis/radiance/commit/51c02e6))
- Remove placeholder from ImageTextureParams ([d4b5b61](https://github.com/jsulpis/radiance/commit/d4b5b61))
- Update the signature of the onUpdated callback ([ded0e16](https://github.com/jsulpis/radiance/commit/ded0e16))
- Extract type guards ([9ddf3f6](https://github.com/jsulpis/radiance/commit/9ddf3f6))

### 📖 Documentation

- Update examples with latest changes ([cacc871](https://github.com/jsulpis/radiance/commit/cacc871))
- Add an example for the trails effect ([5fc7233](https://github.com/jsulpis/radiance/commit/5fc7233))

### 🏡 Chore

- Add a test of a spinning cube ([f3ba275](https://github.com/jsulpis/radiance/commit/f3ba275))
- Add AGENTS.md files ([79249e2](https://github.com/jsulpis/radiance/commit/79249e2))
- Extract helper functions in a dedicated package ([f3c0bdd](https://github.com/jsulpis/radiance/commit/f3c0bdd))
- Update dependencies ([4116a96](https://github.com/jsulpis/radiance/commit/4116a96))
- Reintegrate the helpers in the main package ([4ba2d3c](https://github.com/jsulpis/radiance/commit/4ba2d3c))
- Rename @radiance/gl to @radiancejs/gl ([48a209d](https://github.com/jsulpis/radiance/commit/48a209d))

#### ⚠️ Breaking Changes

- ⚠️ Rename all functions ([5bb3c88](https://github.com/jsulpis/radiance/commit/5bb3c88))
- ⚠️ Rename the lib to @radiance/gl ([53de62c](https://github.com/jsulpis/radiance/commit/53de62c))

## v0.9.0

[compare changes](https://github.com/jsulpis/radiance/compare/v0.8.0...v0.9.0)

### 🚀 Enhancements

- **postprocessing:** Add a trails effect ([eb218e7](https://github.com/jsulpis/radiance/commit/eb218e7))
- Add hooks for initialize and resize ([8e0d56f](https://github.com/jsulpis/radiance/commit/8e0d56f))
- Allow to render without clearing the canvas ([4c23a83](https://github.com/jsulpis/radiance/commit/4c23a83))
- Add a blending option and assume premultiplied alpha everywhere ([4c81351](https://github.com/jsulpis/radiance/commit/4c81351))

### 🩹 Fixes

- Don't resize the canvas if it has width and height attributes ([b1c6b77](https://github.com/jsulpis/radiance/commit/b1c6b77))
- Wrong before/after hooks in useWebGLCanvas ([9753b7d](https://github.com/jsulpis/radiance/commit/9753b7d))

### 💅 Refactors

- Simplify the use of callback functions ([4f5f4fb](https://github.com/jsulpis/radiance/commit/4f5f4fb))

### 📖 Documentation

- Add tone mapping in the bloom example ([7c3b3b4](https://github.com/jsulpis/radiance/commit/7c3b3b4))

### 🏡 Chore

- Setup analytics ([e82387a](https://github.com/jsulpis/radiance/commit/e82387a))
- Add a test for premultiplied alpha ([bc5a05e](https://github.com/jsulpis/radiance/commit/bc5a05e))

## v0.8.0

[compare changes](https://github.com/jsulpis/radiance/compare/v0.7.0...v0.8.0)

### 🚀 Enhancements

- **postprocessing:** Use float textures for all render targets ([8722877](https://github.com/jsulpis/radiance/commit/8722877))
- **postprocessing:** Add tone mapping operators ([eacf322](https://github.com/jsulpis/radiance/commit/eacf322))
- Add support for boolean uniforms ([a727fff](https://github.com/jsulpis/radiance/commit/a727fff))
- **postprocessing:** Include linear to srgb conversion in the tone mapping passes ([17ece66](https://github.com/jsulpis/radiance/commit/17ece66))
- **postprocessing:** ⚠️ Replace linearToSRGB with linearToneMapping ([372a98c](https://github.com/jsulpis/radiance/commit/372a98c))
- Remove the need to use onCanvasReady ([d66ebd8](https://github.com/jsulpis/radiance/commit/d66ebd8))

### 🩹 Fixes

- Bad types for the compositeEffectPass ([cfe8e78](https://github.com/jsulpis/radiance/commit/cfe8e78))

### 📖 Documentation

- Add an example for the builtin bloom effect ([1f5c297](https://github.com/jsulpis/radiance/commit/1f5c297))
- Improve examples of effect passes ([0959428](https://github.com/jsulpis/radiance/commit/0959428))

#### ⚠️ Breaking Changes

- **postprocessing:** ⚠️ Replace linearToSRGB with linearToneMapping ([372a98c](https://github.com/jsulpis/radiance/commit/372a98c))

## v0.7.0

[compare changes](https://github.com/jsulpis/radiance/compare/v0.6.0...v0.7.0)

### 🚀 Enhancements

- Add srgb to linear rgb color space conversion for textures ([6518243](https://github.com/jsulpis/radiance/commit/6518243))
- Allow to scale the render target of an effect pass ([086f899](https://github.com/jsulpis/radiance/commit/086f899))
- Add bloom effect ([47ade94](https://github.com/jsulpis/radiance/commit/47ade94))
- Add linearToSRGB effect ([1a37be8](https://github.com/jsulpis/radiance/commit/1a37be8))
- Add uniforms to CompositeEffectPass ([e702d8d](https://github.com/jsulpis/radiance/commit/e702d8d))

### 🩹 Fixes

- Don't override the render target of an effect pass if it already exists ([a665bb2](https://github.com/jsulpis/radiance/commit/a665bb2))
- Automatic uniform / attribute name recognition broken with minified shader code ([6af2036](https://github.com/jsulpis/radiance/commit/6af2036))
- Fix broken render targets on effects ([1e212cb](https://github.com/jsulpis/radiance/commit/1e212cb))

### 💅 Refactors

- Use an array of passes instead of an object in CompositeEffectPass ([0a5b05c](https://github.com/jsulpis/radiance/commit/0a5b05c))
- Optimize default texture params ([322d9fe](https://github.com/jsulpis/radiance/commit/322d9fe))
- Use vite-plugin-glsl to load shaders ([d7624bd](https://github.com/jsulpis/radiance/commit/d7624bd))

### 📖 Documentation

- Add an example of boids (ping pong FBO) ([babad94](https://github.com/jsulpis/radiance/commit/babad94))
- Add an example of simple particules (ping pong FBO) ([8547e22](https://github.com/jsulpis/radiance/commit/8547e22))
- Add Conway's Game of Life example ([5fbd838](https://github.com/jsulpis/radiance/commit/5fbd838))

### 🏡 Chore

- Update dependencies ([b234932](https://github.com/jsulpis/radiance/commit/b234932))
- Update docker setup for playwright tests ([74e203d](https://github.com/jsulpis/radiance/commit/74e203d))
- Update the sepia effect in playground ([23b862e](https://github.com/jsulpis/radiance/commit/23b862e))
- Migrate bundler from unbuild to tsdown ([abbc7ba](https://github.com/jsulpis/radiance/commit/abbc7ba))

## v0.6.0

[compare changes](https://github.com/jsulpis/radiance/compare/v0.5.0...v0.6.0)

### 🚀 Enhancements

- Add support for ping pong FBO technique ([39c7004](https://github.com/jsulpis/radiance/commit/39c7004))
- Add 'onCanvasReady' is useWebGLCanvas ([ee41ecc](https://github.com/jsulpis/radiance/commit/ee41ecc))
- Add a "transparent" option on the renderPass ([e73e9db](https://github.com/jsulpis/radiance/commit/e73e9db))
- Add useTransformFeedback to do maths on the GPU ([2a3bb42](https://github.com/jsulpis/radiance/commit/2a3bb42))

### 🩹 Fixes

- Wrong count of texture units ([c8a77aa](https://github.com/jsulpis/radiance/commit/c8a77aa))

### 📖 Documentation

- Update the examples with the new synchronous loaders api ([4c76307](https://github.com/jsulpis/radiance/commit/4c76307))
- Add an example of multi-pass post-processing effect (bloom) ([ae7fdcc](https://github.com/jsulpis/radiance/commit/ae7fdcc))

### 🏡 Chore

- Update dependencies ([18f0c9b](https://github.com/jsulpis/radiance/commit/18f0c9b))

## v0.5.0

[compare changes](https://github.com/jsulpis/radiance/compare/v0.4.0...v0.5.0)

### 🚀 Enhancements

- Handle multi-pass post-processing effects ([3250a47](https://github.com/jsulpis/radiance/commit/3250a47))
- Add useCompositeEffectPass hook to have more control over multi pass effects ([45a0528](https://github.com/jsulpis/radiance/commit/45a0528))
- Make the texture loaders synchronous and re-render when loaded ([9829a6c](https://github.com/jsulpis/radiance/commit/9829a6c))

### 📖 Documentation

- Add an example for drawing modes ([0ef7432](https://github.com/jsulpis/radiance/commit/0ef7432))
- Add an example for particles ([a4deedd](https://github.com/jsulpis/radiance/commit/a4deedd))
- **examples:** Add an example of data texture ([7653a1a](https://github.com/jsulpis/radiance/commit/7653a1a))
- **examples:** Add an example of image texture ([20a6a00](https://github.com/jsulpis/radiance/commit/20a6a00))
- **examples:** Add an example of canvas 2D texture ([83ac9fd](https://github.com/jsulpis/radiance/commit/83ac9fd))
- **examples:** Add an example of play/pause ([1441aff](https://github.com/jsulpis/radiance/commit/1441aff))
- **examples:** Add an example of pointer coordinates ([cdc6159](https://github.com/jsulpis/radiance/commit/cdc6159))
- **examples:** Add an example for uniforms ([bd0cbd0](https://github.com/jsulpis/radiance/commit/bd0cbd0))
- **examples:** Display render count ([47ce9c2](https://github.com/jsulpis/radiance/commit/47ce9c2))
- **examples:** Add example of vertices with indices ([bfb1293](https://github.com/jsulpis/radiance/commit/bfb1293))
- **examples:** Add an example of video texture ([229b2a8](https://github.com/jsulpis/radiance/commit/229b2a8))
- **examples:** Add an example of single pass post-processing ([05bad31](https://github.com/jsulpis/radiance/commit/05bad31))
- Setup Vitepress with Sandpack ([a77b367](https://github.com/jsulpis/radiance/commit/a77b367))
- Setup example editor in VitePress ([875fb38](https://github.com/jsulpis/radiance/commit/875fb38))
- Import all examples in VitePress ([78ca377](https://github.com/jsulpis/radiance/commit/78ca377))
- Complete the migration to VitePress ([9f20077](https://github.com/jsulpis/radiance/commit/9f20077))

## v0.4.0

[compare changes](https://github.com/jsulpis/radiance/compare/v0.3.0...v0.4.0)

### 🚀 Enhancements

- Add support for video textures ([b2b9e74](https://github.com/jsulpis/radiance/commit/b2b9e74))
- Add a colorSpace option to facilitate the usage of display-p3 ([7193197](https://github.com/jsulpis/radiance/commit/7193197))

### 🔥 Performance

- Use 1 triangle instead of 2 for full screen quads ([84d4556](https://github.com/jsulpis/radiance/commit/84d4556))

### 🩹 Fixes

- Indexed rendering broken when there is no index attribute in the shaders ([15fd1eb](https://github.com/jsulpis/radiance/commit/15fd1eb))
- Uniforms and attributes detection broken when there is a comment at the end of the line ([1369fa8](https://github.com/jsulpis/radiance/commit/1369fa8))

## v0.3.0

[compare changes](https://github.com/jsulpis/radiance/compare/v0.2.0...v0.3.0)

### 🚀 Enhancements

- Add mipmaps and anisotropic filtering ([4b875d0](https://github.com/jsulpis/radiance/commit/4b875d0))
- Allow crossorigin textures ([170cd40](https://github.com/jsulpis/radiance/commit/170cd40))
- Add manual render mode in useWebGLCanvas ([92183d4](https://github.com/jsulpis/radiance/commit/92183d4))

### 📖 Documentation

- Create documentation with Astro and Starlight ([ec7524d](https://github.com/jsulpis/radiance/commit/ec7524d))
- Setup interactive examples ([7e084a0](https://github.com/jsulpis/radiance/commit/7e084a0))

## v0.2.0

[compare changes](https://github.com/jsulpis/radiance/compare/v0.1.0...v0.2.0)

### 🚀 Enhancements

- Add basic support for textures without mipmaps ([5fc5341](https://github.com/jsulpis/radiance/commit/5fc5341))
- Allow to provide the canvas as a CSS selector ([a7f8d0f](https://github.com/jsulpis/radiance/commit/a7f8d0f))
- Add useLoop hook with play/pause controls ([f3e2cf3](https://github.com/jsulpis/radiance/commit/f3e2cf3))
- Add useBoundingRect hook ([8d1851e](https://github.com/jsulpis/radiance/commit/8d1851e))
- ⚠️ Change onPointerEvents to usePointerEvents and add more events ([ddeabd9](https://github.com/jsulpis/radiance/commit/ddeabd9))

### 🩹 Fixes

- Broken types ([011be36](https://github.com/jsulpis/radiance/commit/011be36))
- DevicePixelContentBoxSize not available on Safari ([f699ed8](https://github.com/jsulpis/radiance/commit/f699ed8))

### 💅 Refactors

- ⚠️ Change `onCanvasResize` to `useResizeObserver` and provide controls on the observer ([31e38ff](https://github.com/jsulpis/radiance/commit/31e38ff))

### 🏡 Chore

- Update dependencies ([45efec1](https://github.com/jsulpis/radiance/commit/45efec1))
- Enforce Typescript consistent type imports ([70d9e4a](https://github.com/jsulpis/radiance/commit/70d9e4a))
- Setup the playground ([a0d37d1](https://github.com/jsulpis/radiance/commit/a0d37d1))
- Move the playground in the lib package ([6e58fc8](https://github.com/jsulpis/radiance/commit/6e58fc8))

### ✅ Tests

- Add screenshot tests with playwright ([67517c8](https://github.com/jsulpis/radiance/commit/67517c8))

### 🤖 CI

- Add basic workflow ([32aaf60](https://github.com/jsulpis/radiance/commit/32aaf60))

#### ⚠️ Breaking Changes

- ⚠️ Change onPointerEvents to usePointerEvents and add more events ([ddeabd9](https://github.com/jsulpis/radiance/commit/ddeabd9))
- ⚠️ Change `onCanvasResize` to `useResizeObserver` and provide controls on the observer ([31e38ff](https://github.com/jsulpis/radiance/commit/31e38ff))

## v0.1.0

### 🚀 Enhancements

- Add a first version of useWebGLCanvas, onCanvasResize, and add a gradient demo ([f464f08](https://github.com/jsulpis/radiance/commit/f464f08))
- Make the vertex shader optional ([6a987b3](https://github.com/jsulpis/radiance/commit/6a987b3))
- Convert GLSL 100 shader source to GLSL 300 to handle both versions ([3e693ad](https://github.com/jsulpis/radiance/commit/3e693ad))
- Automatically detect the time uniform and trigger the render loop only if it is set ([fd2276e](https://github.com/jsulpis/radiance/commit/fd2276e))
- Automatically detect the UV varying name if a vertex shader is not provided ([4466dd7](https://github.com/jsulpis/radiance/commit/4466dd7))
- Add blob demo + loop and onPointerEvents helpers ([d9aaccf](https://github.com/jsulpis/radiance/commit/d9aaccf))
- Automatically detect the resolution uniform ([4a7f935](https://github.com/jsulpis/radiance/commit/4a7f935))
- Automatically resize the canvas if it is not an OffscreenCanvas ([b89f230](https://github.com/jsulpis/radiance/commit/b89f230))
- Add setAttribute function ([4b9ee84](https://github.com/jsulpis/radiance/commit/4b9ee84))
- Trigger render when updating a uniform ([47ff764](https://github.com/jsulpis/radiance/commit/47ff764))
- Add useRawWebGLCanvas ([2cc2e57](https://github.com/jsulpis/radiance/commit/2cc2e57))
- Add requestRender + code cleanup ([8237d51](https://github.com/jsulpis/radiance/commit/8237d51))
- Add support for particles, draw modes and indices ([4062756](https://github.com/jsulpis/radiance/commit/4062756))
- Add first draft of post processing functions ([9f20196](https://github.com/jsulpis/radiance/commit/9f20196))
- Add more post processing functions ([6f1f3e6](https://github.com/jsulpis/radiance/commit/6f1f3e6))
- Add compositor for post processing ([e855390](https://github.com/jsulpis/radiance/commit/e855390))
- Add lifecycle callbacks ([87e4534](https://github.com/jsulpis/radiance/commit/87e4534))

### 💅 Refactors

- Reorganize into folders and create a barrel file ([a7d84f8](https://github.com/jsulpis/radiance/commit/a7d84f8))

### 📖 Documentation

- Add circle demo ([21b6bf7](https://github.com/jsulpis/radiance/commit/21b6bf7))

### 🏡 Chore

- Code cleanup ([e2c032e](https://github.com/jsulpis/radiance/commit/e2c032e))
- Separate packages for docs and lib ([1857c1c](https://github.com/jsulpis/radiance/commit/1857c1c))
- Add license ([e0801ca](https://github.com/jsulpis/radiance/commit/e0801ca))
- Setup unjs package template ([0dc0d0c](https://github.com/jsulpis/radiance/commit/0dc0d0c))
