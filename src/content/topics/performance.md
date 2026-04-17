---
title: Performance
slug: performance
summary: 围绕 benchmark、profiling 和性能设计取舍，建立先测量再优化的工作流。
readingOrder:
  - write-benchmarks-in-go
  - profiling-go-programs
  - five-things-that-make-go-fast
relatedTopics:
  - memory-gc
  - web-development
---

Go 的性能优化并不鼓励玄学。好的性能文章应该帮你形成稳定的方法论，而不是记住几个“提速技巧”。

这个专题建议先理解 benchmark，再学会使用 pprof，最后再回过头看 Go 性能表现背后的整体原因。
