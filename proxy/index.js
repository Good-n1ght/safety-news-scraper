const express = require("express");
const app = express();

// 环境变量：Gist Token
const GIST_TOKEN = process.env.GIST_TOKEN || "";

// 全局 CORS
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

// JSON body 解析，限制 2MB
app.use(express.json({ limit: "2mb" }));

// ========== 路由 1：CORS 转发（原有功能）==========
app.get("/", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url param");

  fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept-Language": "zh-CN,zh;q=0.9"
    }
  })
    .then(response => {
      const contentType = response.headers.get("content-type") || "text/html";
      return response.text().then(body => ({ body, contentType }));
    })
    .then(({ body, contentType }) => {
      res.type(contentType);
      res.send(body);
    })
    .catch(e => res.status(502).send("Proxy error: " + e.message));
});

// ========== 路由 2：保存历史文章到 Gist ==========
// 提取为独立 handler，同时注册到 /save-draft 和 POST / 两条路径
// 原因：SCF API 网关可能将 /save-draft 路径映射到 /，导致 Express 路由无法匹配
function handleSaveDraft(req, res) {
  if (!GIST_TOKEN) {
    return res.status(500).json({ ok: false, error: "服务器未配置 GIST_TOKEN" });
  }

  const { gist_id, article } = req.body;

  if (!gist_id || !article) {
    return res.status(400).json({ ok: false, error: "Missing gist_id or article" });
  }

  const apiUrl = `https://api.github.com/gists/${gist_id}`;

  // 先取现有 drafts.json
  fetch(apiUrl, {
    headers: {
      "Authorization": `Bearer ${GIST_TOKEN}`,
      "Accept": "application/vnd.github.v3+json"
    }
  })
  .then(r => {
    if (!r.ok) throw new Error(`Gist read failed: ${r.status}`);
    return r.json();
  })
  .then(gist => {
    // 读取或初始化 drafts.json
    const files = gist.files || {};
    const existing = files["drafts.json"];
    let data = { version: 1, articles: [], updatedAt: "" };

    if (existing && existing.content) {
      try { data = JSON.parse(existing.content); } catch(e) { /* 保留默认 */ }
    }

    // 追加新文章
    data.articles.push(article);
    data.updatedAt = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

    // 写回 Gist
    return fetch(apiUrl, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${GIST_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        files: {
          "drafts.json": { content: JSON.stringify(data, null, 2) }
        }
      })
    });
  })
  .then(r => {
    if (!r.ok) throw new Error(`Gist write failed: ${r.status}`);
    return r.json();
  })
  .then(() => {
    res.json({ ok: true, savedAt: new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }) });
  })
  .catch(e => {
    res.status(500).json({ ok: false, error: e.message });
  });
}

// 注册 save-draft 路由（两条路径双保险）
app.post("/save-draft", handleSaveDraft);
app.post("/", handleSaveDraft);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("CORS proxy + save-draft on port " + PORT));