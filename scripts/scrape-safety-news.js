/**
 * scrape-safety-news.js — 安全园地素材自动采集管道 v4（最新快照 + 长期展示库）
 * 
 * 三层数据源:
 *  1. Google News RSS（多关键词并行，快速发现当天新闻）
 *  2. 官方站点 Bing site: 搜索（cheerio 解析，权威兜底）
 *  3. fallback_materials.json（本地精选素材，防空洞）
 * 
 * v4 架构变更:
 *  Gist A（最新快照）: safety_news_latest.json，每次直接覆盖，最多 30 条
 *  Gist B（长期展示库）: safety_news_display.json，每轮合并去重，上限 100 条
 *  前端只读 Gist B，Gist A 仅供运维查看最新一轮抓取结果
 *  旧文件 safety_news.json 只在 B 为空的首次运行时读取一次作为初始化数据
 * 
 * 综合评分:
 *  compositeScore = qualityScore × timeDecay
 *  timeDecay = 1 / (1 + 0.03 × daysOld)
 * 
 * GitHub Actions 每天 07:00 / 13:00 / 19:00 / 01:00（北京时间）触发。
 * 需要仓库 Secrets: GIST_TOKEN
 */

import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ========== 双 Gist 配置 ==========
// Gist A（最新快照）
const GIST_A_ID = "360b3e9ec81bfee6765883cbb0da7aec";
const GIST_A_FILENAME = "safety_news_latest.json";
const GIST_A_RAW_URL = `https://gist.githubusercontent.com/Good-n1ght/${GIST_A_ID}/raw/${GIST_A_FILENAME}`;
const GIST_A_API_URL = `https://api.github.com/gists/${GIST_A_ID}`;

// Gist B（长期展示库）
const GIST_B_ID = "156bb6326a83056a148b8cbd175ff463";
const GIST_B_FILENAME = "safety_news_display.json";
const GIST_B_RAW_URL = `https://gist.githubusercontent.com/Good-n1ght/${GIST_B_ID}/raw/${GIST_B_FILENAME}`;
const GIST_B_API_URL = `https://api.github.com/gists/${GIST_B_ID}`;

// 旧文件（仅用于首次迁移）
const GIST_OLD_FILENAME = "safety_news.json";

const MAX_TOP_N = 30;           // Gist A 快照上限
const MAX_DISPLAY_STORED = 100; // Gist B 展示库上限
const FETCH_TIMEOUT_MS = 12000;
const MAX_CONTENT_CHARS = 6000;
const MAX_STORED_CHARS = 500;
const MIN_DAILY_TARGET = 5;
const MIN_SCORE = 55;

// ========== 第一层：Google News RSS 关键词 ==========
// v5.17: DuckDuckGo 免费搜索关键词（无 site: 限定，弥补官方站覆盖不足）
const DDG_KEYWORDS = [
  "煤矿 安全生产 班组",
  "矿山 隐患排查 应急",
  "职工 职业健康 尘肺",
  "防汛 高温 安全 提醒",
  "事故 警示 演练 安全"
];

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
  "职工健康",
  "心血管防治",
  "高血压健康",
  "职业病防治",
  "消防安全",
  "安全警示教育",
  "安全生产培训",
  "安全文化建设",
  "健康饮食科普",
  "运动健康",
];

// ========== 第二层：官方站点（Bing site: 搜索） ==========
const OFFICIAL_SOURCES = [
  { name: "国家矿山安全监察局",     site: "chinamine-safety.gov.cn",     keywords: "安全 矿山 事故 应急" },
  { name: "国家矿山安监局河北局",   site: "hb.chinamine-safety.gov.cn",  keywords: "安全 矿山 煤矿" },
  { name: "应急管理部",             site: "mem.gov.cn",                   keywords: "安全 事故 应急 消防" },
  { name: "中国安全生产网",         site: "aqsc.cn",                      keywords: "煤矿 安全 事故 班组" },
];

