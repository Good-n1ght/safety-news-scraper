---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 1d901ace6510f3f7162dab4a93f6993e_50ca1a53889811f1a68c525400826444
    ReservedCode1: +wXzpkkzC8S0y2e8p/tD75jKXUGCHkMji+c9CLzG15T6syLoIxcAoNZJWUwEGgj3S6iWoXV/Mmu7w7PhUrQuvc0jM6FS/upl4i7htZDRuQ2n5jWhg2LwTB0jC+bkxXVYwoqFwbtAx4mYn03/E1usx4Q6TdVyM9mof9uhF1SLMHAnlvEgCaHEGFeU0ek=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 1d901ace6510f3f7162dab4a93f6993e_50ca1a53889811f1a68c525400826444
    ReservedCode2: +wXzpkkzC8S0y2e8p/tD75jKXUGCHkMji+c9CLzG15T6syLoIxcAoNZJWUwEGgj3S6iWoXV/Mmu7w7PhUrQuvc0jM6FS/upl4i7htZDRuQ2n5jWhg2LwTB0jC+bkxXVYwoqFwbtAx4mYn03/E1usx4Q6TdVyM9mof9uhF1SLMHAnlvEgCaHEGFeU0ek=
---

---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 1d901ace6510f3f7162dab4a93f6993e_a7d8ae9e87de11f1a68c525400826444
    ReservedCode1: MdXRpbU0nIOy5S3Vg49Nuf9mXecI9fRndAGr7n4qWBhpoocmp/K49cw0mBqUBXgG0P5Rd6u7I8vb8aQgEd7X8slzsKLAHh3tydL50tJmQZ9oTxr14x+XGbI4QJPIZOF9c5CPhplNlfLvF40fzA3GMbt0mrssa3mKKiVGZ1sRSD5KYECFQmTFbXiHEM0=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 1d901ace6510f3f7162dab4a93f6993e_a7d8ae9e87de11f1a68c525400826444
    ReservedCode2: MdXRpbU0nIOy5S3Vg49Nuf9mXecI9fRndAGr7n4qWBhpoocmp/K49cw0mBqUBXgG0P5Rd6u7I8vb8aQgEd7X8slzsKLAHh3tydL50tJmQZ9oTxr14x+XGbI4QJPIZOF9c5CPhplNlfLvF40fzA3GMbt0mrssa3mKKiVGZ1sRSD5KYECFQmTFbXiHEM0=
---

---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 1d901ace6510f3f7162dab4a93f6993e_cea2154687da11f1b66e525400e6dd8f
    ReservedCode1: 6t7dlUWsd5sYcwoMFSHqR9gyUSA+LdeusXGcAR/ndmb0LMeiKY8wnu19R6dVzj/wzL1QdjcUyHMvhSl0OB/3SOOiQSCvaQ+hyZbZZuaqtPGl9hkyARaSTtJfGWxcYS4JEdU1p5/Q7s3pWclaIAVIEXPVz188/hDFEIVvJrK3nCoC4VP6lreYlm25sN4=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 1d901ace6510f3f7162dab4a93f6993e_cea2154687da11f1b66e525400e6dd8f
    ReservedCode2: 6t7dlUWsd5sYcwoMFSHqR9gyUSA+LdeusXGcAR/ndmb0LMeiKY8wnu19R6dVzj/wzL1QdjcUyHMvhSl0OB/3SOOiQSCvaQ+hyZbZZuaqtPGl9hkyARaSTtJfGWxcYS4JEdU1p5/Q7s3pWclaIAVIEXPVz188/hDFEIVvJrK3nCoC4VP6lreYlm25sN4=
---

# 强安系列 — 完整检修日志

> 按时间倒序排列。每条记录包含：日期、操作人、修改内容、影响范围。

---

## 2026-08-02 — v5.12.8 代理遍历 + 提示文案修正（执行方：Claude Code）

### 问题（用户实测反馈）
- 素材原文浏览器地址栏能打开，但程序仍提示"原文链接已失效"

### 根因（实测）
- 浏览器地址栏直接访问不受 CORS 限制；但页面代码 fetch 素材源站（政府网站无 CORS 头）必被拦——"能打开"≠"能抓取"
- 实测现有 CORS 代理全部不可用：HTML 内置 SCF 代理 502 ECONNREFUSED；config.js 的 SCF 代理部署错误（scf_bootstrap exec format error）；allorigins 400；corsproxy.io 返回固定占位页——代理重试形同虚设
- 原提示文案"原文链接可能已失效"在"能打开但抓不到"场景下误导

### 修复
- 代理重试改为**遍历整个 CORS_PROXY_LIST**（每个 6s 超时，不再只试第一个）
- 提示文案改为"原文抓取受限（跨域/源站不可达），已用素材库素材补充生成"

### 外部待办（需用户操作）
- 腾讯云 SCF 代理：`scf_bootstrap` 报 exec format error（部署损坏），需在腾讯云控制台重新部署/修复；或提供可用代理地址加入 CORS_PROXY_LIST

### 验证
- 多代理遍历/全失败降级/文案 3 项行为测试通过
- 影响范围：强安兴企安全园地生文助手.html（fetchArticleContent / generateDraft 提示）

---

## 2026-08-02 — v5.12.7 全面复检修复：死链补充逻辑被绕过（执行方：Claude Code）

### 复检发现的两个真 bug（v5.12.3/4 引入）
1. **死链素材补充逻辑被阈值绕过**：触发条件为"抓取内容 < 80 字"，但死链素材降级后是摘要（101 字）> 80 → 补充逻辑不触发 → 模型仍只用 101 字摘要硬写
2. **会话缓存分支缺降级标记**：第二次点同一素材走缓存提前返回，无 contentFellBack 标记，摘要 > 200 字的素材会被绕过补充逻辑

### 修复
- fetchArticleContent 降级 catch 与缓存分支均打 `contentFellBack = true` 标记
- generateDraft 判断升级：`!content || contentFellBack || content.length < 200` 任一命中即走素材库补充

