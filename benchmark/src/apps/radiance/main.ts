import { glCanvas } from "@radiancejs/gl";

glCanvas({
  canvas: "canvas",
  fragment: await fetch("/shaders/fullscreen.frag").then((res) => res.text()),
  uniforms: { uTime: ({ time }) => time * 0.001 },
});
