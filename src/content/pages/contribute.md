---
title: 参与贡献
description: 了解如何推荐文章、补全文章元数据，并通过 Issue 或 PR 参与维护。
---

## 如何推荐文章

欢迎通过 Issue 或 Pull Request 推荐高质量 Go 相关文章。提交时建议尽量补齐以下信息：

- 文章标题
- 原文链接
- 作者与来源
- 适合的分类
- 相关标签
- 推荐理由
- 你建议的评级

如果文章已经收录，但需要修正分类、标签、评级、摘要、主链接或参考链接，也欢迎直接提交 PR。

## 新增文章字段说明

站内文章数据统一存放在 [src/data/articles.json](/D:/WorkSpace/Git/gopher-atlas/src/data/articles.json)。新增或修改文章时，请尽量补齐以下字段。

### 必填字段

- `id`
  - 文章的稳定唯一标识
  - 建议使用英文小写、短横线分隔
  - 一经发布尽量不要修改，除非需要迁移或重定向
- `title`
  - 文章标题
  - 建议与原文标题一致，必要时可做轻微中文化处理
- `url`
  - 主链接
  - 必须是可访问的完整 URL
  - 对于译文文章，这里通常填写译文或收录页地址
- `addedAt`
  - 本站收录时间
  - 格式建议使用 `YYYY-MM-DD`
  - 用于排序“最近收录”与首页推荐
- `category`
  - 一级分类
  - 必须是站点已定义的分类之一
  - 新分类需要先统一更新分类词表
- `tags`
  - 标签数组
  - 至少 1 个
  - 建议使用短小、可复用的主题词，如 `context`、`testing`、`gc`
- `rating`
  - 推荐评级
  - 允许值：`S+`、`S`、`A+`、`A`、`B+`、`B`、`C+`、`C`
  - 用于表示推荐优先级，不是绝对分数
- `language`
  - 文章语言
  - 允许值：`zh`、`en`
- `difficulty`
  - 阅读难度
  - 允许值：`beginner`、`intermediate`、`advanced`
- `summary`
  - 一句话摘要
  - 建议简洁、准确，便于快速判断文章内容
- `reason`
  - 收录理由
  - 说明为什么值得收录，重点写它的价值，而不是重复摘要

### 可选字段

- `author`
  - 作者名
  - 可填写单个作者，多个作者请合并写成一个字符串，例如 `Alice & Bob` 或 `Alice, Bob, Charlie`
- `source`
  - 来源名称
  - 例如 `The Go Blog`、`Cloudflare Blog`
- `publishedAt`
  - 原文发布时间
  - 格式建议使用 `YYYY-MM-DD`
  - 如果找不到确切发布日期，可以留空
- `originalUrl`
  - 主要借鉴的文章、原始文章或被翻译文章的地址
  - 适合译文、改写文，或者正文里明确说明参考来源的文章
  - 页面上会显示为“参考文献”按钮
  - 如果没有明确原始来源，可以留空
- `links`
  - 文章的分段链接数组
  - 适合一篇文章分成多部分发布的情况
  - 每个元素都包含：
    - `label`：链接名称，例如 `第 1 部分`
    - `url`：该部分的完整 URL
  - 如果文章只有单个链接，可以不填这个字段
- `featured`
  - 是否首页或列表优先展示
  - 适合少量最具代表性的文章
- `mustRead`
  - 是否属于“必读”级别
  - 适合领域内最经典、最基础、最常引用的文章

## 多链接文章写法

如果一篇文章分成多部分，建议这样填写：

```json
{
  "id": "example-series",
  "title": "Example Series",
  "url": "https://example.com/post-part-1",
  "links": [
    { "label": "第 1 部分", "url": "https://example.com/post-part-1" },
    { "label": "第 2 部分", "url": "https://example.com/post-part-2" },
    { "label": "第 3 部分", "url": "https://example.com/post-part-3" }
  ]
}
```

建议把 `url` 保留为主入口，然后用 `links` 补充其余分段。这样列表页、标题链接和“阅读全文”按钮都还能正常工作，同时读者也能直接看到完整阅读路径。

## 译文文章写法

如果文章是译文、改写文，或者正文里明确参考了某篇原文，建议加上 `originalUrl`：