### 验证
- 真实代码提取测试：死链素材（摘要 99 字）→ contentFellBack=true → 触发补充逻辑 ✅
- 21 项静态复检全过（含两处误报澄清：isFreeModel 分支存在、硬编码 Key 为 0）
- 影响范围：强安兴企安全园地生文助手.html（fetchArticleContent / generateDraft）

---

## 2026-08-02 — v5.12.6 修复：模型输出被截断导致 JSON 解析失败（执行方：Claude Code）

### 问题（用户实测反馈）
- 线上生成报「生成失败(模型未返回可解析 JSON)，已用本地模板兜底」

### 根因
- `max_tokens` 上限 3600：模型输出较长（如正文 2000+ 字 + JSON 包装 ≈ 3400+ token）时被截断，JSON 不完整 → 解析失败
- 端到端实测印证：3600 下输出 3287 字符已逼近上限

### 修复
- `max_tokens` 3600 → 8000
- 解析失败时 console.warn 记录模型原始输出前 300 字，便于后续定位

### 验证
- 端到端测试 2 次全过（25s/40s，JSON 解析 ✅，正文 1759/1463 字）
- 影响范围：强安兴企安全园地生文助手.html（callDeepSeekDraft / parseJsonContent）

---

## 2026-08-02 — v5.12.5 免费模型兼容 + 错误提示细化（执行方：Claude Code）

### 背景
- 用户反馈：填了博查 Key 后仍失败/错误/兜底；使用者会选免费模型
- 实测验证：博查 Key 可用（真实返回搜索数据）；GLM/OpenRouter/DeepSeek 三品牌端点全部连通（401=路径正确）

### 根因
- 代码对所有模型**无条件发送 `response_format: json_object`**——OpenRouter 免费模型（:free）普遍不支持该参数，选了免费模型必报 400 → 失败
- 60 秒超时对免费模型偏短（免费模型排队+生成常超 60s）
- 失败时统一提示"网络错误"，真实原因被吞掉，误导排查

### 修复
- 免费模型（:free）不发送 response_format；普通模型保留
- 非 free 模型若仍报 400（个别模型不支持）→ 自动去掉 response_format 重试一次
- 超时放宽：普通模型 60s → 120s，免费模型 180s
- 失败提示显示真实原因（截断 40 字），不再统称"网络错误"

### 验证
- 5 项行为测试全过（普通带格式/免费不带/400 自动重试/超时分级/真实错误透传）
- 影响范围：强安兴企安全园地生文助手.html（callDeepSeekDraft + 失败提示）

---

## 2026-08-02 — v5.12.4 修复：连续生成失败（死链重复等待超时，执行方：Claude Code）

### 问题（用户实测反馈）
- 第一次生成成功，第二、三次生成失败显示错误/兜底

### 根因
- 死链素材每次生成都重走「直连超时/秒拒 + 代理 12s 超时」，单次原文抓取就要等 ~12-24 秒；再叠加模型调用时长，连续生成时多次触发超时/兜底

### 修复
- **会话级失败缓存** `_fetchFailCache`：本次页面生命周期内抓取失败的链接直接降级用摘要，不再重复等待（实测：首次 8s → 二次 0ms）
- 代理重试超时 12s → 8s，死链素材整体等待上限约 9s

### 验证
- 行为测试：首次失败降级 8s / 二次 0ms 直降 / 不同链接不受影响，全部通过
- 影响范围：强安兴企安全园地生文助手.html（fetchArticleContent）

---

## 2026-08-02 — v5.12.3 修复：死链素材生成质量低（执行方：Claude Code）

### 问题（用户实测反馈）
- 用"六必讲"素材生成：线上提示已兜底、质量低；正文与素材标题关联度差

### 根因（实锤验证）
- 该素材原文链接已失效：实测直连 301→空内容、走代理报证书错误（域名已被美团系 CDN 接管）——**抓取管道当年入库时未验证链接有效性，死链也入库**
- 前端抓原文失败后只有 101 字摘要可用，AI 就着 101 字写 800-1500 字 → 必然硬编、不贴题
- 素材库该主题仅 1 条，同主题匹配不到补充素材

### 修复
- 原文抓取失败时不再回退搜索绕圈子：用「选中素材完整摘要 + 素材库相关素材」直接喂 AI
- 相关素材匹配升级：话题词 + **选中素材标题关键词扩展**（"六必讲"可提取出入井/班前/饮酒等词），按命中词数排序取前 3
- prompt 第 0 条放宽：材料有限时基于要点逐条展开 + 按煤矿通用规程补充操作细节；仍禁止虚构事件/数据/文件文号
- 实测（真实素材库）：喂给 AI 的信息量 101 字 → 302 字，匹配 3 条矿山安全相关素材

### 遗留建议（管道侧，未做）
- 抓取管道入库前验证链接有效性（HEAD/抓取测试），死链标记或剔除，从源头减少此类素材

### 影响范围
- 强安兴企安全园地生文助手.html（generateDraft 死链分支 + buildAISystemPrompt）

---

## 2026-08-02 — v5.12.2 修复：选素材抓不到原文（浏览器 CORS 拦截，执行方：Claude Code）

### 问题（用户实测反馈）
- 在安全素材里选中素材（如"六必讲"）点生成，仍提示"搜索失败/已兜底"，正文质量低

### 根因（实锤验证）
- 素材原文链接均为政府/行业网站（应急管理部、矿山安全监察局等），**实测响应头无 Access-Control-Allow-Origin**——浏览器从 GitHub Pages 直接 fetch 必然被 CORS 拦截
- v5 曾判定"CORS 代理废弃、全文抓取直接 fetch"——**该判断在服务器端成立，在浏览器端不成立**，导致"选素材抓原文"这条核心链路在浏览器里长期不可用，只是被兜底路径掩盖

