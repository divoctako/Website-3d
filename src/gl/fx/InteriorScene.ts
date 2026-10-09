import * as THREE from 'three';
import { photoCard } from '../textures';
import { clamp01, imageTexture, smooth, worldPerPixel, type FxView } from './FxStage';

export interface InteriorImages {
  interiorWide: HTMLImageElement;
  interiorHud: HTMLImageElement;
  interiorDash: HTMLImageElement;
  interiorShifter: HTMLImageElement;
  interiorDms: HTMLImageElement;
  interiorAudio: HTMLImageElement;
  interiorRoof: HTMLImageElement;
  interiorBlue: HTMLImageElement;
}

const R = 5; // cylinder radius; the camera sits on its axis
const PANEL_H = 3;
// nearer than any visible part of the cylinder (its sides come closer than R)
const OVERLAY_Z = 3;
export const SHADES = 128;

// the floating cards, captions from the interior feature list
const CARDS: { img: keyof InteriorImages; caption: string; aspect: number; depth: number }[] = [
  { img: 'interiorHud', caption: 'Head-Up Display', aspect: 0.6, depth: 2.2 },
  { img: 'interiorDash', caption: 'หน้าจอมัลติมีเดียขนาด 15.6 นิ้ว', aspect: 0.78, depth: 2.7 },
  { img: 'interiorShifter', caption: 'Crystal Shifter พร้อมที่ชาร์จไร้สาย', aspect: 0.72, depth: 1.9 },
  { img: 'interiorDms', caption: 'Driver Monitoring System', aspect: 0.62, depth: 2.5 },
  { img: 'interiorAudio', caption: 'DYNAUDIO Premium Sound System', aspect: 0.7, depth: 2.1 },
  { img: 'interiorRoof', caption: 'Panoramic Glass Roof', aspect: 0.56, depth: 2.8 },
  { img: 'interiorBlue', caption: 'ภายในห้องโดยสารสีใหม่สีฟ้า', aspect: 0.66, depth: 2.3 },
];

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

// a strip of light that steps through the 128 shades
const stripShader = /* glsl */ `
  uniform float shade;
  uniform float pulse;
  uniform float glow;
  varying vec2 vUv;
  vec3 hsl(float h, float s, float l) {
    vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
  }
  void main() {
    float step = floor(shade + vUv.x * 18.0);
    vec3 col = hsl(mod(step, ${SHADES}.0) / ${SHADES}.0, 0.78, 0.6 + 0.12 * pulse);
    float a;
    if (glow > 0.5) {
      float d = abs(vUv.y * 2.0 - 1.0);
      a = pow(1.0 - d, 2.4) * (0.32 + 0.4 * pulse);
      a *= smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
    } else {
      a = smoothstep(0.0, 0.03, vUv.x) * smoothstep(1.0, 0.97, vUv.x);
    }
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }`;

interface Card {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  depth: number;
  ratio: number; // height / width
  px: THREE.Vector3; // laid-out centre (px) and width
  seed: number;
}

/**
 * Interior: the wide cabin photo wraps round a cylinder segment with the camera
 * inside it; scroll pans across it while a mood-light strip steps through the
 * 128 shades. Later in the scroll, detail cards float up in a masonry wall at
 * different depths.
 */
