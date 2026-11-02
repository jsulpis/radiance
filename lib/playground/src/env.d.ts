/// <reference path="../../.astro/types.d.ts" />

declare namespace astroHTML.JSX {
  interface HTMLAttributes {
    drawable?: boolean;
  }
  interface CanvasHTMLAttributes {
    layoutsubtree?: boolean;
  }
}
