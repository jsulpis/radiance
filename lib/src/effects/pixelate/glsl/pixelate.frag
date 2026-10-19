uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uSize;
uniform float uDpr;

in vec2 vUv;
out vec4 fragColor;

void main() {
  // Block size is expressed in CSS pixels, so convert it to device pixels
  // before computing the grid the UV is snapped to.
  vec2 cellCount = uResolution / max(uSize * uDpr, 1.0);
  vec2 uv = (floor(vUv * cellCount) + 0.5) / cellCount;

  fragColor = texture(uTexture, uv);
}