// ========== 评分规则 ==========
const SCORE_RULES = {
  sourceBonus: (source) => {
    const s = source || "";
    if (/矿山安监局|应急管理部|中国安全生产网/.test(s)) return 30;
    if (/煤炭报|煤矿安全网|安全文化网/.test(s)) return 15;
    return 0;
  },

  titleBonus: (title) => {
    const t = title || "";
    let score = 0;
    if (/煤矿|矿山|瓦斯|透水|顶板|粉尘|隐患|班组|劳动保护/.test(t)) score += 25;
    if (/河北|唐山|开滦|煤业集团/.test(t)) score += 20;
    return score;
  },

  summaryBonus: (summary) => {
    const s = summary || "";
    let score = 0;
    if (/安全生产/.test(s) && /煤矿|矿山|瓦斯|透水|隐患|班组/.test(s)) score += 20;
    if (/河北|唐山|开滦|煤业集团/.test(s)) score += 10;
    return score;
  },

  timeBonus: (publishedAt) => {
    if (!publishedAt) return 0;
    const days = (Date.now() - new Date(publishedAt).getTime()) / 86400000;
    return days <= 7 ? 10 : 0;
  },

  penaltyKeywords: [
    "国际安全", "网络安全", "金融安全", "粮食安全", "铁路投资",
    "军事冲突", "社会治安", "普通交通事故", "娱乐新闻", "财经股票",
    "外卖", "快递", "宠物", "旅游", "明星", "综艺", "游戏",
    "股市", "A股", "GDP", "钢琴", "楼市", "楼市调控", "相亲", "恋爱",
    "夏令营", "养老", "医保", "社保", "个税", "教育培训",
  ],
};

// ========== 安全白名单（标题+摘要须命中至少2个关键词） ==========
const SAFETY_WHITELIST = [
  "爆炸", "火灾", "坍塌", "透水", "瓦斯爆炸", "瓦斯突出", "冒顶", "滑坡", "塌方",
  "中毒", "窒息", "坠落", "触电", "起火", "燃爆",
  "安全生产", "隐患排查", "隐患治理", "专项整治", "标准化建设", "应急管理", "安全监管",
  "督查检查", "明查暗访", "警示教育", "培训演练", "约谈", "问责", "整改", "闭环",
  "矿山", "煤矿", "非煤矿山", "尾矿库", "井下", "采空区", "瓦斯抽采", "瓦斯治理",
  "化工", "危化品", "储罐", "加油站", "烟花爆竹", "建筑施工", "工地", "深基坑",
  "消防", "火灾救援", "防汛", "抗洪", "抢险", "搜救", "地震", "地质灾害",
  "气象灾害", "台风", "暴雨", "雷电", "应急救援", "应急预案", "应急演练",
  "安全生产法", "安全生产月",
  "职业健康", "健康体检", "心脑血管", "高血压", "职业病", "尘肺病",
  "安全文化", "班组", "健康饮食", "科普", "职工健康", "心理健康",
];

function isSafetyRelated(title, summary) {
  const text = title + " " + summary;
  const sorted = [...SAFETY_WHITELIST].sort((a, b) => b.length - a.length);
  let remaining = text;
  let count = 0;
  for (const kw of sorted) {
    const idx = remaining.indexOf(kw);
    if (idx !== -1) {
      count++;
      remaining = remaining.substring(0, idx) + " ".repeat(kw.length) + remaining.substring(idx + kw.length);
    }
  }
  return count >= 2;
}

function hasPenaltyKeywords(text) {
  return SCORE_RULES.penaltyKeywords.some((kw) => text.includes(kw));
}

function calculateScore(item) {
  if (!isSafetyRelated(item.title, item.summary)) return -1;
  if (hasPenaltyKeywords(item.title + " " + item.summary)) return -1;
  let score = 35;
  score += SCORE_RULES.sourceBonus(item.source);
  score += SCORE_RULES.titleBonus(item.title);
  score += SCORE_RULES.summaryBonus(item.summary);
  score += SCORE_RULES.timeBonus(item.publishedAt);
  return Math.min(100, score);
}

// 时间衰减因子
function calcTimeDecay(publishedAt) {
  if (!publishedAt) return 0.85;
  const days = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 86400000);
  return 1 / (1 + 0.03 * days);
}

