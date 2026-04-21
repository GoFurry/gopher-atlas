---
title: 写给自己看的 GC 节奏笔记
description: 从一次线上波动出发，重新梳理 Go 垃圾回收节奏、触发点和常见误判。
author: GoFurry
createdAt: 2026-04-05
updatedAt: 2026-04-14
group: 运行时手记
groupDescription: 记录那些需要反复返回运行时层面重新理解的细节，包括 GC、调度器、逃逸分析与排障方法。
groupOrder: 1
order: 1
---

## 为什么又回来看 GC

很多时候我们以为自己在分析吞吐问题，最后真正拖慢服务的却是并不显眼的内存波动。GC 的难点不在于概念，而在于它往往被混在别的症状里。

这一轮复盘里，我最在意的是三个问题：

- GC 到底为什么在这个时间点触发
- 触发之后到底回收了什么
- 回收带来的 CPU 抖动是不是已经进入了业务可感知范围

## 先看节奏，再看结论

如果一上来就盯着 `alloc_space` 或者某一条 profile 曲线，通常会很快掉进“看到什么就解释什么”的陷阱。更稳的顺序是：

1. 先看服务的请求曲线有没有明显波峰
2. 再看堆对象总量是否随着流量同步增长
3. 最后才去判断 GC 周期是不是比预期更密

```go
var stats runtime.MemStats
runtime.ReadMemStats(&stats)
log.Printf("heap=%d next_gc=%d num_gc=%d", stats.HeapAlloc, stats.NextGC, stats.NumGC)
```

这个小片段本身并不高级，但它足够提醒我：很多时候问题不是“GC 太慢”，而是对象生成速度已经把下一次 GC 的门槛推到了眼前。

## 最后留下的判断

一次 GC 曲线不好看，并不等于程序有问题。真正值得警惕的是：

- GC 周期显著变短
- 每轮回收之后堆仍然持续上涨
- 业务延迟和 GC CPU 占比同时抬升

我更愿意把 GC 当成服务体温计，而不是单独的优化目标。
