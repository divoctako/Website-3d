import { pinProgress, smoothstep } from './pin';

/** Contact: the rear view drives off into the white mist as the page ends. */
export function startContact(reducedMotion: boolean) {
  const pin = document.querySelector<HTMLElement>('[data-contact-pin]');
  const stage = document.querySelector<HTMLElement>('[data-contact-stage]');
  if (!pin || !stage) return;
  if (reducedMotion) {
    stage.classList.add('is-static');
    return;
  }
  const update = () => {
    const p = pinProgress(pin);
    const away = smoothstep(0.05, 0.95, p);
    stage.style.setProperty('--away', away.toFixed(4));
    stage.style.setProperty('--fog', smoothstep(0.35, 1, p).toFixed(4));
    stage.style.setProperty('--tag', smoothstep(0.55, 0.9, p).toFixed(4));
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}
