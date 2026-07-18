/**
 * scrape-safety-news.js — 云端安全新闻抓取管道
 * 
 * 流程：
 *  1. 从 Gist 拉取已有素材 (GET)
 *  2. 7 站 Bing site: 搜索 → cheerio 解析 → 正文抓取 → 分类打标
 *  3. 合并去重 (按标准化标题) → 截断至 100 条 → 推回 Gist (PATCH)
 * 
 * GitHub Actions 每天 UTC 00:00 (北京时间 8:00) 触发。
 * 需要仓库 Secrets: GIST_TOKEN (github.com → Settings → Secrets → Actions)
 */

import * as cheerio from "cheerio";

// ========== 配置 ==========
const GIST_ID = "360b3e9ec81bfee6765883cbb0da7aec";
const GIST_FILENAME = "safety_news.json";
const GIST_RAW_URL = `https://gist.githubusercontent.com/Good-n1ght/${GIST_ID}/raw/${GIST_FILENAME}`;
const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;

const MAX_RESULTS_PER_SOURCE = 3;   // 每个源最多保留
const MAX_TOTAL_STORED = 100;       // Gist 中最多保留条数
const FETCH_TIMEOUT_MS = 12000;     // 单篇正文抓取超时
const MAX_CONTENT_CHARS = 6000;     // 正文最大截断字符数

// 与 config.js 一致的搜索源
const SEARCH_SOURCES = [
  { name: "应急管理部",       site: "mem.gov.cn",              keywords: "安全 事故 应急 消防 防火 节日 安全提醒" },
  { name: "国家矿山安全监察局", site: "chinamine-safety.gov.cn", keywords: "安全 矿山 事故 应急 班组建设 现场实训" },
  { name: "中国煤炭报",       site: "coalnews.cn",             keywords: "煤矿 安全 事故 现场实训 技能培训 健康 班组" },
  { name: "煤矿安全网",       site: "mkaq.org",                keywords: "煤矿 安全 事故 班组建设 现场实训 班组长" },
  { name: "安全文化网",       site: "anquan.com.cn",           keywords: "安全 事故 应急 矿山 煤矿 职工健康 心脑血管 高血压 饮食 季节 班组" },
  { name: "煤炭资讯网",       site: "cwestc.com",              keywords: "职工健康 心脑血管 高血压 急救 戒烟 限酒 节日安全 班组建设" },
  { name: "国家卫健委",       site: "nhc.gov.cn",              keywords: "职工健康 职业病 心脑血管 高血压 糖尿病 饮食 戒烟 限酒 季节防病" },
];

// ========== 工具函数 ==========
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function classifyText(text) {
  const t = text.toLowerCase();
  if (/职业健康|职业病|尘肺|体检/.test(t)) return "职业健康";
  if (/班组|班组长|培训|技能|竞赛/.test(t)) return "班组建设";
  if (/工会|安康杯|职工/.test(t)) return "工会劳动保护";
  if (/智能化|智慧矿山|5g|vr|数字化/.test(t)) return "智慧矿山";
  if (/防汛|雨季|防暑|高温/.test(t)) return "季节性安全";
  if (/事故|隐患|排查|整治|专项/.test(t)) return "隐患排查";
  if (/标准化|达标/.test(t)) return "标准化建设";
  if (/救援|应急|预案/.test(t)) return "应急救援";
  if (/瓦斯|水害|冲击地压|顶板/.test(t)) return "灾害防治";
  if (/法规|法律|条例|意见|规划/.test(t)) return "政策法规";
  return "综合安全";
}

function extractTags(title, summary) {
  const text = title + " " + summary;
  const tags = [];
  if (/矿山|煤矿/.test(text)) tags.push("矿山安全");
  if (/安全/.test(text)) tags.push("安全生产");
  if (/唐山|河北|开滦/.test(text)) tags.push("河北/唐山");
  if (/班组|班组长/.test(text)) tags.push("班组");
  if (/职业健康|职业病/.test(text)) tags.push("职业健康");
  if (/工会|安康杯/.test(text)) tags.push("工会");
  return tags.slice(0, 3);
}

const todayISO = new Date().toISOString().slice(0, 10);

// ========== Bing 搜索 (cheerio 解析) ==========
async function searchBing(source) {
  const query = `site:${source.site} ${source.keywords}`;
  const url = `https://cn.bing.com/search?q=${encodeURIComponent(query)}&setmkt=zh-CN&cc=CN&count=5`;
  
  console.log(`[搜索] ${source.name}: ${url}`);

  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "zh-CN,zh;q=0.9",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!resp.ok) {
    console.warn(`[搜索失败] ${source.name}: HTTP ${resp.status}`);
    return [];
  }

  const html = await resp.text();
  const $ = cheerio.load(html);
  const results = [];

  // 标准 Bing 搜索结果块
  $("li.b_algo").each((_, el) => {
    if (results.length >= MAX_RESULTS_PER_SOURCE) return false;
    const $a = $(el).find("h2 a").first();
    const title = $a.text().replace(/\s+/g, " ").trim();
    const link = $a.attr("href");
    const summary = $(el).find(".b_caption p, .b_lineclamp2, .b_lineclamp4").first().text().replace(/\s+/g, " ").trim() || title;

    if (!title || !link || !link.startsWith("http")) return;
    // 过滤明显无关
    if (/^(Math Calculator|Online |Dictionary)/.test(title)) return;

    results.push({
      title,
      link,
      summary: summary || title,
      source: source.name,
      content: "",
      publishedAt: todayISO,
      category: "",
      tags: [],
      review: false,
    });
  });

  // 回退：宽松匹配 (部分搜索结果不在 b_algo 内)
  if (results.length === 0) {
    $("li.b_algo, .b_ans").each((_, el) => {
      if (results.length >= MAX_RESULTS_PER_SOURCE) return false;
      const $a = $(el).find("a[href]").first();
      const title = $a.text().replace(/\s+/g, " ").trim();
      const link = $a.attr("href");
      if (!title || !link || !link.startsWith("http")) return;
      results.push({
        title,
        link,
        summary: title,
        source: source.name,
        content: "",
        publishedAt: todayISO,
        category: "",
        tags: [],
        review: false,
      });
    });
  }

  console.log(`[搜索完成] ${source.name}: ${results.length} 条`);
  return results;
}

