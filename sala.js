// =====================================================================
//  LA SALA. Dos librerías con 5 filas y 8 ranuras invisibles por fila,
//  y una mesa. Los libros del catálogo (libros.js) viven en las ranuras;
//  se tocan para llevarlos a la mesa. El primero que llega queda de pie,
//  listo para abrirse; los demás se apilan en una torre a su lado. Un
//  toque en la torre cambia ese libro por el que está de pie. Cualquier
//  libro de la mesa se arrastra de vuelta a una ranura de la librería
//  (o se arrastra de ranura en ranura para ordenar la biblioteca) y el
//  navegador recuerda dónde quedó cada uno.
//
//  Parámetros de la URL (para probar y para capturas; no guardan nada):
//    ?mesa=poema,girasoles   qué hay en la mesa (el primero de pie)
//    ?abrir=poema | girasoles   abre ese libro directamente
//    ?p=N                    abre el poema en la página N (como siempre)
//    ?lleno=1&nota=1         girasoles ya posados / con la nota a la vista
//    ?limpio=1               ignora lo recordado por el navegador
//    ?test=1                 prueba automática de la lógica de la sala
// =====================================================================
(function(){
  'use strict';
  const $ = s => document.querySelector(s);
  const q = new URLSearchParams(location.search);
  const cuerpo = document.body, sala = $('#sala'), pistaS = $('#pista-sala');
  const FILAS = 5, COLS = 8, LADOS = ['izq', 'der'];
  const CLAVE = 'libro.sala.v1';
  const TAP = window.TAPAS || {};
  const colores = t => TAP[t] || TAP.burdeos || ['#6b2630', '#4a1a20', '#33111a'];
  const esc = s => String(s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
  const SOLO_LECTURA = ['mesa', 'abrir', 'p', 'lleno', 'nota', 'limpio', 'test'].some(k => q.has(k));

  // ---- el catálogo ----
  const CAT = ((typeof LIBROS !== 'undefined' && Array.isArray(LIBROS)) ? LIBROS : []).map((l, i) => {
    const o = Object.assign({}, l);
    if (!o.id) o.id = 'libro' + i;
    if (o.tipo === 'poema' && o.datos){ o.titulo = o.titulo || o.datos.titulo || 'Sin título'; o.tapa = o.tapa || o.datos.tapa; }
    o.titulo = o.titulo || 'Libro';
    if (!TAP[o.tapa]) o.tapa = 'burdeos';
    return o;
  }).filter(o => o.tipo !== 'poema' || o.datos);
  const porId = id => CAT.find(l => l.id === id);

  // ---- el estado: qué hay en la mesa y en qué ranura está cada libro ----
  let estado = { mesa: [], estantes: {} };
  const clave = p => p.lado + ':' + p.fila + ':' + p.col;
  const posValida = p => !!p && LADOS.includes(p.lado) && p.fila >= 0 && p.fila < FILAS && p.col >= 0 && p.col < COLS;
  function ocupada(p, salvo){
    for (const id in estado.estantes){ if (id !== salvo && clave(estado.estantes[id]) === clave(p)) return id; }
    return null;
  }
  // la ranura libre más cercana a la pedida: misma fila primero, luego filas vecinas, luego la otra librería
  function huecoCerca(p, salvo){
    let mejor = null, md = Infinity;
    for (const lado of LADOS) for (let f = 0; f < FILAS; f++) for (let c = 0; c < COLS; c++){
      const x = { lado, fila: f, col: c };
      if (ocupada(x, salvo)) continue;
      const d = (lado === p.lado ? 0 : 1000) + Math.abs(f - p.fila) * 10 + Math.abs(c - p.col);
      if (d < md){ md = d; mejor = x; }
    }
    return mejor;
  }
  function colocar(id, p){
    const h = ocupada(p, id) ? huecoCerca(p, id) : p;
    if (!h) return false;
    estado.estantes[id] = { lado: h.lado, fila: h.fila | 0, col: h.col | 0 };
    return true;
  }
  function guardar(){
    if (SOLO_LECTURA) return;
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) {}
  }
  function cargarEstado(){
    let s = null;
    if (!q.has('limpio') && !q.has('test')){ try { s = JSON.parse(localStorage.getItem(CLAVE)); } catch (e) {} }
    estado = { mesa: [], estantes: {} };
    if (s && typeof s === 'object'){
      if (Array.isArray(s.mesa)) estado.mesa = s.mesa.filter((id, i, a) => porId(id) && a.indexOf(id) === i);
      if (s.estantes && typeof s.estantes === 'object') for (const id in s.estantes){
        const p = s.estantes[id];
        if (porId(id) && posValida(p) && !estado.mesa.includes(id)) estado.estantes[id] = { lado: p.lado, fila: p.fila | 0, col: p.col | 0 };
      }
    }
    if (q.has('mesa')){
      estado.mesa = q.get('mesa').split(',').filter((id, i, a) => porId(id) && a.indexOf(id) === i);
      for (const id of estado.mesa) delete estado.estantes[id];
    }
    // dos libros en la misma ranura: el segundo busca hueco
    const vistas = {};
    for (const id of Object.keys(estado.estantes)){
      const k = clave(estado.estantes[id]);
      if (vistas[k]){ const p = estado.estantes[id]; delete estado.estantes[id]; colocar(id, p); }
      vistas[clave(estado.estantes[id])] = id;
    }
    // libros sin sitio (nuevos en el catálogo): a su estante de nacimiento
    for (const l of CAT){
      if (estado.mesa.includes(l.id) || estado.estantes[l.id]) continue;
      colocar(l.id, posValida(l.estante) ? l.estante : { lado: 'izq', fila: 0, col: 0 });
    }
  }

  // ---- las dos operaciones ----
  function aMesa(id){
    delete estado.estantes[id];
    const i = estado.mesa.indexOf(id);
    if (i > 0){                    // estaba en la torre: pasa a estar de pie y el de pie sube a la torre
      estado.mesa.splice(i, 1);
      const dePie = estado.mesa.shift();
      estado.mesa.unshift(id);
      if (dePie) estado.mesa.push(dePie);
    } else if (i < 0) estado.mesa.push(id);
    guardar();
  }
  function aEstante(id, p){
    const i = estado.mesa.indexOf(id);
    if (i >= 0) estado.mesa.splice(i, 1);
    const ok = colocar(id, p);
    guardar();
    return ok;
  }

  // ---- el mueble: 2 librerías × 5 estantes × 8 ranuras ----
  const librerias = {};
  function construir(){
    for (const lado of LADOS){
      const el = sala.querySelector('.libreria[data-lado="' + lado + '"]');
      const filas = [];
      for (let f = 0; f < FILAS; f++){
        const est = document.createElement('div'); est.className = 'estante';
        const fila = [];
        for (let c = 0; c < COLS; c++){
          const r = document.createElement('div'); r.className = 'ranura';
          r.dataset.lado = lado; r.dataset.fila = f; r.dataset.col = c;
          est.appendChild(r); fila.push(r);
        }
        el.appendChild(est); filas.push(fila);
      }
      librerias[lado] = { el, filas };
    }
  }
  const estilo = l => { const c = colores(l.tapa); return '--c1:' + c[0] + ';--c2:' + c[1] + ';--c3:' + c[2]; };
  const elDe = id => sala.querySelector('[data-id="' + id + '"]');
  // un DOMRect no se copia con Object.assign (sus medidas son getters): se aplana a mano
  const plano = (r, css) => ({ left: r.left, top: r.top, width: r.width, height: r.height, css: css || '' });

  function render(){
    sala.querySelectorAll('.lomo, .libro-mesa, .libro-torre').forEach(e => e.remove());
    for (const id in estado.estantes){
      const l = porId(id), p = estado.estantes[id];
      const lomo = document.createElement('div');
      lomo.className = 'lomo'; lomo.dataset.id = id; lomo.style.cssText = estilo(l); lomo.title = l.titulo;
      lomo.innerHTML = '<span class="rotulo">' + esc(l.titulo) + '</span><i class="toque"></i>';
      librerias[p.lado].filas[p.fila][p.col].appendChild(lomo);
      enganchar(lomo, id, 'estante');
    }
    const lugar = $('.lugar'), torre = $('.torre');
    estado.mesa.forEach((id, i) => {
      const l = porId(id);
      const b = document.createElement('div');
      b.dataset.id = id; b.style.cssText = estilo(l); b.title = l.titulo;
      if (i === 0){
        b.className = 'libro-mesa piel';
        b.innerHTML = '<span class="titulo-mesa">' + esc(l.titulo) + '</span>';
        lugar.appendChild(b); enganchar(b, id, 'mesa');
      } else {
        b.className = 'libro-torre';
        torre.appendChild(b); enganchar(b, id, 'torre');
      }
    });
    pistas();
  }

  // ---- vuelos: el libro viaja de donde estaba a donde queda ----
  function volar(desde, hasta, el, lento){
    const v = document.createElement('div');
    v.className = 'vuelo' + (lento ? ' lento' : '');
    v.style.cssText = (el ? el.style.cssText : desde.css || '') +
      ';left:' + desde.left + 'px;top:' + desde.top + 'px;width:' + desde.width + 'px;height:' + desde.height + 'px';
    document.body.appendChild(v);
    if (el) el.classList.add('llegando');
    v.getBoundingClientRect();
    v.classList.add('en-vuelo');
    v.style.left = hasta.left + 'px'; v.style.top = hasta.top + 'px';
    v.style.width = hasta.width + 'px'; v.style.height = hasta.height + 'px';
    return new Promise(ok => setTimeout(() => { v.remove(); if (el) el.classList.remove('llegando'); ok(); }, lento ? 820 : 620));
  }
  // FLIP: mide todos los libros, aplica el cambio, vuelve a pintar y hace volar los que se movieron
  function flip(cambio, origenes){
    const antes = {};
    sala.querySelectorAll('[data-id]').forEach(e => { antes[e.dataset.id] = e.getBoundingClientRect(); });
    Object.assign(antes, origenes || {});
    cambio(); render();
    sala.querySelectorAll('[data-id]').forEach(e => {
      const a = antes[e.dataset.id]; if (!a) return;
      const r = e.getBoundingClientRect();
      if (Math.abs(r.left - a.left) < 1 && Math.abs(r.top - a.top) < 1 && Math.abs(r.width - a.width) < 1) return;
      volar(a, r, e, false);
    });
  }

  // ---- toque y arrastre ----
  let arrastre = null, bloqueado = false;
  const dentro = (e, r, m) => e.clientX >= r.left - m && e.clientX <= r.right + m && e.clientY >= r.top - m && e.clientY <= r.bottom + m;
  function enganchar(el, id, origen){
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0 || bloqueado || arrastre) return;
      e.preventDefault(); e.stopPropagation();
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
      arrastre = { id, origen, el, x0: e.clientX, y0: e.clientY, activo: false };
    });
    el.addEventListener('pointermove', e => {
      if (!arrastre || arrastre.el !== el) return;
      if (!arrastre.activo){ if (Math.hypot(e.clientX - arrastre.x0, e.clientY - arrastre.y0) < 9) return; empezar(); }
      mover(e);
    });
    el.addEventListener('pointerup', e => {
      if (!arrastre || arrastre.el !== el) return;
      const a = arrastre; arrastre = null;
      if (window.LECTOR) LECTOR.musica();
      if (a.activo) soltar(a); else tocar(a);
    });
    el.addEventListener('pointercancel', () => {
      if (!arrastre || arrastre.el !== el) return;
      const a = arrastre; arrastre = null;
      if (a.activo){ const rf = a.fant.getBoundingClientRect(); limpiar(a); volar(rf, a.el.getBoundingClientRect(), a.el, false); }
    });
  }
  function tocar(a){
    if (a.origen === 'mesa'){ abrirLibro(a.id); return; }
    flip(() => aMesa(a.id));
  }
  function empezar(){
    const a = arrastre; a.activo = true;
    const l = porId(a.id);
    a.fant = document.createElement('div');
    a.fant.className = 'arrastre piel'; a.fant.style.cssText = estilo(l);
    a.fant.innerHTML = '<span class="titulo-mesa">' + esc(l.titulo) + '</span>';
    document.body.appendChild(a.fant);
    a.el.classList.add('fantasma');
    cuerpo.classList.add('arrastrando');
    a.ranuras = [];
    for (const lado of LADOS) librerias[lado].filas.forEach((fila, f) => fila.forEach((r, c) => a.ranuras.push({ el: r, r: r.getBoundingClientRect(), lado, fila: f, col: c })));
    a.libs = LADOS.map(lado => ({ lado, r: librerias[lado].el.getBoundingClientRect() }));
    a.mesaEl = $('.mesa'); a.mesaR = a.mesaEl.getBoundingClientRect();
    a.destino = null;
  }
  function mover(e){
    const a = arrastre; if (!a || !a.activo) return;
    a.fant.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px) translate(-50%,-72%) rotate(-6deg)';
    let d = null;
    const lib = a.libs.find(x => dentro(e, x.r, 6));
    if (lib){
      let fila = 0;
      for (const x of a.ranuras){ if (x.lado === lib.lado && x.col === 0 && e.clientY >= x.r.top) fila = Math.max(fila, x.fila); }
      let mejor = null, md = Infinity;
      for (const x of a.ranuras){
        if (x.lado !== lib.lado || x.fila !== fila) continue;
        const dd = Math.abs(x.r.left + x.r.width / 2 - e.clientX);
        if (dd < md){ md = dd; mejor = x; }
      }
      if (mejor){
        const p = { lado: mejor.lado, fila: mejor.fila, col: mejor.col };
        const h = ocupada(p, a.id) ? huecoCerca(p, a.id) : p;
        if (h) d = { tipo: 'ranura', pos: h, el: librerias[h.lado].filas[h.fila][h.col] };
      }
    } else if (dentro(e, a.mesaR, 30) && a.origen !== 'mesa') d = { tipo: 'mesa', el: a.mesaEl };
    if (a.destino && (!d || a.destino.el !== d.el)) a.destino.el.classList.remove('destino');
    if (d) d.el.classList.add('destino');
    a.destino = d;
  }
  function limpiar(a){
    a.fant.remove(); a.el.classList.remove('fantasma'); cuerpo.classList.remove('arrastrando');
    if (a.destino) a.destino.el.classList.remove('destino');
  }
  function soltar(a){
    const d = a.destino, rf = a.fant.getBoundingClientRect();
    limpiar(a);
    const desde = {}; desde[a.id] = rf;
    if (d && d.tipo === 'ranura') flip(() => aEstante(a.id, d.pos), desde);
    else if (d && d.tipo === 'mesa') flip(() => aMesa(a.id), desde);
    else volar(rf, a.el.getBoundingClientRect(), a.el, false);       // vuelve solo a su sitio
  }

  // ---- pistas que se enseñan solas ----
  let pistaT = 0;
  const vistas = { libreria: false, mesa: false };
  function pista(txt, ms){
    pistaS.textContent = txt; pistaS.classList.add('ver');
    clearTimeout(pistaT);
    if (ms) pistaT = setTimeout(() => pistaS.classList.remove('ver'), ms);
  }
  function pistas(){
    if (!estado.mesa.length){ if (!vistas.libreria){ vistas.libreria = true; pista('Toca un libro de la librería', 0); } }
    else if (!vistas.mesa){ vistas.mesa = true; pista('Toca el libro para abrirlo · arrástralo a la librería para guardarlo', 7000); }
  }

  // ---- abrir el libro que está de pie en la mesa ----
  let abiertoId = null;
  function abrirLibro(id){
    const l = porId(id); if (!l || bloqueado) return;
    if (l.tipo === 'poema') abrirPoema(l, -1, true);
    else if (l.tipo === 'girasoles') abrirGirasoles(l);
  }
  function abrirPoema(l, pagina, conVuelo){
    bloqueado = true; abiertoId = l.id;
    pistaS.classList.remove('ver');
    const el = elDe(l.id);
    const r1 = el ? el.getBoundingClientRect() : null;
    const r2 = LECTOR.mostrar(l.datos, { pagina });
    if (!conVuelo){ cuerpo.classList.add('sin-fundido'); setTimeout(() => cuerpo.classList.remove('sin-fundido'), 80); }
    cuerpo.classList.add('en-lector');
    if (conVuelo && r1 && pagina < 0){
      LECTOR.esconderLibro(true);
      volar(plano(r1, el.style.cssText), r2, null, true).then(() => { LECTOR.esconderLibro(false); bloqueado = false; });
    } else bloqueado = false;
  }
  function volverASala(){
    if (!cuerpo.classList.contains('en-lector') || bloqueado) return;
    const estabaAbierto = LECTOR.estaAbierto();
    const r1 = LECTOR.rectLibro();
    LECTOR.ocultar();
    cuerpo.classList.remove('en-lector');
    const el = abiertoId ? elDe(abiertoId) : null;
    abiertoId = null;
    if (el && !estabaAbierto){
      bloqueado = true;
      volar(plano(r1, el.style.cssText), el.getBoundingClientRect(), el, true).then(() => { bloqueado = false; });
    }
  }
  LECTOR.alVolver = volverASala;
  LECTOR.alCerrar = volverASala;
  function abrirGirasoles(l){
    bloqueado = true;
    pistaS.classList.remove('ver');
    GIRASOLES.mostrar({ notas: Array.isArray(l.notas) ? l.notas : [l.nota], lleno: q.has('lleno'), conNota: q.has('nota') ? (q.get('nota') || '1') : '', alTerminar: () => { bloqueado = false; } });
  }

  // ---- prueba automática de la lógica (?test=1) ----
  function autoTest(){
    const res = [];
    const ok = (c, m) => res.push((c ? 'OK ' : 'FALLA ') + m);
    const pos = id => estado.estantes[id] ? clave(estado.estantes[id]) : '-';
    estado = { mesa: [], estantes: {} };
    for (const l of CAT) colocar(l.id, l.estante);
    ok(pos('poema') === 'izq:0:1' && pos('girasoles') === 'der:0:5', 'nacen en su estante');
    aMesa('poema'); ok(estado.mesa.join() === 'poema' && pos('poema') === '-', 'primer libro: de pie en la mesa');
    aMesa('girasoles'); ok(estado.mesa.join() === 'poema,girasoles', 'segundo libro: a la torre');
    aMesa('girasoles'); ok(estado.mesa.join() === 'girasoles,poema', 'toque en la torre: se intercambian');
    aEstante('girasoles', { lado: 'izq', fila: 2, col: 3 }); ok(estado.mesa.join() === 'poema' && pos('girasoles') === 'izq:2:3', 'de la torre a la ranura pedida');
    aEstante('poema', { lado: 'izq', fila: 2, col: 3 }); ok(!estado.mesa.length && pos('poema') === 'izq:2:2', 'ranura ocupada: hueco vecino en la misma fila');
    aMesa('poema'); aEstante('poema', { lado: 'der', fila: 4, col: 7 }); ok(pos('poema') === 'der:4:7', 'a la última ranura');
    render();
    // arrastre sintético: el lomo del poema viaja a la ranura izq 1/4 con eventos de puntero
    const lomo = elDe('poema'), meta = librerias.izq.filas[1][4].getBoundingClientRect();
    const r0 = lomo.getBoundingClientRect();
    const ev = (tipo, x, y) => lomo.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 1, pointerType: 'mouse', isPrimary: true }));
    ev('pointerdown', r0.left + r0.width / 2, r0.top + r0.height / 2);
    ev('pointermove', r0.left + 30, r0.top + 30);
    ev('pointermove', meta.left + meta.width / 2, meta.top + meta.height * .7);
    ok(cuerpo.classList.contains('arrastrando') && librerias.izq.filas[1][4].classList.contains('destino'), 'arrastre: la ranura de destino se ilumina');
    ev('pointerup', meta.left + meta.width / 2, meta.top + meta.height * .7);
    ok(pos('poema') === 'izq:1:4' && !cuerpo.classList.contains('arrastrando'), 'arrastre: el lomo cae en la ranura izq 1/4');
    // arrastre del lomo a la mesa
    const lomo2 = elDe('girasoles'), rm = $('.mesa').getBoundingClientRect(), r2 = lomo2.getBoundingClientRect();
    const ev2 = (tipo, x, y) => lomo2.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 2, pointerType: 'touch', isPrimary: true }));
    ev2('pointerdown', r2.left + 2, r2.top + 2); ev2('pointermove', r2.left + 40, r2.top + 40);
    ev2('pointermove', rm.left + rm.width / 2, rm.top + rm.height / 2); ev2('pointerup', rm.left + rm.width / 2, rm.top + rm.height / 2);
    ok(estado.mesa.join() === 'girasoles' && pos('girasoles') === '-', 'arrastre del lomo a la mesa: queda de pie');
    // toque simple (sin mover) en el lomo restante: va a la torre
    const lomo3 = elDe('poema'), r3 = lomo3.getBoundingClientRect();
    const ev3 = (tipo, x, y) => lomo3.dispatchEvent(new PointerEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 3, pointerType: 'touch', isPrimary: true }));
    ev3('pointerdown', r3.left + 3, r3.top + 20); ev3('pointerup', r3.left + 5, r3.top + 22);
    ok(estado.mesa.join() === 'girasoles,poema' && $('.torre .libro-torre'), 'toque en el lomo: a la torre');
    // vuelo de la mesa al lector y vuelta (las transiciones tardan .8 s)
    aMesa('poema'); render();
    const rM = elDe('poema').getBoundingClientRect();
    abrirPoema(porId('poema'), -1, true);
    const vs = document.querySelectorAll('.vuelo'), v = vs[vs.length - 1];   // el último: los de los arrastres aún no se han retirado
    ok(!!v && cuerpo.classList.contains('en-lector') && $('#libro').classList.contains('escondido') && parseFloat(v.style.width) > rM.width * 2, 'abrir desde la mesa: el libro vuela al lector');
    setTimeout(() => {
      ok(!$('#libro').classList.contains('escondido') && !bloqueado && !document.querySelector('.vuelo'), 'tras el vuelo: el libro del lector queda a la vista');
      volverASala();
      ok(!cuerpo.classList.contains('en-lector') && !!document.querySelector('.vuelo'), 'volver: vuela de vuelta a la mesa');
      setTimeout(() => {
        ok(!bloqueado && !!elDe('poema') && !elDe('poema').classList.contains('llegando') && !document.querySelector('.vuelo'), 'de vuelta en la sala');
        informar();
      }, 900);
    }, 900);
    function informar(){
      const fallas = res.filter(r => r.startsWith('FALLA'));
      pista((fallas.length ? 'TEST: ' + fallas.length + ' FALLA(S) · ' + fallas.join(' · ') : 'TEST OK') + ' · ' + res.length + ' comprobaciones', 0);
      document.title = fallas.length ? 'TEST FALLA' : 'TEST OK';
      console.log(res.join('\n'));
    }
  }

  // ---- arranque ----
  construir();
  cargarEstado();
  render();
  sala.addEventListener('pointerup', () => { if (window.LECTOR) LECTOR.musica(); });
  const abrirQ = q.get('abrir') || (q.has('p') ? 'poema' : null);
  if (abrirQ && porId(abrirQ)){
    if (!estado.mesa.includes(abrirQ)){ aMesa(abrirQ); render(); }
    const l = porId(abrirQ);
    if (l.tipo === 'poema') abrirPoema(l, q.has('p') ? (parseInt(q.get('p'), 10) || 0) : -1, false);
    else abrirGirasoles(l);
  }
  if (q.has('test')) autoTest();
})();
