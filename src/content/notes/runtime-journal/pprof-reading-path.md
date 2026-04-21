---
title: 我给自己定的一条 pprof 阅读路径
description: 面对 profile 时，先看什么、后看什么，决定了你是在读证据还是在追幻觉。
author: GoFurry
createdAt: 2026-04-09
updatedAt: 2026-04-16
group: 运行时手记
groupDescription: 记录那些需要反复返回运行时层面重新理解的细节，包括 GC、调度器、逃逸分析与排障方法。
groupOrder: 1
order: 5
---

## 不要一上来就盯着火焰图顶部

火焰图很有视觉冲击力，但也很容易让人把最大的块误认为“唯一的问题”。我的习惯是先按这条顺序走：

1. 先确认 profile 的采样时间和业务波动是否对齐
2. 再区分 CPU、heap、alloc、goroutine 是哪一类 profile
3. 最后才去盯住最重的调用路径

## 看 heap 和 alloc 时要分开理解

- `heap` 更像现在留下了什么
- `alloc` 更像一路上到底花掉了什么

如果我看到 `alloc` 很高但 `heap` 并不高，通常会先怀疑对象生命周期短、创建频繁，而不是内存泄漏。

## 一条给未来自己的注释

Profile 是线索集合，不是判决书。先建立阅读路径，再下结论，会让排障稳定很多。
