const AI_KEYWORDS = [
  '含AI生成内容',
  'AI生成',
  'AI合成',
  'AI技术合成',
  'AI技术生成',
  '人工智能生成',
  '疑似AI',
  '疑似使用AI',
  'AIGC',
];

const PROCESSED_ATTR = 'data-bilipure-checked';
const aiVideoIds = new Set<string>();

export function registerAIVideo(bvid: string): void {
  aiVideoIds.add(bvid);
}

export function isAIContent(card: Element): boolean {
  if (card.hasAttribute(PROCESSED_ATTR)) {
    return card.getAttribute(PROCESSED_ATTR) === 'ai';
  }

  let isAI = false;

  const link = card.querySelector('a[href*="/video/BV"]');
  if (link) {
    const href = link.getAttribute('href') || '';
    const match = href.match(/\/(BV[a-zA-Z0-9]+)/);
    if (match && aiVideoIds.has(match[1])) {
      isAI = true;
    }
  }

  if (!isAI) {
    const text = card.textContent || '';
    isAI = AI_KEYWORDS.some((kw) => text.includes(kw));
  }

  card.setAttribute(PROCESSED_ATTR, isAI ? 'ai' : 'clean');
  return isAI;
}

export function markCardDirty(card: Element): void {
  card.removeAttribute(PROCESSED_ATTR);
}

export function isProcessed(card: Element): boolean {
  return card.hasAttribute(PROCESSED_ATTR);
}

export { aiVideoIds };
