---
title: Concurrency
slug: concurrency
summary: 从 goroutine、channel 到 context 和取消传播，建立 Go 并发模型的核心认知。
readingOrder:
  - share-memory-by-communicating
  - go-context
  - go-pipelines
relatedTopics:
  - runtime
  - testing
---

并发是 Go 最有辨识度的能力之一，但它真正的价值不在语法糖，而在一套更容易组合的思维方式。

这个专题建议先读设计哲学，再读模式与取消，最后再回到工程实践里验证 race detector、subtests 与 profiling 的配合。

如果你经常写后台任务、worker pipeline 或服务端请求链路，这一组文章会非常值。
