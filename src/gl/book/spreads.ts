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
  makeCanvas,
  paper,
  paperCutout,
  paragraph,
  photoCard,
  roundRect,
  spaced,
  statCard,
  tag,
  toTexture,
  wrap,
} from '../textures';
import { ADAS_SYSTEMS, DIMENSIONS, EXTERIOR_COLORS, KEY_SPECS, VARIANTS, type CarColor } from '../../content/brochure';


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

/* ---------------------------------------------- shared page furniture */

function bullets(ctx: CanvasRenderingContext2D, items: string[], y: number, gap = 18) {
  ctx.font = `400 28px ${FONT_BODY}`;
  for (const item of items) {
    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.arc(M + 6, y - 9, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    y = paragraph(ctx, item, M + 30, y, W - M * 2 - 30, 42) + gap;
  }
  return y;
}

function smallNote(ctx: CanvasRenderingContext2D, text: string, y: number, align: 'left' | 'right' = 'left') {
  ctx.fillStyle = COLORS.muted;
  ctx.font = `400 20px ${FONT_BODY}`;
  ctx.textAlign = align;
  ctx.fillText(text, align === 'left' ? M : W - M, y);
  ctx.textAlign = 'left';
}

/* ---------------------------------------------------- spread 3: interior */

function interiorLeft() {
  const { canvas, ctx } = paper(W, H, 'right');
  eyebrow(ctx, '03 · INTERIOR', 150);
  let y = heading(ctx, ['DESIGN', 'IN MOTION'], 250);

  ctx.fillStyle = COLORS.text;
  ctx.font = `600 36px ${FONT_BODY}`;
  y = paragraph(ctx, 'ดื่มด่ำสุนทรียะแห่งการเดินทางขั้นสุด', M, y + 34, W - M * 2, 50);

  ctx.fillStyle = COLORS.muted;
  ctx.font = `400 28px ${FONT_BODY}`;
  y = paragraph(
    ctx,
    'พบกับภายในห้องโดยสาร BYD SEALION 7 ที่ออกแบบภายใต้แนวคิด Floating Design เชื่อมต่อความสะดวกสบายและเทคโนโลยีขั้นสุดได้อย่างลงตัว',
    M,
    y + 22,
    W - M * 2,
    44,
  );
  bullets(ctx, ['แสงไฟในห้องโดยสาร 128 เฉดสี ปรับตามจังหวะเสียงดนตรี', 'ภายในห้องโดยสารสีใหม่สีฟ้า'], y + 40);
  pageNumber(ctx, '06', 'left');
  return canvas;
}

function interiorRight() {
  const { canvas, ctx } = paper(W, H, 'left');
  // the 128-colour mood light, printed as a strip
  const x0 = M;
  const x1 = W - M;
  const y = H - 150;
  for (let i = 0; i < 128; i++) {
    ctx.fillStyle = `hsl(${200 + (i / 128) * 160}, 70%, 64%)`;
    ctx.fillRect(x0 + ((x1 - x0) * i) / 128, y, (x1 - x0) / 128 + 1, 8);
  }
  smallNote(ctx, 'RGB Dynamic Mood Light · 128 เฉดสี', y - 18, 'right');
  pageNumber(ctx, '07', 'right');
  return canvas;
}

/* -------------------------------------------------------- spread 4: ADAS */

function adasLeft() {
  const { canvas, ctx } = paper(W, H, 'right');
  eyebrow(ctx, '04 · ADAS', 150);
  let y = heading(ctx, ['SUPER INTELLIGENT', 'ASSIST'], 240, 54);

  ctx.fillStyle = COLORS.text;
  ctx.font = `600 30px ${FONT_BODY}`;
  ctx.fillText('Advanced Driver Assistance System (ADAS)', M, y + 26);
  ctx.fillStyle = COLORS.muted;
  ctx.font = `400 26px ${FONT_BODY}`;
  ctx.fillText('มั่นใจทุกสถานการณ์ กับเทคโนโลยีความปลอดภัยขั้นสูง', M, y + 68);

  // 11 systems in two columns
  const colW = (W - M * 2 - 36) / 2;
  const top = y + 130;
  const rowH = 118;
  ADAS_SYSTEMS.forEach((sys, i) => {
    const cx = M + (i % 2) * (colW + 36);
    const cy = top + Math.floor(i / 2) * rowH;
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 32);
    ctx.lineTo(cx + colW, cy - 32);
    ctx.stroke();
    ctx.fillStyle = COLORS.navy;
    ctx.font = `400 22px ${FONT_DISPLAY}`;
    ctx.fillText(sys.code, cx, cy);
    ctx.fillStyle = COLORS.muted;
    ctx.font = `400 19px ${FONT_BODY}`;
    const lines = wrap(ctx, sys.th, colW).slice(0, 2);
    lines.forEach((l, k) => ctx.fillText(l, cx, cy + 32 + k * 26));
  });
  pageNumber(ctx, '08', 'left');
  return canvas;
}

