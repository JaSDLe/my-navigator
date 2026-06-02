# My Navigator

My Navigator 是一个可自托管的个人导航面板，用于把常用下载地址、技术文档、工具站点和团队链接按分组集中管理。

The project is a self-hosted navigation dashboard built with Vue 3 and Vite. It focuses on fast local customization, categorized links, dark mode, and editable navigation data stored in the browser.

## Features

- 分类导航：用分组卡片展示下载、文档、工具等链接。
- 本地配置：站点标题、深色模式、分组和链接保存到 `localStorage`。
- 链接维护：可在设置面板中新增、编辑、删除分组和链接。
- 图标辅助：支持自动探测常见 favicon 地址，也可以手动配置图标 URL。
- 主题色提取：可通过可选后端图片代理读取图标主色，减少浏览器 CORS 限制。
- 深色模式：基于 Element Plus 变量适配亮色和暗色主题。

## Tech Stack

- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Router
- Element Plus
- Axios

## Getting Started

Requirements:

- Node.js `^20.19.0 || >=22.12.0`
- npm

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

Create a production build:

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

## Configuration

The app can run as a static frontend. Link data lives in `src/config/nav.ts` by default and user edits are persisted in browser storage.

Optional environment variable:

```sh
VITE_APP_VERSION=0.0.2
```

Optional backend proxy:

- The settings drawer includes `requestUrl` and `token` fields.
- Theme-color extraction calls `GET /test/img/proxy?url=<encoded-image-url>` through the configured base URL.
- The proxy should return the remote image as a `Blob` response.

## Project Structure

```text
src/config/nav.ts              Default navigation sections and links
src/stores/settings.ts         Pinia store and localStorage persistence
src/components/AppNavbar.vue   Header, section menu, version, time, theme switch
src/components/SectionGrid.vue Navigation link grid
src/components/SettingsDrawer.vue Link and settings editor
src/utils/favicon.ts           Favicon discovery helper
src/api/proxy.ts               Optional image proxy client
```

## Quality Checks

```sh
npm run type-check
npm run lint
npm run build
```

`npm run lint` is configured to apply ESLint fixes.

## Contributing

Issues and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before making larger changes.

## License

Released under the [MIT License](LICENSE).
