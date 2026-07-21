

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
