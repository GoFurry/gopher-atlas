---
title: 我什么时候会用 golden file
description: golden file 很适合稳定输出的回归验证，但也会把修改成本从代码移动到样本维护。
author: GoFurry
createdAt: 2026-04-06
updatedAt: 2026-04-13
group: 测试习惯
groupDescription: 记录那些和测试设计、样例组织、回归验证有关的个人写作习惯。
groupOrder: 3
order: 2
---

## 它适合验证什么

我会在这些情况下考虑 golden file：

- 输出结构较长
- 回归对比比人工阅读更稳定
- 样本文件本身能被审阅

## 它不适合什么

如果输出经常因为无关字段变化而改动，golden file 会很快变成“不断重录”的工具，而不是回归保护。
