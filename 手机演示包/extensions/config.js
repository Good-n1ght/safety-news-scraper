/**
 * config.js — 强安兴企助手外部化配置
 * 
 * 所有可配置项集中在此文件。修改后刷新浏览器即可生效，无需改 index.html。
 * 
 * 扩展方式：
 *   1. 加搜索源 → 在 SEARCH_SOURCES 数组末尾新增
 *   2. 加模型品牌 → 在 MODEL_BRANDS 和 MODEL_MAP 中各加一条
 *   3. 改 CORS 代理 → 修改 CORS_PROXY_LIST
 *   4. 改生成参数 → 修改 GENERATION_DEFAULTS
 */

/* ========== CORS 代理 ========== */
var CORS_PROXY_LIST = [
  "https://1437883484-k88upcj3r3.ap-guangzhou.tencentscf.com/?url=",
  "https://api.allorigins.win/raw?url="   // 备用代理
];

/* ========== 搜索源配置 ==========
 * site:    站点域名（用于 site: 搜索）
 * keywords: 搜索时附加的关键词（增强搜索准确性）
 * enabled: 设为 false 可临时关闭某个源
 * name:    显示名称
 */
var SEARCH_SOURCES = [
  { name: "应急管理部",       site: "mem.gov.cn",              enabled: true, keywords: "安全 事故 应急 消防 防火 节日 安全提醒" },
  { name: "国家矿山安全监察局", site: "chinamine-safety.gov.cn", enabled: true, keywords: "安全 矿山 事故 应急 班组建设 现场实训" },
  { name: "中国煤炭报",       site: "coalnews.cn",             enabled: true, keywords: "煤矿 安全 事故 现场实训 技能培训 健康 班组" },
  { name: "煤矿安全网",       site: "mkaq.org",                enabled: true, keywords: "煤矿 安全 事故 班组建设 现场实训 班组长" },
  { name: "安全文化网",       site: "anquan.com.cn",           enabled: true, keywords: "安全 事故 应急 矿山 煤矿 职工健康 心脑血管 高血压 饮食 季节 班组" },
  { name: "煤炭资讯网",       site: "cwestc.com",              enabled: true, keywords: "职工健康 心脑血管 高血压 急救 戒烟 限酒 节日安全 班组建设" },
  { name: "国家卫健委",       site: "nhc.gov.cn",              enabled: true, keywords: "职工健康 职业病 心脑血管 高血压 糖尿病 饮食 戒烟 限酒 季节防病" },
];

/* ========== 生成参数默认值 ========== */
var GENERATION_DEFAULTS = {
  temperature: 0.9,
  max_tokens: 3600,
  min_words: 800,
  max_words: 1500,
  fetch_timeout_ms: 12000,    // 单篇文章抓取超时
  search_timeout_ms: 15000,   // 单个搜索源超时
  api_timeout_ms: 60000,      // AI API 调用超时
  max_content_chars: 6000,    // 全文抓取最大截断字符数
  search_max_results: 5,      // 最终返回搜索结果上限
};

/* ========== 素材源 ========== */
var GIST_RAW_URL = "https://gist.githubusercontent.com/Good-n1ght/360b3e9ec81bfee6765883cbb0da7aec/raw/safety_news.json";
var MATERIALS_CACHE_DAYS = 30;

/* ========== 默认 API 配置 ========== */
var DEFAULT_API_KEY  = "";
var DEFAULT_MODEL    = "deepseek-chat";
var DEFAULT_BASE_URL = "https://api.deepseek.com";

