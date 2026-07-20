# 强安兴企助手 — 架构方案与避坑指南

> 写给未来接手此项目的 AI / 开发者：本文档记录完整架构、踩过的坑、扩展方式，读完即可上手修改或新建同类项目。
>
> 最后更新：2026-07-18（v4 — 选题日历 + 栏目模板）；2026-07-19（v4.1 — 历史稿件 + 手机适配；v4.2 — CORS 代理迁移）；2026-07-20（v5 — 博查 API 替代 Bing/SCF 代理搜索、getProxy() 废弃、项目目录迁移至 F 盘）

---

## 一、架构全景

```
用户输入话题
    │
    ▼
┌─────────────────────────────────────────────────┐
│  generateDraft()                                 │
│                                                   │
│  ① searchBochaAPI(topic)                          │
│     ├─ 调用博查 API（Bocha API），免费额度 1000 次/月│
│     ├─ 遍历 SEARCH_SOURCES (7 站) 构建 site: 查询   │
│     ├─ API 直接返回结构化 JSON 搜索结果             │
│     └─ 去重取前 5 条                               │
│                                                   │
│  ② fetchArticleContent(每条结果)                   │
│     ├─ 直接 fetch 原文 URL（不再经过 CORS 代理）     │
│     ├─ getProxy() 已废弃                           │
│     └─ 正则提取正文 + 截断 6000 字                  │
│                                                   │
│  ③ callDeepSeekDraft({ topic, searchResults })    │
│     ├─ buildAISystemPrompt → 拼接搜索结果          │
│     ├─ buildAIUserPrompt → 格式化用户需求          │
│     └─ POST /v1/chat/completions → JSON 响应       │
│                                                   │
│  ④ renderAiDraft(draft)                           │
│     └─ 渲染标题、正文、配图方案、审核提醒            │
└─────────────────────────────────────────────────┘
```

**关键全局变量**：

| 变量 | 来源 | 说明 |
|------|------|------|
| `window.DS_API_KEY` | localStorage `ds_api_key` | 用户 API 密钥 |
| `window.DS_MODEL` | localStorage `ds_model` | 模型 key（如 `zhipu/glm-4.7-flash`） |
| `window.DS_BASE_URL` | localStorage `ds_base_url` | baseUrl（如 `https://api.deepseek.com`） |
| `window.DS_CHAT_ENDPOINT` | MODEL_MAP → 运行时设置 | 完整 API 端点（仅非标准路径有值） |
| `window.DS_API_MODEL` | MODEL_MAP → 运行时设置 | API 实际用的 model 名（与 MODEL 映射） |
| `window.GIST_ID` | localStorage `gist_id` | 历史稿件 Gist ID |
| `window.GIST_TOKEN` | localStorage `gist_token` | GitHub Personal Access Token |
| `window.GIST_RAW` | 拼接 `https://gist.../raw/drafts.json` | 历史稿件 raw URL |

### 1.1 云端抓取管道（GitHub Actions 定时任务）

独立于前端应用的离线数据管道，每日自动抓取安全新闻并推送至 Gist：

```
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions (.github/workflows/scrape.yml)           │
│                                                           │
│  定时触发 (schedule: cron 0 0 * * *)   ← UTC 00:00       │
│     │                                                     │
│     ▼                                                     │
│  ① Node.js 脚本 (scripts/scrape-safety-news.js)           │
│     ├─ Bing 搜索 7 大安全新闻源                           │
│     ├─ cheerio 解析 HTML / 提取标题+摘要+正文             │
│     ├─ 去重 + 分类 + 打标（保留 500 字正文摘要）          │
│     └─ 输出 JSON → 写入 Gist (GIST_TOKEN 认证)            │
│                                                           │
│  ② 失败告警                                               │
│     └─ if: failure() → actions/create-issue              │
│                                                           │
│  ③ 前端消费                                               │
│     └─ index.html fetch Gist raw URL → localStorage 缓存  │
└─────────────────────────────────────────────────────────┘
```

**链路说明**：Node.js 脚本 → Bing 搜索 → cheerio 解析 HTML → 去重分类打标 → Gist 推送（`GIST_TOKEN` 认证）→ 前端 `fetch` Gist Raw URL → `localStorage` 30 天缓存

**定时机制**：GitHub Actions `schedule` 触发，`cron: "0 0 * * *"`（UTC 00:00，即北京时间 08:00），每日一次。

**所需密钥**：

| 密钥 | 说明 | 配置位置 |
|------|------|----------|
| `GIST_TOKEN` | GitHub Personal Access Token（需 `gist` scope，**选 No expiration**，Note 标注用途） | Settings → Secrets and variables → Actions |

**关键设计决策**：
- 正文截断存 500 字（前端预览够用，不重复抓取）
- 双 CORS 代理（tencentscf + allorigins.win 备用）
- 管道失败自动建 Issue（不做静默失败）

---

## 二、数据流细节

### 2.1 博查 API 搜索（searchBochaAPI）— v5 重大变更

**原理**：浏览器 fetch → 博查 API（`https://api.bocha.cn/v1/web/search`）→ 返回结构化 JSON 搜索结果。

**为什么从 Bing HTML 解析迁移到博查 API**：
- Bing HTML 解析依赖页面 DOM 结构，搜索引擎改版会导致正则失效，历史上多次发生
- CORS 代理（SCF）部署和维护成本高，且经历了多次崩溃（v1/v2/v3）
- 博查 API 返回结构化 JSON，无需 HTML 正则提取，稳定性大幅提升
- 免费额度 1000 次/月，对于当前使用量足够
- API Key 通过环境变量管理，不写入源码

**API 调用方式**：
```javascript
// fetch POST → https://api.bocha.cn/v1/web/search
// Headers: { "Authorization": "Bearer <BOCHA_API_KEY>" }
// Body: { "q": "site:mem.gov.cn 安全生产", "count": 5 }
```

