# Effects

The `effects` modules provide ready-to-use post-processing passes built on top of the lower-level pass system.

- `bloom` builds a multi-pass bloom chain.
- `noise` adds procedural noise to the rendered image.
- `fxaa` applies fast approximate anti-aliasing to screen-space edges.
- `trails` accumulates previous frames to create persistence and motion trails.
- `toneMapping` contains several operators for HDR-to-display conversion.
