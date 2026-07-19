/**
 * _template.js — 扩展模板
 * 
 * 复制此文件为 your-extension.js，按需实现钩子，放到 extensions/ 目录即可。
 * index.html 会自动加载 extensions/ 下所有 .js 文件（按文件名排序）。
 * 
 * 可用钩子：
 *   Hooks.BEFORE_SEARCH    — 搜索前 ({ query, sources })
 *   Hooks.AFTER_SEARCH     — 搜索后 ({ query, results })
 *   Hooks.BEFORE_FETCH     — 抓取前 ({ url, headers })
 *   Hooks.AFTER_FETCH      — 抓取后 ({ url, content })
 *   Hooks.BEFORE_GENERATE  — 生成前 ({ topic, audience, tone, searchResults })
 *   Hooks.AFTER_GENERATE   — 生成后 (draft object)
 *   Hooks.BEFORE_RENDER    — 渲染前 ({ draft, elements })
 *   Hooks.BEFORE_API_CALL  — API 调用前 ({ url, headers, body })
 *   Hooks.AFTER_API_CALL   — API 调用后 ({ response, body })
 *   Hooks.AFTER_MATERIALS  — 素材加载后 ({ materials })
 */

/* === 示例 1: 搜索前自动追加关键词 === */
Hooks.on(Hooks.BEFORE_SEARCH, function(ctx) {
  // 给所有搜索自动加上"安全"关键词
  // ctx.query = ctx.query + " 安全 教育";
  return ctx;
});

/* === 示例 2: 搜索后过滤低质量结果 === */
Hooks.on(Hooks.AFTER_SEARCH, function(ctx) {
  // 过滤掉摘要太短的结果
  // ctx.results = ctx.results.filter(function(r) {
  //   return r.summary && r.summary.length > 30;
  // });
  return ctx;
});

/* === 示例 3: 生成文章后追加签名 === */
Hooks.on(Hooks.AFTER_GENERATE, function(draft) {
  // draft.content = draft.content + "<hr><p><em>—— 强安兴企安全园地 AI 辅助生成</em></p>";
  return draft;
});

/* === 示例 4: 过滤素材列表（比如只显示"班组建设"分类） === */
Hooks.on(Hooks.AFTER_MATERIALS, function(ctx) {
  // ctx.materials = ctx.materials.filter(function(m) { return m.category === "班组建设"; });
  return ctx;
});

/* === 示例 5: 为特定话题定制系统 Prompt === */
Hooks.on(Hooks.BEFORE_API_CALL, function(ctx) {
  // if (ctx.body && ctx.body.messages) {
  //   var userMsg = ctx.body.messages.find(function(m) { return m.role === "user"; });
  //   if (userMsg && userMsg.content.indexOf("消防") !== -1) {
  //     // 对消防话题追加特殊指令
  //     userMsg.content += "\n\n特别要求：重点强调灭火器和逃生通道的位置检查。";
  //   }
  // }
  return ctx;
});

console.log("[Extension] 模板扩展已加载（示例均被注释，未实际生效）");
