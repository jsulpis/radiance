# AGENTS.md — docs

The VitePress documentation site for `@radiancejs/gl`.

## API

The public API of the package `@radiancejs/gl` is defined in the [api](./api/index.md) folder. Use it to write examples and documentation.

## Conventions

- [Authoring examples](.agents/authoring.md)

## Guides

The guide (`guide/`) is organized by topic: `introduction/`, `essentials/`, `post-processing/`, `gpgpu/`, `advanced/`, `troubleshooting/`, `concepts/`, `reference/`.

Every guide page follows one outline:

1. Title in imperative mood (e.g. "Update uniforms at runtime")
2. A goal sentence first ("If you want X, …")
3. Minimal `##` steps with runnable code
4. A final `## See also` section pointing at the related concept page, the reference pages and runnable examples

`concepts/` pages keep a discursive layout ("About X"); `reference/` pages are bare facts to consult. When adding or moving a page, update the sidebar in `.vitepress/config.ts`.