**与旧方案的对比**：

| 维度 | 旧方案（Bing + SCF） | 新方案（博查 API） |
|------|---------------------|-------------------|
| 搜索方式 | HTML 正则提取 | 结构化 JSON |
| CORS 需求 | 需要代理 | 不需要（API 已支持 CORS） |
| 稳定性 | 依赖 DOM + 代理双链路 | 单一 API 调用 |
| 维护成本 | 高（代理维护 + 正则更新） | 低（API Key 管理） |
| 成本 | 免费 | 免费（1000 次/月） |

**搜索回退逻辑保留**：安全站点无结果时 → 回退通用搜索（不限定 site:）→ 仍无结果时 AI 自由生成兜底。

### 2.2 CORS 代理（v5 已废弃）

> **注意**：v5 起搜索已迁移至博查 API，不再需要 CORS 代理。全文抓取（fetchArticleContent）也改为直接 fetch。本节保留作为历史记录。

**为什么曾经需要**：浏览器同源策略。`index.html` 是本地文件 → fetch `cn.bing.com` 会报 CORS 错误。

**方案演变**：

| 版本 | 方案 | 结果 |
|------|------|------|
| v1 | Cloudflare Worker | 不稳定，冷启动慢 |
| v2 | 腾讯云 SCF（Express） | 多次部署失败，引号丢失/缺 node_modules |
| v3 | cors-proxy-v2（零依赖 http 模块） | 成功部署但仍有单点故障风险 |
| v4 | 可选方案 Railway | 备用 |
| v5 | **废弃 CORS 代理**，改用博查 API + 直接 fetch | 不再需要代理 |

**代理代码逻辑**（proxy/index.js）：
```
请求 → express 接收 url 参数 → fetch(url) → 设置 Access-Control-Allow-Origin: * → 返回内容
```

**关键坑**：代理的 OPTIONS 响应必须声明 `Access-Control-Allow-Headers`，否则浏览器对带自定义头的请求会拦截。当前浏览器端已移除自定义头（只保留标准头 `Accept: text/html`）。

### 2.3 全文抓取（fetchArticleContent）— v5 变更

**原理**：直接 `fetch(url)` 抓取原文 URL → 去标签 → 截断 → 返回纯文本。不再经过 CORS 代理，`getProxy()` 函数已废弃。

**为什么截断 6000 字**：
- 超长内容混入大量导航/页脚/广告噪音
- 大模型 token 消耗，3600 max_tokens 约对应 2400 中文字
- 搜索返回 5 条结果 × 6000 = 3 万字 context，已足够大模型理解

**噪音处理**：
1. 移除 `<script>` / `<style>` 标签
2. 正则去 HTML 标签：`.replace(/<[^>]+>/g, " ")`
3. 压缩空白：`.replace(/\s+/g, " ")`
4. 截断前 6000 字

**已知问题**：无法区分正文和导航/页脚。某些网站正文在 JS 动态加载中（无法抓到）。某些网站反爬返回验证码页面。

### 2.4 素材库（Gist + 缓存）

**数据来源**：
- **热数据**：GitHub Gist → `https://gist.githubusercontent.com/Good-n1ght/360b3e9ec81bfee6765883cbb0da7aec/raw/safety_news.json`
- **冷数据**：localStorage `safety_materials`，缓存 30 天

**为什么用 Gist**：
- 免费、无需服务器
- 通过 Raw URL 直接获取 JSON，无 CORS 限制
- 版本历史可追溯

**为什么不用数据库**：不需要后端，零构建静态部署原则。

**数据管道**（独立于本项目的定时脚本）：
- 定时抓取 7 站 + 新增站
- 去重、分类、存 Gist
- 本应用只负责读取 + 前端缓存

### 2.5 AI 生成（callDeepSeekDraft）

**完整流程**：
```
构建 system prompt → 构建 user prompt → 
POST {model}/v1/chat/completions → 
解析 JSON 响应 → normalizeModelDraft → renderAiDraft
```

**System Prompt 结构**：
- 角色设定（国企工会安全编辑）
- 输出格式约束（JSON，5 字段）
- 内容结构要求（800-1500 字，4-5 小节 h3，操作步骤结尾）
- 禁止事项（不编数据、不喊口号、不元信息）
- 搜索结果拼接（每条附 source + title + link + text）

**User Prompt 结构**：
- 当前日期
- 用户话题 + 读者对象 + 语气要求
- 直接指令：写一篇完整文章

---

## 三、踩过的坑（按编号索引）

### 坑 1：CORS 预检失败（致命）
- **现象**：浏览器 fetch 报 `NetworkError`，F12 看到 OPTIONS 请求被拦截
- **根因**：请求带了自定义头 `X-User-Agent`（非简单头 → 触发 OPTIONS 预检 → SCF 代理未声明 `Access-Control-Allow-Headers`）
- **修复**：移除所有自定义头，只用 `Accept: text/html`（标准简单头，不触发预检）
- **教训**：浏览器端 fetch 只用标准头。如果必须自定义头，代理端要声明 CORS 允许列表。

### 坑 2：Bing RSS 不支持中文 site: 查询（中等）
- **现象**：`site:mem.gov.cn 安全` → 返回英文结果或无结果
- **根因**：Bing RSS endpoint 不支持中文 site: 组合查询
- **修复**：切回 HTML 解析（cn.bing.com 正常网页搜索）
- **教训**：RSS/Search API 对中文搜索的支持不如网页版

### 坑 3：Bing 搜索结果为空（偶发）
- **现象**：`searchBing` 返回空数组，但直接在浏览器搜有结果
- **根因**：Bing 有时对批量搜索返回 JS 渲染页面，正则提取不到
- **修复**：正则回退 + 宽匹配兜底
- **教训**：HTML 解析永远需要回退逻辑，不能假定一种正则永远有效

