uniform float uTime;
uniform vec2 uResolution;

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 center = uResolution * 0.5;
  float radius = min(uResolution.x, uResolution.y) * 0.25;
  vec2 p = (vUv * uResolution - center) / radius;

  float d = dot(p, p);
  if (d > 1.0) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec3 normal = vec3(p, sqrt(1.0 - d));;
  vec3 lightDir = normalize(vec3(cos(uTime * 0.8) * 0.7, 0.6, 0.7));
  float light = pow(max(dot(normal, lightDir), 0.0), 2.); // pow is a hack to make the lighting falloff smoother
  vec3 color = vec3(0.06, 0.34, 0.68) * (0.2 + 2. * light);

  fragColor = pow(vec4(color, 1.0), vec4(2.2)); // output in linear light
}
