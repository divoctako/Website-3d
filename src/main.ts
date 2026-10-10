import './styles.css';
import 'lenis/dist/lenis.css';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Book, bookState, PAGE_STEPS, STEPS, stepForSpread } from './gl/book/Book';
import { IMAGE_SOURCES, type Images } from './gl/book/spreads';
import { loadImage, setPageResolution } from './gl/textures';
import { startColors } from './ui/colors';
import { startContact } from './ui/contact';
import { startCta } from './ui/cta';
import { renderSections, startStaticSections } from './ui/sections';
import { startStaticBook } from './ui/staticBook';

gsap.registerPlugin(ScrollTrigger);
renderSections();

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
// dev-only switches to try the fallbacks: ?reduced and ?nowebgl
const devFlag = (name: string) => import.meta.env.DEV && new URLSearchParams(location.search).has(name);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || devFlag('reduced');
const finePointer = window.matchMedia('(pointer: fine)').matches;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
const webgl = hasWebGL() && !devFlag('nowebgl');
// without WebGL, or with reduced motion, the book is a still image per spread
const staticBook = !webgl || reducedMotion;
document.documentElement.classList.toggle('no-webgl', !webgl);
document.documentElement.classList.toggle('static-book', staticBook);
document.documentElement.classList.toggle('reduced-motion', reducedMotion);

const canvas = $<HTMLCanvasElement>('[data-book-canvas]');
const bookEl = $<HTMLElement>('#book');
const loader = $<HTMLElement>('[data-loader]');
const fade = $<HTMLElement>('[data-fade]');
const hint = $<HTMLElement>('[data-hint]');
const nav = $<HTMLElement>('[data-nav]');
const navProgress = $<HTMLElement>('[data-progress]');
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-step]'));
const tabList = $<HTMLElement>('.book__tabs');

/** Portrait phones see one page at a time (must match Book.resize). */
const isPageMode = () => window.innerWidth / window.innerHeight < 0.8;
let pageMode = isPageMode();
const stepCount = () => (pageMode ? PAGE_STEPS : STEPS);

// one viewport of scroll per step, plus the viewport the stage itself fills
const setBookHeight = () => {
  bookEl.style.height = staticBook ? '' : `${(stepCount() + 1) * 100}vh`;
};
setBookHeight();

/* ---------------------------------------------------------- smooth scroll */

const lenis = new Lenis({ duration: 1.15, smoothWheel: !reducedMotion });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
if (import.meta.env.DEV) Object.assign(window, { __lenis: lenis });

// plain-DOM sections: no WebGL needed, so they don't wait for the book
startColors(reducedMotion);
startContact(reducedMotion);
startCta();

function scrollToStep(step: number) {
  const top = bookEl.offsetTop;
  const span = bookEl.offsetHeight - window.innerHeight;
  lenis.scrollTo(top + (span * step) / stepCount(), { duration: 1.4 });
}

function scrollToSection(id: string) {
  lenis.scrollTo(`#${id}`, { offset: -64, duration: reducedMotion ? 0 : 1.6, immediate: reducedMotion });
}

for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')!.slice(1);
    if (!id) return;
    e.preventDefault();
    if (id === 'top') lenis.scrollTo(0, { duration: 1.6, immediate: reducedMotion });
    else scrollToSection(id);
  });
}
if (!staticBook) tabs.forEach((b) => b.addEventListener('click', () => scrollToStep(stepForSpread(Number(b.dataset.step), pageMode))));
$('[data-skip]').addEventListener('click', () => scrollToSection('performance'));

ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate: (self) => {
    navProgress.style.transform = `scaleX(${self.progress})`;
  },
});

