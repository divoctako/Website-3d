import gsap from 'gsap';
import type Lenis from 'lenis';
import { ExteriorScene, EXTERIOR_FEATURES } from '../gl/fx/ExteriorScene';
import { FxStage } from '../gl/fx/FxStage';
import { InteriorScene, SHADES } from '../gl/fx/InteriorScene';
import { PerformanceScene } from '../gl/fx/PerformanceScene';
import { loadImage } from '../gl/textures';

const FX_IMAGES = {
  carSide: 'assets/car-side.webp',
  carFront: 'assets/car-front.webp',
  skyMist: 'assets/bg-sky-mist.webp',
  speedLines: 'assets/speed-lines.webp',
  headlight: 'assets/detail-headlight.webp',
  taillight: 'assets/detail-taillight.webp',
  wheel: 'assets/detail-wheel.webp',
  tailgate: 'assets/detail-tailgate.webp',
  interiorWide: 'assets/interior-wide.webp',
  interiorHud: 'assets/interior-hud.webp',
  interiorDash: 'assets/interior-dash.webp',
  interiorShifter: 'assets/interior-shifter.webp',
  interiorDms: 'assets/interior-dms.webp',
  interiorAudio: 'assets/interior-audio.webp',
  interiorRoof: 'assets/interior-roof.webp',
  interiorBlue: 'assets/interior-blue.webp',
} as const;

type FxImages = Record<keyof typeof FX_IMAGES, HTMLImageElement>;

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;

/** Progress 0…1 through a pinned wrapper (its sticky child fills the viewport). */
function pinProgress(pin: HTMLElement) {
  const r = pin.getBoundingClientRect();
  const span = r.height - window.innerHeight;
  return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
}

function scrollToPin(lenis: Lenis, pin: HTMLElement, progress: number) {
  const top = pin.getBoundingClientRect().top + window.scrollY;
  lenis.scrollTo(top + (pin.offsetHeight - window.innerHeight) * progress, { duration: 1.2 });
}

/** Performance figures count up the first time they come into view. */
function countUp(reducedMotion: boolean) {
  const stats = $<HTMLElement>('#performance .stats');
  const figures = Array.from(stats.querySelectorAll('dd')).map((dd) => {
    const node = dd.firstChild as Text;
    const text = node.textContent ?? '';
    return { node, value: parseFloat(text), decimals: (text.split('.')[1] ?? '').length, text };
  });
  if (reducedMotion) {
    stats.classList.add('is-in');
    return;
  }
  stats.classList.add('is-waiting');
  for (const f of figures) f.node.textContent = (0).toFixed(f.decimals);
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      stats.classList.add('is-in');
      figures.forEach((f, i) => {
        const o = { v: 0 };
        gsap.to(o, {
          v: f.value,
          duration: 1.6,
          delay: 0.15 + i * 0.08,
          ease: 'power3.out',
          onUpdate: () => (f.node.textContent = o.v.toFixed(f.decimals)),
          onComplete: () => (f.node.textContent = f.text),
        });
      });
    },
    { threshold: 0.35 },
  );
  io.observe(stats);
}

/**
 * M3: the second three.js canvas behind the Performance, Exterior and Interior
 * sections, plus their HTML bits (count-up, hotspots, feature list, beat button).
 */
export async function startFx(lenis: Lenis, reducedMotion: boolean) {
  countUp(reducedMotion);

  const entries = Object.entries(FX_IMAGES) as [keyof FxImages, string][];
  const images = Object.fromEntries(
    await Promise.all(entries.map(async ([k, src]) => [k, await loadImage(src)] as const)),
  ) as FxImages;

  const canvas = $<HTMLCanvasElement>('[data-fx-canvas]');
  const stage = new FxStage(canvas);
  const { renderer } = stage;

  /* performance */
  stage.add(new PerformanceScene($('[data-fx="performance"]'), images, renderer, reducedMotion));

  /* exterior */
  const extPin = $<HTMLElement>('[data-ext-pin]');
  const extItems = Array.from(document.querySelectorAll<HTMLLIElement>('#exterior .features li'));
  const hotspotLayer = $<HTMLElement>('[data-ext-hotspots]');
  const goToFeature = (i: number) => scrollToPin(lenis, extPin, (i + 0.5) / EXTERIOR_FEATURES.length);
  const hotspots = extItems.map((li, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hotspot';
    b.setAttribute('aria-label', li.textContent?.trim() ?? '');
    b.addEventListener('click', () => goToFeature(i));
    hotspotLayer.append(b);
    li.addEventListener('click', () => goToFeature(i));
    // explicit number: on phones only the active item is displayed, which breaks CSS counters
    li.dataset.n = String(i + 1).padStart(2, '0');
    return b;
  });
  const exterior = new ExteriorScene($('[data-fx="exterior"]'), hotspots, images, renderer, reducedMotion);
  const setActive = (i: number) => extItems.forEach((li, k) => li.classList.toggle('is-active', k === i));
  exterior.onActiveChange = setActive;
  setActive(0);
  stage.add(exterior);

  /* interior */
  const intPin = $<HTMLElement>('[data-int-pin]');
  const shadeLabel = $<HTMLElement>('[data-int-shade]');
  const beatBtn = $<HTMLButtonElement>('[data-int-beat]');
  const mood = $<HTMLElement>('.int__mood');
  const interior = new InteriorScene($('[data-fx="interior"]'), images, renderer, reducedMotion);
  interior.onShadeChange = (s) => {
    shadeLabel.textContent = `${s + 1} / ${SHADES}`;
  };
  beatBtn.addEventListener('click', () => {
    interior.beat = !interior.beat;
    beatBtn.setAttribute('aria-pressed', String(interior.beat));
  });
  stage.add(interior);

  if (import.meta.env.DEV) Object.assign(window, { __fx: { stage, exterior, interior } });

  let last = performance.now();
  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    exterior.target = pinProgress(extPin);
    interior.target = pinProgress(intPin);
    // the cards take over the screen in the second half
    mood.classList.toggle('is-hidden', interior.target > 0.42);
    stage.render(dt, now / 1000);
  });
}
