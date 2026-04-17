# GopherAtlas

GopherAtlas 是一个面向 Go 开发者的高质量文章精选导航站，目标是把长期有价值的 Go 文章按专题、标签和评级组织起来，并以纯静态站的形式部署到 GitHub Pages。

## 技术栈

- Vite
- TypeScript
- 原生 CSS
- JSON 数据源
- Markdown 内容页
- 自定义静态页面生成脚本

## 本地开发

```bash
npm install
npm run dev
```

开发前会先执行 `npm run generate`，生成首页、文章页、专题页、标签页和说明页所需的 HTML 入口。

## 常用命令

```bash
npm run generate
npm run build
npm test
```

## 内容结构

- `src/data/articles.json`：文章元数据
- `src/content/topics/*.md`：专题导读
- `src/content/pages/*.md`：About 与 Contribute 页面
- `scripts/generate-site.ts`：静态页面生成脚本

## 部署

推送到 `main` 后，GitHub Actions 会执行测试、构建并自动部署到 GitHub Pages，生产域名为 `gopheratlas.com`。
