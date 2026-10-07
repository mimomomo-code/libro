// =====================================================================
//  LOS GATOS. Cuatro gatos dibujados por código (SVG) que viven en la sala:
//  caminan por el suelo entre los sillones y la mesa (quedan detrás de la
//  mesa o delante según dónde pisen, y más chicos cuanto más lejos), se
//  paran a mirar, se echan a dormir, a veces saltan a un sillón a hacer la
//  siesta y, si se les toca, ronronean corazones. Cada uno con su pelaje:
//  atigrado (mackerel tabby), carey, van tricolor y van blanco con café.
//
//  La lista vive en libros.js (GATOS): id, pelaje y, opcionalmente,
//  `imagen` (un PNG/WebP del gato de cuerpo entero, de perfil mirando a la
//  derecha, con fondo transparente; los prompts están en PROMPTS.md). Con
//  imagen, el gato se mueve como un recorte de papel (balanceo al andar) en
//  lugar del dibujo con patas. Si la imagen falta, queda el dibujo.
//
//  Parámetros de la URL:  ?gatos=0 (sin gatos)   ?semilla=N (azar repetible,
//  para capturas)
// =====================================================================
(function(){
  'use strict';
  const q = new URLSearchParams(location.search);
  if (q.get('gatos') === '0') return;
  const LISTA = (typeof GATOS !== 'undefined' && Array.isArray(GATOS)) ? GATOS : [];
  const centro = document.querySelector('#sala .centro'), suelo = document.querySelector('#sala .suelo');
  const mesa = centro && centro.querySelector('.mesa');
  if (!LISTA.length || !centro || !suelo || !mesa) return;
  const cuerpo = document.body;
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // azar con semilla opcional (?semilla=N): la misma escena en cada captura
  let semilla = parseInt(q.get('semilla'), 10);
  const R = semilla > 0 ? () => { semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0; return semilla / 4294967296; } : Math.random;
  const entre = (a, b) => a + R() * (b - a);
  const elegir = a => a[Math.floor(R() * a.length)];

  // ---- los sillones: dónde está el asiento (fracción del alto y ancho del sillón) y qué tan grande se ve el gato encima ----
  const sillones = [...centro.querySelectorAll('.sillon')].map(el => ({
    el, ocupado: null,
    asiento: el.classList.contains('amarillo') ? { x: .5, y: .66, ancho: .42 } : { x: .5, y: .62, ancho: .46 },
  }));

  // =====================================================================
  //  EL DIBUJO: un gato de perfil mirando a la derecha, en un lienzo de
  //  120 × 80 (las patas pisan en y = 76). Las piezas llevan clases para
  //  que el CSS las anime: .cola, .pata (ti, td, di, dd), .torso, .cabeza, .ojos
  // =====================================================================
  const D = {
    cuerpo: 'M22 40 C 24 26, 44 22, 60 24 C 76 26, 84 32, 84 44 C 84 56, 72 60, 56 60 L 34 60 C 24 60, 18 52, 22 40 Z',
    cabeza: 'M77 34 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z',
    orejas: 'M80 26 L 82 7 L 93 20 Z M95 19 L 104 5 L 106 25 Z',
    orejasDentro: 'M83.5 23 L 84.5 12.5 L 90.5 19.5 Z M96.5 21 L 102 10.5 L 103.5 23 Z',
    cola: 'M20 46 C 6 50, 2 36, 10 24',
    patas: { ti: 26, td: 33, di: 66, dd: 73 },           // x de cada pata: trasera/delantera, izquierda (lejos) / derecha (cerca)
  };
  // Los pelajes, sacados de las fotos de los cuatro gatos reales (privado/gatos/referencia/).
  // `extra` devuelve el SVG de las manchas o rayas, recortado con las siluetas por clip-path.
  const motas = (lista, colores, u) => '<g clip-path="url(#' + u + '-cuerpo)">' +
    lista.map((m, i) => '<ellipse cx="' + m[0] + '" cy="' + m[1] + '" rx="' + m[2] + '" ry="' + m[3] + '" fill="' + colores[i % colores.length] + '" opacity=".85" transform="rotate(' + (m[4] || 0) + ' ' + m[0] + ' ' + m[1] + ')"/>').join('') + '</g>';
  const PELAJES = {
    atigrado: {                                           // atigrado pelo corto gris-marrón, mackerel tabby: rayas oscuras y marcadas, panza y barbilla claras
      base: '#9a8468', lejos: '#7b6850', borde: '#3e3027', oreja: '#d9a0a0', ojos: ['#86a35b', '#86a35b'], cola: '#9a8468',
      extra: u => '<g clip-path="url(#' + u + '-cuerpo)"><path d="M32 60 C 42 50, 72 50, 80 58 Z" fill="#dac8a9" opacity=".9"/>' +
        '<path d="M24 36 C 40 26, 70 24, 83 36" fill="none" stroke="#3f3129" stroke-width="2.2" opacity=".55"/>' +
        '<path d="M34 29q3 8 0 14M41 26q4 9 1 18M48 24q4 10 1 20M56 23q4 11 1 22M64 24q4 10 1 20M72 26q4 9 1 17M79 30q3 7 1 13" fill="none" stroke="#3f3129" stroke-width="2.4" stroke-linecap="round" opacity=".88"/></g>' +
        '<g clip-path="url(#' + u + '-cabeza)"><path d="M85 24l2.4-6 2.4 5 2.4-5 2.4 6" fill="none" stroke="#3f3129" stroke-width="1.7" stroke-linecap="round"/>' +
        '<path d="M81 36l-4 .5M81 40l-4 2M99 24l3-4M103 29l4-2" fill="none" stroke="#3f3129" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M93 45 C 97 48, 103 47, 106 43 L 106 49 L 92 49 Z" fill="#dac8a9" opacity=".8"/></g>',
      colaExtra: '<path d="' + D.cola + '" fill="none" stroke="#3f3129" stroke-width="7" stroke-linecap="butt" stroke-dasharray="3 4.5" opacity=".8"/>',
      pataExtra: x => '<path d="M' + x + ' 60h8M' + x + ' 66h8" stroke="#3f3129" stroke-width="1.6" opacity=".7"/>',
    },
    carey: {                                              // carey pelo corto brindada: negro / marrón muy oscuro con motas naranjas finas y la mancha naranja en la cara
      base: '#2a211c', lejos: '#1a1411', borde: '#120d0b', oreja: '#b98484', ojos: ['#9fae4f', '#9fae4f'], cola: '#2a211c',
      extra: u => motas([[30, 32, 2.6, 1.1, -30], [37, 28, 3, 1.2, 15], [44, 35, 2.4, 1, -40], [51, 26, 3.2, 1.3, 25], [57, 33, 2.2, 1, 5], [63, 27, 2.8, 1.2, -20],
          [69, 37, 2.4, 1, 35], [75, 30, 3, 1.3, -5], [80, 43, 2.2, 1, 40], [33, 45, 2.6, 1.1, 20], [43, 51, 2.8, 1.2, -15], [55, 47, 2.2, 1, 30],
          [65, 53, 2.6, 1.1, 0], [73, 49, 2.4, 1, -35], [28, 53, 2, .9, 10], [49, 41, 2, .9, 50], [61, 42, 1.8, .9, -50], [40, 40, 1.8, .8, 0],
          [34, 36, 1.6, .8, 60], [47, 30, 1.8, .8, -60], [60, 37, 1.6, .7, 20], [71, 44, 1.8, .8, -10], [78, 36, 1.6, .8, 45], [52, 55, 2, .9, 15],
          [38, 56, 1.6, .8, -30], [66, 31, 1.6, .7, 70], [26, 44, 1.8, .8, -20], [58, 28, 1.4, .7, 0]],
          ['#c2702a', '#d98b3c', '#b5651f', '#e0a050'], u) +
        '<g clip-path="url(#' + u + '-cabeza)"><path d="M93 20 C 102 23, 106 33, 101 46 L 93 44 C 97 36, 95 28, 90 22 Z" fill="#c2702a" opacity=".95"/>' +
        '<ellipse cx="82" cy="40" rx="3" ry="2" fill="#d98b3c" opacity=".8"/><ellipse cx="86" cy="25" rx="2.4" ry="1.5" fill="#c2702a" opacity=".8" transform="rotate(-20 86 25)"/>' +
        '<path d="M95 19 L 104 5 L 106 25 Z" fill="#c2702a" opacity=".55"/></g>',
      colaExtra: '<path d="' + D.cola + '" fill="none" stroke="#c2702a" stroke-width="7" stroke-linecap="butt" stroke-dasharray="2 6.5" opacity=".7"/>',
      pataExtra: (x, lejos, nombre) => nombre === 'td' ? '<ellipse cx="' + (x + 4) + '" cy="58" rx="2.6" ry="1.8" fill="#d98b3c" opacity=".8"/>' : '',
    },
    tricolor: {                                           // tricolor (calicó) pelo corto: blanca de panza, pecho y patas, con manchas grandes negras y naranjas en el lomo y la cara partida
      base: '#f4efe6', lejos: '#dcd4c7', borde: '#7a6a5a', oreja: '#e3a7a7', ojos: ['#b5b24c', '#b5b24c'], cola: '#2a211d',
      extra: u => '<g clip-path="url(#' + u + '-cuerpo)"><path d="M28 30 C 40 22, 70 20, 82 32 L 80 44 C 66 40, 50 42, 32 46 Z" fill="#2a211d"/>' +
        '<ellipse cx="72" cy="29" rx="9" ry="6" fill="#c9742c" transform="rotate(-10 72 29)"/><ellipse cx="30" cy="36" rx="7.5" ry="6.5" fill="#c9742c"/>' +
        '<ellipse cx="54" cy="44" rx="6" ry="3.5" fill="#c9742c" transform="rotate(10 54 44)"/></g>' +
        '<g clip-path="url(#' + u + '-cabeza)"><path d="M80 26 L 82 7 L 93 20 L 92 32 L 80 34 Z" fill="#2a211d"/><path d="M95 19 L 104 5 L 106 25 L 107 38 L 99 34 L 97 24 Z" fill="#c9742c"/></g>',
      colaExtra: '<path d="' + D.cola + '" fill="none" stroke="#c9742c" stroke-width="7" stroke-linecap="butt" stroke-dasharray="0 9 9 100"/>',
      pataExtra: () => '',
    },
    van_cafe: {                                           // van turca pelo corto: blanca con café (canela) en la gorrita partida por la raya blanca, tres lunares en el lomo y la cola
      base: '#f4efe6', lejos: '#dcd4c7', borde: '#7a6a5a', oreja: '#e3a7a7', ojos: ['#a9b35a', '#a9b35a'], cola: '#bf7a3c',
      extra: u => '<g clip-path="url(#' + u + '-cuerpo)"><ellipse cx="40" cy="30" rx="7" ry="5.5" fill="#bf7a3c" transform="rotate(-15 40 30)"/>' +
        '<ellipse cx="61" cy="27" rx="6" ry="5" fill="#b86f33"/><ellipse cx="77" cy="44" rx="6.5" ry="5" fill="#bf7a3c" transform="rotate(20 77 44)"/></g>' +
        '<g clip-path="url(#' + u + '-cabeza)"><path d="M80 26 L 82 7 L 93 20 L 90 29 L 81 31 Z" fill="#bf7a3c"/><path d="M95 19 L 104 5 L 106 25 L 105 31 L 97 29 Z" fill="#bf7a3c"/>' +
        '<ellipse cx="83" cy="38" rx="2.8" ry="2" fill="#bf7a3c" opacity=".7"/></g>',
      colaExtra: '',
      pataExtra: () => '',
    },
  };
  function pata(nombre, x, P){
    const lejos = nombre === 'ti' || nombre === 'di';
    return '<g class="pata ' + nombre + '"><rect x="' + x + '" y="50" width="8" height="26" rx="4" fill="' + (lejos ? P.lejos : P.base) + '" stroke="' + P.borde + '" stroke-width=".8"/>' +
      P.pataExtra(x, lejos, nombre) + '</g>';
  }
  function svgGato(def, u){
    const P = PELAJES[def.pelaje] || PELAJES.atigrado;
    return '<svg viewBox="0 0 120 80" aria-hidden="true">' +
      '<defs><clipPath id="' + u + '-cuerpo"><path d="' + D.cuerpo + '"/></clipPath><clipPath id="' + u + '-cabeza"><path d="' + D.cabeza + '"/><path d="' + D.orejas + '"/></clipPath>' +
      '<linearGradient id="' + u + '-luz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></linearGradient></defs>' +
      '<ellipse class="sombra" cx="54" cy="76" rx="36" ry="3.5" fill="rgba(0,0,0,.35)"/>' +
      '<g class="cola"><path d="' + D.cola + '" fill="none" stroke="' + P.cola + '" stroke-width="7" stroke-linecap="round"/>' + P.colaExtra + '</g>' +
      pata('ti', D.patas.ti, P) + pata('di', D.patas.di, P) + pata('td', D.patas.td, P) + pata('dd', D.patas.dd, P) +
      '<g class="torso"><path d="' + D.cuerpo + '" fill="' + P.base + '" stroke="' + P.borde + '" stroke-width=".9"/>' +
      '<g class="cabeza"><path d="' + D.orejas + '" fill="' + P.base + '" stroke="' + P.borde + '" stroke-width=".9" stroke-linejoin="round"/>' +
      '<path d="' + D.cabeza + '" fill="' + P.base + '" stroke="' + P.borde + '" stroke-width=".9"/>' +
      P.extra(u) +
      '<path d="' + D.orejasDentro + '" fill="' + P.oreja + '" opacity=".9"/>' +
      '<ellipse cx="99" cy="41" rx="7" ry="5" fill="#fff" opacity=".35"/>' +
      '<g class="ojos"><ellipse cx="86.5" cy="32.5" rx="2.7" ry="3.4" fill="' + P.ojos[0] + '"/><ellipse cx="97.5" cy="31.5" rx="2.7" ry="3.4" fill="' + P.ojos[1] + '"/>' +
      '<ellipse cx="86.5" cy="32.5" rx="1" ry="3" fill="#1a1512"/><ellipse cx="97.5" cy="31.5" rx="1" ry="3" fill="#1a1512"/>' +
      '<circle cx="85.6" cy="31.2" r=".8" fill="#fff" opacity=".9"/><circle cx="96.6" cy="30.2" r=".8" fill="#fff" opacity=".9"/></g>' +
      '<path d="M99.6 38.6 l-2.4 0 l1.2 1.9 Z" fill="#c97f8a"/><path d="M98.4 40.5 q1.6 2 3.2 0" fill="none" stroke="#3a2a22" stroke-width=".7"/>' +
      '<path d="M104 39 l9 -2.5 M104.5 41.5 l9.5 1" fill="none" stroke="#fff" stroke-width=".8" opacity=".75"/></g>' +
      '<path d="' + D.cuerpo + '" fill="url(#' + u + '-luz)"/></g>' +
      '</svg>';
  }

  // =====================================================================
  //  LA GEOMETRÍA DEL SUELO (en coordenadas del .centro): la caja por donde
  //  se camina, la huella de la mesa y el tamaño de los gatos
  // =====================================================================
  const G = { w: 0, h: 0, caja: null, mesa: null, ancho: 60 };
  function medir(){
    const c = centro.getBoundingClientRect(); if (!c.width || !c.height) return false;
    G.w = c.width; G.h = c.height;
    let top = suelo.getBoundingClientRect().top - c.top;
    for (const s of sillones){
      const r = s.el.getBoundingClientRect();
      s.r = { left: r.left - c.left, top: r.top - c.top, width: r.width, height: r.height };
      top = Math.max(top, s.r.top + s.r.height - c.height * .01);
    }
    G.caja = { left: c.width * .02, right: c.width * .98, top: Math.min(top + c.height * .025, c.height * .8), bottom: c.height * .985 };
    const m = mesa.getBoundingClientRect();
    G.mesa = { left: m.left - c.left, right: m.right - c.left, top: m.top - c.top, base: m.bottom - c.top - m.height * .03 };
    G.ancho = Math.max(56, Math.min(c.width * .34, 130));     // en celular ~85 px (un tercio del centro); en PC tope 130
    centro.style.setProperty('--gato', G.ancho.toFixed(1) + 'px');
    return true;
  }
  const escalaEn = y => { const c = G.caja; return .55 + .45 * Math.max(0, Math.min(1, (y - c.top) / (c.bottom - c.top))); };
  // la huella de la mesa: ahí no se paran (quedarían dentro de la mesa o tapados por ella)
  const enMesa = (x, y) => { const m = G.mesa; return x > m.left && x < m.right && y > m.top + (m.base - m.top) * .3 && y < m.base + G.h * .012; };

  // =====================================================================
  //  CADA GATO: una maquinita de estados (quieto, anda, echado, salta) y su
  //  posición normalizada (u, v) dentro de la caja, que sobrevive a los resize
  // =====================================================================
  class Gato {
    constructor(def, i, n){
      this.def = def; this.id = def.id || ('gato' + i);
      const u = 'g-' + this.id.replace(/[^\w-]/g, '');
      this.el = document.createElement('div');
      this.el.className = 'gato ' + (PELAJES[def.pelaje] ? def.pelaje : 'atigrado') + ' quieto';
      this.el.dataset.gato = this.id; this.el.title = def.nombre || '';
      this.el.style.setProperty('--paso', '.5s');
      this.el.style.setProperty('--guino', entre(0, 6).toFixed(2) + 's');
      this.el.innerHTML = svgGato(def, u);
      if (def.imagen) this.cargarImagen(def.imagen);
      this.el.addEventListener('pointerup', e => { if (e.button === 0) this.mimar(); });
      centro.appendChild(this.el);
      // nacen repartidos a lo ancho, fuera de la huella de la mesa
      this.u = (i + .5) / n + entre(-.08, .08); this.v = entre(.2, .95);
      for (let k = 0; k < 10 && enMesa(this.x, this.y); k++){ this.u = entre(.05, .95); this.v = entre(.15, .95); }
      this.dir = R() < .5 ? -1 : 1;
      this.estado = 'quieto'; this.hasta = entre(.5, 4); this.rumbo = null; this.sillon = null; this.enSillon = false; this.salto = null;
      this.pintar();
    }
    cargarImagen(ruta){
      const im = new Image();
      im.onload = () => { im.alt = ''; im.draggable = false; const svg = this.el.querySelector('svg'); if (svg) svg.remove(); this.el.insertBefore(im, this.el.firstChild); this.el.classList.add('con-imagen'); };
      im.onerror = () => {};                               // sin imagen: se queda el dibujo
      im.src = ruta;
    }
    get x(){ return G.caja.left + this.u * (G.caja.right - G.caja.left); }
    get y(){ return G.caja.top + this.v * (G.caja.bottom - G.caja.top); }
    poner(x, y){ this.u = Math.max(0, Math.min(1, (x - G.caja.left) / (G.caja.right - G.caja.left))); this.v = Math.max(0, Math.min(1, (y - G.caja.top) / (G.caja.bottom - G.caja.top))); }
    cambiar(estado, dur){
      this.el.classList.remove('quieto', 'anda', 'echado', 'salta'); this.el.classList.add(estado);
      this.estado = estado; this.hasta = dur;
    }
    // ---- decidir qué hacer al terminar de estar quieto ----
    decidir(){
      const r = R();
      if (reducido){ this.cambiar(r < .5 ? 'echado' : 'quieto', entre(6, 14)); return; }
      const libre = sillones.filter(s => !s.ocupado);
      if (r < .62 || !libre.length && r < .8){
        // a caminar hasta un punto del suelo fuera de la huella de la mesa
        let tu = this.u, tv = this.v;
        for (let k = 0; k < 12; k++){
          tu = entre(.03, .97); tv = entre(.05, 1);
          const tx = G.caja.left + tu * (G.caja.right - G.caja.left), ty = G.caja.top + tv * (G.caja.bottom - G.caja.top);
          // ni dentro de la huella de la mesa, ni a dos pasos, ni encima de otro gato
          const lejosDeOtros = gatos.every(o => o === this || o.enSillon || Math.hypot(o.x - tx, o.y - ty) > G.ancho * .9 * escalaEn(ty));
          if (!enMesa(tx, ty) && Math.hypot(tx - this.x, ty - this.y) > G.ancho * .8 && lejosDeOtros) break;
        }
        this.tu = tu; this.tv = tv; this.rumbo = 'suelo'; this.dir = tu > this.u ? 1 : -1;
        this.cambiar('anda', 0);
      } else if (r < .8){
        this.cambiar('echado', entre(6, 16));
      } else {
        // al sillón: primero caminar hasta el suelo justo debajo del asiento, después el salto
        const s = elegir(libre); s.ocupado = this; this.sillon = s;
        const p = this.pieDelSillon(s);
        this.poner(this.x, this.y); this.tu = p.u; this.tv = p.v; this.rumbo = 'sillon'; this.dir = p.x > this.x ? 1 : -1;
        this.cambiar('anda', 0);
      }
    }
    pieDelSillon(s){
      const x = s.r.left + s.r.width * s.asiento.x, y = Math.max(G.caja.top, Math.min(G.caja.bottom, s.r.top + s.r.height + G.h * .03));
      return { x, y, u: (x - G.caja.left) / (G.caja.right - G.caja.left), v: (y - G.caja.top) / (G.caja.bottom - G.caja.top) };
    }
    asiento(s){ return { x: s.r.left + s.r.width * s.asiento.x, y: s.r.top + s.r.height * (s.asiento.y + .06), escala: (s.r.width * s.asiento.ancho) / G.ancho }; }
    saltar(desde, hasta, sube){
      this.salto = { x0: desde.x, y0: desde.y, s0: desde.escala, x1: hasta.x, y1: hasta.y, s1: hasta.escala, t: 0, dur: .75, sube };
      this.dir = hasta.x >= desde.x ? (Math.abs(hasta.x - desde.x) > 2 ? 1 : this.dir) : -1;
      this.cambiar('salta', 0);
    }
    // ---- un paso de tiempo ----
    tic(dt, t){
      if (this.estado === 'salta'){
        const s = this.salto; s.t = Math.min(1, s.t + dt / s.dur);
        if (s.t >= 1){
          if (s.sube){ this.enSillon = true; this.salto = null; this.cambiar('echado', entre(10, 26)); }
          else { this.enSillon = false; this.salto = null; this.poner(s.x1, s.y1); this.sillon.ocupado = null; this.sillon = null; this.cambiar('quieto', entre(1, 3)); }
        }
      } else if (this.estado === 'anda'){
        const tx = G.caja.left + this.tu * (G.caja.right - G.caja.left), ty = G.caja.top + this.tv * (G.caja.bottom - G.caja.top);
        const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
        const vel = G.h * .075 * escalaEn(this.y);          // más lento cuanto más lejos
        if (d <= vel * dt + 1){
          this.poner(tx, ty);
          if (this.rumbo === 'sillon' && this.sillon){ const a = this.asiento(this.sillon); this.saltar({ x: this.x, y: this.y, escala: escalaEn(this.y) }, a, true); }
          else this.cambiar('quieto', entre(1.5, 6));
        } else {
          this.poner(this.x + dx / d * vel * dt, this.y + dy / d * vel * dt);
          if (Math.abs(dx) > 2) this.dir = dx > 0 ? 1 : -1;
        }
      } else {
        this.hasta -= dt;
        if (this.hasta <= 0){
          if (this.enSillon){ const p = this.pieDelSillon(this.sillon); this.saltar(this.asiento(this.sillon), { x: p.x, y: p.y, escala: escalaEn(p.y) }, false); }
          else if (this.estado === 'echado') this.cambiar('quieto', entre(1, 3));
          else this.decidir();
        }
      }
      this.pintar();
    }
    pintar(){
      let x, y, s, z;
      if (this.salto){
        const k = this.salto, e = k.t < .5 ? 2 * k.t * k.t : 1 - 2 * (1 - k.t) * (1 - k.t);
        x = k.x0 + (k.x1 - k.x0) * e; y = k.y0 + (k.y1 - k.y0) * e - Math.sin(Math.PI * k.t) * G.h * .06; s = k.s0 + (k.s1 - k.s0) * e; z = 2;
      } else if (this.enSillon){
        const a = this.asiento(this.sillon); x = a.x; y = a.y; s = a.escala; z = 2;
      } else {
        x = this.x; y = this.y; s = escalaEn(y); z = y > G.mesa.base ? 4 : 2;
      }
      this.el.style.transform = 'translate(' + (x - G.ancho / 2).toFixed(1) + 'px,' + y.toFixed(1) + 'px) translateY(-100%) scale(' + s.toFixed(3) + ')';
      this.el.style.zIndex = z;
      this.el.classList.toggle('izq', this.dir < 0);
    }
    // ---- un toque: se para, ladea la cabeza y suelta corazones ----
    mimar(){
      if (this.estado === 'anda'){ this.cambiar('quieto', entre(2.5, 5)); }
      else if (this.estado === 'echado' && !this.enSillon){ this.hasta = Math.max(this.hasta, 2); }
      this.el.classList.remove('mimado'); void this.el.offsetWidth; this.el.classList.add('mimado');
      for (let k = 0; k < 3; k++){
        const c = document.createElement('i'); c.className = 'corazon';
        c.style.cssText = 'left:' + entre(30, 62).toFixed(0) + '%;animation-delay:' + (k * 160) + 'ms';
        this.el.appendChild(c); setTimeout(() => c.remove(), 1700 + k * 160);
      }
    }
  }

  // ---- arranque ----
  let gatos = [];
  function arrancar(){
    if (gatos.length) return;
    gatos = LISTA.map((def, i) => new Gato(def, i, LISTA.length));
    let ultimo = performance.now(), medicion = 0;
    function paso(t){
      const dt = Math.min(.05, (t - ultimo) / 1000); ultimo = t;
      if ((medicion += dt) > 1.5){ medicion = 0; medir(); }
      if (!document.hidden && !cuerpo.classList.contains('en-lector')) for (const g of gatos) g.tic(dt, t / 1000);
      requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
    addEventListener('resize', () => { medir(); for (const g of gatos) g.pintar(); });
  }
  window.GATOS_SALA = { lista: () => gatos, sillones, medir };
  if (!medir()){ addEventListener('load', () => { if (medir()) arrancar(); }); } else arrancar();
})();
