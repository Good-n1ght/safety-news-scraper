/**
 * scrape-safety-news.js 鈥?瀹夊叏鍥湴绱犳潗鑷姩閲囬泦绠￠亾 v2
 * 
 * 涓夊眰鏁版嵁婧?
 *  1. Google News RSS锛堝鍏抽敭璇嶅苟琛岋紝蹇€熷彂鐜板綋澶╂柊闂伙級
 *  2. 瀹樻柟绔欑偣 Bing site: 鎼滅储锛坈heerio 瑙ｆ瀽锛屾潈濞佸厹搴曪級
 *  3. fallback_materials.json锛堟湰鍦扮簿閫夌礌鏉愶紝闃茬┖娲烇級
 * 
 * 娴佺▼:
 *  1. 浠?Gist 鎷夊彇宸叉湁绱犳潗
 *  2. Google News RSS 鎶撳彇锛圙itHub Actions 娴峰鐜鍙洿杩烇級
 *  3. Bing site: 鎼滅储瀹樻柟婧?
 *  4. 姝ｆ枃鎶撳彇 + 鎵撳垎 + 鍒嗙被 + 杩囨护
 *  5. 鍚堝苟鍘婚噸 鈫?鎴柇鑷?100 鏉?鈫?鎺ㄥ洖 Gist
 *  6. 鑻ュ綋鏃ユ柊澧炰笉瓒?10 鏉★紝浠?fallback 琛ュ厖
 * 
 * GitHub Actions 姣忓ぉ 07:30 / 15:30锛堝寳浜椂闂达級瑙﹀彂銆?
 * 闇€瑕佷粨搴?Secrets: GIST_TOKEN
 */

import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ========== 閰嶇疆 ==========
const GIST_ID = "360b3e9ec81bfee6765883cbb0da7aec";
const GIST_FILENAME = "safety_news.json";
const GIST_RAW_URL = `https://gist.githubusercontent.com/Good-n1ght/${GIST_ID}/raw/${GIST_FILENAME}`;
const GIST_API_URL = `https://api.github.com/gists/${GIST_ID}`;

const MAX_TOTAL_STORED = 100;
const FETCH_TIMEOUT_MS = 12000;
const MAX_CONTENT_CHARS = 6000;
const MAX_STORED_CHARS = 500;
const MIN_DAILY_TARGET = 10; // 姣忔棩鏈€灏戠礌鏉愭暟锛屼笉瓒虫椂浠?fallback 琛ュ厖

// ========== 绗竴灞傦細Google News RSS 鍏抽敭璇?==========
const GOOGLE_NEWS_KEYWORDS = [
  "鐓ょ熆瀹夊叏",
  "鐭垮北瀹夊叏",
  "瀹夊叏鐢熶骇",
  "鑱屼笟鍋ュ悍",
  "闅愭偅鎺掓煡",
  "鐝粍寤鸿",
  "鍔冲姩淇濇姢",
  "鏅烘収鐭垮北",
  "搴旀€ユ晳鎻?,
  "鐏惧闃叉不",
];

