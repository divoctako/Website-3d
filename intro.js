(() => {
  const intro = document.querySelector('.brand-intro');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || location.hash || !intro.showModal) {
    intro.remove();
    return;
  }

  const scene = intro.querySelector('svg');
  const windowPane = intro.querySelector('.intro-window');
  // The ring fades while the scene zooms, so it gets its own SVG layer: fading it then only
  // changes that layer's opacity, and the scene layer is never repainted mid-zoom.
  const rimLayer = scene.cloneNode(false);
  rimLayer.removeAttribute('aria-label');
  rimLayer.removeAttribute('role');
  rimLayer.setAttribute('aria-hidden', 'true');
  rimLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  rimLayer.append(scene.querySelector('ellipse'));
  scene.after(rimLayer);
  const layers = [scene, rimLayer];
  let frame;
  let start;
  let timeout;
  // The album is parsed after this script, so these are looked up lazily (once they exist).
  let album;     // .album: carries --intro-reveal, which fades the price card and arrows in during the fly-through
  let rail;      // .album-scroll: scaled with --arrival-scale (set on it, not on <html>, so only it restyles)
  let target;    // {y, width} of the front cover, measured once instead of every frame
  let flyFrom;   // SVG scale when the fly-through starts (from then on it is a CSS transform)
  const START_SCALE = .78;

  function finish() {
    cancelAnimationFrame(frame);
    clearTimeout(timeout);
    reduced.removeEventListener('change', finish);
    window.removeEventListener('pagehide', finish);
    window.removeEventListener('resize', remeasure);
    if (intro.open) intro.close();
    intro.remove();
    rail?.style.removeProperty('--arrival-scale');
    album?.style.removeProperty('--intro-reveal');
    rail?.style.removeProperty('will-change');
    document.dispatchEvent(new Event('brand-intro-finished'));
  }

  let size;      // the intro's own box: on phones it can be taller than innerHeight (see album.css)
  function remeasure() { target = undefined; size = undefined; }

  /** front cover centre and width at START_SCALE; the scale origin sits on the cover centre, so y stays put */
  function measure(scale) {
    rail ??= document.querySelector('.album-scroll');
    if (rail && !rail.style.willChange) rail.style.willChange = 'transform';
    if (target) return target;
    const cover = document.querySelector('.album-cover[tabindex="0"]')?.getBoundingClientRect();
    if (!cover || !cover.width) return null;
    target = { y: cover.top + cover.height / 2, width: cover.width / scale * START_SCALE };
    return target;
  }

  const hold = 700, approach = 1250, preview = 300, fly = 1500;
  const landing = 450;
  const duration = hold + approach + preview + fly + landing;
  function smooth(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * t * (t * (6 * t - 15) + 10);
  }

  function draw(now) {
    frame = requestAnimationFrame(draw);
    start ??= now;
    const elapsed = now - start;
    if (elapsed >= duration) return finish();
    if (!size) {
      const box = { width: intro.clientWidth || innerWidth, height: intro.clientHeight || innerHeight };
      if (!(box.width > 0 && box.height > 0)) return; // hidden / not laid out yet: wait for a real size (avoids NaN viewBox)
      size = box;
    }
    const { width, height } = size;

    const aim = smooth((elapsed - hold) / approach);
    const flight = smooth((elapsed - hold - approach - preview) / fly);
    const arrival = smooth((elapsed - hold - approach - preview) / (fly + landing));
    const dissolve = smooth((flight - .12) / .64);
    const arrivalScale = START_SCALE + (1 - START_SCALE) * arrival;
    const cover = measure(arrivalScale);
    const fade = 1 - smooth((flight - .48) / .48);
    scene.style.opacity = String(fade);
    rimLayer.style.opacity = String((1 - dissolve) * fade);
    rail?.style.setProperty('--arrival-scale', String(arrivalScale));
    album ??= document.querySelector('.album');
    album?.style.setProperty('--intro-reveal', smooth((elapsed - hold - approach - preview - fly * .3) / (fly * .7 + landing)).toFixed(3));

    const targetY = cover ? Math.max(0, Math.min(height, cover.y)) : height / 2;
    const coverWidth = cover ? cover.width / START_SCALE * arrivalScale : width * .5;
    const initialScale = Math.min(width * .68 / 557, .93);
    const previewScale = Math.min(width * .90, coverWidth * 1.25) / 36;
    const finalScale = Math.hypot(width / 2, Math.max(targetY, height - targetY)) / 16;
    const scale = initialScale * (previewScale / initialScale) ** aim * (finalScale / previewScale) ** flight;
    const x = 278.5 + (396.5 - 278.5) * aim;
    const y = 48 - (targetY - height / 2) * aim / scale;
    const w = width / scale, h = height / scale;
    const box = [x - w / 2, y - h / 2, w, h];
    if (!box.every(Number.isFinite)) return;
    if (elapsed < hold + approach + preview) {
      const viewBox = box.map((v) => v.toFixed(3)).join(' ');
      for (const layer of layers) layer.setAttribute('viewBox', viewBox);
    } else {
      // The fly-through only zooms about the circle centre (fixed at width/2, targetY), so after
      // the last viewBox it is a plain CSS scale: the GPU stretches the already-drawn layer instead
      // of the SVG being redrawn every frame — this is the part that stuttered on phones.
      if (!flyFrom) {
        flyFrom = scale;
        const viewBox = box.map((v) => v.toFixed(3)).join(' ');
        for (const layer of layers) {
          layer.setAttribute('viewBox', viewBox);
          layer.style.transformOrigin = `${width / 2}px ${targetY}px`;
          layer.style.willChange = 'transform, opacity';
        }
      }
      const zoom = `scale(${(scale / flyFrom).toFixed(4)})`;
      for (const layer of layers) layer.style.transform = zoom;
    }
    windowPane.style.opacity = String(1 - smooth((elapsed - hold - 280) / 780));
  }

  intro.showModal();
  intro.addEventListener('cancel', event => { event.preventDefault(); finish(); });
  reduced.addEventListener('change', finish);
  window.addEventListener('pagehide', finish);
  window.addEventListener('resize', remeasure);
  timeout = setTimeout(finish, duration + 350);
  draw(performance.now()); // first frame right away, so the logo never shows without its viewBox
})();
