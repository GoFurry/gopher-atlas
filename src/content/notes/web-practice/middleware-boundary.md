---
title: 中间件边界到底该停在哪里
description: 中间件最容易越界的地方，是把“通用控制”悄悄写成“业务决策”。
author: GoFurry
createdAt: 2026-04-04
updatedAt: 2026-04-12
group: Web 实践
groupDescription: 聚焦日常 Web 开发里最常碰到的接口组织、数据契约和中间层边界问题。
groupOrder: 2
order: 2
---

## 我现在只让中间件做三件事

- 通用观测
- 通用鉴权入口
- 通用请求约束

只要开始出现某个接口特有的业务分支，我就会倾向把它拉回 handler 或 service 层。

## 一个提醒

中间件一旦承担业务判断，就会在“可复用”和“可理解”之间很快失衡。
