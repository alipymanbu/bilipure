<div align="center">

# 🌿 BiliPure

**B站 AI 内容过滤器 — 还你一个真实的信息流**

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-brightgreen?logo=googlechrome&logoColor=white)](https://github.com/Junky1001/bilipure)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Junky1001/bilipure?style=social)](https://github.com/Junky1001/bilipure)

</div>

---

B站的 AI 生成视频越来越多，但你只想看真人创作的内容？

**BiliPure** 自动识别 B站平台标注的 AI 生成/合成视频，一键过滤，让你的首页、搜索、推荐流回归真实。

> 不做 AI 检测，不调用模型，只读取 B站已有的官方标注 → **零误判**

## 效果展示

### 警示模式 — 醒目横幅提醒，仍可选择观看

![警示模式](visual/warn-mode.png)

### 过滤模式 — 直接屏蔽，护眼壁纸替代

![过滤模式](visual/block-mode.png)

### 插件面板 — 一键切换，统计过滤数量

![插件面板](visual/popup.png)

## 功能特性

- **两种过滤模式**：警示（红色横幅提醒）/ 过滤（护眼壁纸全屏屏蔽）
- **全场景覆盖**：首页推荐流、搜索结果、视频播放页、侧边栏推荐
- **实时拦截**：通过 API 拦截 + DOM 扫描双重检测，无限滚动也不漏
- **零误判**：只读取 B站官方 `argue_info` AI 标注，不做主观判断
- **隐私友好**：不收集任何数据，不联网，设置存储在本地
- **轻量无感**：< 100KB，MutationObserver 防抖，不影响浏览体验

## 安装

### 方式一：Chrome Web Store（审核中）

上架后将提供直接安装链接。

### 方式二：手动安装（开发者模式）

1. 下载本仓库：`git clone https://github.com/Junky1001/bilipure.git`
2. 安装依赖并构建：
   ```bash
   cd bilipure
   pnpm install
   pnpm build
   ```
3. 打开 Chrome，进入 `chrome://extensions/`
4. 开启右上角 **「开发者模式」**
5. 点击 **「加载已解压的扩展程序」**，选择 `.output/chrome-mv3/` 目录
6. 打开 B站，开始使用

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | [WXT](https://wxt.dev) (Manifest V3) |
| UI | React + Tailwind CSS |
| 检测 | B站 API `argue_info` 拦截 + DOM 关键词扫描 |
| 存储 | `chrome.storage.sync` |

## 工作原理

```
B站 API 响应                    页面 DOM
     │                            │
     ▼                            ▼
MAIN world 脚本               ISOLATED world 脚本
拦截 fetch/XHR              MutationObserver 监听
解析 argue_info                   │
     │                            │
     └──── CustomEvent ───────────┘
                │
                ▼
         检测到 AI 标注
                │
          ┌─────┴─────┐
          ▼           ▼
      警示模式     过滤模式
     红色横幅     护眼壁纸
```

## 反馈与贡献

- 发现 bug 或有功能建议？欢迎 [提 Issue](https://github.com/Junky1001/bilipure/issues)
- 觉得有用？给个 Star 就是最大的支持

## License

[MIT](LICENSE)
