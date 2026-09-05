varying vec4 vColor;

void main() {
  float dist = length(gl_PointCoord - .5);
  float alpha = vColor.a * pow(smoothstep(.6, 0., dist), 1.5);
  gl_FragColor.rgb = vColor.rgb * alpha; // premultiplied for additive blending
  gl_FragColor.a = alpha;
}
