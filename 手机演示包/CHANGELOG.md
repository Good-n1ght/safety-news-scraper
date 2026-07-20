# 强安系列 — 完整检修日志

> 按时间倒序排列。每条记录包含：日期、操作人、修改内容、影响范围。

---

## 2026-07-20 — Codex 检修

### fetchArticleContent 补 return item
- **日期**：2026-07-20
- **操作人**：Codex
- **修改内容**：`强安兴企安全园地生文助手.html` 中 `fetchArticleContent()` 函数末尾补 `return item;`。原函数对 item 做了 text 赋值后未返回，导致调用方 `.then(result => ...)` 收到 undefined，直抓原文链路永远失败、误入搜索回退
- **影响范围**：安全园地生文助手 — 素材直抓原文功能
- **对应坑号**：坑30

### 强安视界多模型接口适配
- **日期**：2026-07-20
- **操作人**：Codex
- **修改内容**：`强安视界_UI改版.html` 增加 `DS_CHAT_ENDPOINT` 和 `DS_API_MODEL` 全局变量的读取与设置逻辑，模型切换时从 MODEL_MAP 读取 `chatEndpoint` 和 `apiModel`；API 调用优先使用 `DS_CHAT_ENDPOINT`，其次拼接 `baseUrl + /v1/chat/completions`
- **影响范围**：强安视界 — GLM / OpenRouter 等非 DeepSeek 模型切换
- **对应坑号**：坑31

### 强安视界写稿前 API Key 检查
- **日期**：2026-07-20
- **操作人**：Codex
- **修改内容**：`强安视界_UI改版.html` 批量写稿入口按钮增加 API Key 前置校验：Key 为空时弹出提示引导用户配置，不发请求
- **影响范围**：强安视界 — 批量写稿功能
- **对应坑号**：坑32

### 强安视界标题优化 JSON 兼容
- **日期**：2026-07-20
- **操作人**：Codex
- **修改内容**：`强安视界_UI改版.html` 标题优化 API 调用关闭 `response_format: json_object`（因为需要输出 JSON 数组而非对象），同时增加纯数组格式的解析兼容
- **影响范围**：强安视界 — 标题优化功能
- **对应坑号**：坑33

### 手机演示包同步
- **日期**：2026-07-20
- **操作人**：Codex
- **修改内容**：用根目录最新版 `强安兴企安全园地生文助手.html` 和 `强安视界_UI改版.html` 覆盖 `手机演示包/` 子目录中的同名文件
- **影响范围**：手机演示包内容同步

### Codex 二次修复 — 强安视界 chatUrl 未定义导致 AI 写稿运行时 crash
- **日期**：2026-07-20
- **操作人**：Codex（修复脚本）+ Marvis（验证）
- **修改内容**：`强安视界_UI改版.html` 的 `callDeepSeekDraft()` 函数中，`return fetch(chatUrl, ...)` 使用了未在当前作用域定义的变量 `chatUrl`。Codex 第一轮检修补了 `DS_CHAT_ENDPOINT` / `DS_API_MODEL` 全局变量和 `refreshModelRuntime()`，但漏了在 `callDeepSeekDraft` 内部定义 `chatUrl` 局部变量。语法检查通过，但运行时 `chatUrl is not defined`
- **修复**：在 `callDeepSeekDraft` 函数内部补入 `var chatUrl = window.DS_CHAT_ENDPOINT || (baseUrl + "/v1/chat/completions");`
- **影响范围**：强安视界 — AI 写稿功能
- **对应坑号**：坑34

### API Key 无效导致写稿全部失败
- **日期**：2026-07-20
- **操作人**：Marvis（测试发现）
- **修改内容**：chatUrl 修复后请求正常发出、CORS 通过，但 DeepSeek API 返回 `authentication_error`。页面硬编码的 `DS_API_KEY`（`sk-64c2daf09b0148878e917e80d9c861c6`）已被 DeepSeek 判定无效。错误处理链路正常：`callDeepSeekDraft` 捕获 → `generateArticles` 的 `.catch()` 展示失败提示，不中断批量流程。需在设置面板填入有效 Key
- **影响范围**：强安视界 — 所有依赖 DeepSeek API 的功能
- **对应坑号**：坑35


