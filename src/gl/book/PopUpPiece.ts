import * as THREE from 'three';

export interface PopUpOptions {
  /** Width in world units (height follows the texture's aspect ratio). */
  width: number;
  /** Depth position of the fold line on the page (−0.7 = top edge, +0.7 = bottom edge). */
  z: number;
  /** 0–1: when this piece starts rising relative to the spread opening. */
  delay?: number;
  /** Lean back when fully raised, in radians. */
  lean?: number;
  /** Section id to jump to when clicked. */
  section?: string;
}

const LIFT = 0.004;

/**
 * A paper piece that lies flat on its page and stands up on a fold line
 * as the spread opens, like the cards in a pop-up book.
 */
export class PopUpPiece {
  readonly root = new THREE.Group();
  readonly hinge = new THREE.Group();
  readonly mesh: THREE.Mesh;
  readonly z: number;
  readonly delay: number;
  readonly lean: number;
  readonly section?: string;

  constructor(map: THREE.Texture, opts: PopUpOptions) {
    const img = map.image as { width: number; height: number };
    const height = opts.width * (img.height / img.width);
    const geo = new THREE.PlaneGeometry(opts.width, height);
    geo.translate(0, height / 2, 0);

    const material = new THREE.MeshStandardMaterial({
      map,
      roughness: 0.85,
      metalness: 0,
      side: THREE.DoubleSide,
      alphaTest: 0.5,
      alphaToCoverage: true,
    });
    this.mesh = new THREE.Mesh(geo, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    // shadows must respect the cut-out silhouette
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map,
      alphaTest: 0.5,
    });

    this.z = opts.z;
    this.delay = opts.delay ?? 0;
    this.lean = opts.lean ?? 0.12;
    this.section = opts.section;
    this.mesh.userData.piece = this;

    this.hinge.position.y = LIFT;
    this.hinge.add(this.mesh);
    this.root.add(this.hinge);
  }

  /** `rise` is how open the spread is, 0 (flat) → 1 (fully standing). */
  setRise(rise: number) {
    const r = THREE.MathUtils.clamp((rise - this.delay) / (1 - this.delay), 0, 1);
    const e = 1 - Math.pow(1 - r, 3);
    this.hinge.rotation.x = -(Math.PI / 2) * (1 - e) - this.lean * e;
    this.mesh.visible = r > 0.001;
  }
}