function adasRight() {
  const { canvas, ctx } = paper(W, H, 'left');
  smallNote(ctx, 'ระบบช่วยขับขี่ไม่สามารถทดแทนความรับผิดชอบของผู้ขับขี่ต่อยานพาหนะได้', H - 120, 'right');
  pageNumber(ctx, '09', 'right');
  return canvas;
}

/** Sensor waves radiating from the car, as a paper cut-out. */
function sensorWaves() {
  const w = 900;
  const h = 360;
  const { canvas, ctx } = makeCanvas(w, h);
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const r = 90 + i * 72;
    ctx.strokeStyle = i % 2 ? COLORS.accent : COLORS.navy;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(w / 2, h + 20, r + 60, Math.PI * 1.22, Math.PI * 1.78);
    ctx.stroke();
  }
  return canvas;
}

/* --------------------------------------------------- spread 5: specifications */

function specsLeft() {
  const { canvas, ctx } = paper(W, H, 'right');
  eyebrow(ctx, '05 · SPECIFICATIONS', 150);
  let y = heading(ctx, ['3 รุ่นย่อย'], 250, 60);
  ctx.fillStyle = COLORS.muted;
  ctx.font = `400 26px ${FONT_BODY}`;
  ctx.fillText('ตัวเลขหลักจากตารางสเปกใน brochure', M, y + 6);

  const labelW = 290;
  const colW = (W - M * 2 - labelW) / 3;
  const top = y + 70;
  // highlight the top variant
  ctx.fillStyle = COLORS.accentSoft;
  roundRect(ctx, M + labelW + colW * 2, top - 10, colW, 104 + KEY_SPECS.length * 70, 14);
  ctx.fill();

  ctx.font = `600 22px ${FONT_BODY}`;
  VARIANTS.forEach((v, i) => {
    ctx.fillStyle = i === 2 ? COLORS.navy : COLORS.muted;
    const lines = v.split(' ');
    const cx = M + labelW + colW * i + 16;
    if (lines.length === 1) ctx.fillText(lines[0], cx, top + 52);
    else lines.forEach((l, k) => ctx.fillText(l, cx, top + 30 + k * 30));
  });

  KEY_SPECS.forEach((row, r) => {
    const ry = top + 100 + r * 70;
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(M, ry);
    ctx.lineTo(W - M, ry);
    ctx.stroke();
    ctx.fillStyle = COLORS.muted;
    ctx.font = `500 22px ${FONT_BODY}`;
    ctx.fillText(row.label, M, ry + 44);
    row.values.forEach((v, i) => {
      ctx.fillStyle = i === 2 ? COLORS.navy : COLORS.text;
      ctx.font = `600 24px ${FONT_BODY}`;
      ctx.fillText(v, M + labelW + colW * i + 16, ry + 44);
    });
  });
  smallNote(ctx, 'ระยะทางตามมาตรฐาน NEDC เป็นตัวเลขประมาณการณ์สำหรับอ้างอิงเท่านั้น', H - 110);
  pageNumber(ctx, '10', 'left');
  return canvas;
}

function blueprintGrid(ctx: CanvasRenderingContext2D, w: number, h: number, step: number) {
  ctx.strokeStyle = 'rgba(139,132,198,0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = step; x < w; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = step; y < h; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
}