// ========== 绗簩灞傦細瀹樻柟绔欑偣锛圔ing site: 鎼滅储锛?==========
const OFFICIAL_SOURCES = [
  { name: "鍥藉鐭垮北瀹夊叏鐩戝療灞€",     site: "chinamine-safety.gov.cn",     keywords: "瀹夊叏 鐭垮北 浜嬫晠 搴旀€? },
  { name: "鍥藉鐭垮北瀹夌洃灞€娌冲寳灞€",   site: "hb.chinamine-safety.gov.cn",  keywords: "瀹夊叏 鐭垮北 鐓ょ熆" },
  { name: "搴旀€ョ鐞嗛儴",             site: "mem.gov.cn",                   keywords: "瀹夊叏 浜嬫晠 搴旀€?娑堥槻" },
  { name: "涓浗瀹夊叏鐢熶骇缃?,         site: "aqsc.cn",                      keywords: "鐓ょ熆 瀹夊叏 浜嬫晠 鐝粍" },
];

// ========== 璇勫垎瑙勫垯锛圕odex 鏂规锛?==========
const SCORE_RULES = {
  // 鏉ユ簮鍔犲垎
  sourceBonus: (source) => {
    const s = source || "";
    if (/鐭垮北瀹夌洃灞€|搴旀€ョ鐞嗛儴|涓浗瀹夊叏鐢熶骇缃?.test(s)) return 30;
    if (/鐓ょ偔鎶鐓ょ熆瀹夊叏缃憒瀹夊叏鏂囧寲缃憒鐓ょ偔宸ヤ笟缃?.test(s)) return 20;
    // 涓绘祦鏂伴椈婧愶紙Google News 鑱氬悎甯稿嚭鐜帮級锛岀粰鍩虹鍒嗛紦鍔?
    if (/鏂板崕|浜烘皯缃憒澶|涓柊缃憒涓浗鏃ユ姤|鍏夋槑/.test(s)) return 15;
    if (/鏂版氮|鎼滅嫄|缃戞槗|鑵捐|婢庢箖|鐣岄潰|鏂颁含鎶鐜悆/.test(s)) return 10;
    return 0;
  },

  // 鏍囬鍏抽敭璇嶅姞鍒?
  titleBonus: (title) => {
    const t = title || "";
    let score = 0;
    if (/鐓ょ熆|鐭垮北|鐡︽柉|閫忔按|椤舵澘|绮夊皹|闅愭偅|鐝粍|鍔冲姩淇濇姢/.test(t)) score += 25;
    if (/娌冲寳|鍞愬北|寮€婊鐓や笟闆嗗洟/.test(t)) score += 20;
    return score;
  },

  // 鎽樿/姝ｆ枃鍔犲垎
  summaryBonus: (summary) => {
    const s = summary || "";
    let score = 0;
    if (/瀹夊叏鐢熶骇/.test(s) && /鐓ょ熆|鐭垮北|鐡︽柉|閫忔按|闅愭偅|鐝粍/.test(s)) score += 20;
    if (/娌冲寳|鍞愬北|寮€婊鐓や笟闆嗗洟/.test(s)) score += 10;
    return score;
  },

  // 鏃堕棿鍔犲垎
  timeBonus: (publishedAt) => {
    if (!publishedAt) return 0;
    const days = (Date.now() - new Date(publishedAt).getTime()) / 86400000;
    return days <= 7 ? 10 : 0;
  },

  // 闄嶆潈/鍓旈櫎鍏抽敭璇嶏紙纭繃婊わ級
  penaltyKeywords: [
    // 鏃朵簨/鏀挎不/绾康绫烩€斺€斾笉鏄畨鍏ㄥ疄鎴樼礌鏉?
    "澶у湴闇?, "閬囬毦", "鍏キ", "绾康棣?, "鏃х収", "鑰佺収鐗?, "鍥為【灞?,
    "涓や細", "鍏氫唬浼?, "鍏ㄤ細绮剧", "鏀垮崗", "浜哄ぇ",
    // 璐㈢粡/鑲″競绫烩€斺€旂叅鐭垮畨鍏ㄦ澘鍧楄穼1.7%杩欑鏃犵敤
    "鏉垮潡璺?, "鏉垮潡娑?, "涓诲姏璧勯噾", "鍑€娴佸嚭", "鍑€娴佸叆", "A鑲?, "鍩洪噾",
    // 鏄庢樉鏃犲叧棰嗗煙
    "鍥介檯瀹夊叏", "缃戠粶瀹夊叏", "閲戣瀺瀹夊叏", "绮瀹夊叏", "閾佽矾鎶曡祫",
    "鍐涗簨鍐茬獊", "绀句細娌诲畨", "鏅€氫氦閫氫簨鏁?, "濞变箰鏂伴椈", "璐㈢粡",
    // 鐢熸椿娑堣垂绫?
    "澶栧崠", "蹇€?, "瀹犵墿", "鏃呮父", "鏄庢槦", "缁艰壓", "娓告垙",
    // 绾补鐨勬斂娌诲浼犵锛屼笉娑夊強鍏蜂綋瀹夊叏鎺柦
    "閲囬娲诲姩", "閲囬璋冪爺", "鏂囪壓姹囨紨", "涔︾敾灞?, "鎽勫奖灞?,
  ],
};

function hasPenaltyKeywords(text) {
  return SCORE_RULES.penaltyKeywords.some((kw) => text.includes(kw));
}

function calculateScore(item) {
  if (hasPenaltyKeywords(item.title + " " + item.summary)) return -1;
  let score = 35; // 鍩虹鍒?
  score += SCORE_RULES.sourceBonus(item.source);
  score += SCORE_RULES.titleBonus(item.title);
  score += SCORE_RULES.summaryBonus(item.summary);
  score += SCORE_RULES.timeBonus(item.publishedAt);
  return Math.min(100, score);
}

// ========== 鍒嗙被锛堟瘮鏃х増鏇寸簿鍑嗭級 ==========
function classifyText(title, summary) {
  const t = (title + " " + summary).toLowerCase();
  if (/鑱屼笟鍋ュ悍|鑱屼笟鐥厊灏樿偤|浣撴|鍋ュ悍|楂樿鍘媩蹇冭剳琛€绠楗|鎴掔儫/.test(t)) return "鑱屼笟鍋ュ悍";
  if (/鐝粍|鐝粍闀縷鍩硅|鎶€鑳絴绔炶禌|甯堝緬/.test(t)) return "鐝粍寤鸿";
  if (/宸ヤ細|瀹夊悍鏉瘄鑱屽伐|鍔冲姩淇濇姢|鍔充繚/.test(t)) return "宸ヤ細鍔冲姩淇濇姢";
  if (/鏅鸿兘鍖東鏅烘収鐭垮北|5g|vr|鏁板瓧鍖東鑷姩鍖?.test(t)) return "鏅烘収鐭垮北";
  if (/闃叉睕|闆ㄥ|闃叉殤|楂樻俯|鍐|闃插喕|瀛ｈ妭鎬?.test(t)) return "瀛ｈ妭鎬у畨鍏?;
  if (/浜嬫晠|闅愭偅|鎺掓煡|鏁存不|涓撻」|妫€鏌閫氭姤/.test(t)) return "闅愭偅鎺掓煡";
  if (/鏍囧噯鍖東杈炬爣|璇勭骇|楠屾敹/.test(t)) return "鏍囧噯鍖栧缓璁?;
  if (/鏁戞彺|搴旀€棰勬|婕旂粌|鎶㈤櫓/.test(t)) return "搴旀€ユ晳鎻?;
  if (/鐡︽柉|姘村|鍐插嚮鍦板帇|椤舵澘|閫忔按|绮夊皹|鐏伨/.test(t)) return "鐏惧闃叉不";
  if (/娉曡|娉曞緥|鏉′緥|鎰忚|瑙勫垝|鏀跨瓥|閫氱煡/.test(t)) return "鏀跨瓥娉曡";
  return "缁煎悎瀹夊叏";
}

function extractTags(title, summary) {
  const text = title + " " + summary;
  const tags = [];
  if (/鐭垮北|鐓ょ熆/.test(text)) tags.push("鐭垮北瀹夊叏");
  if (/瀹夊叏/.test(text)) tags.push("瀹夊叏鐢熶骇");
  if (/鍞愬北|娌冲寳|寮€婊?.test(text)) tags.push("娌冲寳/鍞愬北");
  if (/鐝粍|鐝粍闀?.test(text)) tags.push("鐝粍");
  if (/鑱屼笟鍋ュ悍|鑱屼笟鐥?.test(text)) tags.push("鑱屼笟鍋ュ悍");
  if (/宸ヤ細|瀹夊悍鏉?.test(text)) tags.push("宸ヤ細");
  return tags.slice(0, 3);
}

// ========== 宸ュ叿鍑芥暟 ==========
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const todayISO = new Date().toISOString().slice(0, 10);

// ========== Google News RSS 鎶撳彇 ==========
async function fetchGoogleNewsRSS(keyword) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=zh-CN&gl=CN&ceid=CN:zh`;
  console.log(`[Google News] 鎼滅储: ${keyword}`);

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

        // Google News RSS 鐨?link 闇€瑕佷粠 URL 鍙傛暟涓彁鍙栧疄闄呯洰鏍?URL
        let realLink = link;
        if (link.includes("news.google.com/rss/articles/")) {
          realLink = link; // 淇濈暀鍘熷閾炬帴锛孏oogle 浼氶噸瀹氬悜
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

// ========== Bing 鎼滅储瀹樻柟婧?==========
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

    console.log(`[Bing] ${source.name}: ${results.length} 鏉);
    return results;
  } catch (err) {
    console.warn(`[Bing] ${source.name}: ${err.message}`);
    return [];
  }
}

