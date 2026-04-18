---
title: Go New Features
slug: go-new-features
summary: 聚焦 Go 1.25 与 1.26 中最值得开发者关注的两篇新特性文章，理解运行时与编译器层面的真实改进。
readingOrder:
  - green-tea-gc
  - allocation-optimizations
---

Go 的新特性通常不是“炫技式更新”，而是围绕可维护性、可读性、标准库能力和工程体验做渐进增强。

这一专题先收录两篇最有代表性的文章：一个讲 Green Tea GC 如何降低垃圾回收 CPU 开销，一个讲编译器怎样把更多分配优化到栈上。它们都直接对应未来几年 Go 工程实践里最常见的性能问题。
