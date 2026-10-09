import * as THREE from 'three';

/** Pixels per world unit for every canvas we paint. A page is 1 × 1.4 units. */
export const PX = 1024;

export const COLORS = {
  paper: '#fbfaf7',
  line: '#e4e6ee',
  text: '#0e1330',
  muted: '#5b6178',
  navy: '#1c3a7a',
  accent: '#8b84c6',
  accentSoft: '#eceaf7',
};

export const FONT_DISPLAY = "'Michroma', 'IBM Plex Sans Thai', sans-serif";
export const FONT_BODY = "'IBM Plex Sans Thai', sans-serif";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

export function makeCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w);
  canvas.height = Math.round(h);
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

export function toTexture(canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

/** Off-white paper with faint grain and a soft shade along the spine. */
export function paper(w: number, h: number, spine: 'left' | 'right' | 'none' = 'none') {
  const { canvas, ctx } = makeCanvas(w, h);
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, w, h);

  const grain = ctx.getImageData(0, 0, w, h);
  const d = grain.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 6;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(grain, 0, 0);

  if (spine !== 'none') {
    const x0 = spine === 'left' ? 0 : w;
    const g = ctx.createLinearGradient(x0, 0, spine === 'left' ? 90 : w - 90, 0);
    g.addColorStop(0, 'rgba(14,19,48,0.10)');
    g.addColorStop(1, 'rgba(14,19,48,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  return { canvas, ctx };
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draws an image so it covers the box (CSS object-fit: cover). */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { width: number; height: number },
  x: number,
  y: number,
  w: number,
  h: number,
  focusY = 0.5,
) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) * focusY;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('th', { granularity: 'word' }) : null;

/** Word-wraps Thai + Latin text (Thai has no spaces, so we segment by word). */
export function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const raw = segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : text.split(/(\s+)/);
  // keep Latin tokens such as "Ocean-X" or "0-100" in one piece
  const words: string[] = [];
  for (const w of raw) {
    const prev = words[words.length - 1];
    if (prev && /[\w\-–“”".]$/.test(prev) && /^[\w\-–“”".]/.test(w)) words[words.length - 1] = prev + w;
    else words.push(w);
  }
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line + word;
    if (ctx.measureText(next).width > maxWidth && line.trim()) {
      lines.push(line.trimEnd());
      line = word.trimStart();
    } else {
      line = next;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

export function paragraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const lines = wrap(ctx, text, maxWidth);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

/** Text with manual letter-spacing (canvas letterSpacing support is uneven). */
export function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  return cx - spacing;
}

/**
 * Turns an alpha cut-out into a paper cut-out: the subject gets a white border,
 * like it was cut from a printed sheet with scissors.
 */
export function paperCutout(img: HTMLImageElement, border = 10, maxWidth = 1400) {
  const scale = Math.min(1, maxWidth / img.width);
  const iw = Math.round(img.width * scale);
  const ih = Math.round(img.height * scale);
  const pad = border + 2;
  const { canvas, ctx } = makeCanvas(iw + pad * 2, ih + pad * 2);

  // silhouette, dilated by stamping it around a circle
  const sil = makeCanvas(canvas.width, canvas.height);
  const steps = 24;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    sil.ctx.drawImage(img, pad + Math.cos(a) * border, pad + Math.sin(a) * border, iw, ih);
  }
  sil.ctx.drawImage(img, pad, pad, iw, ih);
  sil.ctx.globalCompositeOperation = 'source-in';
  sil.ctx.fillStyle = '#ffffff';
  sil.ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(sil.canvas, 0, 0);
  ctx.drawImage(img, pad, pad, iw, ih);
  return canvas;
}

export interface StatCardOptions {
  value: string;
  unit: string;
  label: string;
  width?: number;
  height?: number;
  tone?: 'light' | 'navy';
}

