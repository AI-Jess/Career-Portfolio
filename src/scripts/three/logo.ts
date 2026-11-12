// Home hero: the brand monogram as a layered 3D object.
// - assembles itself on load, floats gently, and leans toward the pointer
// - drag to spin it (it springs back)
// - as the visitor scrolls the pinned hero, the layers separate in depth ("exploded view")
import * as THREE from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createStage, glowTexture, smoothstep, easeOutCubic, BRAND } from './core';
import { jvLogo } from '../../data/logo';

// How far each colour layer moves along depth when fully exploded (in scene units)
const EXPLODE: Record<string, number> = { blue: 1.15, green: 0.4, sky: -0.4, mint: -1.15 };
const REST_Z: Record<string, number> = { blue: 0.06, green: 0, sky: 0.03, mint: -0.03 };

export function mountLogo(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas.stage-canvas')!;
  const stage = createStage(canvas, { fov: 30 });
  const { scene, camera } = stage;
  camera.position.set(0, 0, 10);

  /* ----- Logo geometry ----- */
  const art = jvLogo;
  const S = 6 / art.width; // logo is 6 units wide
  const logo = new THREE.Group();
  const layers: { mesh: THREE.Mesh; name: string; delay: number }[] = [];
  art.layers.forEach((layer, i) => {
    const shapes = layer.polys.map((poly) => new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x - art.width / 2, art.height / 2 - y))));
    let geo: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shapes, {
      depth: 34, bevelEnabled: true, bevelThickness: 3, bevelSize: 1.4, bevelOffset: -1.4, bevelSegments: 4, curveSegments: 2,
    });
    geo.translate(0, 0, -17);
    geo = toCreasedNormals(geo, Math.PI / 5);
    // Slightly richer than the flat logo colours so they still read as the brand pastels once lit
    const color = new THREE.Color(layer.color);
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    color.setHSL(hsl.h, Math.min(1, hsl.s * 1.25), hsl.l * 0.86);
    const mat = new THREE.MeshPhysicalMaterial({
      color, roughness: 0.34, metalness: 0, clearcoat: 0.9, clearcoatRoughness: 0.28, envMapIntensity: 0.45, transparent: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.setScalar(S);
    logo.add(mesh);
    layers.push({ mesh, name: layer.name, delay: i * 0.12 });
  });
  const pivot = new THREE.Group(); // pointer / drag / scroll rotation
  pivot.add(logo);
  scene.add(pivot);

  /* ----- Lighting: neutral studio environment plus brand-coloured rim lights ----- */
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(-4, 6, 8);
  scene.add(key);
  const rimBlue = new THREE.PointLight(BRAND.blue, 60, 30);
  rimBlue.position.set(-6, -2, -4);
  scene.add(rimBlue);
  const rimGreen = new THREE.PointLight(BRAND.green, 50, 30);
  rimGreen.position.set(6, 3, -5);
  scene.add(rimGreen);

  /* ----- Floating particles for depth ----- */
  const COUNT = 140;
  const pos = new Float32Array(COUNT * 3), col = new Float32Array(COUNT * 3), seed = new Float32Array(COUNT);
  const palette = [BRAND.blue, BRAND.green, BRAND.sky, BRAND.mint].map((c) => new THREE.Color(c));
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 22;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
    pos[i * 3 + 2] = -9 + Math.random() * 13;
    const c = palette[i % palette.length], k = 0.25 + Math.random() * 0.6;
    col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
    seed[i] = Math.random() * 100;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.16, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  }));
  scene.add(points);

  /* ----- Fit the logo to the viewport: sits in the upper part of the hero on tall screens ----- */
  let baseScale = 1, baseY = 0, viewH = 5;
  stage.onResize(() => {
    const view = stage.viewAt(camera.position.z);
    viewH = view.h;
    baseScale = Math.min(1, (view.w * 0.8) / 6, (view.h * 0.28) / 3.42);
    baseY = view.h * 0.25;
  });

  /* ----- Drag to spin ----- */
  let dragging = false, lastX = 0, lastY = 0, yaw = 0, pitch = 0, vYaw = 0, vPitch = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    vYaw = dx * 0.008; vPitch = dy * 0.005;
    yaw += vYaw; pitch = THREE.MathUtils.clamp(pitch + vPitch, -0.6, 0.6);
  });
  const end = () => { dragging = false; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.style.cursor = 'grab';

  /* ----- Animation ----- */
  const scrub = root.closest<HTMLElement>('[data-scrub]');
  let introStart = 0;
  let pSmooth = 0;
  stage.onFrame((t, dt) => {
    // Intro runs on the wall clock so it takes the same time on slow and fast devices
    if (!introStart) introStart = performance.now();
    const intro = stage.reduced ? 1 : Math.min(1, (performance.now() - introStart) / 2400);
    const p = scrub ? ((scrub as any).__p ?? 0) : 0;
    pSmooth += (p - pSmooth) * Math.min(1, dt * 6);
    const explode = smoothstep(0.04, 0.75, pSmooth);

    // Layers: fly in from depth on load, then separate with scroll
    for (const l of layers) {
      // Layers start spread apart in depth and settle together, one after another
      const a = easeOutCubic((intro * 1.45 - l.delay) / 1.0);
      l.mesh.position.z = REST_Z[l.name] + EXPLODE[l.name] * (explode * 1.25 + (1 - a) * 2.6);
      (l.mesh.material as THREE.MeshPhysicalMaterial).opacity = Math.min(1, a * 1.6);
    }

    // Spring the drag rotation back to rest
    if (!dragging) {
      yaw += vYaw; pitch += vPitch;
      vYaw *= Math.pow(0.02, dt); vPitch *= Math.pow(0.02, dt);
      yaw -= yaw * Math.min(1, dt * 1.6);
      pitch -= pitch * Math.min(1, dt * 1.6);
    }

    const idle = stage.reduced ? 0 : 1;
    const settle = easeOutCubic(intro);
    pivot.rotation.y = (1 - settle) * -0.9 + Math.sin(t * 0.45) * 0.16 * idle + stage.pointer.x * 0.32 + yaw + explode * 0.6;
    pivot.rotation.x = (1 - settle) * 0.25 + Math.sin(t * 0.32) * 0.04 * idle + stage.pointer.y * 0.16 + pitch - explode * 0.1;
    pivot.position.y = baseY - explode * viewH * 0.085 + Math.sin(t * 0.8) * 0.05 * idle;
    pivot.scale.setScalar(baseScale * (0.86 + settle * 0.14) * (1 + explode * 0.2));

    // Particles drift upward slowly and wrap around
    if (idle) {
      const arr = pGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < COUNT; i++) {
        arr[i * 3 + 1] += dt * (0.05 + (seed[i] % 1) * 0.12);
        arr[i * 3] += Math.sin(t * 0.3 + seed[i]) * dt * 0.05;
        if (arr[i * 3 + 1] > 6.5) arr[i * 3 + 1] = -6.5;
      }
      pGeo.attributes.position.needsUpdate = true;
    }
    points.rotation.y = stage.pointer.x * 0.05;
  });

  return stage;
}
