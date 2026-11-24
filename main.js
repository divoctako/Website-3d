const grid = document.querySelector('#model-grid');
const template = document.querySelector('#model-card');
const full = document.querySelector('#promo-full');
const contact = document.querySelector('#contact-dialog');
const message = document.querySelector('#line-message');
const revealOnScroll = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('scroll-arrived');
    revealOnScroll.unobserve(entry.target);
  }
}, {threshold:0.02}) : null;
document.querySelectorAll('.catalog-heading, .filter-bar, .showroom-layout').forEach(element => {
  revealOnScroll?.observe(element);
});
function render(filter) {
  const visible = models.filter(model => filter === 'all' || model.power === filter);
  for (const card of grid.children) revealOnScroll?.unobserve(card);
  grid.replaceChildren();
  for (const model of visible) {
    const card = template.content.cloneNode(true);
    const image = card.querySelector('img');
    image.src = 'assets/catalog/' + model.id + '.webp';

    card.querySelector('.power').textContent = model.power;
    card.querySelector('h3').textContent = 'BYD ' + model.name;
    card.querySelector('.offer-label').textContent = 'ราคารถ';
    card.querySelector('.offer-value').textContent = startingPrice(offers[model.id]);
    card.querySelector('[data-contact]').dataset.contact = model.id;
    card.querySelector('[data-details]').dataset.details = model.id;
    const page = card.querySelector('[data-details-link]');
    if (detailUrl(model.id)) {
      page.href = detailUrl(model.id);
      page.setAttribute('aria-label', 'รายละเอียด BYD ' + model.name);
    } else page.remove();
    const item = card.firstElementChild;
    grid.append(card);
    revealOnScroll?.observe(item);
  }
  document.querySelector('#model-count').textContent = visible.length + ' รุ่น';
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.hasAttribute('data-filter')) {
    document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    render(button.dataset.filter);
  }
  if (button.hasAttribute('data-details')) {
    openFull(models.find(item => item.id === button.dataset.details), button.closest('.model-card'));
  }
  if (button.classList.contains('offer-more') && active >= 0) openFull(models[active], offer);
  if (button.hasAttribute('data-full-close')) closeFull();
  if (button.hasAttribute('data-contact')) {
    const model = models.find(item => item.id === button.dataset.contact);
    document.querySelector('#message-block').hidden = !model;
    message.value = model ? 'สนใจสอบถามโปรโมชัน BYD ' + model.name + ' ของโชว์รูม BYD PI-R ครับ/ค่ะ' : '';
    document.querySelector('#copy-feedback').textContent = '';
    contact.showModal();
  }
});
document.querySelector('#copy-message').addEventListener('click', async () => {
  const feedback = document.querySelector('#copy-feedback');
  try {
    await navigator.clipboard.writeText(message.value);
    feedback.textContent = 'คัดลอกข้อความแล้ว';
  } catch {
    message.focus();
    message.select();
    feedback.textContent = document.execCommand('copy') ? 'คัดลอกข้อความแล้ว' : 'เลือกคำสั่งคัดลอกจากข้อความที่เลือกไว้';
  }
});
contact.addEventListener('click', event => { if (event.target === contact) contact.close(); });

/* ---- full promotion: a glass panel that grows out of the card that was tapped ----
   FLIP: the panel opens at its final size, then a transform starts it at the card's box and
   eases it to none. Only transform/opacity animate (GPU), and the panel's backdrop blur is
   switched on once it has landed, so the morph stays smooth on phones. */
