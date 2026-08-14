import { effectPass, glCanvas, loadTexture } from "@radiancejs/gl";
import { Pane } from "tweakpane";
import "./styles.css";

const sepia = effectPass({
  fragment: /* glsl */ `
    uniform sampler2D uTexture; // output of the render pass
    uniform float uStrength;
    in vec2 vUv;
    out vec4 fragColor;

    // sepia filter from the CSS specification : https://drafts.fxtf.org/filter-effects/#sepiaEquivalent
    vec3 sepia(vec3 c){
      return c * mat3(
        0.393, 0.769, 0.189,
        0.349, 0.686, 0.168,
        0.272, 0.534, 0.131
      );
    }

    void main() {
      vec3 color = texture(uTexture, vUv).rgb;
      color = mix(color, sepia(color), uStrength);
      fragColor = vec4(color, 1.);
    }
  `,
  uniforms: {
    uStrength: 1,
  },
});

const { onAfterRender } = glCanvas({
  canvas: "#glCanvas",
  fragment: /* glsl */ `
    in vec2 vUv;
    uniform sampler2D uPicture;
    out vec4 fragColor;

    void main() {
      fragColor = texture(uPicture, vUv);
    }
  `,
  uniforms: {
    uPicture: loadTexture("https://picsum.photos/id/323/600/400"),
  },
  postEffects: [sepia],
});

const renderCount = document.querySelector("#renderCount")!;
onAfterRender(() => {
  renderCount.firstChild!.nodeValue = `${Number(renderCount.textContent) + 1}`;
});

// You can dynamically update the uniforms of an effect pass, like any other pass
const pane = new Pane({ title: "Uniforms" });
pane.addBinding(sepia.uniforms, "uStrength", { min: 0, max: 1 });
