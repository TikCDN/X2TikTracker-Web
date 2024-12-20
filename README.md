# X2TikTracker

## 概述

**X2TikTracker** 是是一款支持基于 P2P 技术的视频加速工具。它集成了 WebRTC 和 HLS 等技术，旨在降低视频点播或直播的带宽消耗，提升播放体验。X2TikTracker 的核心理念是利用终端设备之间的上传能力，实现带宽共享，从而降低对传统 CDN 的依赖。

### Demo运行指南

本项目提供 `hls.js`、`shaka-player` 这两款播放器的插件（未来提供更多），也就是说在不改变播放器的情况下，开发者可以快速无缝的接入 X2TikTracker。

#### 下载

```bash
git clone https://github.com/ByteDance/X2TikTracker-Web.git
```

#### 安装依赖

```bash
pnpm install
```

#### 配置

修改 `src/constants.ts` 文件中的 `APP_ID` 字段，然后运行即可。

```ts
export const APP_ID = ""; // 替换为你的应用 ID
```

#### 运行

```bash
pnpm dev --host
```

#### 部署

```bash
pnpm build
```

将生成的 `dist` 文件夹中的内容部署到你的服务器上即可。
