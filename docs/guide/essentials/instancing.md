# Draw many copies with instancing

If you want to draw the same mesh many times — a field of cubes, a crowd, a forest — do not duplicate its vertices and do not issue one draw call per copy. Give each copy its own data with `divisor`, and Radiance draws all of them in a single instanced call.

## Mark attributes as per-instance

Pass the mesh once, then add one attribute per per-instance property with `divisor: 1`:

```ts
glCanvas({
  canvas: "#glCanvas",
  vertex,
  fragment,
  attributes: {
    // the mesh: one value per vertex
    aPosition: { size: 3, data: positions },
    aNormal: { size: 3, data: normals },
    index: { size: 1, data: indices },
    // the copies: one value per instance
    aInstanceOffset: { size: 3, data: offsets, divisor: 1 },
    aInstanceScale: { size: 1, data: scales, divisor: 1 },
    aInstanceColor: { size: 3, data: colors, divisor: 1 },
  },
  depthTest: true,
});
```

`divisor` is the rate at which an attribute advances:

| `divisor` | Reads                                              |
| --------- | -------------------------------------------------- |
| `0`       | one value per vertex (the default)                 |
| `1`       | one value per instance, shared by all its vertices |
| `n`       | one value every `n` instances                      |

Everything else about the attribute (`size`, `type`, `normalize`, `stride`, `offset`) behaves as in [Draw custom geometry](./draw-geometry). Instance attributes hold one row per instance: `offsets` above is `instanceCount × 3` numbers.

## The instance count comes from the data

Radiance infers how many copies to draw from the instance attributes themselves: `rows × divisor`, taking the largest one. With `divisor: 1` that is simply the number of rows. Keep the instance attributes the same length: the draw uses the largest count, and WebGL rejects the call if a shorter attribute runs out of data — nothing renders, with a "vertex buffer is not big enough" error in the console.

The draw call becomes `drawArraysInstanced`, or `drawElementsInstanced` when you also pass an `index` attribute: the index buffer is shared by every copy, and the vertex count stays the mesh's.

## Read per-instance data in the vertex shader

Instance attributes are ordinary vertex shader inputs. Every vertex of one instance reads the same values, so they can transform the whole copy:

```glsl
attribute vec3 aPosition;
attribute vec3 aInstanceOffset;
attribute float aInstanceScale;
attribute float aInstancePhase;

void main() {
  vec3 local = aPosition * aInstanceScale;
  gl_Position = uProjectionMatrix * uViewMatrix * vec4(local + aInstanceOffset, 1.0);
}
```

`gl_InstanceID` is also available if you would rather derive the data from the instance index.

## Animate the copies

Attribute buffers are uploaded once when the pass is created, so the animation lives in the shader: give each instance a phase (or use `gl_InstanceID`) and drive it from a uniform:

```ts
uniforms: {
  uTime: ({ time }) => time / 1000,
},
```

```glsl
uniform float uTime;

void main() {
  float angle = uTime * 0.6 + aInstancePhase;
  // …rotate the instance by angle…
}
```

When the per-instance data itself must change every frame — positions moved by a simulation, say — keep it in a texture instead of an attribute and read one texel per instance with `gl_InstanceID`. See [Run a simulation with ping-pong framebuffers](../gpgpu/ping-pong-simulations) and the [Boids](../../examples/gpgpu/boids/) example.

## Spinning cubes scattered in 3D

See the [full instancing example](../../examples/basics/instancing/) with one cube, 150 rows of per-instance data scattered in space, using one draw call.

## See also

- [Instancing](../../examples/basics/instancing/) — the same demo as a standalone example.
- [Draw custom geometry](./draw-geometry) — the attribute layout rules this builds on.
- [About performance](../concepts/performance) — one draw call instead of one per copy.
- [Shader conventions](../reference/shader-conventions) — attribute naming and the GLSL dialect.
- [API: Attribute](/api/types/types/interfaces/Attribute.md) — the `divisor` field reference.