## 2026-07-20 — Marvis 检修

### 搜索后端从 Bing/SCF 代理迁移到博查 API（Bocha）
- **日期**：2026-07-20
- **操作人**：Marvis
- **修改内容**：搜索方式从 `fetch → CORS 代理 → Bing HTML 正则解析` 迁移到 `fetch → 博查 API（api.bocha.cn）→ 结构化 JSON`。废弃 CORS 代理全链路（SCF cors-proxy v1/v2/v3 / Railway 备用）。博查 API 免费额度 1000 次/月，API Key 通过环境变量管理
- **影响范围**：安全园地生文助手 — 搜索功能全链路
- **对应坑号**：坑26

### fetchArticleContent 移除 getProxy()，改为直接抓取
- **日期**：2026-07-20
- **操作人**：Marvis
- **修改内容**：`getProxy()` 标记为废弃，`fetchArticleContent()` 改为直接 `fetch(url)`，不再经过 CORS 代理。彻底移除 CORS 代理依赖
- **影响范围**：安全园地生文助手 — 全文抓取链路
- **对应坑号**：坑27

### 强安视界移除不一致的热度徽章显示
- **日期**：2026-07-20
- **操作人**：Marvis
- **修改内容**：移除了部分页面显示热度徽章、部分不显示的视觉不一致问题
- **影响范围**：强安视界 — 前端 UI

### 修复 extensions/hooks.js 和 config.js 缺失导致页面崩溃
- **日期**：2026-07-20
- **操作人**：Marvis
- **修改内容**：确认 `extensions/hooks.js` 和 `extensions/config.js` 为运行时必需文件，手机演示包中必须包含完整 extensions/ 目录
- **影响范围**：全部 HTML 页面运行时依赖
- **对应坑号**：坑29

