#include "./_common.glsl"

uniform float uAngle;

const float PI = 3.14159265359;

// Angled dot screen: the threshold is high at each cell centre and falls to
// zero at the cell corners, so dark dots grow from the centre outward.
float ditherThreshold() {
  float angle = radians(uAngle);
  float c = cos(angle);
  float s = sin(angle);
  mat2 rotation = mat2(c, -s, s, c);

  float r = length(fract(rotation * ditherCell()) - 0.5);
  float area = PI * r * r;
  if (r > 0.5) {
    area -= 4.0 * (r * r * acos(0.5 / r) - 0.5 * sqrt(r * r - 0.25));
  }
  return 1.0 - clamp(area, 0.0, 1.0);
}

#include "./_main.glsl"
