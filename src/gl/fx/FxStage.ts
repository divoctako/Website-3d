import * as THREE from 'three';

/**
 * One section scene drawn into the fixed fx canvas. `el` is the box on the page
 * the scene fills; the canvas only draws inside that box (scissor), so the
 * section's HTML text can sit on top of it.
 */
export interface FxView {
  readonly el: HTMLElement;
  readonly scene: THREE.Scene;
  readonly camera: THREE.Camera;
  /** Called when the box changes size (CSS px). */
  resize(width: number, height: number): void;
  /** `rect` is the box in viewport px; `dt` in seconds. */
  update(rect: DOMRect, viewport: { width: number; height: number }, dt: number, time: number): void;
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

/** World units per CSS px at `distance` in front of a perspective camera. */
export function worldPerPixel(camera: THREE.PerspectiveCamera, distance: number, heightPx: number) {
  return (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / heightPx;
}

export function imageTexture(img: HTMLImageElement | HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const tex = img instanceof HTMLCanvasElement ? new THREE.CanvasTexture(img) : new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  tex.needsUpdate = true;
  return tex;
}

/** Soft elliptical shadow, used under the car cut-outs. */
export function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 32, 0, 128, 32, 128);
  g.addColorStop(0, 'rgba(14,19,48,0.5)');
  g.addColorStop(0.45, 'rgba(14,19,48,0.18)');
  g.addColorStop(1, 'rgba(14,19,48,0)');
  ctx.setTransform(1, 0, 0, 0.25, 0, 24);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * The second three.js canvas: `position: fixed` behind the page content.
 * Sections that have a scene keep a transparent background, so the scene shows
 * through; everything else on the page covers the canvas.
 */
export class FxStage {
  readonly renderer: THREE.WebGLRenderer;
  private readonly views: FxView[] = [];
  private readonly sizes = new Map<FxView, { w: number; h: number }>();
  private width = 0;
  private height = 0;
  private dpr = Math.min(window.devicePixelRatio, 2);
  private dirty = true;
  private slowFor = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setClearColor(0x000000, 0);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  add(view: FxView) {
    this.views.push(view);
  }

  private resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(this.width, this.height, false);
    this.dirty = true;
  }

  /** Renders every view whose box is on screen. Returns how many were drawn. */
  render(dt: number, time: number) {
    // a phone's URL bar changes innerHeight without always firing resize
    if (window.innerWidth !== this.width || window.innerHeight !== this.height) this.resize();

    const viewport = { width: this.width, height: this.height };
    const visible: [FxView, DOMRect][] = [];
    for (const view of this.views) {
      const rect = view.el.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < this.height && rect.width > 0) visible.push([view, rect]);
    }
    if (!visible.length) {
      if (this.dirty) {
        this.renderer.setScissorTest(false);
        this.renderer.clear();
        this.dirty = false;
      }
      this.slowFor = 0;
      return 0;
    }

    const r = this.renderer;
    r.setScissorTest(false);
    r.clear();
    r.setScissorTest(true);
    for (const [view, rect] of visible) {
      const size = this.sizes.get(view);
      if (!size || size.w !== rect.width || size.h !== rect.height) {
        this.sizes.set(view, { w: rect.width, h: rect.height });
        view.resize(rect.width, rect.height);
      }
      view.update(rect, viewport, dt, time);
      // three.js measures the viewport from the bottom-left corner
      const y = this.height - rect.bottom;
      r.setViewport(rect.left, y, rect.width, rect.height);
      // only the on-screen part: some drivers clamp a negative scissor origin to 0
      // and keep the height, which would paint over the whole canvas
      const top = Math.max(rect.top, 0);
      const bottom = Math.min(rect.bottom, this.height);
      r.setScissor(Math.max(rect.left, 0), this.height - bottom, Math.min(rect.width, this.width), bottom - top);
      r.render(view.scene, view.camera);
    }
    this.dirty = true;

    // drop resolution if frames are slow for a while
    this.slowFor = dt > 1 / 45 ? this.slowFor + dt : 0;
    if (this.slowFor > 2 && this.dpr > 1) {
      this.dpr = Math.max(1, this.dpr - 0.5);
      this.slowFor = 0;
      this.resize();
    }
    return visible.length;
  }
}