function specsRight() {
  const { canvas, ctx } = paper(W, H, 'left');
  blueprintGrid(ctx, W, H, 64);
  pageNumber(ctx, '11', 'right');
  return canvas;
}

/** Dimension line with end ticks and a centred label. */
function dimension(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, label: string) {
  ctx.strokeStyle = COLORS.navy;
  ctx.fillStyle = COLORS.navy;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  const vertical = x0 === x1;
  for (const [x, y] of [[x0, y0], [x1, y1]]) {
    if (vertical) {
      ctx.moveTo(x - 14, y);
      ctx.lineTo(x + 14, y);
    } else {
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x, y + 14);
    }
  }
  ctx.stroke();
  ctx.font = `400 26px ${FONT_DISPLAY}`;
  const tw = ctx.measureText(label).width;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  ctx.fillStyle = '#ffffff';
  if (vertical) {
    ctx.fillRect(mx - 6, my - tw / 2 - 10, 40, tw + 20);
    ctx.save();
    ctx.translate(mx + 10, my);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = COLORS.navy;
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  } else {
    ctx.fillRect(mx - tw / 2 - 12, my - 22, tw + 24, 44);
    ctx.fillStyle = COLORS.navy;
    ctx.textAlign = 'center';
    ctx.fillText(label, mx, my + 10);
    ctx.textAlign = 'left';
  }
}

function card(w: number, h: number) {
  const c = makeCanvas(w, h);
  roundRect(c.ctx, 2, 2, w - 4, h - 4, 26);
  c.ctx.fillStyle = '#ffffff';
  c.ctx.fill();
  c.ctx.lineWidth = 3;
  c.ctx.strokeStyle = COLORS.line;
  c.ctx.stroke();
  c.ctx.save();
  c.ctx.clip();
  blueprintGrid(c.ctx, w, h, 40);
  c.ctx.restore();
  return c;
}

const fmt = (n: number) => n.toLocaleString('en-US');

function blueprintSide(img: HTMLImageElement) {
  const w = 1100;
  const h = 640;
  const { canvas, ctx } = card(w, h);
  const carW = 820;
  const carH = carW * (img.height / img.width);
  const cx = (w - carW) / 2 - 20;
  const cy = 90;
  ctx.drawImage(img, cx, cy, carW, carH);
  // wheel centres and ground line measured on car-side.webp
  const front = cx + carW * 0.164;
  const rear = cx + carW * 0.79;
  const ground = cy + carH * 0.93;
  dimension(ctx, front, ground + 60, rear, ground + 60, fmt(DIMENSIONS.wheelbase));
  dimension(ctx, cx, ground + 140, cx + carW * 0.985, ground + 140, fmt(DIMENSIONS.length));
  dimension(ctx, cx + carW + 60, cy + 4, cx + carW + 60, ground, fmt(DIMENSIONS.height));
  ctx.fillStyle = COLORS.muted;
  ctx.font = `500 22px ${FONT_BODY}`;
  ctx.fillText('มิลลิเมตร', 40, 52);
  return canvas;
}

function blueprintFront(img: HTMLImageElement) {
  const w = 620;
  const h = 640;
  const { canvas, ctx } = card(w, h);
  const carW = 400;
  const carH = carW * (img.height / img.width);
  const cx = (w - carW) / 2;
  const cy = 70;
  ctx.drawImage(img, cx, cy, carW, carH);
  const ground = cy + carH * 0.97;
  dimension(ctx, cx + carW * 0.17, ground + 60, cx + carW * 0.83, ground + 60, fmt(DIMENSIONS.track));
  dimension(ctx, cx, ground + 140, cx + carW, ground + 140, fmt(DIMENSIONS.width));
  return canvas;
}

/* ------------------------------------------------------- spread 6: colours */

function availabilityText(a: readonly boolean[]) {
  if (a.every(Boolean)) return 'ทุกรุ่น';
  return VARIANTS.filter((_, i) => a[i]).join(' · ');
}

