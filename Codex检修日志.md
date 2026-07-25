
## 2026/7/25 检修

- **30→150 上限 + 滚动淘汰**：本地素材库从 30 条硬砍改为 150 条滚动积累，超上限按"新增优先 + 质量分降序"挤掉末尾
- **「新增」标记**：每天新入库素材绿色 badge 置顶，隔天自动摘牌
- **Toast 真话**：新增数从"比旧库多几个标题"改为归一化后实际入库数
- Codex 找出的两个漏网口封死：页面加载读缓存、导入素材，全部走 `normalizeAndCapMaterials` 统一入口
- **新增量偏少分析**：Google News 矿山安全领域日更新量有限，7 月淡季，关键词池偏小是主因
- **SEO 元数据优化**：主 HTML + 手机演示包同步添加 meta description（135 字）、JSON-LD 结构化数据（WebApplication 类型）、GitHub Pages 缓存策略注释（10 分钟 max-age + CDN 建议）

---

## 2026/7/23 检修

- 手动输入标题被注入当月安全关键词 → `searchBocha` 新增 `injectCalendar` 参数，手动输入传 `false`
- 素材排序按日期无质量偏好 → 采集脚本 + 三个 HTML 的合并排序全改为质量分降序（同分按日期）
- **30 条上限虚假修复**：7/22 仅在采集脚本中设了上限，HTML 前端合并逻辑无上限 → 补全 `MAX_LOCAL_STORED = 30`
- **统一裁剪函数** `normalizeAndCapMaterials`：去重 + 质量分降序 + 截断 30 条，覆盖全部入口（页面加载缓存 / 获取素材 / 导入素材合并 / 导入素材替换）
- 旧流水线排雷：确认「安全园地_云端方案」仓库已删
- 缓存版本升级：线上 `MATERIALS_CACHE_VERSION` 1→2，本地 `DS_VERSION` gist-v3→gist-v4
- 手机演示包同步至最新版

---

## 2026/7/22 检修

- Gist 被新闻污染 → 白名单过滤解决
- 前端缓存堆积 → 版本升级解决
- 生文含来源标注 → prompt 修正
- loading 卡死 → 引号语法修复

---

## 2026/7/22 Marvis 检修记录

### 采集脚本 v2.3：白名单过滤 + 双阈值 + 总量控制

- **问题**：Bing 官方源抓回大量非安全领域噪音（百度百科词条、安全管理网导航页等），前端缓存堆积旧 RSS 垃圾数据，生文正文含"来源一""来源二"标注
- **处理**：
  - `scrape-safety-news.js`：新增 `SAFETY_WHITELIST` 64 词安全白名单，标题+摘要须命中 ≥2 个安全关键词才进入评分；`MAX_TOTAL_STORED` 100→30；评分阈值 40→65；惩罚词 17→31 个；`MIN_DAILY_TARGET` 10→5
  - `强安兴企安全园地生文助手.html`：`DS_VERSION` gist-v2→gist-v3 强制清空缓存；`buildAISystemPrompt()` 去掉"标注来源"指令，references 仅用于侧栏展示；修复中文引号语法错误
  - `scrape-safety-news.js`：截断逻辑改为显式调用 `truncateToMax()`；修复 Gist 请求超时后 loading spinner 永久旋转
- **遗留**：本地网络不通 Google News（GitHub Actions 不受影响），fallback 仍为主要数据补充通道

---

## 2026/7/20 19:45:32 Codex 检修记录

### 本次修复范围

- 安全园地 fetchArticleContent 返回 item: 已修改，并生成备份 强安兴企安全园地生文助手.html.bak_Codex_202607201145
- 强安视界多模型接口适配 + 写稿前 Key 检查 + 标题优化 JSON 兼容: 已修改，并生成备份 强安视界_UI改版.html.bak_Codex_202607201145
- 语法检查: 强安兴企安全园地生文助手.html script 1 通过。
- 语法检查: 强安视界_UI改版.html script 1 通过。
- 手机演示包同步: 已用根目录最新版覆盖 强安兴企安全园地生文助手.html
- 手机演示包同步: 已用根目录最新版覆盖 强安视界_UI改版.html
- 手机演示包.zip: 自动打包失败，请手动重新压缩手机演示包目录。原因：Command failed: powershell.exe -NoProfile -Command Compress-Archive -Path (Join-Path $args[0] '*') -DestinationPath $args[1] -Force F:\huituzhuansheng\Marvis\User\oAN1i2Y8h55CjXFkJ197dJH-Lx2w\workspace\conv_19f4b20bed5_4ec592be98f7\output\强安系列_手机展示\手机演示包 F:\huituzhuansheng\Marvis\User\oAN1i2Y8h55CjXFkJ197dJH-Lx2w\workspace\conv_19f4b20bed5_4ec592be98f7\output\强安系列_手机展示\手机演示包.zip

### 说明

