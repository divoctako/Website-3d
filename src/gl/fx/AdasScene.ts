import * as THREE from 'three';
import { clamp01, imageTexture, smooth, type FxView } from './FxStage';

export interface AdasImages {
  carRear34: HTMLImageElement;
  leadCar: HTMLImageElement;
}

/* World units are metres. Our car sits at the origin heading -Z. */
const LANE = 3.6;
const BG = new THREE.Color('#f3f4f8');
const BLUE = new THREE.Color('#5aa9ff');
const AMBER = new THREE.Color('#ffaa33');
const RED = new THREE.Color('#ff5a4f');
const BEAM = new THREE.Color('#ffd25e');

/** A number as a GLSL float literal (GLSL ES has no int → float conversion). */
const f = (n: number) => n.toFixed(3);

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

// light road with lane lines; dashes move with `offset`, the lines of our lane can glow
const roadShader = /* glsl */ `
  uniform vec2 size;
  uniform float offset;
  uniform float laneGlow;
  uniform vec3 bg;
  uniform vec3 glow;
  varying vec2 vUv;
  float line(float x, float at, float w) {
    return 1.0 - smoothstep(w * 0.5, w * 0.5 + 0.03, abs(x - at));
  }
  void main() {
    vec2 p = (vUv - 0.5) * size;               // p.x across, p.y forward (metres)
    vec3 road = vec3(0.64, 0.66, 0.71); // linear (≈ #d2d5dc on screen)
    float dash = step(0.62, fract((p.y + offset) / 9.0));
    float inner = (line(p.x, ${f(LANE / 2)}, 0.15) + line(p.x, -${f(LANE / 2)}, 0.15));
    float outer = (line(p.x, ${f(LANE * 1.5)}, 0.15) + line(p.x, -${f(LANE * 1.5)}, 0.15)) * dash;
    float edge = line(p.x, ${f(LANE * 2.5)}, 0.2) + line(p.x, -${f(LANE * 2.5)}, 0.2);
    vec3 col = road;
    col = mix(col, vec3(1.0), clamp((inner * dash + outer + edge), 0.0, 1.0) * 0.95);
    // our lane's lines light up for lane assist
    float glowLine = (line(p.x, ${f(LANE / 2)}, 0.5) + line(p.x, -${f(LANE / 2)}, 0.5));
    col = mix(col, glow, clamp(glowLine, 0.0, 1.0) * laneGlow);
    // fade into the background far ahead, behind the camera and at the sides
    // p.y runs from behind the camera (-) to far ahead (+): short fade behind, long fade ahead
    float fade = smoothstep(-size.y * 0.5, -size.y * 0.5 + 8.0, p.y) * smoothstep(size.y * 0.5, size.y * 0.5 - 50.0, p.y);
    fade *= 1.0 - smoothstep(${f(LANE * 2.5)}, ${f(LANE * 2.5 + 3)}, abs(p.x));
    gl_FragColor = vec4(mix(bg, col, fade), 1.0);
    #include <colorspace_fragment>
  }`;

// one sensor zone drawn on the ground: a sector, rings, or a box
const zoneShader = /* glsl */ `
  uniform vec2 size;
  uniform int mode;                 // 0 sector · 1 rings · 2 box
  uniform vec2 origin;
  uniform vec4 shape;               // sector: angle, half-angle, radius · rings: r0, r1 · box: half x, half y
  uniform vec3 color;
  uniform float alpha;
  uniform float time;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * size - origin;
    float a = 0.0;
    if (mode == 0) {
      float d = length(p);
      float ang = atan(p.x, p.y) - shape.x;
      ang = atan(sin(ang), cos(ang));
      float inside = (1.0 - smoothstep(shape.y - 0.04, shape.y, abs(ang))) * (1.0 - smoothstep(shape.z - 0.6, shape.z, d));
      float wave = 0.55 + 0.45 * sin(d * 1.4 - time * 6.0);
      a = inside * (1.0 - d / shape.z * 0.75) * (0.55 + 0.45 * wave);
    } else if (mode == 1) {
      float d = length(p);
      float t = fract(time * 0.6);
      float r = mix(shape.x, shape.y, t);
      a = (1.0 - smoothstep(0.0, 0.35, abs(d - r))) * (1.0 - t);
      a += (1.0 - smoothstep(0.0, 0.12, abs(d - shape.x))) * 0.8;
      a += (1.0 - smoothstep(shape.x, shape.y, d)) * step(shape.x, d) * 0.25;
    } else {
      vec2 q = abs(p) - shape.xy;
      float inside = 1.0 - smoothstep(-0.05, 0.05, max(q.x, q.y));
      float border = 1.0 - smoothstep(0.0, 0.12, abs(max(q.x, q.y)));
      a = inside * (0.35 + 0.15 * sin(time * 5.0)) + border * 0.9;
    }
    gl_FragColor = vec4(color, clamp(a, 0.0, 1.0) * alpha);
    #include <colorspace_fragment>
  }`;