// ========== 抓取正文 ==========
async function fetchArticle(item) {
  console.log(`[抓取] ${item.title.substring(0, 30)}...`);
  try {
    const resp = await fetch(item.link, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const html = await resp.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    item.content = text.length > MAX_CONTENT_CHARS ? text.substring(0, MAX_CONTENT_CHARS) : text;
    console.log(`[抓取完成] ${item.title.substring(0, 30)}... (${item.content.length} 字)`);
  } catch (err) {
    console.warn(`[抓取失败] ${item.title.substring(0, 30)}...: ${err.message}`);
    item.content = item.summary; // 兜底用摘要
  }
}

// ========== 分类 + 打标 ==========
const MAX_STORED_CHARS = 500; // 存入 Gist 的正文摘要上限（字）
function enrichItem(item) {
  const catText = item.title + " " + item.summary + " " + item.content;
  item.category = classifyText(catText);
  item.tags = extractTags(item.title, item.summary);
  item.review = false;
  // 保留 500 字正文摘要，前端无需重复抓取
  item.content = (item.content || item.summary || "").substring(0, MAX_STORED_CHARS);
  return item;
}

// ========== Gist 操作 ==========
async function fetchExistingGist(token) {
  console.log("[Gist] 拉取已有数据...");
  try {
    const resp = await fetch(`${GIST_RAW_URL}?_t=${Date.now()}`);
    if (!resp.ok) {
      console.warn(`[Gist] 拉取失败 HTTP ${resp.status}，视为空数据`);
      return [];
    }
    const data = await resp.json();
    return data.items || [];
  } catch (err) {
    console.warn(`[Gist] 拉取异常: ${err.message}，视为空数据`);
    return [];
  }
}

async function updateGist(token, items) {
  console.log(`[Gist] 推送 ${items.length} 条到 Gist...`);
  const body = JSON.stringify({
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify({ items, updatedAt: new Date().toISOString() }, null, 2),
      },
    },
  });

  const resp = await fetch(GIST_API_URL, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "safety-news-scraper/1.0",
    },
    body,
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Gist 更新失败: HTTP ${resp.status} — ${errBody}`);
  }

  const result = await resp.json();
  console.log(`[Gist] 推送成功 → ${result.html_url}`);
}

// ========== 主流程 ==========
async function main() {
  const token = process.env.GIST_TOKEN;
  if (!token) {
    console.error("❌ 缺少 GIST_TOKEN 环境变量。请在仓库 Settings → Secrets → Actions 添加。");
    process.exit(1);
  }

  console.log(`=== 安全新闻抓取管道启动 (${new Date().toISOString()}) ===`);

  // 1. 拉取已有数据
  const existing = await fetchExistingGist(token);
  console.log(`[现有] ${existing.length} 条`);

  // 2. 7 站搜索（并行）
  const allSearchResults = [];
  for (const source of SEARCH_SOURCES) {
    try {
      const results = await searchBing(source);
      allSearchResults.push(...results);
    } catch (err) {
      console.warn(`[搜索异常] ${source.name}: ${err.message}`);
    }
    // 站间间隔 2s，避免被 Bing 限流
    await sleep(2000);
  }
  console.log(`[搜索总计] ${allSearchResults.length} 条 (去重前)`);

  // 链接去重
  const seenLinks = new Set();
  const uniqueResults = allSearchResults.filter((r) => {
    if (seenLinks.has(r.link)) return false;
    seenLinks.add(r.link);
    return true;
  });
  console.log(`[去重后] ${uniqueResults.length} 条`);

  // 3. 抓取正文（串行，友好对待目标站）
  for (const item of uniqueResults) {
    try {
      await fetchArticle(item);
    } catch (err) {
      console.warn(`[正文异常] ${item.title}: ${err.message}`);
    }
    await sleep(1000);
  }

  // 4. 分类打标
  const enriched = uniqueResults.map(enrichItem);
  console.log(`[处理完成] ${enriched.length} 条`);

  // 5. 与已有数据合并，按标题去重
  const normalizeTitle = (t) => (t || "").replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "").toLowerCase().substring(0, 20);
  const existingTitles = new Set(existing.map((e) => normalizeTitle(e.title)));
  const freshItems = enriched.filter((item) => !existingTitles.has(normalizeTitle(item.title)));

  console.log(`[合并] 新增 ${freshItems.length} 条，已有 ${existing.length} 条`);

  // 6. 合并 + 截断
  const merged = [...freshItems, ...existing];
  merged.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  const final = merged.slice(0, MAX_TOTAL_STORED);

  // 7. 推送 Gist
  await updateGist(token, final);

  // 8. 输出摘要
  console.log(`\n=== 执行摘要 ===`);
  console.log(`总素材: ${final.length} 条`);
  console.log(`本次新增: ${freshItems.length} 条`);
  const catCounts = {};
  final.forEach((i) => { catCounts[i.category] = (catCounts[i.category] || 0) + 1; });
  console.log(`分类分布: ${JSON.stringify(catCounts)}`);
  console.log(`完成时间: ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("❌ 管道崩溃:", err);
  process.exit(1);
});
