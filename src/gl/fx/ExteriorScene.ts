import * as THREE from 'three';
import { photoCard } from '../textures';
import { clamp01, imageTexture, shadowTexture, smooth, worldPerPixel, type FxView } from './FxStage';

export interface ExteriorImages {
  carFront: HTMLImageElement;
  carSide: HTMLImageElement;
  headlight: HTMLImageElement;
  taillight: HTMLImageElement;
  wheel: HTMLImageElement;
  tailgate: HTMLImageElement;
}

type View = 'front' | 'side';

interface Feature {
  view: View;
  /** hotspot on the cut-out, as fractions of the image (top-left origin) */
  u: number;
  v: number;
  /** 0 front · 1 side · 2 side turned toward the rear */
  pose: number;
  caption: string;
}

// one entry per item in #exterior .features, same order
export const EXTERIOR_FEATURES: Feature[] = [
  { view: 'front', u: 0.5, v: 0.6, pose: 0, caption: 'Ocean-X Face' },
  { view: 'front', u: 0.19, v: 0.37, pose: 0, caption: 'ไฟหน้าแบบ Double-U Floating' },
  { view: 'side', u: 0.915, v: 0.29, pose: 1, caption: 'ไฟท้ายแนวยาว' },
  { view: 'side', u: 0.164, v: 0.737, pose: 1, caption: 'ล้ออัลลอย 20 นิ้ว คาลิปเปอร์เบรกสีแดง' },
  { view: 'side', u: 0.86, v: 0.16, pose: 2, caption: 'ประตูท้ายไฟฟ้าแบบแฮนด์ฟรี' },
];

const CAMERA_Z = 10;
const YAW = THREE.MathUtils.degToRad(25);

/** Crop of the front cut-out around the "X" for the first card. */
function oceanXCrop(front: HTMLImageElement) {
  const c = document.createElement('canvas');
  const sx = front.width * 0.04;
  const sy = front.height * 0.3;
  c.width = Math.round(front.width * 0.92);
  c.height = Math.round(front.height * 0.6);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f5f6fa';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(front, sx, sy, c.width, c.height, 0, 0, c.width, c.height);
  return c;
}

/**
 * Exterior: the section is pinned and scrolling walks through the five
 * features. The car turns front → side → rear (cross-fading cut-outs that
 * swing ±25° about Y), the matching hotspot grows, and a detail card pops up.
 */
export class ExteriorScene implements FxView {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  /** 0…1 through the pinned scroll, set from outside. */
  target = 0;
  /** index of the feature in focus */
  active = 0;
  onActiveChange?: (index: number) => void;

  private readonly car = new THREE.Group();
  private readonly front: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly side: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly cards: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private readonly cardShow: number[] = EXTERIOR_FEATURES.map(() => 0);
  private readonly frontAspect: number;
  private readonly sideAspect: number;
  private readonly maxFrontPx: number;
  private readonly maxSidePx: number;
  private readonly tmp = new THREE.Vector3();

  private width = 1;
  private height = 1;
  private progress = -1;
  private cardBase = new THREE.Vector3();
  private cardWidth = 1;

