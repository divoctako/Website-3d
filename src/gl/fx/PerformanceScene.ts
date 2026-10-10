import * as THREE from 'three';
import { clamp01, easeOutCubic, imageTexture, shadowTexture, worldPerPixel, type FxView } from './FxStage';

export interface PerformanceImages {
  carSide: HTMLImageElement;
  skyMist: HTMLImageElement;
  speedLines: HTMLImageElement;
}

// measured on car-side.webp (fractions of the image width / height)
const WHEELS = [0.164, 0.79];
const WHEEL_Y = 0.737;
const WHEEL_R = 0.192; // of the image height, a little inside the tyre edge
const GROUND_Y = 0.93;

const CAMERA_Z = 10;
const SPEED_Z = -2.5;
const BG_Z = -12;

const wheelShader = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D map;
    uniform vec2 center;
    uniform vec2 radius;
    uniform float angle;
    varying vec2 vUv;
    void main() {
      vec2 p = vUv * 2.0 - 1.0;
      float d = length(p);
      if (d > 1.0) discard;
      float c = cos(angle), s = sin(angle);
      vec2 q = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
      vec4 col = texture2D(map, center + q * radius);
      col.a *= 1.0 - smoothstep(0.94, 1.0, d);
      gl_FragColor = col;
      #include <colorspace_fragment>
    }`,
};

// the light streaks in the top of speed-lines.webp, stretched and mirrored so they tile
const speedShader = {
  vertexShader: wheelShader.vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D map;
    uniform float offset;
    uniform float opacity;
    varying vec2 vUv;
    void main() {
      float m = abs(fract((vUv.x * 0.9 + offset) * 0.5) * 2.0 - 1.0);
      vec2 uv = vec2(0.42 + 0.58 * m, mix(0.6, 0.86, vUv.y));
      vec4 col = texture2D(map, uv);
      float lum = dot(col.rgb, vec3(0.3, 0.59, 0.11));
      float a = smoothstep(0.35, 0.85, lum);
      a *= smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
      a *= smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
      gl_FragColor = vec4(col.rgb * 1.15, a * opacity);
      #include <colorspace_fragment>
    }`,
};

/**
 * Performance: the side-view cut-out drives in from the right and stops in the
 * middle, over three parallax layers (misty sky · car · speed streaks).
 */
export class PerformanceScene implements FxView {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  private readonly bg: THREE.Mesh;
  private readonly speed: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly car = new THREE.Group();
  private readonly body: THREE.Mesh;
  private readonly wheels: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  private readonly shadow: THREE.Mesh;
  private readonly carAspect: number;
  private readonly bgAspect: number;
  private readonly maxCarPx: number;

  private visW = 1;
  private visH = 1;
  private carW = 1;
  private progress = -1;
  private lastX = NaN;
  private wheelAngle = 0;
  private speedOffset = 0;
  private speedAmount = 0;

