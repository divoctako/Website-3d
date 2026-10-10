import { EXTERIOR_COLORS, VARIANTS } from '../content/brochure';
import { pinProgress } from './pin';

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;

/** Mixes a hex colour into white; `amount` 0…1. */
function tint(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(255 + (c - 255) * amount);
  return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

/**
 * Colours: pinned; scrolling steps through the six colours until the visitor
 * picks one. The car photos cross-fade and the background takes ≤ 8% of the colour.
 */
export function startColors(reducedMotion: boolean) {
  const pin = $<HTMLElement>('[data-colors-pin]');
  const stage = $<HTMLElement>('[data-colors-stage]');
  const carHost = $<HTMLElement>('[data-color-car]');
  const name = $<HTMLElement>('[data-color-name]');
  const variants = $<HTMLElement>('[data-color-variants]');
  const swatches = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-colors] .swatch'));

  const cars = EXTERIOR_COLORS.map((c) => {
    const img = document.createElement('img');
    img.className = 'colors__img';
    img.alt = `BYD SEALION 7 สี ${c.name}`;
    img.decoding = 'async';
    img.dataset.src = `./assets/car-color-${c.id}-hd.webp`;
    carHost.append(img);
    return img;
  });
  // load the photos when the section gets close
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      for (const img of cars) img.src = img.dataset.src!;
    },
    { rootMargin: '100% 0px' },
  );
  io.observe(pin);

  const chips = VARIANTS.map((v) => {
    const li = document.createElement('li');
    li.textContent = v;
    variants.append(li);
    return li;
  });

  let shown = -1;
  let picked: number | null = null;
  const show = (i: number) => {
    if (i === shown) return;
    shown = i;
    const c = EXTERIOR_COLORS[i];
    cars.forEach((img, k) => img.classList.toggle('is-active', k === i));
    swatches.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    name.textContent = c.name;
    c.availability.forEach((has, k) => {
      chips[k].classList.toggle('is-off', !has);
      chips[k].setAttribute('aria-label', `${VARIANTS[k]}: ${has ? 'มี' : 'ไม่มี'}`);
    });
    stage.style.backgroundColor = tint(c.swatch, 0.08);
  };
  show(0);

  swatches.forEach((b, i) =>
    b.addEventListener('click', () => {
      picked = i;
      show(i);
    }),
  );
  // a pick holds until the section is scrolled away
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) picked = null;
  }).observe(pin);

  const onScroll = () => {
    if (picked !== null) return;
    const p = pinProgress(pin);
    show(Math.min(Math.floor(p * EXTERIOR_COLORS.length), EXTERIOR_COLORS.length - 1));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (reducedMotion) stage.classList.add('is-static');
}
