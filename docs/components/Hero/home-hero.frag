#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main() {
  vec2 pointUv = gl_PointCoord.xy - 0.5;
  float dist = length(pointUv);
  float alpha = smoothstep(0.5, 0.2, dist) * vColor.a;

  fragColor = vec4(vColor.rgb * alpha, alpha);
}
