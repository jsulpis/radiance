/// <reference path="../../.astro/types.d.ts" />

declare namespace astroHTML.JSX {
  interface HTMLAttributes {
    drawable?: boolean;
  }
  interface CanvasHTMLAttributes {
    content?: "fallback" | "drawable";
    layoutsubtree?: boolean;
  }
}