  constructor(
    readonly el: HTMLElement,
    images: PerformanceImages,
    renderer: THREE.WebGLRenderer,
    private readonly reducedMotion: boolean,
  ) {
    this.camera.position.set(0, 0, CAMERA_Z);
    const { carSide, skyMist, speedLines } = images;
    this.carAspect = carSide.width / carSide.height;
    this.bgAspect = skyMist.width / skyMist.height;
    // the cut-out is low resolution: never draw it much bigger than it is
    this.maxCarPx = carSide.width * 1.05;

    const bgTex = imageTexture(skyMist, renderer);
    this.bg = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: bgTex, depthWrite: false }));
    this.bg.position.z = BG_Z;

    const speedTex = imageTexture(speedLines, renderer);
    this.speed = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        ...speedShader,
        uniforms: { map: { value: speedTex }, offset: { value: 0 }, opacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
      }),
    );
    this.speed.position.z = SPEED_Z;

    const carTex = imageTexture(carSide, renderer);
    this.body = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: carTex, transparent: true, depthWrite: false }),
    );
    this.car.add(this.body);
    for (const u of WHEELS) {
      const wheel = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.ShaderMaterial({
          ...wheelShader,
          uniforms: {
            map: { value: carTex },
            center: { value: new THREE.Vector2(u, 1 - WHEEL_Y) },
            radius: { value: new THREE.Vector2((WHEEL_R / this.carAspect) * 1, WHEEL_R) },
            angle: { value: 0 },
          },
          transparent: true,
          depthWrite: false,
        }),
      );
      wheel.userData.u = u;
      this.wheels.push(wheel);
      this.car.add(wheel);
    }
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
    );
    this.car.add(this.shadow);

    this.shadow.renderOrder = 1;
    this.body.renderOrder = 2;
    this.wheels.forEach((w) => (w.renderOrder = 3));
    this.scene.add(this.bg, this.speed, this.car);
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.visH = worldPerPixel(this.camera, CAMERA_Z, height) * height;
    this.visW = this.visH * this.camera.aspect;
    const wpp = this.visH / height;

    // background covers the box at its depth, with room for the camera pan
    const bgScale = (CAMERA_Z - BG_Z) / CAMERA_Z;
    let bw = this.visW * bgScale * 1.12;
    let bh = bw / this.bgAspect;
    if (bh < this.visH * bgScale * 1.06) {
      bh = this.visH * bgScale * 1.06;
      bw = bh * this.bgAspect;
    }
    this.bg.scale.set(bw, bh, 1);
    // keep the horizon a little above the car's roof line
    this.bg.position.y = -bh * 0.02;

    const speedScale = (CAMERA_Z - SPEED_Z) / CAMERA_Z;
    this.speed.scale.set(this.visW * speedScale * 1.3, this.visH * speedScale * 0.42, 1);
    this.speed.position.y = this.visH * speedScale * 0.08;

    const narrow = width < 768;
    this.carW = Math.min(this.visW * (narrow ? 0.9 : 0.62), this.maxCarPx * wpp);
    const carH = this.carW / this.carAspect;
    this.body.scale.set(this.carW, carH, 1);
    const groundY = -this.visH / 2 + this.visH * (narrow ? 0.2 : 0.16);
    this.body.position.y = groundY + carH * (GROUND_Y - 0.5);
    for (const w of this.wheels) {
      const d = WHEEL_R * 2 * carH;
      w.scale.set(d, d, 1);
      w.position.set((w.userData.u - 0.5) * this.carW, this.body.position.y + (0.5 - WHEEL_Y) * carH, 0.001);
    }
    this.shadow.scale.set(this.carW * 1.12, carH * 0.32, 1);
    this.shadow.position.set(0, groundY, -0.001);
    this.lastX = NaN;
  }

  update(rect: DOMRect, viewport: { width: number; height: number }, dt: number) {
    // 0 when the box enters at the bottom, 1 when it is centred, 2 when it leaves at the top
    const vh = viewport.height;
    const target = (vh - rect.top) / ((vh + rect.height) / 2);
    // reduced motion: the car simply stands in the middle
    if (this.reducedMotion) this.progress = 1;
    else if (this.progress < 0) this.progress = target;
    else this.progress = THREE.MathUtils.damp(this.progress, target, 6, dt);
    const p = this.progress;
    const e = easeOutCubic(p);

    const enter = this.visW / 2 + this.carW / 2 + 0.4;
    const x = (1 - e) * enter - Math.max(0, p - 1) * this.carW * 0.18;
    this.car.position.x = x;
    // the camera pans with the car a little, so the layers slide at different speeds
    this.camera.position.x = (1 - e) * this.visW * 0.18 - Math.max(0, p - 1) * this.visW * 0.04;

    const dx = Number.isNaN(this.lastX) ? 0 : x - this.lastX;
    this.lastX = x;
    const r = WHEEL_R * (this.carW / this.carAspect);
    this.wheelAngle += dx / r;
    for (const w of this.wheels) w.material.uniforms.angle.value = this.wheelAngle;

    const speed = dt > 0 ? clamp01(Math.abs(dx) / dt / this.visW) : 0;
    this.speedAmount = THREE.MathUtils.damp(this.speedAmount, speed, 4, dt);
    this.speedOffset += dx * 0.12 - dt * 0.015;
    const u = this.speed.material.uniforms;
    u.offset.value = this.speedOffset;
    u.opacity.value = 0.35 + 0.65 * this.speedAmount;
  }
}
