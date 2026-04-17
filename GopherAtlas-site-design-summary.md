# GopherAtlas 网站设计总结

## 1. 项目定位

**GopherAtlas** 是一个面向 Go 开发者的高质量技术文章精选导航站。

它的核心不是写原创博客，而是**推荐值得阅读的第三方 Go 技术文章**，通过统一的评级、标签、分类和专题组织方式，让读者更快找到高价值内容。

### 核心特征

- 以第三方文章链接为主，链接优先级高于站内正文
- 使用 Markdown 维护内容与专题说明
- 支持推荐程度评级，如 `S+`、`S`、`A+`、`A`
- 支持搜索、筛选、排序与 URL 状态同步
- 采用静态站点方案，部署到 GitHub Pages
- 绑定自定义域名：`gopheratlas.com`

### 非目标

- 不做传统博客
- 不使用博客框架
- 不做依赖后端的动态系统
- 不做重型 SPA

---

## 2. 品牌与命名

- **项目名**：`GopherAtlas`
- **仓库名**：`gopher-atlas`
- **域名**：`gopheratlas.com`

### 副标题建议

- A curated atlas of high-quality Go articles
- Handpicked Go articles for Go developers
- High-signal Go reading, organized by topic and rating

### 中文定位文案

- 高质量 Go 技术文章精选导航
- 面向 Go 开发者的优质文章地图
- 按专题、标签与评级整理的 Go 阅读索引

---

## 3. 视觉风格方向

GopherAtlas 的整体配色与气质参考 `DeepFurry` 站点，但会结合文章导航站的使用场景做适配。

### 风格关键词

- 深色背景
- 高对比文本
- 半透明卡片
- 浅蓝强调色
- 大圆角
- 胶囊按钮 / 胶囊导航
- 轻玻璃感
- 柔和阴影
- 留白充足
- 简洁、安静、现代

### 推荐视觉基调

#### 背景层
- 以深色 `zinc / slate` 系为主
- 主背景保持纯净，不做复杂纹理
- 局部可加入非常轻的渐变或柔和光感

#### 内容卡片
- 使用半透明深色或浅白透明叠层
- 细边框
- 大圆角
- 大面积留白
- 柔和阴影增强层次

#### 强调色
- 采用偏浅的 `sky blue` 作为主强调色
- 用于：
  - 主按钮
  - 激活状态
  - 标签高亮
  - 链接 hover
  - 局部徽标或评分高亮

#### 文字层级
- 主标题：纯白或接近白色
- 正文：浅灰
- 次级说明：更淡的灰蓝/灰白
- 避免过于艳丽的彩色文本

#### 交互元素
- 顶部导航使用半透明 + 模糊效果
- 导航项与按钮采用胶囊圆角
- hover 过渡轻柔，不做夸张动画
- 筛选器、标签与排序控件保持统一风格

### 适配到 GopherAtlas 的具体建议

虽然参考 DeepFurry 的整体视觉，但 GopherAtlas 应更偏“阅读导航”而非“组织入口页”，因此建议：

- 首页信息密度比 DeepFurry 更高
- 文章卡片要更强调可扫描性
- 标签、评级、分类需要更强辨识度
- 搜索与筛选区域要成为核心视觉模块之一
- 不能只追求氛围感，还要兼顾信息检索效率

---

## 4. 技术方案

## 技术栈

- **HTML**
- **CSS**（原生 CSS）
- **TypeScript**
- **模板引擎**（推荐 `Nunjucks`）
- **Build 脚本**（推荐 `build.ts`）
- **Markdown**（专题说明 / 页面文本）
- **JSON / YAML**（文章元数据）
- **GitHub Pages**（部署）

## 设计原则

- 最终产物必须是纯静态页面
- 内容与数据分离，避免页面手写重复
- 不引入博客框架
- 不依赖服务端渲染
- 优先保证长期维护体验

### 推荐实现思路

- 用 **Markdown** 写专题导读、关于页、贡献说明
- 用 **JSON / YAML** 管理文章推荐条目
- 用 **模板引擎** 统一页面布局与列表渲染
- 用 **TypeScript** 实现搜索、筛选、排序、暗色模式、URL 状态同步等交互
- 用 **build 脚本** 输出最终静态 HTML 到 `dist/`

---

## 5. 内容模型

这个站点的核心内容不是正文文章，而是**推荐条目**。

每个条目代表一篇第三方文章，包含链接、标签、评级和推荐理由。

### 推荐条目建议字段

```ts
export type Rating = 'S+' | 'S' | 'A+' | 'A' | 'B+' | 'B'

export type ArticleItem = {
  id: string
  title: string
  url: string
  author?: string
  source?: string
  publishedAt?: string
  addedAt: string
  category: string
  tags: string[]
  rating: Rating
  language: 'zh' | 'en'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  summary: string
  reason: string
  featured?: boolean
  mustRead?: boolean
}
```