### 修复
- `fetchArticleContent` 重构：先直连，**失败（CORS/网络）自动改走 SCF CORS 代理重试一次**，仍失败才降级用摘要
- 复用项目既有的 CORS_PROXY_LIST（SCF 代理，实测可用）

### 验证
- 语法校验通过；行为测试 3 场景全过（直连失败→代理成功 / 直连成功不走代理 / 全失败降级摘要不崩溃）
- 影响范围：强安兴企安全园地生文助手.html（fetchArticleContent）

---

## 2026-08-02 — v5.12.1 修复：正文 HTML 标签显示成乱码（执行方：Claude Code）

### 问题（用户实测反馈）
- 生成文章正文中出现 `H3`、`P` 等"乱码"，本地版小标题消失、变成一整段
- 线上搜不到"六必讲"等煤矿行业词时兜底生成质量低

### 根因
- v5.11 XSS 修复时正文整体转义，但白名单只还原了 img-hint/br/div——**模型正文的结构标签（h3/p/strong/ul/li 等）没还原，直接以文字形式显示**，小标题全变 `<h3>` 文本
- 兜底路径（网上搜不到 → AI 自由生成）无任何素材可引用，凭空写 → 质量低

### 修复
- 白名单扩展：还原正文所需全部结构标签（h3/h4/p/strong/b/em/ul/ol/li/br/blockquote/img-hint）；**带属性的标签（onclick 等）一律不还原，保持转义**，危险标签（img/script）保持转义
- 兜底改进：网上搜不到时，先从本地素材库按话题关键词（标题/摘要/标签）匹配最多 3 条相关素材喂给 AI，避免凭空编；无匹配才退回纯自由生成

### 验证
- 语法校验通过；标签还原 6 项 ✅ + 安全 4 项 ✅（img/script/onclick 全部保持转义）
- 影响范围：强安兴企安全园地生文助手.html（renderAiDraft 白名单 + NO_RESULTS 兜底）

---

## 2026-08-02 — v5.12 写作质量优化：治"标题不挨正文" + 治"内容枯燥"（执行方：Claude Code）

### 治"标题不挨正文"
- **根因**：prompt 对标题只要求"抓眼球"（无内容对应约束），标题与正文由模型一次生成、各写各的；生成后无任何核对
- **修复**：
  - prompt 增加硬约束：标题必须基于素材/主题的真实元素生成，禁止使用正文中没有的主题词/数据/地名
  - 新增 `ensureTitleMatchesContent`：生成后按标题关键词在正文中的命中率核对（<30% 视为脱节），自动从 3 个备选标题中挑最匹配的顶上（零成本，不重新调模型）；所有生成路径（搜索/AI 自由生成/本地模板）统一生效
  - 修复过程中发现并解决：关键词提取正则 `\W` 会误删所有中文（改为字符码过滤）

### 治"内容枯燥"
- **根因**：10 条搜索结果全文（每条最多 6000 字）全量喂给模型，上下文被塞满（约 6 万字符），模型抓不住细节 → 只能写"一二三四点"总结腔
- **修复**：
  - 新增 `selectSearchResults` 素材精选：只保留前 5 条、每条正文截断到 800 字
  - prompt 增加"必须引用素材中至少 2-3 处具体信息（时间/数字/地点/措施）"硬要求
  - prompt 增加负面清单：禁止总结腔、"正确的废话"、"首先/其次/最后"开头
  - 正文节选拼接处兜底截断 800 字

### 验证
- 语法校验通过；行为测试 7 项全过（匹配保持/脱节换备选/无备选不崩/备选移除/数字关键词/素材精选 10→5/单素材不误伤）
- 未触碰素材评分/抓取/新增标记/排序等核心机制

### 影响范围
- 强安兴企安全园地生文助手.html（buildAISystemPrompt / 生成链路 / 新增两个函数）

---

## 2026-08-02 — v5.11 独立审查整改：安全加固 + 功能修复（外部审查方执行）

### 安全：博查 API Key 硬编码移除（已泄露，需吊销）
- **问题**：`sk-a980fe7a…` 明文硬编码在搜索请求头（3 个文件×2 处），公开仓库 + GitHub Pages 全网可查，任何人可盗用 1000 次/月免费额度
- **修复**：Key 移出源码，设置面板新增「博查 API Key」输入框，存 `localStorage("bocha_api_key")`；未配置时 toast 提示并降级为 AI 自由生成
- **必须人工操作**：旧 Key 已泄露不可撤回，请到博查控制台吊销并换新
- **影响范围**：强安兴企安全园地生文助手.html（设置面板 + searchBocha）

### 安全：两处 AI 渲染 XSS 消毒
- **强安视界** `renderGeneratedArticles`：AI 写稿正文先 `escapeHtml` 再替换换行（原直接拼 innerHTML，标题来自第三方源可被植入 `<img onerror>`，模型回显后注入 DOM）
- **生文助手** `renderAiDraft`：正文整体转义 + 白名单还原（`img-hint` / `<br>` / `</div>`），防提示注入链

### 功能：gistTokenInput 未注册修复（P0 bug）
- **问题**：`initSettings` 的 els 映射缺 `gistTokenInput`，保存设置时恒取空串并清空已存 Token，「保存到历史」功能完全不可用
- **修复**：els 补注册 + 打开面板时回填当前值

### 健壮性：fetch 超时封装（防永久卡死）
- 两个 HTML 新增 `fetchWithTimeout`（默认 30s）；生文助手：素材拉取/历史列表/博查搜索（15s）全部接入；强安视界：7 RSS + 4 百度榜 + 5 Bing 全部接入（15s），修复任一源挂起导致 `Promise.all` 永不 settle、兜底数据永不触发的问题
- 顶层 `localStorage` 读取加防护（`_lsGet`），存储被禁用/隐私模式下不再白屏

