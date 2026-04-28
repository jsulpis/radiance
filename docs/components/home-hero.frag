varying vec4 vColor;

void main() {
  vec2 uv = gl_PointCoord.xy;
  gl_FragColor.a = vColor.a * smoothstep(0.5, 0.4, length(uv - 0.5));
  gl_FragColor.rgb = vColor.rgb * gl_FragColor.a;
}
