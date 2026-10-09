import { ADAS_SYSTEMS, EXTERIOR_COLORS, KEY_SPECS, VARIANTS } from '../content/brochure';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

/** Fills the ADAS list, spec table and colour swatches from the brochure data. */
export function renderSections() {
  const adas = document.querySelector('[data-adas]');
  for (const sys of ADAS_SYSTEMS) {
    const item = el('div');
    item.append(el('dt', '', sys.code));
    const dd = el('dd');
    if (sys.name) dd.append(el('span', 'systems__name', sys.name));
    dd.append(el('span', '', sys.th));
    item.append(dd);
    adas?.append(item);
  }

  const table = document.querySelector('[data-specs]');
  if (table) {
    const head = el('thead');
    const hr = el('tr');
    hr.append(el('th', '', ''));
    VARIANTS.forEach((v) => {
      const th = el('th', '', v);
      th.scope = 'col';
      hr.append(th);
    });
    head.append(hr);
    const body = el('tbody');
    for (const row of KEY_SPECS) {
      const tr = el('tr');
      const th = el('th', '', row.label);
      th.scope = 'row';
      tr.append(th);
      row.values.forEach((v) => tr.append(el('td', '', v)));
      body.append(tr);
    }
    table.append(head, body);
  }

  const colors = document.querySelector('[data-colors]');
  for (const c of EXTERIOR_COLORS) {
    const li = el('li');
    const dot = el('span', 'swatches__dot');
    dot.style.background = c.swatch;
    const avail = c.availability.every(Boolean) ? 'ทุกรุ่น' : VARIANTS.filter((_, i) => c.availability[i]).join(' · ');
    li.append(dot, el('strong', '', c.name), el('span', 'swatches__avail', avail));
    colors?.append(li);
  }
}