### 数据安全：Gist B 404 重建保护（scrape-safety-news.js）
- **问题**：raw 404（CDN 抖动/gist 转私有）被当作"文件不存在"→ 走初始化 → 历史 100 条展示库被本轮 30 条覆盖，永久丢失
- **修复**：404 时先用 Gist API（带 Token）复读确认；API 确认存在/无法确认时中止本轮写入并告警，仅 API 确认 404 才允许初始化

### 数据质量：百度热榜热度值修正（强安视界）
- **问题**：`hotTag` 实测为排名/状态字符串（"0"-"9"），非热度值，40 分热度权重形同虚设
- **修复**：改用榜单名次映射热度 `100 - index`

### 交付洁净度：消除双文件
- 删除 `生文助手.html`（v5.0.1 旧版、GitHub Pages 首页无链接引用、含已泄露 Key）；线上唯一入口为 `强安兴企安全园地生文助手.html`
- 手机演示包同步主文件 + 强安视界（MD5 对齐）

### 配套文档
- 新增 `独立审查报告_2026-08-02.md`（外部独立审查发现）与 `复核裁定_2026-08-02.md`（对 Marvis 反馈的逐条裁定）
- 本条目由外部审查方执行，未走原 Marvis 流程

---

## 2026-07-30 — v5.0.1 Gist B 历史素材缺 addedAt 修复 + 全面收口

### 首次访问新增标记兜底（24 小时截断）

- **日期**：2026-08-01
- **问题**：用户首次在手机上打开页面 → `mat_last_view_at` 为空 → 不标任何新增 → 同时设置 `mat_last_view_at` 为当天日期 → 白白吃掉一整天的标记机会（次日才恢复）
- **根因**：`lastViewAt` 为空时直接跳过标记，缺少首次访问兜底
- **修复**：`lastViewAt` 为空时，取最近 24 小时（`Date.now() - 24h`）内入库的素材标新增
- **Commit**: `待合入`
- **影响范围**：强安兴企安全园地生文助手.html（`fetchTodayMaterials` 内 isNew 标记逻辑）

### Gist B 历史素材缺 addedAt 修复
- **日期**：2026-07-30
- **问题**：管道每日 4 次运行后前端显示 0 条新增。Gist B 中 70 条素材有 35 条缺 `addedAt`（Google News 历史条目未打时间戳），前端 `addedAt > lastViewAt` 判新增短路 → 全部不标
- **修复**：`scrape-safety-news.js` 第 680 行 `dedupedB.push({ ...item, addedAt: item.addedAt || nowISO })`，历史素材补打当前 ISO 时间戳
- **Commit**: `714124a`
- **影响范围**：scrape-safety-news.js（管道）

### 全面代码审查 + 手机演示包同步
- **日期**：2026-07-30
- **操作人**：Marvis
- **修改内容**：
  - 前端 `isNew` / `lastViewAt` / `normalizeAndCapMaterials` 逻辑逐项审查，确认 `mat_last_view_at` 独立 key + `addedAt` ISO 比较正确
  - 手机演示包 14 文件 SHA256 全量对齐主目录
  - 检修日志、CHANGELOG 补记
  - 重打手机演示包.zip
- **Commit**: 本次收口

---

## 2026-07-29 — v5.0 入库日期驱动判新增（addedAt + lastViewAt）

### 管道写入 addedAt，前端改用日期比较判新增
- **日期**：2026-07-29
- **背景**：前端判「新增」一直靠比对 localStorage 缓存的标题。换浏览器/清缓存后缓存为空 → 全部标新增。需要不依赖缓存大小的方案。
- **方案**：利用 Gist A/B 双库结构，管道写入时给新素材打 `addedAt` 入库日期，前端单独存 `lastViewAt`，判新增改为 `addedAt > lastViewAt`。
- **修改内容**：
  - `scrape-safety-news.js`：写入 Gist B 时新素材带 `addedAt: nowISO`，老素材不动
  - `强安兴企安全园地生文助手.html`：
    - 透传 `addedAt` 字段
    - 判新增：`it.addedAt > lastViewAt`
    - `lastViewAt` 用独立 localStorage key，与素材缓存隔离
    - `survivedNew` 统计改为读 `isNew === true`，与标记口径一致
- **效果**：换浏览器/清缓存均正确标注，无缓存时不瞎标
- **Commit**: `b20d5ab`

### 新增标记条件修复
- **日期**：2026-07-29
- **问题**：`oldMats.length > 0` 导致首次/换浏览器时所有素材不标新增
- **修复**：改为 `freshItems.length > 0`
- **Commit**: `9cb4edd`

---

## 2026-07-28 — v4 架构重写：双 Gist 分离（GPT 方案）

### Gist A 改为最新快照（覆盖写入），Gist B 独立为长期展示库
- **日期**：2026-07-28
- **操作人**：Marvis（方案：GPT）
- **修改内容**：`scrape-safety-news.js` 完全重写架构：
  - **Gist A**（`safety_news_latest.json`）：每次抓取直接覆盖写入，最多 30 条，只保留最新一轮结果，不再做"仓库"累积
  - **Gist B**（`safety_news_display.json`）：长期展示库，每轮与前一轮合并去重，滚动累积上限 100 条
  - **旧文件迁移**：`safety_news.json`（30 条旧数据）仅在 B 为空时首次运行 initFromOldGist() 自动迁移到 B，之后不再读取
  - **前端对接**：前端只读 Gist B（GIST_RAW 已指向 `safety_news_display.json`），Gist A 仅供运维查看
- **核心改进**：解决 v3 中"A 也是仓库、B 也是仓库"的概念混乱。A 职责单一化为"最新采集快照"，B 是前端唯一数据源。采购素材不会永远丢失在旧 Gist A 的快照里
- **Commit**: `905b2cd`
- **影响范围**：采集脚本 `scrape-safety-news.js`、GitHub Actions workflow、前端 HTML（GIST_RAW URL 更新）