  constructor(
    readonly el: HTMLElement,
    private readonly hotspots: HTMLElement[],
    images: ExteriorImages,
    renderer: THREE.WebGLRenderer,
    private readonly reducedMotion: boolean,
  ) {
    this.scene.background = new THREE.Color('#f5f6fa');
    this.camera.position.set(0, 0, CAMERA_Z);
    this.frontAspect = images.carFront.width / images.carFront.height;
    this.sideAspect = images.carSide.width / images.carSide.height;
    // low-resolution cut-outs: cap them near their own pixel size
    this.maxFrontPx = images.carFront.width * 1.1;
    this.maxSidePx = images.carSide.width * 1.05;

    const plane = (img: HTMLImageElement) =>
      new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: imageTexture(img, renderer), transparent: true, depthWrite: false }),
      );
    this.front = plane(images.carFront);
    this.side = plane(images.carSide);
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
    );
    this.shadow.renderOrder = 0;
    this.side.renderOrder = 1;
    this.front.renderOrder = 2;
    this.car.add(this.shadow, this.side, this.front);
    this.scene.add(this.car);

    const sources = [oceanXCrop(images.carFront), images.headlight, images.taillight, images.wheel, images.tailgate];
    EXTERIOR_FEATURES.forEach((f, i) => {
      const canvas = photoCard(sources[i], f.caption, 520, 0.62, 0.5);
      const geo = new THREE.PlaneGeometry(1, canvas.height / canvas.width);
      // hinge on the bottom edge, like a pop-up card folding up off the page
      geo.translate(0, canvas.height / canvas.width / 2, 0);
      const card = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({ map: imageTexture(canvas, renderer), transparent: true, depthWrite: false }),
      );
      card.renderOrder = 3;
      card.visible = false;
      this.cards.push(card);
      this.scene.add(card);
    });
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    const wide = width >= 900;
    // the car sits right of the copy on desktop, above it on phones
    const cx = wide ? width * 0.66 : width * 0.5;
    const cy = wide ? height * 0.6 : height * 0.4;
    this.camera.aspect = width / height;
    this.camera.setViewOffset(width, height, width / 2 - cx, height / 2 - cy, width, height);
    this.camera.updateProjectionMatrix();

    const wpp = worldPerPixel(this.camera, CAMERA_Z, height);
    const sidePx = Math.min(wide ? width * 0.5 : width * 0.88, this.maxSidePx, height * 0.62 * this.sideAspect);
    // a front view is about as wide as the car is long × 1925/4830, plus mirrors
    // (on phones the front view is shown closer, or it would be tiny)
    const frontPx = Math.min(wide ? sidePx * 0.46 : width * 0.6, this.maxFrontPx, height * 0.5 * this.frontAspect);
    this.side.scale.set(sidePx * wpp, (sidePx / this.sideAspect) * wpp, 1);
    this.front.scale.set(frontPx * wpp, (frontPx / this.frontAspect) * wpp, 1);
    // stand both on the same ground line
    const tallest = Math.max(this.side.scale.y * 0.93, this.front.scale.y * 0.97);
    const ground = -tallest / 2;
    this.side.position.y = ground + this.side.scale.y * (0.93 - 0.5);
    this.front.position.y = ground + this.front.scale.y * (0.97 - 0.5);
    this.shadow.position.set(0, ground, -0.05);

    // the card stands above the bonnet, clear of the rear hotspots
    this.cardWidth = (wide ? Math.min(width * 0.16, 220) : Math.min(width * 0.34, 150)) * wpp;
    this.cardBase.set(-this.side.scale.x * 0.2, tallest * 0.56, 0.8);
  }

  /** Feature position (0…4, continuous) for a scroll progress. */
  private static featureAt(p: number) {
    return THREE.MathUtils.clamp(p * EXTERIOR_FEATURES.length - 0.5, 0, EXTERIOR_FEATURES.length - 1);
  }

  update(_rect: DOMRect, _viewport: unknown, dt: number) {
    if (this.progress < 0 || this.reducedMotion) this.progress = this.target;
    else this.progress = THREE.MathUtils.damp(this.progress, this.target, 5, dt);

    const f = ExteriorScene.featureAt(this.progress);
    const i = Math.min(Math.floor(f), EXTERIOR_FEATURES.length - 2);
    const t = smooth(0.3, 0.7, f - i);
    const pose = THREE.MathUtils.lerp(EXTERIOR_FEATURES[i].pose, EXTERIOR_FEATURES[i + 1].pose, t);

    const active = Math.min(Math.round(ExteriorScene.featureAt(this.target)), EXTERIOR_FEATURES.length - 1);
    if (active !== this.active) {
      this.active = active;
      this.onActiveChange?.(active);
    }

    // one turn in one direction: front swings away, side swings in, then on toward the rear
    const frontOpacity = 1 - smooth(0.2, 0.55, pose);
    const sideOpacity = smooth(0.45, 0.8, pose);
    this.front.rotation.y = -Math.min(pose, 1) * YAW;
    this.side.rotation.y = (1 - pose) * YAW;
    this.front.material.opacity = frontOpacity;
    this.side.material.opacity = sideOpacity;
    this.front.visible = frontOpacity > 0.001;
    this.side.visible = sideOpacity > 0.001;
    const sideW = this.side.scale.x * Math.cos(this.side.rotation.y);
    const shadowW = THREE.MathUtils.lerp(this.front.scale.x, sideW, sideOpacity) * 1.15;
    this.shadow.scale.set(shadowW, shadowW * 0.12, 1);

    // detail cards fold up for the feature in focus
    this.cards.forEach((card, k) => {
      const show = (this.cardShow[k] = this.reducedMotion
        ? Number(k === active)
        : THREE.MathUtils.damp(this.cardShow[k], Number(k === active), 7, dt));
      card.visible = show > 0.01;
      card.material.opacity = clamp01(show * 1.4);
      card.scale.setScalar(this.cardWidth);
      card.position.set(this.cardBase.x, this.cardBase.y - (1 - show) * this.cardWidth * 0.3, this.cardBase.z);
      card.rotation.set(-(1 - show) * Math.PI * 0.45, 0.16, -0.03);
    });

    this.car.updateMatrixWorld();
    this.camera.updateMatrixWorld();
    EXTERIOR_FEATURES.forEach((feat, k) => {
      const btn = this.hotspots[k];
      if (!btn) return;
      const mesh = feat.view === 'front' ? this.front : this.side;
      const weight = mesh.material.opacity;
      this.tmp.set(feat.u - 0.5, 0.5 - feat.v, 0).applyMatrix4(mesh.matrixWorld).project(this.camera);
      const x = ((this.tmp.x + 1) / 2) * this.width;
      const y = ((1 - this.tmp.y) / 2) * this.height;
      // `translate`, not `transform`: the CSS `scale` on the button would scale a transform offset too
      btn.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      btn.style.opacity = weight.toFixed(3);
      btn.style.visibility = weight > 0.05 ? 'visible' : 'hidden';
      btn.classList.toggle('is-active', k === active);
    });
  }
}
