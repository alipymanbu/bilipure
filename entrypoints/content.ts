import { isAIContent, markCardDirty, registerAIVideo, aiVideoIds } from '@/utils/detector';
import { applyFilter, clearFilter } from '@/utils/filter';
import { watchSettings, type FilterMode } from '@/utils/storage';

const VIDEO_CARD_SELECTORS = [
  '.feed-card',
  '.bili-video-card',
  '.video-card',
  '.floor-single-card',
  '.video-page-card-small',
  '.video-page-special-card-small',
  '.card-box',
  '.video-list-item',
  '.search-video-card',
].join(', ');

const BANNER_ID = 'bilipure-ai-banner';
const BLOCK_OVERLAY_ID = 'bilipure-block-overlay';

let currentEnabled = true;
let currentMode: FilterMode = 'warn';
let sessionCount = 0;
let currentPageIsAI = false;
let currentPageArgueMsg = '';
let scanTimer: ReturnType<typeof setTimeout> | null = null;

export default defineContentScript({
  matches: ['*://*.bilibili.com/*'],
  runAt: 'document_idle',
  main() {
    watchSettings((settings) => {
      const wasEnabled = currentEnabled;
      const wasMode = currentMode;
      currentEnabled = settings.enabled;
      currentMode = settings.filterMode;

      if (!currentEnabled && wasEnabled) {
        clearAllFilters();
        removeBanner();
        removeBlockOverlay();
      } else if (currentEnabled) {
        if (wasMode !== currentMode) {
          removeBanner();
          removeBlockOverlay();
        }
        reapplyAllFilters();
        if (currentPageIsAI && isVideoPage()) {
          applyVideoPageAction(currentPageArgueMsg);
        }
      }
    });

    window.addEventListener('bilipure:ai-detected', ((e: CustomEvent) => {
      if (!currentEnabled) return;
      const { bvid } = e.detail || {};
      if (bvid) {
        registerAIVideo(bvid);
        debouncedRescan();
        checkCurrentVideoPage();
      }
    }) as EventListener);

    if (isVideoPage()) {
      fetchCurrentVideoInfo();
    }

    observeUrlChange();
    scanExisting();
    observeNewCards();
  },
});

// ===== Helpers =====

function isVideoPage(): boolean {
  return /\/video\/BV/.test(location.pathname);
}

