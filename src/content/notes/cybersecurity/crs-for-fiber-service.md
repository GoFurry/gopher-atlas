---
title: 用 CRS v4.25.0 LTS 保护你的 Fiber 程序
description: 从 Go 开发者视角梳理 CRS、SecLang 与 CorazaWAF 的关系，并结合 Fiber 场景理解 Web 防护规则集的价值与落地方式。
author: 福狼
createdAt: 2026-04-22
updatedAt: 2026-04-22
group: 网络安全
groupDescription: 记录和 Web 安全、攻击面治理与防护策略有关的学习笔记。
groupOrder: 1
order: 1
slug: crs-for-fiber-service
---

> 全文长度：5500+  
> 预计阅读时间：5~15 分钟  
> 阅读难度：入门  
> 关键词：CRS，Coraza，Fiber，Security，WAF

---

### 1. 前言

最近我在 Coraza 社区看到一条讨论，提到 CRS 在近期发布了 LTS 版本 (v4.25.0 LTS)，以及是否应该在 Coraza 中默认包含它。

这个讨论我觉得是具有一定意义的，因为通常我在使用 CorazaWAF 的时候都会选择优先去配置最新的 CRS，CRS 对我来说几乎是小网站开发中一个低成本高收益的必选防护措施。借此机会我想去仔细了解一下什么是 CRS。

这不是一个完全陌生的话题，因为此前我已经写过一篇和 Fiber + CorazaWAF 相关的实践文章，也参与过 Fiber 社区贡献库里和 Coraza 中间件相关的工作。因此，这次再回头看 CRS，我更想弄清楚的是：

- CRS 到底是什么？作为不断更新的安全规则为什么会推出 LTS 版本？

---

### 2. CRS 是什么

CRS 的全称是 **OWASP Core Rule Set**。  
它不是一个单独的 WAF 产品，而是一套可以被 WAF 引擎加载和执行的通用 Web 防护规则集。

理解 CRS 时，我觉得最重要的一点是把下面三者区分开：

- **CRS**：规则集
- **Coraza / ModSecurity**：规则执行引擎
- **Nginx / 网关 / 中间件接入层**：实际承载流量的位置

也就是说，CRS 更像是“把常见 Web 攻击检测经验整理成可复用规则”，而 Coraza 这类引擎则负责真正解析请求、执行规则、决定放行还是拦截。

