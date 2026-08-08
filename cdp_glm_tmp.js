// CDP 驱动真实页面测试 GLM（临时文件，测完删除）
const GLM_KEY = 'd93396be971f4ae48493efcb7b337b31.j53RXz82LMeDIOch';

async function main() {
  // 1. 拿页面 WebSocket URL
  const tabs = await (await fetch('http://localhost:9222/json')).json();
  const page = tabs.find(t => t.type === 'page');
  if (!page) throw new Error('未找到页面');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let msgId = 0;
  const pending = {};
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
  };
  const send = (method, params) => new Promise((res, rej) => {
    const id = ++msgId;
    pending[id] = (m) => m.error ? rej(new Error(m.error.message)) : res(m.result);
    ws.send(JSON.stringify({ id, method, params }));
  });
  await new Promise((res) => ws.onopen = res);
  console.log('CDP 已连接');

  // 2. 注入 GLM 配置 + 刷新
  const inject = `
    localStorage.setItem('ds_api_key', '${GLM_KEY}');
    localStorage.setItem('ds_model', 'zhipu/glm-4.7-flash');
    localStorage.setItem('ds_base_url', 'https://open.bigmodel.cn/api/paas/v4');
    localStorage.setItem('ds_chat_endpoint', '');
    '注入完成: ' + localStorage.getItem('ds_model');
  `;
  await send('Runtime.evaluate', { expression: inject });
  await send('Page.reload', {});
  console.log('已注入 GLM 配置并刷新，等待页面加载...');
  await new Promise(r => setTimeout(r, 6000));

  // 3. 检查页面状态（模型配置是否生效）
  const state = await send('Runtime.evaluate', { expression: `
    JSON.stringify({
      model: window.DS_MODEL,
      baseUrl: window.DS_BASE_URL,
      endpoint: window.DS_CHAT_ENDPOINT,
      apiModel: window.DS_API_MODEL,
      hasEls: typeof els !== 'undefined',
      title: document.title
    })
  `});
  console.log('页面状态:', state.result.value);

  // 4. 输入话题 + 触发生成（直接调页面全局函数 generateDraft）
  const trigger = await send('Runtime.evaluate', { expression: `
    els.topicInput.value = '煤矿安全生产督导';
    els.audienceSelect.value = '一线职工';
    els.toneSelect.value = '正式宣传';
    generateDraft();
    '已触发生成';
  `});
  console.log('触发:', trigger.result.value);

  // 5. 轮询等待生成结果（最多 180 秒）
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await send('Runtime.evaluate', { expression: `
      (function() {
        var btn = document.getElementById('generateBtn');
        var panel = document.getElementById('resultPanel');
        var title = document.getElementById('resultMainTitle');
        var body = document.getElementById('articleBody');
        return JSON.stringify({
          btnText: btn ? btn.textContent : '',
          panelHidden: panel ? panel.hidden : null,
          title: title ? title.textContent : '',
          bodyLen: body ? body.textContent.length : 0,
          body: body ? body.textContent.substring(0, 1200) : ''
        });
      })()
    `});
    const s = JSON.parse(res.result.value);
    if (s.btnText === '自动生成文章' && s.bodyLen > 200) {
      console.log('=== GLM-4.7-Flash 生成完成（约 ' + Math.round((i + 1) * 3) + ' 秒）===');
      console.log('■ 标题:', s.title);
      console.log('■ 正文前 1200 字:', s.body.replace(/\s+/g, ' '));
      ws.close();
      return;
    }
    if (i % 5 === 0) console.log('生成中... 按钮状态: ' + s.btnText + ' | 正文长度: ' + s.bodyLen);
  }
  console.log('❌ 180 秒未完成（可能限流或失败）');
  const res = await send('Runtime.evaluate', { expression: `document.body.textContent.substring(0, 500)` });
  console.log('页面文本片段:', res.result.value);
  ws.close();
}
main().catch(e => { console.error('失败:', e.message); process.exit(1); });
