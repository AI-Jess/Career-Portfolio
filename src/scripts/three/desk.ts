// Stack page hero: a stylised 3D model of the desk setup, built from simple shapes.
// - drag to look around (it eases back), hover or tap a piece of gear to name it
// - the gear chips under the scene highlight the matching object, and vice versa
// Objects are keyed by the `model` field on items in src/data/stack.ts.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createStage, glowTexture, BRAND } from './core';

const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
const BLUE = hex(BRAND.blue), GREEN = hex(BRAND.green), SKY = hex(BRAND.sky), MINT = hex(BRAND.mint), WARN = hex(BRAND.warn);

/* ---------- Screen artwork (abstract UI, brand colours) ---------- */
function screenTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, mirror = false) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#111a24'); bg.addColorStop(1, '#0c1218');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.lineCap = 'round'; g.lineJoin = 'round';
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (mirror) { tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = -1; }
  return tex;
}
const bar = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) => { g.beginPath(); g.roundRect(x, y, w, h, h / 2); g.fillStyle = fill; g.fill(); };
const panel = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => { g.beginPath(); g.roundRect(x, y, w, h, 18); g.fillStyle = 'rgba(255,255,255,0.045)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.09)'; g.lineWidth = 2; g.stroke(); };

// Ultrawide: flow designer, run history, and a query window side by side
function drawUltrawide(g: CanvasRenderingContext2D, w: number, h: number) {
  const pad = 26, pw = (w - pad * 4) / 3, ph = h - pad * 2;
  for (let i = 0; i < 3; i++) panel(g, pad + i * (pw + pad), pad, pw, ph);
  // 1. flow designer: a branching flow
  let x = pad, cx = x + pw / 2;
  const node = (nx: number, ny: number, c: string, nw = 150) => { g.beginPath(); g.roundRect(nx - nw / 2, ny - 24, nw, 48, 12); g.fillStyle = c; g.fill(); bar(g, nx - nw / 2 + 16, ny - 5, nw - 60, 10, 'rgba(16,22,27,0.55)'); };
  g.strokeStyle = 'rgba(162,208,230,0.6)'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(cx, 90); g.lineTo(cx, 190); g.moveTo(cx, 214); g.bezierCurveTo(cx, 270, cx - 150, 250, cx - 150, 310); g.moveTo(cx, 214); g.bezierCurveTo(cx, 270, cx + 150, 250, cx + 150, 310);
  g.moveTo(cx - 150, 334); g.lineTo(cx - 150, 420); g.moveTo(cx + 150, 334); g.lineTo(cx + 150, 420); g.stroke();
  node(cx, 90, BLUE, 190); node(cx, 190, SKY, 170); node(cx - 150, 310, GREEN); node(cx + 150, 310, GREEN); node(cx - 150, 420, MINT); node(cx + 150, 420, WARN);
  // 2. run history: rows with status dots
  x = pad * 2 + pw;
  bar(g, x + 28, pad + 30, 190, 16, 'rgba(231,237,243,0.7)');
  for (let r = 0; r < 8; r++) {
    const y = pad + 84 + r * 52;
    g.beginPath(); g.arc(x + 40, y + 8, 9, 0, Math.PI * 2); g.fillStyle = r === 3 ? WARN : GREEN; g.fill();
    bar(g, x + 68, y, pw * (0.34 + ((r * 37) % 30) / 100), 14, 'rgba(231,237,243,0.32)');
    bar(g, x + pw - 150, y, 110, 14, 'rgba(231,237,243,0.16)');
  }
  // 3. query window: code-like lines and a result grid
  x = pad * 3 + pw * 2;
  const cols = [BLUE, 'rgba(231,237,243,0.4)', GREEN, 'rgba(231,237,243,0.4)', SKY];
  for (let r = 0; r < 5; r++) { let lx = x + 30; for (let k = 0; k < 3; k++) { const lw = 50 + ((r * 53 + k * 71) % 120); bar(g, lx, pad + 34 + r * 34, lw, 14, cols[(r + k) % cols.length]); lx += lw + 14; } }
  for (let r = 0; r < 6; r++) for (let k = 0; k < 4; k++) { g.fillStyle = r === 0 ? 'rgba(138,171,218,0.35)' : 'rgba(255,255,255,0.07)'; g.fillRect(x + 30 + k * ((pw - 60) / 4), pad + 230 + r * 44, (pw - 60) / 4 - 8, 34); }
}
// Vertical monitor: a long document
function drawVertical(g: CanvasRenderingContext2D, w: number, h: number) {
  panel(g, 22, 22, w - 44, h - 44);
  bar(g, 52, 60, w * 0.5, 22, 'rgba(231,237,243,0.75)');
  for (let r = 0; r < 22; r++) {
    const y = 120 + r * 36;
    if (r % 7 === 5) { bar(g, 52, y, w * 0.34, 18, BLUE); continue; }
    bar(g, 52, y, (w - 104) * (0.55 + ((r * 29) % 45) / 100), 12, 'rgba(231,237,243,0.26)');
  }
}
// Landscape monitor: a week view calendar
function drawLandscape(g: CanvasRenderingContext2D, w: number, h: number) {
  panel(g, 22, 22, w - 44, h - 44);
  const cw = (w - 90) / 5;
  for (let d = 0; d < 5; d++) {
    bar(g, 50 + d * cw, 54, cw * 0.4, 12, 'rgba(231,237,243,0.5)');
    g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(45 + d * cw, 84, cw - 10, h - 130);
  }
  const ev: [number, number, number, string][] = [[0, 100, 70, BLUE], [1, 150, 110, GREEN], [1, 290, 60, SKY], [2, 110, 50, MINT], [3, 200, 130, BLUE], [4, 120, 80, GREEN], [4, 260, 70, WARN], [2, 240, 90, SKY]];
  for (const [d, y, eh, c] of ev) { g.beginPath(); g.roundRect(50 + d * cw, y, cw - 20, eh, 10); g.fillStyle = c; g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1; }
}
// iPad: a hand-drawn flow sketch
function drawTablet(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#3a5f9f'; g.lineWidth = 6;
  const box = (x: number, y: number, bw: number, bh: number) => { g.beginPath(); g.roundRect(x, y, bw, bh, 14); g.stroke(); };
  box(50, 70, 150, 80); box(290, 50, 160, 80); box(290, 200, 160, 80); box(540, 120, 150, 90);
  g.beginPath(); g.moveTo(200, 110); g.bezierCurveTo(240, 110, 250, 90, 290, 90); g.moveTo(200, 110); g.bezierCurveTo(240, 115, 250, 240, 290, 240); g.moveTo(450, 90); g.bezierCurveTo(500, 90, 500, 160, 540, 160); g.moveTo(450, 240); g.bezierCurveTo(500, 240, 500, 170, 540, 170); g.stroke();
  g.strokeStyle = '#2c8a6c'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(70, 330); g.lineTo(300, 330); g.moveTo(70, 370); g.lineTo(240, 370); g.moveTo(560, 250); g.lineTo(580, 272); g.lineTo(630, 228); g.stroke();
}
function keysTexture() {
  const c = document.createElement('canvas'); c.width = 680; c.height = 240;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1b2026'; g.fillRect(0, 0, 680, 240);
  for (let r = 0; r < 5; r++) for (let k = 0; k < 15; k++) {
    if (r === 4 && k > 3 && k < 10) { if (k === 4) { g.beginPath(); g.roundRect(14 + k * 44, 14 + r * 44, 44 * 6 - 8, 36, 7); g.fillStyle = '#2c333c'; g.fill(); } continue; }
    g.beginPath(); g.roundRect(14 + k * 44, 14 + r * 44, 36, 36, 7); g.fillStyle = (r + k) % 11 === 0 ? '#3a5f9f' : '#2c333c'; g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function mountDesk(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas.stage-canvas')!;
  const chips = Array.from(root.querySelectorAll<HTMLElement>('[data-model]'));
  const tip = root.querySelector<HTMLElement>('.desk-tip');
  const stage = createStage(canvas, { fov: 30 });
  const { scene, camera } = stage;

  scene.add(new THREE.HemisphereLight(0xcfe0f5, 0x0b1014, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(2.2, 4, 3.2); scene.add(key);
  const rim = new THREE.PointLight(BRAND.blue, 14, 12); rim.position.set(-2.4, 1.6, -2); scene.add(rim);
  const rim2 = new THREE.PointLight(BRAND.green, 10, 12); rim2.position.set(2.6, 1.2, -1.6); scene.add(rim2);

  const M = (color: number, roughness = 0.6, metalness = 0.1) => new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 0.45 });
  const dark = M(0x1a1e24, 0.5, 0.3), darker = M(0x121519, 0.6, 0.2), silver = M(0xaab0b8, 0.35, 0.7);
  const box = (w: number, h: number, d: number, mat: THREE.Material, r = 0.008) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) / 2.01)), mat);
  const screen = (w: number, h: number, tex: THREE.Texture) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));

  const desk = new THREE.Group();
  scene.add(desk);
  const items: Record<string, THREE.Group> = {};
  const item = (name: string) => { const g = new THREE.Group(); g.userData.key = name; items[name] = g; desk.add(g); return g; };

  /* ----- Desk ----- */
  const top = box(2.5, 0.045, 0.98, M(0x4a372b, 0.72, 0.02), 0.012);
  top.position.y = -0.0225;
  desk.add(top);
  for (const sx of [-1.08, 1.08]) {
    const leg = box(0.05, 0.72, 0.7, darker); leg.position.set(sx, -0.405, 0); desk.add(leg);
    const foot = box(0.07, 0.03, 0.82, darker); foot.position.set(sx, -0.765, 0); desk.add(foot);
  }
  const beam = box(2.16, 0.06, 0.04, darker); beam.position.set(0, -0.12, -0.2); desk.add(beam);

  /* ----- Ultrawide: 49" curved (1800R) ----- */
  {
    const g = item('ultrawide');
    const W = 1.19, H = 0.34, R = 1.8, arc = W / R, y = 0.15 + H / 2, z = -0.2;
    const scr = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 72, 1, true, Math.PI - arc / 2, arc), new THREE.MeshBasicMaterial({ map: screenTexture(2048, 585, drawUltrawide, true), side: THREE.BackSide, toneMapped: false }));
    scr.position.set(0, y, z + R);
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.014, R + 0.014, H + 0.028, 72, 1, true, Math.PI - arc / 2 - 0.009, arc + 0.018), new THREE.MeshStandardMaterial({ color: 0x15181d, roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide, envMapIntensity: 0.4 }));
    shell.position.copy(scr.position);
    const neck = box(0.07, 0.24, 0.035, dark); neck.position.set(0, 0.12, z - 0.045);
    const base = box(0.34, 0.014, 0.2, dark); base.position.set(0, 0.007, z + 0.02);
    g.add(shell, scr, neck, base);
    // light spilling from the screen onto the desk
    const spill = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.7), new THREE.MeshBasicMaterial({ map: glowTexture(), color: BRAND.sky, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.002, 0.08);
    desk.add(spill);
  }
  /* ----- Side monitors ----- */
  const flatMonitor = (name: string, w: number, h: number, tex: THREE.Texture, x: number, zz: number, ry: number) => {
    const g = item(name);
    const lift = 0.13;
    const body = box(w + 0.022, h + 0.022, 0.024, dark, 0.01); body.position.y = lift + h / 2;
    const scr = screen(w, h, tex); scr.position.set(0, lift + h / 2, 0.0125);
    const neck = box(0.045, lift + 0.05, 0.03, dark); neck.position.set(0, (lift + 0.05) / 2, -0.025);
    const base = box(0.2, 0.012, 0.15, dark); base.position.set(0, 0.006, -0.01);
    g.add(body, scr, neck, base);
    g.position.set(x, 0, zz); g.rotation.y = ry;
  };
  flatMonitor('vertical', 0.31, 0.54, screenTexture(620, 1080, drawVertical), -0.9, -0.06, 0.5);
  flatMonitor('landscape', 0.54, 0.31, screenTexture(1080, 620, drawLandscape), 0.96, 0.0, -0.55);

  /* ----- Keyboard + mouse (not interactive) ----- */
  const kb = box(0.36, 0.014, 0.125, dark, 0.006); kb.position.set(0, 0.007, 0.24); desk.add(kb);
  const keys = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.11), new THREE.MeshBasicMaterial({ map: keysTexture(), toneMapped: false }));
  keys.rotation.x = -Math.PI / 2; keys.position.set(0, 0.0145, 0.24); desk.add(keys);
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 16), dark); mouse.scale.set(1, 0.55, 1.6); mouse.position.set(0.29, 0.014, 0.25); desk.add(mouse);

  /* ----- iPad + pencil ----- */
  {
    const g = item('ipad');
    const slab = box(0.25, 0.007, 0.18, silver, 0.003); slab.position.y = 0.0035;
    const scr = screen(0.236, 0.166, screenTexture(760, 520, drawTablet)); scr.rotation.x = -Math.PI / 2; scr.position.y = 0.0073;
    const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.16, 12), M(0xf2f4f6, 0.4, 0)); pencil.rotation.z = Math.PI / 2; pencil.position.set(0, 0.005, 0.11);
    g.add(slab, scr, pencil);
    g.position.set(-0.6, 0, 0.26); g.rotation.y = 0.32;
  }
  /* ----- Headphones on a stand ----- */
  {
    const g = item('headphones');
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.012, 32), dark); base.position.y = 0.006;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.24, 12), silver); pole.position.y = 0.125;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.011, 12, 40, Math.PI), M(0x23272e, 0.55, 0.2)); band.position.y = 0.172;
    g.add(base, pole, band);
    for (const sx of [-1, 1]) {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.032, 28), M(0x1c2026, 0.5, 0.25)); cup.rotation.z = Math.PI / 2; cup.scale.z = 1.18; cup.position.set(sx * 0.086, 0.15, 0);
      const pad = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.011, 10, 28), M(0x2e343c, 0.8, 0)); pad.rotation.y = Math.PI / 2; pad.scale.y = 1.18; pad.position.set(sx * 0.068, 0.15, 0);
      g.add(cup, pad);
    }
    g.position.set(0.62, 0, 0.26); g.rotation.y = -0.5;
  }
  /* ----- AirPods case ----- */
  {
    const g = item('airpods');
    const c = box(0.062, 0.024, 0.047, M(0xf3f5f7, 0.3, 0), 0.011); c.position.y = 0.012;
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 8, 8), new THREE.MeshBasicMaterial({ color: 0x5fe08a })); led.position.set(0, 0.014, 0.0238);
    g.add(c, led);
    g.position.set(0.4, 0, 0.36); g.rotation.y = 0.35;
  }

  // Each piece of gear gets its own copies of the shared materials, so highlighting one doesn't light up the others
  for (const g of Object.values(items)) g.traverse((o: any) => { if (o.isMesh && o.material.emissive) o.material = o.material.clone(); });

  /* ----- Camera: orbits a point just above the desk ----- */
  const target = new THREE.Vector3(0, 0.13, 0);
  let radius = 3.2;
  stage.onResize(() => {
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    radius = Math.max(2.72 / (2 * tan * stage.size.aspect), 1.4 / (2 * tan));
  });

  /* ----- Drag to look around ----- */
  let dragging = false, lastX = 0, lastY = 0, yaw = 0, pitch = 0, vYaw = 0, vPitch = 0, moved = 0;
  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
  canvas.addEventListener('pointermove', (e) => {
    if (dragging) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      vYaw = -dx * 0.006; vPitch = dy * 0.004;
      yaw = THREE.MathUtils.clamp(yaw + vYaw, -1.0, 1.0); pitch = THREE.MathUtils.clamp(pitch + vPitch, -0.14, 0.5);
    } else hover(e);
  });
  const end = (e: PointerEvent) => { dragging = false; canvas.style.cursor = 'grab'; if (moved < 6) hover(e, true); };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('pointerleave', () => { if (!dragging && !pinned) setActive(null); });

  /* ----- Hover / tap gear ----- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let active: string | null = null, pinned = false;
  const focus: Record<string, number> = Object.fromEntries(Object.keys(items).map((k) => [k, 0]));
  const labelFor = (k: string) => chips.find((c) => c.dataset.model === k)?.dataset.label ?? '';
  function setActive(k: string | null, pin = false) {
    active = k; pinned = pin && !!k;
    chips.forEach((c) => c.classList.toggle('is-active', c.dataset.model === k));
    if (tip) { tip.textContent = k ? labelFor(k) : ''; tip.classList.toggle('is-on', !!k); }
  }
  function hover(e: PointerEvent, tap = false) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    ray.setFromCamera(ndc, camera);
    let k: string | null = null;
    for (const hit of ray.intersectObjects(Object.values(items), true)) {
      let o: THREE.Object3D | null = hit.object;
      while (o && !o.userData.key) o = o.parent;
      if (o) { k = o.userData.key; break; }
    }
    if (tap) setActive(k, true);
    else if (!pinned || k) { if (k !== active) setActive(k); }
    if (!dragging) canvas.style.cursor = k ? 'pointer' : 'grab';
  }
  chips.forEach((c) => {
    const k = c.dataset.model!;
    c.addEventListener('pointerenter', () => setActive(k));
    c.addEventListener('pointerleave', () => { if (!pinned) setActive(null); });
    c.addEventListener('focus', () => setActive(k));
    c.addEventListener('click', () => setActive(k, true));
  });

  const v = new THREE.Vector3(), bbox = new THREE.Box3();
  stage.onFrame((t, dt) => {
    if (!dragging) {
      yaw = THREE.MathUtils.clamp(yaw + vYaw, -1.0, 1.0); pitch = THREE.MathUtils.clamp(pitch + vPitch, -0.14, 0.5);
      vYaw *= Math.pow(0.03, dt); vPitch *= Math.pow(0.03, dt);
      yaw -= yaw * Math.min(1, dt * 0.7); pitch -= pitch * Math.min(1, dt * 0.7);
    }
    const sway = stage.reduced ? 0 : Math.sin(t * 0.22) * 0.2;
    const a = sway + yaw + stage.pointer.x * 0.08, b = 0.26 + pitch + stage.pointer.y * 0.03;
    camera.position.set(target.x + Math.sin(a) * Math.cos(b) * radius, target.y + Math.sin(b) * radius, target.z + Math.cos(a) * Math.cos(b) * radius);
    camera.lookAt(target);

    for (const k in items) {
      focus[k] += ((k === active ? 1 : 0) - focus[k]) * Math.min(1, dt * 8 + (dt === 0 ? 1 : 0));
      const f = focus[k];
      items[k].scale.setScalar(1 + f * 0.05);
      items[k].position.y = f * 0.012;
      items[k].traverse((o: any) => { if (o.isMesh && o.material.emissive) { o.material.emissive.setHex(BRAND.blue); o.material.emissiveIntensity = f * 0.35; } });
    }
    if (tip && active) {
      bbox.setFromObject(items[active]);
      v.set((bbox.min.x + bbox.max.x) / 2, bbox.max.y + 0.04, (bbox.min.z + bbox.max.z) / 2).project(camera);
      tip.style.transform = `translate(-50%, -100%) translate(${((v.x + 1) / 2) * stage.size.w}px, ${((1 - v.y) / 2) * stage.size.h}px)`;
    }
  });

  return stage;
}
