---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 1d901ace6510f3f7162dab4a93f6993e_3172552e88b311f1b66e525400e6dd8f
    ReservedCode1: sqR3Tvq+PqJDzxqb98dNT88ZdfvKBrqB5MiJMKj2ZmlCA/y4ufMyutuAJVp2VpkhahPlHUWnkPo0xEhTscDowHUOpLuWhIKNKf6PuvgmS46QJKRhR7o72J7cKLEGWL2uboUZgI+jaZT+K5Wzwh8H/U7TNnhvidTGcUZBH+M4uvP9lKMaD8IBJxZ23zc=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 1d901ace6510f3f7162dab4a93f6993e_3172552e88b311f1b66e525400e6dd8f
    ReservedCode2: sqR3Tvq+PqJDzxqb98dNT88ZdfvKBrqB5MiJMKj2ZmlCA/y4ufMyutuAJVp2VpkhahPlHUWnkPo0xEhTscDowHUOpLuWhIKNKf6PuvgmS46QJKRhR7o72J7cKLEGWL2uboUZgI+jaZT+K5Wzwh8H/U7TNnhvidTGcUZBH+M4uvP9lKMaD8IBJxZ23zc=
---

# CODE AUDIT REPORT

> 审计日期：2026-07-28
> 审计范围：safety-news-scraper-online 仓库全部代码文件
> 审计操作：逐文件注释标注 + 跨文件/同文件内去重清理
> 增量审计（7/27-7/28）：v4 双Gist 架构 + .bak 残留清理 + workflow 改名 + 调试条 UI 重设计 + v5.8~5.10 配套更新
> 增量审计（7/30）：v5.0.1 — Gist B 历史素材缺 addedAt 补打修复 + 全面代码审查 + 手机演示包 14 文件 SHA256 对齐主目录

---

## 一、文件清单与功能说明

### 1. `.github/workflows/update-safety-news.yml`
- **功能**：GitHub Actions 定时流水线，每天 4 次（北京时间 07:00 / 13:00 / 19:00 / 01:00）自动执行新闻采集脚本
- **流程**：检出代码 → 安装 Node.js 22 → npm install → 执行 `scrape-safety-news.js` → 失败时自动创建 Issue 告警
- **标注**：已添加 Job 说明注释

### 2. `extensions/config.js`
- **功能**：外部化配置文件，集中管理所有可配置项。已包含完整的 JS Doc 头部注释
- **内容**：
  - CORS 代理列表（主/备用）
  - 7 个搜索源配置（站点域名 + 关键词 + 启用开关）
  - AI 生成参数默认值（温度、token 上限、超时、截断长度）
  - Gist 素材库 URL + 缓存策略
  - 80+ 模型配置（DeepSeek 直连 + OpenRouter 中转 + 智谱 GLM）
  - 16 个品牌分组
- **标注**：已有完善注释，无需补充

### 3. `extensions/hooks.js`
- **功能**：扩展钩子系统，10 个钩子点覆盖搜索/抓取/生成/渲染/API/素材全链路
- **API**：`Hooks.on(name, fn, priority)` / `Hooks.off()` / `Hooks.trigger()` / `Hooks.triggerAsync()`
- **标注**：已有完善注释，无需补充

### 4. `extensions/_template.js`
- **功能**：扩展开发模板，包含 5 个注释掉的示例钩子用法
- **标注**：已有完善注释，无需补充

### 5. `proxy/index.js`（完整版 CORS 代理）
- **功能**：Node.js Express CORS 代理服务器
  - 全局 CORS 头 + JSON body 解析（2MB 限制）
  - GET `/` 路由：`?url=` 参数转发，模拟 Chrome UA，透传 Content-Type
- **标注**：已添加路由功能说明 + 启动端口注释

### 6. `scripts/scrape-safety-news.js`
- **功能**：安全新闻自动采集管道 v2，三层数据源架构
  - **第一层**：20 个 Google News RSS 关键词并行搜索
  - **第二层**：4 个官方站点 Bing site: 搜索（cheerio 解析 HTML）
  - **第三层**：本地 `fallback_materials.json` 精选素材兜底
