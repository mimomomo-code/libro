// =====================================================================
//  EL CANDADO. Un libro del catálogo con `candado: "assets/candado.json"`
//  guarda cifrado lo que no debe verse en el repositorio (AES-256-GCM con
//  una clave derivada del número por PBKDF2-SHA256; lo cifra
//  _tools/candado.py): sus imágenes (archivos .bin en `paginas`) y, si
//  tiene `cifrado: "ruta.bin"`, un archivo de datos JSON (los días del
//  calendario). Al tocarlo en la mesa, en vez de abrirse pide el número; si
//  es el correcto descifra todo en memoria (las imágenes quedan como blob:
//  URLs en datos._descifradas y los datos en datos._cifrado) y el libro se
//  abre como cualquier otro. El navegador recuerda la clave (localStorage)
//  para no pedirla cada vez; los libros que comparten el mismo candado.json
//  comparten también el número y el recuerdo: se escribe una sola vez.
//  El número NO está en el código.
//
//  Para probar en la computadora: el libro tiene que servirse por http (el
//  sitio publicado, o `python -m http.server` en la carpeta): abierto como
//  archivo, el navegador no deja leer los .bin. ?clave=N abre sin preguntar.
// =====================================================================
(function(){
  'use strict';
  const $ = s => document.querySelector(s);
  const q = new URLSearchParams(location.search);
  const RECORDAR = !['limpio', 'test', 'clave'].some(k => q.has(k));
  const LS = 'libro.candado.';
  const panel = $('#candado'), tarjeta = panel.querySelector('.cerradura'), input = panel.querySelector('.cifra');
  const aviso = panel.querySelector('.aviso'), btnAbrir = panel.querySelector('.abrir'), btnVolver = panel.querySelector('.cancelar');
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const ab64 = u => btoa(String.fromCharCode.apply(null, new Uint8Array(u)));
  const cajas = {};                     // por candado.json: { cfg }
  const cfgDe = l => cajas[l.candado] && cajas[l.candado].cfg;

  // XHR y no fetch: funciona por http y también desde file:// con --allow-file-access-from-files (capturas)
  function leer(url, tipo){
    return new Promise((ok, ko) => {
      const x = new XMLHttpRequest(); x.open('GET', url); x.responseType = tipo;
      x.onload = () => { if ((x.status >= 200 && x.status < 300 && x.response != null) || (x.status === 0 && x.response)) ok(x.response); else ko(new Error(url + ' ' + x.status)); };
      x.onerror = () => ko(new Error(url));
      x.send();
    });
  }
  async function config(l){
    if (!cajas[l.candado]) cajas[l.candado] = { cfg: await leer(l.candado, 'json') };
    return cajas[l.candado].cfg;
  }
  async function derivar(cfg, numero){
    const base = await crypto.subtle.importKey('raw', enc.encode(numero), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(cfg.sal), iterations: cfg.iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
  }
  function descifrar(clave, datos){
    const u = new Uint8Array(datos);
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, clave, u.slice(12));
  }
  async function esLaClave(cfg, clave){
    try { await descifrar(clave, b64(cfg.prueba)); return true; } catch (e) { return false; }
  }
  const rutasDe = l => (l.datos.paginas || []).filter(p => p && typeof p === 'object' && (p.foto || p.dibujo)).map(p => String(p.foto || p.dibujo));
  // descifra las imágenes del libro (a blob: URLs) y, si lo tiene, su archivo de datos (a objeto JSON)
  async function descifrarTodo(l, clave, progreso){
    const rutas = rutasDe(l), datos = l.cifrado ? [String(l.cifrado)] : [], mapa = {};
    const total = rutas.length + datos.length; let n = 0;
    await Promise.all(rutas.map(async r => {
      const buf = await descifrar(clave, await leer(r, 'arraybuffer'));
      mapa[r] = URL.createObjectURL(new Blob([buf], { type: 'image/webp' }));
      if (progreso) progreso(++n, total);
    }).concat(datos.map(async r => {
      const buf = await descifrar(clave, await leer(r, 'arraybuffer'));
      l.datos._cifrado = JSON.parse(dec.decode(buf));
      if (progreso) progreso(++n, total);
    })));
    l.datos._descifradas = mapa;
  }
  // la clave recordada se guarda por candado.json (los libros que lo comparten la comparten);
  // antes se guardaba por libro, y ese recuerdo viejo también se acepta (y se pasa al nombre nuevo)
  const nombreLS = l => LS + (l.candado || l.id);
  async function claveRecordada(l, cfg){
    if (!RECORDAR) return null;
    for (const nombre of [nombreLS(l), LS + l.id]){
      try {
        const s = localStorage.getItem(nombre); if (!s) continue;
        const k = await crypto.subtle.importKey('raw', b64(s), 'AES-GCM', true, ['decrypt']);
        if (await esLaClave(cfg, k)){ if (nombre !== nombreLS(l)) await recordar(l, k); return k; }
      } catch (e) {}
    }
    return null;
  }
  async function recordar(l, clave){
    if (!RECORDAR) return;
    try { localStorage.setItem(nombreLS(l), ab64(await crypto.subtle.exportKey('raw', clave))); } catch (e) {}
  }

  // ---- el panel ----
  let pendiente = null;                 // { l, cb } mientras el panel está a la vista
  let ocupado = false;
  function mostrar(l, cb, mensaje){
    pendiente = { l, cb };
    input.value = ''; input.maxLength = (cfgDe(l) && cfgDe(l).largo) || 12;
    aviso.textContent = mensaje || '';
    btnAbrir.disabled = false;
    panel.hidden = false;
    setTimeout(() => { try { input.focus(); } catch (e) {} }, 60);
  }
  function esconder(){ panel.hidden = true; pendiente = null; ocupado = false; }
  function tiembla(msg){
    aviso.textContent = msg; input.value = '';
    tarjeta.classList.remove('tiembla'); void tarjeta.offsetWidth; tarjeta.classList.add('tiembla');
    try { input.focus(); } catch (e) {}
  }
  async function abrirCon(l, clave, cb){
    try {
      aviso.textContent = 'Abriendo…';
      await descifrarTodo(l, clave, (n, t) => { aviso.textContent = 'Abriendo… ' + n + ' / ' + t; });
    } catch (e) {
      ocupado = false; btnAbrir.disabled = false;
      aviso.textContent = 'No se pudo leer el libro. Ábrelo desde el sitio publicado.';
      if (panel.hidden) mostrar(l, cb, aviso.textContent);
      return false;
    }
    await recordar(l, clave);
    esconder();
    document.dispatchEvent(new CustomEvent('candado-abierto', { detail: l.id }));
    cb();
    return true;
  }
  async function intentar(){
    if (!pendiente || ocupado) return;
    const { l, cb } = pendiente;
    const numero = input.value.replace(/\D/g, '');
    const cfg = cfgDe(l);
    if (numero.length < (cfg.largo || 1)){ aviso.textContent = 'Faltan cifras'; return; }
    ocupado = true; btnAbrir.disabled = true; aviso.textContent = 'Comprobando…';
    const clave = await derivar(cfg, numero);
    if (!(await esLaClave(cfg, clave))){ ocupado = false; btnAbrir.disabled = false; tiembla('No es ese número'); return; }
    await abrirCon(l, clave, cb);
  }
  btnAbrir.addEventListener('click', intentar);
  btnVolver.addEventListener('click', esconder);
  panel.addEventListener('pointerdown', e => { if (e.target === panel) esconder(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); intentar(); } else if (e.key === 'Escape') esconder(); });
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '');
    const cfg = pendiente && cfgDe(pendiente.l);
    if (cfg && cfg.largo && input.value.length >= cfg.largo) intentar();       // al completar las cifras prueba solo
  });

  window.CANDADO = {
    listo: l => !!(l && l.datos && l.datos._descifradas),
    // Pide el número para el libro l y, cuando su contenido está descifrado, llama a cb().
    // Con `directa` (el ?clave= de la URL) o con la clave recordada por el navegador no pregunta.
    async pedir(l, cb, directa){
      if (ocupado) return;
      if (!window.crypto || !crypto.subtle){ mostrar(l, cb, 'Este navegador no puede abrir el candado.'); btnAbrir.disabled = true; return; }
      let cfg;
      try { cfg = await config(l); }
      catch (e){ mostrar(l, cb, 'No se pudo leer el candado. Abre el libro desde el sitio publicado.'); btnAbrir.disabled = true; return; }
      let clave = null;
      if (directa){ const k = await derivar(cfg, String(directa)); if (await esLaClave(cfg, k)) clave = k; }
      if (!clave) clave = await claveRecordada(l, cfg);
      if (clave){ ocupado = true; await abrirCon(l, clave, cb); return; }
      mostrar(l, cb);
    },
    olvidar(l){
      try { localStorage.removeItem(nombreLS(l)); localStorage.removeItem(LS + l.id); } catch (e) {}
      if (l.datos){ delete l.datos._descifradas; delete l.datos._cifrado; }
    },
  };
})();
