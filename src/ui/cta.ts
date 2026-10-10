import { BRANCHES, type Branch } from '../content/branches';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

const ICONS = {
  line: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s5.8-3.4 7.9-5.9C21.4 14.3 22 12.7 22 11c0-4.4-4.5-8-10-8z"/></svg>',
  messenger:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M12 2C6.4 2 2 6.1 2 11.7c0 2.9 1.2 5.5 3.2 7.3v3.5l3.3-1.8c1.1.3 2.3.5 3.5.5 5.6 0 10-4.1 10-9.7S17.6 2 12 2zm1 13l-2.5-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7L13 15z"/></svg>',
};

/** One CTA button; with no link yet it renders as a disabled "coming soon" pill. */
function ctaButton(kind: 'line' | 'messenger', href: string, branch: Branch) {
  const label = kind === 'line' ? 'เพิ่มเพื่อน LINE' : 'Messenger';
  const node = href ? el('a', `cta cta--${kind}`) : el('span', `cta cta--${kind} is-pending`);
  node.innerHTML = ICONS[kind];
  const text = el('span', '', label);
  if (!href) text.append(el('small', '', 'เร็ว ๆ นี้'));
  node.append(text);
  if (node instanceof HTMLAnchorElement) {
    node.href = href;
    node.target = '_blank';
    node.rel = 'noopener';
    node.setAttribute('aria-label', `${label} ${branch.name}`);
  } else {
    node.setAttribute('aria-disabled', 'true');
  }
  return node;
}

function ctaRow(branch: Branch) {
  const row = el('div', 'cta-row');
  row.append(ctaButton('line', branch.line, branch), ctaButton('messenger', branch.messenger, branch));
  return row;
}

function branchCard(branch: Branch) {
  const card = el('article', 'branch');
  card.append(el('h3', 'branch__name', branch.name));
  const address = el('address', 'branch__address', branch.address);
  const map = el('a', 'branch__map', 'Google Maps ↗');
  map.href = branch.map;
  map.target = '_blank';
  map.rel = 'noopener';
  address.append(el('br'), map);
  const phones = el('ul', 'branch__phones');
  branch.phones.forEach(({ label, number }) => {
    const li = el('li');
    const a = el('a', '', number);
    a.href = `tel:${number.replace(/\D/g, '')}`;
    li.append(el('span', '', label), a);
    phones.append(li);
  });
  card.append(address, phones, ctaRow(branch));
  return card;
}

/** Branch cards in Contact, plus the floating "ติดต่อเรา" sheet on phones. */
export function startCta() {
  document.querySelector('[data-branches]')?.append(...BRANCHES.map(branchCard));

  const fab = document.querySelector<HTMLButtonElement>('[data-cta-fab]');
  const sheet = document.querySelector<HTMLDialogElement>('[data-cta-sheet]');
  const list = sheet?.querySelector('[data-cta-list]');
  if (!fab || !sheet || !list) return;

  BRANCHES.forEach((branch) => {
    const group = el('div', 'cta-sheet__branch');
    group.append(el('p', 'cta-sheet__name', branch.name), ctaRow(branch));
    list.append(group);
  });

  fab.addEventListener('click', () => sheet.showModal());
  sheet.querySelector('[data-cta-close]')?.addEventListener('click', () => sheet.close());
  // a click on the backdrop lands on the dialog itself
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) sheet.close();
  });

  // visible once the book is behind us, hidden again where Contact shows the full buttons
  const start = document.querySelector<HTMLElement>('#performance');
  const branches = document.querySelector<HTMLElement>('[data-branches]');
  const update = () => {
    const vh = window.innerHeight;
    const past = !start || start.getBoundingClientRect().top < vh * 0.8;
    const atContact = !!branches && branches.getBoundingClientRect().top < vh;
    fab.classList.toggle('is-visible', past && !atContact);
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  // pinned sections and the book change the page height after load
  new ResizeObserver(update).observe(document.body);
  update();
}