// 综合评分 = 质量分 × 时间衰减
function calcCompositeScore(item) {
  const qualityScore = item.score || 0;
  const decay = calcTimeDecay(item.publishedAt);
  return qualityScore * decay;
}

// ========== 分类 ==========
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
const nowISO = new Date().toISOString();

// ========== 错误分类 ==========
class FetchError extends Error {
  constructor(message, type) {
    super(message);
    this.type = type; // "network" | "http_404" | "http_other" | "token_invalid"
  }
}

function classifyFetchError(err, statusCode) {
  if (statusCode === 404) return new FetchError("文件不存在 (404)", "http_404");
  if (statusCode === 401 || statusCode === 403) return new FetchError("Token 无效或权限不足", "token_invalid");
  if (statusCode === 429) return new FetchError("API 速率限制 (429)", "http_other");
  if (err.name === "AbortError" || err.name === "TimeoutError") return new FetchError("网络超时", "network");
  if (err.name === "TypeError" && err.message.includes("fetch")) return new FetchError("网络连接失败", "network");
  return new FetchError(err.message || "未知错误", "network");
}

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

        let realLink = link;
        if (link.includes("news.google.com/rss/articles/")) {
          /* v5.13：Google News 链接是编码重定向（CBMi base64），不解析会抓到 Google 中间页（正文仅几字）。
             解码出真实 URL 后直接抓源站，正文抓取成功率大幅提升 */
          realLink = decodeGoogleNewsUrl(link);
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
// ========== v5.17: DuckDuckGo 免费搜索层（无 Key 无额度，2026 开源社区主流免费方案） ==========
// 返回 { title, link, summary } 数组，失败返回 []（不中断管道）
async function searchDuckDuckGo(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  console.log(`[DDG] ${query}`);

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
      console.warn(`[DDG] HTTP ${resp.status}`);
      return [];
    }

    const html = await resp.text();
    const $ = cheerio.load(html);
    const results = [];

    $(".result").each((_, el) => {
      if (results.length >= 3) return false;
      const $a = $(el).find(".result__a").first();
      const title = $a.text().replace(/\s+/g, " ").trim();
      if (!title) return;
      let link = $a.attr("href") || "";
      /* DDG 跳转链接解码真实地址（uddg 参数） */
      const uddg = (link.match(/uddg=([^&]+)/) || [])[1];
      if (uddg) {
        try { link = decodeURIComponent(uddg); } catch (e) { /* 保持原链接 */ }
      }
      const summary = $(el).find(".result__snippet").first().text().replace(/\s+/g, " ").trim() || title;
      results.push({ title, link, summary });
    });

    console.log(`[DDG] ${query}: ${results.length} 条`);
    return results;
  } catch (err) {
    console.warn(`[DDG] ${query} 失败: ${err.message}`);
    return [];
  }
}

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