interface ZoneDef {
  mode: 0 | 1 | 2;
  origin: [number, number];
  shape: [number, number, number, number];
  color: THREE.Color;
  /** blink (warnings) */
  blink?: boolean;
}

type Lead = 'follow' | 'approach' | 'close' | 'blindspot' | null;

interface SystemDef {
  zones: ZoneDef[];
  lead: Lead;
  laneGlow?: boolean;
  beams?: boolean;
}

const sector = (x: number, y: number, angle: number, half: number, r: number, color: THREE.Color, blink = false): ZoneDef => ({
  mode: 0,
  origin: [x, y],
  shape: [angle, half, r, 0],
  color,
  blink,
});
const box = (x: number, y: number, hx: number, hy: number, color: THREE.Color, blink = false): ZoneDef => ({
  mode: 2,
  origin: [x, y],
  shape: [hx, hy, 0, 0],
  color,
  blink,
});
const FRONT = 2.4;
const REAR = -2.4;

/** Same order as ADAS_SYSTEMS in brochure.ts. */
const SYSTEMS: SystemDef[] = [
  // 360° surround camera: rings around the car
  { zones: [{ mode: 1, origin: [0, 0], shape: [3.1, 6.5, 0, 0], color: BLUE }], lead: null },
  // ICC: keeps its distance to the car ahead
  { zones: [sector(0, FRONT, 0, 0.17, 16, BLUE)], lead: 'follow' },
  // AEB: car ahead closes in, brakes
  { zones: [sector(0, FRONT, 0, 0.2, 12, RED, true)], lead: 'close' },
  // FCW: warning cone ahead
  { zones: [sector(0, FRONT, 0, 0.2, 14, AMBER, true)], lead: 'approach' },
  // RCW: warning cone behind
  { zones: [sector(0, REAR, Math.PI, 0.22, 13, AMBER, true)], lead: null },
  // BSD: blind-spot boxes beside the rear quarters, a car creeping into the left one
  { zones: [box(-LANE, -2.6, 1.5, 3.6, AMBER, true), box(LANE, -2.6, 1.5, 3.6, BLUE)], lead: 'blindspot' },
  // DOW: strips along the doors, reaching back
  { zones: [box(-1.75, -3.2, 0.55, 4.6, AMBER, true), box(1.75, -3.2, 0.55, 4.6, AMBER, true)], lead: null },
  // LDA: our lane's lines light up while the car drifts and is pulled back
  { zones: [], lead: null, laneGlow: true },
  // FCTA & FCTB: fans out of the front corners
  {
    zones: [sector(-0.9, FRONT - 0.3, -1.15, 0.5, 11, AMBER, true), sector(0.9, FRONT - 0.3, 1.15, 0.5, 11, AMBER, true)],
    lead: null,
  },
  // RCTA & RCTB: fans out of the rear corners
  {
    zones: [
      sector(-0.9, REAR + 0.3, -(Math.PI - 1.15), 0.5, 11, AMBER, true),
      sector(0.9, REAR + 0.3, Math.PI - 1.15, 0.5, 11, AMBER, true),
    ],
    lead: null,
  },
  // HMA: headlight beams switch between high and low
  { zones: [], lead: null, beams: true },
];
export const ADAS_COUNT = SYSTEMS.length;

/**
 * ADAS: a light road seen from behind and above (~55°), our car as a cut-out,
 * and one procedural sensor visualisation per system. Scroll picks the system.
 */
export class AdasScene implements FxView {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(32, 1, 0.5, 200);
  /** 0…1 through the pinned scroll, set from outside. */
  target = 0;
  active = 0;
  onActiveChange?: (index: number) => void;