/* ========== 模型配置（来源: OpenRouter 实时模型列表 2026-07-10）========== */
var MODEL_MAP = {
  /* Amazon Nova */
  "amazon/nova-2-lite-v1": { name: "Nova 2 Lite (1000K)", baseUrl: "https://openrouter.ai/api" },
  "amazon/nova-premier-v1": { name: "Nova Premier 1.0 (1000K)", baseUrl: "https://openrouter.ai/api" },
  "amazon/nova-lite-v1": { name: "Nova Lite 1.0 (300K)", baseUrl: "https://openrouter.ai/api" },
  "amazon/nova-pro-v1": { name: "Nova Pro 1.0 (300K)", baseUrl: "https://openrouter.ai/api" },
  "amazon/nova-micro-v1": { name: "Nova Micro 1.0 (128K)", baseUrl: "https://openrouter.ai/api" },
  /* Anthropic */
  "anthropic/claude-fable-5": { name: "Claude Fable 5 (1000K)", baseUrl: "https://openrouter.ai/api" },
  "anthropic/claude-opus-4.6": { name: "Claude Opus 4.6 (1000K)", baseUrl: "https://openrouter.ai/api" },
  "anthropic/claude-opus-4.7": { name: "Claude Opus 4.7 (1000K)", baseUrl: "https://openrouter.ai/api" },
  "anthropic/claude-opus-4.7-fast": { name: "Claude Opus 4.7 Fast (1000K)", baseUrl: "https://openrouter.ai/api" },
  "anthropic/claude-opus-4.8": { name: "Claude Opus 4.8 (1000K)", baseUrl: "https://openrouter.ai/api" },
  "anthropic/claude-opus-4.8-fast": { name: "Claude Opus 4.8 Fast (1000K)", baseUrl: "https://openrouter.ai/api" },
  "anthropic/claude-sonnet-4": { name: "Claude Sonnet 4 (1000K)", baseUrl: "https://openrouter.ai/api" },
  "anthropic/claude-sonnet-4.5": { name: "Claude Sonnet 4.5 (1000K)", baseUrl: "https://openrouter.ai/api" },
  /* Cohere */
  "cohere/command-a": { name: "Command A (256K)", baseUrl: "https://openrouter.ai/api" },
  "cohere/north-mini-code:free": { name: "North Mini Code (256K)", baseUrl: "https://openrouter.ai/api" },
  "cohere/command-r-08-2024": { name: "Command R 08-2024 (128K)", baseUrl: "https://openrouter.ai/api" },
  "cohere/command-r-plus-08-2024": { name: "Command R+ 08-2024 (128K)", baseUrl: "https://openrouter.ai/api" },
  /* DeepSeek 直连（用你自己的 DS Key） */
  "deepseek-chat":           { name: "V3 Chat [直连] (128K)", baseUrl: "https://api.deepseek.com" },
  "deepseek-v4-flash":       { name: "V4 Flash [直连] (128K)", baseUrl: "https://api.deepseek.com" },
  "deepseek-v4-pro":         { name: "V4 Pro [直连] (128K)", baseUrl: "https://api.deepseek.com" },
  "deepseek-chat-v3.1":      { name: "V3.1 [直连] (128K)", baseUrl: "https://api.deepseek.com" },
  "deepseek-r1-0528":        { name: "R1 0528 [直连] (128K)", baseUrl: "https://api.deepseek.com" },
  /* DeepSeek - OpenRouter 中转 */
  "deepseek/deepseek-v4-flash": { name: "V4 Flash (1048K)", baseUrl: "https://openrouter.ai/api" },
  "deepseek/deepseek-v4-pro": { name: "V4 Pro (1048K)", baseUrl: "https://openrouter.ai/api" },
  "deepseek/deepseek-chat-v3-0324": { name: "V3 0324 (163K)", baseUrl: "https://openrouter.ai/api" },
  "deepseek/deepseek-chat-v3.1": { name: "V3.1 (163K)", baseUrl: "https://openrouter.ai/api" },
  "deepseek/deepseek-v3.1-terminus": { name: "V3.1 Terminus (163K)", baseUrl: "https://openrouter.ai/api" },
  "deepseek/deepseek-v3.2-exp": { name: "V3.2 Exp (163K)", baseUrl: "https://openrouter.ai/api" },
  "deepseek/deepseek-r1": { name: "R1 (163K)", baseUrl: "https://openrouter.ai/api" },
  "deepseek/deepseek-r1-0528": { name: "R1 0528 (163K)", baseUrl: "https://openrouter.ai/api" },
  /* Google Gemini */
  "google/gemini-2.5-flash": { name: "Gemini 2.5 Flash (1048K)", baseUrl: "https://openrouter.ai/api" },
  "google/gemini-2.5-flash-lite": { name: "Gemini 2.5 Flash Lite (1048K)", baseUrl: "https://openrouter.ai/api" },
  "google/gemini-2.5-pro": { name: "Gemini 2.5 Pro (1048K)", baseUrl: "https://openrouter.ai/api" },
  "google/gemini-3-flash-preview": { name: "Gemini 3 Flash Preview (1048K)", baseUrl: "https://openrouter.ai/api" },
  "google/gemini-3.1-flash-lite": { name: "Gemini 3.1 Flash Lite (1048K)", baseUrl: "https://openrouter.ai/api" },
  "google/gemma-4-26b-a4b-it": { name: "Gemma 4 26B (262K)", baseUrl: "https://openrouter.ai/api" },
  "google/gemma-4-26b-a4b-it:free": { name: "Gemma 4 26B (262K)", baseUrl: "https://openrouter.ai/api" },
  "google/gemma-3-4b-it": { name: "Gemma 3 4B (131K)", baseUrl: "https://openrouter.ai/api" },
  /* Inflection */
  "inflection/inflection-3-pi": { name: "Inflection 3 Pi (8K)", baseUrl: "https://openrouter.ai/api" },
  "inflection/inflection-3-productivity": { name: "Inflection 3 Productivity (8K)", baseUrl: "https://openrouter.ai/api" },
  /* Meta Llama */
  "meta-llama/llama-4-scout": { name: "Llama 4 Scout (10M)", baseUrl: "https://openrouter.ai/api" },
  "meta-llama/llama-4-maverick": { name: "Llama 4 Maverick (1048K)", baseUrl: "https://openrouter.ai/api" },
  "meta-llama/llama-3.1-70b-instruct": { name: "Llama 3.1 70B (131K)", baseUrl: "https://openrouter.ai/api" },
  "meta-llama/llama-3.3-70b-instruct": { name: "Llama 3.3 70B (131K)", baseUrl: "https://openrouter.ai/api" },
  /* MiniMax */
  "minimax/minimax-m3": { name: "MiniMax M3 (1048K)", baseUrl: "https://openrouter.ai/api" },
  "minimax/minimax-01": { name: "MiniMax-01 (1000K)", baseUrl: "https://openrouter.ai/api" },
  "minimax/minimax-m1": { name: "MiniMax M1 (1000K)", baseUrl: "https://openrouter.ai/api" },
  "minimax/minimax-m2": { name: "MiniMax M2 (204K)", baseUrl: "https://openrouter.ai/api" },
  "minimax/minimax-m2.1": { name: "MiniMax M2.1 (204K)", baseUrl: "https://openrouter.ai/api" },
  "minimax/minimax-m2.5": { name: "MiniMax M2.5 (204K)", baseUrl: "https://openrouter.ai/api" },
  "minimax/minimax-m2.7": { name: "MiniMax M2.7 (204K)", baseUrl: "https://openrouter.ai/api" },
  "minimax/minimax-m2-her": { name: "MiniMax M2-her (65K)", baseUrl: "https://openrouter.ai/api" },
  /* Mistral AI */
  "mistralai/devstral-2512": { name: "Devstral 2 2512 (262K)", baseUrl: "https://openrouter.ai/api" },
  "mistralai/ministral-14b-2512": { name: "Ministral 3 14B (262K)", baseUrl: "https://openrouter.ai/api" },
  "mistralai/mistral-large-2512": { name: "Mistral Large 3 (262K)", baseUrl: "https://openrouter.ai/api" },
  "mistralai/mistral-medium-3-5": { name: "Mistral Medium 3.5 (262K)", baseUrl: "https://openrouter.ai/api" },
  "mistralai/mistral-small-2603": { name: "Mistral Small 4 (262K)", baseUrl: "https://openrouter.ai/api" },
  "mistralai/codestral-2508": { name: "Codestral 2508 (256K)", baseUrl: "https://openrouter.ai/api" },
  "mistralai/mistral-large-2407": { name: "Mistral Large 2407 (131K)", baseUrl: "https://openrouter.ai/api" },
  "mistralai/mistral-medium-3": { name: "Mistral Medium 3 (131K)", baseUrl: "https://openrouter.ai/api" },
  /* 月之暗面 Kimi */
  "moonshotai/kimi-k2-0905": { name: "Kimi K2 0905 (262K)", baseUrl: "https://openrouter.ai/api" },
  "moonshotai/kimi-k2-thinking": { name: "Kimi K2 Thinking (262K)", baseUrl: "https://openrouter.ai/api" },
  "moonshotai/kimi-k2.5": { name: "Kimi K2.5 (262K)", baseUrl: "https://openrouter.ai/api" },
  "moonshotai/kimi-k2.6": { name: "Kimi K2.6 (262K)", baseUrl: "https://openrouter.ai/api" },
  "moonshotai/kimi-k2.7-code": { name: "Kimi K2.7 Code (262K)", baseUrl: "https://openrouter.ai/api" },
  "moonshotai/kimi-k2": { name: "Kimi K2 0711 (131K)", baseUrl: "https://openrouter.ai/api" },
  /* NVIDIA Nemotron */
  "nvidia/nemotron-3-super-120b-a12b": { name: "Nemotron 3 Super (1000K)", baseUrl: "https://openrouter.ai/api" },
  "nvidia/nemotron-3-ultra-550b-a55b": { name: "Nemotron 3 Ultra (1000K)", baseUrl: "https://openrouter.ai/api" },
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free": { name: "Nemotron 3 Nano Omni (256K)", baseUrl: "https://openrouter.ai/api" },
  "nvidia/llama-3.3-nemotron-super-49b-v1.5": { name: "Llama 3.3 Nemotron 49B (131K)", baseUrl: "https://openrouter.ai/api" },
  "nvidia/nemotron-nano-9b-v2:free": { name: "Nemotron Nano 9B V2 (128K)", baseUrl: "https://openrouter.ai/api" },
  /* OpenAI */
  "openai/gpt-5.4": { name: "GPT-5.4 (1050K)", baseUrl: "https://openrouter.ai/api" },
  "openai/gpt-5.4-pro": { name: "GPT-5.4 Pro (1050K)", baseUrl: "https://openrouter.ai/api" },
  "openai/gpt-5.5": { name: "GPT-5.5 (1050K)", baseUrl: "https://openrouter.ai/api" },
  "openai/gpt-5.5-pro": { name: "GPT-5.5 Pro (1050K)", baseUrl: "https://openrouter.ai/api" },
  "openai/gpt-5.6-luna": { name: "GPT-5.6 Luna (1050K)", baseUrl: "https://openrouter.ai/api" },
  "openai/gpt-5.6-luna-pro": { name: "GPT-5.6 Luna Pro (1050K)", baseUrl: "https://openrouter.ai/api" },
  "openai/gpt-5.6-sol": { name: "GPT-5.6 Sol (1050K)", baseUrl: "https://openrouter.ai/api" },
  "openai/gpt-5.6-sol-pro": { name: "GPT-5.6 Sol Pro (1050K)", baseUrl: "https://openrouter.ai/api" },
  /* Perplexity */
  "perplexity/sonar-pro": { name: "Sonar Pro (200K)", baseUrl: "https://openrouter.ai/api" },
  "perplexity/sonar-pro-search": { name: "Sonar Pro Search (200K)", baseUrl: "https://openrouter.ai/api" },
  "perplexity/sonar-deep-research": { name: "Sonar Deep Research (128K)", baseUrl: "https://openrouter.ai/api" },
  "perplexity/sonar-reasoning-pro": { name: "Sonar Reasoning Pro (128K)", baseUrl: "https://openrouter.ai/api" },
  "perplexity/sonar": { name: "Sonar (127K)", baseUrl: "https://openrouter.ai/api" },
  /* 阿里通义 Qwen */
  "qwen/qwen3-coder": { name: "Qwen3 Coder 480B (1048K)", baseUrl: "https://openrouter.ai/api" },
  "qwen/qwen-plus-2025-07-28": { name: "Qwen Plus 0728 (1000K)", baseUrl: "https://openrouter.ai/api" },
  "qwen/qwen-plus-2025-07-28:thinking": { name: "Qwen Plus 0728 Thinking (1000K)", baseUrl: "https://openrouter.ai/api" },
  "qwen/qwen-plus": { name: "Qwen-Plus (1000K)", baseUrl: "https://openrouter.ai/api" },
  "qwen/qwen3-coder-flash": { name: "Qwen3 Coder Flash (1000K)", baseUrl: "https://openrouter.ai/api" },
  "qwen/qwen3-coder-plus": { name: "Qwen3 Coder Plus (1000K)", baseUrl: "https://openrouter.ai/api" },
  "qwen/qwen3.5-plus-02-15": { name: "Qwen3.5 Plus (1000K)", baseUrl: "https://openrouter.ai/api" },
  "qwen/qwq-plus": { name: "QwQ Plus (1000K)", baseUrl: "https://openrouter.ai/api" },
  /* xAI Grok */
  "x-ai/grok-4.20": { name: "Grok 4.20 (2000K)", baseUrl: "https://openrouter.ai/api" },
  "x-ai/grok-4.20-multi-agent": { name: "Grok 4.20 Multi-Agent (2000K)", baseUrl: "https://openrouter.ai/api" },
  "x-ai/grok-4.3": { name: "Grok 4.3 (1000K)", baseUrl: "https://openrouter.ai/api" },
  "x-ai/grok-4.5": { name: "Grok 4.5 (500K)", baseUrl: "https://openrouter.ai/api" },
  "x-ai/grok-build-0.1": { name: "Grok Build 0.1 (256K)", baseUrl: "https://openrouter.ai/api" },

  /* 智谱AI GLM */
  "zhipu/glm-4.7-flash": { name: "GLM-4.7-Flash (200K)", baseUrl: "https://open.bigmodel.cn/api/paas/v4", chatEndpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions", apiModel: "glm-4.7-flash" }
};

/* 品牌分组 */
var MODEL_BRANDS = [
  { name: "DeepSeek",     models: ["deepseek-chat","deepseek-v4-flash","deepseek-v4-pro","deepseek-chat-v3.1","deepseek-r1-0528","deepseek/deepseek-v4-flash","deepseek/deepseek-v4-pro","deepseek/deepseek-chat-v3-0324","deepseek/deepseek-chat-v3.1","deepseek/deepseek-v3.1-terminus","deepseek/deepseek-v3.2-exp","deepseek/deepseek-r1","deepseek/deepseek-r1-0528"] },
  { name: "OpenAI",       models: ["openai/gpt-5.6-luna","openai/gpt-5.6-luna-pro","openai/gpt-5.6-sol","openai/gpt-5.6-sol-pro","openai/gpt-5.5","openai/gpt-5.5-pro","openai/gpt-5.4","openai/gpt-5.4-pro"] },
  { name: "Anthropic",    models: ["anthropic/claude-opus-4.8","anthropic/claude-opus-4.8-fast","anthropic/claude-opus-4.7","anthropic/claude-opus-4.7-fast","anthropic/claude-opus-4.6","anthropic/claude-sonnet-4.5","anthropic/claude-sonnet-4","anthropic/claude-fable-5"] },
  { name: "Google Gemini",models: ["google/gemini-3.1-flash-lite","google/gemini-3-flash-preview","google/gemini-2.5-pro","google/gemini-2.5-flash","google/gemini-2.5-flash-lite","google/gemma-4-26b-a4b-it"] },
  { name: "xAI Grok",     models: ["x-ai/grok-4.20","x-ai/grok-4.20-multi-agent","x-ai/grok-4.5","x-ai/grok-4.3","x-ai/grok-build-0.1"] },
  { name: "Meta Llama",   models: ["meta-llama/llama-4-scout","meta-llama/llama-4-maverick","meta-llama/llama-3.3-70b-instruct","meta-llama/llama-3.1-70b-instruct"] },
  { name: "阿里通义 Qwen",  models: ["qwen/qwen3-coder","qwen/qwen3-coder-plus","qwen/qwen3-coder-flash","qwen/qwen-plus-2025-07-28","qwen/qwen-plus-2025-07-28:thinking","qwen/qwen-plus","qwen/qwen3.5-plus-02-15","qwen/qwq-plus"] },
  { name: "月之暗面 Kimi",  models: ["moonshotai/kimi-k2.7-code","moonshotai/kimi-k2.6","moonshotai/kimi-k2.5","moonshotai/kimi-k2-0905","moonshotai/kimi-k2-thinking","moonshotai/kimi-k2"] },
  { name: "Mistral AI",   models: ["mistralai/mistral-medium-3-5","mistralai/mistral-small-2603","mistralai/mistral-large-2512","mistralai/devstral-2512","mistralai/codestral-2508","mistralai/ministral-14b-2512"] },
  { name: "MiniMax",      models: ["minimax/minimax-m3","minimax/minimax-01","minimax/minimax-m1","minimax/minimax-m2.7","minimax/minimax-m2.5","minimax/minimax-m2.1","minimax/minimax-m2"] },
  { name: "NVIDIA Nemotron",models: ["nvidia/nemotron-3-ultra-550b-a55b","nvidia/nemotron-3-super-120b-a12b","nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free","nvidia/llama-3.3-nemotron-super-49b-v1.5"] },
  { name: "Amazon Nova",  models: ["amazon/nova-premier-v1","amazon/nova-2-lite-v1","amazon/nova-pro-v1","amazon/nova-lite-v1","amazon/nova-micro-v1"] },
  { name: "Perplexity",   models: ["perplexity/sonar-deep-research","perplexity/sonar-reasoning-pro","perplexity/sonar-pro","perplexity/sonar-pro-search","perplexity/sonar"] },
  { name: "Cohere",       models: ["cohere/command-a","cohere/command-r-plus-08-2024","cohere/command-r-08-2024","cohere/north-mini-code:free"] },
  { name: "Inflection",   models: ["inflection/inflection-3-productivity","inflection/inflection-3-pi"] },
  { name: "智谱AI GLM",  models: ["zhipu/glm-4.7-flash"] }
];