// v5.13: 解码 Google News RSS 的编码重定向链接（CBMi 前缀 URL-safe base64），
// 解码失败或非 Google 链接时原样返回
function decodeGoogleNewsUrl(link) {
  try {
    const m = link.match(/articles\/([A-Za-z0-9\-_]+)/);
    if (!m) return link;
    let b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const decoded = Buffer.from(b64, "base64").toString("latin1");
    const urlMatch = decoded.match(/https?:\/\/[^\s"<>]+/);
    return urlMatch ? urlMatch[0] : link;
  } catch (err) {
    return link;
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
    /* v5.13：失败重试一次（2 秒后），源站偶发超时/反爬时可救回部分正文 */
    console.warn(`[抓取失败] ${(item.title || "").substring(0, 30)}...: ${err.message}，2 秒后重试`);
    try {
      await new Promise((r) => setTimeout(r, 2000));
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
      console.log(`[抓取重试成功] ${(item.title || "").substring(0, 30)}... (${item.content.length} 字)`);
    } catch (err2) {
      console.warn(`[抓取重试也失败] ${(item.title || "").substring(0, 30)}...: ${err2.message}`);
      item.content = item.summary || "";
    }
  }
}

// ========== 打分 + 分类 + 打标 ==========
function enrichItem(item) {
  item.category = classifyText(item.title, item.summary);
  item.tags = extractTags(item.title, item.summary);
  item.score = calculateScore(item);
  item.review = false;
  item.id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  item.content = (item.content || item.summary || "").substring(0, MAX_STORED_CHARS);
  return item;
}

// ========== v4: 写入 Gist A（最新快照，直接覆盖） ==========
async function updateGistA(token, items) {
  console.log(`[Gist A] 写入最新快照 ${items.length} 条（覆盖写入）...`);
  const body = JSON.stringify({
    files: {
      [GIST_A_FILENAME]: {
        content: JSON.stringify({ items, updatedAt: new Date().toISOString() }, null, 2),
      },
    },
  });

  const resp = await fetch(GIST_A_API_URL, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "safety-news-scraper/4.0",
    },
    body,
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw classifyFetchError(new Error(errBody), resp.status);
  }

  const result = await resp.json();
  console.log(`[Gist A] 写入成功 → ${result.html_url}`);
}

// v5.11: raw URL 404 时用 Gist API 复读，确认文件是否真实不存在
// raw 404 可能是 CDN 抖动 / gist 转私有 / 网络中间态——若 API 读得到，说明 B 实际存在，
// 此时走初始化会用本轮 top-30 覆盖历史 100 条展示库（永久丢失），必须中止并告警
async function gistBExistsViaApi() {
  let token = "";
  try { token = process.env.GIST_TOKEN || ""; } catch (e) { token = ""; }
  if (!token) return false; // 无 Token 无法 API 复读，退回原逻辑
  try {
    const resp = await fetch(GIST_B_API_URL, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" }
    });
    if (resp.status === 200) {
      const gist = await resp.json();
      return !!(gist.files && gist.files[GIST_B_FILENAME]);
    }
    if (resp.status === 404) return false;
    // 限流/5xx：无法确认，保守按"存在"处理（宁可本轮中止，不可覆盖历史库）
    console.warn(`[Gist B] API 复读异常 HTTP ${resp.status}，保守按存在处理`);
    return true;
  } catch (err) {
    console.warn(`[Gist B] API 复读失败: ${err.message}，保守按存在处理`);
    return true;
  }
}

// ========== v4: 拉取 Gist B（长期展示库），含首次迁移逻辑 ==========
async function fetchExistingGistB() {
  console.log("[Gist B] 拉取已有展示库...");

  let statusCode = 0;
  try {
    const resp = await fetch(`${GIST_B_RAW_URL}?_t=${Date.now()}`);
    statusCode = resp.status;

    if (!resp.ok) {
      if (statusCode === 404) {
        // v5.11 保护：raw 404 ≠ 不存在，先 API 复读再决定是否允许初始化
        if (await gistBExistsViaApi()) {
          throw new Error("保护触发：Gist B 经 API 确认存在但 raw 读取 404（CDN 抖动/权限异常），已中止本轮写入，防止历史展示库被覆盖");
        }
        console.log("[Gist B] 文件确认不存在 (404)，尝试从旧文件初始化...");
        return await initFromOldGist();
      }
      throw classifyFetchError(new Error(`HTTP ${statusCode}`), statusCode);
    }

    const data = await resp.json();
    const items = data.items || [];

    if (items.length > 0) {
      console.log(`[Gist B] 已有 ${items.length} 条数据`);
      return items;
    }

    // items 为空数组 → 尝试旧文件迁移
    console.log("[Gist B] 展示库为空，尝试从旧文件初始化...");
    return await initFromOldGist();
  } catch (err) {
    // 网络错误 / Token 失败 / API 429 等 → 直接报错，不做迁移
    const fErr = classifyFetchError(err, statusCode);
    console.error(`[Gist B] 拉取失败: ${fErr.message} (类型: ${fErr.type})`);
    throw fErr;
  }
}

