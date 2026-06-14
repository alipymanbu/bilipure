const FILTER_ATTR = 'data-bilipure-filtered';

export function applyFilter(card: HTMLElement, _mode: 'hide'): void {
  if (card.hasAttribute(FILTER_ATTR)) return;
  card.setAttribute(FILTER_ATTR, 'hide');
  card.style.display = 'none';
}

export function clearFilter(card: HTMLElement): void {
  if (!card.hasAttribute(FILTER_ATTR)) return;
  card.removeAttribute(FILTER_ATTR);
  card.style.display = '';
}
