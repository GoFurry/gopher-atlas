# GopherAtlas

GopherAtlas 是一个面向 Go 开发者的高质量文章精选导航站，目标是把长期有价值的 Go 文章按专题、标签和评级组织起来，并以纯静态站的形式部署到 GitHub Pages。

## 本地开发

```bash
npm install
npm run dev
```

开发前先执行 `npm run generate`，生成首页、文章页、专题页、标签页和说明页所需的 HTML 入口。

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

## 更新文章流程

如果你想提交新的文章收录、修正已有文章信息，或补充专题内容，建议按下面的顺序操作：

### 1. 更新文章数据

在 `src/data/articles.json` 中新增或修改文章条目。每篇文章至少需要这些字段：

- `id`：稳定且唯一的标识
- `title`：文章标题
- `url`：原文链接
- `category`：一级分类
- `tags`：标签数组
- `rating`：推荐评级
- `language`：`zh` 或 `en`
- `difficulty`：`beginner`、`intermediate` 或 `advanced`
- `summary`：简短摘要
- `reason`：收录理由

可选字段包括 `author`、`source`、`publishedAt`、`featured`、`mustRead`。

### 2. 需要时同步更新专题

如果文章属于已有专题，通常只需要把 `category` 和 `tags` 填对。

如果你新增了一个专题，除了补充文章数据外，还需要：

- 新增对应的 `src/content/topics/*.md` 导读文件
- 在专题 frontmatter 中补齐 `title`、`slug`、`summary`、`readingOrder`、`relatedTopics`
- 确保专题 slug 能和文章的分类映射关系对应上

### 3. 重新生成页面

这个项目的 HTML 页面不是手写维护的，首页、文章页、专题页、标签页都会由 `scripts/generate-site.ts` 生成。

因此请不要直接修改根目录下的 `index.html`、`articles/**/index.html`、`topics/**/index.html` 等生成结果，而是修改数据源或生成模板后执行：

```bash
npm run generate
```

### 4. 本地检查

提交 PR 前建议至少运行：

```bash
npm run build
npm test
```

如果你在开发模式下预览站点，可以使用：

```bash
npm run dev
```

注意：`npm run dev` 会先执行一次生成，再启动 Vite 开发服务器；如果你在开发过程中修改了 `scripts/generate-site.ts`，通常需要再手动执行一次 `npm run generate` 才能看到新的页面结构。

### 5. 提交 PR 时建议说明

为了方便 review，建议在 PR 描述里写清楚：

- 新增或修改了哪些文章
- 是否调整了分类、标签或评级
- 是否同步更新了专题导读
- 本地是否已运行 `npm run build` 和 `npm test`

## 部署

推送到 `main` 后，GitHub Actions 会执行测试、构建并自动部署到 GitHub Pages，生产域名为 `gopheratlas.com`。