### 坑 4：超时 15 秒太短 → 改为 60 秒（中等）
- **现象**：大模型生成文章时长超过 15 秒，超时后异常被吞没（done 标记已设置），前端显示"网络错误"
- **根因**：原代码设置 15 秒超时，`done` 标志位在超时触发后，正常响应回来时 `done=true` 导致响应被丢弃
- **修复**：超时改为 60 秒 + 修复 done 标志位逻辑（done 只在处理后才设为 true）
- **教训**：API 异步 + 超时 + 标志位是经典 bug 组合。done 标记要在实际处理完成后才设置，超时回调不改变 done 状态。

### 坑 5：concat 后不排序（轻微）
- **现象**：素材列表顺序混乱，最新日期不在最前
- **根因**：多个来源 concat 合并后未按 `publishedAt` 排序
- **修复**：concat 后增加降序排列

### 坑 6：模型 API 路径不统一（中等）
- **现象**：DeepSeek 用 `/v1/chat/completions`，GLM 用 `/api/paas/v4/chat/completions`
- **根因**：各厂商 OpenAPI 兼容接口路径不一致
- **修复**：MODEL_MAP 增加 `chatEndpoint` 字段，调用时优先用 `chatEndpoint`
- **教训**："兼容 OpenAI 接口"不等于路径完全一致。新增模型必须确认 chat completions 端点。

### 坑 7：模型 API 的 model 参数名不统一（中等）
- **现象**：MODEL_MAP 中 key 是 `zhipu/glm-4.7-flash`，但 GLM API 期望 `model: "glm-4.7-flash"`
- **根因**：OpenRouter 统一用 `provider/model-name` 格式，智谱直连用简短名
- **修复**：MODEL_MAP 增加 `apiModel` 字段
- **教训**：新增模型时确认 API 实际需要的 model 参数值

### 坑 8：Gist raw URL 缓存导致数据不刷新（轻微）
- **现象**：云端更新了 Gist，但页面显示旧数据
- **根因**：GitHub raw URL 可能有 CDN 缓存
- **修复**：请求 URL 追加时间戳参数 `?_t=${Date.now()}`，但保留 localStorage 缓存兜底
- **教训**：任何 raw URL 都必须考虑缓存问题

### 坑 9：searchBing 全站超时体验差（体验）
- **现象**：7 个搜索源全部 timeout 时，用户要等 7×15 = 105 秒才知道"没搜到"
- **现状**：`Promise.all` 等待全部完成，最慢那个拖后腿
- **未修复**（权衡）：如果改用 `Promise.race` 可能丢失有效结果；保持现状但单站超时设为 15 秒。

### 坑 10：response_format json_object 部分模型不支持
- **现象**：某些模型忽略 `response_format: { type: "json_object" }`，返回 Markdown 包裹的 JSON
- **修复**：`parseJsonContent()` 前做 JSON 提取兼容（去掉代码块包裹、寻找首个 `{` 和末尾 `}`）
- **教训**：永远对模型返回做格式兼容解析，不能假定严格 JSON

### 坑 11：正文抓了又扔 — scraper 删 content 存 Gist（中等）

- **现象**：前端每次加载素材列表，点开文章详情还要重新抓取原文，速度慢且不稳定
- **根因**：`scrape-safety-news.js` 的 `enrichItem()` 末尾直接 `delete item.content`，存 Gist 时不带正文
- **修复**：改为保留前 500 字正文摘要（`MAX_STORED_CHARS = 500`），`item.content = (item.content || item.summary || "").substring(0, MAX_STORED_CHARS)`
- **教训**：存储层和展示层要统一考虑端到端体验。Gist 单文件 1MB 上限够用，500 字 × 20 条 ≈ 10KB 完全可控，不应因过度减体积而牺牲可用性

### 坑 12：云代理单点 — CORS_PROXY_LIST 只有一个（中等）

- **现象**：腾讯云 SCF 代理一旦挂了，整个搜索功能瘫痪，所有用户都搜不到
- **根因**：`config.js` 中 `CORS_PROXY_LIST` 只配了一个 `tencentscf` 代理
- **修复**：加了 `api.allorigins.win` 备用代理，前端自动 fallback 到下一个可用代理
- **教训**：依赖外部服务的功能必须有备用方案。单点故障容错是基础设计，代理/API/数据源都应该至少 2 个

### 坑 13：管道失败无通知 — GitHub Actions 挂了没人知道（中等）

- **现象**：定时抓取管道静默失败好几天，前端素材列表长期不更新，无人察觉
- **根因**：GitHub Actions workflow 只有 stdout 日志，无主动通知机制，维护者不会每天去看日志
- **修复**：workflow 增加 `if: failure()` 步骤，自动调用 `actions/github-script` → `github.rest.issues.create` 创建 Issue，仓库维护者第一时间获知
- **教训**：定时任务必须有失败告警机制。静默失败等于功能完全不可用，而且比直接报错更危险（发现延迟长）

### 坑 14：Token 有效期脑子短路 — 选了 30 天过期（轻微）

- **现象**：GitHub PAT 选了默认 30 天过期，一个月后管道全部中断（Gist 写入 403）
- **根因**：创建 Token 时随手选了默认 Expiration "30 days"，没意识到定时任务是长期服务
- **修复**：重新生成 Token，选 **No expiration**（或 Custom 设最长），Note 字段填写 `CI/CD pipeline — Gist update for safety-news scraper` 标注用途，Permissions 勾选 `gist` scope
- **教训**：CI/CD 类 Token 必须选 No expiration。创建时写好 Note 和最小权限，避免"一个月后这个 Token 是干嘛的"的灵魂拷问

### 坑 15：页面源码泄露 API Key → 公开仓库永久可查（严重）