let fullFrom = null;
const fullEase = 'cubic-bezier(.2,.8,.2,1)';
function listItems(lines, fill) {
  return lines.map(line => {
    const item = document.createElement('li');
    fill(item, line);
    return item;
  });
}
function fromTransform(from) {
  const a = from.getBoundingClientRect(), b = full.getBoundingClientRect();
  return `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`;
}
function onScreen(element) {
  const box = element?.getBoundingClientRect();
  return Boolean(box && box.width > 0 && box.bottom > 0 && box.top < innerHeight);
}
function openFull(model, from) {
  if (!model || full.open) return;
  const promotion = offers[model.id];
  document.querySelector('#promo-full-model').textContent = 'BYD ' + model.name;
  document.querySelector('#promo-full-title').textContent = startingPrice(promotion);
  document.querySelector('#promo-full-trims').replaceChildren(...listItems(Object.entries(promotion.prices), (item, [name, price]) => {
    item.append(Object.assign(document.createElement('span'), {textContent: name}), Object.assign(document.createElement('b'), {textContent: baht(price)}));
  }));
  document.querySelector('#promo-full-perks').replaceChildren(...listItems(offerDetails(promotion), (item, line) => { item.textContent = line; }));
  document.querySelector('#promo-full-contact').dataset.contact = model.id;
  const detail = document.querySelector('#promo-full-detail');
  detail.hidden = !detailUrl(model.id);
  if (detailUrl(model.id)) detail.href = detailUrl(model.id);
  fullFrom = onScreen(from) ? from : null;
  full.classList.remove('is-settled');
  full.showModal();
  full.scrollTop = 0;
  if (reduced.matches || !fullFrom) return full.classList.add('is-settled');
  full.animate([{transform: fromTransform(fullFrom), opacity: .55}, {transform: 'none', opacity: 1}], {duration: 480, easing: fullEase});
  full.firstElementChild.animate([{opacity: 0}, {opacity: 0, offset: .4}, {opacity: 1}], {duration: 480});
  try { full.animate([{opacity: 0}, {opacity: 1}], {duration: 480, pseudoElement: '::backdrop'}); } catch {}
  fullFrom.style.visibility = 'hidden';
  setTimeout(() => { if (full.open && !full.dataset.closing) full.classList.add('is-settled'); }, 480);
}
function closeFull() {
  if (!full.open || full.dataset.closing) return;
  const from = fullFrom;
  let closed = false;
  const done = () => {
    if (closed) return;
    closed = true;
    full.getAnimations({subtree: true}).forEach(animation => animation.cancel());
    delete full.dataset.closing;
    full.close();
    if (from) from.style.visibility = '';
  };
  if (reduced.matches || !from) return done();
  full.dataset.closing = '1';
  full.classList.remove('is-settled');
  full.firstElementChild.animate([{opacity: 1}, {opacity: 0, offset: .45}, {opacity: 0}], {duration: 380, fill: 'forwards'});
  try { full.animate([{opacity: 1}, {opacity: 0}], {duration: 380, pseudoElement: '::backdrop', fill: 'forwards'}); } catch {}
  full.animate([{transform: 'none', opacity: 1}, {transform: fromTransform(from), opacity: .55}], {duration: 380, easing: fullEase, fill: 'forwards'})
    .finished.then(done, done);
  setTimeout(done, 460); // the panel must always close, even if the browser stops running animations
}
full.addEventListener('cancel', event => { event.preventDefault(); closeFull(); });
full.addEventListener('click', event => { if (event.target === full) closeFull(); });
render('all');

