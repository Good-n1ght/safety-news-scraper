/**
 * scrape-safety-news.js — 安全园地素材自动采集管道 v2
 * 
 * 三层数据源:
 *  1. Google News RSS（多关键词并行，快速发现当天新闻）
 *  2. 官方站点 Bing site: 搜索（cheerio 解析，权威兜底）
 *  3. fallback_materials.json（本地精选素材，防空洞）
 * 
 * 流程:
 *  1. 从 Gist 拉取已有素材
 *  2. Google News RSS 抓取（GitHub Actions 海外环境可直连）
 *  3. Bing site: 搜索官方源
 *  4. 正文抓取 + 打分 + 分类 + 过滤
 *  5. 合并去重 → 截断至 100 条 → 推回 Gist
 *  6. 若当日新增不足 10 条，从 fallback 补充
 * 
 * GitHub Actions 每天 07:30 / 15:30（北京时间）触发。
 * 需要仓库 Secrets: GIST_TOKEN
 */

import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ========== 配置 ==========
const GIST_ID = "360b3e9ec81bfee6765883cbb0da7aec";
const GIST_FILENAME = "safety_news.json";
const GIST_RAW_URL = `https://gist.githubusercontent.com/Good-n1ght/${GIST_ID}/raw/${GIST_FILENAME}`;
const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;

const MAX_TOTAL_STORED = 100;
const FETCH_TIMEOUT_MS = 12000;
const MAX_CONTENT_CHARS = 6000;
const MAX_STORED_CHARS = 500;
const MIN_DAILY_TARGET = 10; // 每日最少素材数，不足时从 fallback 补充

// ========== 第一层：Google News RSS 关键词 ==========
const GOOGLE_NEWS_KEYWORDS = [
  "煤矿安全",
  "矿山安全",
  "安全生产",
  "职业健康",
  "隐患排查",
  "班组建设",
  "劳动保护",
  "智慧矿山",
  "应急救援",
  "灾害防治",
];

// ========== 第二层：官方站点（Bing site: 搜索） ==========
const OFFICIAL_SOURCES = [
  { name: "国家矿山安全监察局",     site: "chinamine-safety.gov.cn",     keywords: "安全 矿山 事故 应急" },
  { name: "国家矿山安监局河北局",   site: "hb.chinamine-safety.gov.cn",  keywords: "安全 矿山 煤矿" },
  { name: "应急管理部",             site: "mem.gov.cn",                   keywords: "安全 事故 应急 消防" },
  { name: "中国安全生产网",         site: "aqsc.cn",                      keywords: "煤矿 安全 事故 班组" },
];

// ========== 评分规则（Codex 方案） ==========
const SCORE_RULES = {
  // 来源加分
  sourceBonus: (source) => {
    const s = source || "";
    if (/矿山安监局|应急管理部|中国安全生产网/.test(s)) return 30;
    if (/煤炭报|煤矿安全网|安全文化网|煤炭工业网/.test(s)) return 20;
    // 主流新闻源（Google News 聚合常出现），给基础分鼓励
    if (/新华|人民网|央视|中新网|中国日报|光明/.test(s)) return 15;
    if (/新浪|搜狐|网易|腾讯|澎湃|界面|新京报|环球/.test(s)) return 10;
    return 0;
  },

  // 标题关键词加分
  titleBonus: (title) => {
    const t = title || "";
    let score = 0;
    if (/煤矿|矿山|瓦斯|透水|顶板|粉尘|隐患|班组|劳动保护/.test(t)) score += 25;
    if (/河北|唐山|开滦|煤业集团/.test(t)) score += 20;
    return score;
  },

  // 摘要/正文加分
  summaryBonus: (summary) => {
    const s = summary || "";
    let score = 0;
    if (/安全生产/.test(s) && /煤矿|矿山|瓦斯|透水|隐患|班组/.test(s)) score += 20;
    if (/河北|唐山|开滦|煤业集团/.test(s)) score += 10;
    return score;
  },

  // 时间加分
  timeBonus: (publishedAt) => {
    if (!publishedAt) return 0;
    const days = (Date.now() - new Date(publishedAt).getTime()) / 86400000;
    return days <= 7 ? 10 : 0;
  },

  // 降权/剔除关键词（硬过滤）
  penaltyKeywords: [
    // 时事/政治/纪念类——不是安全实战素材
    "大地震", "遇难", "公祭", "纪念馆", "旧照", "老照片", "回顾展",
    "两会", "党代会", "全会精神", "政协", "人大",
    // 财经/股市类——煤矿安全板块跌1.7%这种无用
    "板块跌", "板块涨", "主力资金", "净流出", "净流入", "A股", "基金",
    // 明显无关领域
    "国际安全", "网络安全", "金融安全", "粮食安全", "铁路投资",
    "军事冲突", "社会治安", "普通交通事故", "娱乐新闻", "财经",
    // 生活消费类
    "外卖", "快递", "宠物", "旅游", "明星", "综艺", "游戏",
    // 纯粹的政治宣传稿，不涉及具体安全措施
    "采风活动", "采风调研", "文艺汇演", "书画展", "摄影展",
    // 其他无关领域（市容/志愿/会议/展会/农业）
    "城管", "义警", "授旗", "矿博会", "农业领域",
    "垃圾分类", "景观", "市委常委会",
  ],
};