function getCurrentBvid(): string | null {
  const match = location.pathname.match(/\/(BV[a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function debouncedRescan(): void {
  if (scanTimer) clearTimeout(scanTimer);
  scanTimer = setTimeout(() => {
    scanTimer = null;
    rescanCards();
  }, 100);
}

// ===== Video Page Detection =====

function fetchCurrentVideoInfo(): void {
  const bvid = getCurrentBvid();
  if (!bvid) return;

  if (aiVideoIds.has(bvid)) {
    currentPageIsAI = true;
    if (currentEnabled) {
      applyVideoPageAction(currentPageArgueMsg);
      notifyFiltered(1);
    }
    return;
  }

  fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`)
    .then((r) => r.json())
    .then((data) => {
      if (data?.code !== 0) return;
      const argueMsg = data.data?.argue_info?.argue_msg;
      if (argueMsg && argueMsg.includes('AI')) {
        registerAIVideo(bvid);
        currentPageIsAI = true;
        currentPageArgueMsg = argueMsg;
        if (currentEnabled) {
          applyVideoPageAction(argueMsg);
          notifyFiltered(1);
        }
      } else {
        currentPageIsAI = false;
        currentPageArgueMsg = '';
      }
    })
    .catch(() => {});
}

function checkCurrentVideoPage(): void {
  const bvid = getCurrentBvid();
  if (bvid && aiVideoIds.has(bvid) && !currentPageIsAI) {
    currentPageIsAI = true;
    applyVideoPageAction();
    filterSidebarCards();
  }
}

function applyVideoPageAction(argueMsg?: string): void {
  if (currentMode === 'warn') {
    removeBlockOverlay();
    showBanner(argueMsg);
  } else {
    removeBanner();
    showBlockOverlay();
  }
}

// ===== 警示模式：横幅 =====

function showBanner(msg?: string): void {
  if (document.getElementById(BANNER_ID)) return;

  const text = msg || '该视频含AI生成/合成内容';

  const tryInsert = () => {
    const anchor =
      document.querySelector('#playerWrap') ||
      document.querySelector('.bpx-player-container') ||
      document.querySelector('#bilibili-player') ||
      document.querySelector('.video-info-container') ||
      document.querySelector('#viewbox_report');
    if (!anchor) return false;

    const banner = document.createElement('div');
    banner.id = BANNER_ID;
    Object.assign(banner.style, {
      background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
      color: '#fff',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '600',
      textAlign: 'center',
      borderRadius: '8px',
      margin: '8px 0',
      boxShadow: '0 2px 8px rgba(238, 90, 36, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      zIndex: '1000',
      position: 'relative',
    });

    const icon = document.createElement('span');
    icon.style.fontSize = '18px';
    icon.textContent = '⚠️';

    const label = document.createElement('span');
    label.textContent = `BiliPure: ${text}`;

    const close = document.createElement('button');
    Object.assign(close.style, {
      position: 'absolute',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'rgba(255,255,255,0.2)',
      border: 'none',
      color: '#fff',
      borderRadius: '50%',
      width: '22px',
      height: '22px',
      cursor: 'pointer',
      fontSize: '14px',
      lineHeight: '1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });
    close.textContent = '×';
    close.addEventListener('click', removeBanner);

    banner.append(icon, label, close);
    anchor.parentElement?.insertBefore(banner, anchor.nextSibling);
    return true;
  };

  if (!tryInsert()) {
    const observer = new MutationObserver(() => {
      if (tryInsert()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 10000);
  }
}

function removeBanner(): void {
  document.getElementById(BANNER_ID)?.remove();
}

// ===== 过滤模式：护眼壁纸 =====

function showBlockOverlay(): void {
  if (document.getElementById(BLOCK_OVERLAY_ID)) return;

  const overlay = document.createElement('div');
  overlay.id = BLOCK_OVERLAY_ID;
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '99999',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #c1dfc4 0%, #deecdd 50%, #e8f5e9 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  });

  const container = document.createElement('div');
  Object.assign(container.style, {
    textAlign: 'center',
    maxWidth: '480px',
    padding: '40px',
  });

  const iconEl = document.createElement('div');
  iconEl.style.fontSize = '64px';
  iconEl.style.marginBottom = '24px';
  iconEl.textContent = '🌿';

  const title = document.createElement('div');
  Object.assign(title.style, { fontSize: '24px', fontWeight: '700', color: '#2e7d32', marginBottom: '12px' });
  title.textContent = 'AI 内容已过滤';

  const desc = document.createElement('div');
  Object.assign(desc.style, { fontSize: '15px', color: '#558b2f', marginBottom: '32px', lineHeight: '1.6' });
  desc.textContent = 'BiliPure 检测到当前视频使用了 AI 技术生成，已为你自动屏蔽，保护你的信息流质量';

  const btnGroup = document.createElement('div');
  Object.assign(btnGroup.style, { display: 'flex', gap: '12px', justifyContent: 'center' });

  const btnBack = document.createElement('button');
  Object.assign(btnBack.style, {
    padding: '10px 28px', borderRadius: '24px', border: 'none',
    background: '#2e7d32', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
  });
  btnBack.textContent = '返回上一页';
  btnBack.addEventListener('click', () => history.back());

  const btnHome = document.createElement('button');
  Object.assign(btnHome.style, {
    padding: '10px 28px', borderRadius: '24px',
    border: '2px solid #2e7d32', background: 'transparent',
    color: '#2e7d32', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
  });
  btnHome.textContent = 'B站首页';
  btnHome.addEventListener('click', () => { location.href = 'https://www.bilibili.com'; });

  const hint = document.createElement('div');
  Object.assign(hint.style, { marginTop: '40px', fontSize: '12px', color: '#81c784' });
  hint.textContent = '按 Esc 返回 · 可在插件设置中切换为「警示模式」';

  btnGroup.append(btnBack, btnHome);
  container.append(iconEl, title, desc, btnGroup, hint);
  overlay.appendChild(container);

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const onEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', onEsc);
      history.back();
    }
  };
  document.addEventListener('keydown', onEsc);
}

function removeBlockOverlay(): void {
  const el = document.getElementById(BLOCK_OVERLAY_ID);
  if (el) {
    el.remove();
    document.body.style.overflow = '';
  }
}

// ===== 信息流卡片过滤 =====

function filterSidebarCards(): void {
  processCards(document.querySelectorAll(
    '.video-page-card-small, .video-page-special-card-small'
  ));
}

function observeUrlChange(): void {
  let lastUrl = location.href;
  const check = () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      currentPageIsAI = false;
      currentPageArgueMsg = '';
      removeBanner();
      removeBlockOverlay();
      if (isVideoPage()) fetchCurrentVideoInfo();
    }
  };

  const origPushState = history.pushState;
  history.pushState = function (...args) {
    origPushState.apply(this, args);
    check();
  };
  const origReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    origReplaceState.apply(this, args);
    check();
  };
  window.addEventListener('popstate', check);
}

function scanExisting(): void {
  processCards(document.querySelectorAll(VIDEO_CARD_SELECTORS));
}

function rescanCards(): void {
  const cards = document.querySelectorAll(VIDEO_CARD_SELECTORS);
  for (const card of cards) {
    if (card.getAttribute('data-bilipure-checked') === 'clean') {
      markCardDirty(card);
    }
  }
  processCards(cards);
}

function observeNewCards(): void {
  let pending = false;
  const observer = new MutationObserver(() => {
    if (!currentEnabled || pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      scanExisting();
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function processCards(cards: Iterable<Element>): void {
  if (!currentEnabled) return;
  let filtered = 0;
  for (const card of cards) {
    if (isAIContent(card)) {
      applyFilter(card as HTMLElement, 'hide');
      filtered++;
    }
  }
  if (filtered > 0) notifyFiltered(filtered);
}

function notifyFiltered(count: number): void {
  sessionCount += count;
  browser.runtime.sendMessage({
    type: 'FILTER_COUNT',
    count,
    sessionTotal: sessionCount,
  }).catch(() => {});
}

function clearAllFilters(): void {
  for (const card of document.querySelectorAll('[data-bilipure-filtered]')) {
    clearFilter(card as HTMLElement);
  }
}

function reapplyAllFilters(): void {
  for (const card of document.querySelectorAll('[data-bilipure-checked="ai"]')) {
    applyFilter(card as HTMLElement, 'hide');
  }
  for (const card of document.querySelectorAll(VIDEO_CARD_SELECTORS)) {
    if (!card.hasAttribute('data-bilipure-checked') && isAIContent(card)) {
      applyFilter(card as HTMLElement, 'hide');
    }
  }
}
