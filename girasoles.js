// =====================================================================
//  LOS GIRASOLES. Al abrir el libro "21 Sep 2026" caen girasoles hasta
//  llenar la pantalla. Para que no se arrastre ni con mil flores, hay
//  DOS lienzos: en "cayendo" solo se dibujan las que están en el aire
//  (unas decenas) y cada flor que aterriza se pinta UNA sola vez en
//  "posados", que ya no se vuelve a tocar. Las flores mismas son
//  sprites pre-dibujados: cada frame es un drawImage por flor en el aire.
//
//  Uso: GIRASOLES.mostrar({ notas, alTerminar, lleno, conNota })
//    - notas: los textos que aparecen, uno por toque, cuando la pantalla está
//      llena (la primera es la nota, las siguientes posdatas).
//    - alTerminar: se llama cuando la persona toca tras la última y todo se limpia.
//    - lleno / conNota: solo para capturas (pantalla llena de golpe / nota N a la vista).
// =====================================================================
(function(){
  'use strict';
  const R = Math.random;
  const PAL = [
    ['#f3c231', '#e0a21b', '#b7820f'],
    ['#f7cd46', '#e8ae23', '#c28c12'],
    ['#efb928', '#d99a14', '#a87410'],
    ['#f9d65a', '#efb92a', '#c69316'],
  ];
  const suave = x => x * x * (3 - 2 * x);

  // Un girasol pre-dibujado: dos coronas de pétalos, disco y semillas en espiral.
  function sprite(r, pal, petalos, dpr){
    const pad = 4, S = Math.ceil((r + pad) * 2);
    const c = document.createElement('canvas');
    c.width = c.height = Math.ceil(S * dpr);
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr); ctx.translate(S / 2, S / 2);
    const paso = Math.PI * 2 / petalos;
    for (let capa = 0; capa < 2; capa++){
      const k = capa ? .8 : 1, off = capa ? paso / 2 : 0;
      ctx.fillStyle = capa ? pal[0] : pal[1];
      ctx.strokeStyle = pal[2]; ctx.lineWidth = .7;
      for (let i = 0; i < petalos; i++){
        ctx.save(); ctx.rotate(i * paso + off);
        ctx.beginPath();
        ctx.moveTo(r * .22 * k, 0);
        ctx.bezierCurveTo(r * .45 * k, -r * .21 * k, r * .86 * k, -r * .17 * k, r * k, 0);
        ctx.bezierCurveTo(r * .86 * k, r * .17 * k, r * .45 * k, r * .21 * k, r * .22 * k, 0);
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
    const g = ctx.createRadialGradient(-r * .08, -r * .08, r * .04, 0, 0, r * .38);
    g.addColorStop(0, '#6d4118'); g.addColorStop(.65, '#3f2209'); g.addColorStop(1, '#261204');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * .37, 0, Math.PI * 2); ctx.fill();
    const N = Math.max(24, Math.round(r * 1.7));
    for (let i = 0; i < N; i++){
      const a = i * 2.39996, d = r * .34 * Math.sqrt(i / N);
      ctx.fillStyle = i % 2 ? 'rgba(140,92,34,.6)' : 'rgba(18,9,2,.6)';
      ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * .028 + .3, 0, 6.2832); ctx.fill();
    }
    return { c, S };
  }

  // Un limón: óvalo con las dos puntas, poros y una hojita.
  function spriteLimon(r, dpr){
    const w = r * 1.9, h = r * 1.25, pad = 6, S = Math.ceil(w + pad * 2);
    const c = document.createElement('canvas');
    c.width = c.height = Math.ceil(S * dpr);
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr); ctx.translate(S / 2, S / 2);
    const g = ctx.createRadialGradient(-w * .18, -h * .22, r * .1, 0, 0, w * .6);
    g.addColorStop(0, '#fbec72'); g.addColorStop(.6, '#efd233'); g.addColorStop(1, '#c9a616');
    ctx.fillStyle = g; ctx.strokeStyle = '#a88a10'; ctx.lineWidth = .8;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.bezierCurveTo(-w / 2, -h * .68, w / 2, -h * .68, w / 2, 0);
    ctx.bezierCurveTo(w / 2, h * .68, -w / 2, h * .68, -w / 2, 0);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e6c81f';
    for (const s of [-1, 1]){ ctx.beginPath(); ctx.ellipse(s * (w / 2 - r * .02), 0, r * .13, r * .09, 0, 0, 6.2832); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = 'rgba(160,125,10,.28)';
    for (let i = 0; i < 26; i++){
      const a = i * 2.39996, d = Math.sqrt(i / 26);
      ctx.beginPath(); ctx.arc(Math.cos(a) * d * w * .4, Math.sin(a) * d * h * .38, r * .035, 0, 6.2832); ctx.fill();
    }
    ctx.save(); ctx.translate(w * .34, -h * .42); ctx.rotate(-.7);
    ctx.fillStyle = '#4f8f2c'; ctx.strokeStyle = '#2f5f18'; ctx.lineWidth = .7;
    ctx.beginPath(); ctx.ellipse(0, 0, r * .34, r * .14, 0, 0, 6.2832); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * .3, 0); ctx.lineTo(r * .3, 0); ctx.stroke();
    ctx.restore();
    return { c, S };
  }

  // Girasoles y limones ilustrados (ARTE_GIRASOLES en libros.js): se precargan al abrir la
  // página y, si están, cada uno se escala a un sprite del tamaño que pide la pantalla.
  const ARTE = (typeof ARTE_GIRASOLES === 'object' && ARTE_GIRASOLES) ? ARTE_GIRASOLES : {};
  const cargadas = { girasoles: [], limones: [] };
  for (const k of ['girasoles', 'limones']) for (const ruta of (Array.isArray(ARTE[k]) ? ARTE[k] : [])){
    const im = new Image(); im.onload = () => cargadas[k].push(im); im.onerror = () => {}; im.src = ruta;
  }
  function spriteImagen(im, ancho, dpr){
    const k = ancho / Math.max(im.naturalWidth, im.naturalHeight);
    const w = im.naturalWidth * k, h = im.naturalHeight * k, S = Math.ceil(Math.max(w, h) + 8);
    const c = document.createElement('canvas');
    c.width = c.height = Math.ceil(S * dpr);
    const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
    ctx.drawImage(im, (S - w) / 2, (S - h) / 2, w, h);
    return { c, S };
  }

  const ADORNO = (() => {
    let s = '<svg class="adorno-girasol" viewBox="0 0 60 60" aria-hidden="true"><g fill="#e8ad25" stroke="#b9800e" stroke-width=".6">' +
      '<path id="ptl" d="M30 30C26 22 26 12 30 5C34 12 34 22 30 30z"/>';
    for (let a = 30; a < 360; a += 30) s += '<use href="#ptl" transform="rotate(' + a + ' 30 30)"/>';
    return s + '</g><circle cx="30" cy="30" r="9" fill="#4a2a0e"/><circle cx="30" cy="30" r="5.5" fill="#2e1806"/></svg>';
  })();

  function mostrar(op){
    op = op || {};
    const capa = document.createElement('div');
    capa.id = 'girasoles';
    // tres lienzos: el manto posado, los limones posados (encima, para que no queden tapados) y lo que cae
    capa.innerHTML = '<canvas class="posados"></canvas><canvas class="frutas"></canvas><canvas class="cayendo"></canvas><div class="aviso">Toca</div>' +
      '<div class="nota papel">' + ADORNO + '<p></p><span class="pie"></span></div>';
    const NOTAS = (Array.isArray(op.notas) ? op.notas : [op.nota]).filter(t => t != null && String(t).trim());
    const notaP = capa.querySelector('.nota p'), notaPie = capa.querySelector('.nota .pie');
    let notaIdx = -1;
    function ponerNota(i){
      notaIdx = i;
      notaP.textContent = NOTAS[i] || '';
      capa.classList.toggle('posdata', i > 0);
      notaPie.textContent = i < NOTAS.length - 1 ? 'Toca para seguir' : 'Toca para volver a la sala';
    }
    document.body.appendChild(capa);
    const cvP = capa.querySelector('.posados'), cvF = capa.querySelector('.frutas'), cvC = capa.querySelector('.cayendo');
    const ctxP = cvP.getContext('2d'), ctxF = cvF.getContext('2d'), ctxC = cvC.getContext('2d');
    const MAX_LIMONES = 12;

    let W = 0, H = 0, dpr = 1, D = 40, r = 20, colW = 28, ncol = 0, alturas = null, colsLlenas = 0, pico = 40, esc = 1, total = 400;
    let SPR = [], LIM = [];
    function medir(){
      W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
      D = Math.max(36, Math.min(66, Math.min(W, H) * 0.115)); r = D / 2;
      colW = D * 0.5; ncol = Math.ceil(W / colW) + 1;
      esc = H / 900;
      SPR = []; LIM = [];
      if (cargadas.girasoles.length) for (let i = 0; i < 10; i++) SPR.push(spriteImagen(cargadas.girasoles[i % cargadas.girasoles.length], D * (0.85 + R() * 0.35), dpr));
      else for (let i = 0; i < 10; i++) SPR.push(sprite(r * (0.8 + R() * 0.4), PAL[i % PAL.length], 12 + (R() * 6 | 0), dpr));
      if (cargadas.limones.length) for (let i = 0; i < 6; i++) LIM.push(spriteImagen(cargadas.limones[i % cargadas.limones.length], r * (1.8 + R() * 0.5), dpr));
      else LIM = [spriteLimon(r * 1.05, dpr), spriteLimon(r * .9, dpr), spriteLimon(r * 1.15, dpr)];
      for (const cv of [cvP, cvF, cvC]){ cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      for (const cx of [ctxP, ctxF, ctxC]) cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // cuántas flores hacen falta y a qué ritmo para llenar en ~12 s
      const porCol = Math.ceil((H + r) / (D * 0.42)); total = porCol * ncol;
      pico = Math.max(12, (total - 36) / 9.5);
    }
    medir();
    alturas = new Float32Array(ncol);

    let t = 0, acum = 0, vivos = [], lleno = false, notaVisible = false, terminado = false, raf = 0, ultimo = 0;
    let soltados = 0, limones = 0;
    const colLlena = c => alturas[c] >= H + r;

    function soltarUno(colPref, rapida){
      let c = -1;
      if (colPref >= 0 && colPref < ncol && !colLlena(colPref)) c = colPref;
      else {
        // dos candidatas al azar y se queda la más baja: así el manto sube parejo
        for (let k = 0; k < 6 && c < 0; k++){
          const a = R() * ncol | 0, b = R() * ncol | 0;
          const ca = !colLlena(a), cb = !colLlena(b);
          if (ca && cb) c = alturas[a] <= alturas[b] ? a : b; else if (ca) c = a; else if (cb) c = b;
        }
        if (c < 0){ for (let i = 0; i < ncol; i++) if (!colLlena(i)){ c = i; break; } }
      }
      if (c < 0) return false;
      // los limones (12 como mucho) van repartidos a lo largo de toda la lluvia, no en las ráfagas
      const limon = !rapida && limones < MAX_LIMONES && soltados >= total * (limones + .5) / MAX_LIMONES;
      soltados++;
      if (limon){
        limones++;
        vivos.push({
          limon: true, x: c * colW + (R() - .5) * colW * .5, y: -r * 1.4,
          destino: H - alturas[c] - r * .55,
          spr: LIM[R() * LIM.length | 0], vy: (160 + R() * 120) * esc, g: 520 * esc, vmax: (520 + R() * 160) * esc,
          f: R() * 6.28, fv: .5 + R(), amp: (4 + R() * 8), rot: (R() - .5) * 1.2, spin: (R() - .5) * 1.2,
        });
      } else {
        vivos.push({
          x: c * colW + (R() - .5) * colW * .5, y: -r * 1.4,
          destino: H - alturas[c] - r * .55,
          spr: SPR[R() * SPR.length | 0], vy: (rapida ? 320 : 90 + R() * 120) * esc, g: 380 * esc, vmax: (380 + R() * 170) * esc,
          f: R() * 6.28, fv: .8 + R() * 1.6, amp: (14 + R() * 26), rot: R() * 6.28, spin: (R() - .5) * 2.4,
        });
      }
      alturas[c] += D * .42;
      if (colLlena(c)) colsLlenas++;
      return true;
    }
    function posar(p){
      const S = p.spr.S, cx = p.limon ? ctxF : ctxP;
      cx.save(); cx.translate(p.x, p.destino); cx.rotate(p.rot);
      cx.drawImage(p.spr.c, -S / 2, -S / 2, S, S); cx.restore();
    }
    function paso(dt){
      t += dt;
      if (colsLlenas < ncol){
        const ritmo = 3 + (pico - 3) * suave(Math.min(1, t / 5));
        acum += ritmo * dt;
        while (acum >= 1){ acum -= 1; if (!soltarUno(-1, false)) break; }
      }
      ctxC.clearRect(0, 0, W, H);
      for (let i = vivos.length - 1; i >= 0; i--){
        const p = vivos[i];
        p.vy = Math.min(p.vmax, p.vy + p.g * dt); p.y += p.vy * dt;
        p.f += p.fv * dt; p.x += Math.sin(p.f) * p.amp * dt; p.rot += p.spin * dt;
        if (p.y >= p.destino){ posar(p); vivos[i] = vivos[vivos.length - 1]; vivos.pop(); continue; }
        const S = p.spr.S;
        ctxC.save(); ctxC.translate(p.x, p.y); ctxC.rotate(p.rot);
        ctxC.drawImage(p.spr.c, -S / 2, -S / 2, S, S); ctxC.restore();
      }
      if (!lleno && colsLlenas >= ncol && !vivos.length){
        lleno = true;
        setTimeout(() => { if (!terminado) capa.classList.add('lleno'); }, 400);
      }
    }
    function bucle(now){
      raf = 0;
      const dt = Math.min(.05, (now - ultimo) / 1000); ultimo = now;
      paso(dt);
      if (!terminado && !(lleno && !vivos.length)) raf = requestAnimationFrame(bucle);
    }
    function arrancar(){ if (!raf && !terminado){ ultimo = performance.now(); raf = requestAnimationFrame(bucle); } }

    function rafaga(x){
      const c0 = Math.round(x / colW);
      for (let k = 0; k < 12; k++) soltarUno(Math.max(0, Math.min(ncol - 1, c0 + (R() * 7 | 0) - 3)), true);
      arrancar();
    }
    let cambiando = false;
    function mostrarNota(){
      if (!NOTAS.length){ terminar(); return; }
      notaVisible = true; ponerNota(0); capa.classList.add('nota-visible');
    }
    // la nota se va y llega la siguiente (la posdata) con un fundido corto
    function siguienteNota(){
      if (cambiando) return;
      cambiando = true; capa.classList.remove('nota-visible');
      setTimeout(() => { ponerNota(notaIdx + 1); capa.classList.add('nota-visible'); cambiando = false; }, 420);
    }
    function terminar(){
      if (terminado) return;
      terminado = true;
      if (raf) cancelAnimationFrame(raf);
      removeEventListener('keydown', teclas); removeEventListener('resize', redim);
      capa.classList.add('fuera');
      setTimeout(() => { capa.remove(); if (op.alTerminar) op.alTerminar(); }, 1050);
    }
    // si la pantalla cambia (giro del celular) se estira el manto ya posado
    function redim(){
      const copia = cv => { const v = document.createElement('canvas'); v.width = cv.width; v.height = cv.height; v.getContext('2d').drawImage(cv, 0, 0); return v; };
      const viejoP = copia(cvP), viejoF = copia(cvF);
      const W0 = W, H0 = H, alt0 = alturas, n0 = ncol;
      medir();
      ctxP.drawImage(viejoP, 0, 0, viejoP.width, viejoP.height, 0, 0, W, H);
      ctxF.drawImage(viejoF, 0, 0, viejoF.width, viejoF.height, 0, 0, W, H);
      alturas = new Float32Array(ncol); colsLlenas = 0;
      for (let c = 0; c < ncol; c++){ const c0 = Math.min(n0 - 1, Math.round(c * (n0 - 1) / Math.max(1, ncol - 1))); alturas[c] = alt0[c0] * H / H0; if (colLlena(c)) colsLlenas++; }
      for (const p of vivos){ p.x *= W / W0; p.destino *= H / H0; }
      if (!terminado) arrancar();
    }
    function teclas(e){ if (e.key === 'Escape'){ e.preventDefault(); terminar(); } }

    let pd = null;
    capa.addEventListener('pointerdown', e => { if (e.button === 0) pd = { x: e.clientX, y: e.clientY }; });
    capa.addEventListener('pointerup', e => {
      if (!pd) return;
      const lejos = Math.hypot(e.clientX - pd.x, e.clientY - pd.y) > 18; pd = null;
      if (lejos || terminado) return;
      if (notaVisible){ if (notaIdx < NOTAS.length - 1) siguienteNota(); else if (!cambiando) terminar(); }
      else if (lleno) mostrarNota();
      else rafaga(e.clientX);
    });
    capa.addEventListener('pointercancel', () => { pd = null; });
    addEventListener('keydown', teclas);
    addEventListener('resize', redim);

    if (op.lleno){          // para capturas: el manto ya puesto
      let guarda = 0; while (!lleno && guarda++ < 100000) paso(1 / 30);
      capa.classList.add('lleno');
      if (op.conNota){ mostrarNota(); const k = Math.min(NOTAS.length - 1, (parseInt(op.conNota, 10) || 1) - 1); if (k > 0) ponerNota(k); }
    } else arrancar();

    return { terminar };
  }

  window.GIRASOLES = { mostrar };
})();