### v4.1：initFromOldGist 异常区分 + 写 B 双重保护
- **日期**：2026-07-28
- **操作人**：Marvis
- **修改内容**：
  - `initFromOldGist()` 区分错误类型：404 → `return []`（旧文件不存在是正常情况）；网络异常 / 429 / JSON 解析失败 → `throw`（不应静默丢失迁移机会）
  - 写 B 前双重保护：`existingB.length > 0 && finalB.length === 0` → 拒绝覆盖（防止已有数据被写成空库）；`topN.length === 0 && existingB.length === 0` → 拒绝初始化（防止建空库）
- **核心改进**：GPT 复查发现的边界风险——旧文件因网络抖动读取失败时，v4 原逻辑静默返回空数组，永久丢失 30 条历史数据；双重保护防止 Gist API 异常导致 B 被清空
- **Commit**: `d3f88e3`
- **影响范围**：采集脚本 `scrape-safety-news.js` — initFromOldGist() + writeDisplayFile()

### 综合评分替代简单阈值排序
- **日期**：2026-07-28
- **操作人**：Marvis
- **修改内容**：评分逻辑从"质量分 → ≥55 阈值 → 截断"改为"综合分 = 质量分 × 时间衰减（时间越近分数越高）"，GitHub Actions 海外环境抓 Google News 在时效性上有天然优势
- **影响范围**：采集脚本 `scrape-safety-news.js` — `compositeScore` / `timeDecay` 计算

### v4.2.1：scrape-test.js 对齐生产 + 文档同步 + 交付闭环
- **日期**：2026-07-28
- **操作人**：Marvis
- **修改内容**：
  - `scrape-test.js`：B 合并改为 `topA.filter`（对齐生产逻辑）；`fetchExistingGist` 仅 404 返回空、其余 `throw`
  - 主目录 `scrape-safety-news.js` 同步至 v4.2.1（此前 GitHub Actions 实际运行旧逻辑）
  - 文档全面同步：CHANGELOG / Codex检修日志 / KNOWLEDGE / README
  - 手机演示包重打 zip + 文档同步
  - 交付前清理：删除 `.bak` 备份文件、移除根目录旧版 `生文助手.html`
  - git push → GitHub Actions 手动触发验证通过（Run #30353331971，约 1700 条素材，16 分钟完成）
- **Commit**: `fa5c1ac` / `555817c`
- **影响范围**：脚本、文档、手机演示包、仓库清理

### v4.2.2：交付洁净度清理
- **日期**：2026-07-28
- **操作人**：Marvis
- **修改内容**：
  - 仓库残留 8 个 `.bak` 备份文件（7月20日 Codex 快照）全部移到回收站
  - Workflow 名称从 v2 改为 v4，失败通知标题同步修正
  - 手机演示包 `.zip` 剔除 .bak 后重新打包
- **Commit**: `99659f3`
- **影响范围**：主目录清理、workflow 命名、手机演示包

### v4.2.3：手机演示包全量同步 + 测试脚本离线 + workflow 通知修正
- **日期**：2026-07-28
- **操作人**：Marvis
- **修改内容**：
  - 手机演示包 4 文件（index.html / README / 强安视界 / 汇报页）与主目录对齐，汇报页「7大安全新闻源」修正为「10 个安全新闻源 + 3 个通用新闻源」
  - `scrape-test.js` 无 push 参数时不再调用 `fetchExistingGist()`（纯离线测试模式），避免缺少 token 时崩溃
  - Workflow 失败通知 v2 → v4
  - 手机演示包 zip 重建
- **Commit**: `256586c`
- **影响范围**：测试脚本、workflow、手机演示包

### v4.2.4：调试条 UI 重设计
- **日期**：2026-07-28
- **操作人**：Marvis
- **修改内容**：
  - 黑底绿字 monospace 终端风调试条改为浅色琥珀底加载提示，带旋转图标 + 中文状态（加载中 → 准备就绪 → 淡出消失）
  - 配色与页面品牌色统一
  - 主 HTML 与手机演示包 HTML 同步修改
- **Commit**: `c7d62e2`
- **影响范围**：强安兴企安全园地生文助手.html、手机演示包

---

## 2026-07-26 — v5.6 抓取频率翻倍

### GitHub Actions 抓取频率从每天 2 次升级为 4 次
- **日期**：2026-07-26
- **操作人**：Marvis
- **修改内容**：`.github/workflows/update-safety-news.yml` 调度从每天 2 次（07:30 + 15:30 北京时间）改为每天 4 次（07:00 / 13:00 / 19:00 / 01:00 北京时间），间隔 6 小时
- **核心改进**：抓取频率翻倍，素材每 6 小时更新一次，提高素材新鲜度和覆盖完整度
- **影响范围**：安全园地素材库 — 云端抓取管道

---

## 2026-07-26 — v5.7 关键词扩展 + 排序优化

### Google News 搜索关键词从 10 个扩展到 20 个
- **日期**：2026-07-26
- **操作人**：Marvis
- **修改内容**：Google News RSS 搜索关键词从 10 个扩展到 20 个，新增职工健康、心血管防治、高血压健康、职业卫生、应急救援、安全文化建设、安全生产标准化、安全培训教育、粉尘防爆、职业中毒防护等
- **核心改进**：扩大搜索覆盖面，覆盖更多安全细分领域，提高素材多样性和数量
- **影响范围**：采集脚本 `scrape-safety-news.js` — Google News 关键词池

### 白名单从 63 词扩展到 75 词
- **日期**：2026-07-26
- **操作人**：Marvis
- **修改内容**：`SAFETY_WHITELIST` 从 63 词扩展到 75 词，新增健康/文化/科普类 12 词
- **核心改进**：配合关键词扩展，白名单同步更新，确保新增领域的素材能通过白名单过滤
- **影响范围**：采集脚本 `scrape-safety-news.js` — `isSafetyRelated()` 白名单匹配

