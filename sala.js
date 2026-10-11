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
//    ?abrir=poema | girasoles | suenos | album | calendario   abre ese libro directamente
//    ?p=N                    abre el poema (o el ?abrir= de tipo album/calendario) en la página N
//    ?clave=N                el número de un libro con candado (no se guarda)
//    ?hoy=AAAA-MM-DD         la fecha que el calendario toma por hoy
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
  const SOLO_LECTURA = ['mesa', 'abrir', 'p', 'lleno', 'nota', 'limpio', 'test', 'clave'].some(k => q.has(k));
  const conCandado = l => !!(l.candado && window.CANDADO);

  // ---- el catálogo ----
  const CAT = ((typeof LIBROS !== 'undefined' && Array.isArray(LIBROS)) ? LIBROS : []).map((l, i) => {
    const o = Object.assign({}, l);
    if (!o.id) o.id = 'libro' + i;
    if (o.tipo === 'poema' && o.datos){ o.titulo = o.titulo || o.datos.titulo || 'Sin título'; o.tapa = o.tapa || o.datos.tapa; }
    if (o.tipo === 'album' || o.tipo === 'calendario') o.datos = o;      // el lector lee titulo/tapa/paginas del propio catálogo
    if (o.tipo === 'carta'){ o.titulo = o.titulo || 'Carta'; if (window.CARTA) o.carta = CARTA.normalizar(o); }   // la carta (carta.js): un sobre, no un libro
    o.titulo = o.titulo || 'Libro';
    if (!TAP[o.tapa]) o.tapa = 'burdeos';
    return o;
  }).filter(o => (o.tipo !== 'poema' || o.datos) && (o.tipo !== 'carta' || !!window.CARTA));
  const porId = id => CAT.find(l => l.id === id);
  const esCarta = o => !!o && o.tipo === 'carta';

  // ---- el estado: qué hay en la mesa, en qué ranura está cada libro y qué cartas están atadas en el fajo ----
  let estado = { mesa: [], estantes: {}, fajo: [] };
  const clave = p => p.lado + ':' + p.fila + ':' + p.col;
  const posValida = p => !!p && LADOS.includes(p.lado) && p.fila >= 0 && p.fila < FILAS && p.col >= 0 && p.col < COLS;
  const cubiertas = {};                        // ranuras tapadas por un adorno (clave -> 'adorno:<id>'): ahí no cabe un libro
  // el FAJO de cartas (el cordón: `const FAJO = { lado, fila, col }` en libros.js): hasta 100 cartas atadas en dos ranuras de la librería
  const FAJO_MAX = 100, FAJO_ANCHO = 2, FAJO_DEF = { lado: 'der', fila: 4, col: 6 };
  const tieneFajo = () => typeof FAJO !== 'undefined' && !!FAJO;
  let fajoPos = null;                          // adónde lo mudó la persona (va en el estado guardado)
  const posFajo = () => { const p = fajoPos || (typeof FAJO === 'object' && FAJO) || FAJO_DEF; return posValida(p) ? { lado: p.lado, fila: p.fila | 0, col: Math.min(COLS - FAJO_ANCHO, p.col | 0) } : FAJO_DEF; };
  const enFajo = p => { if (!tieneFajo()) return false; const f = posFajo(); return p.lado === f.lado && p.fila === f.fila && p.col >= f.col && p.col < f.col + FAJO_ANCHO; };
  // (una carta acostada no ocupa la ranura: comparte el sitio con un libro, y dos cartas pueden ir en la misma; el fajo sí ocupa las suyas)
  function ocupada(p, salvo){
    if (cubiertas[clave(p)]) return cubiertas[clave(p)];
    if (enFajo(p)) return 'fajo';
    for (const id in estado.estantes){ if (id !== salvo && !esCarta(porId(id)) && clave(estado.estantes[id]) === clave(p)) return id; }
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
    const h = (esCarta(porId(id)) ? (!!cubiertas[clave(p)] || ocupada(p, id) === 'fajo') : !!ocupada(p, id)) ? huecoCerca(p, id) : p;     // la carta solo esquiva adornos y fajo
    if (!h) return false;
    estado.estantes[id] = { lado: h.lado, fila: h.fila | 0, col: h.col | 0 };
    return true;
  }
  function guardar(){
    if (SOLO_LECTURA) return;
    try { localStorage.setItem(CLAVE, JSON.stringify(Object.assign({}, estado, fajoPos ? { fajoPos } : {}))); } catch (e) {}
  }
  function cargarEstado(){
    let s = null;
    if (!q.has('limpio') && !q.has('test')){ try { s = JSON.parse(localStorage.getItem(CLAVE)); } catch (e) {} }
    estado = { mesa: [], estantes: {}, fajo: [] };
    if (s && typeof s === 'object'){
      if (Array.isArray(s.mesa)) estado.mesa = s.mesa.filter((id, i, a) => porId(id) && a.indexOf(id) === i);
      if (Array.isArray(s.fajo)) estado.fajo = s.fajo.filter((id, i, a) => esCarta(porId(id)) && a.indexOf(id) === i && !estado.mesa.includes(id)).slice(0, FAJO_MAX);
      if (s.estantes && typeof s.estantes === 'object') for (const id in s.estantes){
        const p = s.estantes[id];
        if (porId(id) && posValida(p) && !estado.mesa.includes(id) && !estado.fajo.includes(id)) estado.estantes[id] = { lado: p.lado, fila: p.fila | 0, col: p.col | 0 };
      }
      if (posValida(s.fajoPos)) fajoPos = { lado: s.fajoPos.lado, fila: s.fajoPos.fila | 0, col: s.fajoPos.col | 0 };
    }
    if (!tieneFajo()) estado.fajo = [];
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
      if (estado.mesa.includes(l.id) || estado.estantes[l.id] || estado.fajo.includes(l.id)) continue;
      colocar(l.id, posValida(l.estante) ? l.estante : { lado: 'izq', fila: 0, col: 0 });
    }
    desalojarFajo();
  }
  // lo que haya en las ranuras del fajo se corre al hueco vecino
  function desalojarFajo(){
    if (!tieneFajo()) return;
    for (const id in estado.estantes){ if (enFajo(estado.estantes[id])){ const h = huecoCerca(estado.estantes[id], id); if (h) estado.estantes[id] = h; } }
  }
  // ---- el fajo: atar una carta, desatarla (a la mesa) y mudarlo de ranura ----
  function aFajo(id){
    estado.fajo = estado.fajo || [];
    if (!tieneFajo() || !esCarta(porId(id)) || estado.fajo.includes(id) || estado.fajo.length >= FAJO_MAX) return false;
    const i = estado.mesa.indexOf(id); if (i >= 0) estado.mesa.splice(i, 1);
    delete estado.estantes[id]; estado.fajo.push(id); guardar(); return true;
  }
  function delFajo(id){
    estado.fajo = estado.fajo || [];
    const i = estado.fajo.indexOf(id); if (i < 0) return false;
    estado.fajo.splice(i, 1); aMesa(id); return true;
  }
  function moverFajo(p){
    if (!tieneFajo() || !posValida(p)) return false;
    p = { lado: p.lado, fila: p.fila | 0, col: Math.min(COLS - FAJO_ANCHO, p.col | 0) };
    for (let k = 0; k < FAJO_ANCHO; k++) if (cubiertas[clave({ lado: p.lado, fila: p.fila, col: p.col + k })]) return false;    // encima de un adorno no
    fajoPos = p; desalojarFajo(); guardar(); return true;
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
  const estilo = l => { if (esCarta(l)) return CARTA.estilo(l); const c = colores(l.tapa); return '--c1:' + c[0] + ';--c2:' + c[1] + ';--c3:' + c[2]; };
  const elDe = id => sala.querySelector('[data-id="' + id + '"]');
  // un DOMRect no se copia con Object.assign (sus medidas son getters): se aplana a mano
  const plano = (r, css) => ({ left: r.left, top: r.top, width: r.width, height: r.height, css: css || '' });

  function render(){
    sala.querySelectorAll('.lomo, .libro-mesa, .libro-torre, .carta-estante, .carta-mesa, .carta-torre, .fajo-cartas').forEach(e => e.remove());
    estado.fajo = estado.fajo || [];
    if (tieneFajo()){                                            // el fajo de cartas, en sus ranuras
      const p = posFajo(), fj = document.createElement('div');
      fj.className = 'fajo-cartas'; fj.title = 'Cartas atadas: ' + estado.fajo.length + ' de ' + FAJO_MAX;
      const cols = estado.fajo.slice(0, 4).map(id => CARTA.colores(porId(id))[0]);
      while (cols.length < 4) cols.push(cols.length % 2 ? '#e7c9a9' : '#f1e4c4');
      fj.innerHTML = '<span class="pila">' + cols.map(c => '<i style="background:linear-gradient(180deg,' + c + ', rgba(0,0,0,.08))"></i>').join('') + '</span><i class="cordon v"></i><i class="cordon h"></i><i class="nudo"></i>' +
        (estado.fajo.length ? '<b class="cuenta">' + estado.fajo.length + '</b>' : '');
      librerias[p.lado].filas[p.fila][p.col].appendChild(fj);
      engancharFajo(fj);
    }
    for (const id in estado.estantes){
      const l = porId(id), p = estado.estantes[id];
      const lomo = document.createElement('div');
      lomo.dataset.id = id; lomo.style.cssText = estilo(l); lomo.title = l.titulo;
      if (esCarta(l)){                                           // acostada al pie de la ranura, delante del lomo que haya
        lomo.className = 'carta-estante'; lomo.innerHTML = CARTA.sobre(l, 'chico') + '<i class="toque"></i>';
      } else {
        lomo.className = 'lomo';
        lomo.innerHTML = '<span class="rotulo">' + esc(l.lomo || l.titulo) + '</span><i class="toque"></i>' + (l.candado ? '<i class="candado-lomo"></i>' : '');
      }
      librerias[p.lado].filas[p.fila][p.col].appendChild(lomo);
      enganchar(lomo, id, 'estante');
    }
    const lugar = $('.lugar'), torre = $('.torre');
    estado.mesa.forEach((id, i) => {
      const l = porId(id);
      const b = document.createElement('div');
      b.dataset.id = id; b.style.cssText = estilo(l); b.title = l.titulo;
      if (i === 0){
        if (esCarta(l)){ b.className = 'carta-mesa'; b.innerHTML = CARTA.sobre(l); }
        else {
          b.className = 'libro-mesa piel';
          b.innerHTML = '<span class="titulo-mesa">' + esc(l.titulo) + '</span>' +
            (l.candado ? '<i class="candado-mesa' + (conCandado(l) && CANDADO.listo(l) ? ' abierto' : '') + '"></i>' : '');
        }
        lugar.appendChild(b); enganchar(b, id, 'mesa');
      } else {
        b.className = esCarta(l) ? 'carta-torre' : 'libro-torre';
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
    if (esCarta(l)){ a.fant.className = 'arrastre carta'; a.fant.style.cssText = estilo(l) + ';width:78px;height:52px;padding:0;background:none;box-shadow:none'; a.fant.innerHTML = CARTA.sobre(l, 'chico'); }
    else { a.fant.className = 'arrastre piel'; a.fant.style.cssText = estilo(l); a.fant.innerHTML = '<span class="titulo-mesa">' + esc(l.titulo) + '</span>'; }
    document.body.appendChild(a.fant);
    a.el.classList.add('fantasma');
    cuerpo.classList.add('arrastrando');
    a.ranuras = [];
    for (const lado of LADOS) librerias[lado].filas.forEach((fila, f) => fila.forEach((r, c) => a.ranuras.push({ el: r, r: r.getBoundingClientRect(), lado, fila: f, col: c })));
    a.libs = LADOS.map(lado => ({ lado, r: librerias[lado].el.getBoundingClientRect() }));
    a.mesaEl = $('.mesa'); a.mesaR = a.mesaEl.getBoundingClientRect();
    const fj = sala.querySelector('.fajo-cartas'); a.fajoEl = (fj && esCarta(l)) ? fj : null; a.fajoR = a.fajoEl ? a.fajoEl.getBoundingClientRect() : null;
    a.destino = null;
  }
  function mover(e){
    const a = arrastre; if (!a || !a.activo) return;
    a.fant.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px) translate(-50%,-72%) rotate(-6deg)';
    let d = null;
    const lib = a.libs.find(x => dentro(e, x.r, 6));
    if (a.fajoEl && dentro(e, a.fajoR, 10) && estado.fajo.length < FAJO_MAX) d = { tipo: 'fajo', el: a.fajoEl };   // una carta sobre el fajo: se ata
    else if (lib){
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
    else if (d && d.tipo === 'fajo'){ const rfj = d.el.getBoundingClientRect(); volar(rf, rfj, null, false); aFajo(a.id); render(); }
    else volar(rf, a.el.getBoundingClientRect(), a.el, false);       // vuelve solo a su sitio
  }
  // el fajo: un toque lo abre (la lista de cartas atadas: tocar una la lleva a la mesa); arrastrarlo lo muda de ranura
  let fajoPanel = null;
  function engancharFajo(el){
    let ar = null;
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0 || bloqueado || arrastre) return;
      e.preventDefault(); e.stopPropagation(); try { el.setPointerCapture(e.pointerId); } catch (x) {}
      ar = { x0: e.clientX, y0: e.clientY, activo: false, fant: null, destino: null };
    });
    el.addEventListener('pointermove', e => {
      if (!ar) return;
      if (!ar.activo){
        if (Math.hypot(e.clientX - ar.x0, e.clientY - ar.y0) < 9) return;
        ar.activo = true; ar.fant = el.cloneNode(true); ar.fant.classList.add('fajo-fantasma'); document.body.appendChild(ar.fant); el.classList.add('fantasma'); cuerpo.classList.add('arrastrando');
      }
      ar.fant.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px) translate(-50%,-60%)';
      const r = ranuraBajo(e.clientX, e.clientY);
      if (ar.destino && (!r || ar.destino.el !== r.el)) ar.destino.el.classList.remove('destino');
      if (r && !cubiertas[clave(r)]) { r.el.classList.add('destino'); ar.destino = r; } else ar.destino = null;
    });
    const fin = e => {
      if (!ar) return; const a = ar; ar = null;
      if (!a.activo){ abrirFajo(); return; }
      a.fant.remove(); el.classList.remove('fantasma'); cuerpo.classList.remove('arrastrando');
      if (a.destino){ a.destino.el.classList.remove('destino'); if (moverFajo({ lado: a.destino.lado, fila: a.destino.fila, col: a.destino.col })) render(); }
    };
    el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin);
  }
  function abrirFajo(){
    if (!fajoPanel){ fajoPanel = document.createElement('div'); fajoPanel.id = 'fajo-panel'; document.body.appendChild(fajoPanel); fajoPanel.addEventListener('pointerdown', e => { if (e.target === fajoPanel) cerrarFajo(); }); }
    const items = estado.fajo.map(id => { const l = porId(id); return '<div class="item" data-id="' + esc(id) + '">' + CARTA.sobre(l, 'chico') + '<span>' + esc(l.titulo) + '</span></div>'; }).join('');
    fajoPanel.innerHTML = '<div class="caja" role="dialog" aria-label="Cartas atadas"><h4>Cartas atadas · ' + estado.fajo.length + ' / ' + FAJO_MAX + '<button type="button" class="cerrar" aria-label="Cerrar">✕</button></h4>' +
      (items || '<div class="vacio">No hay cartas atadas. Arrastra una carta hasta el fajo para atarla.</div>') + '</div>';
    fajoPanel.hidden = false;
    fajoPanel.querySelector('.cerrar').onclick = cerrarFajo;
    fajoPanel.querySelectorAll('.item').forEach(it => { it.onclick = () => { cerrarFajo(); flip(() => delFajo(it.dataset.id)); }; });
  }
  function cerrarFajo(){ if (fajoPanel) fajoPanel.hidden = true; }
  // la ranura bajo un punto de la pantalla (para mudar el fajo): null si no hay librería ahí
  function ranuraBajo(x, y){
    for (const lado of LADOS){
      const lib = librerias[lado]; if (!lib) continue;
      const r = lib.el.getBoundingClientRect(); if (x < r.left - 6 || x > r.right + 6 || y < r.top - 6 || y > r.bottom + 6) continue;
      let fila = 0;
      lib.filas.forEach((f, i) => { if (y >= f[0].getBoundingClientRect().top) fila = Math.max(fila, i); });
      let mejor = null, md = Infinity;
      lib.filas[fila].forEach((el, col) => { const rr = el.getBoundingClientRect(), d = Math.abs(rr.left + rr.width / 2 - x); if (d < md){ md = d; mejor = { lado, fila, col, el }; } });
      return mejor;
    }
    return null;
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
    // con candado: primero el número (o la clave que recuerda el navegador); las fotos se descifran y recién entonces se abre
    if (conCandado(l) && !CANDADO.listo(l)){ CANDADO.pedir(l, () => abrirLibro(id)); return; }
    if (esLibroDePaginas(l)) abrirPoema(l, -1, true);
    else if (l.tipo === 'girasoles') abrirGirasoles(l);
    else if (esCarta(l)) abrirCarta(l);
  }
  function abrirCarta(l){
    bloqueado = true; pistaS.classList.remove('ver');
    CARTA.mostrar(l, { alTerminar: () => { bloqueado = false; } });
  }
  // el poema, los álbumes y el calendario se leen en el lector; el calendario escribe sus páginas con la fecha de hoy
  function esLibroDePaginas(l){
    if (l.tipo === 'calendario'){ if (window.CALENDARIO) CALENDARIO.preparar(l); return true; }
    return l.tipo === 'poema' || l.tipo === 'album';
  }
  document.addEventListener('candado-abierto', () => render());     // el candadito de la mesa pasa a abierto
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
    estado = { mesa: [], estantes: {}, fajo: [] };
    for (const l of CAT) colocar(l.id, l.estante);
    // la carta y el fajo: la carta no ocupa ranura; con FAJO definido, una carta se ata, se desata a la mesa y el fajo se muda
    if (porId('carta')){
      aMesa('poema'); aEstante('poema', { lado: 'der', fila: 2, col: 6 });
      ok(pos('poema') === 'der:2:6' && pos('carta') === 'der:2:6', 'carta: comparte la ranura con un libro sin correrlo');
      aMesa('poema'); aEstante('poema', { lado: 'izq', fila: 0, col: 1 });
      if (tieneFajo()){
        render();
        ok(!!sala.querySelector('.fajo-cartas') && ocupada(posFajo(), null) === 'fajo', 'fajo: aparece en su esquina y ocupa sus ranuras');
        const atada = aFajo('carta'); render();
        ok(atada && estado.fajo.join() === 'carta' && !elDe('carta') && sala.querySelector('.fajo-cartas .cuenta').textContent === '1', 'fajo: la carta atada sale de la librería y el fajo la cuenta');
        ok(delFajo('carta') && !estado.fajo.length && estado.mesa.includes('carta'), 'fajo: desatarla la lleva a la mesa');
        ok(moverFajo({ lado: 'izq', fila: 4, col: 0 }) && clave(posFajo()) === 'izq:4:0', 'fajo: se muda de ranura');
        aEstante('carta', { lado: 'der', fila: 2, col: 6 });
      }
    }
    ok(pos('poema') === 'izq:0:1' && pos('girasoles') === 'der:0:5', 'nacen en su estante');
    ok(pos('suenos') === 'izq:1:3' && pos('album') === 'der:1:2' && porId('album').datos.paginas.length >= 1, 'los álbumes nacen en su estante con sus páginas');
    // el calendario: nace con candado y, con unos días de prueba, escribe sus páginas y sus marcas
    const cal = porId('calendario');
    ok(!!cal && pos('calendario') === 'izq:0:5' && !!cal.candado && !!cal.cifrado && !!window.CALENDARIO, 'el calendario nace en su estante con candado');
    ok(!!window.GATOS_SALA && GATOS_SALA.lista().length === 4 && sala.querySelectorAll('.centro .gato .dibujo-gato').length === 4, 'los cuatro gatos andan por la sala');
    ok(!!window.GATOS_SALA && GATOS_SALA.poses.join() === 'parado,sentado,echado' && ['parado', 'sentado', 'echado'].every(p => /data-pose="/.test(GATOS_SALA.svg('carey', p)) && GATOS_SALA.svg('carey', p).includes('class="cabeza"')),
      'cada gato se dibuja en tres poses');
    // los fondos a elección: la temporada manda cuando está en automático, y elegir una pieza la cambia (con ?test=1 no se guarda nada)
    if (window.FONDOS_SALA){
      const t = FONDOS_SALA.porTemporada;
      ok(t(new Date(2026, 11, 20)).pared === 'navidad' && t(new Date(2026, 1, 10)).pared === 'sanvalentin' && t(new Date(2026, 3, 10)).pared === 'otono' && t(new Date(2026, 9, 11)).pared === 'primavera',
        'fondos: diciembre es Navidad, febrero San Valentín, abril otoño y octubre primavera');
      const antes = FONDOS_SALA.eleccion().pared;
      FONDOS_SALA.elegir('pared', 'rosa'); ok(FONDOS_SALA.eleccion().pared === 'rosa' && FONDOS_SALA.vivo().pared === 'rosa', 'fondos: elegir una pared la pone');
      FONDOS_SALA.elegir('pared', 'css'); ok(FONDOS_SALA.vivo().pared === 'css' && FONDOS_SALA.eleccion().pared === 'css', 'fondos: el dibujo de siempre vuelve');
      FONDOS_SALA.elegir('pared', antes);
    } else ok(false, 'fondos: el selector no cargó');
    // los adornos tapan ranuras: un libro mandado ahí se corre al hueco vecino, y al quitar el adorno la ranura vuelve a servir
    if (window.SALA_ADORNOS){
      const soltar = SALA_ADORNOS.probar({ lado: 'der', fila: 4, col: 0 }, 2);
      aMesa('poema'); aEstante('poema', { lado: 'der', fila: 4, col: 0 });
      ok(pos('poema') === 'der:4:2', 'adornos: la ranura tapada manda el libro al hueco vecino');
      soltar(); aMesa('poema'); aEstante('poema', { lado: 'der', fila: 4, col: 0 });
      ok(pos('poema') === 'der:4:0', 'adornos: al quitar el adorno la ranura vuelve a servir');
      aMesa('poema'); aEstante('poema', { lado: 'izq', fila: 0, col: 1 });
    } else ok(false, 'adornos: no cargaron');
    if (cal && window.CALENDARIO){
      const D = { dias: [{ fecha: '2026-10-11', nombre: 'Inicio', inicio: true }, { dia: 30, mes: 9, nombre: 'Autitos', icono: 'auto' }] };
      const ev = (y, m) => CALENDARIO.eventos(D, y, m).map(e => e.d + ':' + e.nombre).join('|');
      ok(ev(2026, 9) === '11:Inicio' && ev(2026, 10) === '11:1 mes juntos' && ev(2027, 9) === '11:1 año juntos' && ev(2027, 8) === '11:11 meses juntos|30:Autitos' && ev(2026, 8) === '30:Autitos',
        'calendario: el inicio marca cada mes y cada año; los días del año se repiten');
      const px = CALENDARIO.proximos(D, new Date(2026, 9, 7), 3).map(e => e.dias + ':' + e.nombre).join('|');
      ok(px === '4:Inicio|35:1 mes juntos|65:2 meses juntos' && CALENDARIO.paginas(new Date(2026, 9, 7)).length === 13 && CALENDARIO.paginas(new Date(2026, 9, 7))[1].mes === '2026-10',
        'calendario: lo que viene se cuenta desde hoy y hay doce meses desde el mes en curso');
    }
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

  // ---- los adornos de las librerías (ADORNOS en catalogo.js): tapan ranuras y los libros se corren ----
  const ADS = (typeof ADORNOS !== 'undefined' && Array.isArray(ADORNOS)) ? ADORNOS : [];
  let adornosOcultos = new Set((window.FONDOS_SALA && FONDOS_SALA.adornosOcultos) ? FONDOS_SALA.adornosOcultos() : []);
  const ranurasDe = a => {
    const n = Math.max(1, Math.min((a.ancho | 0) || 1, COLS - a.estante.col)), out = [];
    for (let k = 0; k < n; k++) out.push({ lado: a.estante.lado, fila: a.estante.fila, col: a.estante.col + k });
    return out;
  };
  function cubrir(a){ for (const r of ranurasDe(a)) cubiertas[clave(r)] = 'adorno:' + a.id; }
  function descubrir(a){ for (const r of ranurasDe(a)) if (cubiertas[clave(r)] === 'adorno:' + a.id) delete cubiertas[clave(r)]; }
  // los libros que quedaron debajo de un adorno se corren al hueco vecino
  function desalojar(){
    let movio = false;
    for (const id in estado.estantes){
      const p = estado.estantes[id];
      if (cubiertas[clave(p)]){ const h = huecoCerca(p, id); if (h){ estado.estantes[id] = h; movio = true; } }
    }
    if (movio){ guardar(); render(); }
  }
  function pintarAdorno(a){
    // (.adorno-estante: ".adorno" ya es el filete del lector, no se puede reutilizar)
    sala.querySelectorAll('.adorno-estante[data-adorno="' + a.id + '"]').forEach(e => e.remove());
    if (adornosOcultos.has(a.id) || !a._img) return;
    const r = a.estante, el = document.createElement('img');
    el.className = 'adorno-estante'; el.dataset.adorno = a.id; el.alt = ''; el.draggable = false; el.title = a.nombre || '';
    el.src = a._img; el.style.setProperty('--ancho', ranurasDe(a).length);
    librerias[r.lado].filas[r.fila][r.col].appendChild(el);
  }
  function aplicarAdornos(){
    for (const a of ADS){ descubrir(a); if (a._img && !adornosOcultos.has(a.id) && posValida(a.estante)) cubrir(a); }
    desalojar();
    for (const a of ADS) pintarAdorno(a);
  }
  function cargarAdornos(){
    for (const a of ADS){
      if (!posValida(a.estante)) continue;
      const ruta = a.imagen || ('assets/adornos/' + a.id + '.webp'), im = new Image();
      im.onload = () => { a._img = ruta; aplicarAdornos(); };
      im.onerror = () => {};                                   // sin imagen: no ocupa nada
      im.src = ruta;
    }
  }
  window.SALA_ADORNOS = {
    lista: () => ADS,
    ocultar: ids => { adornosOcultos = new Set(ids || []); aplicarAdornos(); },
    cubiertas: () => Object.assign({}, cubiertas),
    // para la prueba: tapar ranuras a mano, sin imagen; devuelve la función que las destapa
    probar: (p, ancho) => { const a = { id: 'prueba', estante: p, ancho }; cubrir(a); desalojar(); return () => { descubrir(a); }; },
  };
  // la sala para pruebas y capturas: la carta y el fajo
  window.SALA = { libros: () => CAT.slice(), porId, abrir: abrirLibro, estado: () => JSON.parse(JSON.stringify(estado)), ranuraBajo,
    aFajo: id => { const ok = aFajo(id); if (ok) render(); return ok; }, delFajo: id => { const ok = delFajo(id); if (ok) render(); return ok; }, moverFajo: p => { const ok = moverFajo(p); if (ok) render(); return ok; }, fajo: () => estado.fajo.slice(), posFajo };

  // ---- arranque ----
  construir();
  cargarEstado();
  render();
  cargarAdornos();
  sala.addEventListener('pointerup', () => { if (window.LECTOR) LECTOR.musica(); });
  const abrirQ = q.get('abrir') || (q.has('p') ? 'poema' : null);
  if (abrirQ && porId(abrirQ)){
    if (!estado.mesa.includes(abrirQ)){ aMesa(abrirQ); render(); }
    const l = porId(abrirQ);
    const abrirDirecto = () => {
      if (esLibroDePaginas(l)) abrirPoema(l, q.has('p') ? (parseInt(q.get('p'), 10) || 0) : -1, false);
      else if (esCarta(l)) abrirCarta(l);
      else abrirGirasoles(l);
    };
    if (conCandado(l) && !CANDADO.listo(l)) CANDADO.pedir(l, abrirDirecto, q.get('clave'));   // ?clave=N abre sin preguntar
    else abrirDirecto();
  }
  if (q.has('test')) autoTest();
})();
