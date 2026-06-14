import { incrementFiltered } from '@/utils/storage';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'FILTER_COUNT') {
      incrementFiltered(message.count);
      updateBadge(message.sessionTotal);
    }
  });
});

function updateBadge(count: number): void {
  const text = count > 0 ? String(count) : '';
  browser.action.setBadgeText({ text });
  browser.action.setBadgeBackgroundColor({ color: '#22c55e' });
}
