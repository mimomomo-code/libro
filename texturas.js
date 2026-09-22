// =====================================================================
//  TEXTURAS. Tramas repetibles generadas en un canvas al cargar (nada que
//  descargar): veta de madera, tejido, terciopelo, grano de papel y cuero.
//  Cada una se cuelga como variable CSS (--tex-madera-v, --tex-tejido...)
//  y el CSS la pone como primera capa del fondo con
//  background-blend-mode: multiply, así los colores de siempre se conservan
//  y solo ganan relieve. Son baldosas de 256 px en gris: donde la baldosa
//  es blanca no cambia nada, donde oscurece marca la veta o el hilo.
//
//  También viste los sillones: sobre el dibujo SVG pone una capa de tejido
//  recortada con la propia silueta (mask-image), y si en libros.js
//  DECORACION apunta a una imagen que existe, la usa en lugar del dibujo.
// =====================================================================
(function(){
  'use strict';
  const N = 256;

  // Ruido de valor PERIÓDICO: la retícula envuelve, así la baldosa repite sin costura.
  function ruido(gx, gy, semilla){
    let s = (semilla | 0) || 1;
    const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    const v = new Float32Array(gx * gy);
    for (let i = 0; i < v.length; i++) v[i] = rnd();
    const suave = t => t * t * (3 - 2 * t);
    return (x, y) => {
      const u = x * gx, w = y * gy;
      const iu = Math.floor(u), iw = Math.floor(w);
      const i0 = iu % gx, j0 = iw % gy, i1 = (i0 + 1) % gx, j1 = (j0 + 1) % gy;
      const fu = suave(u - iu), fw = suave(w - iw);
      const a = v[j0 * gx + i0], b = v[j0 * gx + i1], c = v[j1 * gx + i0], d = v[j1 * gx + i1];
      const arriba = a + (b - a) * fu, abajo = c + (d - c) * fu;
      return arriba + (abajo - arriba) * fw;
    };
  }
  function baldosa(fn){
    const c = document.createElement('canvas'); c.width = c.height = N;
    const ctx = c.getContext('2d'), img = ctx.createImageData(N, N), d = img.data;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
      const l = Math.round(Math.max(0, Math.min(1, fn(x / N, y / N))) * 255), k = (y * N + x) * 4;
      d[k] = d[k + 1] = d[k + 2] = l; d[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    let url = c.toDataURL('image/webp', .92);
    if (url.indexOf('image/webp') < 0) url = c.toDataURL('image/png');
    return 'url("' + url + '")';
  }

  // madera: vetas largas (ruido estirado) convertidas en anillos con un seno
  const vA = ruido(26, 3, 11), vB = ruido(52, 6, 12), vC = ruido(96, 96, 13);
  const madera = (x, y) => {
    const base = vA(x, y) * .65 + vB(x, y) * .35;
    const anillo = .5 + .5 * Math.sin(base * 6.2832 * 3.2 + vC(x, y) * 1.3);
    return .80 + .16 * anillo + .05 * (vC(x, y) - .5);
  };
  // tejido: dos familias de hilos que se cruzan, con el hilo de arriba alternando
  const tT = ruido(32, 32, 21);
  const tejido = (x, y) => {
    const f = 16;
    const a = .5 + .5 * Math.sin(x * 6.2832 * f), b = .5 + .5 * Math.sin(y * 6.2832 * f);
    const cruz = ((Math.floor(x * f) + Math.floor(y * f)) & 1) ? a : b;
    return .82 + .14 * cruz + .05 * (tT(x, y) - .5);
  };
  // terciopelo: grano fino con un leve peinado vertical
  const pA = ruido(48, 48, 31), pB = ruido(10, 80, 32);
  const terciopelo = (x, y) => .85 + .10 * pA(x, y) + .06 * (pB(x, y) - .5);
  // papel: grano muy leve y sin celdas pequeñas (el texto tiene que seguir limpio)
  const gP = ruido(34, 34, 41), gQ = ruido(9, 9, 42);
  const papel = (x, y) => .975 + .02 * (gP(x, y) - .5) * 2 + .012 * (gQ(x, y) - .5) * 2;
  // cuero: celdas finas y poro, con poco contraste
  const cA = ruido(44, 44, 51), cB = ruido(96, 96, 52), cC = ruido(12, 12, 53);
  const cuero = (x, y) => { const n = cA(x, y); return .86 + .09 * n * n * (3 - 2 * n) + .03 * (cB(x, y) - .5) + .04 * (cC(x, y) - .5); };

  const raiz = document.documentElement.style;
  raiz.setProperty('--tex-madera-v', baldosa(madera));
  raiz.setProperty('--tex-madera-h', baldosa((x, y) => madera(y, x)));
  raiz.setProperty('--tex-tejido', baldosa(tejido));
  raiz.setProperty('--tex-terciopelo', baldosa(terciopelo));
  raiz.setProperty('--tex-papel', baldosa(papel));
  raiz.setProperty('--tex-cuero', baldosa(cuero));
  document.documentElement.classList.add('con-texturas');

  // ---- los sillones: tejido recortado con la silueta, o la imagen de DECORACION si existe ----
  function vestir(sillon){
    const svg = sillon.querySelector('svg');
    let tela = sillon.querySelector('.tela');
    if (!svg){ if (tela) tela.remove(); return; }          // con imagen propia no hace falta
    if (!tela){ tela = document.createElement('i'); tela.className = 'tela'; sillon.appendChild(tela); }
    const mascara = 'url("data:image/svg+xml,' + encodeURIComponent(new XMLSerializer().serializeToString(svg)) + '")';
    tela.style.webkitMaskImage = mascara; tela.style.maskImage = mascara;
  }
  document.querySelectorAll('.sillon').forEach(vestir);

  const DEC = (typeof DECORACION === 'object' && DECORACION) ? DECORACION : {};
  for (const clave of Object.keys(DEC)){
    const el = document.querySelector('.sillon[data-pieza="' + clave + '"]'), ruta = DEC[clave];
    if (!el || !ruta) continue;
    const im = new Image();
    im.onload = () => {
      const svg = el.querySelector('svg'); if (svg) svg.remove();
      im.alt = ''; im.draggable = false;
      el.insertBefore(im, el.firstChild); el.classList.add('con-imagen');
      vestir(el);
    };
    im.onerror = () => {};                                 // sin imagen: se queda el dibujo
    im.src = ruta;
  }
})();
