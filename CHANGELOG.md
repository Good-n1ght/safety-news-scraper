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

## 2026-07-27 — v6.0 双 Gist 架构 + 综合评分（质量分×时间衰减）

### 双 Gist 架构
- **背景**：管道脚本与前端共享同一个 Gist，管道 `MAX_TOTAL_STORED=30` 硬截断，前端设 100 条上限形同虚设
- **方案**：采集池（Gist A）+ 展示库（Gist B）分离
  - Gist A（`360b3e9ec81bfee6765883cbb0da7aec`）：保留用于去重和调试，上限 60 条
  - Gist B（`156bb6326a83056a148b8cbd175ff463`）：展示库，前端读取，上限 100 条
- **影响范围**：管道脚本、三份 HTML 前端

### 综合评分系统
- **公式**：finalScore = 质量分 × 时间衰减系数
  - ≤3 天：×1.0 / 3~7 天：×0.8 / 7~14 天：×0.6 / 14~30 天：×0.4 / >30 天：丢弃
- **效果**：时效与质量并重，不再出现半年前的老新闻靠高分赖着不走
- **流水线**：精选 Top-30（按 finalScore 排序）→ 合并到展示库 Gist B → 上限 100

### 前端切换
- Gist URL 从 A 切到 B，DS_VERSION 升至 gist-v6，强制清空旧缓存
- 三份入口 HTML 全部同步更新

### Commit
- 待 push

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

> 最后更新：2026-07-27
*（内容由AI生成，仅供参考）*
*（内容由AI生成，仅供参考）*
*（内容由AI生成，仅供参考）*
