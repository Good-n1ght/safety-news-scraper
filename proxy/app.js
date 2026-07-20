const express = require("express");
const app = express();

app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

app.get("/", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url param");
  fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "zh-CN"
    }
  })
    .then(r => r.text().then(b => {
      res.type(r.headers.get("content-type") || "text/html");
      res.send(b);
    }))
    .catch(e => res.status(502).send("Proxy error: " + e.message));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("CORS proxy running on port " + PORT));
