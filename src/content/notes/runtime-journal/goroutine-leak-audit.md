---
title: 一次 goroutine 泄漏排查后的审计清单
description: 真正可复用的不是那次事故本身，而是事故之后留给自己的检查顺序。
author: GoFurry
createdAt: 2026-04-11
updatedAt: 2026-04-18
group: 运行时手记
groupDescription: 记录那些需要反复返回运行时层面重新理解的细节，包括 GC、调度器、逃逸分析与排障方法。
groupOrder: 1
order: 7
---

## 泄漏往往不是“忘了退出”这么简单

很多 goroutine 泄漏看起来像退出条件没写好，实际上更常见的是：

- 上游 context 没有真正传下去
- channel 关闭约定模糊
- 任务协程和结果协程的生命周期不一致

## 审计时我会问的几件事

1. 每条 goroutine 的退出条件是什么
2. 谁负责 cancel
3. 谁负责 close
4. 发生错误时，其他协程是否会一起收束

## 最后形成的习惯

如果一个并发结构没法用一句话说明“它什么时候结束”，那它大概率还没设计完整。
