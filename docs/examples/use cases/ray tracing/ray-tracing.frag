//=======================================================================================//
//
// Ray tracing starter
// by Julien Sulpis (https://www.jsulpis.dev)                   
// https://www.shadertoy.com/view/cddyDS
//
// inspired by:
// Polytonic - Annotated Ray Tracing (https://www.shadertoy.com/view/4ljGRd)
// Zavie - Ray tracing a cone (https://www.shadertoy.com/view/MtcXWr)
//
//=======================================================================================//

uniform float iTime;
uniform vec2 iResolution;

in vec2 vUv;
out vec4 fragColor;

#define CAMERA_POSITION vec3(0., 1.5, 4.)

#define SUN_DIR normalize(vec3(0.5, 1., 0.))
#define SUN_COLOR vec3(1.)
#define AMBIENT_COLOR vec3(0.12, 0.43, 1)
#define AMBIENT_LIGHT .03 * AMBIENT_COLOR

#define MAX_BOUNCES 3
#define EPSILON 1e-3
#define INFINITY 1e10

//=========//
//  Types  //
//=========//

struct Material {
    vec3 color;
    float specular;
};

struct Hit {
    float len;
    vec3 normal;
    Material material;
};

struct Sphere {
    vec3 position;
    float radius;
    Material material;
};

struct Plane {
    float offset;
    vec3 normal;
    Material material;
};

// Note: I had created a struct for Ray but then deleted it because it caused artifacts on some mobile devices
// because of a precision issue with struct (https://github.com/KhronosGroup/WebGL/issues/3351)
// I use ro and rd instead in this shader.

Hit miss = Hit(INFINITY, vec3(0.), Material(vec3(0.), -1.));

mat3 rotateY(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(
        vec3(c, 0, s),
        vec3(0, 1, 0),
        vec3(-s, 0, c)
    );
}

//===============//
//  Ray Tracing  //
//===============//

Hit intersectPlane(vec3 ro, vec3 rd, Plane p) {
    float dotnd = dot(p.normal, rd);
    if(dotnd > 0.)
        return miss;
    float t = -(dot(ro, p.normal) + p.offset) / dotnd;
    return Hit(t, p.normal, p.material);
}

Hit intersectSphere(vec3 ro, vec3 rd, Sphere s) {
    vec3 op = s.position - ro;
    float b = dot(op, rd);
    float det = b * b - dot(op, op) + s.radius * s.radius;
    if(det < 0.)
        return miss;

    det = sqrt(det);
    float t = b - det;
    if(t < 0.)
        t = b + det;
    if(t < 0.)
        return miss;

    return Hit(t, (ro + t * rd - s.position) / s.radius, s.material);
}

void takeClosest(inout Hit a, Hit b) {
    if(b.len < a.len) {
        a = b;
    }
}

Hit intersectScene(vec3 ro, vec3 rd) {
    Sphere sphere = Sphere(
        rotateY(iTime) * vec3(1., 1., 0.),
        1.,
        Material(vec3(0.9), .01)
    );
    Sphere sphere2 = Sphere(
        rotateY(iTime) * vec3(-1., 2., 0.),
        1.,
        Material(vec3(1., .1, .1), .9)
    );
    Plane plane = Plane(
        0.,
        vec3(0., 1., 0.),
        Material(vec3(0.12, 0.43, 1), .9)
    );

    Hit hit = miss;
    takeClosest(hit, intersectPlane(ro, rd, plane));
    takeClosest(hit, intersectSphere(ro, rd, sphere));
    takeClosest(hit, intersectSphere(ro, rd, sphere2));

    return hit;
}

// Schlick approximation (http://en.wikipedia.org/wiki/Schlick's_approximation)
vec3 fresnelFactor(vec3 normal, vec3 viewDir, Material material) {
    vec3 r0 = material.color * (1. - material.specular);
    float hv = clamp(dot(normal, -viewDir), 0.0, 1.0);
    return r0 + (1.0 - r0) * pow(1.0 - hv, 5.0);
}

vec3 radiance(vec3 ro, vec3 rd) {
    vec3 color = vec3(0.);
    vec3 attenuation = vec3(1.);
    vec3 fresnel = vec3(0.);

    for(int i = 1; i <= MAX_BOUNCES; i++) {
        Hit hit = intersectScene(ro, rd);

        if(hit != miss) {

            vec3 hitPosition = ro + hit.len * rd;
            fresnel = fresnelFactor(hit.normal, rd, hit.material);

            Hit shadowHit = intersectScene(hitPosition + EPSILON * SUN_DIR, SUN_DIR);

            if(shadowHit == miss) {
                // Diffuse
                vec3 directLight = clamp(dot(hit.normal, SUN_DIR), 0.0, 1.0) * SUN_COLOR;
                vec3 diffuseColor = hit.material.color * directLight;

                // Specular
                vec3 r = normalize(reflect(SUN_DIR, hit.normal));
                float phongValue = max(0.0, dot(rd, r));
                float coef = pow(1. - hit.material.specular, 10.) * 1e3; // complete guesswork, I don't know how to compute this phong coefficient
                phongValue = pow(phongValue, coef);

                vec3 specular = vec3(phongValue * coef);

                color += attenuation * (diffuseColor + specular);
            }
            color += attenuation * hit.material.color * AMBIENT_LIGHT;

            // Next bounce
            attenuation *= fresnel * (1. - hit.material.specular);
            vec3 d = reflect(rd, hit.normal);
            ro = ro + hit.len * rd + EPSILON * d;
            rd = d;
        } else {
            color += attenuation * AMBIENT_COLOR;
            break;
        }
    }
    return color;
}

// Zavie - https://www.shadertoy.com/view/lslGzl
vec3 simpleReinhardToneMapping(vec3 color) {
    float exposure = 1.3;
    color *= exposure / (1. + color / exposure);
    color = pow(color, vec3(1. / 2.2));
    return color;
}

//========//
//  Main  //
//========//

void main() {
    vec2 uvNormalized = (vUv * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);

    vec3 ro = CAMERA_POSITION;
    vec3 rd = normalize(vec3(uvNormalized, -1.0));

    vec3 color = radiance(ro, rd);

    fragColor = vec4(simpleReinhardToneMapping(color), 1.0);
}
