uniform sampler2D uTexture;
uniform vec2 uTexelSize;

in vec2 vUv;
out vec4 fragColor;

const vec3 l = vec3(0.299, 0.587, 0.114);

void main() {
  float lNW = dot(texture(uTexture, vUv + vec2(-1, -1) * uTexelSize).rgb, l);
  float lNE = dot(texture(uTexture, vUv + vec2( 1, -1) * uTexelSize).rgb, l);
  float lSW = dot(texture(uTexture, vUv + vec2(-1,  1) * uTexelSize).rgb, l);
  float lSE = dot(texture(uTexture, vUv + vec2( 1,  1) * uTexelSize).rgb, l);
  float lM  = dot(texture(uTexture, vUv).rgb, l);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
  float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));

  vec2 dir = vec2(
    -((lNW + lNE) - (lSW + lSE)),
    ((lNW + lSW) - (lNE + lSE))
  );

  float dirReduce = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
  float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
  dir = min(vec2(8, 8), max(vec2(-8, -8), dir * rcpDirMin)) * uTexelSize;

  vec3 rgbA = 0.5 * (
    texture(uTexture, vUv + dir * (1.0 / 3.0 - 0.5)).rgb +
    texture(uTexture, vUv + dir * (2.0 / 3.0 - 0.5)).rgb);

  vec3 rgbB = rgbA * 0.5 + 0.25 * (
    texture(uTexture, vUv + dir * -0.5).rgb +
    texture(uTexture, vUv + dir * 0.5).rgb);

  float lB = dot(rgbB, l);

  fragColor = mix(
    vec4(rgbB, 1),
    vec4(rgbA, 1),
    max(sign(lB - lMin), 0.0) * max(sign(lB - lMax), 0.0)
  );
}