- **现象**：Codex 代码审查发现 `index.html` 和 `强安视界_UI改版.html` 源码中硬编码了 DeepSeek API Key `sk-***`，且 index.html 已推送到 GitHub 公开仓库
- **根因**：开发时为了方便，把 API Key 直接写在 JS 代码里，完全没意识到文件会被推送到公开仓库。Git 历史不可逆，即使删除文件中的 Key 并强制推送，旧 commit 依然可以被任何人查看
- **应急处理**：
  1. 立即在新后台注销旧 Key、创建新 Key
  2. 清空所有源码文件中的 Key，改为 `var DEFAULT_API_KEY = ""; // 请在设置面板中填入你的 API Key`
  3. 新 Key 只通过浏览器设置面板填入，存入 localStorage，不写入任何文件
- **教训**：
  - API Key / Token / 密码等信息**永远不能**出现在源码文件里，哪怕是"暂时写着测试一下"也不行
  - 公开仓库的 Git 历史 = 互联网永久存档，推过一次就收不回来
  - 合法性：其他人 fork 了仓库就能直接用你的 Key 消费额度
  - 必须用环境变量 / localStorage / .env（加入 .gitignore）管理密钥

### 坑 16：Codex 审查说 .git/config 有 Token 泄露 → 实际不存在（轻微）

- **现象**：Codex 审查声称 `.git/config` 中包含远程仓库 Token，建议立即处理
- **排查**：`cat .git/config` 检查远程 URL，实际是 `https://github.com/...` 形式，项目全程使用 GitHub API + Personal Access Token 做 HTTPS 推送，config 里没有附加 Token
- **结论**：AI 审查工具（Codex）也会在本地环境细节上误判，应先自行验证再决定是否修改，不能盲从
- **教训**：第三方代码审查的建议要逐一核实，不能照单全收

### 坑 17：NO_RESULTS 无本地兜底 → 搜索结果为空时空屏（中等）

- **现象**：生文助手搜索返回空结果时（7 站都搜不到），原代码只弹出"未搜到相关结果"提示，页面显示空白，用户什么也得不到
- **根因**：`NO_RESULTS` 分支只有 `alert()` 提示，没有生成任何内容。场景：新话题 / 冷门关键词 / 网络故障时触发
- **修复**：在 `NO_RESULTS` 分支增加 `makeLocalDraft` 兜底生成——让大模型根据用户话题自由发挥，生成一篇不依赖搜索结果的文章，附带"以下内容未基于实时搜索结果"提示
- **教训**：每个错误分支都要考虑"用户最终能得到什么"。空结果不等于功能失败，降级输出也是有效交付

### 坑 18：MODEL 配置硬编码在主 HTML 中 → 新增模型需改核心文件（中等）

- **现象**：`MODEL_MAP`（约 13KB）和 `MODEL_BRANDS` 定义直接写在生文助手主 HTML 文件中，新增模型品牌需编辑核心文件，容易引入回归 bug
- **根因**：早期开发时所有配置都塞在一个文件里，随着模型增多（80+），配置膨胀严重
- **修复**：将 `MODEL_MAP` 和 `MODEL_BRANDS` 外置到 `extensions/config.js`，主 HTML 通过 `<script src="extensions/config.js">` 引入。引用代码保留，数据分离
- **教训**：配置文件超过 1KB 就应考虑外置。核心代码和配置数据分离，降低维护成本，新增模型不再需要改主文件

### 坑 19：hooks.js 闭包变量作用域 bug（中等）

- **现象**：`extensions/hooks.js` 中 `triggerAsync` 函数的 catch 块引用了 `.then(function(val){})` 中的 `val`，但 `val` 只在 then 回调内部作用域存在，catch 块中访问不到
- **根因**：`var i` 的闭包问题 + `.then(function(val){ return val; })` 创建了局部 `val`，catch 块想引用这个 `val` 但作用域不对。原代码还用 IIFE 尝试修复但方向错了
- **修复**：`var i` → `let i`（解决闭包），移除无效 IIFE，catch 块中改为直接处理错误而不依赖 `val`
- **教训**：异步链中的变量作用域要搞清楚。`var` 和 `let` 在循环 + 回调场景下的行为差异是 JavaScript 经典坑

### 坑 20：searchBing 只搜安全站点 → 自定义主题全面哑火（中等）

- **现象**：用户输入"唐山大地震 60 周年"→ 搜索 7 个安全站点全部空结果 → 走 `makeLocalDraft` 模板兜底 → 每次生成一模一样的"注意安全"套话
- **根因**：`searchBing` 硬编码了 `site:mem.gov.cn` / `site:chinamine-safety.gov.cn` 等安全专属域名，自定义话题在这些站里根本没有相关文章。`NO_RESULTS` 分支的模板措辞万年不变
- **修复**：
  1. 安全站点搜索无结果时，自动回退通用 Bing 搜索（不限定 `site:`）
  2. 通用搜索仍无结果时，改由 `callDeepSeekDraft` 基于主题自由生成，不再走本地模板
- **教训**：搜索源限定是好设计，但必须有通用回退路径。文员不会只写安全站点收录过的话题（"唐山大地震""季节防病"），限速不带备胎等于把路走窄

### 坑 21：选题日历数据嵌入主 HTML → 维护成本高（轻）

- **现象**：12 个月 TOPIC_CALENDAR 数据直接写在生文助手主文件中，虽然当前总量不大，但不符合配置外置原则
- **根因**：快速实现时直接就地定义，没走 config.js 外置
- **现状**：暂时保留内嵌，因为与 UI 渲染逻辑紧密耦合（`getCurrentMonthTopic` 返回值直接驱动提示条）。后续如果数据量超过 1KB 或需要多语言支持，应考虑外置到 `extensions/calendar.js`
- **教训**：新功能可以先用内嵌数据快速验证，但要在文档里标注"何时该外置"的判断标准

### 坑 22：GitHub Token 删除后线上版本无法更新 → 推送 401（中）