- **核心逻辑**：
  - 76 词安全白名单过滤 + 惩罚关键词黑名单
  - 五因子质量评分（来源 30 + 标题 25 + 摘要 20 + 时效 10 + 基础 35）
  - 11 个分类自动归类 + 3 标签提取
  - 正文抓取（去标签、截断 6000 字）
  - Gist 云端存储读写（增量累积，上限 30 条）
  - 当日不足 5 条自动从 fallback 补充
- **标注**：已添加安全白名单说明、isSafetyRelated 阈值说明、评分公式注释

### 7. `index.html`
- **功能**：强安兴企系列导航页，CSS 设计系统 + 两张功能卡片（生文助手 / 强安视界）
- **标注**：已添加 CSS 设计系统注释、Header/卡片区/Footer 区块标注

### 8. `强安兴企安全园地生文助手.html`
- **功能**：安全园地 AI 生文助手主应用（~3100 行单文件 SPA）
  - 博查 API 搜索 7 个安全站点
  - AI 文章生成（DeepSeek/OpenRouter/智谱 三通道）
  - 素材管理（Gist 云端 + localStorage 30 天缓存）
  - 导出（PNG 卡片 + JSON 素材）
  - 历史记录管理
- **标注**：已为 65 个关键函数块添加分类注释（API 配置 / 设置面板 / 素材管理 / 搜索模块 / 导出导入 / 界面渲染 / 事件绑定 / AI 生成 / 结果解析 / 草稿渲染 / 历史记录 / 诊断）

### 9. `强安视界_UI改版.html`
- **功能**：强安视界新闻聚合 + AI 批量写稿应用（~9000+ 行单文件 SPA）
  - 多源新闻抓取（今日头条 / 百度热搜四榜 / 人民网 RSS / 中新网 RSS）
  - 安全内容过滤 + 5 大分类 + 热度排序
  - AI 标题通俗化改写 + 批量写稿（500-800 字）
  - Pexels 配图搜索
  - 全部稿件一键复制
- **标注**：已为 48 个关键函数块添加分类注释（工具函数 / 设置面板 / AI 调用 / 配图搜索 / 安全过滤 / 缓存 / RSS 解析 / 新闻抓取 / 百度热搜 / 渲染 / 标题优化 / 批量写稿 / 选择交互 / 事件绑定）

### 10. `强安系列产品介绍_汇报页.html`
- **功能**：强安系列智能工具产品介绍页（汇报用）
  - 生文助手 + 强安视界两款产品的功能特性列表
  - 当前局限说明
  - 技术架构一览
- **标注**：已添加 Hero 头部区块标注

### 11-16. `手机演示包/` 目录
- **性质**：独立演示部署包，包含自引用的 index.html 和完整副本
- **文件**：
  - `手机演示包/index.html` — 导航页（与根 index.html 略有差异）
  - `手机演示包/强安兴企安全园地生文助手.html` — 与根目录完全相同的副本
  - `手机演示包/强安视界_UI改版.html` — 与根目录完全相同的副本
  - `手机演示包/强安系列产品介绍_汇报页.html` — 较旧版本（footer 日期 2026.07.20 vs 根目录 2026.07.26，缺少"健康内容覆盖率"局限说明，"每日自动抓取"描述较简略）
  - `手机演示包/extensions/config.js` — 与根目录完全相同的副本
  - `手机演示包/extensions/hooks.js` — 与根目录完全相同的副本
- **标注**：未添加（内容与根目录版本相同，标注可参照对应根文件）

---

## 二、重复代码清理记录

### 已删除

| # | 原位置 | 删除原因 | 保留版本 |
|---|--------|---------|---------|
| 1 | `proxy/app.js` | `app.js` 是 `index.js` 的简化历史版本，代码内已标注 `@deprecated`。功能完全被 `index.js` 覆盖（index.js 多了 JSON body 解析、更完整的 UA、错误处理）。 | `proxy/index.js` |
| 2 | `生文助手.html` | 与 `强安兴企安全园地生文助手.html` MD5 完全一致（D2FE7C7A...），属于无意义的文件名副本。 | `强安兴企安全园地生文助手.html` |

### 待确认项

