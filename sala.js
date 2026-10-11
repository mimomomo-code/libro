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
  const SOLO_LECTURA = ['mesa', 'abrir', 'p', 'lleno', 'nota', 'limpio', 'test', 'clave', 'borrador'].some(k => q.has(k));
  const conCandado = l => !!(l.candado && window.CANDADO);

  // ---- el catálogo: los libros de libros.js, los que escribió la pareja (CUENTA) y el borrador del creador ----
  function normalizar(l, i){
    const o = Object.assign({}, l);
    if (!o.id) o.id = 'libro' + i;
    if (o.tipo === 'poema' && o.datos){ o.titulo = o.titulo || o.datos.titulo || 'Sin título'; o.tapa = o.tapa || o.datos.tapa; }
    if (o.tipo === 'album' || o.tipo === 'calendario') o.datos = o;      // el lector lee titulo/tapa/paginas del propio catálogo
    if (o.tipo === 'carta'){ o.titulo = o.titulo || 'Carta'; if (window.CARTA) o.carta = CARTA.normalizar(o); }   // la carta (carta.js): un sobre, no un libro
    o.titulo = o.titulo || 'Libro';
    if (!TAP[o.tapa]) o.tapa = 'burdeos';
    return o;
  }
  const valido = o => (o.tipo !== 'poema' || !!o.datos) && (o.tipo !== 'carta' || !!window.CARTA);
  const esCarta = o => !!o && o.tipo === 'carta';
  const CAT = ((typeof LIBROS !== 'undefined' && Array.isArray(LIBROS)) ? LIBROS : []).map(normalizar).filter(valido);
  if (window.CUENTA) for (const l of CUENTA.libros()){ const o = normalizar(l, CAT.length); if (valido(o) && !CAT.some(x => x.id === o.id)) CAT.push(o); }
  if (q.has('borrador')){                                       // ?borrador=1: la vista previa del creador (localStorage 'libro.borrador.v1')
    try { const b = JSON.parse(localStorage.getItem('libro.borrador.v1') || 'null'); if (b && b.tipo){ b.id = 'borrador'; const o = normalizar(b, 0); if (valido(o)) CAT.push(o); } } catch (e) {}
  }
  const porId = id => CAT.find(l => l.id === id);

  // ---- el estado: qué hay en la mesa, en qué ranura está cada libro (y cada montón de cartas) y las torres de cartas ----
  let estado = { mesa: [], estantes: {}, torres: [] };
  const clave = p => p.lado + ':' + p.fila + ':' + p.col;
  const posValida = p => !!p && LADOS.includes(p.lado) && p.fila >= 0 && p.fila < FILAS && p.col >= 0 && p.col < COLS;
  const cubiertas = {};                        // ranuras tapadas por un adorno (clave -> 'adorno:<id>'): ahí no cabe un libro
  // LAS CARTAS EN LA LIBRERÍA van en MONTONES: las que comparten posición forman uno (hasta 10), visto de canto con su cinta,
  // que ocupa DOS ranuras (col y col + 1). LAS TORRES son el cordón: cada cordón comprado (CUENTA.cordones(); en la sala
  // personal, TORRES_CARTAS en libros.js) es una torre de hasta 100 cartas, un objeto suelto en la sala (en el suelo, al
  // costado de las librerías o los sillones, sobre la mesa) que se arrastra y se apila sobre otra torre, hasta 5 de alto.
  // El montón acostado: hasta 5 cartas sueltas y, de ahí, atadas de a 5 (4 atados = 20). Entre dos libros juntos, DE PIE en el
  // hueco entre ranuras (9 huecos por estante: col 0..8, el hueco a la izquierda de la ranura col), cabe UNA sola carta.
  const MONTON_MAX = 20, MONTON_ATADO = 5, MONTON_ANCHO = 2, TORRE_MAX = 100, TORRES_ALTO = 5;
  const nTorres = () => window.CUENTA ? (CUENTA.cordones ? CUENTA.cordones() : (CUENTA.tiene('mejora', 'cordon') ? 1 : 0)) : (typeof TORRES_CARTAS === 'number' ? TORRES_CARTAS : 0);
  const montones = () => { const m = {}; for (const id in estado.estantes){ const p = estado.estantes[id]; if (!esCarta(porId(id)) || p.hueco) continue; const k = clave(p); (m[k] = m[k] || { pos: p, ids: [] }).ids.push(id); } return m; };
  const enHueco = p => { for (const id in estado.estantes){ const x = estado.estantes[id]; if (x.hueco && x.lado === p.lado && x.fila === p.fila && x.col === p.col) return id; } return null; };
  // el montón que cubre esa ranura (empieza en ella o en la de su izquierda), si lo hay
  function montonEn(p){
    const M = montones();
    for (const k in M){ const s = M[k].pos; if (s.lado === p.lado && s.fila === p.fila && p.col >= s.col && p.col < s.col + MONTON_ANCHO) return M[k]; }
    return null;
  }
  // el montón OCUPA sus dos ranuras: ahí no entra un libro (y el hueco del medio, entre sus dos ranuras, se pierde para la carta de pie)
  function ocupada(p, salvo){
    if (cubiertas[clave(p)]) return cubiertas[clave(p)];
    const m = montonEn(p); if (m && !(m.ids.length === 1 && m.ids[0] === salvo)) return 'monton';
    for (const id in estado.estantes){ if (id !== salvo && !esCarta(porId(id)) && clave(estado.estantes[id]) === clave(p)) return id; }
    return null;
  }
  // el hueco k (a la izquierda de la ranura k) está perdido si cae en medio de un montón (el que empieza en k - 1)
  const huecoPerdido = p => { const m = montonEn({ lado: p.lado, fila: p.fila, col: p.col - 1 }); return !!m && m.pos.col === p.col - 1; };
  // en la mesa caben pocas cartas a la vez (la pila de la torre de la mesa): el resto espera en la librería o en las torres
  const MESA_CARTAS = 5;
  const cartasEnMesa = () => estado.mesa.filter(id => esCarta(porId(id))).length;
  const cabeEnMesa = id => !esCarta(porId(id)) || estado.mesa.includes(id) || cartasEnMesa() < MESA_CARTAS;
  const avisoMesaLlena = () => pista('En la mesa caben ' + MESA_CARTAS + ' cartas: guarda alguna en la librería o en una torre', 4500);
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
    if (esCarta(porId(id))) return colocarCarta(id, p);
    const h = ocupada(p, id) ? huecoCerca(p, id) : p;
    if (!h) return false;
    estado.estantes[id] = { lado: h.lado, fila: h.fila | 0, col: h.col | 0 };
    return true;
  }
  // una carta va a un montón: al que haya en esa ranura (si le cabe) o a un sitio libre de dos ranuras cerca
  // dos ranuras libres de verdad para un montón nuevo: sin adorno, sin libro y sin otro montón
  const libre2 = (lado, fila, c) => c >= 0 && c + MONTON_ANCHO <= COLS && !ocupada({ lado, fila, col: c }) && !ocupada({ lado, fila, col: c + 1 });
  const huecoLibre = p => p.col >= 0 && p.col <= COLS && !enHueco(p) && !huecoPerdido(p);
  function colocarCarta(id, p){
    delete estado.estantes[id];
    if (p.hueco){                                                     // de pie entre dos libros: ese hueco o el libre más cercano de la fila
      let mejor = null, md = Infinity;
      for (let k = 0; k <= COLS; k++){ if (!huecoLibre({ lado: p.lado, fila: p.fila, col: k })) continue; const d = Math.abs(k - p.col); if (d < md){ md = d; mejor = k; } }
      if (mejor != null){ estado.estantes[id] = { lado: p.lado, fila: p.fila | 0, col: mejor, hueco: true }; return true; }
      p = { lado: p.lado, fila: p.fila, col: Math.min(p.col, COLS - 1) };
    }
    const m = montonEn(p);
    if (m && m.ids.length < MONTON_MAX){ estado.estantes[id] = Object.assign({}, m.pos); return true; }
    let mejor = null, md = Infinity;
    for (const lado of LADOS) for (let f = 0; f < FILAS; f++) for (let c = 0; c <= COLS - MONTON_ANCHO; c++){
      const x = { lado, fila: f, col: c }, mm = montonEn(x);
      if (mm ? (mm.ids.length >= MONTON_MAX || mm.pos.col !== c) : !libre2(lado, f, c)) continue;
      const d = (lado === p.lado ? 0 : 1000) + Math.abs(f - p.fila) * 10 + Math.abs(c - Math.min(p.col, COLS - MONTON_ANCHO));
      if (d < md){ md = d; mejor = x; }
    }
    if (!mejor){                                                      // sin sitio para acostarla: a un hueco libre, el más cercano
      for (const lado of LADOS) for (let f = 0; f < FILAS; f++) for (let k = 0; k <= COLS; k++){
        if (!huecoLibre({ lado, fila: f, col: k })) continue;
        const d = (lado === p.lado ? 0 : 1000) + Math.abs(f - p.fila) * 10 + Math.abs(k - p.col);
        if (d < md){ md = d; mejor = { lado, fila: f, col: k, hueco: true }; }
      }
    }
    if (!mejor) return false;
    estado.estantes[id] = mejor;
    if (!mejor.hueco) desalojarMonton(mejor);
    return true;
  }
  // un montón recién puesto echa de sus dos ranuras al libro que hubiera y del hueco del medio a la carta de pie
  function desalojarMonton(pos){
    for (const id of Object.keys(estado.estantes)){
      const x = estado.estantes[id], l = porId(id);
      if (x.lado !== pos.lado || x.fila !== pos.fila) continue;
      if (!esCarta(l) && x.col >= pos.col && x.col < pos.col + MONTON_ANCHO){ const h = huecoCerca(x, id); if (h) estado.estantes[id] = h; }
      else if (esCarta(l) && x.hueco && x.col === pos.col + 1) colocarCarta(id, Object.assign({}, x));
    }
  }
  // mudar un montón entero (todas sus cartas juntas)
  function moverMonton(ids, p){
    const resto = ids.slice(1);
    for (const id of ids) delete estado.estantes[id];
    if (!colocarCarta(ids[0], p)) return false;
    for (const id of resto) estado.estantes[id] = Object.assign({}, estado.estantes[ids[0]]);
    guardar(); return true;
  }
  function guardar(){
    if (SOLO_LECTURA) return;
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) {}
  }
  // ---- las torres: tantas como cordones; las nuevas nacen al costado de la librería derecha, apiladas sobre la anterior ----
  const torrePorId = tid => estado.torres.find(t => t.id === tid);
  const torreDe = id => estado.torres.find(t => t.cartas.includes(id));
  const alturaPila = tid => { let n = 0, t = torrePorId(tid), vistos = new Set(); while (t && !vistos.has(t.id)){ vistos.add(t.id); n++; t = t.sobre ? torrePorId(t.sobre) : null; } return n; };
  const basesDe = tid => { const out = []; let t = torrePorId(tid), vistos = new Set(); while (t && t.sobre && !vistos.has(t.id)){ vistos.add(t.id); out.push(t.sobre); t = torrePorId(t.sobre); } return out; };
  const encimaDe = tid => estado.torres.filter(t => t.sobre === tid).map(t => t.id);
  function sincronizarTorres(){
    estado.torres = (estado.torres || []).filter(t => t && t.id).map(t => ({ id: String(t.id), cartas: (t.cartas || []).filter((id, i, a) => esCarta(porId(id)) && a.indexOf(id) === i).slice(0, TORRE_MAX),
      x: Math.max(.04, Math.min(.96, +t.x || .9)), y: Math.max(.3, Math.min(.99, +t.y || .97)), sobre: t.sobre ? String(t.sobre) : null }));
    for (const t of estado.torres) if (t.sobre && (!torrePorId(t.sobre) || t.sobre === t.id)) t.sobre = null;
    while (estado.torres.length < nTorres()){
      const k = estado.torres.length, id = 't' + (k + 1), prev = estado.torres[k - 1];
      estado.torres.push({ id, cartas: [], x: .87, y: .975, sobre: (prev && alturaPila(prev.id) < TORRES_ALTO && !encimaDe(prev.id).length) ? prev.id : null });
    }
  }
  function aTorre(id, tid){
    const t = torrePorId(tid); if (!t || !esCarta(porId(id)) || t.cartas.includes(id) || t.cartas.length >= TORRE_MAX) return false;
    const i = estado.mesa.indexOf(id); if (i >= 0) estado.mesa.splice(i, 1);
    delete estado.estantes[id]; const o = torreDe(id); if (o) o.cartas.splice(o.cartas.indexOf(id), 1);
    t.cartas.push(id); guardar(); return true;
  }
  function delTorre(id){
    const t = torreDe(id); if (!t) return false;
    t.cartas.splice(t.cartas.indexOf(id), 1); aMesa(id); return true;
  }
  // mudar una torre: a un punto de la sala (fracciones del .centro) o encima de otra (si la pila no pasa de 5)
  function moverTorre(tid, x, y, sobre){
    const t = torrePorId(tid); if (!t) return false;
    if (sobre){
      const b = torrePorId(sobre); if (!b || sobre === tid || basesDe(sobre).includes(tid) || encimaDe(sobre).length) return false;
      const alto = alturaPila(sobre) + 1 + encimaDe(tid).length; if (alto > TORRES_ALTO) return false;
      t.sobre = sobre;
    } else { t.sobre = null; t.x = Math.max(.04, Math.min(.96, +x)); t.y = Math.max(.3, Math.min(.99, +y)); }
    guardar(); return true;
  }
  function cargarEstado(){
    let s = null;
    if (!q.has('limpio') && !q.has('test')){ try { s = JSON.parse(localStorage.getItem(CLAVE)); } catch (e) {} }
    estado = { mesa: [], estantes: {}, torres: [] };
    if (s && typeof s === 'object'){
      if (Array.isArray(s.mesa)) estado.mesa = s.mesa.filter((id, i, a) => porId(id) && a.indexOf(id) === i);
      if (Array.isArray(s.torres)) estado.torres = s.torres;
      else if (Array.isArray(s.fajo) && s.fajo.length) estado.torres = [{ id: 't1', cartas: s.fajo, x: .87, y: .975, sobre: null }];     // el fajo de antes pasa a ser la torre 1
      sincronizarTorres();
      const enTorre = new Set(estado.torres.flatMap(t => t.cartas));
      estado.mesa = estado.mesa.filter(id => !enTorre.has(id));
      if (s.estantes && typeof s.estantes === 'object') for (const id in s.estantes){
        const p = s.estantes[id];
        const ph = esCarta(porId(id)) && !!p.hueco, pv = ph ? (!!p && LADOS.includes(p.lado) && p.fila >= 0 && p.fila < FILAS && p.col >= 0 && p.col <= COLS) : posValida(p);
        if (porId(id) && pv && !estado.mesa.includes(id) && !enTorre.has(id)) estado.estantes[id] = ph ? { lado: p.lado, fila: p.fila | 0, col: p.col | 0, hueco: true } : { lado: p.lado, fila: p.fila | 0, col: esCarta(porId(id)) ? Math.min(COLS - MONTON_ANCHO, p.col | 0) : p.col | 0 };
      }
    } else sincronizarTorres();
    if (q.has('mesa')){
      estado.mesa = q.get('mesa').split(',').filter((id, i, a) => porId(id) && a.indexOf(id) === i);
      for (const id of estado.mesa) delete estado.estantes[id];
    }
    // dos libros en la misma ranura: el segundo busca hueco (las cartas sí pueden compartirla: son un montón)
    const vistas = {};
    for (const id of Object.keys(estado.estantes)){
      if (esCarta(porId(id))) continue;
      const k = clave(estado.estantes[id]);
      if (vistas[k]){ const p = estado.estantes[id]; delete estado.estantes[id]; colocar(id, p); }
      vistas[clave(estado.estantes[id])] = id;
    }
    // montones de más de 20, dos cartas en un hueco, una carta de pie en el hueco del medio de un montón o un libro bajo un montón: buscan sitio
    const huecosVistos = {};
    for (const id of Object.keys(estado.estantes)){
      const p = estado.estantes[id], l = porId(id);
      if (esCarta(l) && p.hueco){ const k = clave(p); if (huecosVistos[k] || huecoPerdido(p)) colocarCarta(id, p); else huecosVistos[k] = id; }
      else if (esCarta(l)){ const m = montonEn(p); if (m && m.ids.length > MONTON_MAX && m.ids.indexOf(id) >= MONTON_MAX) colocarCarta(id, p); }
      else if (ocupada(p, id) === 'monton'){ const h = huecoCerca(p, id); if (h) estado.estantes[id] = h; }
    }
    // en la mesa, como mucho MESA_CARTAS cartas: las de más vuelven a su estante de nacimiento (el bucle de abajo las coloca)
    let nc = 0; estado.mesa = estado.mesa.filter(id => !esCarta(porId(id)) || ++nc <= MESA_CARTAS);
    // libros sin sitio (nuevos en el catálogo): a su estante de nacimiento
    const enTorre = new Set(estado.torres.flatMap(t => t.cartas));
    for (const l of CAT){
      if (estado.mesa.includes(l.id) || estado.estantes[l.id] || enTorre.has(l.id)) continue;
      colocar(l.id, posValida(l.estante) ? l.estante : { lado: 'izq', fila: 0, col: 0 });
    }
  }

  // ---- las dos operaciones ----
  function aMesa(id){
    if (!cabeEnMesa(id)) return false;
    delete estado.estantes[id];
    const i = estado.mesa.indexOf(id);
    if (i > 0){                    // estaba en la torre: pasa a estar de pie y el de pie sube a la torre
      estado.mesa.splice(i, 1);
      const dePie = estado.mesa.shift();
      estado.mesa.unshift(id);
      if (dePie) estado.mesa.push(dePie);
    } else if (i < 0) estado.mesa.push(id);
    guardar(); return true;
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
    sala.querySelectorAll('.lomo, .libro-mesa, .libro-torre, .monton-cartas, .carta-hueco, .carta-mesa, .carta-torre').forEach(e => e.remove());
    // los montones acostados: uno por posición, dos ranuras de ancho; cada carta es una franja de canto del color de su papel,
    // sueltas hasta 5 y de ahí atadas de a 5 con su cinta
    const M = montones();
    for (const k in M){
      const m = M[k], el = document.createElement('div'), n = m.ids.length;
      el.className = 'monton-cartas'; el.dataset.monton = k; el.dataset.id = m.ids[0]; el.title = n === 1 ? porId(m.ids[0]).titulo : n + ' cartas';
      const franja = id => '<i style="background:' + CARTA.colores(porId(id))[0] + '"></i>';
      const partes = [];
      for (let i = 0; i < n; i += MONTON_ATADO){ const g = m.ids.slice(i, i + MONTON_ATADO); partes.push(g.length === MONTON_ATADO ? '<span class="atado">' + g.map(franja).join('') + '</span>' : g.map(franja).join('')); }
      el.innerHTML = '<span class="pila">' + partes.join('') + '</span>' + (n > 1 ? '<b class="cuenta">' + n + '</b>' : '');
      const ranura = librerias[m.pos.lado].filas[m.pos.fila][m.pos.col]; ranura.appendChild(el);
      el.style.setProperty('--f', Math.max(2, Math.min(5, ranura.offsetHeight * .037)).toFixed(2) + 'px');      // 20 cartas ≈ 75 % del estante (ya no hay libros detrás)
      engancharMonton(el, m.ids.slice(), m.pos);
    }
    for (const id in estado.estantes){
      const l = porId(id), p = estado.estantes[id];
      if (esCarta(l) && p.hueco){                                  // de pie entre dos libros, en el hueco a la izquierda de la ranura (col 8: a la derecha de la última)
        const h = document.createElement('div'), c = l.carta || {};
        h.className = 'carta-hueco ' + (c.cierre === 'rasgar' ? 'rasgar' : 'cera') + (p.col >= COLS ? ' der' : ''); h.dataset.id = id; h.style.cssText = estilo(l); h.title = l.titulo;
        h.innerHTML = (c.cierre === 'rasgar' ? '<i class="tira"></i>' : '<i class="sello"></i>') + '<i class="toque"></i>';
        librerias[p.lado].filas[p.fila][Math.min(p.col, COLS - 1)].appendChild(h);
        enganchar(h, id, 'estante'); continue;
      }
      if (esCarta(l)) continue;
      const lomo = document.createElement('div');
      lomo.dataset.id = id; lomo.style.cssText = estilo(l); lomo.title = l.titulo;
      lomo.className = 'lomo';
      lomo.innerHTML = '<span class="rotulo">' + esc(l.lomo || l.titulo) + '</span><i class="toque"></i>' + ((l.candado || l.pin) ? '<i class="candado-lomo"></i>' : '');
      librerias[p.lado].filas[p.fila][p.col].appendChild(lomo);
      enganchar(lomo, id, 'estante');
    }
    pintarTorres();
    const lugar = $('.lugar'), torre = $('.torre');
    estado.mesa.forEach((id, i) => {
      const l = porId(id);
      const b = document.createElement('div');
      b.dataset.id = id; b.style.cssText = estilo(l); b.title = l.titulo;
      if (i === 0){
        if (esCarta(l)){ b.className = 'carta-mesa'; b.innerHTML = CARTA.sobre(l) + ((l.candado || l.pin) ? '<i class="candado-mesa' + ((conCandado(l) && CANDADO.listo(l)) || l._pinOk ? ' abierto' : '') + '"></i>' : ''); }
        else {
          b.className = 'libro-mesa piel';
          b.innerHTML = '<span class="titulo-mesa">' + esc(l.titulo) + '</span>' +
            ((l.candado || l.pin) ? '<i class="candado-mesa' + ((conCandado(l) && CANDADO.listo(l)) || l._pinOk ? ' abierto' : '') + '"></i>' : '');
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
    if (!cabeEnMesa(a.id)){ avisoMesaLlena(); return; }
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
    a.torres = esCarta(l) ? [...sala.querySelectorAll('.torre-cartas')].map(t => ({ el: t, r: t.getBoundingClientRect(), tid: t.dataset.torre })).filter(t => torrePorId(t.tid).cartas.length < TORRE_MAX) : [];
    a.montones = esCarta(l) ? [...sala.querySelectorAll('.monton-cartas')].map(m => ({ el: m, r: m.getBoundingClientRect(), k: m.dataset.monton })) : [];
    a.destino = null;
  }
  function mover(e){
    const a = arrastre; if (!a || !a.activo) return;
    a.fant.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px) translate(-50%,-72%) rotate(-6deg)';
    let d = null;
    const lib = a.libs.find(x => dentro(e, x.r, 6));
    const tor = a.torres.find(t => dentro(e, t.r, 10)), mon = a.montones.find(m => dentro(e, m.r, 4) && montones()[m.k] && montones()[m.k].ids.length < MONTON_MAX && !montones()[m.k].ids.includes(a.id));
    if (tor) d = { tipo: 'torre', el: tor.el, tid: tor.tid };                                   // una carta sobre una torre: se ata
    else if (mon) d = { tipo: 'ranura', pos: montones()[mon.k].pos, el: mon.el };                 // sobre un montón con sitio: se suma
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
        if (esCarta(porId(a.id))){                                                               // la carta: de pie en un hueco (cerca del borde de la ranura) o acostada en un montón
          const fr = (e.clientX - mejor.r.left) / mejor.r.width;
          if (fr < .3) p.hueco = true; else if (fr > .7){ p.col = mejor.col + 1; p.hueco = true; }
          const antes = estado.estantes[a.id]; const okc = colocarCarta(a.id, p); const h = okc ? Object.assign({}, estado.estantes[a.id]) : null;
          delete estado.estantes[a.id]; if (antes) estado.estantes[a.id] = antes;
          if (h) d = h.hueco ? { tipo: 'ranura', pos: h, el: librerias[h.lado].filas[h.fila][Math.min(h.col, COLS - 1)], clase: 'destino-hueco' + (h.col >= COLS ? ' destino-hueco-der' : '') } : { tipo: 'ranura', pos: h, el: librerias[h.lado].filas[h.fila][h.col] };
        } else {
          const h = ocupada(p, a.id) ? huecoCerca(p, a.id) : p;
          if (h) d = { tipo: 'ranura', pos: h, el: librerias[h.lado].filas[h.fila][h.col] };
        }
      }
    } else if (dentro(e, a.mesaR, 30) && a.origen !== 'mesa') d = { tipo: 'mesa', el: a.mesaEl };
    const marcas = x => (x.clase || 'destino').split(' ');
    if (a.destino && (!d || a.destino.el !== d.el || a.destino.clase !== d.clase)) a.destino.el.classList.remove(...marcas(a.destino));
    if (d) d.el.classList.add(...marcas(d));
    a.destino = d;
  }
  function limpiar(a){
    a.fant.remove(); a.el.classList.remove('fantasma'); cuerpo.classList.remove('arrastrando');
    if (a.destino) a.destino.el.classList.remove(...(a.destino.clase || 'destino').split(' '));
  }
  function soltar(a){
    const d = a.destino, rf = a.fant.getBoundingClientRect();
    limpiar(a);
    const desde = {}; desde[a.id] = rf;
    if (d && d.tipo === 'ranura') flip(() => aEstante(a.id, d.pos), desde);
    else if (d && d.tipo === 'mesa' && !cabeEnMesa(a.id)){ avisoMesaLlena(); volar(rf, a.el.getBoundingClientRect(), a.el, false); }
    else if (d && d.tipo === 'mesa') flip(() => aMesa(a.id), desde);
    else if (d && d.tipo === 'torre'){ volar(rf, d.el.getBoundingClientRect(), null, false); aTorre(a.id, d.tid); render(); }
    else volar(rf, a.el.getBoundingClientRect(), a.el, false);       // vuelve solo a su sitio
  }
  // arrastre genérico de un objeto de cartas (montón o torre): toque corto = abrir; movimiento = fantasma que sigue al dedo
  function arrastreObjeto(el, op){
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
        ar.activo = true; ar.fant = el.cloneNode(true); ar.fant.classList.add('objeto-fantasma'); ar.fant.style.width = el.getBoundingClientRect().width + 'px'; ar.fant.style.height = el.getBoundingClientRect().height + 'px';
        document.body.appendChild(ar.fant); el.classList.add('fantasma'); cuerpo.classList.add('arrastrando'); if (op.empezar) op.empezar(ar);
      }
      ar.fant.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px) translate(-50%,-60%)';
      const d = op.destino(e, ar);
      if (ar.destino && ar.destino.el && (!d || ar.destino.el !== d.el)) ar.destino.el.classList.remove('destino');
      if (d && d.el) d.el.classList.add('destino');
      ar.destino = d;
    });
    const fin = e => {
      if (!ar) return; const a = ar; ar = null;
      if (!a.activo){ op.tocar(); return; }
      a.fant.remove(); el.classList.remove('fantasma'); cuerpo.classList.remove('arrastrando');
      if (a.destino && a.destino.el) a.destino.el.classList.remove('destino');
      op.soltar(a.destino, e);
    };
    el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin);
  }
  // el montón: un toque abre la carta (si es una) o la lista; arrastrarlo muda todas sus cartas a otra ranura
  function engancharMonton(el, ids, pos){
    arrastreObjeto(el, {
      tocar: () => { if (ids.length === 1){ if (!cabeEnMesa(ids[0])){ avisoMesaLlena(); return; } flip(() => aMesa(ids[0])); } else abrirLista(ids.length + ' cartas en el montón', ids); },
      destino: e => { const r = ranuraBajo(e.clientX, e.clientY); if (!r) return null; const c = Math.min(r.col, COLS - MONTON_ANCHO); const m = montonEn({ lado: r.lado, fila: r.fila, col: c }); if (m && m.pos.lado === pos.lado && m.pos.fila === pos.fila && m.pos.col === pos.col) return null; return { lado: r.lado, fila: r.fila, col: c, el: librerias[r.lado].filas[r.fila][c] }; },
      soltar: d => { if (d && moverMonton(ids, d)) render(); },
    });
  }
  // la lista de cartas de un montón o una torre: tocar una la lleva a la mesa
  let listaPanel = null;
  function abrirLista(titulo, ids){
    if (!listaPanel){ listaPanel = document.createElement('div'); listaPanel.id = 'lista-cartas'; document.body.appendChild(listaPanel); listaPanel.addEventListener('pointerdown', e => { if (e.target === listaPanel) cerrarLista(); }); }
    const items = ids.map(id => { const l = porId(id); return '<div class="item" data-id="' + esc(id) + '">' + CARTA.sobre(l, 'chico') + '<span>' + esc(l.titulo) + '</span>' + ((l.candado || l.pin) ? '<i class="con-candado" title="Con candado">🔒</i>' : '') + '</div>'; }).join('');
    listaPanel.innerHTML = '<div class="caja" role="dialog" aria-label="' + esc(titulo) + '"><h4>' + esc(titulo) + '<button type="button" class="cerrar" aria-label="Cerrar">✕</button></h4>' +
      (items || '<div class="vacio">Todavía no hay cartas aquí. Arrastra una carta hasta la torre para atarla.</div>') + '</div>';
    listaPanel.hidden = false;
    listaPanel.querySelector('.cerrar').onclick = cerrarLista;
    listaPanel.querySelectorAll('.item').forEach(it => { it.onclick = () => { const id = it.dataset.id; if (!cabeEnMesa(id)){ avisoMesaLlena(); return; } cerrarLista(); flip(() => { if (torreDe(id)) delTorre(id); else aMesa(id); }); }; });
  }
  function cerrarLista(){ if (listaPanel) listaPanel.hidden = true; }
  // ---- las torres: objetos sueltos en el .centro; se pintan con medidas en píxeles (las apiladas se apoyan en la de abajo) ----
  const centroEl = sala.querySelector('.centro');
  function medidaTorre(t, W){
    const w = Math.max(44, Math.min(84, W * .075)), n = t.cartas.length;
    return { w, h: w * (.45 + 1.05 * Math.min(1, n / TORRE_MAX)) };
  }
  function pintarTorres(){
    sala.querySelectorAll('.torre-cartas').forEach(e => e.remove());
    if (!centroEl || !estado.torres.length) return;
    const c = centroEl.getBoundingClientRect(), W = c.width, H = c.height; if (!W || !H) return;
    const m = sala.querySelector('.mesa'), mr = m ? m.getBoundingClientRect() : null, mesaBase = mr ? (mr.bottom - c.top) - mr.height * .03 : H;
    const puesto = {};
    const colocarT = t => {
      if (puesto[t.id]) return puesto[t.id];
      const d = medidaTorre(t, W);
      let x, yb;
      if (t.sobre && torrePorId(t.sobre)){ const b = colocarT(torrePorId(t.sobre)); x = b.x; yb = b.yb - b.h; } else { x = t.x * W; yb = t.y * H; }
      return (puesto[t.id] = { x, yb, w: d.w, h: d.h, z: yb > mesaBase ? 4 : 2 });
    };
    for (const t of estado.torres){
      const g = colocarT(t), el = document.createElement('div'), n = t.cartas.length;
      el.className = 'torre-cartas'; el.dataset.torre = t.id; el.title = 'Torre de cartas: ' + n + ' de ' + TORRE_MAX + (t.sobre ? ' (apilada)' : '');
      el.style.cssText = 'left:' + (g.x - g.w / 2).toFixed(1) + 'px;top:' + (g.yb - g.h).toFixed(1) + 'px;width:' + g.w.toFixed(1) + 'px;height:' + g.h.toFixed(1) + 'px;z-index:' + g.z;
      const cols = t.cartas.slice(0, 6).map(id => CARTA.colores(porId(id))[0]); while (cols.length < 2) cols.push(cols.length ? '#e7c9a9' : '#f1e4c4');
      el.style.setProperty('--pap', cols[0]); el.style.setProperty('--pap2', cols[1] || cols[0]);
      el.innerHTML = '<i class="bloque"></i><i class="cinta"></i><i class="lazo"></i>' + (n ? '<b class="cuenta">' + n + '</b>' : '');
      centroEl.appendChild(el);
      engancharTorre(el, t);
    }
  }
  function engancharTorre(el, t){
    arrastreObjeto(el, {
      tocar: () => abrirLista('Torre de cartas · ' + t.cartas.length + ' / ' + TORRE_MAX, t.cartas.slice()),
      empezar: ar => { ar.otras = [...sala.querySelectorAll('.torre-cartas')].filter(o => o !== el && !basesDe(o.dataset.torre).includes(t.id) && !encimaDe(o.dataset.torre).length && o.dataset.torre !== t.sobre).map(o => ({ el: o, r: o.getBoundingClientRect(), tid: o.dataset.torre })); },
      destino: (e, ar) => { const o = ar.otras.find(x => dentro(e, x.r, 8)); if (o && alturaPila(o.tid) + 1 + encimaDe(t.id).length <= TORRES_ALTO) return { tipo: 'torre', el: o.el, tid: o.tid }; return { tipo: 'suelo' }; },
      soltar: (d, e) => {
        if (!d) return;
        if (d.tipo === 'torre'){ if (moverTorre(t.id, null, null, d.tid)) render(); return; }
        const c = centroEl.getBoundingClientRect();
        if (moverTorre(t.id, (e.clientX - c.left) / c.width, (e.clientY - c.top) / c.height + .04, null)) render();
      },
    });
  }
  addEventListener('resize', () => pintarTorres());

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
    // un libro propio con candado (crear.js): pide su número y compara la huella
    if (l.pin && !l._pinOk){ pedirPin(l, () => { l._pinOk = true; render(); abrirLibro(id); }); return; }
    if (esLibroDePaginas(l)) abrirPoema(l, -1, true);
    else if (l.tipo === 'girasoles') abrirGirasoles(l);
    else if (esCarta(l)) abrirCarta(l);
  }
  function abrirCarta(l){
    bloqueado = true; pistaS.classList.remove('ver');
    CARTA.mostrar(l, { alTerminar: () => { bloqueado = false; } });
  }
  let pinPanel = null;
  function pedirPin(l, cb){
    if (!pinPanel){
      pinPanel = document.createElement('div'); pinPanel.id = 'candado-propio'; pinPanel.hidden = true;
      pinPanel.innerHTML = '<div class="cerradura" role="dialog" aria-label="Este libro tiene candado">' +
        '<svg class="cierre" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="#d4b06a" stroke-width="2"/><rect x="5" y="10" width="14" height="11" rx="2" fill="#d4b06a"/></svg>' +
        '<div class="tit">Este libro tiene candado</div><div class="sub">Escribe el número para abrirlo</div>' +
        '<input class="cifra" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="12" aria-label="Número del candado">' +
        '<div class="aviso"></div><div class="botones"><button type="button" class="cancelar">Volver</button><button type="button" class="abrir">Abrir</button></div></div>';
      document.body.appendChild(pinPanel);
    }
    const input = pinPanel.querySelector('.cifra'), aviso = pinPanel.querySelector('.aviso'), caja = pinPanel.querySelector('.cerradura');
    input.value = ''; aviso.textContent = ''; input.maxLength = Math.max(1, (l.pin.largo | 0) || 12);
    pinPanel.hidden = false; setTimeout(() => { try { input.focus(); } catch (e) {} }, 60);
    const cerrar = () => { pinPanel.hidden = true; pinPanel.querySelector('.abrir').onclick = null; pinPanel.querySelector('.cancelar').onclick = null; input.onkeydown = null; input.oninput = null; };
    const probar = async () => {
      const n = input.value.trim(); if (!n) return;
      const h = window.CUENTA ? await CUENTA.huella(l.pin.sal, n) : '';
      if (h && h === l.pin.huella){ cerrar(); cb(); }
      else { aviso.textContent = 'No es ese número'; caja.classList.remove('tiembla'); void caja.offsetWidth; caja.classList.add('tiembla'); input.select(); }
    };
    pinPanel.querySelector('.abrir').onclick = probar;
    pinPanel.querySelector('.cancelar').onclick = cerrar;
    input.onkeydown = e => { if (e.key === 'Enter') probar(); else if (e.key === 'Escape') cerrar(); };
    input.oninput = () => { if (l.pin.largo && input.value.length >= l.pin.largo) probar(); };
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
    estado = { mesa: [], estantes: {}, torres: [] };
    for (const l of CAT) colocar(l.id, l.estante);
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
      if (window.CUENTA && !CUENTA.tiene('pared', 'rosa')) CUENTA.comprar('pared', 'rosa');       // con inventario, primero se compra
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
    // la cuenta, la tienda, las mascotas en caliente, los libros propios y la mudanza de adornos (el producto)
    if (window.CUENTA){
      const antes = CUENTA.monedas(), ran = CUENTA.ranuras();
      const nuevo = CUENTA.piezas('pared').find(p => p.hecha && !CUENTA.tiene('pared', p.clave));
      ok(!!nuevo && CUENTA.comprar('pared', nuevo.clave).ok && CUENTA.tiene('pared', nuevo.clave) && CUENTA.monedas() === antes - CUENTA.precioDe('pared', nuevo.clave), 'tienda: comprar una pared la deja en el inventario y cobra su precio');
      ok(!!nuevo && CUENTA.comprar('pared', nuevo.clave).motivo === 'ya' && CUENTA.comprar('mejora', 'ranura').ok && CUENTA.ranuras() === ran + 1, 'tienda: no se compra dos veces; la ranura extra suma');
      const enSala = id => !window.GATOS_SALA || !GATOS_SALA.lista().length || GATOS_SALA.lista().some(g => g.id === id);
      const nm = CUENTA.mascotas().length, rm = CUENTA.agregarMascota('atigrado', 'Prueba');
      ok(rm.ok && CUENTA.mascotas().length === nm + 1 && enSala(rm.mascota.id), 'editar: subir una mascota la pone en la sala');
      ok(CUENTA.quitarMascota(rm.mascota.id) && CUENTA.mascotas().length === nm && (!window.GATOS_SALA || !GATOS_SALA.lista().some(g => g.id === rm.mascota.id)), 'editar: bajarla la quita');
      // las ampliaciones de cartas suman al tope
      if (CUENTA.topeDe){ const t0 = CUENTA.topeDe('carta'); ok(CUENTA.comprar('mejora', 'cartas5').ok && CUENTA.topeDe('carta') === t0 + 5 && CUENTA.piezas('libro').find(p => p.clave === 'carta').tope === t0 + 5, 'tienda: la ampliación de 5 suma al tope de cartas'); }
      // en la mesa caben MESA_CARTAS cartas: la que sobra no sube
      if (porId('carta') && CUENTA._stock){
        const s0 = CUENTA.disponibles('carta'); CUENTA._stock('carta', 100);
        const extra = []; for (let k = 0; k < MESA_CARTAS; k++){ const r = CUENTA.guardarLibro({ tipo: 'carta', titulo: 'Mesa ' + k, tapa: 'rosa', carta: { hojas: ['x'] }, estante: { lado: 'izq', fila: 3, col: 0 } }); if (r.ok) extra.push(r.libro.id); }
        extra.forEach(id => aMesa(id));
        ok(cartasEnMesa() === MESA_CARTAS && aMesa('carta') === false && !estado.mesa.includes('carta'), 'mesa: con ' + MESA_CARTAS + ' cartas encima, otra no sube');
        extra.forEach(id => CUENTA.borrarLibro(id)); CUENTA._stock('carta', s0 + CUENTA.libros().filter(l => l.tipo === 'carta').length);
      }
      const g = CUENTA.guardarLibro({ tipo: 'girasoles', titulo: 'Prueba', tapa: 'girasol', notas: ['hola'], estante: { lado: 'der', fila: 4, col: 7 } });
      ok(g.ok && !!porId(g.libro.id) && pos(g.libro.id) === 'der:4:7' && !!elDe(g.libro.id), 'crear: un libro propio nace en su ranura con su lomo');
      ok(CUENTA.borrarLibro(g.libro.id) && !porId(g.libro.id) && !elDe(g.libro.id), 'crear: borrarlo lo quita de la sala');
      const d0 = CUENTA.disponibles('poema'), s0 = CUENTA.sitiosLibres();
      ok(CUENTA.comprar('libro', 'poema').ok && CUENTA.disponibles('poema') === d0 + 1 && CUENTA.sitiosLibres() === s0 - 1 && CUENTA.sitiosUsados() + CUENTA.sitiosLibres() === CUENTA.RANURAS_LIBRERIA,
        'tienda: un libro en blanco más de poemas y un sitio menos de los 80');
      const ad = ADS[0];
      if (ad){ const p0 = Object.assign({}, ad.estante); ok(SALA_ADORNOS.mover(ad.id, { lado: 'izq', fila: 2, col: 7 }) && ad.estante.lado === 'izq' && ad.estante.fila === 2 && ad.estante.col === COLS - Math.max(1, ad.ancho | 0 || 1) && !!CUENTA.posAdorno(ad.id), 'editar: un adorno se muda de ranura y su ancho cabe'); SALA_ADORNOS.mover(ad.id, p0); }
    }
    // la carta y el cordón (en las dos salas): el montón ocupa dos ranuras; cada cordón es una torre; una carta se ata y se desata a la mesa
    if (porId('carta')){
      ok(pos('carta') === 'der:2:6' && ocupada({ lado: 'der', fila: 2, col: 6 }) === 'monton' && ocupada({ lado: 'der', fila: 2, col: 7 }) === 'monton', 'montón: ocupa sus dos ranuras');
      aMesa('poema'); aEstante('poema', { lado: 'der', fila: 2, col: 6 });
      ok(pos('poema') !== 'der:2:6' && pos('poema') !== 'der:2:7' && pos('poema').startsWith('der:2:'), 'montón: el libro mandado ahí busca el hueco vecino');
      aMesa('poema'); aEstante('poema', { lado: 'izq', fila: 0, col: 1 });
      ok(!huecoLibre({ lado: 'der', fila: 2, col: 7 }) && huecoLibre({ lado: 'der', fila: 2, col: 6 }) && huecoLibre({ lado: 'der', fila: 2, col: 8 }), 'montón: el hueco del medio se pierde, los de los bordes siguen');
      aMesa('carta'); aEstante('carta', { lado: 'izq', fila: 1, col: 4, hueco: true }); render();
      ok(!!estado.estantes.carta.hueco && pos('carta') === 'izq:1:4' && !ocupada({ lado: 'izq', fila: 1, col: 4 }) && ocupada({ lado: 'izq', fila: 1, col: 3 }) === 'suenos' && !!sala.querySelector('.carta-hueco'), 'hueco: una carta de pie entre dos libros no ocupa ranura (y el libro de al lado sigue)');
      aMesa('poema'); aEstante('poema', { lado: 'izq', fila: 1, col: 4 }); ok(pos('poema') === 'izq:1:4', 'hueco: el libro entra igual en la ranura de al lado');
      aMesa('poema'); aEstante('poema', { lado: 'izq', fila: 0, col: 1 });
      aMesa('carta'); aEstante('carta', { lado: 'der', fila: 2, col: 6 });
      if (window.CUENTA && !nTorres()) CUENTA.comprar('mejora', 'cordon');
      sincronizarTorres(); render();
      if (nTorres()){
        ok(estado.torres.length >= 1 && sala.querySelectorAll('.torre-cartas').length === estado.torres.length, 'cordón: cada cordón es una torre de cartas en la sala');
        const t1 = estado.torres[0].id, atada = aTorre('carta', t1); render();
        ok(atada && torreDe('carta') && torreDe('carta').id === t1 && !elDe('carta') && sala.querySelector('.torre-cartas .cuenta').textContent === '1', 'torre: la carta atada sale de la librería y la torre la cuenta');
        ok(delTorre('carta') && !torreDe('carta') && estado.mesa.includes('carta'), 'torre: desatarla la lleva a la mesa');
        ok(moverTorre(t1, .3, .9, null) && Math.abs(estado.torres[0].x - .3) < 1e-9, 'torre: se muda a otro punto de la sala');
      } else ok(false, 'cordón: la sala no tiene torres (TORRES_CARTAS en libros.js)');
      aEstante('carta', { lado: 'der', fila: 2, col: 6 });
    }
    if (cal && window.CALENDARIO){
      const D = { dias: [{ fecha: '2026-03-15', nombre: 'Inicio', inicio: true }, { dia: 20, mes: 2, nombre: 'Regalo', icono: 'regalo' }] };
      const ev = (y, m) => CALENDARIO.eventos(D, y, m).map(e => e.d + ':' + e.nombre).join('|');
      ok(ev(2026, 2) === '15:Inicio' && ev(2026, 3) === '15:1 mes juntos' && ev(2027, 2) === '15:1 año juntos' && ev(2027, 1) === '15:11 meses juntos|20:Regalo' && ev(2026, 1) === '20:Regalo',
        'calendario: el inicio marca cada mes y cada año; los días del año se repiten');
      const px = CALENDARIO.proximos(D, new Date(2026, 2, 11), 3).map(e => e.dias + ':' + e.nombre).join('|');
      ok(px === '4:Inicio|35:1 mes juntos|65:2 meses juntos' && CALENDARIO.paginas(new Date(2026, 2, 11)).length === 13 && CALENDARIO.paginas(new Date(2026, 2, 11))[1].mes === '2026-03',
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
  // la pareja pudo mudar cada adorno de ranura (modo editar) y solo se ponen los que tiene
  if (window.CUENTA) for (const a of ADS){ const p = CUENTA.posAdorno(a.id); if (p && posValida(p)) a.estante = p; }
  const tieneAdorno = a => !window.CUENTA || q.has('fondo') || CUENTA.tiene('adorno', a.id);
  const visible = a => !!a._img && !adornosOcultos.has(a.id) && posValida(a.estante) && tieneAdorno(a);
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
    if (!visible(a)) return;
    const r = a.estante, el = document.createElement('img');
    el.className = 'adorno-estante'; el.dataset.adorno = a.id; el.alt = ''; el.draggable = false; el.title = a.nombre || '';
    el.src = a._img; el.style.setProperty('--ancho', ranurasDe(a).length);
    librerias[r.lado].filas[r.fila][r.col].appendChild(el);
  }
  function aplicarAdornos(){
    for (const a of ADS){ descubrir(a); if (visible(a)) cubrir(a); }
    desalojar();
    for (const a of ADS) pintarAdorno(a);
  }
  // mudar un adorno a otra ranura (modo editar): la columna se acota para que quepa su ancho
  function moverAdorno(id, pos){
    const a = ADS.find(x => x.id === id); if (!a || !pos || !LADOS.includes(pos.lado)) return false;
    const n = Math.max(1, (a.ancho | 0) || 1);
    const p = { lado: pos.lado, fila: Math.max(0, Math.min(FILAS - 1, pos.fila | 0)), col: Math.max(0, Math.min(COLS - n, pos.col | 0)) };
    a.estante = p; if (window.CUENTA) CUENTA.moverAdorno(id, p);
    aplicarAdornos(); return true;
  }
  // la ranura bajo un punto de la pantalla (para arrastrar adornos desde el editor): null si no hay librería ahí
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
  document.addEventListener('cuenta', e => { const d = e.detail || {}; if (d.que === 'compra' && d.fam === 'adorno' || d.que === 'reinicio') aplicarAdornos(); });
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
    mover: moverAdorno, ranuraBajo,
  };

  // ---- la sala para los demás módulos (editor, tienda, creador): libros en caliente ----
  let sembrando = false;                                       // la demo mete muchos libros seguidos: pinta una sola vez al final
  function agregarLibro(l){
    if (!l) return null;
    const i = CAT.findIndex(x => x.id === l.id);
    if (i >= 0) return actualizarLibro(l);
    const o = normalizar(l, CAT.length); if (!valido(o)) return null;
    CAT.push(o);
    colocar(o.id, posValida(o.estante) ? o.estante : { lado: 'der', fila: 0, col: 0 });
    if (!sembrando){ guardar(); render(); } return o;
  }
  function actualizarLibro(l){
    const i = CAT.findIndex(x => x.id === l.id); if (i < 0) return agregarLibro(l);
    const o = normalizar(l, i); if (!valido(o)) return null;
    CAT[i] = o; render(); return o;
  }
  function quitarLibro(id){
    const i = CAT.findIndex(x => x.id === id); if (i < 0) return false;
    CAT.splice(i, 1); estado.mesa = estado.mesa.filter(x => x !== id); delete estado.estantes[id];
    guardar(); render(); return true;
  }
  document.addEventListener('cuenta', e => {
    const d = e.detail || {}; if (d.que !== 'libro') return;
    if (d.fam === 'agregar') agregarLibro(d.extra); else if (d.fam === 'cambiar') actualizarLibro(d.extra); else if (d.fam === 'borrar') quitarLibro(d.clave);
  });
  document.addEventListener('cuenta', e => { const d = e.detail || {}; if ((d.que === 'compra' && d.fam === 'mejora' && d.clave === 'cordon') || d.que === 'reinicio'){ sincronizarTorres(); guardar(); render(); } });
  window.SALA = { libros: () => CAT.slice(), porId, agregarLibro, actualizarLibro, quitarLibro, abrir: abrirLibro, estado: () => JSON.parse(JSON.stringify(estado)), ranuraBajo,
    aTorre: (id, tid) => { const ok = aTorre(id, tid || (estado.torres[0] || {}).id); if (ok) render(); return ok; }, delTorre: id => { const ok = delTorre(id); if (ok) render(); return ok; },
    moverTorre: (tid, x, y, sobre) => { const ok = moverTorre(tid, x, y, sobre); if (ok) render(); return ok; }, torres: () => JSON.parse(JSON.stringify(estado.torres)), montones: () => Object.values(montones()).map(m => ({ pos: m.pos, ids: m.ids.slice() })) };

  // ---- cartas de prueba (?demo=cartas, una vez): compra dos cordones (dos torres, una sobre otra), escribe ocho cartas variadas,
  //      deja cinco apiladas en la mesa y ata tres en la primera torre; luego limpia la dirección para que una recarga no vuelva a sembrar ----
  function demoCartas(){
    if (!window.CUENTA || !window.CARTA) return;
    if (!nTorres() && !CUENTA.comprar('mejora', 'cordon').ok) return;
    sincronizarTorres();
    // los tres tamaños que pidió el usuario: una torre de 100, un montón de 20 en la librería (delante del Álbum) y 5 en la mesa.
    // Son 125 cartas: la demo pasa el tope de compra (100) a mano, porque es para mirar, no para vender
    const EN_TORRE = 100, EN_LIBRERIA = 20, EN_MESA = MESA_CARTAS, TOTAL = EN_TORRE + EN_LIBRERIA + EN_MESA;
    if (CUENTA._stock) CUENTA._stock('carta', CUENTA.libros().filter(l => l.tipo === 'carta').length + TOTAL);
    const P = Object.keys(CARTA.PAPELES), DEMO = [
      { titulo: 'para Karen', color: 'rosa', cierre: 'cera', hojas: ['Esta es la primera de la pila.\n\nCada carta tiene su color y su cierre; pruébalas todas.'], final: { tipo: 'cerrada', pregunta: '¿Salimos este sábado?', opciones: ['Sí', 'No', 'Lo pienso'], obligatoria: 0, huida: 'explotar' } },
      { titulo: 'Buenos días', color: 'crema', cierre: 'rasgar', hojas: ['Una carta corta para empezar el día.'], final: null },
      { titulo: 'Un secreto', color: 'negro', cierre: 'cera', letra: 'imprenta', apertura: { modo: 'colores', colores: ['#111111', '#111111', '#111111'] }, hojas: ['Corazones negros, letra de imprenta.', 'Y una segunda hoja.'], final: { tipo: 'abierta', pregunta: '¿Cuál es el tuyo?' } },
      { titulo: 'Gracias', color: 'menta', cierre: 'rasgar', hojas: ['Por todo.'], final: null },
      { titulo: 'Sábado', color: 'celeste', cierre: 'cera', apertura: { modo: 'colores', colores: ['#118ab2', '#70d6ff', '#ffffff'] }, hojas: ['Tres colores a partes iguales.'], final: { tipo: 'cerrada', pregunta: '¿Playa o montaña?', opciones: ['Playa', 'Montaña'], obligatoria: null, huida: 'fantasma' } },
      { titulo: 'Te extraño', color: 'lavanda', cierre: 'rasgar', hojas: ['Hoja uno.', 'Hoja dos.', 'Hoja tres.', 'Hoja cuatro.', 'Hoja cinco: el máximo.'], final: null },
      { titulo: 'Léeme después', color: 'rojo', cierre: 'cera', apertura: { modo: 'nada' }, hojas: ['Sin corazones al abrir.'], final: { tipo: 'cerrada', pregunta: '¿Me esperas?', opciones: ['Siempre', 'Un rato', 'Nunca', 'Depende'], obligatoria: 0, huida: 'barrido' } },
      { titulo: 'Para reír', color: 'marfil', cierre: 'rasgar', hojas: ['Una de las cortas.'], final: null, acepto: { animaciones: ['confeti', 'estrellas'], colores: ['#ffd166', '#06d6a0'] } },
    ];
    const ids = [];
    sembrando = true;
    for (let i = 0; i < TOTAL; i++){
      if (CUENTA.disponibles('carta') <= 0 && !CUENTA.comprar('libro', 'carta').ok) break;
      const d = DEMO[i] || { titulo: 'Carta ' + (i + 1), color: P[i % P.length], cierre: i % 2 ? 'rasgar' : 'cera', hojas: ['Carta de prueba número ' + (i + 1) + '.'], final: null };
      const carta = Object.assign({ color: P[i % P.length], letra: 'manuscrita', apertura: { modo: 'muchos' }, firma: 'Yo', acepto: { animaciones: ['fuegos', 'corazones'], colores: ['#e63946', '#ffd166', '#ff70a6'], texto: '¡Sí!' } }, d);
      delete carta.titulo;
      const r = CUENTA.guardarLibro({ tipo: 'carta', titulo: d.titulo, tapa: 'rosa', carta, estante: { lado: 'der', fila: 1, col: 2 } });
      if (r.ok) ids.push(r.libro.id);
    }
    sembrando = false;
    ids.slice(0, EN_MESA).forEach(id => aMesa(id));
    ids.slice(EN_MESA, EN_MESA + EN_LIBRERIA).forEach(id => colocarCarta(id, { lado: 'der', fila: 1, col: 2 }));
    if (estado.torres[0]) ids.slice(EN_MESA + EN_LIBRERIA).forEach(id => aTorre(id, estado.torres[0].id));
    guardar(); render();
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    pista(ids.length + ' cartas de prueba: ' + EN_MESA + ' en la mesa, ' + EN_LIBRERIA + ' en un montón de la librería derecha y ' + EN_TORRE + ' en la torre. Toca el montón o la torre para elegir una.', 9000);
  }

  // ---- arranque ----
  construir();
  cargarEstado();
  render();
  cargarAdornos();
  if (q.get('demo') === 'cartas') demoCartas();
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
