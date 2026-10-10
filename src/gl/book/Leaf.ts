import * as THREE from 'three';
import type { PopUpPiece } from './PopUpPiece';

export const PAGE_W = 1;
export const PAGE_H = 1.4;
const SEGMENTS = 48;
/** How much the free edge lags behind the spine while turning (0 = rigid). */
const CURL = 0.55;
/** Vertical gap between stacked leaves. */
const STACK_GAP = 0.006;

/**
 * One sheet of the book, hinged on the spine (the z axis through the origin).
 * Its front is the right-hand page when unturned; its back becomes the
 * left-hand page once turned (angle = π).
 */
export class Leaf {
  readonly group = new THREE.Group();
  readonly front: THREE.Mesh;
  readonly back: THREE.Mesh;
  /** Pop-up pieces glued to this leaf; they follow the bent page. */
  readonly pieces: { piece: PopUpPiece; side: 'front' | 'back'; d: number }[] = [];
  /** Objects glued to the free edge (index tabs); they turn with the page. */
  readonly edge: THREE.Object3D[] = [];

  angle = 0;
  private readonly frontGeo: THREE.BufferGeometry;
  private readonly backGeo: THREE.BufferGeometry;
  private readonly curveX = new Float32Array(SEGMENTS + 1);
  private readonly curveY = new Float32Array(SEGMENTS + 1);
  private readonly curvePhi = new Float32Array(SEGMENTS + 1);

  constructor(
    private readonly index: number,
    private readonly count: number,
    frontMap: THREE.Texture,
    backMap: THREE.Texture,
  ) {
    const verts = (SEGMENTS + 1) * 2;
    const position = new THREE.BufferAttribute(new Float32Array(verts * 3), 3);
    const normal = new THREE.BufferAttribute(new Float32Array(verts * 3), 3);
    const uvFront = new Float32Array(verts * 2);
    const uvBack = new Float32Array(verts * 2);
    const indices: number[] = [];

    for (let i = 0; i <= SEGMENTS; i++) {
      const u = i / SEGMENTS;
      for (let j = 0; j < 2; j++) {
        const k = i * 2 + j;
        // j = 0 is the far (top) edge of the page
        const v = j === 0 ? 1 : 0;
        uvFront[k * 2] = u;
        uvFront[k * 2 + 1] = v;
        uvBack[k * 2] = 1 - u;
        uvBack[k * 2 + 1] = v;
        position.setZ(k, j === 0 ? -PAGE_H / 2 : PAGE_H / 2);
      }
      if (i < SEGMENTS) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        indices.push(a, b, c, c, b, d);
      }
    }

    this.frontGeo = new THREE.BufferGeometry();
    this.frontGeo.setAttribute('position', position);
    this.frontGeo.setAttribute('normal', normal);
    this.frontGeo.setAttribute('uv', new THREE.BufferAttribute(uvFront, 2));
    this.frontGeo.setIndex(indices);

    this.backGeo = new THREE.BufferGeometry();
    this.backGeo.setAttribute('position', position);
    this.backGeo.setAttribute('normal', normal);
    this.backGeo.setAttribute('uv', new THREE.BufferAttribute(uvBack, 2));
    this.backGeo.setIndex(indices);

    const paper = { roughness: 0.92, metalness: 0 };
    this.front = new THREE.Mesh(
      this.frontGeo,
      new THREE.MeshStandardMaterial({ ...paper, map: frontMap, side: THREE.FrontSide }),
    );
    this.back = new THREE.Mesh(
      this.backGeo,
      new THREE.MeshStandardMaterial({ ...paper, map: backMap, side: THREE.BackSide }),
    );
    this.front.castShadow = true;
    this.front.receiveShadow = true;
    this.back.receiveShadow = true;
    this.front.frustumCulled = false;
    this.back.frustumCulled = false;
    this.group.add(this.front, this.back);

    this.update(0);
  }

  /**
   * Glues a piece onto the page. `x` is its rest position in world space:
   * positive on the right page (front), negative on the left page (back).
   */
  attach(piece: PopUpPiece, side: 'front' | 'back', x: number) {
    this.pieces.push({ piece, side, d: Math.abs(x) });
    this.group.add(piece.root);
  }

  attachToEdge(obj: THREE.Object3D) {
    this.edge.push(obj);
    this.group.add(obj);
  }

  update(angle: number) {
    this.angle = angle;
    const t = angle / Math.PI;
    const lift = (1 - t) * (this.count - 1 - this.index) * STACK_GAP + t * this.index * STACK_GAP;
    const lag = CURL * Math.sin(angle);

    // integrate the bent page profile from the spine outwards
    const ds = PAGE_W / SEGMENTS;
    this.curveX[0] = 0;
    this.curveY[0] = lift;
    this.curvePhi[0] = angle;
    for (let i = 1; i <= SEGMENTS; i++) {
      const sMid = (i - 0.5) / SEGMENTS;
      const phiMid = angle - lag * sMid;
      this.curveX[i] = this.curveX[i - 1] + Math.cos(phiMid) * ds;
      this.curveY[i] = this.curveY[i - 1] + Math.sin(phiMid) * ds;
      this.curvePhi[i] = angle - lag * (i / SEGMENTS);
    }

    const pos = this.frontGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i <= SEGMENTS; i++) {
      for (let j = 0; j < 2; j++) {
        const k = i * 2 + j;
        pos.setX(k, this.curveX[i]);
        pos.setY(k, this.curveY[i]);
      }
    }
    pos.needsUpdate = true;
    this.frontGeo.computeVertexNormals();

    for (const p of this.pieces) {
      const f = (p.d / PAGE_W) * SEGMENTS;
      const i0 = Math.min(Math.floor(f), SEGMENTS - 1);
      const k = f - i0;
      const x = THREE.MathUtils.lerp(this.curveX[i0], this.curveX[i0 + 1], k);
      const y = THREE.MathUtils.lerp(this.curveY[i0], this.curveY[i0 + 1], k);
      const phi = THREE.MathUtils.lerp(this.curvePhi[i0], this.curvePhi[i0 + 1], k);
      p.piece.root.position.set(x, y, p.piece.z);
      p.piece.root.rotation.z = p.side === 'front' ? phi : phi + Math.PI;
    }
    for (const obj of this.edge) {
      obj.position.x = this.curveX[SEGMENTS];
      obj.position.y = this.curveY[SEGMENTS];
      obj.rotation.z = this.curvePhi[SEGMENTS];
    }
  }
}