| # | 重复内容 | 详情 | 建议 |
|---|---------|------|------|
| 1 | `手机演示包/` 整个目录 | 包含 6 个文件，其中 4 个是根目录文件的精确副本（MD5 一致），2 个是旧版本（产品介绍页 footer 日期旧、功能描述较简略）。该目录是自包含的演示部署包，有自己的 `index.html` 使用相对路径引用本地文件。 | **不建议直接删除**：目录服务于独立部署场景。但如果演示包不再需要，可整体移除该目录。 |
| 2 | 跨文件共享工具函数 | `强安兴企安全园地生文助手.html` 和 `强安视界_UI改版.html` 中存在 ~12 个同名同功能函数：`gd()`、`showToast()`、`escapeHtml()`、`getApiBase()`、`getApiKey()`、`getBrandForModel()`、`initSettings()`、`populateModels()`、`updateBaseUrl()`、`callDeepSeekDraft()` 等。 | **不建议直接删除**：两个文件是独立运行的单文件 SPA，各自需要这些函数。`config.js` 已提取了可共享的配置，但运行时工具函数因架构限制仍分散在两处。后续重构建议：提取到 `extensions/shared.utils.js` 统一加载。 |

---

## 三、标注统计

| 文件 | 标注数量 | 标注方式 |
|------|---------|---------|
| `proxy/index.js` | 2 | 手动 edit_file |
| `index.html` | 3 | 手动 edit_file |
| `scripts/scrape-safety-news.js` | 3 | 手动 edit_file |
| `.github/workflows/update-safety-news.yml` | 1 | 手动 edit_file |
| `强安系列产品介绍_汇报页.html` | 1 | 手动 edit_file |
| `强安兴企安全园地生文助手.html` | 65 | Python 批量脚本 |
| `强安视界_UI改版.html` | 48 | Python 批量脚本 |
| `extensions/config.js` | 0 | 已有完善注释 |
| `extensions/hooks.js` | 0 | 已有完善注释 |
| `extensions/_template.js` | 0 | 已有完善注释 |
| **合计** | **123** | — |

---

## 四、文件状态总结

| 文件 | 标注 | 去重 |
|------|------|------|
| `.github/workflows/update-safety-news.yml` | ✅ 已标注 | — |
| `extensions/config.js` | ✅ 已有完善注释 | — |
| `extensions/hooks.js` | ✅ 已有完善注释 | — |
| `extensions/_template.js` | ✅ 已有完善注释 | — |
| `proxy/index.js` | ✅ 已标注 | — |
| `proxy/app.js` | — | 🗑️ 已删除 |
| `scripts/scrape-safety-news.js` | ✅ 已标注 | — |
| `index.html` | ✅ 已标注 | — |
| `强安兴企安全园地生文助手.html` | ✅ 已标注（65 处） | — |
| `强安视界_UI改版.html` | ✅ 已标注（48 处） | — |
| `强安系列产品介绍_汇报页.html` | ✅ 已标注 | — |
| `生文助手.html` | — | 🗑️ 已删除 |
| `手机演示包/index.html` | ⏭️ 参照根文件 | ⚠️ 待确认 |
| `手机演示包/强安兴企安全园地生文助手.html` | ⏭️ 参照根文件 | ⚠️ 待确认 |
| `手机演示包/强安视界_UI改版.html` | ⏭️ 参照根文件 | ⚠️ 待确认 |
| `手机演示包/强安系列产品介绍_汇报页.html` | ⏭️ 参照根文件 | ⚠️ 待确认（旧版） |
| `手机演示包/extensions/config.js` | ⏭️ 参照根文件 | ⚠️ 待确认 |
| `手机演示包/extensions/hooks.js` | ⏭️ 参照根文件 | ⚠️ 待确认 |
---

## 五、增量审计：v4 双 Gist 架构与近期变更（7/27-7/28）

### 5.1 v4 双 Gist 架构（`scripts/scrape-safety-news.js` + workflow）

**变更本质**：将单一 Gist（safety_news.json，30 条上限）拆分为双 Gist：

| Gist | 文件 | 写入方式 | 上限 | 用途 |
|------|------|----------|------|------|
| Gist A | `safety_news_latest.json` | 每次覆盖 | 30 条 | 运维查看最新一轮抓取结果 |
| Gist B | `safety_news_display.json` | 合并去重追加 | 100 条 | 前端唯一数据源，长期累积 |