  private readonly road: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly car: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly lead: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly zones: { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>; def: ZoneDef; system: number }[] = [];
  private readonly beams: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  private readonly weights = SYSTEMS.map(() => 0);
  private readonly carAspect: number;
  private readonly leadAspect: number;
  private readonly leadPos = new THREE.Vector3(0, 0, -60);
  private leadShow = 0;
  private roadOffset = 0;
  private speed = 1;
  private sysTime = 0;

  constructor(
    readonly el: HTMLElement,
    images: AdasImages,
    renderer: THREE.WebGLRenderer,
    private readonly reducedMotion: boolean,
  ) {
    this.scene.background = BG;
    this.carAspect = images.carRear34.width / images.carRear34.height;
    this.leadAspect = images.leadCar.width / images.leadCar.height;

    const roadSize = new THREE.Vector2(LANE * 6, 140);
    this.road = new THREE.Mesh(
      new THREE.PlaneGeometry(roadSize.x, roadSize.y),
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: roadShader,
        uniforms: {
          size: { value: roadSize },
          offset: { value: 0 },
          laneGlow: { value: 0 },
          bg: { value: BG },
          glow: { value: BLUE },
        },
      }),
    );
    this.road.rotation.x = -Math.PI / 2;
    this.road.position.z = -40; // most of the road lies ahead
    this.scene.add(this.road);

    const zoneSize = new THREE.Vector2(40, 40);
    const zoneMesh = (def: ZoneDef) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(zoneSize.x, zoneSize.y),
        new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader: zoneShader,
          uniforms: {
            size: { value: zoneSize },
            mode: { value: def.mode },
            origin: { value: new THREE.Vector2(...def.origin) },
            shape: { value: new THREE.Vector4(...def.shape) },
            color: { value: def.color },
            alpha: { value: 0 },
            time: { value: 0 },
          },
          transparent: true,
          depthWrite: false,
        }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.02;
      mesh.renderOrder = 1;
      mesh.visible = false;
      this.scene.add(mesh);
      return mesh;
    };
    SYSTEMS.forEach((s, i) => s.zones.forEach((def) => this.zones.push({ mesh: zoneMesh(def), def, system: i })));
    // headlight beams for HMA, lengthened and shortened in update()
    for (const x of [-0.7, 0.7]) {
      const def = sector(x, FRONT, 0, 0.2, 10, BEAM);
      const mesh = zoneMesh(def);
      this.beams.push(mesh);
      this.zones.push({ mesh, def, system: SYSTEMS.length - 1 });
    }

    const billboard = (img: HTMLImageElement) =>
      new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: imageTexture(img, renderer), transparent: true, depthTest: false, depthWrite: false }),
      );
    this.car = billboard(images.carRear34);
    this.lead = billboard(images.leadCar);
    this.car.renderOrder = 4;
    this.lead.renderOrder = 3;
    this.scene.add(this.car, this.lead);
  }

  resize(width: number, height: number) {
    const wide = width >= 900;
    const cx = wide ? width * 0.66 : width * 0.5;
    const cy = wide ? height * 0.66 : height * 0.42;
    this.camera.aspect = width / height;
    this.camera.fov = wide ? 32 : 40;
    this.camera.setViewOffset(width, height, width / 2 - cx, height / 2 - cy, width, height);
    this.camera.updateProjectionMatrix();

    // behind, to the right and above, so the road runs off to the upper right like the cut-out
    // aim a little ahead on wide screens (room for the road), at the car on phones
    const target = new THREE.Vector3(0, 0, wide ? -2.5 : 0);
    const az = THREE.MathUtils.degToRad(58);
    const el = THREE.MathUtils.degToRad(40);
    // narrow screens: step back so the car (fixed in metres) still fits across
    const dist = 21 * Math.min(2, Math.max(1, 0.7 / this.camera.aspect));
    this.camera.position.set(
      target.x + dist * Math.sin(az) * Math.cos(el),
      target.y + dist * Math.sin(el),
      target.z + dist * Math.cos(az) * Math.cos(el),
    );
    this.camera.lookAt(target);

    // cut-outs face the camera (they were shot from about this angle)
    const carW = 6.3;
    this.car.scale.set(carW, carW / this.carAspect, 1);
    const leadW = 4.6;
    this.lead.scale.set(leadW, leadW / this.leadAspect, 1);
  }

  /** Where the car ahead / alongside should be for a system (time in seconds since it became active). */
  private leadTarget(kind: Lead, t: number, out: THREE.Vector3) {
    switch (kind) {
      case 'follow':
        return out.set(0, 0, -11 + Math.sin(t * 0.8) * 1);
      case 'approach':
        return out.set(0, 0, -13 + Math.min(t, 3) * 1.6);
      case 'close':
        return out.set(0, 0, THREE.MathUtils.lerp(-14, -6.5, smooth(0, 2.2, t % 5)));
      case 'blindspot':
        // creeps up from behind into the left blind-spot box
        return out.set(-LANE, 0, THREE.MathUtils.lerp(8, 1.5, smooth(0, 2.5, t % 6)));
      default:
        return out.set(0, 0, -60);
    }
  }

  update(_rect: DOMRect, _viewport: unknown, dt: number, time: number) {
    const n = SYSTEMS.length;
    const active = Math.min(Math.floor(clamp01(this.target) * n), n - 1);
    if (active !== this.active) {
      this.active = active;
      this.sysTime = 0;
      this.onActiveChange?.(active);
    }
    this.sysTime += dt;
    const sys = SYSTEMS[active];
    const t = this.reducedMotion ? 2 : this.sysTime;
    const anim = this.reducedMotion ? 0 : time;

    this.weights.forEach((w, i) => {
      const goal = Number(i === active);
      this.weights[i] = this.reducedMotion ? goal : THREE.MathUtils.damp(w, goal, 6, dt);
    });

    // driving: dashes run past; AEB brakes to a stop as the car ahead closes in
    const braking = sys.lead === 'close' ? smooth(0.8, 2.2, t % 5) : 0;
    this.speed = THREE.MathUtils.damp(this.speed, 1 - braking, 4, dt);
    if (!this.reducedMotion) this.roadOffset += dt * 16 * this.speed;
    this.road.material.uniforms.offset.value = this.roadOffset;
    this.road.material.uniforms.laneGlow.value = this.weights[7] * (0.65 + 0.35 * Math.sin(anim * 4));

    // lane assist: drift toward the line, get pulled back
    const drift = sys.laneGlow ? Math.sin(t * 1.3) * 0.55 : 0;
    this.car.position.x = THREE.MathUtils.damp(this.car.position.x, drift, 3, dt);
    this.car.position.y = 0.95;
    this.car.quaternion.copy(this.camera.quaternion);

    for (const z of this.zones) {
      const w = this.weights[z.system];
      z.mesh.visible = w > 0.01;
      if (!z.mesh.visible) continue;
      const blink = z.def.blink && !this.reducedMotion ? 0.6 + 0.4 * Math.sign(Math.sin(anim * 9)) : 1;
      z.mesh.material.uniforms.alpha.value = w * blink * 0.85;
      z.mesh.material.uniforms.time.value = anim;
      z.mesh.position.x = this.car.position.x;
    }
    // HMA: the beams switch between high (long) and low (short)
    const high = this.reducedMotion ? 1 : smooth(-0.2, 0.2, Math.sin(t * 1.4));
    for (const b of this.beams) b.material.uniforms.shape.value.z = THREE.MathUtils.lerp(7, 22, high);

    // the other car
    const want = sys.lead ? 1 : 0;
    this.leadShow = this.reducedMotion ? want : THREE.MathUtils.damp(this.leadShow, want, 5, dt);
    const goal = this.leadTarget(sys.lead, t, new THREE.Vector3());
    if (sys.lead) {
      // jump instead of sliding across the road when switching lanes
      if (this.leadPos.distanceTo(goal) > 12 || this.leadShow < 0.05) this.leadPos.copy(goal);
      else this.leadPos.lerp(goal, 1 - Math.exp(-6 * dt));
    }
    this.lead.visible = this.leadShow > 0.01;
    this.lead.material.opacity = this.leadShow;
    this.lead.position.set(this.leadPos.x, 0.85, this.leadPos.z);
    this.lead.quaternion.copy(this.camera.quaternion);
    // nearer one draws on top
    this.lead.renderOrder = this.leadPos.z > 0 ? 5 : 3;
  }
}
