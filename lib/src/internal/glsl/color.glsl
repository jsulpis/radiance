// sRGB transfer functions and alpha helpers shared by the built-in effect
// shaders, so every pass encodes and decodes color the same way.

vec3 linearToSRGB(vec3 c) {
  return mix(c * 12.92, pow(c, vec3(1.0 / 2.4)) * 1.055 - 0.055, step(vec3(0.0031308), c));
}

vec4 linearToSRGB(vec4 c) {
  return vec4(linearToSRGB(c.rgb), c.a);
}

vec3 sRGBToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

// Premultiplied alpha -> straight alpha.
vec3 unpremultiply(vec4 c) {
  return c.a == 0.0 ? vec3(0.0) : c.rgb / c.a;
}