const rail = document.querySelector('.album-scroll');
const track = rail.firstElementChild;
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const openingIndex = 1;
const slots = models.map((model, index) => {
  const slot = document.createElement('div');
  slot.className = 'album-slot';
  const cover = document.createElement('button');
  cover.className = 'album-cover';
  cover.setAttribute('aria-label', 'เลือก BYD ' + model.name);
  const artwork = document.createElement('img');
  artwork.src = 'assets/brochures/' + model.id + '.webp';
  artwork.width = 800;
  artwork.height = 1200;
  artwork.alt = '';
  cover.append(artwork);
  cover.addEventListener('click', () => {
    if (index === active && detailUrl(model.id)) location.href = detailUrl(model.id);
    else go(index);
  });
  const reflection = document.createElement('div');
  reflection.className = 'album-cover album-reflection';
  reflection.setAttribute('aria-hidden', 'true');
  reflection.append(...Array.from(cover.children, element => element.cloneNode(true)));
  slot.append(cover, reflection);
  track.append(slot);
  return slot;
});
const offer = document.querySelector('.album-offer');
// the intro has already faded the card in, so it just becomes interactive (no second fade)
document.addEventListener('brand-intro-finished', () => {
  if (active >= 0 && pendingOffer === -1) displayOffer(models[active], false);
}, {once:true});
let revealTimer;
let pendingOffer = -1;
let active = -1;
function show(position) {
  const index = Math.max(0, Math.min(models.length - 1, Math.round(position)));
  slots.forEach((slot, i) => {
    const distance = i - position;
    const offset = Math.abs(distance);
    const brightness = .64 + .36 * Math.exp(-.8 * offset * offset);
    slot.style.setProperty('--cover-brightness', String(brightness));
    const tilt = 50 * offset / (offset + .45);
    slot.style.zIndex = String(1000 - Math.round(offset * 100));
    slot.style.setProperty('--angle', (-Math.sign(distance) * tilt) + 'deg');
    slot.style.setProperty('--depth', (-320 * Math.log1p(offset)) + 'px');
    slot.firstChild.tabIndex = i === index ? 0 : -1;
  });
  if (active !== index || pendingOffer === index) {
    clearTimeout(revealTimer);
    pendingOffer = index;
    offer.inert = true;
    offer.style.opacity = '0';
    revealTimer = setTimeout(() => {
      pendingOffer = -1;
      displayOffer(models[index]);
    }, reduced.matches ? 0 : 160);
  }
  if (active === index) return;
  active = index;

  previous.disabled = index === 0;
  next.disabled = index === models.length - 1;
  document.querySelector('#album-count').textContent = String(index + 1).padStart(2,'0') + ' / ' + String(models.length).padStart(2,'0');
}
function displayOffer(model, animate = true) {
  const benefits = offerHighlights(offers[model.id]);
  document.querySelector('#album-benefits').replaceChildren(...benefits.map(text => {
    const item = document.createElement('li');
    item.textContent = text;
    return item;
  }));
  const modelLink = document.querySelector('#offer-model');
  modelLink.textContent = 'BYD ' + model.name;
  if (detailUrl(model.id)) {
    modelLink.href = detailUrl(model.id);
    modelLink.append(Object.assign(document.createElement('span'), {textContent: ' · ดูรายละเอียด →'}));
  } else modelLink.removeAttribute('href');
  document.querySelector('#album-offer').textContent = startingPrice(offers[model.id]);
  if (document.querySelector('.brand-intro[open]')) return;
  offer.inert = false;
  offer.style.opacity = '1';
  offer.getAnimations().forEach(animation => animation.cancel());
  if (animate && !reduced.matches) {
    offer.animate([{opacity: 0, translate: '0 22px'}, {opacity: 1, translate: '0 0'}], {
      duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)'
    });
  }
}
// slot width, read once (reading it on every scroll forced a style recalc per frame); reset on resize
let slotWidth = 0;
function step() { return slotWidth ||= parseFloat(getComputedStyle(slots[0]).width); }
function go(index, behavior = reduced.matches ? 'instant' : 'smooth') {
  rail.scrollTo({left: index * step(), behavior});
}
// one cover-flow update per frame, however many scroll events arrive
let pendingShow = 0;
rail.addEventListener('scroll', () => {
  if (!pendingShow) pendingShow = requestAnimationFrame(() => { pendingShow = 0; show(rail.scrollLeft / step()); });
}, {passive:true});
previous.onclick = () => go(active - 1);
next.onclick = () => go(active + 1);
rail.onkeydown = event => {
  const direction = {ArrowLeft:-1,ArrowRight:1}[event.key];
  if (!direction) return;
  event.preventDefault();
  rail.focus({preventScroll:true});
  go(active + direction);
};
let lastWheel = 0;
rail.addEventListener('wheel', event => {
  if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
  const target = active + Math.sign(event.deltaY);
  if (target < 0 || target >= models.length) return;
  event.preventDefault();
  const now = performance.now();
  if (now - lastWheel > 240) go(target);
  lastWheel = now;
}, {passive:false});
window.addEventListener('resize', () => { slotWidth = 0; go(active, 'instant'); });
go(openingIndex, 'instant');
show(openingIndex);
