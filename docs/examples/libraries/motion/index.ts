import { bloom, cineonToneMapping, glCanvas } from "@radiancejs/gl";
import { animate } from "motion";
import fragment from "./morph.frag?raw";
import "./styles.css";

const { uniforms } = glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: {
    uResolution: ({ canvasResolution }) => canvasResolution,
    uOffset: 0.0,
    uRotation: 0.0,
    uMorph: 0.0,
  },
  postEffects: [bloom(), cineonToneMapping()],
});

animate(0, 1, {
  duration: 1.2,
  ease: [1, -0.4, 0.4, 1],
  repeat: Infinity,
  repeatType: "mirror",
  repeatDelay: 0.3,
  onUpdate: (progress) => {
    uniforms.uOffset = -0.2 + progress * 0.4;
    uniforms.uRotation = progress * Math.PI;
    uniforms.uMorph = progress;
  },
});
