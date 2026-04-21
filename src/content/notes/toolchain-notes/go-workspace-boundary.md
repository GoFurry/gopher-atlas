---
title: 我对 go work 使用边界的一些记录
description: workspace 非常好用，但它更适合开发现场，而不是把仓库之间的边界彻底抹平。
author: GoFurry
createdAt: 2026-04-07
updatedAt: 2026-04-15
group: 工具链札记
groupDescription: 用来记录 Go 工具链、模块管理和本地开发环境里的真实取舍。
groupOrder: 4
order: 1
---

## 它解决的是哪类痛点

`go work` 让多个模块协作开发时少了很多替换路径的噪音，但这并不代表仓库边界从此不重要。

## 我自己的提醒

本地开发越顺手，就越要警惕是否已经偏离真实发布关系。工具应该减少摩擦，而不是隐藏依赖事实。
