---
title: 从一次阻塞抖动重新观察调度器
description: 当 goroutine 数量很多时，真正值得看的并不是数量本身，而是它们如何堆在一起。
author: GoFurry
createdAt: 2026-04-06
updatedAt: 2026-04-15
group: 运行时手记
groupDescription: 记录那些需要反复返回运行时层面重新理解的细节，包括 GC、调度器、逃逸分析与排障方法。
groupOrder: 1
order: 2
---

## 调度器最容易误导人的地方

看见 goroutine 数量上涨，第一反应通常是“是不是泄漏了”。可很多时候它只是被同一个下游阻塞点拦住了。

我现在更习惯先问两个问题：

- 它们都卡在同一种状态吗
- 卡住的 goroutine 是否属于同一批请求路径

## 先把状态分开

我会先把 goroutine dump 按状态粗分：

- runnable
- syscall
- IO wait
- chan send / chan receive
- select

如果大量 goroutine 都停在同一段 middleware 或下游调用处，问题常常已经非常接近答案了。

```go
pprof.Lookup("goroutine").WriteTo(os.Stdout, 2)
```

这行代码朴素得几乎像一把螺丝刀，但在排“为什么突然很多 goroutine”时依旧非常好用。

## 我给自己的提醒

不要把调度器当成黑盒，也不要把 goroutine 数量本身当成问题描述。更准确的说法应该是：

“哪一批 goroutine，因为什么原因，在什么状态下堆住了。”
