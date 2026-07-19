/**
 * hooks.js — 强安兴企助手扩展钩子系统
 * 
 * 设计原则：最小侵入。在 index.html 关键节点插入 hook 调用，
 * 扩展只需注册回调即可拦截/增强流程，无需修改主代码。
 * 
 * 使用方式：
 *   Hooks.on('beforeSearch', function(ctx) { ctx.query += ' 安全'; });
 *   Hooks.on('afterGenerate', function(draft) { draft.content = '【加料】' + draft.content; });
 */

var Hooks = (function() {
  var _registry = {};

  function on(name, fn, priority) {
    priority = priority || 100;
    if (!_registry[name]) _registry[name] = [];
    _registry[name].push({ fn: fn, priority: priority });
    _registry[name].sort(function(a, b) { return a.priority - b.priority; });
    console.log("[Hook] 注册: " + name + " (优先级 " + priority + ")");
  }

  function off(name, fn) {
    if (!_registry[name]) return;
    _registry[name] = _registry[name].filter(function(entry) { return entry.fn !== fn; });
  }

  function trigger(name, ctx) {
    if (!_registry[name]) return ctx;
    var result = ctx;
    for (var i = 0; i < _registry[name].length; i++) {
      try {
        var r = _registry[name][i].fn(result);
        if (r !== undefined) result = r;
      } catch(e) {
        console.warn("[Hook] " + name + " 回调 #" + i + " 异常:", e.message);
      }
    }
    return result;
  }

  /* 异步触发：支持 Promise 串联 */
  function triggerAsync(name, ctx) {
    if (!_registry[name]) return Promise.resolve(ctx);
    var chain = Promise.resolve(ctx);
    for (let i = 0; i < _registry[name].length; i++) {
      let entry = _registry[name][i];
      chain = chain.then(function(val) {
        return Promise.resolve(val).then(entry.fn).catch(function(e) {
          console.warn("[Hook] " + name + " async 异常:", e.message);
          return val;
        });
      });
    }
    return chain;
  }

  function list() {
    var result = {};
    Object.keys(_registry).forEach(function(k) {
      result[k] = _registry[k].length;
    });
    return result;
  }

  return {
    on: on,
    off: off,
    trigger: trigger,
    triggerAsync: triggerAsync,
    list: list,

    /* ---------- 钩子点定义 ---------- */

    // 搜索阶段
    BEFORE_SEARCH:    "beforeSearch",     // ctx: { query, sources }  → 可修改 query 或 sources
    AFTER_SEARCH:     "afterSearch",      // ctx: { query, results }  → 可过滤/增强 results
    BEFORE_FETCH:     "beforeFetch",      // ctx: { url, headers }    → 可修改抓取参数
    AFTER_FETCH:      "afterFetch",       // ctx: { url, content }    → 可清洗/截断 content

    // 生成阶段
    BEFORE_GENERATE:  "beforeGenerate",   // ctx: { topic, audience, tone, searchResults }
    AFTER_GENERATE:   "afterGenerate",    // ctx: draft object
    BEFORE_RENDER:    "beforeRender",     // ctx: { draft, elements } → 可在渲染前修改 draft

    // 模型调用阶段
    BEFORE_API_CALL:  "beforeApiCall",    // ctx: { url, headers, body } → 可拦截/修改 API 请求
    AFTER_API_CALL:   "afterApiCall",     // ctx: { response, body }     → 可处理 API 响应

    // 素材阶段
    AFTER_MATERIALS:  "afterMaterials",   // ctx: { materials } → 可过滤/增强素材列表
    BEFORE_CACHE:     "beforeCache",      // ctx: { key, value } → 可在写入 localStorage 前处理
  };
})();

console.log("[Hook] 钩子系统就绪，可用钩子点:", Object.keys(Hooks.list).length + " 个");