### 内容组织建议

#### 专题说明
- 使用 Markdown
- 每个专题一份独立文档
- 负责导读、阅读建议、专题简介

#### 文章推荐条目
- 首版建议使用 `articles.json` 或 `articles.yaml`
- 统一字段格式，便于构建和筛选
- 后期如数量很多，再考虑每篇文章单独一个 Markdown 文件

---

## 6. 评级体系

评级的作用是表达推荐优先级，而不是做绝对分数排名。

### 建议定义

- **S+**：非常推荐，长期价值极高，建议优先阅读
- **S**：高质量核心文章，讲解清晰且有深度
- **A+**：很值得读，适合作为专题重点文章
- **A**：质量较高，适合作为补充阅读
- **B+**：有一定参考价值，但优先级较低
- **B**：可选阅读，适合特定场景补充

### 使用建议

- 支持按评级筛选
- 支持按评级排序
- 在文章卡片中高亮显示评级
- 在 About 页面专门说明评级规则

---

## 7. 分类与标签体系

## 一级分类建议

- Language Basics
- Concurrency
- Runtime
- Scheduler
- Memory & GC
- Networking
- Web Development
- Performance
- Testing
- Database
- Distributed Systems
- Security
- Tools
- Engineering

## 首批重点专题建议

- Concurrency
- Runtime
- Memory & GC
- Performance
- Web Development
- Testing

## 标签设计原则

- 短小明确
- 统一风格
- 避免泛化
- 控制总量

### 示例标签

- goroutine
- channel
- context
- sync
- mutex
- scheduler
- gmp
- gc
- memory
- escape-analysis
- pprof
- benchmark
- net-http
- middleware
- profiling
- testing
- redis
- sql
- grpc

---

## 8. 页面结构设计

## 8.1 首页 `/`

首页负责建立站点第一印象，并把用户尽快引导到文章与专题。

### 首页建议模块

1. Hero 区域
2. 搜索框
3. 热门专题
4. 精选推荐
5. Must Read
6. 最新收录
7. 评级说明
8. About / Contribute 入口
9. Footer

### Hero 建议元素

- 项目名：GopherAtlas
- 一句话副标题
- 搜索输入框
- 快速入口按钮：
  - Browse Articles
  - Explore Topics
  - View on GitHub

---

## 8.2 全部文章页 `/articles/`

这是站点的核心页面。

### 必备能力

- 关键词搜索
- 标签筛选
- 分类切换
- 评级筛选
- 排序
- 复制当前筛选链接
- URL 参数同步

### 推荐排序方式

- Recommended（默认）
- Rating
- Recently Added
- Published Date
- Title A-Z

默认排序建议：

1. Featured
2. Must Read
3. Rating
4. AddedAt

---

## 8.3 专题页 `/topics/{slug}/`

例如：

- `/topics/concurrency/`
- `/topics/runtime/`
- `/topics/performance/`

### 专题页建议模块

- 专题简介
- 推荐阅读顺序
- 该专题下的精选文章列表
- 标签聚合
- 相关专题跳转

---

## 8.4 标签页 `/tags/{slug}/`

作用：

- 查看某个标签关联的全部文章
- 支持进一步筛选

---

## 8.5 About 页 `/about/`

建议包含：

- 项目定位
- 收录标准
- 评级标准
- 技术栈说明
- 站点维护说明

---

## 8.6 Contribute 页 `/contribute/`

建议包含：

- 如何推荐文章
- 推荐条目格式
- 收录标准
- PR / Issue 指引

---

## 9. 功能需求

以下功能全部列为首版目标。

### 9.1 关键词搜索

支持搜索：

- 标题
- 作者
- 来源
- 标签
- 推荐语 / 简述

建议：

- 首版用前端本地搜索
- 对标题和标签赋予更高权重

---

### 9.2 标签筛选

支持：

- 单标签筛选
- 多标签筛选
- 与分类 / 排序 / 评级联动

---

### 9.3 分类切换

支持：

- 首页专题入口
- 文章页分类切换
- 专题页快速跳转

---

### 9.4 文章排序

支持：

- 推荐度
- 评级
- 收录时间
- 发布时间
- 标题排序

---

### 9.5 暗色模式

建议：

- 默认跟随系统
- 支持手动切换
- 状态写入 `localStorage`
- 亮色模式保留，但暗色作为主视觉基线

---

### 9.6 移动端菜单

要求：

- 结构清晰
- 折叠式导航
- 与桌面端保持一致的信息架构

---

### 9.7 复制链接

支持：