- **现象**：修改生文助手 HTML 后推送 GitHub Pages，返回 401 Unauthorized
- **根因**：用户此前删除了用于推送的 GitHub Personal Access Token，Git 远程认证失效
- **修复**：重新生成 Token（只勾 `repo` scope，选 No expiration），通过 GitHub Contents API PUT 推送
- **教训**：Token 管理要有记录（什么 Token、用在哪里、何时过期）。删除 Token 前确认是否有活跃的 CI/CD 依赖

### 坑 23：修改代码不同步更新文档 → 文档落后代码一个版本（中）

- **现象**：代码已经加了选题日历、栏目模板、搜索回退、AI 兜底四项功能，README / KNOWLEDGE / 演示话术三份文档完全没提
- **根因**：专注改代码，忘记维护文档。更根本的问题是"改完代码就算完"的工作习惯
- **修复**：一次性补更三份文档，README 升到 v4、KNOWLEDGE 补充新架构 + 新坑、演示话术加入新功能点
- **教训**：每次功能变更的 Definition of Done 应包括：代码 + 文档 + 踩坑记录。三者缺一不可

### 坑 24：SCF save-draft 代理方案三次部署失败 → 废弃（严重）

- **现象**：尝试在腾讯云 SCF 上部署 `/save-draft` 路由（Node.js Express），让前端通过代理保存历史稿件到 Gist。连续三次部署均失败：第一次代码粘贴出现语法错误（`#` 替代 `)`），第二次部署了简化 echo 版本没有实际 Gist 写入逻辑，第三次返回 500。
- **根因**：远程通过浏览器控制台操作 SCF 代码编辑器不可靠，粘贴大段代码容易出错，调试反馈慢。
- **修复**：彻底放弃 SCF 代理中转方案。改为前端直接调用 GitHub Gist API（fetch GET + PATCH），不经过任何代理。GitHub API 天然支持浏览器 CORS，Token 存 localStorage。
- **教训**：
  - 浏览器远程操作云平台代码编辑器不适合生产部署，应在本地写好再通过 CLI 或 zip 上传
  - 能直连就不要加中间层。GitHub API 本身支持浏览器跨域调用，加一层 SCF 纯属多余
  - 遇到同类问题时优先评估"能不能去掉这层中间件"而非"怎么修好这层中间件"

### 坑 25：SCF cors-proxy 四次部署失败 → 改为零依赖纯 http 模块（严重）

- **现象**：CORS 代理 cors-proxy（Express）部署在腾讯云 SCF 上，先后四次部署均失败：
  1. 浏览器 Agent zip 上传 → 缺 node_modules，Cannot find module 'express'
  2. 在线依赖安装后部署 → 代码引号全部丢失，SyntaxError
  3. 本地打完整 zip 包上传 → 部署后仍 443，函数完全无响应
  4. 调整超时和内存后重新部署 → 引号再次丢失
- **根因**：Express 依赖 node_modules 在线安装不可靠，浏览器 Agent 操作 SCF 控制台容易损坏代码（引号丢失），且每次故障表现不同难以定位
- **修复**：彻底放弃 Express 方案。新建 SCF 函数 cors-proxy-v2，改用 Node.js 内置 `http` 模块实现 CORS 代理，零 npm 依赖，无需 node_modules。代码 40 行，通过 SCF 在线编辑器直接粘贴部署，一次成功
- **新代理 URL**：`https://1437883484-b850njs6yb.ap-guangzhou.tencentscf.com/?url=`
- **教训**：
  - Express 对 SCF 来说是过度工程：一个简单的 request → fetch → respond 不需要框架
  - 零依赖 = 零部署问题。能用标准库就别拉框架
  - 浏览器 Agent 适合做浏览导航和简单表单，不适合操作在线代码编辑器（引号/换行/编码容易损坏）
  - 每次部署失败后要停下来重新评估方案，而不是修修补补（四次失败才醒悟，太晚）

### 坑 26：自建代理对抗反爬是死循环 — SCF v1/v2/v3 全部崩溃（严重）

- **现象**：SCF CORS 代理先后经历三次迭代（v1 Express / v2 零依赖 http / v3 Railway 备用），每次稳定一段时间后又被目标站反爬或 SCF 平台策略拦截，循环：部署成功 → 稳定几周 → 突然不可用 → 排查修复 → 部署 → 再稳定几周 → 再崩溃
- **根因**：用自建代理对抗目标网站的反爬策略，本质是猫鼠游戏。上游网站（Bing、各安全站点）有专业反爬团队和 CDN 策略，个人开发者用 SCF 单点对抗，投入产出完全不对等
- **修复**：彻底放弃自建 CORS 代理路线。搜索改用博查 API（Bocha API），它是专业的搜索 API 服务商，有专门的团队维护搜索引擎适配，我们只需要调 API 即可。全文抓取改为直接 fetch 原文 URL
- **教训**：
  - 自建代理对抗反爬是死循环，永远有下一个反爬策略在等着你。专业的事交给专业的服务做
  - 判断是否该放弃自建方案的信号：同一个问题反复出现 >3 次、每次修复成本递增、问题间隔越来越短
  - API 服务的成本（免费额度/付费）远比自建代理的维护成本（时间+精力+系统不可用损失）低

### 坑 27：getProxy() 废弃 — CORS 代理成为多余中间层（中等）

- **现象**：搜索迁移至博查 API 后，`getProxy()` 函数仍留在代码中，且 `fetchArticleContent()` 仍通过代理抓取原文。代码中存在两条路径：博查 API（直连）+ 原文抓取（经代理），架构不统一
- **根因**：迁移搜索时只改了搜索部分，忘了原文抓取也在走 CORS 代理。代理变成了一个多余的中间层——多一次网络跳转、多一个故障点，且没有任何实际收益
- **修复**：`getProxy()` 标记为废弃（保留函数体但不调用），`fetchArticleContent()` 改为直接 `fetch(url)` 抓取原文，彻底移除 CORS 代理依赖
- **教训**：迁移一个模块时要检查所有依赖该模块的上游和下游。代理不只是给搜索用的——全文抓取也在用它

