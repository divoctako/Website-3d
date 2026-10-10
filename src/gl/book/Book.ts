import * as THREE from 'three';
import { Leaf, PAGE_H } from './Leaf';
import { COLORS, FONT_BODY, FONT_DISPLAY, makeCanvas, roundRect } from '../textures';
import type { PopUpPiece } from './PopUpPiece';
import { buildPageArt, type Images } from './spreads';

/** Spreads in the book: performance, exterior, interior, ADAS, specs, colours. */
export const SPREADS = 6;
/** Scroll steps: 0 closed · 1…SPREADS one per spread · last: dive into the page. */
export const STEPS = SPREADS + 1;
/** On narrow screens each spread takes two steps: its left page, then its right page. */
export const PAGE_STEPS = SPREADS * 2 + 1;

/**
 * Book state for a scroll position `q` in steps. In page mode the camera looks
 * at one page at a time (`focus` −1 left … +1 right) and pans across the turn.
 */
export function bookState(q: number, pageMode: boolean) {
  if (!pageMode) return { p: q, focus: 0 };
  if (q <= 1) return { p: q, focus: -1 };
  if (q >= SPREADS * 2) return { p: SPREADS + (q - SPREADS * 2), focus: 1 };
  const k = q - 1;
  const s = 1 + Math.floor(k / 2);
  const f = k - (s - 1) * 2;
  if (f < 1) return { p: s, focus: THREE.MathUtils.lerp(-1, 1, smoothT(f)) };
  return { p: s + (f - 1), focus: THREE.MathUtils.lerp(1, -1, smoothT(f - 1)) };
}

/** Scroll step that shows spread `spread` (0 = cover). */
export function stepForSpread(spread: number, pageMode: boolean) {
  return pageMode ? Math.max(0, spread * 2 - 1) : spread;
}

const smoothT = (t: number) => t * t * (3 - 2 * t);

/** Labels of the index tabs, one per leaf (cover + six spreads). */
export const TAB_LABELS = ['ปก', 'Performance', 'Exterior', 'Interior', 'ADAS', 'Specs', 'Colors'];
const TAB_W = 0.2; // how far a tab sticks out past the page edge
const TAB_H = 0.15;
const TAB_GAP = 0.19;

/** Tab label art; the paper overlaps the page so the tab looks glued on. */
function tabCanvas(i: number, active: boolean) {
  const { canvas, ctx } = makeCanvas(420, 300);
  roundRect(ctx, -40, 6, 450, 288, 34);
  ctx.fillStyle = active ? COLORS.navy : COLORS.paper;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = active ? COLORS.navy : COLORS.line;
  ctx.stroke();
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = active ? '#c9c5f0' : COLORS.accent;
  ctx.font = `400 84px ${FONT_DISPLAY}`;
  ctx.fillText(String(i).padStart(2, '0'), 44, 136);
  ctx.fillStyle = active ? '#ffffff' : COLORS.text;
  ctx.font = `500 52px ${FONT_BODY}`;
  ctx.fillText(TAB_LABELS[i], 44, 228, 350);
  return canvas;
}

const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface CameraPose {
  pos: THREE.Vector3;
  target: THREE.Vector3;
}

export class Book {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
  readonly book = new THREE.Group();
  private readonly leaves: Leaf[] = [];
  private readonly pieces: PopUpPiece[] = [];
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly tilt = new THREE.Vector2();
  private readonly tiltTarget = new THREE.Vector2();
  private aspect = 1;
  /** One page at a time (narrow, portrait screens). */
  pageMode = false;
  private pageFit = 1;

  // camera poses, adjusted to the viewport in resize()
  private readonly closed: CameraPose = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  private readonly open: CameraPose = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  private readonly dive: CameraPose = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  private readonly lookAt = new THREE.Vector3();

  /** 0 → 1 while diving into the last spread; drives the white fade. */
  diveAmount = 0;
  private readonly tabs: { group: THREE.Group; materials: THREE.MeshStandardMaterial[]; maps: [THREE.Texture, THREE.Texture] }[] = [];
  private activeTab = -1;

