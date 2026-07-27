/**
 * index.js — CORS 代理服务器（完整版）
 * 
 * 功能：
 *   1. 全局 CORS 头设置（允许跨域请求）
 *   2. JSON body 解析（限制 2MB）
 *   3. GET / 路由：接收 ?url= 参数，转发 HTTP 请求并以原始 Content-Type 返回
 * 
 * 部署：Railway / 任意 Node.js 环境，默认端口 3000。
 * 注意：proxy/app.js 是本文件的简化历史版本，保留仅供参考。
 */
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
// 接收 ?url= 参数，以模拟浏览器 UA 抓取目标网页，保持原始 Content-Type 透传
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

// 启动 HTTP 服务，默认监听 3000 端口（可通过 PORT 环境变量覆盖）
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("CORS proxy on port " + PORT));