**关键逻辑**：
- `saveToGistA()`：每次运行覆盖写入 Gist A
- `saveToGistB(newItems)`：读取 Gist B 现有数据 → 按 URL 去重合并 → 综合评分排序 → 截断到 100 条 → 写回
- `initFromOldGist()`：仅在 Gist B 为空时首次运行读取旧 `safety_news.json` 迁移历史数据。404 视为正常（旧文件可能已不存在），网络异常 / 429 / JSON 解析失败则 throw 防止静默丢失
- `calculateCompositeScore(item)`：综合评分 = 质量分 × 时间衰减因子。时间衰减因子 = 1.0 - (ageDays / 14)，最低 0.3（14 天后不再衰减）
- 前端消费：只读 Gist B Raw URL → localStorage 缓存 100 条

**为什么拆分**：
- v3 中 Gist A 和 Gist B 概念混乱——A 每次新增，B 也是累积，用户不知道哪个是权威数据源
- v4 明确分工：A 是"今天抓到了什么"，B 是"素材库里有什么"
- 前端只读 B，架构清晰

### 5.2 .bak 残留文件清理（7/27）

- **现象**：项目根目录下有 8 个 `.bak` 备份残留文件（`index.html.bak`、`强安兴企安全园地生文助手.html.bak` 等），为 Codex 批量注释脚本的产物
- **修复**：删除全部 8 个 `.bak` 文件
- **Commit**: 99659f3

### 5.3 workflow 改名 v4（`.github/workflows/update-safety-news.yml`）

- **现象**：workflow 名称仍为 `v2`，与实际架构不匹配
- **修复**：Job name 和 workflow name 从 `v2` 改为 `v4`
- **Commit**: 256586c

### 5.4 scrape-test.js 离线判断（`scripts/scrape-test.js`）

- **现象**：GPT 反馈测试脚本缺少离线环境判断，需手动注释代码切换测试/生产模式
- **修复**：增加 `isOnlineEnv` 变量，自动检测 GitHub Actions 环境 → 线上模式；本地运行 → 测试模式。移除手动注释切换逻辑
- **Commit**: 256586c

### 5.5 手机演示包 4 文件同步

- **变更**：根目录文件修改后未同步到 `手机演示包/` 目录，GPT 指出该问题
- **修复**：同步 4 个文件到手机演示包：`强安兴企安全园地生文助手.html`、`强安视界_UI改版.html`、`强安系列产品介绍_汇报页.html`、`extensions/config.js`
- **Commit**: 256586c

### 5.6 调试条 UI 重设计（`强安兴企安全园地生文助手.html`）

- **原设计**：页面顶部黑底绿字 monospace 调试条，显示英文技术信息（如 `Fetching materials...`），视觉效果突兀
- **新设计**：琥珀色底（`#f5a623`）+ CSS 旋转动画图标 + 中文状态文字：
  - 加载中："正在加载安全素材…"
  - 就绪："准备就绪"（2 秒后自动隐藏）
  - 失败："加载失败，请刷新页面重试"（红色底）
- **涉及代码**：diagBar HTML 替换、诊断 JS 函数重写、CSS `@keyframes diagSpin` 动画
- **Commit**: c7d62e2

### 5.7 v5.8~v5.10 配套参数调整

| 版本 | 变更项 | 详情 |
|------|--------|------|
| v5.8 | 评分阈值 ↓ | 65 → 55，增加入库通过率 |
| v5.8 | 新数据优先 | 前 20 个空位优先填充当天新数据 |
| v5.8 | 白名单测试 | 白名单 ≥1 词即放行（原需 ≥2） |
| v5.9 | 素材库上限 ↑ | 30 条 → 100 条滚动积累 |
| v5.10 | 前端排序恢复 | 恢复质量分降序排列 |
| v5.0 | addedAt + lastViewAt | 管道新素材打入库日期，前端改日期比较判新增，不依赖缓存 |
| v5.0.2 | 24h 兜底判新增 | 首次访问无 lastViewAt 时，最近 24h 入库素材标 isNew，避免首访白吃标记机会 |
| v5.0.3 | 手机端新增溢出修复 | .material-meta 改用 flex-wrap 换行，日期 margin-left:auto 右对齐 |
| v4.3 | 新增标记条件 | oldMats.length→freshItems.length，首次加载也能标新增 |

---

*（内容由AI生成，仅供参考）*