  constructor(images: Images, renderer: THREE.WebGLRenderer) {
    this.scene.background = null;

    const hemi = new THREE.HemisphereLight(0xffffff, 0xdfe1ea, 2.1);
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-1.6, 3.4, 2.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -1.8;
    sun.shadow.camera.right = 1.8;
    sun.shadow.camera.top = 1.6;
    sun.shadow.camera.bottom = -1.6;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 8;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.01;
    sun.shadow.radius = 6;
    this.scene.add(hemi, sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.ShadowMaterial({ color: 0x0e1330, opacity: 0.12 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.004;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const art = buildPageArt(images, renderer);
    art.pages.forEach((p, i) => {
      const leaf = new Leaf(i, art.pages.length, p.front, p.back);
      this.leaves.push(leaf);
      this.book.add(leaf.group);
    });
    for (const { leaf, side, x, piece } of art.pieces) {
      this.leaves[leaf].attach(piece, side, x);
      this.pieces.push(piece);
    }

    // index tabs on the free edge of each leaf: they sit on the right of the
    // pages still to come and move to the left once their leaf has turned
    this.leaves.forEach((leaf, i) => {
      if (i >= TAB_LABELS.length) return;
      const tex = (c: HTMLCanvasElement) => {
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return t;
      };
      const maps: [THREE.Texture, THREE.Texture] = [tex(tabCanvas(i, false)), tex(tabCanvas(i, true))];
      const geo = new THREE.PlaneGeometry(TAB_W, TAB_H);
      geo.rotateX(-Math.PI / 2);
      geo.translate(TAB_W / 2, 0, 0);
      // the back reads correctly once the leaf has turned over
      const backGeo = geo.clone();
      const uv = backGeo.getAttribute('uv') as THREE.BufferAttribute;
      for (let k = 0; k < uv.count; k++) uv.setX(k, 1 - uv.getX(k));
      const front = new THREE.MeshStandardMaterial({ map: maps[0], roughness: 0.9, side: THREE.FrontSide });
      const back = new THREE.MeshStandardMaterial({ map: maps[0], roughness: 0.9, side: THREE.BackSide });
      const group = new THREE.Group();
      const fm = new THREE.Mesh(geo, front);
      const bm = new THREE.Mesh(backGeo, back);
      fm.userData.tab = i;
      bm.userData.tab = i;
      group.add(fm, bm);
      group.position.z = -PAGE_H / 2 + 0.13 + i * TAB_GAP;
      group.renderOrder = 1;
      leaf.attachToEdge(group);
      this.tabs.push({ group, materials: [front, back], maps });
    });
    this.scene.add(this.book);
  }

  resize(width: number, height: number) {
    this.aspect = width / height;
    this.camera.aspect = this.aspect;
    this.camera.fov = this.aspect < 1 ? 38 : 32;
    this.camera.updateProjectionMatrix();
    // pull back on narrow screens just enough for the open spread (2 units + margin) to fit
    const halfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    // the open spread plus the index tabs sticking out on both sides
    const fit = Math.max(1, (1.12 + TAB_W) / (halfH * this.aspect) / 3.2);
    // page mode: frame a single page (1 unit + margin) instead of the spread
    this.pageMode = this.aspect < 0.8;
    this.pageFit = Math.max(0.62, 0.6 / (halfH * this.aspect) / 3.2);
    // in page mode the tabs would be off screen; the HTML tab strip takes over
    for (const t of this.tabs) t.group.visible = !this.pageMode;

    const closedFit = this.pageMode ? this.pageFit : fit;
    this.closed.target.set(0.5, 0, 0.02);
    this.closed.pos.set(0.5, 2.25 * closedFit, 2.3 * closedFit);
    this.open.target.set(0, 0.08, 0.08);
    this.open.pos.set(0, 2.35 * fit, 2.15 * fit);
    this.dive.target.set(0.5, 0.18, 0.05);
    this.dive.pos.set(0.5, 0.75, 0.9);
  }

  setPointer(nx: number, ny: number) {
    this.pointer.set(nx, ny);
    this.tiltTarget.set(nx, ny);
  }

  /** `p` is the book position in steps, 0 … STEPS; `focus` picks the page in page mode. */
  update(p: number, dt: number, allowTilt: boolean, focus = 0) {
    // turn the leaves
    const angles: number[] = [];
    for (let i = 0; i < this.leaves.length; i++) {
      // pop-ups fold away first, then the leaf turns
      const turning = i < this.leaves.length - 1 ? easeInOut(THREE.MathUtils.clamp((p - i - 0.14) / 0.74, 0, 1)) : 0;
      angles.push(turning * Math.PI);
    }

    // a spread's pop-ups stand up once its pages lie open, and fold away
    // before the next leaf lifts; capped by the opening angle so nothing
    // stands on a page that is still moving
    const rises: number[] = [0];
    for (let s = 1; s < this.leaves.length; s++) {
      const opening = angles[s - 1] - angles[s];
      const last = s === this.leaves.length - 1; // the last spread stays up for the dive
      const timeline = Math.min(smooth(s - 0.3, s - 0.02, p), last ? 1 : 1 - smooth(s + 0.02, s + 0.2, p));
      rises.push(Math.min(timeline, smooth(0.75 * Math.PI, 0.99 * Math.PI, opening)));
    }
    this.leaves.forEach((leaf, i) => {
      for (const { piece, side } of leaf.pieces) {
        // front of leaf i belongs to spread i, its back to spread i + 1
        piece.setRise(rises[side === 'front' ? i : i + 1] ?? 0);
      }
      leaf.update(angles[i]);
    });

    // camera: closed → open → dive
    const openT = smooth(0, 1, p);
    const diveT = smooth(STEPS - 1, STEPS, p);
    this.diveAmount = smooth(STEPS - 0.35, STEPS, p);
    let open = this.open;
    if (this.pageMode) {
      const x = focus * 0.5;
      open = {
        pos: new THREE.Vector3(x, 2.35 * this.pageFit, 2.15 * this.pageFit),
        target: new THREE.Vector3(x, 0.08, 0.08),
      };
    }
    const pos = this.closed.pos.clone().lerp(open.pos, openT).lerp(this.dive.pos, easeInOut(diveT));
    this.lookAt.copy(this.closed.target).lerp(open.target, openT).lerp(this.dive.target, easeInOut(diveT));
    this.camera.position.copy(pos);
    this.camera.lookAt(this.lookAt);

    // gentle tilt toward the pointer + a slight angle while the book is closed
    const k = 1 - Math.exp(-dt * 4);
    this.tilt.lerp(allowTilt ? this.tiltTarget : new THREE.Vector2(), k);
    this.book.rotation.y = (1 - openT) * -0.14 + this.tilt.x * 0.05;
    this.book.rotation.x = -this.tilt.y * 0.03;
  }

  /** Highlights the index tab of the spread in view. */
  setActiveTab(i: number) {
    if (i === this.activeTab) return;
    this.activeTab = i;
    this.tabs.forEach((t, k) => {
      for (const m of t.materials) m.map = t.maps[k === i ? 1 : 0];
    });
  }

  /** Index of the tab under the pointer, or −1. */
  hitTab(): number {
    if (this.pageMode) return -1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.tabs.map((t) => t.group), true)[0];
    return hit ? (hit.object.userData.tab as number) : -1;
  }

  /** The piece under the pointer, if it belongs to a spread that is open. */
  hitTest(): PopUpPiece | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const visible = this.pieces.filter((p) => p.mesh.visible).map((p) => p.mesh);
    for (const hit of this.raycaster.intersectObjects(visible, false)) {
      const piece = hit.object.userData.piece as PopUpPiece;
      // ignore transparent parts of cut-outs
      const tex = (hit.object as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>).material.map;
      if (hit.uv && tex && !opaqueAt(tex, hit.uv)) continue;
      if (piece.hinge.rotation.x > -0.5) return piece;
    }
    return null;
  }
}

const alphaCache = new WeakMap<THREE.Texture, { data: Uint8ClampedArray; w: number; h: number }>();

function opaqueAt(tex: THREE.Texture, uv: THREE.Vector2) {
  let entry = alphaCache.get(tex);
  if (!entry) {
    const src = tex.image as HTMLCanvasElement;
    const ctx = src.getContext('2d', { willReadFrequently: true });
    if (!ctx) return true;
    entry = { data: ctx.getImageData(0, 0, src.width, src.height).data, w: src.width, h: src.height };
    alphaCache.set(tex, entry);
  }
  const x = Math.min(entry.w - 1, Math.floor(uv.x * entry.w));
  const y = Math.min(entry.h - 1, Math.floor((1 - uv.y) * entry.h));
  return entry.data[(y * entry.w + x) * 4 + 3] > 128;
}
