import * as THREE from 'three';
import { PAGE_H, PAGE_W } from './Leaf';
import { PopUpPiece } from './PopUpPiece';
import {
  COLORS,
  FONT_BODY,
  FONT_DISPLAY,
  PX,
  backdropCard,
  drawCover,
  paper,
  paperCutout,
  paragraph,
  photoCard,
  roundRect,
  spaced,
  statCard,
  tag,
  toTexture,
} from '../textures';

export type Images = Record<
  | 'hero'
  | 'skyMist'
  | 'swirl'
  | 'carSide'
  | 'carFront'
  | 'speedLines'
  | 'headlight'
  | 'taillight'
  | 'wheel'
  | 'tailgate',
  HTMLImageElement
>;

export interface PageArt {
  /** Page textures, indexed [leaf][front|back]. */
  pages: { front: THREE.Texture; back: THREE.Texture }[];
  /** Pop-up pieces per leaf side; x is the world position at rest. */
  pieces: { leaf: number; side: 'front' | 'back'; x: number; piece: PopUpPiece }[];
}

const W = PAGE_W * PX;
const H = PAGE_H * PX;
const M = 84; // page margin in px

function pageNumber(ctx: CanvasRenderingContext2D, n: string, side: 'left' | 'right') {
  ctx.fillStyle = COLORS.muted;
  ctx.font = `400 20px ${FONT_DISPLAY}`;
  ctx.textAlign = side === 'left' ? 'left' : 'right';
  ctx.fillText(n, side === 'left' ? M : W - M, H - 56);
  ctx.textAlign = 'left';
}

function eyebrow(ctx: CanvasRenderingContext2D, text: string, y: number) {
  ctx.fillStyle = COLORS.accent;
  ctx.font = `400 22px ${FONT_DISPLAY}`;
  spaced(ctx, text, M, y, 4);
}

function heading(ctx: CanvasRenderingContext2D, lines: string[], y: number, size = 68) {
  ctx.fillStyle = COLORS.navy;
  ctx.font = `400 ${size}px ${FONT_DISPLAY}`;
  lines.forEach((l, i) => spaced(ctx, l, M - 4, y + i * size * 1.18, 3));
  return y + lines.length * size * 1.18;
}

/* ---------------------------------------------------------------- cover */

function cover(img: Images) {
  const { canvas, ctx } = paper(W, H);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = COLORS.navy;
  ctx.font = `400 34px ${FONT_DISPLAY}`;
  spaced(ctx, 'BYD', M, 128, 14);

  ctx.save();
  roundRect(ctx, M, 196, W - M * 2, 760, 28);
  ctx.clip();
  drawCover(ctx, img.hero, M, 196, W - M * 2, 760, 0.6);
  ctx.restore();

  ctx.fillStyle = COLORS.text;
  ctx.font = `400 74px ${FONT_DISPLAY}`;
  spaced(ctx, 'BYD SEALION 7', M - 4, 1092, 4);
  ctx.fillStyle = COLORS.accent;
  ctx.font = `400 28px ${FONT_DISPLAY}`;
  spaced(ctx, 'LIFE IN MOTION', M, 1152, 10);

  ctx.fillStyle = COLORS.muted;
  ctx.font = `500 22px ${FONT_BODY}`;
  ctx.fillText('A pop-up guide · REVER AUTOMOTIVE', M, H - 72);
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(M, H - 120);
  ctx.lineTo(W - M, H - 120);
  ctx.stroke();
  return canvas;
}

/* ------------------------------------------------- spread 1: performance */

