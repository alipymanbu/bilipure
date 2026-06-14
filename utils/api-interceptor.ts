export function setupApiInterceptor(): void {
  interceptFetch();
  interceptXHR();
}

function interceptFetch(): void {
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
    if (shouldIntercept(url)) {
      try {
        const cloned = response.clone();
        cloned.json().then(parseApiResponse).catch(() => {});
      } catch {}
    }
    return response;
  };
}

function interceptXHR(): void {
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
    const urlStr = url.toString();
    if (shouldIntercept(urlStr)) {
      this.addEventListener('load', function () {
        try {
          const data = JSON.parse(this.responseText);
          parseApiResponse(data);
        } catch {}
      });
    }
    return originalOpen.apply(this, [method, url, ...rest] as any);
  };
}

function shouldIntercept(url: string): boolean {
  return url.includes('api.bilibili.com') && (
    url.includes('/x/web-interface/view') ||
    url.includes('/x/web-interface/wbi/index/top/feed/rcmd') ||
    url.includes('/x/web-interface/ranking') ||
    url.includes('/x/web-interface/search') ||
    url.includes('/x/web-interface/wbi/search') ||
    url.includes('/x/player/wbi/playurl') ||
    url.includes('/x/polymer/web-dynamic') ||
    url.includes('/x/web-interface/archive/related') ||
    url.includes('/pgc/web')
  );
}

function parseApiResponse(data: any): void {
  if (!data || data.code !== 0) return;

  const root = data.data;
  if (!root) return;

  if (root.argue_info) {
    emitAI(root.bvid, root.argue_info);
  }

  const lists = [root.item, root.list, root.result, root.Related, root.spec];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (item?.argue_info) {
        emitAI(item.bvid, item.argue_info);
      }
    }
  }
}

function emitAI(bvid: string | undefined, argueInfo: any): void {
  if (!argueInfo?.argue_msg || !bvid) return;
  const msg: string = argueInfo.argue_msg;
  if (msg.includes('AI')) {
    window.dispatchEvent(
      new CustomEvent('bilipure:ai-detected', { detail: { bvid, msg } })
    );
  }
}
