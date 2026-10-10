import { PAGE_H, PAGE_W } from '../gl/book/Leaf';
import { buildPageCanvases, type Images, type PageCanvases } from '../gl/book/spreads';
import { PX } from '../gl/textures';

/** Section each spread previews (spread 0 is the cover). */
export const SPREAD_SECTIONS = ['performance', 'performance', 'exterior', 'interior', 'adas', 'specs', 'colors'];

const SCALE = 0.55; // output px per layout px
const TOP = 0.36; // room above the page for pieces that stand taller than it

/**
 * One spread drawn flat: the two pages side by side, with the pop-up pieces
 * standing on their fold lines like a pop-up seen from the front.
 */
function drawSpread(art: PageCanvases, spread: number) {
  const unit = PX * SCALE; // px per world unit
  const cover = spread === 0;
  const pages = cover ? 1 : 2;
  const c = document.createElement('canvas');
  c.width = Math.round(PAGE_W * pages * unit);
  c.height = Math.round((PAGE_H + TOP) * unit);
  const ctx = c.getContext('2d')!;
  const top = TOP * unit;

  ctx.save();
  ctx.shadowColor = 'rgba(14, 19, 48, 0.16)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  if (cover) {
    ctx.drawImage(art.pages[0].front, 0, top, unit, PAGE_H * unit);
  } else {
    ctx.drawImage(art.pages[spread - 1].back, 0, top, unit, PAGE_H * unit);
    ctx.drawImage(art.pages[spread].front, unit, top, unit, PAGE_H * unit);
  }
  ctx.restore();
  if (cover) return c;

  // pieces glued to this spread, back rows first
  const pieces = art.pieces
    .filter((p) => (p.leaf === spread - 1 && p.side === 'back') || (p.leaf === spread && p.side === 'front'))
    .sort((a, b) => a.opts.z - b.opts.z);
  for (const { x, canvas, opts } of pieces) {
    const w = opts.width * unit;
    // standing pieces lean back a little, so they look slightly shorter
    const h = w * (canvas.height / canvas.width) * Math.cos((opts.lean ?? 0.12) + 0.35);
    const cx = (x + PAGE_W) * unit;
    const fold = top + (opts.z + PAGE_H / 2) * unit;
    ctx.save();
    ctx.shadowColor = 'rgba(14, 19, 48, 0.22)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.drawImage(canvas, cx - w / 2, fold - h, w, h);
    ctx.restore();
  }
  return c;
}

/**
 * The pop-up book without WebGL (or with reduced motion): one still image per
 * spread, switched with the tabs, no scroll pinning.
 */
export function startStaticBook(
  images: Images,
  host: HTMLElement,
  tabs: HTMLButtonElement[],
  goToSection: (id: string) => void,
) {
  const art = buildPageCanvases(images);
  const spreads = SPREAD_SECTIONS.map((_, i) => {
    const c = drawSpread(art, i);
    c.className = 'book__flat-page';
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', i === 0 ? 'ปกหนังสือ BYD SEALION 7' : `หน้า ${tabs[i]?.textContent?.trim() ?? ''}`);
    c.tabIndex = -1;
    c.addEventListener('click', () => (i === 0 ? show(1) : goToSection(SPREAD_SECTIONS[i])));
    host.append(c);
    return c;
  });

  let current = -1;
  function show(i: number) {
    if (i === current) return;
    current = i;
    spreads.forEach((c, k) => c.classList.toggle('is-active', k === i));
    tabs.forEach((b, k) => b.classList.toggle('is-active', k === i));
  }
  show(0);
  tabs.forEach((b, i) => b.addEventListener('click', () => show(i)));
}