### 坑 28：C盘 source/repos 目录废弃 → 项目目录碎片化（中等）

- **现象**：项目历史上曾在 `C:\source\repos` 目录下有副本，随着开发迭代被遗弃，但文档和部分脚本路径仍引用 C 盘。新接手的人可能误以为 C 盘目录还有用
- **根因**：项目从开发机迁移到 F 盘时，没有做完整的路径审计和旧目录清理
- **修复**：确认 `F:\huituzhuansheng\...\强安系列_手机展示\` 为唯一活跃目录。文档中所有路径引用统一指向 F 盘。C 盘 `source/repos` 标记为废弃
- **教训**：项目迁移后必须做路径审计（文档、脚本、配置中的所有绝对路径引用），并明确标注废弃目录。碎片化的代码库是维护噩梦的根源

### 坑 29：extensions/ 下 hooks.js 和 config.js 缺失 → 页面白屏（严重）

- **现象**：只复制生文助手 HTML 文件而不带 `extensions/` 目录，浏览器打开后页面完全白屏，控制台报 `Uncaught ReferenceError: Hooks is not defined` / `MODEL_MAP is not defined`
- **根因**：`hooks.js`（钩子系统）和 `config.js`（MODEL_MAP + SEARCH_SOURCES + GENERATION_DEFAULTS）是页面运行时的必需依赖，通过 `<script src="extensions/...">` 加载。这两个文件不是"可选扩展"，而是核心基础设施
- **修复**：在 README 和 KNOWLEDGE 中明确标注 `extensions/hooks.js` 和 `extensions/config.js` 为运行时必需文件，手机演示包中必须包含完整的 `extensions/` 目录
- **教训**：不要被"extensions"的命名误导——里面有些文件是核心依赖，有些才是可选扩展。文档里要区分清楚"必需"和"可选"

### 坑 30：fetchArticleContent 不返回 item → 直抓原文链路断裂（严重）

- **现象**：安全园地生文助手选中素材后点击"直抓原文"，调用方永远拿不到 `result.content`，只能误入搜索回退，生成的文章不使用选中素材的原文
- **根因**：`fetchArticleContent()` 函数内部对 `item.text = ...` 赋值后没有 `return item`，导致调用方 `.then(result => ...)` 中的 `result` 为 `undefined`
- **修复**：在函数末尾补上 `return item;`，确保处理后的素材对象正确返回给调用方
- **教训**：处理可变对象并返回给调用方时，必须在函数末尾显式 return。JavaScript 箭头函数省略 `{}` 可以隐式返回，但一旦用了 `{}` 就必须显式 `return`
- **发现**：Codex 检修，2026-07-20

### 坑 31：强安视界模型切换缺少适配层 → 非 DeepSeek 模型接口路径不匹配（严重）

- **现象**：强安视界切换到 GLM / OpenRouter 等模型时，API 请求失败，接口路径不匹配
- **根因**：`callDeepSeekDraft` 中直接拼接 `{baseUrl}/v1/chat/completions`，但 GLM 需要 `/api/paas/v4/chat/completions`，OpenRouter 有些模型需要不同的 model 参数名。代码缺少 `DS_CHAT_ENDPOINT` 和 `DS_API_MODEL` 全局变量，MODEL_MAP 中已定义的 `chatEndpoint` / `apiModel` 字段未被读取和设置
- **修复**：在模型切换逻辑中读取 MODEL_MAP 的 `chatEndpoint` 和 `apiModel`，设置到 `window.DS_CHAT_ENDPOINT` 和 `window.DS_API_MODEL`；API 调用时优先使用 `DS_CHAT_ENDPOINT`，其次才用 `baseUrl + /v1/chat/completions`
- **教训**：MODEL_MAP 中定义了的字段必须在运行时使用，配置和消费两边要一一对齐。新增模型品牌时必须走通完整调用链路
- **发现**：Codex 检修，2026-07-20

### 坑 32：强安视界批量写稿入口缺少 API Key 检查 → 空 Key 直接发请求（中等）

- **现象**：强安视界批量写稿功能在用户未配置 API Key 的情况下也能点击发起，请求带着空 Key 发出后必然失败，但用户看到的是不明确的网络错误
- **根因**：批量写稿入口按钮的点击事件中缺少 API Key 检查逻辑，没有在发请求前校验 `localStorage` 中 Key 是否存在且非空
- **修复**：在批量写稿入口增加 API Key 检查：Key 为空时弹出提示引导用户先去设置面板配置，不发请求
- **教训**：所有对外 API 调用的入口都应前置校验 Key。空 Key 请求不仅浪费网络和 API 额度（有些平台会计费失败请求），还让用户看到无意义的错误信息
- **发现**：Codex 检修，2026-07-20

### 坑 33：标题优化 JSON 数组被 response_format: json_object 约束破坏（中等）

- **现象**：强安视界标题优化功能期望返回 JSON 数组 `["标题1", "标题2", ...]`，但模型返回的是被包裹或格式异常的 JSON
- **根因**：API 调用中设置了 `response_format: { type: "json_object" }`，该约束要求模型返回一个 JSON 对象 `{...}` 而非数组 `[...]`。当提示词要求返回数组时，模型在 json_object 约束下行为不确定——有的模型会返回 `{"titles": [...]}`，有的会返回语法异常的数组
- **修复**：标题优化函数是少数需要 JSON 数组的场景，必须在 API 调用中关闭 `response_format: json_object`，让模型自由输出数组格式。同时在 `parseJsonContent` 兼容层增加对纯数组的解析支持
- **教训**：`response_format: json_object` 只适用于输出 JSON 对象，需要数组输出时必须关闭。不同模型对 `response_format` 的支持程度差异巨大，始终在解析前做格式兼容
- **发现**：Codex 检修，2026-07-20

### 坑 34：callDeepSeekDraft 缺少 chatUrl 局部变量 → 运行时 crash（严重）

- **现象**：强安视界点击"AI 写稿"按钮后，控制台报 `Uncaught ReferenceError: chatUrl is not defined`，写稿全链路中断
- **根因**：`callDeepSeekDraft()` 函数内部使用了 `fetch(chatUrl, ...)`，但 `chatUrl` 未在函数作用域内定义。Codex 第一轮检修补了 `DS_CHAT_ENDPOINT` / `DS_API_MODEL` 全局变量和 `refreshModelRuntime()`，但漏了在 `callDeepSeekDraft` 内部声明 `var chatUrl = ...`。语法检查通过（全局作用域中有同名变量存在于其他脚本段），但运行时的异步事件回调中 `chatUrl` 不在当前作用域链上
- **修复**：在 `callDeepSeekDraft` 函数内部补入 `var chatUrl = window.DS_CHAT_ENDPOINT || (baseUrl + "/v1/chat/completions");`
- **教训**：全局变量 ≠ 函数内部可用。JavaScript 的作用域链在脚本顶层声明和函数内部声明之间，不能靠"看起来有同名变量"来推断可用性。每次在函数中使用变量前，确认它要么是函数形参、要么是函数内部声明的局部变量、要么明确引用 `window.xxx`
- **发现**：Codex 二次修复 + Marvis 验证，2026-07-20

### 坑 35：硬编码 API Key 过期 → 请求成功但认证失败，无 JS 报错（中等）

- **现象**：chatUrl 修复后，fetch 请求正常发出、CORS 通过、HTTP 200 返回，但所有写稿结果都是"AI 写稿失败"。控制台无任何 JS 错误，只有 API 返回的 JSON 中包含 `authentication_error: Your api key is invalid`
- **根因**：页面中硬编码的 `DS_API_KEY`（`sk-64c2daf09b0148878e917e80d9c861c6`）已被 DeepSeek 平台判定为无效。这种错误不是网络层或代码层的 failure，而是业务层的认证失败，`response.ok` 为 `false` 走正常 error 分支，所以 JS 不报错、错误信息正确展示。但正因为没有红色报错，很容易被误认为"功能本身有 bug"
- **修复**：在页面设置面板中填入有效的 DeepSeek API Key。错误处理链路已验证正确：`callDeepSeekDraft` 检测 `!response.ok` → 提取 `payload.error.message` → throw → `generateArticles` 的 `.catch()` 展示失败提示并继续处理下一篇
- **教训**：
  - API Key 硬编码在 HTML 源码中是安全隐患：任何人打开页面 F12 就能看到 Key，且部署到 GitHub Pages 后 Key 完全公开。应改为仅通过设置面板输入、存 localStorage，源码中不包含真实 Key
  - "功能跑通了但结果全是失败" ≠ 代码有 bug。排查时要区分：网络层（CORS/超时）、代码层（JS 报错/逻辑错误）、业务层（认证失败/额度不足/参数错误）
- **发现**：Marvis 测试验证，2026-07-20

### 坑 36：fetch 无超时 → API 不响应时 UI 永久卡死（严重）

- **现象**：输入正确 API Key 后点击"AI 写稿"，UI 永远显示"AI 正在写文章 (0/N)..."，5 分钟以上无任何反馈——没有结果、没有报错、没有超时提示
- **根因**：`callDeepSeekDraft()` 中的 `fetch()` 没有设置超时。当 DeepSeek 服务端不响应（不返回成功也不返回错误）时，fetch Promise 永远处于 pending 状态，`.then()` 和 `.catch()` 都不会触发。`generateArticles` 的递归处理逻辑在 `.then()` / `.catch()` 中，所以后续文章全部阻塞
- **对比**：安全园地生文助手的同名函数早已加了 `AbortController` 超时机制，强安视界是从旧版拷贝过来的，漏了这层防护
- **修复**：在 `callDeepSeekDraft` 中加入 `AbortController` + 120 秒超时，超时后抛出 `"DeepSeek API 请求超时（120秒），请检查网络或稍后重试"`；同时在 `.then()` 和 `.catch()` 中都调用 `clearTimeout(timer)` 避免内存泄漏
- **教训**：
  - 任何对外部 API 的 `fetch()` 都必须带超时，否则一个挂起的请求会卡死整个用户界面
  - 两个产品（安全园地/强安视界）共用同名函数时，修复一个必须同步检查另一个。本次强安视界的 `callDeepSeekDraft` 是旧版拷贝，安全园地的超时修复未同步过来
  - "UI 卡死、没有任何报错"几乎肯定是 Promise 挂起（而非 reject），优先排查 fetch 超时 / 死锁 / 无限递归
- **发现**：用户测试反馈 + Marvis 分析，2026-07-20

### 3.1 v4 新增：选题日历（TOPIC_CALENDAR + getCalendarKeywords）

**数据结构**：
```javascript
var TOPIC_CALENDAR = {
  1: { topic: "岁末年初安全生产与冬季三防", keywords: "冬季防火 防冻 防滑 岁末年初..." },
  2: { topic: "节后复工复产安全", keywords: "复工复产 节后收心 设备检修..." },
  // ... 每月一条
  7: { topic: "汛期三防与防暑降温", keywords: "防汛 防雷 防暑 高温..." }
};
```

**工作流**：
1. 页面加载 → `getCurrentMonthTopic()` 获取当月主题
2. UI 渲染黄色提示条显示当月选题，点击可填充输入框
3. `getCalendarKeywords()` 返回当月关键词
4. `searchBing()` 搜索时把 `calendarKW` 注入到搜索 query 中

**与栏目模板的关系**：栏目模板的提示词前缀会自动拼接当月选题前缀，如"当前是 7 月（汛期三防与防暑降温）"。

### 3.2 v4 新增：栏目模板（COLUMN_TEMPLATES）

5 个固定栏目按钮，每个携带结构化提示词模板：

```javascript
var COLUMN_TEMPLATES = {
  "事故案例分析": {
    prompt: "请模拟一篇面向矿山一线职工的【事故案例分析】文章..."
  },
  "班前会要点": { ... },
  "安全知识问答": { ... },
  "本周安全之星": { ... },
  "季节性提醒": { ... }
};
```

`applyTemplate(templateKey)` 函数负责：
- 拼接当月选题前缀（如"当前是 7 月（汛期三防与防暑降温）"）
- 将完整提示词填入 textarea
- 自动触发搜索

### 3.3 v4 搜索回退逻辑改造

原流程：`searchBing` → 7 个安全站点 → 无结果 → 弹出"未搜到"
新流程：
1. `searchBing` 先用安全站点搜
2. 安全站点无结果 → 自动回退通用 Bing 搜索（不加 `site:` 限制）
3. 通用搜索仍无结果 → `callDeepSeekDraft` 自由生成（不再走本地模板兜底）

**设计理由**：自定义主题（如"唐山大地震 60 周年"）在安全站点搜不到是正常现象，不应阻断用户。AI 自由生成虽然缺少实时搜索结果支撑，但至少能产出可用的草稿。

---

## 四、如何扩展

### 4.1 添加新搜索源

在 `extensions/config.js` 的 `SEARCH_SOURCES` 中新增：

```javascript
{ name: "新站点名", site: "example.com", enabled: true, keywords: "关键词1 关键词2 关键词3" }
```

- `keywords` 用于增强 Bing 搜索精度，中英文均可
- `enabled: false` 可临时关闭该源

### 4.2 添加新模型品牌

1. 在 `extensions/config.js` 的 `MODEL_MAP` 中添加模型条目
2. 在 `MODEL_BRANDS` 中添加品牌分组
3. 如果 API 路径非标准，加 `chatEndpoint` 
4. 如果 API model 参数名与 key 不同，加 `apiModel`

```javascript
// MODEL_MAP 中：
"brand/model-name": {
  name: "显示名称 (上下文大小)",
  baseUrl: "https://api.example.com",
  chatEndpoint: "https://api.example.com/custom/path/chat/completions",  // 可选
  apiModel: "model-name"  // 可选
}

