// Tiny loader with no 3D code in it, so pages can decide whether and when to download a scene.

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

/** Run `mount` the first time `el` comes near the viewport. Marks the element `is-live` on success,
 *  or `no-webgl` (static fallback stays visible) if 3D is not available. */
export function whenNear(el: HTMLElement, mount: () => Promise<unknown> | unknown) {
  if (!hasWebGL()) { el.classList.add('no-webgl'); return; }
  const io = new IntersectionObserver(async (entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    try { await mount(); el.classList.add('is-live'); }
    catch (err) { console.warn('3D scene unavailable', err); el.classList.add('no-webgl'); }
  }, { rootMargin: '300px' });
  io.observe(el);
}
