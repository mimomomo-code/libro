// (vive en _tools/ para que otra sesión lo reutilice) Conduce Edge headless por el protocolo DevTools (Node 22+ trae WebSocket) para esperar de
// verdad el trabajo asíncrono (descifrado, XHR) y capturar en el momento justo.
// Uso: node cdp.js [--w 412 --h 915 --movil] paso paso ...
//   pasos: nav:<url> | wait:<expr JS que sea true> | do:<js> | state:<expr> | shot:<png> | sleep:<ms>
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const args = process.argv.slice(2);
const opt = { w: 1366, h: 800, movil: false, steps: [] };
for (let i = 0; i < args.length; i++){
  const a = args[i];
  if (a === '--w') opt.w = +args[++i]; else if (a === '--h') opt.h = +args[++i]; else if (a === '--movil') opt.movil = true;
  else opt.steps.push(a);
}
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9400 + Math.floor(Math.random() * 200);
const perfil = process.env.TEMP + '\\perfil_cdp_' + PORT;
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + perfil, '--window-size=' + opt.w + ',' + opt.h, 'about:blank'], { stdio: 'ignore' });
const get = url => new Promise((ok, ko) => http.get(url, r => { let s = ''; r.on('data', d => s += d); r.on('end', () => ok(s)); }).on('error', ko));
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++){ try { targets = JSON.parse(await get('http://127.0.0.1:' + PORT + '/json')); } catch (e) { await sleep(250); } }
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });
  let id = 0; const pend = {};
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]){ pend[d.id](d); delete pend[d.id]; } };
  const send = (method, params) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  const evalr = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) console.log('EXCEPCION', r.result.exceptionDetails.text, (r.result.exceptionDetails.exception || {}).description || '');
    return r.result && r.result.result ? r.result.result.value : undefined;
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: opt.w, height: opt.h, deviceScaleFactor: 1, mobile: opt.movil });
  for (const st of opt.steps){
    const c = st.indexOf(':'), k = st.slice(0, c), v = st.slice(c + 1);
    if (k === 'nav'){ await send('Page.navigate', { url: v }); await sleep(900); }
    else if (k === 'sleep') await sleep(+v);
    else if (k === 'wait'){
      const t0 = Date.now(); let ok = false;
      while (Date.now() - t0 < 25000){ if (await evalr(v)){ ok = true; break; } await sleep(200); }
      console.log((ok ? 'OK   ' : 'TOPE ') + v.slice(0, 90) + ' (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)');
    }
    else if (k === 'do') await evalr(v);
    else if (k === 'state') console.log('ESTADO', JSON.stringify(await evalr(v)));
    else if (k === 'shot'){ const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(v, Buffer.from(r.result.data, 'base64')); console.log('captura', v); }
  }
  ws.close(); edge.kill(); process.exit(0);
})().catch(e => { console.error(e); edge.kill(); process.exit(1); });