```json
{
  "id": "translated-example",
  "title": "译文示例",
  "url": "https://example.com/zh-article",
  "originalUrl": "https://example.com/original-article"
}
```

页面上会把 `originalUrl` 显示成“参考文献”按钮，方便读者直接跳到原始来源。

## 字段填写建议

- `id` 要稳定，尽量不要随意重命名
- `title`、`summary`、`reason` 尽量和中文读者的阅读习惯保持一致
- `category` 和 `tags` 尽量复用现有词表，避免同义词分裂
- `rating` 只表示推荐顺序，不代表文章质量的绝对判断
- `publishedAt` 和 `addedAt` 分别代表“原文发布时间”和“本站收录时间”，不要混用
- 如果一篇文章讲的是一个明确问题，`reason` 可以直接写这篇文章解决了什么问题、适合什么场景

## 新增学习随笔（Notes）

学习随笔统一存放在 [src/content/notes](/D:/WorkSpace/Git/gopher-atlas/src/content/notes) 目录下，按“分组文件夹 / Markdown 文章”的结构维护。

### 如何新增一个分组

1. 在 [src/content/notes](/D:/WorkSpace/Git/gopher-atlas/src/content/notes) 下新建一个英文文件夹，例如 `performance-diary`
2. 这个文件夹名会成为分组的稳定标识，并参与最终 URL
3. 在该文件夹里新增一篇或多篇 Markdown，站点会自动把它们聚合成一个分组

### 每篇随笔需要的字段

每篇随笔都需要在 frontmatter 里补齐以下字段：

- `title`
  - 文章标题
- `description`
  - 一句话简介
  - 会显示在学习随笔页分组卡片和文章页顶部
- `author`
  - 作者名
- `createdAt`
  - 创建时间
  - 格式建议使用 `YYYY-MM-DD`
- `updatedAt`
  - 更新时间
  - 格式建议使用 `YYYY-MM-DD`
- `group`
  - 分组名称
  - 同一分组下的文章要保持完全一致，例如都写成 `性能随记`
- `groupDescription`
  - 分组说明
  - 会显示在学习随笔页的分组卡片中
  - 同一分组下的文章要保持完全一致
- `groupOrder`
  - 分组排序
  - 数字越小越靠前
  - 同一分组下的文章要保持完全一致
- `order`
  - 当前文章在该分组中的顺序
  - 数字越小越靠前
- `slug`（可选）
  - 自定义文章 URL
  - 不填时默认使用 Markdown 文件名

### 推荐模板

```md
---
title: 这篇文章的标题
description: 这篇文章的简短说明。
author: GoFurry
createdAt: 2026-04-21
updatedAt: 2026-04-21
group: 性能随记
groupDescription: 记录性能分析、内存排查与运行时观察中的真实问题和判断过程。
groupOrder: 6
order: 1
slug: first-note
---

这里开始写正文。
```

### Notes 投稿约定

- “新增一个分组”的本质是：新增一个文件夹，并在里面放入至少一篇带完整 frontmatter 的 Markdown
- 同一分组下的所有文章，`group`、`groupDescription`、`groupOrder` 应保持一致
- `order` 用来控制组内阅读顺序，建议从 `1` 开始连续编号
- 如果只是给现有分组继续加文章，直接把新 Markdown 放进对应分组文件夹即可
- 正文支持普通 Markdown、标题、列表、代码块与代码高亮
- 如果代码块需要高亮，请在 fenced code block 里写明语言，例如 ` ```go `、` ```bash `

### 提交前检查

新增或修改学习随笔后，建议至少执行：

```bash
npm run generate
npm run build
npm test
```

## 推荐标准

- 优先推荐能讲清一个核心概念的文章
- 优先推荐对实际工程有启发，而不是纯营销或浅层搬运的内容
- 对明显过时但仍有参考价值的文章，请补充上下文说明
- 官方作者、核心贡献者或资深工程师内容通常优先级更高

## PR 指引

- 保持字段命名统一
- 标签尽量短小明确
- 避免重复提交已收录文章
- 如果新增专题，请同步补充对应的 Markdown 导读页
- 如果调整了分类、标签、链接结构或参考来源，请确认相关文章仍然能正确出现在对应页面

如果你不确定某篇文章是否适合收录，也欢迎先开 Issue 一起讨论。
