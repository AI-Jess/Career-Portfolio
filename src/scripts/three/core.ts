// Shared setup for the site's 3D scenes: renderer, camera, lighting environment, resize handling,
// pointer tracking, and a render loop that pauses when the scene is off screen or the tab is hidden.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const BRAND = { blue: 0x8aabda, green: 0xaadac3, sky: 0xa2d0e6, mint: 0xcce9e2, ink: 0x10161b, warn: 0xf3a273 };
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export type Stage = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  size: { w: number; h: number; aspect: number };
  /** Pointer position relative to the canvas, -1..1 on both axes (0,0 = centre). Eased. */
  pointer: { x: number; y: number; rawX: number; rawY: number; inside: boolean };
  reduced: boolean;
  onFrame(cb: (t: number, dt: number) => void): void;
  onResize(cb: () => void): void;
  /** Width/height of the visible area at a given distance in front of the camera. */
  viewAt(distance: number): { w: number; h: number };
  dispose(): void;
};

export function createStage(canvas: HTMLCanvasElement, opts: { fov?: number; env?: boolean; maxDpr?: number; exposure?: number } = {}): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral tone mapping keeps the brand colours true instead of washing them out
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = opts.exposure ?? 1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 32, 1, 0.1, 200);

  if (opts.env !== false) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }

  const size = { w: 1, h: 1, aspect: 1 };
  const pointer = { x: 0, y: 0, rawX: 0, rawY: 0, inside: false };
  const frameCbs: ((t: number, dt: number) => void)[] = [];
  const resizeCbs: (() => void)[] = [];
  const reduced = reducedMotion();
  const maxDpr = opts.maxDpr ?? 2;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    size.w = r.width; size.h = r.height; size.aspect = r.width / r.height;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setSize(r.width, r.height, false);
    camera.aspect = size.aspect;
    camera.updateProjectionMatrix();
    resizeCbs.forEach((cb) => cb());
    if (!running) renderOnce();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    pointer.rawX = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.rawY = ((e.clientY - r.top) / r.height) * 2 - 1;
    pointer.inside = Math.abs(pointer.rawX) <= 1 && Math.abs(pointer.rawY) <= 1;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let visible = true, running = false, raf = 0, last = 0, t = 0;
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    t += dt;
    const k = 1 - Math.pow(0.001, dt); // frame-rate independent easing
    pointer.x += (pointer.rawX - pointer.x) * k;
    pointer.y += (pointer.rawY - pointer.y) * k;
    frameCbs.forEach((cb) => cb(t, dt));
    renderer.render(scene, camera);
  }
  function renderOnce() { frameCbs.forEach((cb) => cb(t, 0)); renderer.render(scene, camera); }
  function sync() {
    const should = visible && !document.hidden;
    if (should && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; cancelAnimationFrame(raf); }
  }
  const io = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; sync(); }, { rootMargin: '80px' });
  io.observe(canvas);
  const onVis = () => sync();
  document.addEventListener('visibilitychange', onVis);

  resize();
  sync();

  return {
    renderer, scene, camera, canvas, size, pointer, reduced,
    onFrame: (cb) => { frameCbs.push(cb); },
    onResize: (cb) => { resizeCbs.push(cb); cb(); },
    viewAt(distance: number) {
      const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance;
      return { w: h * size.aspect, h };
    },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVis);
      renderer.dispose();
    },
  };
}

/** Soft round sprite used for glowing dots and particles. */
export function glowTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.7)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