### 前端排序恢复质量分降序
- **日期**：2026-07-26
- **操作人**：Marvis
- **修改内容**：`normalizeAndCapMaterials` 排序从「新增置顶 → 日期降序」改为「新增置顶 → score 降序 → 同分按日期降序」
- **核心改进**：恢复质量偏好，确保高质量素材优先展示，避免低质量素材挤占前列（v5.5 改为纯日期降序后，低质量老素材可能排在高质量新素材前面）
- **影响范围**：三个 HTML 的 `normalizeAndCapMaterials` 排序逻辑

### 白名单匹配阈值保持不变
- 白名单匹配阈值保持 ≥2 不变，不因关键词扩展而降低过滤门槛

---

## 2026-07-26 — v5.8 评分门槛下调 + 新数据优先机制

### 评分最低阈值从 65 分下调至 55 分
- **日期**：2026-07-26
- **操作人**：Marvis
- **修改内容**：采集脚本打分过滤阈值从 ≥65 下调至 ≥55，新增 `MIN_SCORE` 常量（55）
- **核心改进**：v5.7 测试表明健康类等内容质量分普遍偏低，≥65 门槛将其过滤在外；下调至 55 让其有机会进入候选池
- **影响范围**：采集脚本 `scrape-safety-news.js` — `enrichItem` 过滤阶段

### 累积模式：新数据优先 + 旧数据补满 30 条
- **日期**：2026-07-26
- **操作人**：Marvis
- **修改内容**：合并逻辑从「新旧混排 → 按分数截断 30」改为「本轮新增全部排前面 + 旧数据补满剩余空位至 30」
- **核心改进**：Gist 作为前端数据源需保持累积，旧版纯增量在无抓取轮次会退化为 0 条；累积模式下始终满 30 条，新数据优先展示
- **日志输出**：「本轮新增 X 条 + 旧数据 Y 条 = Z 条」，可追踪新旧比例
- **影响范围**：采集脚本 `scrape-safety-news.js` — 合并截断阶段

### test 分支白名单阈值 ≥1 测试结论
- 白名单阈值 ≥2 → ≥1 无明显效果，瓶颈不在白名单而在打分排序阶段
- 降阈后健康类内容仍未进入 top 30，需从搜索词召回和打分偏好入手

---

## 2026-07-25 — v5.5 排序修正 + 缓存刷新 + HTML 同步

### 素材排序规则修正
- **问题**：v5.2 引入"新增优先 + 质量分降序"滚动淘汰，但非新增素材也按质量分降序排列，导致低质量老素材排在高质量新素材前面
- **修复**：排序逻辑改为「新增置顶 → 日期降序」，非新增素材严格按发布日期从新到旧排列，不再受质量分影响
- **影响范围**：三个 HTML 的 sortMaterials / renderMaterials 排序逻辑

### localStorage 缓存强制刷新
- **问题**：DS_VERSION 停留在 gist-v4，部分用户浏览器中仍保留旧版素材缓存，看到的是过期数据
- **修复**：DS_VERSION 从 gist-v4 升级到 gist-v5，检测到版本不一致时强制清除旧缓存并重新拉取
- **影响范围**：三个 HTML 的 fetchTodayMaterials() 数据源版本检测块

### 生文助手.html 版本同步
- **问题**：生文助手.html 仍使用旧版 v1 缓存逻辑，与强安兴企安全园地生文助手.html 不同步
- **修复**：生文助手.html 覆盖为与强安兴企安全园地生文助手.html 一致的版本
- **影响范围**：生文助手.html

### 手机演示包同步
- 手机演示包内四份文档同步至最新版

---

## 2026-07-25 — v5.5.1 「新增」badge 误标修复

### 缓存清空后全部素材误标「新增」badge
- **问题**：DS_VERSION 升级到 gist-v5 后缓存清空，全部 30 条素材在素材面板被标绿色「新增」badge，造成"全部都是新素材"的假象
- **根因**：isNew 标记逻辑未区分场景——oldMats.length === 0 时（缓存清空/首次加载），freshItems 中的当天入库素材全被误判为 isNew=true
- **修复**：isNew 标记仅在增量获取时生效（`oldMats.length > 0`），首次加载或缓存重建时一律不标「新增」badge
- **影响范围**：三个 HTML 的 mergeLocalMaterials / normalizeAndCapMaterials 中 isNew 标记逻辑

---

## 2026-07-25 — v5.4 性能+无障碍优化（defer + ARIA + JS 压缩）

### 渲染阻塞请求修复
- **问题**：PageSpeed Insights 检测外部脚本 `hooks.js` 和 `config.js` 同步加载，阻塞首屏渲染约 560ms
- **修复**：两个脚本标签添加 `defer` 属性，改为 HTML 解析完成后执行（保持执行顺序不变）；html2canvas CDN 已有 `async`，无需改动
- **影响范围**：三个 HTML（主文件 + 完整版 + 手机演示包）

### ARIA 无障碍修复
- **问题**：无障碍审计报告 `tablist` 容器缺少标签、tab 按钮缺少 `role="tab"` 和 `aria-selected` 属性
- **修复**：`tablist` 容器添加 `aria-label="素材分类"`；`renderTabs()` 中每个 `<button>` 动态添加 `role="tab"` + `aria-selected="true|false"`，与 CSS `.active` 类保持同步
- **影响范围**：三个 HTML 的素材面板 tab 切换组件

### 内联 JS 空白压缩
- **问题**：内联 `<script>` 代码块含大量连续空行和行尾空格，增加约 5 KiB 体积
- **修复**：连续 3 个及以上空行合并为最多 2 行，清除所有行尾多余空格；函数逻辑和注释完整保留
- **影响范围**：三个 HTML 的 body 内 `<script>` 段

### 备注
- "减少未使用的 JavaScript"一项无需改动：三个文件均使用内联 CSS + JS，未加载大型第三方库，外部依赖仅有 html2canvas（已 async + 错误回退）和两个小型扩展脚本

