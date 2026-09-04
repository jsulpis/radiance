uniform float uTime;
uniform vec2 uResolution;
uniform float uThreshold;

in vec2 vUv;
out vec4 fragColor;


void main() {
  vec2 uv = vUv - 0.5;
  vec3 color = vec3(0.0);
  vec3 squareColor = vec3(.0, .7, 1.);
  
  for (float i = 1.; i < 5.; i++) {
    float angle = .1 * i * sin(uTime);
    vec2 uvRotated = vec2(
      cos(angle) * uv.x - sin(angle) * uv.y,
      sin(angle) * uv.x + cos(angle) * uv.y
    );
    float square = step(max(abs(uvRotated.x), abs(uvRotated.y)), .1 * i);
    color += vec3(square) * squareColor / 4.;
  }

  color = mix(color, vec3(1.), step(abs(vUv.x - uThreshold), .002));


  fragColor = vec4(color, 1.0);
}