function performanceLeft() {
  const { canvas, ctx } = paper(W, H, 'right');
  eyebrow(ctx, '01 · PERFORMANCE', 150);
  let y = heading(ctx, ['PERFORMANCE', 'IN MOTION'], 250);

  ctx.fillStyle = COLORS.text;
  ctx.font = `600 38px ${FONT_BODY}`;
  ctx.fillText('พลิกนิยามการขับเคลื่อนยุคใหม่', M, y + 34);

  ctx.fillStyle = COLORS.muted;
  ctx.font = `400 29px ${FONT_BODY}`;
  y = paragraph(
    ctx,
    'BYD SEALION 7 รถ SUV เพื่อไลฟ์สไตล์ของคนสมาร์ท โดยนักออกแบบระดับโลก Wolfgang Egger ที่ได้แรงบันดาลใจจากความงามของท้องทะเล สู่เส้นสายที่โฉบเฉี่ยวรอบคัน พร้อมสมรรถนะที่ชาญฉลาด ตอบทุกความต้องการของชีวิตยุคใหม่',
    M,
    y + 104,
    W - M * 2,
    48,
  );

  // headline figure printed flat on the page
  ctx.fillStyle = COLORS.muted;
  ctx.font = `500 24px ${FONT_BODY}`;
  spaced(ctx, 'DRIVEN RANGE (NEDC)', M, y + 92, 2);
  ctx.fillStyle = COLORS.navy;
  ctx.font = `400 150px ${FONT_DISPLAY}`;
  const end = spaced(ctx, '600', M - 8, y + 262, 4);
  ctx.fillStyle = COLORS.accent;
  ctx.font = `500 48px ${FONT_BODY}`;
  ctx.fillText('KM', end + 18, y + 258);

  pageNumber(ctx, '02', 'left');
  return canvas;
}

function performanceRight(img: Images) {
  const { canvas, ctx } = paper(W, H, 'left');
  // a soft horizon printed under the pop-up stage
  ctx.save();
  ctx.globalAlpha = 0.3;
  drawCover(ctx, img.skyMist, 0, 0, W, H * 0.55, 0.4);
  ctx.restore();
  const fade = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.55);
  fade.addColorStop(0, 'rgba(251,250,247,0)');
  fade.addColorStop(1, COLORS.paper);
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H * 0.56);

  ctx.fillStyle = COLORS.muted;
  ctx.font = `500 24px ${FONT_BODY}`;
  ctx.textAlign = 'right';
  ctx.fillText('แตะที่ pop-up เพื่อดูรายละเอียด  →', W - M, H - 120);
  ctx.textAlign = 'left';
  pageNumber(ctx, '03', 'right');
  return canvas;
}

/* --------------------------------------------------- spread 2: exterior */

function exteriorLeft() {
  const { canvas, ctx } = paper(W, H, 'right');
  eyebrow(ctx, '02 · EXTERIOR', 150);
  const y = heading(ctx, ['EXTERIOR'], 250);

  ctx.fillStyle = COLORS.text;
  ctx.font = `600 36px ${FONT_BODY}`;
  const y2 = paragraph(ctx, 'โฉบเฉี่ยวทุกมุมมอง กับการออกแบบภายใต้แนวคิด Ocean-X Face', M, y + 40, W - M * 2, 50);

  ctx.fillStyle = COLORS.muted;
  ctx.font = `400 29px ${FONT_BODY}`;
  paragraph(ctx, 'โดยตัว “X” ที่ทำให้หน้ารถโดดเด่น สปอร์ตอีกขั้นกับไฟหน้าแบบ Double-U Floating', M, y2 + 20, W - M * 2, 46);

  pageNumber(ctx, '04', 'left');
  return canvas;
}

function exteriorRight() {
  const { canvas, ctx } = paper(W, H, 'left');
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = COLORS.navy;
  ctx.font = `400 300px ${FONT_DISPLAY}`;
  ctx.fillText('X', W / 2 - 110, H - 230);
  ctx.restore();
  pageNumber(ctx, '05', 'right');
  return canvas;
}

function backCover() {
  const { canvas, ctx } = paper(W, H);
  ctx.fillStyle = COLORS.navy;
  ctx.font = `400 34px ${FONT_DISPLAY}`;
  spaced(ctx, 'BYD', M, H / 2, 14);
  return canvas;
}

/* ------------------------------------------------------------- assembly */

/**
 * Leaves: 0 = cover (back: spread 1 left), 1 = sheet (front: spread 1 right,
 * back: spread 2 left), 2 = back board (front: spread 2 right).
 */
