---
title: Memory & GC
slug: memory-gc
summary: 从 slice 内存模型到 GC 演进，建立对 Go 内存与延迟权衡的直觉。
readingOrder:
  - go-slices-intro
  - go15gc
  - go-gc-journey
relatedTopics:
  - runtime
  - performance
---

很多 Go 性能问题最后都会落到内存分配、对象生命周期和 GC 行为上。

这一组内容不追求覆盖所有细节，而是优先帮助你建立“为什么会这样”的理解框架。理解框架一旦建立，再看 benchmark、pprof 或逃逸分析就会顺很多。