export class InteriorScene implements FxView {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.1, 30);
  /** 0…1 through the pinned scroll, set from outside. */
  target = 0;
  /** procedural beat (no audio) while true */
  beat = false;
  /** current shade, 0…127 */
  shade = 0;
  onShadeChange?: (shade: number) => void;

  private readonly panel: THREE.Mesh;
  private readonly strip: THREE.Mesh<THREE.CylinderGeometry, THREE.ShaderMaterial>;
  private readonly glow: THREE.Mesh<THREE.CylinderGeometry, THREE.ShaderMaterial>;
  private readonly overlay: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly cards: Card[] = [];
  private readonly arc: number;

  private width = 1;
  private height = 1;
  private yawMax = 0;
  private progress = -1;
  private beatTime = 0;
  private beatShift = 0;
  private lastBeat = -1;
  private settleY = 0;

  constructor(
    readonly el: HTMLElement,
    images: InteriorImages,
    renderer: THREE.WebGLRenderer,
    private readonly reducedMotion: boolean,
  ) {
    this.scene.background = new THREE.Color('#ffffff');
    this.scene.add(this.camera);

    const wide = images.interiorWide;
    this.arc = ((wide.width / wide.height) * PANEL_H) / R;
    const tex = imageTexture(wide, renderer);
    // seen from inside the cylinder the image would be mirrored
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.x = -1;
    tex.offset.x = 1;
    const thetaStart = Math.PI - this.arc / 2;
    this.panel = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R, PANEL_H, 96, 1, true, thetaStart, this.arc),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide }),
    );

    const stripMat = (glow: boolean) =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: stripShader,
        uniforms: { shade: { value: 0 }, pulse: { value: 0 }, glow: { value: glow ? 1 : 0 } },
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      });
    const stripY = -PANEL_H / 2 - 0.2;
    this.strip = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.045, 96, 1, true, thetaStart, this.arc), stripMat(false));
    this.glow = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.42, 96, 1, true, thetaStart, this.arc), stripMat(true));
    this.strip.position.y = stripY;
    this.glow.position.y = stripY;
    this.glow.renderOrder = 1;
    this.strip.renderOrder = 2;
    this.scene.add(this.panel, this.glow, this.strip);

    // a white veil between the panorama and the cards
    this.overlay = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }),
    );
    this.overlay.position.z = -OVERLAY_Z;
    this.overlay.renderOrder = 3;
    this.camera.add(this.overlay);

    CARDS.forEach((c, i) => {
      const canvas = photoCard(images[c.img], c.caption, 520, c.aspect);
      const ratio = canvas.height / canvas.width;
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, ratio),
        new THREE.MeshBasicMaterial({ map: imageTexture(canvas, renderer), transparent: true, depthWrite: false }),
      );
      // nearer cards draw last
      mesh.renderOrder = 10 + Math.round((OVERLAY_Z - c.depth) * 10);
      mesh.visible = false;
      this.camera.add(mesh);
      this.cards.push({ mesh, depth: c.depth, ratio, px: new THREE.Vector3(), seed: i * 1.7 });
    });
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    // the panel (plus the light strip under it) fills most of the height
    const fill = width < 768 ? 0.6 : 0.74;
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan((PANEL_H + 0.5) / fill / 2 / R));
    this.camera.updateProjectionMatrix();
    const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2) * this.camera.aspect);
    this.yawMax = Math.max((this.arc - hfov) / 2, 0.07);

    const wppOverlay = worldPerPixel(this.camera, OVERLAY_Z, height);
    this.overlay.scale.set(width * wppOverlay * 1.05, height * wppOverlay * 1.05, 1);

    this.layoutCards();
  }

  /** Masonry: each card drops into the shortest column. Positions in px. */
  private layoutCards() {
    const { width: w, height: h } = this;
    const cols = w >= 1100 ? 4 : w >= 640 ? 3 : 2;
    const gap = w >= 640 ? 22 : 12;
    let areaW = Math.min(w - 32, 1120);
    let colW = (areaW - gap * (cols - 1)) / cols;
    const measure = (cw: number) => {
      const heights = new Array(cols).fill(0);
      for (const c of this.cards) {
        const k = heights.indexOf(Math.min(...heights));
        heights[k] += cw * c.ratio + gap;
      }
      return Math.max(...heights) - gap;
    };
    // shrink until the wall fits under the nav bar
    const room = h - 64 - 48;
    let total = measure(colW);
    if (total > room) {
      colW *= room / total;
      areaW = colW * cols + gap * (cols - 1);
      total = measure(colW);
    }
    const left = (w - areaW) / 2;
    const top = 64 + (h - 64 - total) / 2;
    const heights = new Array(cols).fill(0);
    for (const c of this.cards) {
      const k = heights.indexOf(Math.min(...heights));
      const ch = colW * c.ratio;
      c.px.set(left + k * (colW + gap) + colW / 2, top + heights[k] + ch / 2, colW);
      heights[k] += ch + gap;
    }
    this.settleY = 0;
  }

  update(_rect: DOMRect, _viewport: unknown, dt: number, time: number) {
    if (this.progress < 0 || this.reducedMotion) this.progress = this.target;
    else this.progress = THREE.MathUtils.damp(this.progress, this.target, 5, dt);
    const p = this.progress;

    // pan across the cabin (left → right)
    const pan = smooth(0, 0.6, p);
    this.camera.rotation.y = THREE.MathUtils.lerp(this.yawMax, -this.yawMax, pan);

    // 128 shades along the scroll; with the beat on, every beat steps a few more
    let pulse = 0;
    if (this.beat && !this.reducedMotion) {
      this.beatTime += dt;
      const beats = (this.beatTime * 116) / 60;
      const n = Math.floor(beats);
      if (n !== this.lastBeat) {
        this.lastBeat = n;
        this.beatShift += 5;
      }
      pulse = Math.exp(-(beats - n) * 5);
    }
    const shade = Math.floor(clamp01(p) * (SHADES - 1) + this.beatShift) % SHADES;
    if (shade !== this.shade) {
      this.shade = shade;
      this.onShadeChange?.(shade);
    }
    for (const m of [this.strip, this.glow]) {
      m.material.uniforms.shade.value = shade;
      m.material.uniforms.pulse.value = pulse;
    }
    this.glow.scale.y = 1 + pulse * 0.5;

    // cards float up through the second half
    const t = smooth(0.45, 0.95, p);
    this.overlay.material.opacity = 0.62 * smooth(0.4, 0.7, p);
    this.overlay.visible = this.overlay.material.opacity > 0.001;
    for (const c of this.cards) {
      const lag = (OVERLAY_Z - c.depth) * 0.5; // nearer cards travel further, so they move faster
      const rise = (1 - t) * this.height * (1.05 + lag);
      const bob = this.reducedMotion ? 0 : Math.sin(time * 0.9 + c.seed) * 4;
      const wpp = worldPerPixel(this.camera, c.depth, this.height);
      const x = c.px.x;
      const y = c.px.y + rise + bob + this.settleY;
      c.mesh.visible = t > 0.001 && y - c.px.z * c.ratio < this.height + 40;
      c.mesh.position.set((x - this.width / 2) * wpp, (this.height / 2 - y) * wpp, -c.depth);
      c.mesh.scale.setScalar(c.px.z * wpp);
      c.mesh.rotation.set((1 - t) * 0.5, 0, (1 - t) * (c.seed % 2 > 1 ? 0.12 : -0.12));
      c.mesh.material.opacity = smooth(0, 0.35, t);
    }
  }
}