- 安全园地这次修的是隐藏链路：选中素材后直抓原文时，抓取函数必须把处理后的素材对象返回，否则调用方拿不到 result.content，只能误入搜索回退。
- 强安视界这次修的是模型适配层：DeepSeek 直连原本能跑，但 GLM / OpenRouter 等模型需要独立 chatEndpoint 或 apiModel，不能只拼 baseUrl + /v1/chat/completions。
- 标题优化函数要求 JSON 数组，因此关闭 response_format=json_object，避免模型或接口把数组输出限制坏。
- Bocha Key 是否继续内置，本次未强制处理。个人演示可暂时保留，公开发布或给多人长期使用前建议改成设置项或后端转发。
- README / KNOWLEDGE 里“全文直接 fetch、getProxy 完全废弃”等表述，需要后续按真实代码再校准。


## 2026/7/20 19:54:50 Codex 二次检修记录

- 强安视界: 补入 DS_CHAT_ENDPOINT / DS_API_MODEL 初始化与 refreshModelRuntime()。
- 强安视界: 在 callDeepSeekDraft() 内补入 chatUrl 定义，修复 fetch(chatUrl) 运行时报错。
- 强安视界: 保存模型设置时同步刷新运行时模型映射。
- 语法检查: 强安视界_UI改版.html script 1 通过。
- 手机演示包: 已同步强安视界_UI改版.html。
- 手机演示包.zip: 已重新打包。

### 说明

本次专门修复强安视界中 `fetch(chatUrl)` 但 `chatUrl` 未定义的问题。该问题不会被普通语法检查发现，但点击 AI 写稿时会触发运行时报错。


## 2026/7/21 18:15 Codex + Marvis 联合改造记录

### 安全园地采集管道 v2 升级

Codex 提供方案文档 `安全园地数据源自动采集方案_给Marvis.md`，Marvis 落地实施。

**改造文件**：
- `scripts/scrape-safety-news.js`：重写采集脚本，从 Bing site: 搜索 7 站 → Google News RSS（10 关键词）+ 官方源（4 站）+ fallback 精选库三层架构
- `scripts/package.json`：v1.0 → v2.0，新增 fast-xml-parser 依赖（解析 Google News RSS XML）
- `.github/workflows/update-safety-news.yml`：调度从每天 1 次（08:00）→ 每天 2 次（07:30 + 15:30）
- `data/fallback_materials.json`：新增 10 条精选兜底素材

**核心变更**：
- 数据源：Google News RSS 为主力发现层（GitHub Actions 海外环境可直连），官方站 Bing site: 搜索为权威兜底层，fallback 为人补位层
- 质量判断：从简单 classifyText 正则 → 五因子打分制（来源 +30 / 标题关键词 +25 / 摘要内容 +20 / 地域匹配 +20 / 7 天内时效 +10），惩罚词剔除（国际安全/网络安全/金融安全/铁路投资/军事冲突 等）
- 分数阈值：80+ 优先展示 / 60-79 正常 / 40-59 备用 / <40 剔除
- 兜底机制：当日新增不足 10 条时自动从 fallback 补充
- Gist 输出格式兼容，新增 score / origin 字段

**Commit**: `b9f1fa6` feat(采集): 升级为Google News RSS+打分制+fallback三层采集v2
**语法检查**: 通过（node --check）
**对应坑号**: 坑37（Bing site: 搜索误报率高，RSS 源不匹配安全行业需求）

### 说明

本次改造直接解决用户之前反复指出的"素材不相关"问题——通用 RSS + classifyText 会把"伊朗打美军""铁路投资"等归为"综合安全"混入素材库。新方案从源头（Google News RSS 关键词精准匹配）+ 打分过滤（惩罚词剔除）+ fallback 精选三管齐下，从根本上提升素材质量。


## 2026/7/21 20:29 Marvis 检修记录

### 素材源从 RSS 切换到 Gist 管线（解决 91.8% 垃圾率）

- **根因**：生文助手 `fetchTodayMaterials()` 通过 rss2json.com 从 7 个通用 RSS 源抓取（人民日报、人民网、中新网、少数派），然后用安全关键词做后过滤。源不对口 → 垃圾率 91.8%
- **修复**：删除 RSS 抓取逻辑，改为直接 fetch Gist 管线 JSON（safety_news.json），复用原有累积合并、分类、排序逻辑，新增 score 字段排序
- **影响范围**：强安兴企安全园地生文助手.html — fetchTodayMaterials() 函数，约 115 行替换
- **Commit**: `153bbe0`

### 缓存清空逻辑 bug 修复（旧 RSS 垃圾无法清除）

- **根因**：数据源版本检测（DS_VERSION = "gist-v1"）中清除缓存写的 `localStorage.removeItem("materials_cache")`，但实际缓存 key 是 `MATERIALS_LS_KEY = "huanxing_materials_cache_v1"`
- **现象**：页面刷新后点「获取安全素材」，旧 RSS 的 112 条垃圾 + 新 Gist 的 100 条 = 212 条，垃圾数据阴魂不散
- **修复**：`localStorage.removeItem("materials_cache")` → `localStorage.removeItem(MATERIALS_LS_KEY)`；DS_VERSION 从 `"gist-v1"` 升级到 `"gist-v2"` 强制重新触发清空
- **影响范围**：强安兴企安全园地生文助手.html — fetchTodayMaterials() 数据源版本检测块
- **Commit**: `989ad9a`