function hasPenaltyKeywords(text) {
  return SCORE_RULES.penaltyKeywords.some((kw) => text.includes(kw));
}

function calculateScore(item) {
  if (hasPenaltyKeywords(item.title + " " + item.summary)) return -1;
  let score = 35; // 基础分
  score += SCORE_RULES.sourceBonus(item.source);
  score += SCORE_RULES.titleBonus(item.title);
  score += SCORE_RULES.summaryBonus(item.summary);
  score += SCORE_RULES.timeBonus(item.publishedAt);
  return Math.min(100, score);
}

// ========== 分类（比旧版更精准） ==========
function classifyText(title, summary) {
  const t = (title + " " + summary).toLowerCase();
  if (/职业健康|职业病|尘肺|体检|健康|高血压|心脑血管|饮食|戒烟/.test(t)) return "职业健康";
  if (/班组|班组长|培训|技能|竞赛|师徒/.test(t)) return "班组建设";
  if (/工会|安康杯|职工|劳动保护|劳保/.test(t)) return "工会劳动保护";
  if (/智能化|智慧矿山|5g|vr|数字化|自动化/.test(t)) return "智慧矿山";
  if (/防汛|雨季|防暑|高温|冬季|防冻|季节性/.test(t)) return "季节性安全";
  if (/事故|隐患|排查|整治|专项|检查|通报/.test(t)) return "隐患排查";
  if (/标准化|达标|评级|验收/.test(t)) return "标准化建设";
  if (/救援|应急|预案|演练|抢险/.test(t)) return "应急救援";
  if (/瓦斯|水害|冲击地压|顶板|透水|粉尘|火灾/.test(t)) return "灾害防治";
  if (/法规|法律|条例|意见|规划|政策|通知/.test(t)) return "政策法规";
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

// ========== 工具函数 ==========
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const todayISO = new Date().toISOString().slice(0, 10);

// ========== Google News RSS 抓取 ==========
async function fetchGoogleNewsRSS(keyword) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=zh-CN&gl=CN&ceid=CN:zh`;
  console.log(`[Google News] 搜索: ${keyword}`);

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      console.warn(`[Google News] ${keyword}: HTTP ${resp.status}`);
      return [];
    }

    const xml = await resp.text();
    const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
    const result = parser.parse(xml);

    const items = (result?.rss?.channel?.item) || [];
    const itemList = Array.isArray(items) ? items : [items];

    return itemList
      .map((item) => {
        const title = (item.title || "").replace(/<[^>]+>/g, "").trim();
        const description = (item.description || "").replace(/<[^>]+>/g, "").trim();
        const link = item.link || "";
        const pubDate = item.pubDate ? new Date(item.pubDate).toISOString().slice(0, 10) : todayISO;
        const sourceName = item.source?.["#text"] || item.source || "Google News";

        // Google News RSS 的 link 需要从 URL 参数中提取实际目标 URL
        let realLink = link;
        if (link.includes("news.google.com/rss/articles/")) {
          realLink = link; // 保留原始链接，Google 会重定向
        }

        if (!title || title.length < 5) return null;

        return {
          title,
          source: sourceName,
          link: realLink,
          summary: description || title,
          publishedAt: pubDate,
          origin: "google_news",
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.warn(`[Google News] ${keyword}: ${err.message}`);
    return [];
  }
}

// ========== Bing 搜索官方源 ==========
async function searchOfficialSource(source) {
  const query = `site:${source.site} ${source.keywords}`;
  const url = `https://cn.bing.com/search?q=${encodeURIComponent(query)}&setmkt=zh-CN&cc=CN&count=5`;

  console.log(`[Bing] ${source.name}: ${url}`);

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      console.warn(`[Bing] ${source.name}: HTTP ${resp.status}`);
      return [];
    }

    const html = await resp.text();
    const $ = cheerio.load(html);
    const results = [];

    $("li.b_algo").each((_, el) => {
      if (results.length >= 3) return false;
      const $a = $(el).find("h2 a").first();
      const title = $a.text().replace(/\s+/g, " ").trim();
      const link = $a.attr("href");
      const summary = $(el).find(".b_caption p, .b_lineclamp2, .b_lineclamp4").first().text().replace(/\s+/g, " ").trim() || title;

      if (!title || !link || !link.startsWith("http")) return;

      results.push({
        title,
        source: source.name,
        link,
        summary: summary || title,
        publishedAt: todayISO,
        origin: "official",
      });
    });

    console.log(`[Bing] ${source.name}: ${results.length} 条`);
    return results;
  } catch (err) {
    console.warn(`[Bing] ${source.name}: ${err.message}`);
    return [];
  }
}

