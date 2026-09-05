import { glCanvas } from "@radiancejs/gl";
import fragment from "./metaballs.frag?raw";
import "./styles.css";

const { play, pause, onAfterRender } = glCanvas({
  canvas: "#glCanvas",
  fragment,
  uniforms: {
    uTime: ({ time }) => time / 1000,
  },
  immediate: false, // prevent the loop from starting immediately
});

const playPauseButton = document.querySelector<HTMLButtonElement>("#playPause")!;
let isPlaying = false;

playPauseButton.addEventListener("click", () => {
  isPlaying = !isPlaying;
  playPauseButton.classList.toggle("playing", isPlaying);
  playPauseButton.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
  if (isPlaying) {
    play();
  } else {
    pause();
  }
});

const renderCount = document.querySelector("#renderCount")!;
onAfterRender(() => {
  renderCount.firstChild!.nodeValue = `${Number(renderCount.textContent) + 1}`;
});