// MODEL_BRANDS 中：
{ name: "品牌名", models: ["brand/model-name"] }
```

### 4.3 添加扩展逻辑

1. 复制 `extensions/_template.js` → `extensions/my-feature.js`
2. 选择合适的钩子：
   - `Hooks.BEFORE_SEARCH` — 修改搜索参数
   - `Hooks.AFTER_SEARCH` — 过滤/增强搜索结果
   - `Hooks.AFTER_GENERATE` — 修改生成的文章
   - `Hooks.BEFORE_API_CALL` — 修改 API 请求
3. 实现回调函数
4. 在 `index.html` 中加载该扩展文件（`<script src="extensions/my-feature.js"></script>`）

### 4.4 修改生成参数

直接改 `extensions/config.js` 中的 `GENERATION_DEFAULTS`：

```javascript
var GENERATION_DEFAULTS = {
  temperature: 0.9,       // 创造性（0-2）
  max_tokens: 3600,        // 最大生成 token
  fetch_timeout_ms: 12000, // 单篇文章抓取超时
  search_timeout_ms: 15000,// 单个搜索源超时
  api_timeout_ms: 60000,   // AI API 超时
  max_content_chars: 6000, // 全文截断长度
};
```

---

## 五、部署选项

| 方案 | 说明 | 适用 |
|------|------|------|
| 本地文件 | 浏览器直接打开 index.html | 个人使用 |
| Railway | `railway.json` + `Procfile` 已配好 | 团队共享 |
| GitHub Pages | 静态托管，只需 index.html | 公开演示 |
| 腾讯云 SCF | CORS 代理已在此部署 | 已有配置 |

---

## 六、技术决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 前端框架 | 原生 JS（零框架） | 零构建、免构建、即开即用 |
| 搜索方式 | 博查 API（Bocha API） | 免费额度 1000 次/月，结构化 JSON 返回，无需 HTML 解析，无 CORS 问题 |
| CORS 方案 | 无需代理（v5 起） | 博查 API 原生支持 CORS，全文抓取直接 fetch |
| 数据存储 | GitHub Gist + localStorage | 免费、免后端、支持离线 |
| 模型接入 | OpenAI 兼容接口 | 标准化、切换方便 |
| 文章格式 | JSON 约束 | 结构化、便于前端渲染 |
| 密钥管理 | 浏览器 localStorage | 简单，但需告知用户换设备需重新填写 |
| 项目目录 | F 盘 `强安系列_手机展示/`（唯一活跃目录） | C 盘 `source/repos` 已废弃 |

---

## 七、已知局限（不给未来挖坑）

1. **博查 API 免费额度限制**：1000 次/月，超出需付费。当前使用量远低于限制，但如果搜索频率大幅增加需关注
2. **无真正的 API 鉴权**：API Key 存 localStorage，任何人打开同一浏览器都能看到
3. **响应式不完善**：针对桌面设计，移动端体验差
4. **搜索串行瓶颈**：7 站全部超时 = 105 秒等待，可考虑 Web Worker 并行但复杂度高
5. **文章质量上限 = 搜索结果质量**：搜不到好内容 → 模型只能泛泛而谈
6. **GLM 与其他模型行为差异**：response_format 支持程度、返回 JSON 格式严格度不同，`parseJsonContent` 已做兼容但边缘情况仍可能出错
7. **extensions/ 目录依赖**：`hooks.js` 和 `config.js` 是运行时必需文件，缺失会导致页面白屏。发布/演示时必须确保该目录完整
8. **C 盘 source/repos 目录残留**：已废弃但未物理删除，新接手应忽略 C 盘、只关注 F 盘 `强安系列_手机展示/`
