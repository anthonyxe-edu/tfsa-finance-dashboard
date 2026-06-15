"use client";
import React, { useRef, useEffect, Suspense } from "react";
import * as THREE from "three";

/**
 * The "anomalous matter" energy blob by dhileepkumargm (21st.dev), adapted:
 * a wireframe icosahedron whose vertices ripple with Perlin-noise displacement,
 * lit with a fresnel glow. Kept faithful to the original shader — only recolored
 * (driven by `color`) and made to respond to `intensity`, plus TS-typed,
 * ResizeObserver-sized, reduced-motion aware, and mounted inside its container
 * instead of full-screen. The dead mouse-light (a no-op in the original due to a
 * uniform-name mismatch) and unused scene PointLight were dropped.
 */
export function GenerativeArtScene({
  color = "#9dff3c",
  intensity = 0.6,
}: {
  color?: string;
  intensity?: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  // Keep latest props readable inside the animation loop without re-init.
  const colorRef = useRef(color);
  const intensityRef = useRef(intensity);
  colorRef.current = color;
  intensityRef.current = intensity;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(1.2, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        uIntensity: { value: intensity },
        color: { value: new THREE.Color(color) },
      },
      vertexShader: `
        uniform float time;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vPosition;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
                      i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0) * 2.0 + 1.0;
          vec4 s1 = floor(b1) * 2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
        }

        void main() {
          vNormal = normal;
          vPosition = position;
          float displacement = snoise(position * 2.0 + time * 0.5) * (0.12 + uIntensity * 0.16);
          vec3 newPosition = position + normal * displacement;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 color;
        uniform vec3 pointLightPosition;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 lightDir = normalize(pointLightPosition - vPosition);
          float diffuse = max(dot(normal, lightDir), 0.0);
          float fresnel = 1.0 - dot(normal, vec3(0.0, 0.0, 1.0));
          fresnel = pow(fresnel, 2.0);
          vec3 finalColor = color * diffuse + color * fresnel * (0.4 + uIntensity * 0.6);
          gl_FragColor = vec4(finalColor, 1.0);
        }`,
      wireframe: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const size = () => {
      const s = Math.max(1, mount.clientWidth);
      renderer.setSize(s, s);
    };
    const ro = new ResizeObserver(size);
    ro.observe(mount);
    size();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = new THREE.Color();
    let frameId = 0;

    const render = (t: number) => {
      material.uniforms.time.value = t * 0.0003;
      // Ease color + intensity toward the latest props for smooth budget changes.
      target.set(colorRef.current);
      material.uniforms.color.value.lerp(target, 0.06);
      material.uniforms.uIntensity.value +=
        (intensityRef.current - material.uniforms.uIntensity.value) * 0.06;
      mesh.rotation.y += 0.0005;
      mesh.rotation.x += 0.0002;
      renderer.render(scene, camera);
    };

    if (reduced) {
      render(0);
    } else {
      const loop = (t: number) => {
        render(t);
        frameId = requestAnimationFrame(loop);
      };
      frameId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} className="absolute inset-0 h-full w-full" />;
}

/** Original full-screen hero wrapper, kept for completeness (unused by the app). */
export function AnomalousMatterHero({
  title = "Observation Log: Anomaly 7",
  subtitle = "Matter in a state of constant, beautiful flux.",
  description = "A new form of digital existence has been observed.",
}: {
  title?: string;
  subtitle?: string;
  description?: string;
}) {
  return (
    <section role="banner" className="relative h-screen w-full overflow-hidden">
      <Suspense fallback={<div className="h-full w-full" />}>
        <GenerativeArtScene />
      </Suspense>
      <div className="relative z-20 flex h-full flex-col items-center justify-end pb-20 text-center">
        <div className="max-w-3xl px-4">
          <h1 className="font-mono text-sm tracking-widest text-primary/80 uppercase">{title}</h1>
          <p className="mt-4 text-3xl font-bold leading-tight md:text-5xl">{subtitle}</p>
          <p className="mt-6 mx-auto max-w-xl text-base leading-relaxed text-muted">{description}</p>
        </div>
      </div>
    </section>
  );
}
