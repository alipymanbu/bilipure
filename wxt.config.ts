import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'BiliPure - B站AI内容过滤器',
    description: '过滤B站上标注为AI生成的视频内容，还你一个真实的信息流',
    permissions: ['storage'],
    host_permissions: ['*://*.bilibili.com/*'],
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      96: 'icon-96.png',
      128: 'icon-128.png',
    },
  },
});