// ========== 姝ｆ枃鎶撳彇 ==========
async function fetchArticle(item) {
  console.log(`[鎶撳彇] ${(item.title || "").substring(0, 30)}...`);
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
    console.log(`[鎶撳彇瀹屾垚] ${(item.title || "").substring(0, 30)}... (${item.content.length} 瀛?`);
  } catch (err) {
    console.warn(`[鎶撳彇澶辫触] ${(item.title || "").substring(0, 30)}...: ${err.message}`);
    item.content = item.summary || "";
  }
}

// ========== 鎵撳垎 + 鍒嗙被 + 鎵撴爣锛堢患鍚堝鐞嗭級 ==========
function enrichItem(item) {
  const catText = item.title + " " + (item.summary || "") + " " + (item.content || "");
  item.category = classifyText(item.title, item.summary);
  item.tags = extractTags(item.title, item.summary);
  item.score = calculateScore(item);
  item.review = false;
  item.id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  // 淇濈暀 500 瀛楁鏂囨憳瑕?
  item.content = (item.content || item.summary || "").substring(0, MAX_STORED_CHARS);
  return item;
}

// ========== Gist 鎿嶄綔 ==========
async function fetchExistingGist() {
  console.log("[Gist] 鎷夊彇宸叉湁鏁版嵁...");
  try {
    const resp = await fetch(`${GIST_RAW_URL}?_t=${Date.now()}`);
    if (!resp.ok) {
      console.warn(`[Gist] 鎷夊彇澶辫触 HTTP ${resp.status}锛岃涓虹┖鏁版嵁`);
      return [];
    }
    const data = await resp.json();
    return data.items || [];
  } catch (err) {
    console.warn(`[Gist] 鎷夊彇寮傚父: ${err.message}锛岃涓虹┖鏁版嵁`);
    return [];
  }
}

