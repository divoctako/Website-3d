import './styles.css';
import 'lenis/dist/lenis.css';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Book, STEPS } from './gl/book/Book';
import { IMAGE_SOURCES, type Images } from './gl/book/spreads';
import { loadImage, setPageResolution } from './gl/textures';
import { startColors } from './ui/colors';
import { startContact } from './ui/contact';
import { startFx } from './ui/fx';
import { renderSections } from './ui/sections';

gsap.registerPlugin(ScrollTrigger);
renderSections();

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

const canvas = $<HTMLCanvasElement>('[data-book-canvas]');
const bookEl = $<HTMLElement>('#book');
const loader = $<HTMLElement>('[data-loader]');
const fade = $<HTMLElement>('[data-fade]');
const hint = $<HTMLElement>('[data-hint]');
const nav = $<HTMLElement>('[data-nav]');
const navProgress = $<HTMLElement>('[data-progress]');
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-step]'));
const tabList = $<HTMLElement>('.book__tabs');

// one viewport of scroll per step, plus the viewport the stage itself fills
bookEl.style.height = `${(STEPS + 1) * 100}vh`;

/* ---------------------------------------------------------- smooth scroll */

const lenis = new Lenis({ duration: 1.15, smoothWheel: !reducedMotion });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
if (import.meta.env.DEV) Object.assign(window, { __lenis: lenis });

// plain-DOM sections: no WebGL needed, so they don't wait for the book
startColors(reducedMotion);
startContact(reducedMotion);

function scrollToStep(step: number) {
  const top = bookEl.offsetTop;
  const span = bookEl.offsetHeight - window.innerHeight;
  lenis.scrollTo(top + (span * step) / STEPS, { duration: 1.4 });
}

function scrollToSection(id: string) {
  lenis.scrollTo(`#${id}`, { offset: -64, duration: 1.6 });
}

for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')!.slice(1);
    if (!id) return;
    e.preventDefault();
    if (id === 'top') lenis.scrollTo(0, { duration: 1.6 });
    else scrollToSection(id);
  });
}
tabs.forEach((b) => b.addEventListener('click', () => scrollToStep(Number(b.dataset.step))));
$('[data-skip]').addEventListener('click', () => scrollToSection('performance'));

ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate: (self) => {
    navProgress.style.transform = `scaleX(${self.progress})`;
  },
});

/* ------------------------------------------------------------------ boot */

async function loadAll(onProgress: (p: number) => void) {
  const fonts = Promise.all([
    document.fonts.load("400 40px 'Michroma'"),
    document.fonts.load("400 40px 'IBM Plex Sans Thai'"),
    document.fonts.load("500 40px 'IBM Plex Sans Thai'"),
    document.fonts.load("600 40px 'IBM Plex Sans Thai'"),
  ]).catch(() => undefined);

  const entries = Object.entries(IMAGE_SOURCES) as [keyof Images, string][];
  let done = 0;
  const images = await Promise.all(
    entries.map(async ([key, src]) => {
      const img = await loadImage(src);
      onProgress(++done / (entries.length + 1));
      return [key, img] as const;
    }),
  );
  await fonts;
  onProgress(1);
  return Object.fromEntries(images) as Images;
}

async function boot() {
  const images = await loadAll((p) => loader.style.setProperty('--p', `${Math.round(p * 100)}%`));

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  // 14 page textures: keep them lighter on phones
  const small = Math.min(window.screen.width, window.screen.height) < 768;
  setPageResolution(small ? 0.7 : 1);
  const book = new Book(images, renderer);
  if (import.meta.env.DEV) Object.assign(window, { __book: book, __THREE: THREE });

  let dpr = Math.min(window.devicePixelRatio, 2);
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    book.resize(w, h);
  };
  resize();
  window.addEventListener('resize', resize);

  // scroll → book progress (in steps), snapping to whole spreads
  let target = 0;
  let current = 0;
  ScrollTrigger.create({
    trigger: bookEl,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      target = self.progress * STEPS;
    },
    snap: reducedMotion
      ? undefined
      : { snapTo: 1 / STEPS, duration: { min: 0.35, max: 0.9 }, delay: 0.12, ease: 'power2.inOut' },
  });

  // nav shows once the book is behind us
  ScrollTrigger.create({
    trigger: '#performance',
    start: 'top 80%',
    onToggle: (self) => nav.classList.toggle('is-visible', self.isActive),
    end: 'max',
  });

  // pointer: tilt + clickable pop-ups
  let hovered: ReturnType<Book['hitTest']> = null;
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    book.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    hovered = book.hitTest();
    canvas.classList.toggle('is-pointer', Boolean(hovered?.section));
  });
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    book.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const piece = book.hitTest();
    if (piece?.section) scrollToSection(piece.section);
  });

  // only render while the book is on screen
  let visible = true;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(bookEl);

  // drop resolution if frames are slow for a while
  let activeTab = -1;
  let slowFor = 0;
  let last = performance.now();
  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!visible) return;

    current = reducedMotion ? target : THREE.MathUtils.damp(current, target, 7, dt);
    if (Math.abs(current - target) < 0.0005) current = target;
    book.update(current, dt, finePointer && !reducedMotion);
    renderer.render(book.scene, book.camera);

    fade.style.opacity = String(book.diveAmount);
    hint.style.opacity = current < 0.15 ? '1' : '0';
    const active = Math.min(Math.round(current), STEPS - 1);
    if (active !== activeTab) {
      activeTab = active;
      tabs.forEach((b, i) => b.classList.toggle('is-active', i === active));
      // keep the active tab in view when the tab row scrolls (phones)
      const tab = tabs[active];
      if (tab && tabList.scrollWidth > tabList.clientWidth) {
        tabList.scrollTo({ left: tab.parentElement!.offsetLeft - (tabList.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
      }
    }

    slowFor = dt > 1 / 45 ? slowFor + dt : 0;
    if (slowFor > 2 && dpr > 1) {
      dpr = Math.max(1, dpr - 0.5);
      slowFor = 0;
      resize();
    }
  });

  loader.classList.add('is-done');
}

boot()
  .catch((err) => {
    console.error(err);
    loader.querySelector('span')!.textContent = 'ไม่สามารถโหลดหนังสือได้';
  })
  // section scenes load after the book, so they don't hold up the first screen
  .then(() => startFx(lenis, reducedMotion))
  .catch((err) => console.error(err));
