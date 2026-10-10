import { ADAS_SYSTEMS, EXTERIOR_COLORS, KEY_SPECS, VARIANTS } from '../content/brochure';
import { NO, SPEC_NOTES, SPEC_TABLE, YES, type SpecValues } from '../content/specTable';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

/** Value cells, with equal neighbours merged like the brochure prints them. */
function valueCells(values: SpecValues) {
  const cells: HTMLTableCellElement[] = [];
  for (let i = 0; i < values.length; ) {
    let span = 1;
    while (i + span < values.length && values[i + span] === values[i]) span++;
    const v = values[i];
    const td = el('td', v === YES ? 'is-yes' : v === NO ? 'is-no' : '', v);
    if (v === YES) td.setAttribute('aria-label', 'มี');
    if (v === NO) td.setAttribute('aria-label', 'ไม่มี');
    if (span > 1) td.colSpan = span;
    cells.push(td);
    i += span;
  }
  return cells;
}

function headRow() {
  const tr = el('tr');
  tr.append(el('th', '', ''));
  VARIANTS.forEach((v) => {
    const th = el('th', '', v);
    th.scope = 'col';
    tr.append(th);
  });
  return tr;
}

/** Fills the ADAS list, spec tables and colour swatches from the brochure data. */
export function renderSections() {
  const adas = document.querySelector('[data-adas]');
  ADAS_SYSTEMS.forEach((sys, i) => {
    const li = el('li');
    const b = el('button', 'adas__item', sys.code);
    b.type = 'button';
    b.dataset.i = String(i);
    b.setAttribute('aria-label', [sys.code, sys.name, sys.th].filter(Boolean).join(' · '));
    li.append(b);
    adas?.append(li);
  });

  const table = document.querySelector('[data-specs]');
  if (table) {
    const head = el('thead');
    head.append(headRow());
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

  renderSpecTable();

  const colors = document.querySelector('[data-colors]');
  EXTERIOR_COLORS.forEach((c, i) => {
    const li = el('li');
    const b = el('button', 'swatch');
    b.type = 'button';
    b.dataset.i = String(i);
    b.setAttribute('aria-pressed', 'false');
    const dot = el('span', 'swatch__dot');
    dot.style.background = c.swatch;
    b.append(dot, el('span', 'swatch__name', c.name));
    li.append(b);
    colors?.append(li);
  });
}

/** The full page-4 table: one collapsible group per category. */
function renderSpecTable() {
  const host = document.querySelector<HTMLElement>('[data-spec-groups]');
  if (!host) return;
  SPEC_TABLE.forEach((group, g) => {
    const details = el('details', 'spec-group');
    details.open = g === 0;
    const summary = el('summary');
    const diff = group.rows.filter((r) => new Set(r.values).size > 1).length;
    summary.append(el('span', 'spec-group__title', group.title), el('span', 'spec-group__count', `${group.rows.length} รายการ`));
    summary.dataset.diff = String(diff);
    const wrap = el('div', 'table-wrap');
    const table = el('table', 'spec-table spec-table--full');
    const head = el('thead');
    head.append(headRow());
    const body = el('tbody');
    for (const row of group.rows) {
      const differs = new Set(row.values).size > 1;
      const tr = el('tr', differs ? 'is-diff' : 'is-same');
      const th = el('th', '', row.label);
      th.scope = 'row';
      tr.append(th, ...valueCells(row.values));
      body.append(tr);
    }
    table.append(head, body);
    wrap.append(table);
    details.append(summary, wrap);
    if (!diff) details.classList.add('has-no-diff');
    host.append(details);
  });

  const notes = document.querySelector('[data-spec-notes]');
  for (const n of SPEC_NOTES) notes?.append(el('li', '', n));

  // "show only what differs": hide equal rows, and groups where every row is equal
  const toggle = document.querySelector<HTMLInputElement>('[data-spec-diff]');
  toggle?.addEventListener('change', () => {
    host.classList.toggle('is-diff-only', toggle.checked);
    if (toggle.checked) host.querySelectorAll<HTMLDetailsElement>('.spec-group:not(.has-no-diff)').forEach((d) => (d.open = true));
  });
}