- 复制文章外链
- 复制当前筛选页链接
- 复制专题页链接

建议提供轻提示：

- Copied
- Link copied to clipboard

---

### 9.8 返回顶部

要求：

- 页面滚动到一定距离后出现
- 点击平滑滚动回顶部

---

### 9.9 URL 查询参数同步筛选状态

必须支持。

### 推荐参数

- `q`
- `category`
- `tags`
- `rating`
- `sort`
- `lang`
- `page`

### 示例

```text
/articles/?q=gc&category=runtime&tags=memory,gc&rating=S,A%2B&sort=rating
```

---

## 10. UI 组件建议

## 顶部导航

- sticky + blur
- 半透明深色背景
- 左侧品牌名
- 右侧主导航
- 移动端折叠菜单

## 搜索区域

- 首页和文章页都应突出显示
- 可与分类筛选区组合
- 建议视觉上作为主操作区

## 文章卡片

每张卡片建议包含：

- 标题
- summary
- rating 徽标
- 分类
- 标签
- 作者 / 来源
- 语言
- Read Article 按钮
- Copy Link 按钮

## 标签与筛选器

- 风格统一
- 胶囊形态
- 激活状态明显
- hover / active 使用浅蓝强调色

## Footer

建议包含：

- 简短版权说明
- GitHub 链接
- 域名 / 项目说明

---

## 11. 仓库目录建议

```text
gopher-atlas/
├─ README.md
├─ LICENSE
├─ package.json
├─ tsconfig.json
├─ build.ts
├─ src/
│  ├─ templates/
│  │  ├─ layouts/
│  │  ├─ partials/
│  │  ├─ index.njk
│  │  ├─ articles.njk
│  │  ├─ topic.njk
│  │  ├─ tag.njk
│  │  ├─ about.njk
│  │  └─ contribute.njk
│  ├─ styles/
│  │  ├─ base.css
│  │  ├─ theme.css
│  │  ├─ layout.css
│  │  ├─ components.css
│  │  └─ utilities.css
│  ├─ scripts/
│  │  ├─ app.ts
│  │  ├─ search.ts
│  │  ├─ filters.ts
│  │  ├─ theme.ts
│  │  ├─ clipboard.ts
│  │  ├─ url-state.ts
│  │  └─ mobile-menu.ts
│  ├─ content/
│  │  ├─ topics/
│  │  │  ├─ concurrency.md
│  │  │  ├─ runtime.md
│  │  │  ├─ performance.md
│  │  │  └─ web.md
│  ├─ data/
│  │  ├─ articles.json
│  │  ├─ categories.json
│  │  └─ tags.json
│  └─ assets/
│     ├─ icons/
│     └─ images/
├─ public/
│  ├─ favicon.ico
│  ├─ robots.txt
│  ├─ sitemap.xml
│  └─ CNAME
├─ dist/
└─ .github/
   └─ workflows/
      └─ deploy.yml
```

---

## 12. SEO 与部署

## SEO 基础建议

- 页面标题独立
- meta description
- Open Graph
- Twitter Card
- canonical URL
- sitemap.xml
- robots.txt

专题页和标签页都应拥有自己的标题与描述。

## 部署方式

- GitHub Actions 构建
- 输出到 `dist/`
- GitHub Pages 部署
- 自定义域名绑定 `gopheratlas.com`

---

## 13. 收录标准

### 优先收录

- 技术内容准确
- 讲解清晰
- 有深度
- 有长期价值
- 官方、核心贡献者或资深工程师文章优先

### 不优先收录

- 浅层搬运文
- 营销文
- 低信息密度入门水文
- 明显过时且无上下文说明的内容

---

## 14. 首版开发优先级

## P0

- 首页
- 全部文章页
- 专题页
- 搜索
- 标签筛选
- 分类切换
- 排序
- 暗色模式
- 移动端菜单
- 复制链接
- 返回顶部
- URL 状态同步
- GitHub Pages 部署

## P1

- About 页
- Contribute 页
- SEO 基础
- 自定义域名接入
- Sitemap / robots

## P2

- 更完整的标签页
- Must Read 专区增强
- RSS
- 本周新增页面
- 多语言界面

---

## 15. 最终结论

GopherAtlas 应被设计为一个：

**以高质量 Go 技术文章推荐为核心、采用评级与专题组织、支持搜索与筛选、参考 DeepFurry 深色极简风格、并部署在 GitHub Pages 上的静态精选导航站。**

它的真正价值不在于收录数量，而在于：

- 推荐有判断
- 分类有结构
- 评级有意义
- 搜索和筛选顺手
- 页面风格统一且长期可维护

一句话总结：

> GopherAtlas 不是一个普通链接仓库，而是一张面向 Go 开发者的优质阅读地图。
