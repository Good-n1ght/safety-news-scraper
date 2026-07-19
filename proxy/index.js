const express = require("express");
const app = express();

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

// ========== 路由：CORS 转发 ==========
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("CORS proxy on port " + PORT));