// nav shows once the book is behind us
ScrollTrigger.create({
  trigger: '#performance',
  start: 'top 80%',
  onToggle: (self) => nav.classList.toggle('is-visible', self.isActive),
  end: 'max',
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

function setActiveTab(active: number) {
  tabs.forEach((b, i) => b.classList.toggle('is-active', i === active));
  // keep the active tab in view when the tab row scrolls (phones)
  const tab = tabs[active];
  if (tab && tabList.scrollWidth > tabList.clientWidth) {
    tabList.scrollTo({ left: tab.parentElement!.offsetLeft - (tabList.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
  }
}

function boot3D(images: Images) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  // 14 page textures: lighter on phones, but a page fills the screen there, so not too light
  const small = Math.min(window.screen.width, window.screen.height) < 768;
  setPageResolution(small ? 0.85 : 1);
  const book = new Book(images, renderer);
  if (import.meta.env.DEV) Object.assign(window, { __book: book, __THREE: THREE });

  // never below 1.5× on high-density screens: lower looks blurry on phones
  const dprFloor = window.devicePixelRatio >= 2 ? 1.5 : 1;
  let dpr = Math.min(window.devicePixelRatio, 2);
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    book.resize(w, h);
    if (isPageMode() !== pageMode) {
      pageMode = isPageMode();
      setBookHeight();
      ScrollTrigger.refresh();
    }
  };
  resize();
  window.addEventListener('resize', resize);

  // our own scroll direction: ScrollTrigger's can be stale after a jump or a restored scroll
  let direction = 1;
  let lastY = window.scrollY;
  window.addEventListener(
    'scroll',
    () => {
      if (window.scrollY !== lastY) direction = window.scrollY > lastY ? 1 : -1;
      lastY = window.scrollY;
    },
    { passive: true },
  );

  // scroll → book position (in steps), snapping to whole steps
  let target = 0;
  let current = 0;
  ScrollTrigger.create({
    trigger: bookEl,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      target = self.progress * stepCount();
    },
    snap: {
      snapTo: (v: number) => {
        const n = stepCount();
        const q = v * n;
        // a fling can stop well past the book: leave the scroll alone then
        const end = bookEl.offsetTop + bookEl.offsetHeight - window.innerHeight;
        if (window.scrollY > end + 1) return v;
        // the last step is the dive into the page (all white): never park on it
        if (q > n - 1) {
          if (direction < 0) return (n - 1) / n; // coming back up: the last spread
          scrollToSection('performance'); // going down: carry on into the content
          return v;
        }
        return Math.round(q) / n;
      },
      duration: { min: 0.35, max: 0.9 },
      delay: 0.12,
      ease: 'power2.inOut',
    },
  });

  // pointer: tilt, clickable pop-ups and index tabs
  const pointAt = (e: PointerEvent | MouseEvent) => {
    const r = canvas.getBoundingClientRect();
    book.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  canvas.addEventListener('pointermove', (e) => {
    pointAt(e);
    canvas.classList.toggle('is-pointer', book.hitTab() >= 0 || Boolean(book.hitTest()?.section));
  });
  canvas.addEventListener('click', (e) => {
    pointAt(e);
    const tab = book.hitTab();
    if (tab >= 0) return scrollToStep(stepForSpread(tab, pageMode));
    const piece = book.hitTest();
    if (piece?.section) scrollToSection(piece.section);
  });

  // only render while the book is on screen
  let visible = true;
  new IntersectionObserver(([entry]) => {
    // coming back into view (e.g. scrolling up from the content, or after a nav jump):
    // start from where the scroll is, not from where the book was left
    if (entry.isIntersecting && !visible) current = target;
    visible = entry.isIntersecting;
  }).observe(bookEl);

  let activeTab = -1;
  let slowFor = 0;
  let last = performance.now();
  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!visible) return;

    current = THREE.MathUtils.damp(current, target, 7, dt);
    if (Math.abs(current - target) < 0.0005) current = target;
    const state = bookState(current, pageMode);
    book.update(state.p, dt, finePointer, state.focus);
    renderer.render(book.scene, book.camera);

    fade.style.opacity = String(book.diveAmount);
    hint.style.opacity = current < 0.15 ? '1' : '0';
    const active = Math.min(Math.round(state.p), STEPS - 1);
    if (active !== activeTab) {
      activeTab = active;
      setActiveTab(active);
      book.setActiveTab(active);
    }

    // drop resolution if frames are slow for a while
    slowFor = dt > 1 / 45 ? slowFor + dt : 0;
    if (slowFor > 2 && dpr > dprFloor) {
      dpr = Math.max(dprFloor, dpr - 0.5);
      slowFor = 0;
      resize();
    }
  });
}

async function boot() {
  const images = await loadAll((p) => loader.style.setProperty('--p', `${Math.round(p * 100)}%`));
  if (staticBook) startStaticBook(images, $('[data-book-flat]'), tabs, scrollToSection);
  else boot3D(images);
  loader.classList.add('is-done');
}

boot()
  .catch((err) => {
    console.error(err);
    loader.querySelector('span')!.textContent = 'ไม่สามารถโหลดหนังสือได้';
  })
  // section scenes (their own chunk) load after the book, so they don't hold up the first screen
  .then(async () => {
    if (!webgl) return startStaticSections();
    const { startFx } = await import('./ui/fx');
    await startFx(lenis, reducedMotion);
  })
  .catch((err) => console.error(err));
