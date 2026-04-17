---
title: Runtime
slug: runtime
summary: 聚焦 defer、panic、recover 等运行时行为，理解 Go 在错误边界和执行流程上的取舍。
readingOrder:
  - defer-panic-and-recover
  - errors-are-values
  - five-things-that-make-go-fast
relatedTopics:
  - concurrency
  - memory-gc
---

Go 的运行时不是“隐藏细节”，而是通过少量核心机制形成很强的工程约束。

这个专题适合在掌握基本语法后阅读。它会帮助你理解为什么 Go 项目里常见的错误处理、恢复边界和性能行为是现在这个样子。