export function buildPageArt(img: Images, renderer: THREE.WebGLRenderer): PageArt {
  const tex = (c: HTMLCanvasElement) => toTexture(c, renderer);

  const pages = [
    { front: tex(cover(img)), back: tex(performanceLeft()) },
    { front: tex(performanceRight(img)), back: tex(exteriorLeft()) },
    { front: tex(exteriorRight()), back: tex(backCover()) },
  ];

  const pieces: PageArt['pieces'] = [];
  const add = (leaf: number, side: 'front' | 'back', x: number, canvas: HTMLCanvasElement, opts: ConstructorParameters<typeof PopUpPiece>[1]) =>
    pieces.push({ leaf, side, x, piece: new PopUpPiece(tex(canvas), opts) });

  // stat cards keep one scale even when a long figure makes the card wider
  const statWidth = (c: HTMLCanvasElement, base: number) => (base * c.width) / 420;

  // spread 1 — left page: battery & charging cards
  const battery = statCard({ value: '91.3', unit: 'kWh', label: 'Battery capacity' });
  add(0, 'back', -0.3, battery, { width: statWidth(battery, 0.3), z: 0.52, delay: 0.25, section: 'performance' });
  const dc = statCard({ value: '230', unit: 'kW', label: 'DC charging CCS2' });
  add(0, 'back', -0.72, dc, { width: statWidth(dc, 0.3), z: 0.52, delay: 0.3, section: 'performance' });

  // spread 1 — right page: backdrop, car, stat row
  add(1, 'front', 0.5, backdropCard(img.speedLines, 900, 560, 0.55), {
    width: 0.84, z: -0.3, delay: 0, lean: 0.2, section: 'performance',
  });
  add(1, 'front', 0.5, paperCutout(img.carSide, 12), {
    width: 0.92, z: 0.1, delay: 0.12, lean: 0.08, section: 'performance',
  });
  const stats = [
    { value: '390', unit: 'kW', label: 'Max power', tone: 'navy' as const },
    { value: '690', unit: 'N·m', label: 'Max torque' },
    { value: '4.5', unit: 'sec', label: '0–100 km/h' },
  ];
  stats.forEach((s, i) => {
    const card = statCard(s);
    add(1, 'front', 0.2 + i * 0.3, card, {
      width: statWidth(card, 0.27), z: 0.5, delay: 0.22 + i * 0.05, lean: 0.05, section: 'performance',
    });
  });

  // spread 2 — left page: detail cards
  add(1, 'back', -0.74, photoCard(img.headlight, 'ไฟหน้าแบบ Double-U Floating', 520, 0.7, 0.45), {
    width: 0.36, z: 0.42, delay: 0.15, section: 'exterior',
  });
  add(1, 'back', -0.26, photoCard(img.wheel, 'ล้ออัลลอย 20 นิ้ว คาลิปเปอร์เบรกสีแดง', 520, 0.7, 0.55), {
    width: 0.36, z: 0.42, delay: 0.22, section: 'exterior',
  });

  // spread 2 — right page: swirl backdrop, front of the car, callouts
  add(2, 'front', 0.5, backdropCard(img.swirl, 900, 600, 0.5), {
    width: 0.84, z: -0.32, delay: 0, lean: 0.2, section: 'exterior',
  });
  add(2, 'front', 0.5, paperCutout(img.carFront, 10), {
    width: 0.6, z: 0.08, delay: 0.12, lean: 0.06, section: 'exterior',
  });
  add(2, 'front', 0.2, tag('OCEAN-X', 'Face design'), {
    width: 0.3, z: 0.5, delay: 0.25, lean: 0.04, section: 'exterior',
  });
  add(2, 'front', 0.76, photoCard(img.tailgate, 'ประตูท้ายไฟฟ้าแบบแฮนด์ฟรี', 520, 0.6, 0.5), {
    width: 0.34, z: 0.5, delay: 0.3, lean: 0.04, section: 'exterior',
  });

  return { pages, pieces };
}

export const IMAGE_SOURCES: Record<keyof Images, string> = {
  hero: 'assets/hero.webp',
  skyMist: 'assets/bg-sky-mist.webp',
  swirl: 'assets/bg-swirl.webp',
  carSide: 'assets/car-side.webp',
  carFront: 'assets/car-front.webp',
  speedLines: 'assets/speed-lines.webp',
  headlight: 'assets/detail-headlight.webp',
  taillight: 'assets/detail-taillight.webp',
  wheel: 'assets/detail-wheel.webp',
  tailgate: 'assets/detail-tailgate.webp',
};
