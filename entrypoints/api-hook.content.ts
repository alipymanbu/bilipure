import { setupApiInterceptor } from '@/utils/api-interceptor';

export default defineContentScript({
  matches: ['*://*.bilibili.com/*'],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    setupApiInterceptor();
  },
});
