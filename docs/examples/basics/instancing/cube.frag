varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vColor;

uniform vec3 uLightPosition;

void main() {
  // ambient + diffuse against a point light
  float ambientStrength = 0.2;

  vec3 lightDir = normalize(uLightPosition - vWorldPosition);
  float diff = max(dot(vNormal, lightDir), 0.0);

  gl_FragColor = vec4(vColor * (ambientStrength + diff), 1.0);
}