### C盘 source/repos 目录清理，项目唯一活跃目录定为 F 盘
- **日期**：2026-07-20
- **操作人**：Marvis
- **修改内容**：确认 `F:\huituzhuansheng\...\强安系列_手机展示\` 为唯一活跃目录，C 盘 `source/repos` 标记废弃。文档所有路径统一指向 F 盘
- **影响范围**：项目目录归属
- **对应坑号**：坑28

### 文档更新
- **日期**：2026-07-20
- **操作人**：Marvis
- **修改内容**：更新 KNOWLEDGE.md（v5 博查 API 架构变更）、README.md、演示话术.md、强安系列产品介绍_汇报页.html
- **影响范围**：项目文档

---

## 2026-07-19 — v4.2 检修

### CORS 代理迁移
- **日期**：2026-07-19
- **操作人**：Marvis
- **修改内容**：KNOWLEDGE 更新 v4.2 CORS 代理迁移记录
- **影响范围**：文档

---

## 2026-07-18 — v4 检修

### 选题日历 + 栏目模板上线
- **日期**：2026-07-18
- **操作人**：Marvis
- **修改内容**：新增 TOPIC_CALENDAR（12 个月选题日历）和 COLUMN_TEMPLATES（5 个固定栏目模板按钮）。搜索回退逻辑从本地模板兜底改为 AI 自由生成
- **影响范围**：安全园地生文助手 — 选题功能
- **对应坑号**：坑20, 坑21

---

## 更早检修记录（从 KNOWLEDGE.md 坑编号提取）

### 坑29 — extensions/hooks.js 和 config.js 缺失导致页面白屏
- **日期**：2026-07
- **操作人**：Marvis
- **修改内容**：发现只复制 HTML 文件不带 extensions/ 目录会导致页面白屏。在 README 和 KNOWLEDGE 中标注 hooks.js 和 config.js 为运行时必需文件
- **影响范围**：部署/演示包完整性

### 坑28 — C盘 source/repos 目录废弃
- **日期**：2026-07
- **操作人**：Marvis
- **修改内容**：确认 F 盘为唯一活跃目录，C 盘标记废弃，文档路径统一
- **影响范围**：项目目录管理

### 坑27 — getProxy() 废弃
- **日期**：2026-07
- **操作人**：Marvis
- **修改内容**：搜索迁移至博查 API 后，`getProxy()` 标记废弃，`fetchArticleContent()` 改为直接 fetch
- **影响范围**：全文抓取链路

### 坑26 — 自建代理对抗反爬死循环，SCF v1/v2/v3 全部崩溃
- **日期**：2026-07
- **操作人**：Marvis
- **修改内容**：彻底放弃自建 CORS 代理路线。搜索改用博查 API，全文抓取直接 fetch。SCF cors-proxy v1 Express / v2 零依赖 http / v3 Railway 全部废弃
- **影响范围**：搜索全链路
- **严重程度**：严重

### 坑25 — SCF cors-proxy 四次部署失败 → 改为零依赖纯 http 模块
- **日期**：2026-06 ~ 2026-07
- **操作人**：Marvis
- **修改内容**：Express 方案四次部署均失败（缺 node_modules / 引号丢失 / 无响应），改用 Node.js 内置 http 模块实现零依赖 CORS 代理，40 行代码一次部署成功
- **影响范围**：CORS 代理
- **严重程度**：严重

### 坑24 — SCF save-draft 代理方案三次部署失败 → 废弃
- **日期**：2026-06
- **操作人**：Marvis
- **修改内容**：放弃 SCF 代理中转保存历史稿件方案，改为前端直接调用 GitHub Gist API（fetch GET + PATCH）
- **影响范围**：历史稿件保存功能
- **严重程度**：严重

### 坑23 — 修改代码不同步更新文档
- **日期**：2026-07
- **操作人**：Marvis
- **修改内容**：补更 README / KNOWLEDGE / 演示话术三份文档，覆盖选题日历、栏目模板、搜索回退、AI 兜底四项功能
- **影响范围**：文档维护

### 坑22 — GitHub Token 删除后线上版本无法更新
- **日期**：2026-06 ~ 2026-07
- **操作人**：Marvis
- **修改内容**：重新生成 GitHub PAT（只勾 repo scope，No expiration）
- **影响范围**：GitHub Pages 推送部署

### 坑21 — 选题日历内嵌主 HTML
- **日期**：2026-07
- **操作人**：Marvis
- **修改内容**：暂时保留内嵌，标注何时该外置的判断标准
- **影响范围**：代码组织

### 坑20 — searchBing 只搜安全站点 → 自定义主题哑火
- **日期**：2026-07
- **操作人**：Marvis
- **修改内容**：安全站点无结果时自动回退通用搜索，通用搜索仍无结果时 AI 自由生成兜底
- **影响范围**：搜索功能

### 坑19 — hooks.js 闭包变量作用域 bug
- **日期**：2026-07
- **操作人**：Marvis
- **修改内容**：`var i` → `let i`（解决闭包），移除无效 IIFE，修正 catch 块错误处理
- **影响范围**：extensions/hooks.js

### 坑18 — MODEL 配置硬编码在主 HTML
- **日期**：2026-07
- **操作人**：Marvis
- **修改内容**：MODEL_MAP 和 MODEL_BRANDS 外置到 extensions/config.js
- **影响范围**：配置管理

### 坑17 — NO_RESULTS 无本地兜底 → 空屏
- **日期**：2026-07
- **操作人**：Marvis
- **修改内容**：NO_RESULTS 分支增加 makeLocalDraft AI 兜底生成
- **影响范围**：搜索结果为空时的用户体验

### 坑16 — Codex 误判 .git/config Token 泄露
- **日期**：2026-07
- **操作人**：Marvis
- **修改内容**：排查后确认为误报，项目使用 HTTPS + PAT，config 中无 Token
- **影响范围**：无（误报）

### 坑15 — 页面源码泄露 API Key（严重）
- **日期**：2026-07
- **操作人**：Marvis
- **修改内容**：立即注销旧 Key、创建新 Key，清空源码中硬编码的 API Key，改为 localStorage + 设置面板填入
- **影响范围**：API 密钥安全
- **严重程度**：严重

### 坑14 — Token 有效期选了 30 天
- **日期**：2026-06
- **操作人**：Marvis
- **修改内容**：重新生成 Token，选 No expiration
- **影响范围**：GitHub Actions 管道

### 坑13 — GitHub Actions 管道失败无通知
- **日期**：2026-06
- **操作人**：Marvis
- **修改内容**：workflow 增加 `if: failure()` 自动创建 Issue
- **影响范围**：定时抓取管道监控

### 坑12 — CORS_PROXY_LIST 只有一个代理 → 单点故障
- **日期**：2026-06
- **操作人**：Marvis
- **修改内容**：增加 api.allorigins.win 备用代理，前端自动 fallback
- **影响范围**：搜索可用性

### 坑11 — scraper 删 content 存 Gist → 正文抓了又扔
- **日期**：2026-06
- **操作人**：Marvis
- **修改内容**：改为保留前 500 字正文摘要
- **影响范围**：素材库数据管道

### 坑10 — response_format json_object 部分模型不支持
- **日期**：2026-06
- **操作人**：Marvis
- **修改内容**：parseJsonContent() 增加 JSON 提取兼容（去代码块、找首尾大括号）
- **影响范围**：AI 生成解析

### 坑9 — searchBing 全站超时体验差
- **日期**：2026-06
- **操作人**：Marvis
- **修改内容**：评估后暂不修复（权衡 Promise.all vs Promise.race），单站超时 15 秒
- **影响范围**：搜索体验
- **状态**：未修复（设计权衡）

### 坑8 — Gist raw URL 缓存导致数据不刷新
- **日期**：2026-06
- **操作人**：Marvis
- **修改内容**：请求 URL 追加时间戳参数 `?_t=${Date.now()}`
- **影响范围**：素材库数据刷新

### 坑7 — 模型 API model 参数名不统一
- **日期**：2026-06
- **操作人**：Marvis
- **修改内容**：MODEL_MAP 增加 `apiModel` 字段
- **影响范围**：多模型 API 调用

### 坑6 — 模型 API 路径不统一
- **日期**：2026-06
- **操作人**：Marvis
- **修改内容**：MODEL_MAP 增加 `chatEndpoint` 字段，优先使用自定义端点
- **影响范围**：多模型 API 调用

### 坑5 — concat 后不排序
- **日期**：2026-06
- **操作人**：Marvis
- **修改内容**：多源合并后按 publishedAt 降序排列
- **影响范围**：素材列表排序

### 坑4 — API 超时 15 秒太短 → 改为 60 秒
- **日期**：2026-06
- **操作人**：Marvis
- **修改内容**：超时改为 60 秒 + 修复 done 标志位（超时回调不改变 done 状态）
- **影响范围**：AI 生成稳定性

### 坑3 — Bing 搜索结果为空（偶发）
- **日期**：2026-06
- **操作人**：Marvis
- **修改内容**：正则回退 + 宽匹配兜底
- **影响范围**：搜索可靠性

### 坑2 — Bing RSS 不支持中文 site: 查询
- **日期**：2026-06
- **操作人**：Marvis
- **修改内容**：切回 HTML 解析（cn.bing.com 正常网页搜索）
- **影响范围**：搜索方式

### 坑1 — CORS 预检失败（致命）
- **日期**：2026-05 ~ 2026-06
- **操作人**：Marvis
- **修改内容**：移除所有自定义头，只用标准头 `Accept: text/html`
- **影响范围**：浏览器 fetch 请求
- **严重程度**：致命

---

> 最后更新：2026-07-20