---

## 2026-07-25 — v5.3 SEO 元数据优化（meta description + JSON-LD + 缓存策略）

### 三项 SEO 元数据注入
- **meta description**：在 `<meta name="viewport">` 后添加 135 字中文描述元标签，用于搜索引擎摘要展示
- **JSON-LD 结构化数据**：在 `</head>` 前插入 `WebApplication` 类型结构化数据（含名称、描述、免费声明），用于 Google 富结果展示
- **GitHub Pages 缓存策略注释**：在 `<!doctype html>` 前添加缓存策略说明注释块（10 分钟 max-age + CDN 建议）
- **影响范围**：强安兴企安全园地生文助手.html（主文件 + 手机演示包）

---

## 2026-07-25 — 30条上限 + 绿色「新增」标记 + normalizeAndCapMaterials 封死漏网口

### 本地素材库保持 30 条上限
- **问题**：30 条上限一刀切，Google News 每天增量小但长期积累下来老素材会陆续被砍，本地库始终偏浅
- **修复**：`MAX_LOCAL_STORED` 保持 30；`normalizeAndCapMaterials` 改为"新增优先 + 质量分降序"滚动淘汰
- **影响范围**：三个 HTML 的 `normalizeAndCapMaterials` / `mergeLocalMaterials`

### 绿色「新增」badge 标记
- **问题**：无法区分当天新入库素材和历史素材
- **修复**：渲染时给当天日期入库的素材加绿色「新增」badge 并强制置顶，隔天自动消失
- **影响范围**：安全园地素材面板 UI

### normalizeAndCapMaterials 统一入口封死漏网口
- **问题**：Codex 审查发现两处路径绕过了 `normalizeAndCapMaterials` — 页面加载读缓存、导入素材合并
- **修复**：全部路径改用 `normalizeAndCapMaterials` 统一入口
- **影响范围**：三个 HTML 的所有素材入库路径

---

## 2026-07-23 — 排序修正 + 30条上限补全 + 手动输入去污染

### 排序从日期改为质量分降序
- **问题**：素材合并排序按发布日期降序，当天新闻日期相同 → 排序≈随机，无质量偏好
- **修复**：`scrape-safety-news.js` + 三个 HTML 的合并排序全改为质量分降序，同分按日期降序
- **影响范围**：采集管线 + 前端素材面板

### 30 条上限补全（修正 7/22 虚假修复）
- **问题**：7/22 仅在采集脚本设了 `MAX_TOTAL_STORED=30`，前端 HTML "获取安全素材" 的 `oldMats.concat(freshItems)` 无任何截断 → 点一次按钮就永久累积
- **修复**：三个 HTML 均新增 `MAX_LOCAL_STORED = 30` + `materials.slice(0, 30)`
- **影响范围**：强安兴企安全园地生文助手.html、手机演示包、生文助手.html

### 手动输入标题不再注入当月安全关键词
- **问题**：`searchBocha` 调用时强制注入当月安全选题关键词（如 7 月强注"防汛"），手动输入的自定义标题也被污染
- **修复**：`searchBocha(topic, injectCalendar)` 新增参数，手动输入传 `false`，素材生成保留 `true`
- **影响范围**：生成文章搜索链路

### 附带清理
- 确认「安全园地_云端方案」仓库已删，旧 Python 每日 4 次 Gist 覆写隐患消除
- 缓存版本：线上 `MATERIALS_CACHE_VERSION` 1→2，本地 `DS_VERSION` gist-v3→gist-v4

---

## 2026-07-22 — 采集与前端修复摘要

- **采集脚本**：新增 `SAFETY_WHITELIST` 64 词安全白名单 + `isSafetyRelated()` 前置过滤；`MAX_TOTAL_STORED` 100 → 30；评分阈值 40 → 65；惩罚词 17 → 31
- **前端 HTML**：缓存版本 v1 → v2，数据源版本 v2 → v3；`buildAISystemPrompt()` 去掉来源标注指令，消除正文"来源一""来源二"；修复中文引号导致的 JavaScript 语法错误

---

## 2026-07-22 — Marvis 检修（采集管道 v2.3 质量强化 & 前端修复）

### 采集脚本 scrape-safety-news.js：安全白名单 + 双阈值 + 总量控制
- **日期**：2026-07-22
- **操作人**：Marvis
- **修改内容**：
  - 新增 `SAFETY_WHITELIST` 64 词（事故类/管理类/行业类/消防救援政策类四组），新增 `isSafetyRelated()` 函数：标题+摘要须命中 ≥2 个安全关键词才进入评分，不满足直接 return -1
  - `MAX_TOTAL_STORED` 100 → 30：Gist 仅保留最近 30 条高质量素材
  - `MIN_DAILY_TARGET` 10 → 5：减少无效 fallback 补充
  - 评分阈值 `score >= 40` → `score >= 65`：配合白名单双重过滤
  - 惩罚词从 17 个扩充到 31 个（新增股市/A股/GDP/钢琴/楼市/相亲/恋爱/夏令营/养老/医保/社保/个税/教育培训）
- **核心改进**：四层过滤链（白名单 → 惩罚词 → 五因子打分 → ≥65 分阈值），从源头拦截非安全领域噪音（Bing 抓回的百度百科词条、安全管理网导航页等）
- **影响范围**：安全园地生文助手 — 素材库全链路
- **对应坑号**：坑37（素材不相关）

### 前端 HTML 修复：缓存版本升级 & prompt 去来源标注 & 中文引号语法修复
- **日期**：2026-07-22
- **操作人**：Marvis
- **修改内容**：
  - `强安兴企安全园地生文助手.html`：`DS_VERSION` 从 `"gist-v2"` 升级到 `"gist-v3"`，强制清空旧缓存；`buildAISystemPrompt()` 中第 0 条规则改为"不要在 content 正文中插入来源标注"，第 8 条 references 补充"仅用于侧栏展示"，消除 AI 在正文中写入"来源一""来源二"的问题
  - 修复中文引号（"引号"）导致的 JavaScript 语法错误（含中文引号的字符串提前截断）
