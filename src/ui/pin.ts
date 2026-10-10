import type Lenis from 'lenis';

/** Progress 0…1 through a pinned wrapper (its sticky child fills the viewport). */
export function pinProgress(pin: HTMLElement) {
  const r = pin.getBoundingClientRect();
  const span = r.height - window.innerHeight;
  return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
}

export function scrollToPin(lenis: Lenis, pin: HTMLElement, progress: number) {
  const top = pin.getBoundingClientRect().top + window.scrollY;
  lenis.scrollTo(top + (pin.offsetHeight - window.innerHeight) * progress, { duration: 1.2 });
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