// ========== 正文抓取 ==========
async function fetchArticle(item) {
  console.log(`[抓取] ${(item.title || "").substring(0, 30)}...`);
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
    console.log(`[抓取完成] ${(item.title || "").substring(0, 30)}... (${item.content.length} 字)`);
  } catch (err) {
    console.warn(`[抓取失败] ${(item.title || "").substring(0, 30)}...: ${err.message}`);
    item.content = item.summary || "";
  }
}

// ========== 打分 + 分类 + 打标（综合处理） ==========
function enrichItem(item) {
  const catText = item.title + " " + (item.summary || "") + " " + (item.content || "");
  item.category = classifyText(item.title, item.summary);
  item.tags = extractTags(item.title, item.summary);
  item.score = calculateScore(item);
  item.review = false;
  item.id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  // 保留 500 字正文摘要
  item.content = (item.content || item.summary || "").substring(0, MAX_STORED_CHARS);
  return item;
}

// ========== Gist 操作 ==========
async function fetchExistingGist() {
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
      "User-Agent": "safety-news-scraper/2.0",
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

// ========== Fallback 加载 ==========
function loadFallbackMaterials() {
  const fallbackPath = resolve(__dirname, "..", "data", "fallback_materials.json");
  if (!existsSync(fallbackPath)) {
    console.warn("[Fallback] 文件不存在，跳过");
    return [];
  }
  try {
    const raw = readFileSync(fallbackPath, "utf-8");
    const data = JSON.parse(raw);
    console.log(`[Fallback] 加载 ${(data.items || []).length} 条精选素材`);
    return data.items || [];
  } catch (err) {
    console.warn(`[Fallback] 读取失败: ${err.message}`);
    return [];
  }
}

// ========== 主流程 ==========
async function main() {
  const token = process.env.GIST_TOKEN;
  if (!token) {
    console.error("缺少 GIST_TOKEN 环境变量。请在仓库 Settings → Secrets → Actions 添加。");
    process.exit(1);
  }

  console.log(`=== 安全新闻采集管道 v2 (${new Date().toISOString()}) ===`);

  // 1. 拉取已有数据
  const existing = await fetchExistingGist();
  console.log(`[现有] ${existing.length} 条`);

  // 2. Google News RSS 并行抓取
  console.log("\n--- 第一层：Google News RSS ---");
  const gnResults = [];
  for (const kw of GOOGLE_NEWS_KEYWORDS) {
    try {
      const items = await fetchGoogleNewsRSS(kw);
      gnResults.push(...items);
    } catch (err) {
      console.warn(`[Google News异常] ${kw}: ${err.message}`);
    }
    await sleep(1500); // 间隔防限流
  }
  console.log(`[Google News 总计] ${gnResults.length} 条 (去重前)`);

  // 3. 官方站点搜索
  console.log("\n--- 第二层：官方站点 ---");
  const officialResults = [];
  for (const src of OFFICIAL_SOURCES) {
    try {
      const items = await searchOfficialSource(src);
      officialResults.push(...items);
    } catch (err) {
      console.warn(`[官方站异常] ${src.name}: ${err.message}`);
    }
    await sleep(2000);
  }
  console.log(`[官方站总计] ${officialResults.length} 条`);

  // 4. 链接去重（相同链接只保留一个，优先级：official > google_news）
  const allRaw = [...officialResults, ...gnResults];
  const seenLinks = new Set();
  const uniqueResults = [];
  for (const item of allRaw) {
    if (seenLinks.has(item.link)) continue;
    seenLinks.add(item.link);
    uniqueResults.push(item);
  }
  console.log(`[去重后] ${uniqueResults.length} 条`);

  // 5. 正文抓取（串行）
  console.log("\n--- 正文抓取 ---");
  for (const item of uniqueResults) {
    try {
      await fetchArticle(item);
    } catch (err) {
      console.warn(`[正文异常] ${item.title}: ${err.message}`);
    }
    await sleep(1000);
  }

  // 6. 打分 + 分类 + 过滤
  const enriched = uniqueResults.map(enrichItem).filter((item) => item.score >= 40);
  enriched.sort((a, b) => (b.score || 0) - (a.score || 0));
  console.log(`[打分过滤后] ${enriched.length} 条 (≥40分)`);

  // 分数分布
  const dist = {};
  enriched.forEach((i) => {
    const band = i.score >= 80 ? "80+优先" : i.score >= 60 ? "60-79正常" : "40-59备用";
    dist[band] = (dist[band] || 0) + 1;
  });
  console.log(`分数分布: ${JSON.stringify(dist)}`);

  // 7. 检查当日新增是否足够，不够从 fallback 补充
  let todayNewCount = enriched.filter((i) => i.publishedAt === todayISO).length;
  if (todayNewCount < MIN_DAILY_TARGET) {
    console.log(`\n[当日新增] ${todayNewCount} 条，不足 ${MIN_DAILY_TARGET}，从 Fallback 补充...`);
    const fallbacks = loadFallbackMaterials();
    const existingNormTitles = new Set(
      [...existing, ...enriched].map((e) =>
        (e.title || "").replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "").toLowerCase().substring(0, 20)
      )
    );
    const freshFallbacks = fallbacks.filter((fb) => {
      const norm = (fb.title || "").replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "").toLowerCase().substring(0, 20);
      return !existingNormTitles.has(norm);
    });
    const need = MIN_DAILY_TARGET - todayNewCount;
    const toAdd = freshFallbacks.slice(0, need);
    toAdd.forEach((fb) => {
      fb.publishedAt = todayISO;
      fb.origin = fb.origin || "manual";
      fb.score = fb.score || 50;
      fb.category = fb.category || "综合安全";
      fb.tags = fb.tags || [];
      fb.review = false;
    });
    enriched.push(...toAdd);
    console.log(`[Fallback] 补充 ${toAdd.length} 条`);
  }

  // 8. 与已有数据合并去重
  const normalizeTitle = (t) => (t || "").replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "").toLowerCase().substring(0, 20);
  const existingTitles = new Set(existing.map((e) => normalizeTitle(e.title)));
  const freshItems = enriched.filter((item) => !existingTitles.has(normalizeTitle(item.title)));

  console.log(`\n[合并] 新增 ${freshItems.length} 条，已有 ${existing.length} 条`);

  // 9. 合并 + 按发布时间降序
  const merged = [...freshItems, ...existing];
  merged.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  const final = merged.slice(0, MAX_TOTAL_STORED);

  // 10. 推送 Gist
  await updateGist(token, final);

  // 11. 输出摘要
  console.log(`\n=== 执行摘要 ===`);
  console.log(`总素材: ${final.length} 条`);
  console.log(`本次新增: ${freshItems.length} 条`);
  console.log(`来源分布: Google News ${gnResults.length} | 官方 ${officialResults.length} | Fallback ${todayNewCount < MIN_DAILY_TARGET ? "已补充" : "未触发"}`);
  const catCounts = {};
  final.forEach((i) => { catCounts[i.category] = (catCounts[i.category] || 0) + 1; });
  console.log(`分类分布: ${JSON.stringify(catCounts)}`);
  console.log(`完成时间: ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("管道崩溃:", err);
  process.exit(1);
});