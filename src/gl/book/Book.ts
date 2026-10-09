import * as THREE from 'three';
import { Leaf } from './Leaf';
import type { PopUpPiece } from './PopUpPiece';
import { buildPageArt, type Images } from './spreads';

/** Scroll steps: 0 closed · 1 spread 1 · 2 spread 2 · 3 dive into the page. */
export const STEPS = 3;
const TURNING_LEAVES = 2;

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

  // camera poses, adjusted to the viewport in resize()
  private readonly closed: CameraPose = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  private readonly open: CameraPose = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  private readonly dive: CameraPose = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  private readonly lookAt = new THREE.Vector3();

  /** 0 → 1 while diving into the last spread; drives the white fade. */
  diveAmount = 0;

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
    this.scene.add(this.book);
  }

  resize(width: number, height: number) {
    this.aspect = width / height;
    this.camera.aspect = this.aspect;
    this.camera.fov = this.aspect < 1 ? 38 : 32;
    this.camera.updateProjectionMatrix();
    // pull back on narrow screens just enough for the open spread (2 units + margin) to fit
    const halfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const fit = Math.max(1, 1.12 / (halfH * this.aspect) / 3.2);

    this.closed.target.set(0.5, 0, 0.02);
    this.closed.pos.set(0.5, 2.25 * fit, 2.3 * fit);
    this.open.target.set(0, 0.08, 0.08);
    this.open.pos.set(0, 2.35 * fit, 2.15 * fit);
    this.dive.target.set(0.5, 0.18, 0.05);
    this.dive.pos.set(0.5, 0.75, 0.9);
  }

  setPointer(nx: number, ny: number) {
    this.pointer.set(nx, ny);
    this.tiltTarget.set(nx, ny);
  }

  /** `p` is the scroll position in steps, 0 … STEPS. */
  update(p: number, dt: number, allowTilt: boolean) {
    // turn the leaves
    const angles: number[] = [];
    for (let i = 0; i < this.leaves.length; i++) {
      // pop-ups fold away first, then the leaf turns
      const turning = i < TURNING_LEAVES ? easeInOut(THREE.MathUtils.clamp((p - i - 0.14) / 0.74, 0, 1)) : 0;
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
    const pos = this.closed.pos.clone().lerp(this.open.pos, openT).lerp(this.dive.pos, easeInOut(diveT));
    this.lookAt.copy(this.closed.target).lerp(this.open.target, openT).lerp(this.dive.target, easeInOut(diveT));
    this.camera.position.copy(pos);
    this.camera.lookAt(this.lookAt);

    // gentle tilt toward the pointer + a slight angle while the book is closed
    const k = 1 - Math.exp(-dt * 4);
    this.tilt.lerp(allowTilt ? this.tiltTarget : new THREE.Vector2(), k);
    this.book.rotation.y = (1 - openT) * -0.14 + this.tilt.x * 0.05;
    this.book.rotation.x = -this.tilt.y * 0.03;
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