function colorsLeft() {
  const { canvas, ctx } = paper(W, H, 'right');
  eyebrow(ctx, '06 · COLORS', 150);
  let y = heading(ctx, ['EXTERIOR', 'COLOR'], 250);
  ctx.fillStyle = COLORS.muted;
  ctx.font = `400 26px ${FONT_BODY}`;
  ctx.fillText('6 สีภายนอก ตามรุ่นย่อย', M, y + 6);

  const nameW = 400;
  const colW = (W - M * 2 - nameW) / 3;
  const top = y + 80;
  ctx.font = `600 20px ${FONT_BODY}`;
  VARIANTS.forEach((v, i) => {
    ctx.fillStyle = COLORS.muted;
    const lines = v.split(' ');
    const cx = M + nameW + colW * i + colW / 2;
    ctx.textAlign = 'center';
    if (lines.length === 1) ctx.fillText(lines[0], cx, top + 40);
    else lines.forEach((l, k) => ctx.fillText(l, cx, top + 24 + k * 26));
    ctx.textAlign = 'left';
  });
  EXTERIOR_COLORS.forEach((c, r) => {
    const ry = top + 84 + r * 78;
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(M, ry);
    ctx.lineTo(W - M, ry);
    ctx.stroke();
    ctx.fillStyle = c.swatch;
    ctx.beginPath();
    ctx.arc(M + 20, ry + 39, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.line;
    ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.font = `400 22px ${FONT_DISPLAY}`;
    ctx.fillText(c.name.toUpperCase(), M + 56, ry + 47);
    c.availability.forEach((ok, i) => {
      const cx = M + nameW + colW * i + colW / 2;
      if (ok) {
        ctx.fillStyle = COLORS.navy;
        ctx.beginPath();
        ctx.arc(cx, ry + 39, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = COLORS.line;
        ctx.fillRect(cx - 10, ry + 37, 20, 4);
      }
    });
  });
  y = top + 84 + EXTERIOR_COLORS.length * 78 + 56;
  ctx.fillStyle = COLORS.text;
  ctx.font = `500 24px ${FONT_BODY}`;
  ctx.fillText('สีภายใน: ดำ (ทุกรุ่น) · ฟ้า (AWD Ultimate)', M, y);
  smallNote(ctx, 'สีที่แสดงเป็นเพียงแนวทางเท่านั้น และอาจแตกต่างจากสีจริง', H - 110);
  pageNumber(ctx, '12', 'left');
  return canvas;
}

function colorsRight() {
  const { canvas, ctx } = paper(W, H, 'left');
  pageNumber(ctx, '13', 'right');
  return canvas;
}

function colorCard(img: HTMLImageElement, color: CarColor) {
  const w = 520;
  const h = 380;
  const { canvas, ctx } = makeCanvas(w, h);
  roundRect(ctx, 2, 2, w - 4, h - 4, 24);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.line;
  ctx.stroke();
  // the brochure's colour photos are small; draw them contained, not cropped
  const boxW = w - 60;
  const boxH = 210;
  const s = Math.min(boxW / img.width, boxH / img.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (w - img.width * s) / 2, 30 + (boxH - img.height * s) / 2, img.width * s, img.height * s);

  ctx.fillStyle = color.swatch;
  ctx.beginPath();
  ctx.arc(46, 286, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = `400 24px ${FONT_DISPLAY}`;
  ctx.fillText(color.name.toUpperCase(), 74, 295);
  ctx.fillStyle = COLORS.muted;
  ctx.font = `500 21px ${FONT_BODY}`;
  ctx.fillText(availabilityText(color.availability), 32, 342);
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

type Side = 'front' | 'back';
type PieceOptions = ConstructorParameters<typeof PopUpPiece>[1];

/**
 * Leaf i carries the right page of spread i on its front and the left page
 * of spread i + 1 on its back. Leaf 0 is the cover; the last leaf is the
 * back board, which never turns.
 */
export function buildPageArt(img: Images, renderer: THREE.WebGLRenderer): PageArt {
  const tex = (c: HTMLCanvasElement) => toTexture(c, renderer);

  const pages = [
    { front: cover(img), back: performanceLeft() },
    { front: performanceRight(img), back: exteriorLeft() },
    { front: exteriorRight(), back: interiorLeft() },
    { front: interiorRight(), back: adasLeft() },
    { front: adasRight(), back: specsLeft() },
    { front: specsRight(), back: colorsLeft() },
    { front: colorsRight(), back: backCover() },
  ].map((p) => ({ front: tex(p.front), back: tex(p.back) }));

  const pieces: PageArt['pieces'] = [];
  const add = (leaf: number, side: Side, x: number, canvas: HTMLCanvasElement, opts: PieceOptions) =>
    pieces.push({ leaf, side, x, piece: new PopUpPiece(tex(canvas), opts) });

  // cards keep one scale even when long text makes the canvas wider
  const statWidth = (c: HTMLCanvasElement, base: number) => (base * c.width) / 420;
  const tagWidth = (c: HTMLCanvasElement) => c.width / 1150;

  /* spread 1 — performance */
  const battery = statCard({ value: '91.3', unit: 'kWh', label: 'Battery capacity' });
  add(0, 'back', -0.3, battery, { width: statWidth(battery, 0.3), z: 0.52, delay: 0.25, section: 'performance' });
  const dc = statCard({ value: '230', unit: 'kW', label: 'DC charging CCS2' });
  add(0, 'back', -0.72, dc, { width: statWidth(dc, 0.3), z: 0.52, delay: 0.3, section: 'performance' });

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
    const c = statCard(s);
    add(1, 'front', 0.2 + i * 0.3, c, {
      width: statWidth(c, 0.27), z: 0.5, delay: 0.22 + i * 0.05, lean: 0.05, section: 'performance',
    });
  });

  /* spread 2 — exterior */
  add(1, 'back', -0.74, photoCard(img.headlight, 'ไฟหน้าแบบ Double-U Floating', 520, 0.7, 0.45), {
    width: 0.36, z: 0.42, delay: 0.15, section: 'exterior',
  });
  add(1, 'back', -0.26, photoCard(img.wheel, 'ล้ออัลลอย 20 นิ้ว คาลิปเปอร์เบรกสีแดง', 520, 0.7, 0.55), {
    width: 0.36, z: 0.42, delay: 0.22, section: 'exterior',
  });
  add(2, 'front', 0.5, backdropCard(img.swirl, 900, 600, 0.5), {
    width: 0.84, z: -0.32, delay: 0, lean: 0.2, section: 'exterior',
  });
  add(2, 'front', 0.5, paperCutout(img.carFront, 10), {
    width: 0.6, z: 0.08, delay: 0.12, lean: 0.06, section: 'exterior',
  });
  const oceanX = tag('OCEAN-X', 'Face design');
  add(2, 'front', 0.2, oceanX, { width: tagWidth(oceanX), z: 0.5, delay: 0.25, lean: 0.04, section: 'exterior' });
  add(2, 'front', 0.76, photoCard(img.tailgate, 'ประตูท้ายไฟฟ้าแบบแฮนด์ฟรี', 520, 0.6, 0.5), {
    width: 0.34, z: 0.5, delay: 0.3, lean: 0.04, section: 'exterior',
  });

  /* spread 3 — interior */
  add(2, 'back', -0.74, photoCard(img.interiorShifter, 'Crystal Shifter พร้อมที่ชาร์จไร้สาย', 520, 0.62), {
    width: 0.36, z: 0.46, delay: 0.15, section: 'interior',
  });
  add(2, 'back', -0.26, photoCard(img.interiorAudio, 'DYNAUDIO Premium Sound System', 520, 0.62), {
    width: 0.36, z: 0.46, delay: 0.22, section: 'interior',
  });
  add(3, 'front', 0.5, backdropCard(img.interiorDash, 900, 560, 0.5), {
    width: 0.84, z: -0.28, delay: 0, lean: 0.2, section: 'interior',
  });
  add(3, 'front', 0.17, photoCard(img.interiorHud, 'Head-Up Display', 520, 0.6), {
    width: 0.3, z: 0.42, delay: 0.2, lean: 0.05, yaw: 0.12, section: 'interior',
  });
  const screen = statCard({ value: '15.6', unit: 'นิ้ว', label: 'Multimedia screen', tone: 'navy' });
  add(3, 'front', 0.5, screen, { width: statWidth(screen, 0.25), z: 0.56, delay: 0.25, lean: 0.05, section: 'interior' });
  add(3, 'front', 0.83, photoCard(img.interiorRoof, 'Panoramic Glass Roof', 520, 0.6), {
    width: 0.3, z: 0.42, delay: 0.3, lean: 0.05, yaw: -0.12, section: 'interior',
  });

  /* spread 4 — ADAS */
  add(4, 'front', 0.5, backdropCard(img.adasRoad, 900, 560, 0.5), {
    width: 0.84, z: -0.3, delay: 0, lean: 0.2, section: 'adas',
  });
  add(4, 'front', 0.5, paperCutout(sensorWaves(), 8), {
    width: 0.62, z: 0.06, delay: 0.12, lean: 0.1, section: 'adas',
  });
  const adasTags = [
    tag('360°', 'กล้องมองภาพรอบคัน'),
    tag('AEB', 'เบรกฉุกเฉินอัตโนมัติ'),
    tag('ICC', 'Intelligent Cruise Control'),
  ];
  adasTags.forEach((c, i) =>
    add(4, 'front', 0.18 + i * 0.32, c, {
      width: tagWidth(c), z: 0.48, delay: 0.22 + i * 0.05, lean: 0.04, section: 'adas',
    }),
  );

  /* spread 5 — specifications */
  add(5, 'front', 0.5, blueprintSide(img.carSide), {
    width: 0.86, z: -0.16, delay: 0, lean: 0.16, section: 'specs',
  });
  add(5, 'front', 0.27, blueprintFront(img.carFront), {
    width: 0.4, z: 0.42, delay: 0.18, lean: 0.06, yaw: 0.1, section: 'specs',
  });
  const blade = tag('BLADE', 'BYD Blade Battery');
  add(5, 'front', 0.74, blade, { width: tagWidth(blade), z: 0.52, delay: 0.26, lean: 0.04, section: 'specs' });

  /* spread 6 — colours, fanned out in two rows */
  EXTERIOR_COLORS.forEach((c, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    add(6, 'front', 0.2 + col * 0.3, colorCard(img[`color-${c.id}` as keyof Images], c), {
      width: 0.28,
      z: row === 0 ? -0.12 : 0.36,
      delay: 0.05 + i * 0.05,
      lean: row === 0 ? 0.14 : 0.06,
      yaw: (1 - col) * 0.16,
      section: 'colors',
    });
  });

  return { pages, pieces };
}

export const IMAGE_SOURCES = {
  hero: 'assets/hero.webp',
  skyMist: 'assets/bg-sky-mist.webp',
  swirl: 'assets/bg-swirl.webp',
  carSide: 'assets/car-side.webp',
  carFront: 'assets/car-front.webp',
  speedLines: 'assets/speed-lines.webp',
  headlight: 'assets/detail-headlight.webp',
  wheel: 'assets/detail-wheel.webp',
  tailgate: 'assets/detail-tailgate.webp',
  interiorDash: 'assets/interior-dash.webp',
  interiorShifter: 'assets/interior-shifter.webp',
  interiorAudio: 'assets/interior-audio.webp',
  interiorHud: 'assets/interior-hud.webp',
  interiorRoof: 'assets/interior-roof.webp',
  adasRoad: 'assets/adas-road.webp',
  'color-horizon-white': 'assets/car-color-horizon-white.webp',
  'color-quantum-black': 'assets/car-color-quantum-black.webp',
  'color-space-grey': 'assets/car-color-space-grey.webp',
  'color-shark-grey': 'assets/car-color-shark-grey.webp',
  'color-solar-red': 'assets/car-color-solar-red.webp',
  'color-pulse-purple': 'assets/car-color-pulse-purple.webp',
} as const;

export type Images = Record<keyof typeof IMAGE_SOURCES, HTMLImageElement>;
