---
title: 我如何整理一个 handler 的边界
description: 一个顺手的 handler 往往不是功能最多的那个，而是职责最清楚的那个。
author: GoFurry
createdAt: 2026-04-03
updatedAt: 2026-04-12
group: Web 实践
groupDescription: 聚焦日常 Web 开发里最常碰到的接口组织、数据契约和中间层边界问题。
groupOrder: 2
order: 1
---

## handler 不该知道太多

我更喜欢把 handler 当成一层翻译器：接收请求、解析输入、调用应用服务、写回响应。逻辑可以在这里发起，但不要在这里越长越厚。

## 一个顺手的组织方式

```go
func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
    req, err := decodeCreateUserRequest(r)
    if err != nil {
        writeError(w, err)
        return
    }

    user, err := h.service.Create(r.Context(), req)
    if err != nil {
        writeError(w, err)
        return
    }

    writeJSON(w, http.StatusCreated, user)
}
```

这样的边界虽然朴素，但能让错误路径、业务逻辑和响应格式分得很清楚。