// ========== v4: 从旧 safety_news.json 初始化（仅首次迁移） ==========
async function initFromOldGist() {
  const oldRawUrl = `https://gist.githubusercontent.com/Good-n1ght/${GIST_A_ID}/raw/${GIST_OLD_FILENAME}`;
  console.log(`[旧文件迁移] 尝试读取 ${GIST_OLD_FILENAME}...`);

  let statusCode = 0;
  try {
    const resp = await fetch(`${oldRawUrl}?_t=${Date.now()}`);
    statusCode = resp.status;

    if (resp.status === 404) {
      console.warn(`[旧文件迁移] 旧文件不存在 (404)，从头开始`);
      return [];
    }
    if (!resp.ok) {
      throw classifyFetchError(new Error(`HTTP ${resp.status}`), resp.status);
    }

    const data = await resp.json();
    const items = data.items || [];
    console.log(`[旧文件迁移] 成功迁移 ${items.length} 条数据`);
    return items;
  } catch (err) {
    if (err instanceof FetchError && err.type === "http_404") {
      return [];
    }
    // 网络异常 / 429 / JSON 解析失败 → 必须 throw，不允许静默跳过迁移
    const fErr = err instanceof FetchError ? err : classifyFetchError(err, statusCode);
    console.error(`[旧文件迁移] 失败: ${fErr.message} (类型: ${fErr.type})，中止管道`);
    throw fErr;
  }
}