export function statCard({ value, unit, label, width = 420, height = 300, tone = 'light' }: StatCardOptions) {
  // grow the card when the figure would not fit
  const { ctx: m } = makeCanvas(1, 1);
  m.font = `400 ${Math.round(height * 0.34)}px ${FONT_DISPLAY}`;
  let need = m.measureText(value).width + value.length * 2;
  m.font = `500 34px ${FONT_BODY}`;
  need += m.measureText(unit).width + 30 + 14 + 34;
  width = Math.max(width, Math.ceil(need));
  const { canvas, ctx } = makeCanvas(width, height);
  const navy = tone === 'navy';
  roundRect(ctx, 4, 4, width - 8, height - 8, 28);
  ctx.fillStyle = navy ? COLORS.navy : '#ffffff';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = navy ? COLORS.navy : COLORS.line;
  ctx.stroke();

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = navy ? '#c9c5f0' : COLORS.muted;
  ctx.font = `500 26px ${FONT_BODY}`;
  spaced(ctx, label.toUpperCase(), 34, 66, 1.5);

  ctx.fillStyle = navy ? '#ffffff' : COLORS.navy;
  ctx.font = `400 ${Math.round(height * 0.34)}px ${FONT_DISPLAY}`;
  const end = spaced(ctx, value, 30, height - 54, 2);
  ctx.fillStyle = navy ? '#c9c5f0' : COLORS.accent;
  ctx.font = `500 34px ${FONT_BODY}`;
  ctx.fillText(unit, end + 14, height - 56);
  return canvas;
}

/** Photo card with a paper frame and a caption underneath. */
export function photoCard(img: HTMLImageElement, caption: string, width = 520, imageAspect = 0.72, focusY = 0.5) {
  const pad = 18;
  const imgH = Math.round((width - pad * 2) * imageAspect);
  const height = imgH + pad * 2 + 92;
  const { canvas, ctx } = makeCanvas(width, height);
  roundRect(ctx, 2, 2, width - 4, height - 4, 22);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.line;
  ctx.stroke();

  ctx.save();
  roundRect(ctx, pad, pad, width - pad * 2, imgH, 14);
  ctx.clip();
  drawCover(ctx, img, pad, pad, width - pad * 2, imgH, focusY);
  ctx.restore();

  ctx.fillStyle = COLORS.text;
  ctx.font = `500 27px ${FONT_BODY}`;
  const lines = wrap(ctx, caption, width - pad * 2 - 8).slice(0, 2);
  lines.forEach((l, i) => ctx.fillText(l, pad + 4, pad + imgH + 42 + i * 34));
  return canvas;
}

/** Rounded backdrop card (a photo printed on card stock). */
export function backdropCard(img: HTMLImageElement, width: number, height: number, focusY = 0.5) {
  const { canvas, ctx } = makeCanvas(width, height);
  roundRect(ctx, 0, 0, width, height, 36);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.save();
  roundRect(ctx, 14, 14, width - 28, height - 28, 26);
  ctx.clip();
  drawCover(ctx, img, 14, 14, width - 28, height - 28, focusY);
  ctx.restore();
  return canvas;
}

/** Small paper tag, e.g. a callout label. */
export function tag(text: string, sub?: string) {
  const { ctx: m } = makeCanvas(10, 10);
  m.font = `400 34px ${FONT_DISPLAY}`;
  const w = Math.max(m.measureText(text).width + 80, 300);
  const h = sub ? 150 : 96;
  const { canvas, ctx } = makeCanvas(w, h);
  roundRect(ctx, 2, 2, w - 4, h - 4, 20);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.accent;
  ctx.stroke();
  ctx.fillStyle = COLORS.navy;
  ctx.font = `400 34px ${FONT_DISPLAY}`;
  ctx.fillText(text, 40, 62);
  if (sub) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `500 26px ${FONT_BODY}`;
    ctx.fillText(sub, 40, 112);
  }
  return canvas;
}
