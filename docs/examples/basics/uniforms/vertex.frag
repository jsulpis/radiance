in vec3 aPosition;
uniform vec2 uResolution;
out vec2 vUv;

void main() {
   vUv = (2.f * aPosition.xy - 1.f) * uResolution / uResolution.y;

   gl_Position = vec4(2.0f * aPosition - 1.0f, 1.0f);
}