![CRS使用流程](https://gopheratlas-1307743912.cos.ap-chengdu.myqcloud.com/images/crs-for-fiber-service-003.png)

CRS 通常关注这些典型问题：

- SQL 注入
- XSS
- 命令注入
- 文件上传绕过
- 异常请求与扫描行为
- 通用 Web 攻击流量


---

### 3. Go 开发者为什么应该关注 CRS LTS

Go 社区平时更常讨论框架、性能、数据库、缓存、部署和可观测性，但一个经常被放到后面的事情是：

**请求在进入业务逻辑之前，是否已经带着明显的恶意特征？**

这就是我觉得 Go 开发者值得了解 CRS 的原因。  
因为 Go 生态里已经有一个非常成熟的开源规则引擎：**Coraza**。

而我这次重新关注 CRS，一个很重要的原因就是它进入了 LTS 节点。CRS 官方已经把 `v4.25.x` 定义为 CRS 4 这一代的首个 LTS 发行线，并明确说明它会获得安全补丁支持直到 **2027 年 Q3**。

这意味着它并不是一个非常长期维护的分支，而是一条以稳定性为优先的长期维护分支。对于很多还在等待 CRS 4 足够稳定、再考虑迁移的团队来说，LTS 更像是一个可以正式进入生产评估的信号。

不过，安全规则集和一般业务软件有一个很不一样的地方：它天然处在“稳定”和“变化”之间。

因为新的攻击手法、绕过方式和误报案例会不断出现，规则集如果完全不更新，就会逐渐落后；但另一方面，规则越积极演进，工程侧就越要承担升级测试、性能波动和误报变化带来的成本。

所以 CRS LTS 的思路并不是“把所有新规则都持续回灌给长期支持版本”，而是做了一个明确的取舍。这样做的结果是，LTS 用户可以获得一个更可预测的规则基线，而不用被迫追着主线的小步快跑。

我觉得这其实正适合 Go 开发者的工程习惯。很多 Go 项目在依赖选择上，本来就更偏向“接口稳定、行为可预期、便于上线”而不是激进地更新，放到 WAF 规则集上也是一样。LTS 的价值，恰恰在于把这种变化控制在一个更容易评估的范围里。

当然，这种取舍也有代价。选择 LTS，意味着你获得的是一个更稳的基线，而不是最新的全部能力。换句话说，LTS 更像是一种工程上的平衡：它接受“不是每一次规则演进都要立即跟上”，换取更低的变更频率和更强的上线可控性。对于需要长期维护的 Go 服务来说，这种平衡并不保守，反而很现实。

---

### 4. SecLang + CorazaWAF 实战

如果只停留在概念层面，CRS 很容易变成“知道有这个东西，但不知道它怎么用”，所以我们更应该用实战去了解。

![Coraza](https://gopheratlas-1307743912.cos.ap-chengdu.myqcloud.com/images/crs-for-fiber-service-001.png)


以下是一次规则防护的核心执行流程：

1. 请求进入引擎
2. 引擎按阶段处理请求
3. 规则在阶段中读取变量并匹配条件
4. 命中后执行动作，比如记录、拦截、打标签

![规则引擎执行流程](https://gopheratlas-1307743912.cos.ap-chengdu.myqcloud.com/images/crs-for-fiber-service-002.png)

### 规则示例

```apache
SecRuleEngine On

SecRule ARGS:name "@streq attack" "id:100001,phase:1,deny,status:403,log,msg:'blocked test payload'"
```

这条规则可以粗略理解为：

1. 开启规则引擎
2. 如果请求参数等于 `attack` 就拒绝请求并记录日志

### Go 示例

```go
package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/corazawaf/coraza/v3"
	txhttp "github.com/corazawaf/coraza/v3/http"
)

func main() {
	waf, err := coraza.NewWAF(
		coraza.NewWAFConfig().
			WithDirectives(`
SecRuleEngine On
SecRule ARGS:name "@streq attack" "id:100001,phase:1,deny,status:403,log,msg:'blocked test payload'"
`),
	)
	if err != nil {
		log.Fatalf("init waf failed: %v", err)
	}

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		_, _ = w.Write([]byte("hello, coraza"))
	})

	http.Handle("/hello", txhttp.WrapHandler(waf, handler))

	fmt.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

接下来进行测试

```bash
# 正常请求测试
curl -i "http://127.0.0.1:8080/hello?name=gopher"
# 预期
HTTP/1.1 200 OK
hello, coraza

# 拦截请求测试
curl -i "http://127.0.0.1:8080/hello?name=attack"
# 预期
HTTP/1.1 403 Forbidden
```

---

### 5. Fiber 框架使用 CorazaWAF 示例

但对我来说，我更想聊一聊怎么在 Fiber 框架中使用 Coraza。因为 Fiber 是一个特别的高性能框架，它基于更快的 FastHTTP 而并非 net/http 标准库，这也导致了在接入 Coraza 的公开接口时需要进行一次转换。

如下是一次请求体的转换，使用了 Fiber 官方仓库的转换器，避免了零内存特性造成的错误情况。

1. 零内存会复用fiber.Ctx， handler 之外可能会错误读到其他上下文的信息
2. 通过设置 fiber.Config{ Immutable: true, } 可以关闭此特性，但性能会有所下降

```go
import "github.com/gofiber/fiber/v3/middleware/adaptor"

func convertFiberToStdRequest(c fiber.Ctx) (*http.Request, error) {
	req, err := adaptor.ConvertRequest(c, false)
	if err != nil {
		return nil, err
	}

	req.RemoteAddr = net.JoinHostPort(c.IP(), c.Port())
	if req.Host == "" {
		req.Host = c.Hostname()
	}

	return req, nil
}
```

基于 Coraza 的基本使用方式我尝试写了一个简单的中间件并贡献到了 Fiber 官方的社区贡献库，这样任何人都可以很方便地在 Fiber 项目中应用 Coraza 来加载 CRS 进行规则检测。

```go
go get github.com/gofiber/contrib/v3/coraza
```

基础使用方式如下，通过 `app.Use(coraza.New(cfg))` 即可全局开启规则检测。

```go
package main

import (
	"log"

	"github.com/gofiber/contrib/v3/coraza"
	"github.com/gofiber/fiber/v3"
)

func main() {
	app := fiber.New()

	cfg := coraza.ConfigDefault
	cfg.DirectivesFile = []string{"./conf/coraza.conf"}

	app.Use(coraza.New(cfg))

	app.Get("/", func(c fiber.Ctx) error {
		return c.SendString("ok")
	})

	log.Fatal(app.Listen(":3000"))
}
```

如果在后续还想加载 CRS 作为自定义规则的一部分按照如下方式进行加载。

```go
cfg.DirectivesFile = []string{
	"./conf/crs-setup.conf",		// CRS 内的初始化文件，需要首先加载
	"./conf/rules/*.conf",			// CRS 内剩余的规则文件
}
```

如果你更在意中间件生命周期控制、规则热重载，或者想把一些观测信息暴露给自己的管理接口，那么使用 NewEngine 会更灵活。

```go
package main

import (
	"log"

	"github.com/gofiber/contrib/v3/coraza"
	"github.com/gofiber/fiber/v3"
)

func main() {
	app := fiber.New()

	engineCfg := coraza.ConfigDefault
	engineCfg.DirectivesFile = []string{
		"./conf/coraza.conf",
	}

	engine, err := coraza.NewEngine(engineCfg)
	if err != nil {
		log.Fatal(err)
	}

	app.Use(engine.Middleware(coraza.MiddlewareConfig{
		Next: func(c fiber.Ctx) bool {
			return c.Path() == "/healthz"
		},
		BlockHandler: func(c fiber.Ctx, details coraza.InterruptionDetails) error {
			return c.Status(details.StatusCode).JSON(fiber.Map{
				"blocked": true,
				"rule_id": details.RuleID,
			})
		},
	}))

	app.Get("/", func(c fiber.Ctx) error {
		return c.SendString("ok")
	})

	log.Fatal(app.Listen(":3000"))
}
```

NewEngine支持的高级能力如下：
1. 跳过某些无需检测的路径，比如健康检查接口
2. 被拦截时返回自己的业务格式，而不是默认文本
3. Engine 还暴露了 Reload()、MetricsSnapshot()、Snapshot() 和 Report() 这些数据接口，可以自行实现热更新、状态查看或者内部运维页面。

不过在使用这个中间件时有几点需要注意：

1. coraza.New() 在配置非法时会在启动阶段直接 panic，宁可启动失败，也不要带着错误规则悄悄上线
2. 如果没有配置 DirectivesFile，中间件虽然能正常启动，但不会真正加载规则
3. 请求体检测默认开启，如果你的项目里有很大的上传请求、特殊编码体或者只想做轻量级头部 / URL 检测应该关闭 RequestBodyAccess


---

### 6. 参考文献

1.OWASP Core Rule Set 官方仓库 https://github.com/coreruleset/coreruleset

2.CRS 官网 https://coreruleset.org/

3.CRS Releases(v4.25.0 LTS) https://github.com/coreruleset/coreruleset/releases/tag/v4.25.0

4.Coraza issue #1581 https://github.com/corazawaf/coraza/issues/1581

5.OWASP Coraza 仓库 https://github.com/corazawaf/coraza

6.OWASP Coraza 官网 https://www.coraza.io/

7.Fiber框架使用CorazaWAF中间件作为后端轻量防火墙 https://blog.csdn.net/qq_43403504/article/details/156943969

8.gofiber/contrib 社区贡献仓库 https://github.com/gofiber/contrib