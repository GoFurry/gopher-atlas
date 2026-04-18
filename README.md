# GopherAtlas

[![Deploy GopherAtlas](https://github.com/GoFurry/gopher-atlas/actions/workflows/deploy.yml/badge.svg)](https://github.com/GoFurry/gopher-atlas/actions/workflows/deploy.yml)
[![Live Site](https://img.shields.io/badge/Live-gopheratlas.com-0f766e?logo=googlechrome&logoColor=white)](https://gopheratlas.com)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-222222?logo=github&logoColor=white)](https://pages.github.com/)
[![License](https://img.shields.io/github/license/GoFurry/gopher-atlas)](./LICENSE)

High-quality Go article curation, organized by topics, tags, filters, and recommendation ratings.

GopherAtlas 是一个面向 Go 开发者的高质量技术博客导航站，已经部署到生产环境并运行在 [gopheratlas.com](https://gopheratlas.com)。
项目以静态站点的形式构建，内容通过结构化数据和专题文档生成，适合长期维护、持续收录和 GitHub Pages 自动部署。

## Highlights

- 专注高质量 Go 技术文章收录，而不是泛资讯聚合。
- 通过 `Topics`、`Tags`、评级、语言和关键词筛选组织内容。
- 首页、文章页、专题页、标签页都由脚本静态生成，便于维护一致性。
- 默认接入 GitHub Pages 生产部署，推送到 `main` 后自动测试并发布。
- 内容与页面模板分离，适合持续扩充文章库和专题导读。

## Live Release Snapshot

- Production: [https://gopheratlas.com](https://gopheratlas.com)
- Repository: [https://github.com/GoFurry/gopher-atlas](https://github.com/GoFurry/gopher-atlas)
- Deployment: GitHub Pages
- CI workflow: `Deploy GopherAtlas`

## Tech Stack

- TypeScript
- Vite
- Tailwind CSS v4
- Vitest
- GitHub Actions
- GitHub Pages

## Quick Start

```bash
npm install
npm run dev
```

本地开发前，项目会先执行静态页面生成，再启动 Vite 开发服务器。

## Scripts

```bash
npm run generate
npm run dev
npm run build
npm test
```

- `npm run generate`: 根据内容源生成首页、文章页、专题页、标签页和静态说明页。
- `npm run dev`: 生成页面后启动本地开发环境。
- `npm run build`: 重新生成页面并构建生产产物。
- `npm test`: 运行数据与脚本层测试。

## Content Sources

- `src/data/articles.json`: 文章元数据与收录信息
- `src/content/topics/*.md`: 专题导读内容
- `src/content/pages/*.md`: `About` 与 `Contribute` 页面内容
- `scripts/generate-site.ts`: 静态页面生成脚本

## Content Workflow

### Add or Update Articles

在 `src/data/articles.json` 中新增或修改文章条目。每篇文章通常至少包含以下字段：

- `id`
- `title`
- `url`
- `category`
- `tags`
- `rating`
- `language`
- `difficulty`
- `summary`
- `reason`

可选字段包括：

- `author`
- `source`
- `publishedAt`
- `featured`
- `mustRead`
- `originalUrl`
- `links`

### Add or Update Topics

如果文章归属于已有专题，通常只需要正确填写 `category` 和 `tags`。

如果要新增专题，还需要同步完成：

- 新增对应的 `src/content/topics/*.md`
- 在 frontmatter 中补齐 `title`、`slug`、`summary`、`readingOrder`、`relatedTopics`
- 确保专题 `slug` 能与文章分类正确映射

### Regenerate Pages

不要直接手改根目录或 `articles/`、`topics/`、`tags/` 下生成出来的 HTML 页面。
正确做法是修改内容源或模板后重新生成：

```bash
npm run generate
```

### Verify Before Shipping

```bash
npm run build
npm test
```

## Deployment

项目当前已经部署在生产环境，正式地址为 [gopheratlas.com](https://gopheratlas.com)。

推送到 `main` 后，GitHub Actions 会自动执行：

1. 安装依赖
2. 运行测试
3. 构建静态站点
4. 发布到 GitHub Pages

工作流文件位于：

- `.github/workflows/deploy.yml`

## Release Notes Tips

如果你打算为这个项目编写 GitHub Release，推荐重点描述这些内容：

- 新增或下线了哪些文章与专题
- 首页、文章页、专题页的交互或视觉更新
- 筛选、搜索、标签、评级等浏览体验变更
- 部署、生成脚本或内容结构的维护性改进

## License

This project is licensed under the [MIT License](./LICENSE).
