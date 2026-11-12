// Case study hero: the system as a row of glass panels with requests flowing through them.
// Driven entirely by the `pipeline` list in a case study's front matter, so every case study can have one.
// - hover or tap a panel (or its label) to focus it; the caption below explains that step
// - requests split across lanes where a step has them; some turn amber and drop to the failure notice
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createStage, glowTexture, BRAND } from './core';

export type PipeStep = { label: string; detail: string; owner?: string; mine?: boolean; icon?: string; lanes?: string[]; failure?: string };

const C = (hex: number) => new THREE.Color(hex);
const css = (hex: number) => '#' + hex.toString(16).padStart(6, '0');

/* ---------- Pictograms drawn onto each panel ---------- */
function iconTexture(step: PipeStep, index: number, portrait: boolean): THREE.CanvasTexture {
  const W = portrait ? 460 : 340, H = portrait ? 250 : 420;
  const c = document.createElement('canvas');
  c.width = W * 2; c.height = H * 2;
  const g = c.getContext('2d')!;
  g.scale(2, 2);
  const blue = css(BRAND.blue), green = css(BRAND.green), sky = css(BRAND.sky), dim = 'rgba(231,237,243,0.28)';
  g.lineCap = 'round'; g.lineJoin = 'round';
  const pill = (x: number, y: number, w: number, h: number, fill?: string, stroke?: string) => {
    g.beginPath(); g.roundRect(x, y, w, h, Math.min(h / 2, 14));
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 2; g.stroke(); }
  };
  const cx = W / 2, cy = H / 2;
  const icon = step.icon ?? 'generic';
  if (icon === 'form') {
    const x0 = cx - 95, y0 = cy - (portrait ? 80 : 120), rows = portrait ? 3 : 4, gap = portrait ? 44 : 52;
    for (let i = 0; i < rows; i++) {
      g.beginPath(); g.arc(x0 + 12, y0 + i * gap + 12, 10, 0, Math.PI * 2);
      g.strokeStyle = i === 1 ? green : dim; g.lineWidth = 3; g.stroke();
      if (i === 1) { g.beginPath(); g.arc(x0 + 12, y0 + i * gap + 12, 4.5, 0, Math.PI * 2); g.fillStyle = green; g.fill(); }
      pill(x0 + 38, y0 + i * gap + 5, i % 2 ? 110 : 150, 14, dim);
    }
    pill(x0, y0 + rows * gap + 6, 96, 30, blue);
  } else if (icon === 'flow') {
    const lanes = step.lanes?.length ? step.lanes : ['', '', ''];
    const cols = portrait ? 2 : 1, rows = Math.ceil(lanes.length / cols);
    const pw = portrait ? 190 : 250, ph = portrait ? 46 : 52, gx = 16, gy = portrait ? 14 : 20;
    const x0 = cx - (cols * pw + (cols - 1) * gx) / 2, y0 = cy - (rows * ph + (rows - 1) * gy) / 2;
    g.font = '600 21px "Inter Variable", system-ui, sans-serif'; g.textBaseline = 'middle';
    lanes.forEach((name, i) => {
      const x = x0 + (i % cols) * (pw + gx), y = y0 + Math.floor(i / cols) * (ph + gy);
      pill(x, y, pw, ph, 'rgba(138,171,218,0.16)', blue);
      g.beginPath(); g.arc(x + 24, y + ph / 2, 6, 0, Math.PI * 2); g.fillStyle = [blue, green, sky, '#cce9e2'][i % 4]; g.fill();
      g.fillStyle = '#e7edf3'; g.fillText(name, x + 42, y + ph / 2 + 1);
    });
  } else if (icon === 'database') {
    const w = 150, x = cx - w / 2, top = cy - (portrait ? 70 : 100), bandH = portrait ? 34 : 46;
    g.strokeStyle = sky; g.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const y = top + i * bandH;
      g.beginPath(); g.ellipse(cx, y, w / 2, 16, 0, 0, Math.PI * 2);
      g.fillStyle = i === 0 ? 'rgba(162,208,230,0.25)' : 'transparent'; g.fill(); g.stroke();
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + bandH); g.moveTo(x + w, y); g.lineTo(x + w, y + bandH); g.stroke();
    }
    g.beginPath(); g.ellipse(cx, top + 3 * bandH, w / 2, 16, 0, 0, Math.PI); g.stroke();
    // rows being picked up
    const ry = top + 3 * bandH + 44;
    pill(cx - 70, ry, 140, 12, dim); pill(cx - 70, ry + 22, 96, 12, green);
  } else if (icon === 'systems') {
    const w = portrait ? 180 : 210, h = portrait ? 78 : 104, gap = portrait ? 16 : 26;
    const horizontal = portrait;
    for (let i = 0; i < 2; i++) {
      const x = horizontal ? cx - w - gap / 2 + i * (w + gap) : cx - w / 2;
      const y = horizontal ? cy - h / 2 : cy - h - gap / 2 + i * (h + gap);
      g.beginPath(); g.roundRect(x, y, w, h, 14); g.fillStyle = 'rgba(170,218,195,0.12)'; g.fill(); g.strokeStyle = green; g.lineWidth = 2; g.stroke();
      pill(x + 16, y + 18, w * 0.5, 10, dim); pill(x + 16, y + 38, w * 0.34, 10, dim);
      g.beginPath(); g.moveTo(x + w - 54, y + h / 2 + 2); g.lineTo(x + w - 42, y + h / 2 + 14); g.lineTo(x + w - 20, y + h / 2 - 12);
      g.strokeStyle = green; g.lineWidth = 5; g.stroke();
    }
  } else {
    pill(cx - 90, cy - 40, 180, 14, dim); pill(cx - 90, cy - 10, 130, 14, dim); pill(cx - 90, cy + 20, 160, 14, blue);
  }
  // Step number badge, top-left, so panels can be matched to the list of steps
  g.beginPath(); g.arc(30, 30, 19, 0, Math.PI * 2); g.fillStyle = step.mine ? green : blue; g.fill();
  g.fillStyle = '#10161b'; g.font = '700 22px "Inter Variable", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(index + 1), 30, 31);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export async function mountPipeline(root: HTMLElement, steps: PipeStep[]) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas.stage-canvas')!;
  const labelEls = Array.from(root.querySelectorAll<HTMLElement>('.pipe-steps > li'));
  const failEl = root.querySelector<HTMLElement>('.pipe-fail');
  const caption = root.querySelector<HTMLElement>('.pipe-caption');
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]); } catch { /* fonts are a nicety */ }

  const stage = createStage(canvas, { fov: 28 });
  const { scene, camera } = stage;
  // Soft, even light: the panels should read as dark glass from every angle
  scene.add(new THREE.HemisphereLight(0xc4d8f0, 0x0c1116, 1.5));
  scene.add(new THREE.DirectionalLight(0xffffff, 0.35).translateX(-3).translateY(5).translateZ(8));
  const world = new THREE.Group(); // tilts with the pointer
  scene.add(world);

  const N = steps.length;
  const failIdx = steps.findIndex((s) => s.failure);
  const glow = glowTexture();

  type Slab = { group: THREE.Group; edge: THREE.LineSegments; body: THREE.Mesh; halo: THREE.Mesh; pos: THREE.Vector3; focus: number };
  let slabs: Slab[] = [];
  let failNode: { group: THREE.Group; pos: THREE.Vector3; pulse: number } | null = null;
  let content: THREE.Group | null = null;
  let portrait = false;
  let dims = { w: 1.7, h: 2.1, gap: 3.05 };
  let laneOffsets: number[][] = [];

  // Main axis runs left to right on wide screens, top to bottom on tall ones
  const along = (i: number) => (i - (N - 1) / 2) * dims.gap;
  const place = (m: number, c: number, z = 0) => (portrait ? new THREE.Vector3(c, -m, z) : new THREE.Vector3(m, c, z));

  function build() {
    if (content) { world.remove(content); content.traverse((o: any) => { o.geometry?.dispose?.(); if (o.material) { o.material.map?.dispose?.(); o.material.dispose?.(); } }); }
    content = new THREE.Group();
    world.add(content);
    portrait = stage.size.aspect < 0.95;
    dims = portrait ? { w: 2.5, h: 1.36, gap: 2.4 } : { w: 1.7, h: 2.1, gap: 3.05 };
    const half = portrait ? dims.h / 2 : dims.w / 2;      // slab half-size along the main axis
    const cross = portrait ? dims.w : dims.h;             // slab size across it
    slabs = [];
    laneOffsets = steps.map((s) => {
      const n = s.lanes?.length ?? 0;
      return n > 1 ? s.lanes!.map((_, k) => ((k - (n - 1) / 2) / (n - 1)) * cross * 0.62) : [0];
    });

    steps.forEach((step, i) => {
      const group = new THREE.Group();
      const pos = place(along(i), 0);
      group.position.copy(pos);
      const body = new THREE.Mesh(
        new RoundedBoxGeometry(dims.w, dims.h, 0.1, 5, 0.1),
        new THREE.MeshStandardMaterial({ color: step.mine ? 0x223a50 : 0x1c2733, roughness: 0.85, metalness: 0, transparent: true, opacity: 0.92, envMapIntensity: 0.04 }),
      );
      group.add(body);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(dims.w * 0.94, dims.h * 0.94), new THREE.MeshBasicMaterial({ map: iconTexture(step, i, portrait), transparent: true, depthWrite: false, toneMapped: false }));
      face.position.z = 0.056;
      group.add(face);
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new RoundedBoxGeometry(dims.w + 0.02, dims.h + 0.02, 0.12, 1, 0.1), 30),
        new THREE.LineBasicMaterial({ color: step.mine ? BRAND.green : BRAND.blue, transparent: true, opacity: step.mine ? 0.9 : 0.35 }),
      );
      group.add(edge);
      // Soft light behind the panel (drawn first, so the panel sits on top of it)
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(dims.w * 2.6, dims.h * 1.9), new THREE.MeshBasicMaterial({ map: glow, color: step.mine ? BRAND.green : BRAND.blue, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false }));
      halo.position.z = -0.2;
      halo.renderOrder = -2;
      group.add(halo);
      content!.add(group);
      slabs.push({ group, edge, body, halo, pos, focus: 0 });
    });

    // Wires between panels (fanning out to lanes where a step has them)
    const wirePts: number[] = [];
    for (let i = 0; i < N - 1; i++) {
      const a = laneOffsets[i], b = laneOffsets[i + 1];
      const pairs = a.length > 1 ? a.map((o) => [o, 0]) : b.map((o) => [0, o]);
      for (const [ca, cb] of pairs) {
        const p0 = place(along(i) + half, ca), p1 = place(along(i + 1) - half, cb);
        const curve = new THREE.CubicBezierCurve3(p0, place(along(i) + half + (dims.gap - 2 * half) * 0.5, ca), place(along(i + 1) - half - (dims.gap - 2 * half) * 0.5, cb), p1);
        const pts = curve.getPoints(16);
        for (let k = 0; k < pts.length - 1; k++) wirePts.push(pts[k].x, pts[k].y, 0, pts[k + 1].x, pts[k + 1].y, 0);
      }
    }
    const wires = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(wirePts, 3)), new THREE.LineBasicMaterial({ color: BRAND.sky, transparent: true, opacity: 0.28 }));
    content.add(wires);

    // Failure notice panel, off to the side of the step that raises it
    failNode = null;
    if (failIdx >= 0) {
      const fw = 1.9, fh = 0.62;
      // Wide screens: hangs below the row (under the labels). Tall screens: sits beside its step.
      const pos = portrait ? place(along(failIdx), dims.w / 2 + 0.4 + fw / 2) : place(along(failIdx), -(dims.h / 2 + 1.55));
      const group = new THREE.Group();
      group.position.copy(pos);
      group.add(new THREE.Mesh(new RoundedBoxGeometry(fw, fh, 0.08, 4, 0.08), new THREE.MeshStandardMaterial({ color: 0x3a2417, roughness: 0.85, metalness: 0, transparent: true, opacity: 0.94, envMapIntensity: 0.04 })));
      group.add(new THREE.LineSegments(new THREE.EdgesGeometry(new RoundedBoxGeometry(fw + 0.02, fh + 0.02, 0.1, 1, 0.08), 30), new THREE.LineBasicMaterial({ color: BRAND.warn, transparent: true, opacity: 0.9 })));
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(fw * 2.4, fh * 4), new THREE.MeshBasicMaterial({ map: glow, color: BRAND.warn, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false }));
      halo.position.z = -0.2; halo.renderOrder = -2;
      group.add(halo);
      content.add(group);
      failNode = { group, pos, pulse: 0 };
    }
    fitCamera();
  }

  function fitCamera() {
    // Bounding box of everything drawn (panels, floating labels, failure notice), then frame it
    let left: number, right: number, top: number, bottom: number;
    if (portrait) {
      const halfMain = ((N - 1) * dims.gap + dims.h) / 2;
      top = halfMain + 0.5; bottom = -halfMain - 0.3;
      left = -dims.w / 2 - 0.3; right = failNode ? dims.w / 2 + 0.4 + 1.9 + 0.25 : dims.w / 2 + 0.3;
    } else {
      const halfMain = ((N - 1) * dims.gap + dims.w) / 2;
      left = -halfMain - 0.9; right = halfMain + 0.6;
      top = dims.h / 2 + 0.6; bottom = failNode ? -(dims.h / 2 + 1.55 + 0.31 + 0.3) : -(dims.h / 2 + 1.2);
    }
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const dist = Math.max((right - left) / (2 * tan * stage.size.aspect), (top - bottom) / (2 * tan)) * 1.04;
    camera.position.set(0, 0, dist);
    if (content) content.position.set(-(left + right) / 2, -(top + bottom) / 2, 0);
  }

  /* ---------- Requests flowing through ---------- */
  const PACKETS = 12, TRAIL = 7, total = PACKETS * TRAIL;
  const pPos = new Float32Array(total * 3), pCol = new Float32Array(total * 3);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const packets = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.34, map: glow, vertexColors: true, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  packets.renderOrder = 5;
  world.add(packets);
  const pk = Array.from({ length: PACKETS }, (_, i) => ({ t: -1 + (i / PACKETS) * (N + 1.2), lane: i % 4, fails: failIdx >= 0 && i % 5 === 2, color: [BRAND.blue, BRAND.green, BRAND.sky][i % 3] }));
  const tmp = new THREE.Vector3(), ZERO = new THREE.Vector3();
  const ease = (x: number) => x * x * (3 - 2 * x);

  // Where a request is at time t: t = i means "at the centre of panel i"
  function packetAt(p: typeof pk[number], t: number, out: THREE.Vector3): number {
    const off = content ? content.position : ZERO;
    const crossAt = (i: number) => { const l = laneOffsets[Math.max(0, Math.min(N - 1, i))]; return l[p.lane % l.length]; };
    if (p.fails && t > failIdx && failNode) {
      const k = Math.min(1, (t - failIdx) / 0.9), e = ease(k);
      const from = place(along(failIdx), crossAt(failIdx));
      out.lerpVectors(from, failNode.pos, e);
      out.z = 0.16; out.x += off.x; out.y += off.y;
      return k >= 1 ? Math.max(0, 1 - (t - failIdx - 0.9) / 0.5) : 1; // linger, then fade
    }
    const i = Math.floor(t), f = ease(Math.min(1, Math.max(0, t - i)));
    const m = along(0) + t * dims.gap;
    const c = t < 0 ? crossAt(0) : t >= N - 1 ? crossAt(N - 1) : crossAt(i) + (crossAt(i + 1) - crossAt(i)) * f;
    out.copy(place(m, c, 0.16));
    out.x += off.x; out.y += off.y;
    return Math.min(1, (t + 1) / 0.6) * Math.min(1, Math.max(0, (N - 1 + 0.25 - t) / 0.35)); // fade in at the start, absorbed at the end
  }

  /* ---------- Focus: hover / tap / keyboard on panels and labels ---------- */
  let active = Math.max(0, steps.findIndex((s) => s.mine));
  let userAt = -1e9;
  function setActive(i: number, byUser = false) {
    active = i;
    if (byUser) userAt = performance.now();
    labelEls.forEach((el, k) => el.classList.toggle('is-active', k === i));
    if (caption) caption.innerHTML = `<strong>${i + 1}. ${steps[i].label}.</strong> ${steps[i].detail}${steps[i].failure ? ' ' + steps[i].failure : ''}`;
  }
  labelEls.forEach((el, i) => {
    el.addEventListener('pointerenter', () => setActive(i, true));
    el.addEventListener('focusin', () => setActive(i, true));
    el.addEventListener('click', () => setActive(i, true));
  });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pick = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(slabs.map((s) => s.body), false)[0];
    return hit ? slabs.findIndex((s) => s.body === hit.object) : -1;
  };
  canvas.addEventListener('pointermove', (e) => { const i = pick(e); canvas.style.cursor = i >= 0 ? 'pointer' : ''; if (i >= 0 && i !== active) setActive(i, true); });
  canvas.addEventListener('pointerdown', (e) => { const i = pick(e); if (i >= 0) setActive(i, true); });

  /* ---------- Layout + frame loop ---------- */
  let lastPortrait: boolean | null = null;
  stage.onResize(() => {
    const p = stage.size.aspect < 0.95;
    if (p !== lastPortrait) { lastPortrait = p; build(); } else fitCamera();
  });
  setActive(active);
  root.classList.toggle('is-portrait', portrait);

  const v = new THREE.Vector3();
  function placeLabel(el: HTMLElement | null, world3: THREE.Vector3, centred = false) {
    if (!el) return;
    v.copy(world3).applyMatrix4(world.matrixWorld).project(camera);
    el.style.transform = `translate(-50%, ${centred ? '-50%' : '0'}) translate(${((v.x + 1) / 2) * stage.size.w}px, ${((1 - v.y) / 2) * stage.size.h}px)`;
  }

  let cycleAt = 0;
  stage.onFrame((t, dt) => {
    root.classList.toggle('is-portrait', portrait);
    // Story mode: step through the panels on its own until the visitor takes over
    if (!stage.reduced && performance.now() - userAt > 9000 && t - cycleAt > 3.4) { cycleAt = t; setActive((active + 1) % N); }

    world.rotation.y = (portrait ? 0 : -0.16) + stage.pointer.x * 0.1;
    world.rotation.x = 0.04 + stage.pointer.y * 0.05;

    const off = content ? content.position : ZERO;
    slabs.forEach((s, i) => {
      const target = i === active ? 1 : 0;
      s.focus += (target - s.focus) * Math.min(1, dt * 7 + (dt === 0 ? 1 : 0));
      s.group.position.z = s.focus * 0.45;
      s.group.position.y = s.pos.y + (stage.reduced ? 0 : Math.sin(t * 0.9 + i * 1.3) * 0.035);
      s.group.scale.setScalar(1 + s.focus * 0.06);
      (s.edge.material as THREE.LineBasicMaterial).opacity = (steps[i].mine ? 0.75 : 0.3) + s.focus * 0.5;
      (s.halo.material as THREE.MeshBasicMaterial).opacity = (steps[i].mine ? 0.16 : 0.05) + s.focus * 0.22;
      // Wide screens: the label floats under its panel. Tall screens: labels are a normal list under the scene.
      if (portrait) { if (labelEls[i]?.style.transform) labelEls[i].style.transform = ''; }
      else placeLabel(labelEls[i], new THREE.Vector3(s.pos.x + off.x, s.pos.y - dims.h / 2 - 0.18 + off.y, 0));
    });
    if (failNode) {
      failNode.pulse = Math.max(0, failNode.pulse - dt * 1.5);
      failNode.group.scale.setScalar(1 + failNode.pulse * 0.08);
      placeLabel(failEl, new THREE.Vector3(failNode.pos.x + off.x, failNode.pos.y + off.y, 0.06), true);
    }

    for (let i = 0; i < PACKETS; i++) {
      const p = pk[i];
      if (!stage.reduced) p.t += dt * 0.42;
      const endT = p.fails ? failIdx + 1.5 : N - 0.6;
      if (p.t > endT) { p.t = -1; p.lane = (p.lane + 1 + Math.floor(Math.random() * 3)) % 4; }
      if (p.fails && failNode && Math.abs(p.t - (failIdx + 0.9)) < 0.03) failNode.pulse = 1;
      const col = C(p.fails && p.t > failIdx ? BRAND.warn : p.color);
      for (let j = 0; j < TRAIL; j++) {
        const a = packetAt(p, p.t - j * 0.035, tmp) * (1 - j / TRAIL) * (j === 0 ? 1 : 0.55);
        const o = (i * TRAIL + j) * 3;
        pPos[o] = tmp.x; pPos[o + 1] = tmp.y; pPos[o + 2] = tmp.z;
        pCol[o] = col.r * a; pCol[o + 1] = col.g * a; pCol[o + 2] = col.b * a;
      }
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;
  });

  return stage;
}
