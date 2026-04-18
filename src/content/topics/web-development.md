---
title: Web Development
slug: web-development
summary: 聚焦标准库驱动的 Go Web 与 API 开发：JSON 编解码、路由能力、HTTP 请求观测与模块兼容性。
readingOrder:
  - json-and-go
  - routing-enhancements-go-122
  - http-tracing
  - module-compatibility
relatedTopics:
  - performance
  - testing
  - go-new-features
---

Go 的 Web 开发魅力，很大一部分来自标准库本身。理解 `encoding/json`、`net/http`、`httptrace` 和模块演进策略，往往比单纯记住某个框架 API 更重要。

这一专题首版聚焦四个高频场景：JSON 数据处理、标准库路由增强、请求链路观测，以及长期维护中的兼容性设计。它们覆盖了从“接口怎么写”到“线上怎么观测”再到“包怎么持续演进”的核心路径。