- **核心改进**：生文正文干净可复制外发，不再夹带无意义的来源标注
- **影响范围**：安全园地生文助手 — 文章生成 & 缓存管理

### 修复脚本截断逻辑显式调用、页面 loading 卡死
- **日期**：2026-07-22
- **操作人**：Marvis
- **修改内容**：
  - `scrape-safety-news.js`：截断逻辑从隐式依赖改为显式调用 `truncateToMax()`
  - `强安兴企安全园地生文助手.html`：修复 Gist 请求超时后 loading spinner 永久旋转不消失的问题
- **影响范围**：采集管道 & 前端 UI

---

## 2026-07-21 — Marvis 检修（Codex 方案落地）

### 安全园地采集管道 v2：Google News RSS + 打分制 + fallback 三层架构
- **日期**：2026-07-21
- **操作人**：Marvis（方案：Codex，落地：Marvis）
- **修改内容**：
  - `scripts/scrape-safety-news.js` 完全重写（141→461行）：Bing site: 搜索7站 → Google News RSS（10关键词）+ 官方源 Bing 搜索（4站）+ fallback 精选库三层
  - `scripts/package.json` v1.0→v2.0，新增 fast-xml-parser 依赖
  - `.github/workflows/update-safety-news.yml` 调度从每天1次→每天2次（07:30+15:30）
  - `data/fallback_materials.json` 新增10条精选兜底素材
- **核心改进**：
  - 五因子打分制替代简单 classifyText（来源/标题/摘要/地域/时效）
  - 惩罚词剔除（国际安全/网络安全/金融安全/铁路投资/军事冲突等）
  - 分数阈值：80+优先 / 60-79正常 / 40-59备用 / <40剔除
  - 当日新增不足10条自动从 fallback 补位
- **影响范围**：安全园地生文助手 — 素材库全链路
- **对应坑号**：坑37（Bing site: 搜索误报率高，RSS源不匹配安全行业需求）
- **Commit**: `b9f1fa6`

---

## 2026-07-21 — Marvis 检修（素材源切换 & 缓存修复）

### 生文助手素材源从 RSS 切换到 Gist 管线
- **日期**：2026-07-21
- **操作人**：Marvis
- **修改内容**：`强安兴企安全园地生文助手.html` 中 `fetchTodayMaterials()` 从 7 个通用 RSS 源（rss2json.com 代理人民日报/人民网/中新网/少数派）切换为直接 fetch Gist 管线 JSON（safety_news.json）。删除约 115 行 RSS 抓取代码，复用累积合并、分类、排序逻辑，新增 score 字段排序
- **核心改进**：从 "通用源 + 关键词后过滤"（垃圾率 91.8%）切换为 "Gist 管线专业采集"（垃圾率 0%），素材质量从 7/85 条可用提升到 100 条全部对口
- **影响范围**：安全园地生文助手 — 素材库数据源全链路
- **Commit**: `153bbe0`

### localStorage 缓存清空 bug 修复
- **日期**：2026-07-21
- **操作人**：Marvis
- **修改内容**：数据源版本检测块中 `localStorage.removeItem("materials_cache")` 改为 `localStorage.removeItem(MATERIALS_LS_KEY)`，DS_VERSION 从 "gist-v1" 升级到 "gist-v2"
- **根因**：实际的缓存 key 是 `huanxing_materials_cache_v1`，删错 key 导致旧 RSS 数据永远清不掉
- **影响范围**：安全园地生文助手 — 素材缓存清理逻辑
- **Commit**: `989ad9a`

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

### 强安视界 callDeepSeekDraft 缺少 fetch 超时 → UI 永久卡死
- **日期**：2026-07-20
- **操作人**：Marvis（用户测试反馈）
- **修改内容**：`强安视界_UI改版.html` 的 `callDeepSeekDraft()` 中 `fetch()` 没有超时机制。当 DeepSeek 服务端不响应时 Promise 永久 pending，UI 永远卡在"AI 正在写文章"。安全园地生文助手早已加了 `AbortController`，强安视界是从旧版拷贝漏掉的。修复：加入 `AbortController` + 120 秒超时，超时抛明确提示；`.then()` 和 `.catch()` 均调用 `clearTimeout` 防内存泄漏
- **影响范围**：强安视界 — AI 写稿功能
- **对应坑号**：坑36


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

### v5.0.3 (2026-08-01) — 手机端「新增」标签溢出修复

- **问题**：手机竖屏素材卡片 meta 行 badge（分类 + 新增 + 待审 + 日期）用 `justify-content: space-between` 挤在一行，窄屏时「新增」被挤出屏幕，需左滑才能看到
- **修复**：CSS `.material-meta` 改为 `flex-wrap: wrap` + `justify-content: flex-start`，日期用 `margin-left: auto` 保持右对齐。badge 从左排列，溢出自动换行
- **影响**：手机端新增标签始终可见，无需横向滚动

### v5.0.2 (2026-07-31) — 首次访问 24h 兜底判新增

- **问题**：手机首次打开时 `lastViewAt` 为空，`addedAt > lastViewAt` 判新增不触发，当天新货全部不标；页面同时顺手把 `lastViewAt` 记成当天日期，导致当天再无标记机会
- **修复**：`fetchTodayMaterials` 中 `lastViewAt` 为空时走 else 分支——最近 24h 内入库素材（`addedAt > cutoff24h`）标 `isNew`。不影响已有 `lastViewAt` 的正常判定逻辑
- **注**：同时部署了手机诊断页（`test_phone_diag.html`）用于排查 localStorage 状态

> 最后更新：2026-08-01
*（内容由AI生成，仅供参考）*
*（内容由AI生成，仅供参考）*
*（内容由AI生成，仅供参考）*