async function updateGist(token, items) {
  console.log(`[Gist] 鎺ㄩ€?${items.length} 鏉″埌 Gist...`);
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
    throw new Error(`Gist 鏇存柊澶辫触: HTTP ${resp.status} 鈥?${errBody}`);
  }

  const result = await resp.json();
  console.log(`[Gist] 鎺ㄩ€佹垚鍔?鈫?${result.html_url}`);
}

// ========== Fallback 鍔犺浇 ==========
function loadFallbackMaterials() {
  const fallbackPath = resolve(__dirname, "..", "data", "fallback_materials.json");
  if (!existsSync(fallbackPath)) {
    console.warn("[Fallback] 鏂囦欢涓嶅瓨鍦紝璺宠繃");
    return [];
  }
  try {
    const raw = readFileSync(fallbackPath, "utf-8");
    const data = JSON.parse(raw);
    console.log(`[Fallback] 鍔犺浇 ${(data.items || []).length} 鏉＄簿閫夌礌鏉恅);
    return data.items || [];
  } catch (err) {
    console.warn(`[Fallback] 璇诲彇澶辫触: ${err.message}`);
    return [];
  }
}

// ========== 涓绘祦绋?==========
async function main() {
  const token = process.env.GIST_TOKEN;
  if (!token) {
    console.error("缂哄皯 GIST_TOKEN 鐜鍙橀噺銆傝鍦ㄤ粨搴?Settings 鈫?Secrets 鈫?Actions 娣诲姞銆?);
    process.exit(1);
  }

  console.log(`=== 瀹夊叏鏂伴椈閲囬泦绠￠亾 v2 (${new Date().toISOString()}) ===`);

  // 1. 鎷夊彇宸叉湁鏁版嵁
  const existing = await fetchExistingGist();
  console.log(`[鐜版湁] ${existing.length} 鏉);

  // 2. Google News RSS 骞惰鎶撳彇
  console.log("\n--- 绗竴灞傦細Google News RSS ---");
  const gnResults = [];
  for (const kw of GOOGLE_NEWS_KEYWORDS) {
    try {
      const items = await fetchGoogleNewsRSS(kw);
      gnResults.push(...items);
    } catch (err) {
      console.warn(`[Google News寮傚父] ${kw}: ${err.message}`);
    }
    await sleep(1500); // 闂撮殧闃查檺娴?
  }
  console.log(`[Google News 鎬昏] ${gnResults.length} 鏉?(鍘婚噸鍓?`);

  // 3. 瀹樻柟绔欑偣鎼滅储
  console.log("\n--- 绗簩灞傦細瀹樻柟绔欑偣 ---");
  const officialResults = [];
  for (const src of OFFICIAL_SOURCES) {
    try {
      const items = await searchOfficialSource(src);
      officialResults.push(...items);
    } catch (err) {
      console.warn(`[瀹樻柟绔欏紓甯竇 ${src.name}: ${err.message}`);
    }
    await sleep(2000);
  }
  console.log(`[瀹樻柟绔欐€昏] ${officialResults.length} 鏉);

  // 4. 閾炬帴鍘婚噸锛堢浉鍚岄摼鎺ュ彧淇濈暀涓€涓紝浼樺厛绾э細official > google_news锛?
  const allRaw = [...officialResults, ...gnResults];
  const seenLinks = new Set();
  const uniqueResults = [];
  for (const item of allRaw) {
    if (seenLinks.has(item.link)) continue;
    seenLinks.add(item.link);
    uniqueResults.push(item);
  }
  console.log(`[鍘婚噸鍚嶿 ${uniqueResults.length} 鏉);

  // 5. 姝ｆ枃鎶撳彇锛堜覆琛岋級
  console.log("\n--- 姝ｆ枃鎶撳彇 ---");
  for (const item of uniqueResults) {
    try {
      await fetchArticle(item);
    } catch (err) {
      console.warn(`[姝ｆ枃寮傚父] ${item.title}: ${err.message}`);
    }
    await sleep(1000);
  }

  // 6. 鎵撳垎 + 鍒嗙被 + 杩囨护
  const enriched = uniqueResults.map(enrichItem).filter((item) => item.score >= 40);
  enriched.sort((a, b) => (b.score || 0) - (a.score || 0));
  console.log(`[鎵撳垎杩囨护鍚嶿 ${enriched.length} 鏉?(鈮?0鍒?`);

  // 鍒嗘暟鍒嗗竷
  const dist = {};
  enriched.forEach((i) => {
    const band = i.score >= 80 ? "80+浼樺厛" : i.score >= 60 ? "60-79姝ｅ父" : "40-59澶囩敤";
    dist[band] = (dist[band] || 0) + 1;
  });
  console.log(`鍒嗘暟鍒嗗竷: ${JSON.stringify(dist)}`);

  // 7. 妫€鏌ュ綋鏃ユ柊澧炴槸鍚﹁冻澶燂紝涓嶅浠?fallback 琛ュ厖
  let todayNewCount = enriched.filter((i) => i.publishedAt === todayISO).length;
  if (todayNewCount < MIN_DAILY_TARGET) {
    console.log(`\n[褰撴棩鏂板] ${todayNewCount} 鏉★紝涓嶈冻 ${MIN_DAILY_TARGET}锛屼粠 Fallback 琛ュ厖...`);
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
      fb.category = fb.category || "缁煎悎瀹夊叏";
      fb.tags = fb.tags || [];
      fb.review = false;
    });
    enriched.push(...toAdd);
    console.log(`[Fallback] 琛ュ厖 ${toAdd.length} 鏉);
  }

  // 8. 涓庡凡鏈夋暟鎹悎骞跺幓閲?
  const normalizeTitle = (t) => (t || "").replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "").toLowerCase().substring(0, 20);
  const existingTitles = new Set(existing.map((e) => normalizeTitle(e.title)));
  const freshItems = enriched.filter((item) => !existingTitles.has(normalizeTitle(item.title)));

  console.log(`\n[鍚堝苟] 鏂板 ${freshItems.length} 鏉★紝宸叉湁 ${existing.length} 鏉);

  // 9. 鍚堝苟 + 鎸夊彂甯冩椂闂撮檷搴?
  const merged = [...freshItems, ...existing];
  merged.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  const final = merged.slice(0, MAX_TOTAL_STORED);

  // 10. 鎺ㄩ€?Gist
  await updateGist(token, final);

  // 11. 杈撳嚭鎽樿
  console.log(`\n=== 鎵ц鎽樿 ===`);
  console.log(`鎬荤礌鏉? ${final.length} 鏉);
  console.log(`鏈鏂板: ${freshItems.length} 鏉);
  console.log(`鏉ユ簮鍒嗗竷: Google News ${gnResults.length} | 瀹樻柟 ${officialResults.length} | Fallback ${todayNewCount < MIN_DAILY_TARGET ? "宸茶ˉ鍏? : "鏈Е鍙?}`);
  const catCounts = {};
  final.forEach((i) => { catCounts[i.category] = (catCounts[i.category] || 0) + 1; });
  console.log(`鍒嗙被鍒嗗竷: ${JSON.stringify(catCounts)}`);
  console.log(`瀹屾垚鏃堕棿: ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("绠￠亾宕╂簝:", err);
  process.exit(1);
});