// ========== v4: 写入 Gist B（长期展示库） ==========
async function updateGistB(token, items) {
  console.log(`[Gist B] 推送 ${items.length} 条到展示库...`);
  const body = JSON.stringify({
    files: {
      [GIST_B_FILENAME]: {
        content: JSON.stringify({ items, updatedAt: new Date().toISOString() }, null, 2),
      },
    },
  });

  const resp = await fetch(GIST_B_API_URL, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "safety-news-scraper/4.0",
    },
    body,
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Gist B 更新失败: HTTP ${resp.status} — ${errBody}`);
  }

  const result = await resp.json();
  console.log(`[Gist B] 推送成功 → ${result.html_url}`);
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

// ========== 主流程 (v4) ==========
async function main() {
  const token = process.env.GIST_TOKEN;
  if (!token) {
    console.error("缺少 GIST_TOKEN 环境变量。请在仓库 Settings → Secrets → Actions 添加。");
    process.exit(1);
  }

  console.log(`=== 安全新闻采集管道 v4 (${new Date().toISOString()}) ===`);

  // 1. Google News RSS 并行抓取
  console.log("\n--- 第一层：Google News RSS ---");
  const gnResults = [];
  for (const kw of GOOGLE_NEWS_KEYWORDS) {
    try {
      const items = await fetchGoogleNewsRSS(kw);
      gnResults.push(...items);
    } catch (err) {
      console.warn(`[Google News异常] ${kw}: ${err.message}`);
    }
    await sleep(1500);
  }
  console.log(`[Google News 总计] ${gnResults.length} 条 (去重前)`);

  // 2. 官方站点搜索
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

  // 2.5 DuckDuckGo 免费搜索层（v5.17）
  console.log("\n--- 第三层：DuckDuckGo 免费搜索 ---");
  const ddgResults = [];
  for (const kw of DDG_KEYWORDS) {
    try {
      const items = await searchDuckDuckGo(kw);
      ddgResults.push(...items);
    } catch (err) {
      console.warn(`[DDG异常] ${kw}: ${err.message}`);
    }
    await sleep(2000);
  }
  console.log(`[DDG 总计] ${ddgResults.length} 条`);

  // 3. 链接去重
  const allRaw = [...officialResults, ...gnResults, ...ddgResults];
  const seenLinks = new Set();
  const uniqueResults = [];
  for (const item of allRaw) {
    if (seenLinks.has(item.link)) continue;
    seenLinks.add(item.link);
    uniqueResults.push(item);
  }
  console.log(`[去重后] ${uniqueResults.length} 条`);

  // 4. 正文抓取
  console.log("\n--- 正文抓取 ---");
  for (const item of uniqueResults) {
    try {
      await fetchArticle(item);
    } catch (err) {
      console.warn(`[正文异常] ${item.title}: ${err.message}`);
    }
    await sleep(1000);
  }

  // 5. 打分 + 分类 + 过滤
  const enriched = uniqueResults.map(enrichItem).filter((item) => item.score >= MIN_SCORE);
  enriched.sort((a, b) => (b.score || 0) - (a.score || 0));
  console.log(`[打分过滤后] ${enriched.length} 条 (≥${MIN_SCORE}分)`);

  // 分数分布
  const dist = {};
  enriched.forEach((i) => {
    const band = i.score >= 80 ? "80+优先" : `${MIN_SCORE}-79正常`;
    dist[band] = (dist[band] || 0) + 1;
  });
  console.log(`分数分布: ${JSON.stringify(dist)}`);

  // 6. Fallback 补充
  let todayNewCount = enriched.filter((i) => i.publishedAt === todayISO).length;
  if (todayNewCount < MIN_DAILY_TARGET) {
    console.log(`\n[当日新增] ${todayNewCount} 条，不足 ${MIN_DAILY_TARGET}，从 Fallback 补充...`);
    const fallbacks = loadFallbackMaterials();
    const existingNormTitles = new Set(
      enriched.map((e) =>
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

  // 7. 计算综合评分，取 Top-30 → 写入 Gist A（直接覆盖）
  const scored = enriched.map((item) => ({
    ...item,
    compositeScore: calcCompositeScore(item),
  }));
  scored.sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0));

  const topN = scored.slice(0, MAX_TOP_N);
  console.log(`\n[Gist A 快照] Top-${MAX_TOP_N} 条`);
  topN.forEach((item, i) => {
    console.log(`  ${i + 1}. [${item.compositeScore.toFixed(1)}] ${item.title}`);
  });

  console.log("\n--- 写入 Gist A（最新快照） ---");
  await updateGistA(token, topN);

  // 8. 拉取 Gist B（含首次迁移逻辑）
  console.log("\n--- 拉取 Gist B（长期展示库） ---");
  const existingB = await fetchExistingGistB();

  // 9. 合并：A 的 30 条 + B 的历史 → 按标题去重 → 新素材优先 → 截断 100 条
  const normalizeTitle = (t) => (t || "").replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "").toLowerCase().substring(0, 20);

  const seenBTitles = new Set();
  const dedupedB = [];

  // 先放新素材（A 的 Top-30）
  for (const item of topN) {
    const norm = normalizeTitle(item.title);
    if (seenBTitles.has(norm)) continue;
    seenBTitles.add(norm);
    dedupedB.push({ ...item, addedAt: nowISO });
  }

  // 再放历史素材（跳过重复标题，补打 addedAt）
  for (const item of existingB) {
    const norm = normalizeTitle(item.title);
    if (seenBTitles.has(norm)) continue;
    seenBTitles.add(norm);
    dedupedB.push({ ...item, addedAt: item.addedAt || nowISO });
  }

  const finalB = dedupedB.slice(0, MAX_DISPLAY_STORED);
  const newToB = Math.min(topN.length, finalB.filter((item, i) => i < topN.length).length);
  console.log(`[Gist B 合并] 本轮新素材 ${newToB} 条 + 历史保留 ${finalB.length - newToB} 条 = ${finalB.length} 条`);

  // 10. 写入 Gist B 前保护
  if (existingB.length > 0 && finalB.length === 0) {
    throw new Error("保护触发：B 原本有数据，本轮却准备写入 0 条，已中止");
  }
  if (topN.length === 0 && existingB.length === 0) {
    throw new Error("保护触发：本轮无新素材且 B 为空，禁止初始化空展示库");
  }

  await updateGistB(token, finalB);

  // 11. 输出摘要
  console.log(`\n=== 执行摘要 (v4) ===`);
  console.log(`Gist A（最新快照）: ${topN.length} 条`);
  console.log(`Gist B（长期展示库）: ${finalB.length} 条`);
  console.log(`本次新增素材: ${enriched.length} 条（过滤后）`);
  console.log(`来源分布: Google News ${gnResults.length} | 官方 ${officialResults.length} | Fallback ${todayNewCount < MIN_DAILY_TARGET ? "已补充" : "未触发"}`);
  const catCounts = {};
  topN.forEach((i) => { catCounts[i.category] = (catCounts[i.category] || 0) + 1; });
  console.log(`分类分布: ${JSON.stringify(catCounts)}`);
  console.log(`完成时间: ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("管道崩溃:", err);
  process.exit(1);
});
