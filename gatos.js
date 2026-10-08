// =====================================================================
//  LOS GATOS. Cuatro gatos dibujados por código (SVG) que viven en la sala:
//  caminan por el suelo entre los sillones y la mesa (quedan detrás de la
//  mesa o delante según dónde pisen, y más chicos cuanto más lejos), se
//  sientan a mirar, se acicalan, se echan a dormir, se estiran al
//  levantarse, mueven una oreja, a veces saltan a un sillón a hacer la
//  siesta y, si se les toca, miran, maúllan (o ronronean si duermen) y
//  sueltan corazones. Cada uno con su pelaje, sacado de las fotos de los
//  gatos reales (privado/gatos/referencia/): atigrado (mackerel tabby),
//  carey brindada, tricolor (calicó) y van blanca con café.
//
//  TRES DIBUJOS POR GATO (poses): "parado" (el esqueleto que camina: cuatro
//  patas animables), "sentado" y "echado". Los tres comparten la cabeza y la
//  receta del pelaje: cada pelaje es una función del MARCO del cuerpo (caja,
//  línea del lomo, cola), así las rayas y manchas caen bien en cualquier pose.
//
//  La lista vive en libros.js (GATOS): id, pelaje, nombre (opcional), caracter
//  (opcional: pereza 0-1, velocidad, sillon "rojo"/"amarillo", voz) y,
//  opcionalmente, `imagen` (PNG/WebP del gato entero, de perfil mirando a la
//  derecha, fondo transparente; prompts en PROMPTS.md): con imagen el gato se
//  mueve como un recorte de papel en lugar del dibujo.
//
//  Parámetros de la URL:
//    ?gatos=0                        sin gatos
//    ?semilla=N                      azar repetible (capturas)
//    ?plantilla=<id>&pose=parado|sentado|echado&estilo=color|lineas|silueta[&pieza=cabeza|cuerpo|cola|patas]
//                                    dibuja ESE gato a pantalla completa sobre fondo transparente:
//                                    las plantillas para ilustrarlos con IA (_tools/plantillas_gatos.js)
// =====================================================================
(function(){
  'use strict';
  const q = new URLSearchParams(location.search);
  if (q.get('gatos') === '0') return;
  const LISTA = (typeof GATOS !== 'undefined' && Array.isArray(GATOS)) ? GATOS : [];
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // azar con semilla opcional (?semilla=N): la misma escena en cada captura
  let semilla = parseInt(q.get('semilla'), 10);
  const R = semilla > 0 ? () => { semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0; return semilla / 4294967296; } : Math.random;
  const entre = (a, b) => a + R() * (b - a);
  const elegir = a => a[Math.floor(R() * a.length)];
  const f1 = n => (Math.round(n * 10) / 10).toString();

  // =====================================================================
  //  EL DIBUJO. Lienzo de 120 × 80, el gato mira a la derecha, pisa en y = 76
  //  (el sentado es DE FRENTE, centrado en x = 60: ver POSES.sentado).
  //  La cabeza se dibuja en (92, 34) y cada pose la desplaza con `cabeza`.
  // =====================================================================
  const CABEZA = {
    cara: 'M77 34 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z',
    orejaIzq: 'M80 26 C 79 18, 80 11, 82 7 C 86 11, 90 16, 93 20 Z',
    orejaDer: 'M95 19 C 97 14, 101 9, 104 5 C 105 12, 106 19, 106 25 Z',
    dentroIzq: 'M83.5 23 L 84.5 12.5 L 90.5 19.5 Z',
    dentroDer: 'M96.5 21 L 102 10.5 L 103.5 23 Z',
  };
  // la pata de pie, en coordenadas locales (x 0-8, cadera en y 50, pisa en 76, con la zarpa hacia delante)
  const PATA = 'M0 50 h8 v22 c0 2.5 2 4 5 4 h-12 c-1.5 0 -2 -1 -2 -2.5 Z';
  const POSES = {
    parado: {
      cuerpo: 'M22 42 C 22 30, 34 25, 46 26 L 64 26 C 74 26, 82 30, 85 40 C 87 48, 82 56, 72 58 L 38 58 C 28 58, 22 52, 22 42 Z',
      bbox: [22, 26, 85, 58],
      espina: [[26, 32], [36, 27], [48, 26], [60, 26], [72, 27], [82, 33]],
      cola: 'M21 46 C 6 50, 0 36, 9 22 C 10 20, 13 21, 12 24 C 7 34, 12 42, 22 40 Z',
      colaCentro: 'M21 43 C 9 45, 5 36, 10.5 22',
      colaOrigen: [21, 43], colaSuelo: false,
      cabeza: [0, 0],
      patas: [{ n: 'ti', x: 27, lejos: true }, { n: 'di', x: 66, lejos: true }, { n: 'td', x: 35 }, { n: 'dd', x: 74 }],
      delante: () => '',
    },
    sentado: {
      // DE FRENTE (8 oct, con la foto de referencia del usuario): el gato sentado erguido mirando a
      // quien mira, el pecho alto y estrecho bajo la cabeza, las ancas redondas abriéndose a los dos
      // lados abajo, las patas delanteras rectas y juntas en el medio, la cola enroscada en el suelo a
      // la derecha. Centrado en x = 60. La cabeza común mira un poco a la derecha: queda como si
      // ladeara la mirada (y volteado, a la izquierda)
      frontal: true,
      // PROPORCIONES de la foto: alto y estrecho (el doble de alto que de ancho), la cabeza un tercio
      // largo de la altura y las patas largas. Para eso esta pose tiene su propio lienzo, más alto
      // (120 × 96, pisa en y = 92), y la cabeza común va al 80 %
      viewBox: [120, 96],
      cuerpo: 'M47 40 C 41 50, 37 68, 38 81 C 39 90, 46 92, 54 92 L 66 92 C 74 92, 81 90, 82 81 C 83 68, 79 50, 73 40 C 69 32, 51 32, 47 40 Z',
      ancas: [[43.5, 81, 9, 9.5], [76.5, 81, 9, 9.5]],          // las dos caderas: cx cy rx ry (entran en la silueta del cuerpo)
      bbox: [36, 34, 84, 92],
      espina: [[46, 41], [53, 35], [60, 34], [67, 35], [74, 41]],   // la línea de los hombros (las recetas frontales no cuelgan rayas de ella)
      cola: 'M79 86 C 91 87, 95 95, 82 95 L 70 95 C 67.5 95, 67.5 91.5, 70 91.5 L 82 91.5 C 89 91.5, 88 88.5, 79 88.5 Z',
      colaCentro: 'M79 87.2 C 89 88, 91 93.3, 82 93.3 L 70 93.3',
      colaOrigen: [79, 87], colaSuelo: true,
      sombra: [60, 92, 26, 3],
      cabeza: [-13.6, -1], cabezaEscala: .8,                   // la cara queda centrada en (60, 26), las orejas rozan arriba
      patas: [],
      delante: P => {                                            // las dos patas delanteras, largas, rectas y juntas, DELANTE del pecho
        const pata = x => '<g transform="translate(' + x + ' 0)"><path d="M0 56 h8 v33 a4 3 0 0 1 -8 0 Z" fill="' + P.base + '" stroke="' + P.borde + '" stroke-width=".8"/>' + P.pata(false, 'fd') + '</g>';
        return pata(51) + pata(61);
      },
    },
    echado: {
      cuerpo: 'M22 62 C 20 50, 34 46, 54 46 C 72 46, 86 50, 86 62 C 86 70, 80 76, 70 76 L 34 76 C 24 76, 22 70, 22 62 Z',
      bbox: [22, 46, 86, 76],
      espina: [[26, 52], [38, 47], [54, 46], [70, 47], [82, 52]],
      cola: 'M23 68 C 12 72, 14 80, 30 80 L 66 80 C 70 80, 70 76.5, 66 76.5 L 32 76.5 C 24 76.5, 22 73, 24 70 Z',
      colaCentro: 'M23 69 C 16 73, 17 78.3, 30 78.3 L 66 78.3',
      colaOrigen: [23, 69], colaSuelo: true,
      cabeza: [-2, 8],
      patas: [],
      delante: P => '<ellipse cx="74" cy="75" rx="7" ry="3" fill="' + P.base + '" stroke="' + P.borde + '" stroke-width=".8"/>' +
        '<ellipse cx="85" cy="75" rx="6" ry="3" fill="' + P.base + '" stroke="' + P.borde + '" stroke-width=".8"/>',
    },
  };

  // ---- los pelajes: recetas de manchas y rayas en función del marco F del cuerpo (bbox, espina, clips) ----
  const rel = (F, fx, fy) => [F.bbox[0] + (F.bbox[2] - F.bbox[0]) * fx, F.bbox[1] + (F.bbox[3] - F.bbox[1]) * fy];
  const ancho = F => F.bbox[2] - F.bbox[0], alto = F => F.bbox[3] - F.bbox[1];
  const elipseRel = (F, fx, fy, rx, ry, color, rot, op) => { const p = rel(F, fx, fy); return '<ellipse cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" rx="' + f1(ancho(F) * rx) + '" ry="' + f1(alto(F) * ry) + '" fill="' + color + '"' + (op ? ' opacity="' + op + '"' : '') + (rot ? ' transform="rotate(' + rot + ' ' + f1(p[0]) + ' ' + f1(p[1]) + ')"' : '') + '/>'; };
  // motas brindadas: un reparto fijo por pose (azar propio, no el de la escena) dentro de la caja del cuerpo
  function motas(F, u, colores, n, semillaLocal){
    let s = semillaLocal; const r = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    let out = '<g clip-path="url(#' + u + '-cuerpo)">';
    for (let i = 0; i < n; i++){
      const p = rel(F, .04 + r() * .92, .06 + r() * .88), rx = 1.4 + r() * 1.6, ry = .7 + r() * .6, rot = Math.round(r() * 180);
      out += '<ellipse cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '" fill="' + colores[i % colores.length] + '" opacity=".85" transform="rotate(' + rot + ' ' + f1(p[0]) + ' ' + f1(p[1]) + ')"/>';
    }
    return out + '</g>';
  }
  const PELAJES = {
    generico: {                                           // el gato genérico: gris liso, sin manchas (plantilla base y respaldo si un pelaje no existe)
      base: '#a9a098', lejos: '#8a827b', borde: '#4a4440', oreja: '#d9a0a0', ojos: ['#8aa36a', '#8aa36a'], cola: '#a9a098', voz: 1,
      cuerpo: () => '', cabeza: () => '', colaExtra: () => '', pata: () => '',
    },
    atigrado: {                                           // atigrado pelo corto gris-marrón, mackerel tabby: rayas oscuras y marcadas, panza y barbilla claras
      base: '#9a8468', lejos: '#7b6850', borde: '#3e3027', oreja: '#d9a0a0', ojos: ['#86a35b', '#86a35b'], cola: '#9a8468', voz: .85,
      cuerpo: (F, u) => {
        if (F.frontal){
          // de frente: el pecho crema en el medio (asoma entre la barbilla y las patas) y las rayas
          // curvas en los dos costados, de los hombros a las ancas; el lomo no se ve
          const lado = s => ['M' + (60 + s * 11) + ' 40 q' + (s * 6) + ' 8 ' + (s * 8) + ' 18', 'M' + (60 + s * 14) + ' 50 q' + (s * 6) + ' 9 ' + (s * 7) + ' 20',
            'M' + (60 + s * 17) + ' 62 q' + (s * 5) + ' 9 ' + (s * 5) + ' 20', 'M' + (60 + s * 15) + ' 76 q' + (s * 5) + ' 7 ' + (s * 8) + ' 14'].join(' ');
          return '<g clip-path="url(#' + u + '-cuerpo)"><ellipse cx="60" cy="68" rx="9" ry="21" fill="#dac8a9" opacity=".9"/>' +
            '<path d="' + lado(-1) + ' ' + lado(1) + '" fill="none" stroke="#3f3129" stroke-width="2.2" stroke-linecap="round" opacity=".85"/></g>';
        }
        const [x0, y0, x1, y1] = F.bbox; let d = '';
        F.espina.forEach((p, k) => { const L = (y1 - p[1]) * (k === 0 || k === F.espina.length - 1 ? .45 : .72); d += 'M' + p[0] + ' ' + (p[1] + 1) + ' q3 ' + f1(L / 2) + ' 0 ' + f1(L) + ' '; });
        for (let k = 0; k < F.espina.length - 1; k++){ const a = F.espina[k], b = F.espina[k + 1], sx = (a[0] + b[0]) / 2, sy = (a[1] + b[1]) / 2, L = (y1 - sy) * .6; d += 'M' + f1(sx) + ' ' + f1(sy + 1) + ' q-3 ' + f1(L / 2) + ' 0 ' + f1(L) + ' '; }
        return '<g clip-path="url(#' + u + '-cuerpo)"><ellipse cx="' + f1((x0 + x1) / 2) + '" cy="' + y1 + '" rx="' + f1((x1 - x0) * .42) + '" ry="' + f1((y1 - y0) * .3) + '" fill="#dac8a9" opacity=".9"/>' +
          '<path d="M' + F.espina.map(p => p.join(' ')).join(' L ') + '" fill="none" stroke="#3f3129" stroke-width="2.2" opacity=".5"/>' +
          '<path d="' + d + '" fill="none" stroke="#3f3129" stroke-width="2.3" stroke-linecap="round" opacity=".85"/></g>';
      },
      cabeza: u => '<g clip-path="url(#' + u + '-cabeza)"><path d="M85 24l2.4-6 2.4 5 2.4-5 2.4 6" fill="none" stroke="#3f3129" stroke-width="1.7" stroke-linecap="round"/>' +
        '<path d="M81 36l-4 .5M81 40l-4 2M99 24l3-4M103 29l4-2" fill="none" stroke="#3f3129" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M93 45 C 97 48, 103 47, 106 43 L 106 49 L 92 49 Z" fill="#dac8a9" opacity=".8"/></g>',
      colaExtra: (F, u) => '<g clip-path="url(#' + u + '-cola)"><path d="' + F.colaCentro + '" fill="none" stroke="#3f3129" stroke-width="12" stroke-dasharray="3 4.5" opacity=".8"/></g>',
      pata: (lejos, n) => '<path d="' + (n === 'fd' ? 'M0 62h8M0 70h8M0 78h8' : 'M0 60h8M0 66h8') + '" stroke="#3f3129" stroke-width="1.6" opacity=".7"/>',   // anillos (tres en las patas largas del sentado frontal)
    },
    carey: {                                              // carey pelo corto brindada: negro / marrón muy oscuro con motas naranjas finas y la mancha naranja en la cara
      base: '#2a211c', lejos: '#1a1411', borde: '#120d0b', oreja: '#b98484', ojos: ['#9fae4f', '#9fae4f'], cola: '#2a211c', voz: 1.15,
      cuerpo: (F, u) => motas(F, u, ['#c2702a', '#d98b3c', '#b5651f', '#e0a050'], 34, 7 + F.bbox[1]),
      cabeza: u => '<g clip-path="url(#' + u + '-cabeza)"><path d="M93 20 C 102 23, 106 33, 101 46 L 93 44 C 97 36, 95 28, 90 22 Z" fill="#c2702a" opacity=".95"/>' +
        '<ellipse cx="82" cy="40" rx="3" ry="2" fill="#d98b3c" opacity=".8"/><ellipse cx="86" cy="25" rx="2.4" ry="1.5" fill="#c2702a" opacity=".8" transform="rotate(-20 86 25)"/>' +
        '<path d="' + CABEZA.orejaDer + '" fill="#c2702a" opacity=".55"/></g>',
      colaExtra: (F, u) => '<g clip-path="url(#' + u + '-cola)"><path d="' + F.colaCentro + '" fill="none" stroke="#c2702a" stroke-width="12" stroke-dasharray="2 6.5" opacity=".7"/></g>',
      pata: (lejos, n) => n === 'td' ? '<ellipse cx="4" cy="58" rx="2.6" ry="1.8" fill="#d98b3c" opacity=".8"/>' : '',
    },
    tricolor: {                                           // tricolor (calicó) pelo corto: blanca de panza, pecho y patas, con manchas grandes negras y naranjas en el lomo y la cara partida
      base: '#f4efe6', lejos: '#dcd4c7', borde: '#7a6a5a', oreja: '#e3a7a7', ojos: ['#b5b24c', '#b5b24c'], cola: '#2a211d', voz: 1,
      cuerpo: (F, u) => {
        if (F.frontal) return '<g clip-path="url(#' + u + '-cuerpo)">' + elipseRel(F, .17, .32, .2, .34, '#2a211d', 12) + elipseRel(F, .86, .58, .15, .28, '#c9742c', -8) + elipseRel(F, .72, .1, .12, .14, '#2a211d') + '</g>';   // de frente: pecho blanco, negro en el hombro izquierdo, naranja en el costado derecho
        const y1 = F.bbox[3], arriba = F.espina.map(p => p[0] + ' ' + (p[1] - 3)), abajo = F.espina.slice().reverse().map(p => p[0] + ' ' + f1(p[1] + (y1 - p[1]) * .55));
        return '<g clip-path="url(#' + u + '-cuerpo)"><path d="M' + arriba.join(' L ') + ' L ' + abajo.join(' L ') + ' Z" fill="#2a211d"/>' +
          elipseRel(F, .78, .3, .14, .2, '#c9742c', -10) + elipseRel(F, .12, .5, .12, .22, '#c9742c') + elipseRel(F, .5, .72, .1, .12, '#c9742c', 10) + '</g>';
      },
      cabeza: u => '<g clip-path="url(#' + u + '-cabeza)"><path d="M80 26 L 82 7 L 93 20 L 92 32 L 80 34 Z" fill="#2a211d"/><path d="M95 19 L 104 5 L 106 25 L 107 38 L 99 34 L 97 24 Z" fill="#c9742c"/></g>',
      colaExtra: (F, u) => '<g clip-path="url(#' + u + '-cola)"><path d="' + F.colaCentro + '" fill="none" stroke="#c9742c" stroke-width="12" stroke-dasharray="0 9 9 100"/></g>',
      pata: () => '',
    },
    van_cafe: {                                           // van turca pelo corto: blanca con café (canela) en la gorrita partida por la raya blanca, tres lunares en el lomo y la cola
      base: '#f4efe6', lejos: '#dcd4c7', borde: '#7a6a5a', oreja: '#e3a7a7', ojos: ['#a9b35a', '#a9b35a'], cola: '#bf7a3c', voz: 1.05,
      cuerpo: (F, u) => F.frontal
        ? '<g clip-path="url(#' + u + '-cuerpo)">' + elipseRel(F, .1, .36, .08, .13, '#bf7a3c') + elipseRel(F, .93, .5, .07, .1, '#bf7a3c') + '</g>'   // de frente: blanca; los lunares del lomo apenas asoman por los bordes
        : '<g clip-path="url(#' + u + '-cuerpo)">' + elipseRel(F, .25, .22, .11, .19, '#bf7a3c', -15) + elipseRel(F, .52, .14, .1, .17, '#b86f33') + elipseRel(F, .84, .5, .1, .18, '#bf7a3c', 20) + '</g>',
      cabeza: u => '<g clip-path="url(#' + u + '-cabeza)"><path d="M80 26 L 82 7 L 93 20 L 90 29 L 81 31 Z" fill="#bf7a3c"/><path d="M95 19 L 104 5 L 106 25 L 105 31 L 97 29 Z" fill="#bf7a3c"/>' +
        '<ellipse cx="83" cy="38" rx="2.8" ry="2" fill="#bf7a3c" opacity=".7"/></g>',
      colaExtra: () => '',
      pata: () => '',
    },
  };

  function svgPata(p, P, u){
    const color = p.lejos ? P.lejos : P.base;
    return '<g transform="translate(' + p.x + ' 0)"><g class="pata ' + p.n + '"><path d="' + PATA + '" fill="' + color + '" stroke="' + P.borde + '" stroke-width=".8"/>' + (p.lejos ? '' : P.pata(p.lejos, p.n)) + '</g></g>';
  }
  function svgCabeza(P, u, F){
    return '<g class="con-cabeza" transform="translate(' + F.cabeza[0] + ' ' + F.cabeza[1] + ')' + (F.cabezaEscala ? ' scale(' + F.cabezaEscala + ')' : '') + '"><g class="cabeza">' +
      '<path d="' + CABEZA.orejaIzq + '" fill="' + P.base + '" stroke="' + P.borde + '" stroke-width=".9" stroke-linejoin="round"/>' +
      '<g class="oreja"><path d="' + CABEZA.orejaDer + '" fill="' + P.base + '" stroke="' + P.borde + '" stroke-width=".9" stroke-linejoin="round"/></g>' +
      '<path d="' + CABEZA.cara + '" fill="' + P.base + '" stroke="' + P.borde + '" stroke-width=".9"/>' +
      P.cabeza(u) +
      '<path d="' + CABEZA.dentroIzq + '" fill="' + P.oreja + '" opacity=".9"/><g class="oreja"><path d="' + CABEZA.dentroDer + '" fill="' + P.oreja + '" opacity=".9"/></g>' +
      '<ellipse cx="99" cy="41" rx="7" ry="5" fill="#fff" opacity=".35"/>' +
      '<g class="ojos"><ellipse cx="86.5" cy="32.5" rx="2.7" ry="3.4" fill="' + P.ojos[0] + '"/><ellipse cx="97.5" cy="31.5" rx="2.7" ry="3.4" fill="' + P.ojos[1] + '"/>' +
      '<g class="pupilas"><ellipse cx="86.5" cy="32.5" rx="1" ry="3" fill="#1a1512"/><ellipse cx="97.5" cy="31.5" rx="1" ry="3" fill="#1a1512"/>' +
      '<circle cx="85.6" cy="31.2" r=".8" fill="#fff" opacity=".9"/><circle cx="96.6" cy="30.2" r=".8" fill="#fff" opacity=".9"/></g></g>' +
      '<path d="M99.6 38.6 l-2.4 0 l1.2 1.9 Z" fill="#c97f8a"/><path d="M98.4 40.5 q1.6 2 3.2 0" fill="none" stroke="#3a2a22" stroke-width=".7"/>' +
      '<path d="M104 39 l9 -2.5 M104.5 41.5 l9.5 1" fill="none" stroke="#fff" stroke-width=".8" opacity=".75"/>' +
      '</g></g>';
  }
  // el SVG completo de un gato en una pose; u = prefijo único para clips y degradados
  function svgGato(def, pose, u){
    const P = PELAJES[def.pelaje] || PELAJES.generico, F = POSES[pose] || POSES.parado;
    // las caderas redondas (una en el sentado de perfil de antes, dos en el frontal): elipses que se suman a la silueta
    const ancas = (F.ancas || (F.anca ? [F.anca] : [])).map(a => '<ellipse cx="' + a[0] + '" cy="' + a[1] + '" rx="' + a[2] + '" ry="' + a[3] + '"');
    const conAncas = resto => ancas.map(a => a + resto).join('');
    const sombra = F.sombra || [54, 76, 36, 3.5], vb = F.viewBox || [120, 80];   // el sentado frontal usa un lienzo más alto
    return '<svg viewBox="0 0 ' + vb[0] + ' ' + vb[1] + '" aria-hidden="true" data-pose="' + pose + '">' +
      '<defs><clipPath id="' + u + '-cuerpo"><path d="' + F.cuerpo + '"/>' + conAncas('/>') + '</clipPath>' +
      '<clipPath id="' + u + '-cabeza"><path d="' + CABEZA.cara + '"/><path d="' + CABEZA.orejaIzq + '"/><path d="' + CABEZA.orejaDer + '"/></clipPath>' +
      '<clipPath id="' + u + '-cola"><path d="' + F.cola + '"/></clipPath>' +
      '<linearGradient id="' + u + '-luz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></linearGradient></defs>' +
      '<ellipse class="sombra" cx="' + sombra[0] + '" cy="' + sombra[1] + '" rx="' + sombra[2] + '" ry="' + sombra[3] + '" fill="rgba(0,0,0,.35)"/>' +
      '<g class="cola' + (F.colaSuelo ? ' suelo' : '') + '" style="transform-origin:' + F.colaOrigen[0] + 'px ' + F.colaOrigen[1] + 'px"><path d="' + F.cola + '" fill="' + P.cola + '" stroke="' + P.borde + '" stroke-width=".8"/>' + P.colaExtra(F, u) + '</g>' +
      F.patas.map(p => svgPata(p, P, u)).join('') +
      '<g class="torso">' +
      conAncas(' fill="' + P.base + '" stroke="' + P.borde + '" stroke-width=".9"/>') +
      '<path class="cuerpo" d="' + F.cuerpo + '" fill="' + P.base + '" stroke="' + P.borde + '" stroke-width=".9"/>' +
      conAncas(' fill="' + P.base + '"/>') +                                  // tapa la costura entre las ancas y el torso
      P.cuerpo(F, u) +
      '<path d="' + F.cuerpo + '" fill="url(#' + u + '-luz)"/>' + conAncas(' fill="url(#' + u + '-luz)"/>') +
      '<g class="delante">' + F.delante(P) + '</g>' +
      svgCabeza(P, u, F) +
      '</g></svg>';
  }

  // =====================================================================
  //  LAS PLANTILLAS (?plantilla=id&pose=&estilo=&pieza=): el dibujo solo, a
  //  pantalla completa, sobre fondo transparente, para ilustrarlo con IA
  // =====================================================================
  if (q.has('plantilla')){
    const def = LISTA.find(g => g.id === q.get('plantilla')) || { id: q.get('plantilla'), pelaje: q.get('plantilla') };
    const pose = POSES[q.get('pose')] ? q.get('pose') : 'parado', estilo = q.get('estilo') || 'color', pieza = q.get('pieza') || '';
    document.documentElement.classList.add('plantilla');
    document.body.classList.add('plantilla', 'estilo-' + estilo, pieza ? 'pieza-' + pieza : 'pieza-todo');
    const d = document.createElement('div'); d.id = 'plantilla';
    d.innerHTML = svgGato(def, pose, 'pl');
    document.body.appendChild(d);
    document.title = 'plantilla ' + def.id + ' ' + pose;
    window.GATOS_SALA = { plantilla: true, svg: (id, p) => svgGato(LISTA.find(g => g.id === id) || { pelaje: id }, p, 'x') };
    return;
  }

  // =====================================================================
  //  LA SALA: geometría del suelo (en coordenadas del .centro)
  // =====================================================================
  const centro = document.querySelector('#sala .centro'), suelo = document.querySelector('#sala .suelo');
  const mesa = centro && centro.querySelector('.mesa');
  if (!LISTA.length || !centro || !suelo || !mesa) return;
  const cuerpo = document.body;
  // `asiento`: dónde apoya el gato (fracciones de la caja del sillón ILUSTRADO; el dibujo SVG de
  // respaldo tiene otra proporción y solo tiene que quedar razonable). La `y` es el punto de apoyo:
  // en el club rojo el cojín va del 38 % al 65 % de alto, en el orejero amarillo del 58 % al 74 %;
  // el gato se apoya hacia la mitad del cojín, arrimado al respaldo, no en la orilla
  const sillones = [...centro.querySelectorAll('.sillon')].map(el => ({
    el, ocupado: null, nombre: el.classList.contains('amarillo') ? 'amarillo' : 'rojo',
    asiento: el.classList.contains('amarillo') ? { x: .5, y: .60, ancho: .39 } : { x: .5, y: .48, ancho: .43 },
  }));
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
  // el sillón cambia de alto cuando carga su imagen de DECORACION (el SVG de respaldo es más
  // cuadrado): se vuelve a medir en cuanto cambia, no solo en el repaso de cada 1.5 s
  if (typeof ResizeObserver === 'function'){
    const ro = new ResizeObserver(() => { if (medir()) for (const g of gatos) g.pintar(); });
    for (const s of sillones) ro.observe(s.el);
  }
  const escalaEn = y => { const c = G.caja; return .55 + .45 * Math.max(0, Math.min(1, (y - c.top) / (c.bottom - c.top))); };
  // la huella de la mesa: ahí no se paran (quedarían dentro de la mesa o tapados por ella)
  const enMesa = (x, y) => { const m = G.mesa; return x > m.left && x < m.right && y > m.top + (m.base - m.top) * .3 && y < m.base + G.h * .012; };

  // =====================================================================
  //  LA VOZ: maullido y ronroneo sintetizados (Web Audio), al tocar
  // =====================================================================
  let ac = null;
  const callados = () => { const b = document.getElementById('musica-btn'); return b && b.classList.contains('apagada'); };
  function audio(){ if (!ac){ try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
  function maullar(voz){
    const a = audio(); if (!a || callados()) return;
    const t = a.currentTime, f0 = 520 * voz;
    const o = a.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * 1.6, t + .12); o.frequency.linearRampToValueAtTime(f0 * 1.25, t + .3); o.frequency.linearRampToValueAtTime(f0 * .88, t + .48);
    const v = a.createOscillator(); v.frequency.value = 6.5; const vg = a.createGain(); vg.gain.value = 9 * voz; v.connect(vg); vg.connect(o.frequency);
    const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.2;
    bp.frequency.setValueAtTime(900 * voz, t); bp.frequency.linearRampToValueAtTime(1900 * voz, t + .16); bp.frequency.linearRampToValueAtTime(1100 * voz, t + .48);
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3400;
    const g = a.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.13, t + .05); g.gain.setValueAtTime(.13, t + .3); g.gain.exponentialRampToValueAtTime(.001, t + .52);
    o.connect(bp); bp.connect(lp); lp.connect(g); g.connect(a.destination);
    o.start(t); v.start(t); o.stop(t + .55); v.stop(t + .55);
  }
  function ronronear(){
    const a = audio(); if (!a || callados()) return;
    const t = a.currentTime, dur = 1.8, n = a.createBufferSource(), buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = buf;
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240;
    const am = a.createGain(); am.gain.value = .5;
    const lfo = a.createOscillator(); lfo.frequency.value = 24; const lg = a.createGain(); lg.gain.value = .5; lfo.connect(lg); lg.connect(am.gain);
    const g = a.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.4, t + .3); g.gain.setValueAtTime(.4, t + dur - .5); g.gain.linearRampToValueAtTime(0, t + dur);
    n.connect(lp); lp.connect(am); am.connect(g); g.connect(a.destination);
    n.start(t); lfo.start(t); n.stop(t + dur); lfo.stop(t + dur);
  }

  // =====================================================================
  //  CADA GATO: una maquinita de estados (quieto, anda, sentado, echado,
  //  estira, salta) y su posición normalizada (u, v) dentro de la caja
  // =====================================================================
  const POSE_DE = { quieto: 'parado', anda: 'parado', salta: 'parado', estira: 'parado', sentado: 'sentado', echado: 'echado' };
  const ESTADOS = Object.keys(POSE_DE);
  let gatos = [];
  class Gato {
    constructor(def, i, n){
      this.def = def; this.id = def.id || ('gato' + i);
      this.u = 'g-' + this.id.replace(/[^\w-]/g, '');
      const c = def.caracter || {};
      this.car = { pereza: Math.max(0, Math.min(1, c.pereza != null ? +c.pereza : .5)), velocidad: c.velocidad > 0 ? +c.velocidad : 1, sillon: c.sillon || null,
        voz: c.voz > 0 ? +c.voz : ((PELAJES[def.pelaje] || PELAJES.generico).voz || 1) };
      this.el = document.createElement('div');
      this.el.className = 'gato ' + (PELAJES[def.pelaje] ? def.pelaje : 'generico') + ' quieto';
      this.el.dataset.gato = this.id; if (def.nombre) this.el.title = def.nombre;
      this.el.style.setProperty('--paso', f1(.5 / this.car.velocidad) + 's');
      this.el.style.setProperty('--guino', entre(0, 6).toFixed(2) + 's');
      this.lienzo = document.createElement('div'); this.lienzo.className = 'dibujo-gato'; this.el.appendChild(this.lienzo);
      this.svgs = {}; this.pose = ''; this.ponerPose('parado', true);
      this.imgs = {};                                      // ilustrado: una imagen por pose (echado, sentado) que sustituye a las piezas
      if (def.piezas) this.cargarPiezas(def.piezas, { echado: def.echado, sentado: def.sentado }); else if (def.imagen) this.cargarImagen(def.imagen);
      this.el.addEventListener('pointerup', e => { if (e.button === 0) this.mimar(e); });
      centro.appendChild(this.el);
      // nacen repartidos a lo ancho, fuera de la huella de la mesa
      this.posU = (i + .5) / n + entre(-.08, .08); this.posV = entre(.2, .95);
      for (let k = 0; k < 10 && enMesa(this.x, this.y); k++){ this.posU = entre(.05, .95); this.posV = entre(.15, .95); }
      this.dir = R() < .5 ? -1 : 1;
      this.estado = 'quieto'; this.hasta = entre(.5, 4); this.rumbo = null; this.sillon = null; this.enSillon = false; this.salto = null;
      this.orejaT = entre(2, 7); this.gestoT = entre(2, 5);
      this.pintar();
    }
    cargarImagen(ruta){
      const im = new Image();
      im.onload = () => { im.alt = ''; im.draggable = false; this.lienzo.innerHTML = ''; this.lienzo.appendChild(im); this.el.classList.add('con-imagen'); this.conImagen = true; };
      im.onerror = () => {};                               // sin imagen: se queda el dibujo
      im.src = ruta;
    }
    // el gato ilustrado en piezas (las corta _tools/gato_piezas.py): cola, patas traseras, patas
    // delanteras, cuerpo y cabeza, cada una en su sitio del lienzo y con su pivote; el CSS las anima
    // `rutas` (opcional): { echado, sentado } = la ilustración del mismo gato en esa pose
    // (_tools/gato_pose.py), que sustituye a las piezas mientras dura; sin ellas, el ilustrado
    // solo tiene la pose de pie (se queda mirando en vez de sentarse o echarse)
    cargarPiezas(ruta, rutas){
      fetch(ruta).then(r => r.ok ? r.json() : Promise.reject()).then(meta => {
        const base = ruta.slice(0, ruta.lastIndexOf('/') + 1), W = meta.lienzo[0], H = meta.lienzo[1];
        const orden = Object.keys(meta.piezas).sort((a, b) => meta.piezas[a].z - meta.piezas[b].z);
        const cont = document.createElement('div'); cont.className = 'piezas'; cont.style.aspectRatio = W + ' / ' + H;
        let faltan = orden.length;
        for (const nombre of orden){
          const p = meta.piezas[nombre], im = new Image(); im.alt = ''; im.draggable = false; im.className = 'pz ' + nombre;
          im.style.cssText = 'left:' + (p.x / W * 100).toFixed(2) + '%;top:' + (p.y / H * 100).toFixed(2) + '%;width:' + (p.w / W * 100).toFixed(2) + '%;' +
            'transform-origin:' + ((p.pivote[0] - p.x) / p.w * 100).toFixed(1) + '% ' + ((p.pivote[1] - p.y) / p.h * 100).toFixed(1) + '%';
          im.onload = () => {
            if (--faltan) return;
            this.lienzo.innerHTML = ''; this.lienzo.appendChild(cont); this.piezasEl = cont;
            this.el.classList.add('con-piezas'); this.conImagen = true; this.conPiezas = true;
            for (const p of Object.keys(this.imgs)){ this.lienzo.appendChild(this.imgs[p]); this.imgs[p].hidden = this.pose !== p; }
            if (this.pose !== 'parado'){ if (this.imgs[this.pose]) cont.hidden = true; else this.cambiar('quieto', entre(2, 5)); }   // sin imagen de esa pose: de pie
          };
          im.onerror = () => {};                             // si falta una pieza, el gato se queda dibujado
          im.src = base + nombre + '.webp';
          cont.appendChild(im);
        }
      }).catch(() => {});
      for (const pose of Object.keys(rutas || {})) if (rutas[pose]) this.cargarPoseImagen(pose, rutas[pose]);
    }
    cargarPoseImagen(pose, ruta){
      const env = document.createElement('div'); env.className = 'pose-env ' + pose; env.hidden = true;
      const im = new Image(); im.alt = ''; im.draggable = false;
      im.onload = () => {
        env.appendChild(im); this.imgs[pose] = env;
        if (this.piezasEl){ this.lienzo.appendChild(env); env.hidden = this.pose !== pose; if (!env.hidden) this.piezasEl.hidden = true; }
      };
      im.onerror = () => {};                                 // sin imagen: el ilustrado no hace esa pose
      im.src = ruta;
    }
    // ¿puede hacer esa pose? el dibujado siempre; el ilustrado solo de pie o con la imagen de la pose
    tienePose(pose){ return pose === 'parado' || !this.conImagen || !!this.imgs[pose]; }
    // en el sillón: echado o sentado, lo que tenga (`tras` = la pose que acaba, para pasar a la otra)
    poseEnSillon(tras){
      const p = ['echado', 'sentado'].filter(q => q !== tras && this.tienePose(q));
      return !p.length ? 'quieto' : p.length === 1 ? p[0] : (R() < .6 ? 'echado' : 'sentado');
    }
    ponerPose(pose, directo){
      if (pose === this.pose) return;
      if (this.conPiezas){                                   // ilustrado: piezas de pie o la imagen de la pose
        if (pose !== 'parado' && !this.imgs[pose]) return;
        this.pose = pose;
        const cambio = () => { this.piezasEl.hidden = pose !== 'parado'; for (const p of Object.keys(this.imgs)) this.imgs[p].hidden = p !== pose; this.lienzo.classList.remove('cambiando'); };
        if (directo) cambio();
        else { this.lienzo.classList.add('cambiando'); clearTimeout(this.poseT); this.poseT = setTimeout(cambio, 170); }
        return;
      }
      if (this.conImagen) return;
      this.pose = pose;
      if (!this.svgs[pose]) this.svgs[pose] = svgGato(this.def, pose, this.u + '-' + pose);
      const cambio = () => { this.lienzo.innerHTML = this.svgs[pose]; this.lienzo.classList.remove('cambiando'); };
      if (directo) cambio();
      else { this.lienzo.classList.add('cambiando'); clearTimeout(this.poseT); this.poseT = setTimeout(cambio, 170); }
    }
    get x(){ return G.caja.left + this.posU * (G.caja.right - G.caja.left); }
    get y(){ return G.caja.top + this.posV * (G.caja.bottom - G.caja.top); }
    poner(x, y){ this.posU = Math.max(0, Math.min(1, (x - G.caja.left) / (G.caja.right - G.caja.left))); this.posV = Math.max(0, Math.min(1, (y - G.caja.top) / (G.caja.bottom - G.caja.top))); }
    cambiar(estado, dur){
      this.el.classList.remove(...ESTADOS); this.el.classList.add(estado);
      this.estado = estado; this.hasta = dur;
      this.ponerPose(POSE_DE[estado]);
    }
    gesto(clase, ms){ this.el.classList.remove(clase); void this.el.offsetWidth; this.el.classList.add(clase); setTimeout(() => this.el.classList.remove(clase), ms); }
    // ---- decidir qué hacer al terminar de estar quieto ----
    decidir(){
      const libres = sillones.filter(s => !s.ocupado);
      const pref = this.car.sillon ? libres.filter(s => s.nombre === this.car.sillon) : [];
      if (reducido){ this.cambiar(this.poseEnSillon(null), entre(6, 14)); return; }
      const pesos = [['anda', .5], ['sentado', .16 + .1 * (1 - this.car.pereza)], ['echado', .1 + .26 * this.car.pereza], ['sillon', libres.length ? .12 + (pref.length ? .06 : 0) : 0]];
      let r = R() * pesos.reduce((s, p) => s + p[1], 0), que = 'anda';
      for (const p of pesos){ if ((r -= p[1]) <= 0){ que = p[0]; break; } }
      if (que === 'anda'){
        // a caminar hasta un punto del suelo fuera de la huella de la mesa y lejos de los demás
        let tu = this.posU, tv = this.posV;
        for (let k = 0; k < 12; k++){
          tu = entre(.03, .97); tv = entre(.05, 1);
          const tx = G.caja.left + tu * (G.caja.right - G.caja.left), ty = G.caja.top + tv * (G.caja.bottom - G.caja.top);
          const lejosDeOtros = gatos.every(o => o === this || o.enSillon || Math.hypot(o.x - tx, o.y - ty) > G.ancho * .9 * escalaEn(ty));
          if (!enMesa(tx, ty) && Math.hypot(tx - this.x, ty - this.y) > G.ancho * .8 && lejosDeOtros) break;
        }
        this.tu = tu; this.tv = tv; this.rumbo = 'suelo'; this.dir = tu > this.posU ? 1 : -1;
        this.cambiar('anda', 0);
      } else if (que === 'sentado'){
        // el ilustrado sin imagen sentada se queda mirando (o se echa, si tiene la echada)
        this.cambiar(this.tienePose('sentado') ? 'sentado' : (this.tienePose('echado') && R() < .5 ? 'echado' : 'quieto'), entre(6, 15)); this.gestoT = entre(1.5, 4);
      } else if (que === 'echado'){
        this.cambiar(this.tienePose('echado') ? 'echado' : 'quieto', entre(7, 18));
      } else {
        // al sillón: primero caminar hasta el suelo justo debajo del asiento, después el salto
        const s = pref.length ? elegir(pref) : elegir(libres); s.ocupado = this; this.sillon = s;
        const p = this.pieDelSillon(s);
        this.tu = p.u; this.tv = p.v; this.rumbo = 'sillon'; this.dir = p.x > this.x ? 1 : -1;
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
      if (Math.abs(hasta.x - desde.x) > 2) this.dir = hasta.x > desde.x ? 1 : -1;
      this.cambiar('salta', 0);
    }
    // ---- un paso de tiempo ----
    tic(dt){
      // gestos sueltos: la oreja (en cualquier estado menos andando) y acicalarse (sentado)
      if (this.estado !== 'anda' && this.estado !== 'salta' && (this.orejaT -= dt) <= 0){ this.orejaT = entre(3, 9); this.gesto('oreja', 500); }
      if (this.estado === 'sentado' && (this.gestoT -= dt) <= 0){ this.gestoT = entre(3, 7); if (R() < .55) this.gesto('acicala', 2400); }
      if (this.estado === 'salta'){
        const s = this.salto; s.t = Math.min(1, s.t + dt / s.dur);
        if (s.t >= 1){
          if (s.sube){ this.enSillon = true; this.salto = null; this.fases = 0; this.cambiar(this.poseEnSillon(null), entre(10, 26)); this.gestoT = entre(2, 5); }
          else { this.enSillon = false; this.salto = null; this.poner(s.x1, s.y1); this.sillon.ocupado = null; this.sillon = null; this.cambiar('quieto', entre(1, 3)); }
        }
      } else if (this.estado === 'anda'){
        const tx = G.caja.left + this.tu * (G.caja.right - G.caja.left), ty = G.caja.top + this.tv * (G.caja.bottom - G.caja.top);
        const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
        const vel = G.h * .075 * this.car.velocidad * escalaEn(this.y);          // más lento cuanto más lejos
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
          if (this.enSillon){
            // en el sillón: a veces cambia de postura una vez (se sienta a mirar y luego se echa, o al revés) antes de bajar
            const otra = this.poseEnSillon(this.estado);
            if (this.fases < 1 && otra !== 'quieto' && R() < .6){ this.fases++; this.cambiar(otra, entre(6, 16)); this.gestoT = entre(2, 5); }
            else { const p = this.pieDelSillon(this.sillon); this.saltar(this.asiento(this.sillon), { x: p.x, y: p.y, escala: escalaEn(p.y) }, false); }
          }
          else if (this.estado === 'echado') this.cambiar('estira', .9);
          else if (this.estado === 'estira' || this.estado === 'sentado') this.cambiar('quieto', entre(1, 3));
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
    // ---- un toque: mira hacia donde tocaron, se para, ladea la cabeza, maúlla (o ronronea dormido) y suelta corazones ----
    mimar(e){
      if (e && !this.enSillon && this.estado !== 'salta'){ const r = this.el.getBoundingClientRect(); const lado = e.clientX < r.left + r.width / 2 ? -1 : 1; if (lado !== this.dir && this.estado !== 'anda') this.dir = lado; }
      if (this.estado === 'anda'){ this.cambiar('quieto', entre(2.5, 5)); }
      else if (this.estado === 'echado' && !this.enSillon){ this.hasta = Math.max(this.hasta, 2); }
      if (this.estado === 'echado') ronronear(); else maullar(this.car.voz);
      this.gesto('mimado', 1000);
      if (this.def.nombre && !this.el.querySelector('.nombre-gato')){         // su nombre, un momento, sobre la cabeza
        const n = document.createElement('i'); n.className = 'nombre-gato'; n.textContent = this.def.nombre;
        this.el.appendChild(n); setTimeout(() => n.remove(), 2200);
      }
      for (let k = 0; k < 3; k++){
        const c = document.createElement('i'); c.className = 'corazon';
        c.style.cssText = 'left:' + entre(30, 62).toFixed(0) + '%;animation-delay:' + (k * 160) + 'ms';
        this.el.appendChild(c); setTimeout(() => c.remove(), 1700 + k * 160);
      }
      this.pintar();
    }
  }

  // ---- arranque ----
  function arrancar(){
    if (gatos.length) return;
    gatos = LISTA.map((def, i) => new Gato(def, i, LISTA.length));
    let ultimo = performance.now(), medicion = 0;
    function paso(t){
      const dt = Math.min(.05, (t - ultimo) / 1000); ultimo = t;
      if ((medicion += dt) > 1.5){ medicion = 0; medir(); }
      if (!document.hidden && !cuerpo.classList.contains('en-lector')) for (const g of gatos) g.tic(dt);
      requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
    addEventListener('resize', () => { medir(); for (const g of gatos) g.pintar(); });
  }
  window.GATOS_SALA = { lista: () => gatos, sillones, medir, poses: Object.keys(POSES), svg: (id, pose) => svgGato(LISTA.find(g => g.id === id) || { pelaje: id }, pose, 'x-' + pose) };
  if (!medir()){ addEventListener('load', () => { if (medir()) arrancar(); }); } else arrancar();
})();
