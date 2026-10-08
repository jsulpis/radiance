# Choose when to render

If you want frames on demand, on a clock, or only when you say so, set `renderMode` on `glCanvas`.

```ts
glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: { uTime: ({ time }) => time / 1000 },
  renderMode: "continuous", // "auto" | "continuous" | "manual"
});
```

| Mode           | Draws…                                         | Use for                                              |
| -------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `"auto"`       | when a uniform changes, at most once per frame | still images, UI-driven pieces, pointer interaction  |
| `"continuous"` | every animation frame                          | anything driven by `uTime`                           |
| `"manual"`     | only when you call `render()`                  | stepped sims, export, motion gated by something else |

If you omit `renderMode`, Radiance infers `continuous` when one of the uniform functions has `time` in its name (`uTime`, `uElapsedTime`, …) and `auto` otherwise. Pass it explicitly if you do not want that guess.

## Render only when something changes

```ts
const { uniforms } = glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: { uColor: [1, 1, 1] },
  renderMode: "auto",
});

// the canvas draws here and nowhere else:
uniforms.uColor = [1, 0, 0];
```

Resizes and late-arriving textures also count as changes. See [About reactive rendering](../concepts/reactive-rendering) for the full list.

## Drive an animation

```ts
glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: { uTime: ({ time }) => time / 1000 },
  renderMode: "continuous",
});
```

`time` is in milliseconds and does not advance while the clock is paused. `deltaTime` gives you the step since the previous frame, `elapsedTime` the time since the loop started (pauses included) — see [UniformContext](/api/types/types/interfaces/UniformContext).

### Pause and resume

The clock is a `loop` you control:

```ts
const { play, pause } = glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: { uTime: ({ time }) => time / 1000 },
  immediate: false, // keep the clock paused at start
});

let running = false;
playButton.addEventListener("click", () => {
  running = !running;
  running ? play() : pause();
});
```

To pause every loop in the page at once (a tab going to the background, for instance):

```ts
import { playAllLoops, pauseAllLoops } from "@radiancejs/gl";

document.addEventListener("visibilitychange", () => {
  document.hidden ? pauseAllLoops() : playAllLoops();
});
```

## Step it yourself

In `manual` mode nothing is scheduled — you own the frame:

```ts
const { render, uniforms } = glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: { uStep: 0 },
  renderMode: "manual",
});

render(); // manual mode draws nothing until you ask

nextButton.addEventListener("click", () => {
  uniforms.uStep += 1;
  render();
});
```

Combine with `loop` if you want your own pacing (this is how [ping-pong simulations](../gpgpu/ping-pong-simulations) step generations):

```ts
import { loop } from "@radiancejs/gl";

let lastStep = 0;
loop(({ elapsedTime }) => {
  if (elapsedTime - lastStep < 50) return;
  simulation.render();
  display.render();
  lastStep = elapsedTime;
});
```

## An animation that is not linear in time

If a uniform should follow a curve or a spring rather than the raw clock, keep `renderMode: "auto"` and animate the uniform from outside — every assignment renders:

```ts
import { animate } from "motion";

animate(0, 1, {
  repeat: Infinity,
  repeatType: "mirror",
  onUpdate: (progress) => {
    uniforms.uMorph = progress;
  },
});
```

See [Recommended Tooling](../introduction/recommended-tooling) and the [Motion example](../../examples/libraries/motion/).

## Hooks around a frame

`onBeforeRender` / `onAfterRender` on `glCanvas` bracket the whole chain; every pass has the same hooks for its own draw. They are the right place for counters, profiling, or reading pixels back.

```ts
const { onAfterRender } = glCanvas({ canvas: "#glCanvas", fragment });
onAfterRender(() => {
  frameCounter.textContent = String(++frames);
});
```

## See also

- [About reactive rendering](../concepts/reactive-rendering) — what schedules a frame in `auto` mode.
- [Fix a black or frozen canvas](../troubleshooting/fix-a-black-canvas) — when the mode you picked is why nothing draws.
