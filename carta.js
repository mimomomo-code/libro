// =====================================================================
//  LA CARTA. Un objeto para escribir que no es un libro: un sobre de color
//  que se abre (rompiendo el sello de cera o rasgando la orilla), del que
//  sale un pliego doblado en tres que se desdobla, con hasta cinco hojas
//  manuscritas y, al final, si se quiere, una pregunta: abierta (se
//  escribe la respuesta) o cerrada (hasta cinco opciones; una puede ser
//  OBLIGATORIA: las otras huyen del dedo y, al séptimo intento, mueren:
//  explotan, se van como fantasmas o las borra una línea). Al aceptar hay
//  fiesta: una imagen (PNG o GIF) y animaciones de fondo a elegir (fuegos
//  artificiales, flores, corazones, estrellas, confeti) con sus colores.
//  Al abrir el sobre, además, llueven corazones hasta llenar la pantalla:
//  de todos los colores o de uno, dos o tres (a partes iguales).
//
//  Una carta es una entrada de LIBROS (o un libro propio de CUENTA) con
//  tipo "carta" y un bloque `carta`:
//    carta: {
//      color: "crema" | "rosa" | "celeste" | "lavanda" | "menta" | "marfil" | "negro" | "rojo",
//      cierre: "cera" | "rasgar",
//      letra: "manuscrita" | "imprenta",
//      apertura: { modo: "muchos" | "colores" | "nada", colores: ["#e63946", "#ffd166", "#118ab2"] },
//      hojas: ["texto de la hoja 1", "...", ...],          (1 a 5; cada una con sus saltos de línea)
//      firma: "quien la escribe",                            (opcional, al pie de la última hoja)
//      final: null
//           | { tipo: "abierta", pregunta: "..." }
//           | { tipo: "cerrada", pregunta: "...", opciones: ["Sí", "No"], obligatoria: 0 | null, huida: "explotar" | "fantasma" | "barrido" },
//      acepto: { imagen: "" | url | data:, animaciones: ["fuegos", "corazones"], colores: ["#..."], texto: "¡Sí!" }
//    }
//  En la sala la carta se ve como un sobre: en la mesa (de pie, lista para
//  abrirse), en la torre y acostada en una ranura de la librería SIN ocupar
//  sitio (comparte la ranura con un libro). Las respuestas se guardan en el
//  navegador de quien responde (localStorage "libro.cartas.v1").
//  Con `brillo: "aurea"` en la entrada (brillo.js), el sobre brilla con un
//  reflejo de arcoíris hasta que alguien rompe el sello por primera vez.
//
//  Expone window.CARTA { PAPELES, HUIDAS, ANIMACIONES, normalizar, colores,
//    sobre(l, clase), mostrar(l, { alTerminar }), respuesta(id), olvidar(id) }.
// =====================================================================
(function(){
  'use strict';
  const q = new URLSearchParams(location.search);
  const SIN_GUARDAR = ['test', 'borrador', 'limpio'].some(k => q.has(k));
  const R = Math.random;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // el papel del sobre y de las hojas: [papel, sombra del papel, tinta]
  const PAPELES = {
    crema:   { nombre: 'Crema',    c: ['#f1e4c4', '#dcc89c', '#5a3f22'] },
    marfil:  { nombre: 'Marfil',   c: ['#f8f3e6', '#e6dcc6', '#4a4030'] },
    rosa:    { nombre: 'Rosa',     c: ['#f6d6dd', '#e7b3bf', '#7a3a4a'] },
    celeste: { nombre: 'Celeste',  c: ['#d6e5f2', '#b3cbe2', '#2f4c6c'] },
    lavanda: { nombre: 'Lavanda',  c: ['#e3dbf0', '#c8b9e2', '#4f3f74'] },
    menta:   { nombre: 'Menta',    c: ['#d8eddf', '#b3d8c1', '#2f5c42'] },
    rojo:    { nombre: 'Rojo',     c: ['#b63a42', '#8f262d', '#f6e3bd'] },
    negro:   { nombre: 'Negro',    c: ['#2b2629', '#1a1618', '#d9c08a'] },
  };
  const MUCHOS = ['#e63946', '#f4a261', '#ffd166', '#06d6a0', '#118ab2', '#8338ec', '#ff70a6', '#ff9770', '#70d6ff', '#c8f560', '#2a9d8f', '#ef476f'];
  const HUIDAS = { explotar: 'Explotan', fantasma: 'Se van como fantasmas', barrido: 'Las borra una línea' };
  const ANIMACIONES = { fuegos: 'Fuegos artificiales', flores: 'Flores', corazones: 'Corazones', estrellas: 'Estrellas', confeti: 'Confeti' };
  const MAX_HOJAS = 5, MAX_OPCIONES = 5, INTENTOS = 7;
  const CLAVE = 'libro.cartas.v1';

  // ---- la carta completa, con todo lo que falte rellenado ----
  function normalizar(l){
    const c = Object.assign({}, l.carta || {});
    if (!PAPELES[c.color]) c.color = 'crema';
    if (c.cierre !== 'rasgar') c.cierre = 'cera';
    if (c.letra !== 'imprenta') c.letra = 'manuscrita';
    const ap = Object.assign({ modo: 'muchos', colores: ['#e63946'] }, c.apertura || {});
    if (!['muchos', 'colores', 'nada'].includes(ap.modo)) ap.modo = 'muchos';
    ap.colores = (Array.isArray(ap.colores) ? ap.colores : [ap.colores]).filter(x => /^#[0-9a-f]{3,8}$/i.test(String(x))).slice(0, 3);
    if (!ap.colores.length) ap.colores = ['#e63946'];
    c.apertura = ap;
    c.hojas = (Array.isArray(c.hojas) ? c.hojas : [c.hojas || c.texto || '']).map(h => String(h == null ? '' : h)).slice(0, MAX_HOJAS);
    if (!c.hojas.length) c.hojas = [''];
    c.firma = String(c.firma || '');
    if (c.final && typeof c.final === 'object' && (c.final.tipo === 'abierta' || c.final.tipo === 'cerrada')){
      const f = Object.assign({}, c.final); f.pregunta = String(f.pregunta || '');
      if (f.tipo === 'cerrada'){
        f.opciones = (Array.isArray(f.opciones) ? f.opciones : []).map(o => String(o == null ? '' : o)).filter(o => o.trim()).slice(0, MAX_OPCIONES);
        if (f.opciones.length < 2) f.opciones = f.opciones.concat(['Sí', 'No']).slice(0, Math.max(2, f.opciones.length));
        f.obligatoria = Number.isInteger(f.obligatoria) && f.obligatoria >= 0 && f.obligatoria < f.opciones.length ? f.obligatoria : null;
        if (!HUIDAS[f.huida]) f.huida = 'explotar';
      }
      c.final = f;
    } else c.final = null;
    const a = Object.assign({ imagen: '', animaciones: ['corazones'], colores: ['#e63946', '#ffd166', '#ff70a6'], texto: '¡Sí!' }, c.acepto || {});
    a.animaciones = (Array.isArray(a.animaciones) ? a.animaciones : [a.animaciones]).filter(x => ANIMACIONES[x]);
    if (!a.animaciones.length) a.animaciones = ['corazones'];
    a.colores = (Array.isArray(a.colores) ? a.colores : [a.colores]).filter(x => /^#[0-9a-f]{3,8}$/i.test(String(x))).slice(0, 6);
    if (!a.colores.length) a.colores = ['#e63946'];
    a.imagen = String(a.imagen || ''); a.texto = String(a.texto == null ? '¡Sí!' : a.texto);
    c.acepto = a;
    return c;
  }
  const colores = l => PAPELES[(l && l.carta && PAPELES[l.carta.color]) ? l.carta.color : 'crema'].c;
  const estilo = l => { const c = colores(l); return '--p1:' + c[0] + ';--p2:' + c[1] + ';--p3:' + c[2] + ';--c1:' + c[0] + ';--c2:' + c[1] + ';--c3:' + c[1]; };

  // el sobre, como pieza de HTML (la sala lo usa en la mesa, la torre y la librería; el visor, en grande). Si la carta tiene
  // `brillo` y nadie la abrió todavía (brillo.js), lleva dentro el reflejo de arcoíris, el último para que se pinte encima
  function sobre(l, clase){
    const c = normalizar(l);
    const brillo = (window.BRILLO && l && l.id) ? BRILLO.html(l) : '';
    return '<div class="sobre ' + (clase || '') + ' ' + c.cierre + (brillo ? ' brilla' : '') + '" style="' + estilo(l) + '"><i class="cuerpo"></i><i class="solapa"></i>' +
      (c.cierre === 'cera' ? '<i class="sello"></i>' : '<i class="tira"><b></b></i>') +
      '<span class="rotulo">' + esc(l.titulo || 'Carta') + '</span>' + brillo + '</div>';
  }

  // ---- las respuestas, en el navegador de quien responde ----
  function leerTodas(){ try { return JSON.parse(localStorage.getItem(CLAVE) || '{}') || {}; } catch (e){ return {}; } }
  const respuesta = id => leerTodas()[id] || null;
  function guardarRespuesta(id, r){
    if (SIN_GUARDAR) return;
    try { const t = leerTodas(); t[id] = Object.assign({ fecha: new Date().toISOString().slice(0, 10) }, r); localStorage.setItem(CLAVE, JSON.stringify(t)); } catch (e) {}
  }
  function olvidar(id){ try { const t = leerTodas(); delete t[id]; localStorage.setItem(CLAVE, JSON.stringify(t)); } catch (e) {} }

  // ---- el CSS del sobre (sala y visor) y del visor ----
  const css = document.createElement('style');
  css.textContent = `
.sobre{position:relative;display:block;aspect-ratio:1.5;color:var(--p3);font-family:Caveat,'Cormorant Garamond',cursive;user-select:none}
.sobre .cuerpo{position:absolute;inset:0;background:linear-gradient(180deg,var(--p1),var(--p2));border-radius:3px;box-shadow:0 2px 0 rgba(0,0,0,.25), inset 0 0 0 1px rgba(0,0,0,.08)}
.sobre .cuerpo::before{content:'';position:absolute;inset:0;background:linear-gradient(104deg,transparent 48%,rgba(0,0,0,.1) 49%,transparent 52%),linear-gradient(-104deg,transparent 48%,rgba(0,0,0,.1) 49%,transparent 52%);border-radius:3px;opacity:.7}
/* abierto, se ve el interior: una sombra que entra desde la boca del sobre */
.sobre .cuerpo::after{content:'';position:absolute;inset:0;border-radius:3px;background:linear-gradient(180deg,rgba(0,0,0,.42),rgba(0,0,0,.12) 38%,transparent 58%);opacity:0;transition:opacity .5s .35s}
.sobre.abierto .cuerpo::after{opacity:1}
.sobre .solapa{position:absolute;left:0;right:0;top:0;height:56%;background:linear-gradient(180deg,var(--p2),var(--p1) 85%);clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:50% 0;filter:drop-shadow(0 1px 1px rgba(0,0,0,.25));transition:transform .7s cubic-bezier(.4,0,.2,1)}
.sobre.abierto .solapa{transform:rotateX(180deg)}
.sobre .sello{position:absolute;left:50%;top:50%;width:22%;aspect-ratio:1;transform:translate(-50%,-55%);border-radius:46% 54% 50% 50% / 52% 48% 52% 48%;
  background:radial-gradient(circle at 38% 32%,#e0575f,#a3242c 55%,#6e1218);box-shadow:0 2px 3px rgba(0,0,0,.5), inset 0 0 0 2px rgba(0,0,0,.12), inset 0 -3px 4px rgba(0,0,0,.28), inset 0 2px 5px rgba(255,255,255,.2);transition:transform .25s}
.sobre .sello::before{content:'';position:absolute;inset:16%;border-radius:50%;border:1px solid rgba(255,255,255,.22);box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}
.sobre .sello::after{content:'❤';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 56%/1 serif;color:rgba(255,220,220,.7);text-shadow:0 1px 0 rgba(0,0,0,.45), 0 -1px 0 rgba(255,255,255,.2)}
/* el sobre de rasgar no lleva solapa en V: una tira de color cruza todo el borde de arriba, con la orilla dentada */
.sobre.rasgar .solapa{display:none}
.sobre .tira{position:absolute;left:0;right:0;top:0;height:13%;background:linear-gradient(180deg,var(--p3),color-mix(in srgb, var(--p3) 80%, #fff));border-radius:3px 3px 0 0;transform-origin:0 100%;
  clip-path:polygon(0 0,100% 0,100% 78%,97% 100%,94% 80%,91% 100%,88% 82%,85% 100%,82% 78%,79% 100%,76% 84%,73% 100%,70% 80%,67% 100%,64% 82%,61% 100%,58% 78%,55% 100%,52% 84%,49% 100%,46% 80%,43% 100%,40% 82%,37% 100%,34% 78%,31% 100%,28% 84%,25% 100%,22% 80%,19% 100%,16% 82%,13% 100%,10% 78%,7% 100%,4% 84%,1% 100%,0 86%)}
.sobre .tira b{display:none}
.sobre .rotulo{position:absolute;right:7%;bottom:8%;max-width:84%;text-align:right;font-weight:600;font-size:15px;line-height:1.1;opacity:.92;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}
.sobre.chico .rotulo{font-size:10px;bottom:6%}
.sobre.chico .sello{width:18%}
/* en la sala */
.carta-mesa{position:relative;width:calc(var(--lm) * 1.3);cursor:pointer;touch-action:none;transition:filter .2s,transform .2s;filter:drop-shadow(0 10px 10px rgba(0,0,0,.55))}
.carta-mesa .candado-mesa{left:9%;top:9%;bottom:auto;width:15%;transform:none}      /* el candadito, en la esquina del sobre */
#lista-cartas .item .con-candado{margin-left:auto;font-style:normal;font-size:13px;opacity:.85}
.carta-mesa:hover{filter:drop-shadow(0 10px 10px rgba(0,0,0,.55)) brightness(1.08);transform:translateY(-2px)}
.carta-mesa .sobre .rotulo{font-size:clamp(9px, calc(var(--lm) * .13), 14px)}
.carta-torre{position:relative;width:calc(var(--lm) * 1.3);height:clamp(6px, calc(var(--lm) * .1), 11px);border-radius:1px;cursor:pointer;touch-action:none;
  background:linear-gradient(180deg,var(--p1),var(--p2));box-shadow:0 1px 0 rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.3)}
.carta-torre::after{content:'';position:absolute;left:46%;top:20%;width:8%;height:60%;border-radius:50%;background:#a3242c;opacity:.85}
.carta-torre:nth-child(odd){transform:translateX(-5%)}
.carta-torre:nth-child(even){transform:translateX(5%)}
/* EL MONTÓN en la librería: hasta 10 cartas de canto, una sobre otra, con una cinta roja; ocupa dos ranuras y crece con la cuenta */
.monton-cartas{position:absolute;left:5%;width:190%;bottom:0;z-index:3;cursor:pointer;touch-action:none;filter:drop-shadow(1px 2px 2px rgba(0,0,0,.55));transition:filter .2s;--f:3.5px}   /* delante de los lomos (z 2) */
.monton-cartas:hover{filter:drop-shadow(1px 2px 2px rgba(0,0,0,.55)) brightness(1.1)}
.monton-cartas .pila{display:flex;flex-direction:column-reverse;align-items:stretch}
.monton-cartas .pila i{display:block;height:var(--f);border-radius:1px;box-shadow:inset 0 -1px 0 rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.4), inset 0 0 0 .5px rgba(0,0,0,.08);background-image:linear-gradient(90deg,rgba(0,0,0,.1),transparent 10%,transparent 90%,rgba(0,0,0,.16))}
.monton-cartas .pila > i:nth-child(even),.monton-cartas .pila .atado i:nth-child(even){transform:translateX(2.5%)}
.monton-cartas .pila .atado{position:relative;display:flex;flex-direction:column-reverse;margin:1px 0 0}
.monton-cartas .pila .atado::before{content:'';position:absolute;left:50%;top:-1px;bottom:-1px;width:3px;transform:translateX(-50%);background:linear-gradient(90deg,#8e1c24,#c8323b 50%,#8e1c24);box-shadow:0 0 0 .5px rgba(0,0,0,.25)}
.monton-cartas .pila .atado::after{content:'';position:absolute;left:50%;top:-4px;width:9px;height:6px;transform:translateX(-50%);border-radius:50% 50% 40% 40% / 60% 60% 40% 40%;background:radial-gradient(circle at 50% 55%,#6e1218 20%,transparent 21%),linear-gradient(90deg,#c8323b,#a3242c 50%,#c8323b);box-shadow:0 1px 1px rgba(0,0,0,.4)}
.monton-cartas .cuenta{position:absolute;right:-6%;top:-9px;min-width:15px;padding:0 4px;border-radius:9px;background:#a3242c;color:#fff;font:600 10px/15px 'Cormorant Garamond',Georgia,serif;text-align:center;box-shadow:0 1px 2px rgba(0,0,0,.5)}
/* la carta DE PIE en el hueco entre dos libros (una por hueco): un lomo fino de papel con su sello o su tira asomando */
.carta-hueco{position:absolute;left:0;bottom:0;width:36%;height:74%;max-height:106px;transform:translateX(-50%);z-index:3;cursor:pointer;touch-action:none;border-radius:2px 2px 0 0;
  background:linear-gradient(90deg,var(--p2),var(--p1) 28%,var(--p1) 72%,var(--p2));box-shadow:1px 0 0 rgba(0,0,0,.45), -1px 0 0 rgba(255,255,255,.12), inset 0 1px 0 rgba(255,255,255,.35);transition:filter .2s}
.carta-hueco.der{left:auto;right:0;transform:translateX(50%)}
.carta-hueco::before{content:'';position:absolute;left:0;right:0;top:0;height:30%;background:linear-gradient(180deg,rgba(0,0,0,.14),transparent);clip-path:polygon(0 0,100% 0,50% 100%)}
.carta-hueco .sello{position:absolute;left:50%;top:22%;width:64%;aspect-ratio:1;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle at 38% 32%,#e0575f,#a3242c 55%,#6e1218);box-shadow:0 1px 1px rgba(0,0,0,.45)}
.carta-hueco .tira{position:absolute;left:0;right:0;top:0;height:9%;background:var(--p3);opacity:.85;border-radius:2px 2px 0 0}
.carta-hueco .toque{position:absolute;inset:-6px -5px}
.carta-hueco:hover{filter:brightness(1.1)}
.ranura.destino-hueco::after{content:'';position:absolute;bottom:0;left:0;width:36%;height:74%;max-height:106px;transform:translateX(-50%);border:1.5px dashed rgba(240,213,154,.9);border-bottom:none;border-radius:2px 2px 0 0;background:rgba(240,213,154,.16)}
.ranura.destino-hueco.destino-hueco-der::after{left:auto;right:0;transform:translateX(50%)}
/* LA TORRE (el cordón): un bloque alto de cartas apiladas, atado con una cinta y su moño; objeto suelto del .centro */
.torre-cartas{position:absolute;z-index:2;cursor:pointer;touch-action:none;filter:drop-shadow(2px 4px 4px rgba(0,0,0,.6));transition:filter .2s}
.torre-cartas:hover{filter:drop-shadow(2px 4px 4px rgba(0,0,0,.6)) brightness(1.08)}
.torre-cartas .bloque{position:absolute;inset:0;border-radius:3px 3px 2px 2px;
  background:repeating-linear-gradient(180deg,var(--pap, #f1e4c4) 0 4px,rgba(0,0,0,.14) 4px 5px,var(--pap2, #e7c9a9) 5px 9px,rgba(0,0,0,.14) 9px 10px);
  box-shadow:inset 3px 0 6px rgba(255,255,255,.3), inset -4px 0 8px rgba(0,0,0,.25), inset 0 2px 0 rgba(255,255,255,.4)}
.torre-cartas .bloque::after{content:'';position:absolute;left:0;right:0;top:0;height:7%;min-height:4px;background:var(--pap, #f1e4c4);border-radius:3px 3px 0 0;box-shadow:inset 0 -1px 0 rgba(0,0,0,.2)}
.torre-cartas .cinta{position:absolute;left:50%;top:-2%;bottom:0;width:9%;max-width:7px;background:linear-gradient(90deg,#8e1c24,#c8323b 50%,#8e1c24);transform:translateX(-50%);box-shadow:0 0 0 .5px rgba(0,0,0,.3)}
.torre-cartas .lazo{position:absolute;left:50%;top:0;width:70%;max-width:40px;aspect-ratio:1.5;transform:translate(-50%,-62%);border-radius:50% 50% 45% 45% / 70% 70% 40% 40%;
  background:radial-gradient(circle at 50% 56%,#6e1218 16%,transparent 17%),linear-gradient(90deg,#c8323b,#a3242c 48%,#a3242c 52%,#c8323b);box-shadow:0 2px 2px rgba(0,0,0,.45)}
.torre-cartas .lazo::before,.torre-cartas .lazo::after{content:'';position:absolute;top:70%;width:14%;height:70%;background:#a3242c;transform-origin:50% 0}
.torre-cartas .lazo::before{left:36%;transform:rotate(14deg)}
.torre-cartas .lazo::after{right:36%;transform:rotate(-14deg)}
.torre-cartas .cuenta{position:absolute;right:-10%;top:-6%;min-width:16px;padding:0 4px;border-radius:9px;background:#a3242c;color:#fff;font:600 10px/16px 'Cormorant Garamond',Georgia,serif;text-align:center;box-shadow:0 1px 2px rgba(0,0,0,.5)}
.torre-cartas.destino{filter:drop-shadow(0 0 6px rgba(240,213,154,.9))}
.objeto-fantasma{position:fixed !important;left:0 !important;top:0 !important;bottom:auto !important;z-index:80;pointer-events:none;opacity:.92}
/* la lista de un montón o una torre */
#lista-cartas{position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45)}
#lista-cartas[hidden]{display:none}
#lista-cartas .caja{width:min(90vw, 380px);max-height:76vh;overflow:auto;scrollbar-width:thin;background:linear-gradient(160deg,#3b2114,#241309 60%,#160b05);border:1px solid rgba(212,176,106,.55);border-radius:10px;padding:14px;color:#e9dcc4;font-family:'Cormorant Garamond',Georgia,serif;box-shadow:0 30px 60px rgba(0,0,0,.7)}
#lista-cartas h4{margin:0 0 10px;font:400 12px/1 Cinzel,serif;letter-spacing:.1em;color:#d4b06a;text-transform:uppercase;display:flex;align-items:center;gap:8px}
#lista-cartas h4 button{margin-left:auto;background:none;border:0;color:#d4b06a;font-size:16px;cursor:pointer;line-height:1}
#lista-cartas .item{display:flex;align-items:center;gap:10px;padding:7px 6px;border-radius:6px;cursor:pointer;font-size:17px}
#lista-cartas .item:hover{background:rgba(255,255,255,.06)}
#lista-cartas .item .sobre{width:46px;flex:0 0 auto}
#lista-cartas .item .sobre .rotulo{display:none}
#lista-cartas .vacio{font-style:italic;opacity:.75;padding:8px 6px;font-size:15px}
/* el visor */
#carta-vista{position:fixed;inset:0;z-index:40;background:rgba(18,10,6,.7);opacity:0;animation:capa-entra .6s ease forwards;touch-action:none;font-family:'Cormorant Garamond',Georgia,serif;overflow:hidden}
#carta-vista.fuera{transition:opacity .7s ease;opacity:0 !important;pointer-events:none}
#carta-vista canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#carta-vista .cerrar{position:absolute;right:12px;top:10px;z-index:9;background:rgba(0,0,0,.35);border:1px solid rgba(240,213,154,.5);color:#f0d59a;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer}
#carta-vista .aviso{position:absolute;left:50%;bottom:7vh;transform:translateX(-50%);z-index:8;font-family:Cinzel,serif;font-size:11px;letter-spacing:.26em;padding-left:.26em;text-transform:uppercase;color:rgba(240,213,154,.9);text-shadow:0 1px 6px rgba(0,0,0,.8);opacity:0;transition:opacity .5s;pointer-events:none;white-space:nowrap}
#carta-vista .aviso.ver{opacity:1;animation:latir 1.8s ease-in-out infinite}
#carta-vista .escena{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;perspective:1200px}
#carta-vista .sobre.grande{width:min(78vw, 420px);transition:transform .8s cubic-bezier(.4,0,.2,1),opacity .6s;filter:drop-shadow(0 22px 30px rgba(0,0,0,.6));cursor:pointer}
#carta-vista .sobre.grande .rotulo{font-size:clamp(20px, 5.4vw, 30px);bottom:9%;right:8%}
#carta-vista .sobre.grande .sello{cursor:pointer}
#carta-vista .sobre.grande .sello:hover{transform:translate(-50%,-55%) scale(1.06)}
/* el sello se parte en dos mitades que caen cada una para su lado */
#carta-vista .sobre.grande .sello.rota{background:none;box-shadow:none;pointer-events:none}
#carta-vista .sobre.grande .sello.rota::after{display:none}
#carta-vista .sobre.grande .sello .mitad{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 38% 32%,#e0575f,#a3242c 55%,#6e1218);box-shadow:0 1px 2px rgba(0,0,0,.5), inset 0 0 0 2px rgba(0,0,0,.12);display:none}
#carta-vista .sobre.grande .sello .mitad.izq{clip-path:polygon(0 0,52% 0,46% 30%,54% 55%,47% 100%,0 100%)}
#carta-vista .sobre.grande .sello .mitad.der{clip-path:polygon(52% 0,100% 0,100% 100%,47% 100%,54% 55%,46% 30%)}
#carta-vista .sobre.grande .sello.rota .mitad{display:block}
#carta-vista .sobre.grande .sello.rota .mitad.izq{animation:mitad-izq .7s ease-in forwards}
#carta-vista .sobre.grande .sello.rota .mitad.der{animation:mitad-der .7s ease-in forwards .05s}
@keyframes mitad-izq{20%{transform:translate(-6%,-8%) rotate(-10deg)}100%{transform:translate(-70%,160%) rotate(-50deg);opacity:0}}
@keyframes mitad-der{20%{transform:translate(6%,-8%) rotate(10deg)}100%{transform:translate(70%,170%) rotate(50deg);opacity:0}}
/* la tira se arranca: sigue al dedo girando hacia arriba y a la derecha, y el sobre queda con la orilla dentada */
#carta-vista .sobre.grande .tira{cursor:grab}
#carta-vista .sobre.grande.rasgando .tira{transform:translate(calc(var(--rasgado, 0) * 18%), calc(var(--rasgado, 0) * -90%)) rotate(calc(var(--rasgado, 0) * -38deg))}
#carta-vista .sobre.grande .tira.fuera{transition:transform .7s ease,opacity .7s;transform:translate(60%,-260%) rotate(-60deg);opacity:0}
#carta-vista .sobre.grande.rasgado .cuerpo{clip-path:polygon(0 13%,2% 11%,5% 13%,8% 10%,11% 13%,14% 11%,17% 13%,20% 10%,23% 13%,26% 11%,29% 13%,32% 10%,35% 13%,38% 11%,41% 13%,44% 10%,47% 13%,50% 11%,53% 13%,56% 10%,59% 13%,62% 11%,65% 13%,68% 10%,71% 13%,74% 11%,77% 13%,80% 10%,83% 13%,86% 11%,89% 13%,92% 10%,95% 13%,98% 11%,100% 13%,100% 100%,0 100%)}
#carta-vista .sobre.grande.vacio{transform:translateY(22vh) scale(.85);opacity:0;pointer-events:none}
/* el pliego doblado en tres que sale del sobre y se desdobla */
/* el pliego sale del sobre: nace abajo, dentro, recortado por la boca del sobre, y sube asomando hasta quedar libre */
#carta-vista .pliego{position:absolute;left:50%;top:50%;width:min(78vw, 400px);transform:translate(-50%,-50%) translateY(34%) scale(.9);transform-style:preserve-3d;opacity:0;clip-path:inset(0 0 100% 0);pointer-events:none;
  transition:opacity .25s, transform .85s cubic-bezier(.4,0,.2,1), clip-path .85s cubic-bezier(.4,0,.2,1)}   /* invisible pero encima del sobre: sin pointer-events none se comía el toque al sello */
#carta-vista .pliego.ver{opacity:1;transform:translate(-50%,-50%) translateY(-6%) scale(1);clip-path:inset(0 0 0 0)}
#carta-vista .pliego.abierto{transform:translate(-50%,-50%);transition:opacity .25s, transform .9s cubic-bezier(.4,0,.2,1)}
#carta-vista .pliego .panel{position:relative;width:100%;height:calc(min(74vh, 540px) / 3);overflow:hidden;background:var(--p1);box-shadow:0 0 0 1px rgba(0,0,0,.06)}
#carta-vista .pliego .panel .copia{position:absolute;left:0;width:100%;height:min(74vh, 540px)}
#carta-vista .pliego .panel.arriba{transform-origin:50% 100%;transform:rotateX(-178deg);transition:transform 1s cubic-bezier(.4,0,.2,1)}
#carta-vista .pliego .panel.abajo{transform-origin:50% 0;transform:rotateX(178deg);transition:transform 1s cubic-bezier(.4,0,.2,1) .15s}
#carta-vista .pliego .panel.arriba .copia{top:0}
#carta-vista .pliego .panel.medio .copia{top:calc(min(74vh, 540px) / -3)}
#carta-vista .pliego .panel.abajo .copia{top:calc(min(74vh, 540px) / -3 * 2)}
#carta-vista .pliego.abierto .panel.arriba,#carta-vista .pliego.abierto .panel.abajo{transform:rotateX(0)}
#carta-vista .pliego .panel.arriba::after,#carta-vista .pliego .panel.abajo::after{content:'';position:absolute;inset:0;background:rgba(0,0,0,.35);transition:opacity 1s;pointer-events:none}
#carta-vista .pliego.abierto .panel::after{opacity:0}
/* las hojas: sueltas, apiladas (la siguiente asoma por la derecha), se pasan tocando la de arriba */
#carta-vista .pila-hojas{position:absolute;left:50%;top:50%;width:min(78vw, 400px);height:min(74vh, 540px);transform:translate(-50%,-50%);opacity:0;transition:opacity .35s,transform .9s cubic-bezier(.4,0,.2,1);pointer-events:none}
#carta-vista .pila-hojas.ver{opacity:1;pointer-events:auto}
#carta-vista .hoja-sombra{position:absolute;inset:0;background:linear-gradient(180deg,var(--p1),var(--p2));box-shadow:0 10px 24px rgba(0,0,0,.4), 0 0 0 1px rgba(0,0,0,.1);transition:transform .35s}
#carta-vista .hoja-sombra.s1{transform:translate(6px,5px) rotate(.6deg)}
#carta-vista .hoja-sombra.s2{transform:translate(12px,10px) rotate(-.4deg)}
#carta-vista .hoja-sombra.s3{transform:translate(17px,15px) rotate(.9deg)}
#carta-vista .hoja-carta{position:absolute;inset:0;color:var(--p3);box-shadow:0 24px 40px rgba(0,0,0,.55), 0 0 0 1px rgba(0,0,0,.08);transition:transform .38s cubic-bezier(.4,0,.6,1),opacity .38s;cursor:pointer}
#carta-vista .hoja-carta.pasando{transform:translate(-70%,-18%) rotate(-9deg);opacity:0}
#carta-vista .hoja-carta.volviendo{transform:translate(70%,-18%) rotate(9deg);opacity:0}
#carta-vista .hoja-carta.sin-transicion{transition:none}
#carta-vista .papel-carta{background:repeating-linear-gradient(47deg, rgba(0,0,0,.016) 0 2px, transparent 2px 5px),repeating-linear-gradient(-33deg, rgba(255,255,255,.05) 0 1px, transparent 1px 4px),radial-gradient(ellipse at 30% 20%, rgba(255,255,255,.38), transparent 60%),radial-gradient(ellipse at 85% 95%, rgba(0,0,0,.08), transparent 55%),linear-gradient(180deg,var(--p1),var(--p1) 60%,var(--p2));}
#carta-vista .hoja-carta{transform:rotate(-.5deg)}
/* los dos pliegues (doblada en tres): una línea de sombra y su brillo, con cada tercio apenas distinto */
#carta-vista .papel-carta::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(0,0,0,.035) 0%,transparent 10%,transparent 30%,rgba(0,0,0,.08) 33%,rgba(0,0,0,.3) 33.3%,rgba(0,0,0,.3) calc(33.3% + 1.5px),rgba(255,255,255,.35) calc(33.3% + 2px),rgba(255,255,255,.35) calc(33.3% + 3px),transparent calc(33.3% + 4px),transparent 63.5%,rgba(0,0,0,.08) 66.3%,rgba(0,0,0,.3) 66.6%,rgba(0,0,0,.3) calc(66.6% + 1.5px),rgba(255,255,255,.35) calc(66.6% + 2px),rgba(255,255,255,.35) calc(66.6% + 3px),transparent calc(66.6% + 4px),transparent 90%,rgba(0,0,0,.035) 100%)}
/* nada de barras: el texto solo desplaza en vertical, y solo cuando de verdad no cabe (clase .scroll, la pone el visor tras pintar);
   en horizontal nunca (las palabras largas se parten). Las barras que quedan, finas y del color de la tinta */
#carta-vista .hoja-carta .texto{position:absolute;inset:6% 8% 9%;display:block;margin:0;max-width:none;text-align:left;overflow:hidden;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;line-height:1.35}   /* (el lector tiene un .texto global con margen) */
#carta-vista .hoja-carta .texto.scroll,#carta-vista .final.scroll{overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.28) transparent;padding-right:4px}
#carta-vista .texto::-webkit-scrollbar,#carta-vista .final::-webkit-scrollbar,#carta-vista textarea::-webkit-scrollbar{width:6px;height:0}
#carta-vista .texto::-webkit-scrollbar-thumb,#carta-vista .final::-webkit-scrollbar-thumb,#carta-vista textarea::-webkit-scrollbar-thumb{background:rgba(0,0,0,.28);border-radius:3px}
#carta-vista .hoja-carta,#carta-vista .pliego .panel,#carta-vista .escena{overflow:hidden}      /* (la pila no: las hojas de atrás asoman y la de arriba vuela fuera) */
#carta-vista textarea{scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.28) transparent;overflow-x:hidden}
#carta-vista .hoja-carta.manuscrita .texto{font-family:Caveat,'Cormorant Garamond',cursive;font-weight:500;font-size:clamp(19px, 2.9vh, 26px)}
#carta-vista .hoja-carta.imprenta .texto{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:clamp(16px, 2.3vh, 20px)}
#carta-vista .hoja-carta .texto .firma{display:block;text-align:right;margin-top:1.2em;font-style:italic}
#carta-vista .hoja-carta .atras{position:absolute;left:4%;top:2.5%;background:none;border:0;color:inherit;font:italic 500 14px/1 'Cormorant Garamond',serif;opacity:.55;cursor:pointer;padding:4px 6px}
#carta-vista .hoja-carta .atras:hover{opacity:.9}
#carta-vista .hoja-carta .atras[hidden]{display:none}
#carta-vista .hoja-carta .quedan{position:absolute;right:5%;bottom:2.5%;font:italic 500 13px/1 'Cormorant Garamond',serif;opacity:.5;pointer-events:none}
/* el final: la pregunta arriba y la respuesta en el tercio de abajo */
#carta-vista .final{position:absolute;inset:6% 8% 7%;display:none;flex-direction:column;gap:10px;overflow:hidden}
#carta-vista .final.ver{display:flex}
#carta-vista .hoja-carta .texto.fuera{display:none}
#carta-vista .final .pregunta{font-family:Caveat,'Cormorant Garamond',cursive;font-weight:600;font-size:clamp(22px, 3.4vh, 30px);line-height:1.2;text-align:center;margin:3% 0 0;flex:0 0 auto}
#carta-vista .final textarea{width:100%;box-sizing:border-box;min-height:30%;flex:1 1 auto;margin-top:4%;font:500 clamp(17px, 2.4vh, 21px)/1.35 Caveat,'Cormorant Garamond',cursive;color:inherit;background:rgba(255,255,255,.28);border:0;border-bottom:1px solid rgba(0,0,0,.25);padding:8px 10px;outline:none;resize:none}
#carta-vista .final .enviar,#carta-vista .final .opcion{font:600 clamp(16px, 2.3vh, 20px)/1.2 'Cormorant Garamond',Georgia,serif;letter-spacing:.04em;padding:10px 18px;border-radius:6px;cursor:pointer;
  background:rgba(255,255,255,.35);border:1.5px solid currentColor;color:inherit;transition:background .2s,transform .2s,color .2s}
#carta-vista .final .enviar{align-self:center;margin-top:auto;margin-bottom:6%}
#carta-vista .final .opcion:hover{background:rgba(255,255,255,.6)}
#carta-vista .final .zona{position:relative;flex:1 1 auto;min-height:40%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:9px;padding-bottom:5%}
#carta-vista .final .zona.suelta .opcion{position:absolute;margin:0;transition:left .32s cubic-bezier(.3,1.4,.5,1),top .32s cubic-bezier(.3,1.4,.5,1),opacity .4s,transform .4s}
#carta-vista .final .opcion.elegida{background:var(--p3);color:var(--p1)}
#carta-vista .final .opcion.explota{animation:opcion-explota .5s ease forwards;pointer-events:none}
@keyframes opcion-explota{35%{transform:scale(1.25)}100%{transform:scale(.2);opacity:0}}
#carta-vista .final .opcion.fantasma{animation:opcion-fantasma 1.4s ease-in forwards;pointer-events:none}
@keyframes opcion-fantasma{30%{transform:translateY(-10px) rotate(-3deg);opacity:.8;filter:blur(0)}100%{transform:translateY(-120px) rotate(4deg);opacity:0;filter:blur(3px)}}
#carta-vista .final .opcion.borrada{opacity:0;transition:opacity .25s;pointer-events:none}
#carta-vista .final .chispa{position:absolute;width:7px;height:7px;border-radius:50%;pointer-events:none;animation:chispa .7s ease-out forwards}
@keyframes chispa{to{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}
#carta-vista .final .barrido{position:absolute;left:-30%;top:-10%;width:3px;height:120%;background:linear-gradient(180deg,transparent,var(--p3) 20%,var(--p3) 80%,transparent);transform:rotate(22deg);box-shadow:0 0 10px 2px rgba(255,255,255,.5);pointer-events:none;animation:barrido 1.3s linear forwards}
@keyframes barrido{to{left:130%}}
#carta-vista .final .respondida{text-align:center;font-style:italic;opacity:.8}
#carta-vista .final .otra{align-self:center;background:none;border:0;color:inherit;font:italic 500 15px/1 'Cormorant Garamond',serif;text-decoration:underline;cursor:pointer;opacity:.7}
/* la fiesta: la hoja se queda en su sitio (un poco más abajo y más chica), la imagen y el grito arriba, y todo alrededor se llena */
#carta-vista .fiesta-capa{position:absolute;left:0;right:0;top:0;height:30vh;display:none;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;text-align:center;pointer-events:none;padding:0 16px;box-sizing:border-box}
#carta-vista.fiesta .fiesta-capa{display:flex;animation:capa-entra .8s ease forwards}
#carta-vista.fiesta .pila-hojas{transform:translate(-50%,-50%) translateY(13vh) scale(.84)}
#carta-vista.fiesta .hoja-carta{cursor:default}
#carta-vista .fiesta-capa img{max-width:min(70vw, 360px);max-height:17vh;border-radius:10px;box-shadow:0 14px 30px rgba(0,0,0,.6)}
#carta-vista .fiesta-capa .grito{font-family:Caveat,'Cormorant Garamond',cursive;font-weight:600;font-size:clamp(40px, 9vw, 72px);color:#fff6e0;text-shadow:0 2px 0 rgba(0,0,0,.35), 0 0 30px rgba(255,200,120,.6);line-height:1}
#carta-vista .fiesta-capa .pie{position:fixed;left:50%;bottom:2.5vh;transform:translateX(-50%);font-family:Cinzel,serif;font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:rgba(240,213,154,.9);animation:latir 1.8s ease-in-out infinite;white-space:nowrap}
@media (max-height:560px){#carta-vista .pila-hojas,#carta-vista .pliego{width:min(78vw, 360px)}}
`;
  document.head.appendChild(css);

  // =====================================================================
  //  LOS CORAZONES QUE LLENAN LA PANTALLA (como los girasoles: lo posado se
  //  pinta una vez; lo que cae, cada cuadro)
  // =====================================================================
  function spriteCorazon(r, color, dpr){
    const S = Math.ceil(r * 2.6), c = document.createElement('canvas'); c.width = c.height = Math.ceil(S * dpr);
    const x = c.getContext('2d'); x.scale(dpr, dpr); x.translate(S / 2, S / 2 + r * .1);
    x.fillStyle = color; x.beginPath(); x.moveTo(0, r);
    x.bezierCurveTo(-r * 1.6, -r * .2, -r * .8, -r * 1.4, 0, -r * .5); x.bezierCurveTo(r * .8, -r * 1.4, r * 1.6, -r * .2, 0, r); x.fill();
    x.globalAlpha = .35; x.fillStyle = '#fff'; x.beginPath(); x.ellipse(-r * .45, -r * .55, r * .22, r * .14, -.6, 0, 6.3); x.fill();
    return { c, S };
  }
  function lluviaCorazones(cvP, cvC, paleta){
    const ctxP = cvP.getContext('2d'), ctxC = cvC.getContext('2d');
    let W = 0, H = 0, dpr = 1, D = 30, colW = 16, ncol = 0, alturas = null, colsLlenas = 0, total = 0, pico = 40, esc = 1, SPR = [];
    let t = 0, acum = 0, vivos = [], lleno = false, raf = 0, ultimo = 0, parado = false;
    const suave = x => x * x * (3 - 2 * x);
    function medir(){
      W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
      D = clamp(Math.min(W, H) * .07, 22, 42); colW = D * .55; ncol = Math.ceil(W / colW) + 1; esc = H / 900;
      SPR = paleta.map(col => [spriteCorazon(D * .4, col, dpr), spriteCorazon(D * .5, col, dpr), spriteCorazon(D * .34, col, dpr)]);
      for (const cv of [cvP, cvC]){ cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      for (const cx of [ctxP, ctxC]) cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const porCol = Math.ceil((H + D) / (D * .5)); total = porCol * ncol; pico = Math.max(14, (total - 30) / 9);
      alturas = new Float32Array(ncol); colsLlenas = 0;
    }
    medir();
    const colLlena = c => alturas[c] >= H + D * .6;
    let k = 0;
    function soltar(){
      let c = -1;
      for (let i = 0; i < 6 && c < 0; i++){ const a = R() * ncol | 0, b = R() * ncol | 0; const ca = !colLlena(a), cb = !colLlena(b); if (ca && cb) c = alturas[a] <= alturas[b] ? a : b; else if (ca) c = a; else if (cb) c = b; }
      if (c < 0){ for (let i = 0; i < ncol; i++) if (!colLlena(i)){ c = i; break; } }
      if (c < 0) return false;
      const fam = SPR[(k++) % SPR.length];                   // a partes iguales entre los colores elegidos
      vivos.push({ x: c * colW + (R() - .5) * colW * .6, y: -D, destino: H - alturas[c] - D * .3, spr: fam[R() * fam.length | 0], vy: (120 + R() * 140) * esc, g: 420 * esc, vmax: (420 + R() * 180) * esc,
        f: R() * 6.28, fv: .8 + R() * 1.5, amp: 10 + R() * 22, rot: (R() - .5) * .9, spin: (R() - .5) * 2 });
      alturas[c] += D * .5; if (colLlena(c)) colsLlenas++;
      return true;
    }
    function paso(dt){
      t += dt;
      if (colsLlenas < ncol){ acum += (3 + (pico - 3) * suave(Math.min(1, t / 4))) * dt; while (acum >= 1){ acum -= 1; if (!soltar()) break; } }
      ctxC.clearRect(0, 0, W, H);
      for (let i = vivos.length - 1; i >= 0; i--){
        const p = vivos[i]; p.vy = Math.min(p.vmax, p.vy + p.g * dt); p.y += p.vy * dt; p.f += p.fv * dt; p.x += Math.sin(p.f) * p.amp * dt; p.rot += p.spin * dt;
        const S = p.spr.S;
        if (p.y >= p.destino){ ctxP.save(); ctxP.translate(p.x, p.destino); ctxP.rotate(p.rot); ctxP.drawImage(p.spr.c, -S / 2, -S / 2, S, S); ctxP.restore(); vivos[i] = vivos[vivos.length - 1]; vivos.pop(); continue; }
        ctxC.save(); ctxC.translate(p.x, p.y); ctxC.rotate(p.rot); ctxC.drawImage(p.spr.c, -S / 2, -S / 2, S, S); ctxC.restore();
      }
      if (!lleno && colsLlenas >= ncol && !vivos.length) lleno = true;
    }
    function bucle(now){ raf = 0; const dt = Math.min(.05, (now - ultimo) / 1000); ultimo = now; paso(dt); if (!parado && !lleno) raf = requestAnimationFrame(bucle); }
    function arrancar(){ if (!raf && !parado){ ultimo = performance.now(); raf = requestAnimationFrame(bucle); } }
    function redim(){ const copia = document.createElement('canvas'); copia.width = cvP.width; copia.height = cvP.height; copia.getContext('2d').drawImage(cvP, 0, 0); const W0 = W, H0 = H; medir(); ctxP.drawImage(copia, 0, 0, copia.width, copia.height, 0, 0, W, H); for (const p of vivos){ p.x *= W / W0; p.destino *= H / H0; } lleno = false; arrancar(); }
    return { arrancar, redim, parar: () => { parado = true; if (raf) cancelAnimationFrame(raf); }, lleno: () => lleno };
  }

  // =====================================================================
  //  LA FIESTA DE FONDO: fuegos artificiales, flores, corazones, estrellas,
  //  confeti, los que se hayan elegido, con sus colores, a la vez
  // =====================================================================
  function fiestaFondo(cv, animaciones, colores){
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, raf = 0, ultimo = 0, parado = false, k = 1;
    const col = () => colores[R() * colores.length | 0];
    const cohetes = [], chispas = [], flores = [], cors = [], estrellas = [], papeles = [];
    function medir(){ W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2); k = Math.min(W, H) / 700; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    medir();
    if (animaciones.includes('estrellas')) for (let i = 0; i < 90; i++) estrellas.push({ x: R() * W, y: R() * H, r: (.6 + R() * 1.8) * k, f: R() * 6.28, fv: 1 + R() * 2.5, c: col() });
    let tCohete = 0, tFlor = 0, tCor = 0, tPapel = 0;
    function corazon(x, y, s, c, a, rot){ ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.globalAlpha = a; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, s); ctx.bezierCurveTo(-s * 1.6, -s * .2, -s * .8, -s * 1.4, 0, -s * .5); ctx.bezierCurveTo(s * .8, -s * 1.4, s * 1.6, -s * .2, 0, s); ctx.fill(); ctx.restore(); }
    function flor(x, y, s, c, rot, a){
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a; ctx.fillStyle = c;
      for (let i = 0; i < 5; i++){ ctx.beginPath(); ctx.ellipse(0, -s * .55, s * .32, s * .55, 0, 0, 6.3); ctx.fill(); ctx.rotate(Math.PI * 2 / 5); }
      ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.arc(0, 0, s * .28, 0, 6.3); ctx.fill(); ctx.restore();
    }
    function paso(dt){
      ctx.clearRect(0, 0, W, H);
      if (animaciones.includes('fuegos')){
        tCohete -= dt;
        if (tCohete <= 0){ tCohete = .45 + R() * .7; cohetes.push({ x: W * (.15 + R() * .7), y: H + 10, vx: (R() - .5) * 60 * k, vy: -(520 + R() * 220) * k, c: col(), vida: .9 + R() * .5 }); }
        for (let i = cohetes.length - 1; i >= 0; i--){
          const r = cohetes[i]; r.x += r.vx * dt; r.y += r.vy * dt; r.vy += 260 * k * dt; r.vida -= dt;
          ctx.globalAlpha = .9; ctx.fillStyle = r.c; ctx.beginPath(); ctx.arc(r.x, r.y, 2.2 * k, 0, 6.3); ctx.fill();
          if (r.vida <= 0 || r.vy > -40){ const n = 46 + (R() * 30 | 0), c2 = R() < .4 ? col() : r.c; for (let j = 0; j < n; j++){ const a = j / n * 6.283 + R() * .1, v = (120 + R() * 200) * k; chispas.push({ x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: j % 3 ? r.c : c2, vida: 1.1 + R() * .7, r: (1.5 + R() * 1.5) * k }); } cohetes.splice(i, 1); }
        }
        for (let i = chispas.length - 1; i >= 0; i--){
          const p = chispas[i]; p.vx *= (1 - 1.6 * dt); p.vy = p.vy * (1 - 1.6 * dt) + 120 * k * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vida -= dt;
          if (p.vida <= 0){ chispas.splice(i, 1); continue; }
          ctx.globalAlpha = Math.min(1, p.vida); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill();
        }
      }
      if (animaciones.includes('flores')){
        tFlor -= dt; if (tFlor <= 0){ tFlor = .12; flores.push({ x: R() * W, y: -30, s: (10 + R() * 14) * k, c: col(), rot: R() * 6.28, vr: (R() - .5) * 2, vy: (50 + R() * 60) * k, f: R() * 6.28, amp: 20 + R() * 30 }); }
        for (let i = flores.length - 1; i >= 0; i--){ const p = flores[i]; p.y += p.vy * dt; p.f += dt; p.x += Math.sin(p.f) * p.amp * dt; p.rot += p.vr * dt; if (p.y > H + 40){ flores.splice(i, 1); continue; } flor(p.x, p.y, p.s, p.c, p.rot, .9); }
      }
      if (animaciones.includes('corazones')){
        tCor -= dt; if (tCor <= 0){ tCor = .09; cors.push({ x: R() * W, y: H + 20, s: (5 + R() * 9) * k, c: col(), vy: (60 + R() * 90) * k, f: R() * 6.28, fv: 1 + R() * 1.5, amp: 12 + R() * 24, a: .5 + R() * .5 }); }
        for (let i = cors.length - 1; i >= 0; i--){ const p = cors[i]; p.y -= p.vy * dt; p.f += p.fv * dt; p.x += Math.sin(p.f) * p.amp * dt; if (p.y < -30){ cors.splice(i, 1); continue; } corazon(p.x, p.y, p.s, p.c, p.a); }
      }
      if (animaciones.includes('estrellas')) for (const s of estrellas){ s.f += s.fv * dt; const a = .35 + .65 * (.5 + .5 * Math.sin(s.f)); ctx.globalAlpha = a; ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (0.8 + .4 * a), 0, 6.3); ctx.fill(); if (s.r > 1.6 * k){ ctx.globalAlpha = a * .5; ctx.fillRect(s.x - s.r * 3, s.y - .5, s.r * 6, 1); ctx.fillRect(s.x - .5, s.y - s.r * 3, 1, s.r * 6); } }
      if (animaciones.includes('confeti')){
        tPapel -= dt; if (tPapel <= 0){ tPapel = .035; papeles.push({ x: R() * W, y: -12, w: (5 + R() * 6) * k, h: (8 + R() * 8) * k, c: col(), rot: R() * 6.28, vr: (R() - .5) * 8, vy: (90 + R() * 120) * k, f: R() * 6.28, amp: 30 + R() * 40 }); }
        for (let i = papeles.length - 1; i >= 0; i--){ const p = papeles[i]; p.y += p.vy * dt; p.f += 2 * dt; p.x += Math.sin(p.f) * p.amp * dt; p.rot += p.vr * dt; if (p.y > H + 20){ papeles.splice(i, 1); continue; } ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = .95; ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.f * 1.7))); ctx.restore(); }
      }
      ctx.globalAlpha = 1;
    }
    function bucle(now){ raf = 0; const dt = Math.min(.05, (now - ultimo) / 1000); ultimo = now; paso(dt); if (!parado) raf = requestAnimationFrame(bucle); }
    return { arrancar: () => { if (!raf && !parado){ ultimo = performance.now(); raf = requestAnimationFrame(bucle); } }, redim: medir, parar: () => { parado = true; if (raf) cancelAnimationFrame(raf); } };
  }

  // =====================================================================
  //  EL VISOR
  // =====================================================================
  function mostrar(l, op){
    op = op || {};
    const c = normalizar(l), id = l.id || 'carta';
    const capa = document.createElement('div'); capa.id = 'carta-vista'; capa.className = 'cerrada ' + c.cierre; capa.style.cssText = estilo(l);
    capa.innerHTML = '<canvas class="posados"></canvas><canvas class="cayendo"></canvas><canvas class="fondo-fiesta"></canvas>' +
      '<div class="escena">' + sobre(l, 'grande') +
      '<div class="pliego papel-carta"><div class="panel arriba"><div class="copia"></div></div><div class="panel medio"><div class="copia"></div></div><div class="panel abajo"><div class="copia"></div></div></div>' +
      '<div class="pila-hojas"><i class="hoja-sombra s3"></i><i class="hoja-sombra s2"></i><i class="hoja-sombra s1"></i>' +
      '<div class="hoja-carta papel-carta ' + c.letra + '"><div class="texto"></div><div class="final"></div><button type="button" class="atras" hidden>‹ hoja anterior</button><span class="quedan"></span></div></div>' +
      '<div class="fiesta-capa"><img class="imagen" alt="" hidden><div class="grito"></div><div class="pie">Toca para volver a la sala</div></div></div>' +
      '<div class="aviso"></div><button type="button" class="cerrar" aria-label="Cerrar la carta">✕</button>';
    document.body.appendChild(capa);
    const $ = s => capa.querySelector(s);
    const sobreEl = $('.sobre.grande'), pliego = $('.pliego'), pila = $('.pila-hojas'), hoja = $('.hoja-carta'), textoEl = $('.texto'), finalEl = $('.final'), atras = $('.atras'), quedan = $('.quedan'), aviso = $('.aviso');
    const sombras = [$('.hoja-sombra.s1'), $('.hoja-sombra.s2'), $('.hoja-sombra.s3')];
    const HOJAS = c.hojas.slice(); if (c.firma) HOJAS[HOJAS.length - 1] = (HOJAS[HOJAS.length - 1] || '') + '\n\x01' + c.firma;
    const nPaginas = HOJAS.length + (c.final ? 1 : 0);
    let pagina = 0, etapa = 'cerrada', terminado = false, lluvia = null, fiesta = null, avisoT = 0;
    const paletaLluvia = c.apertura.modo === 'muchos' ? MUCHOS : c.apertura.colores;
    function avisar(t, ms){ aviso.textContent = t; aviso.classList.toggle('ver', !!t); clearTimeout(avisoT); if (ms) avisoT = setTimeout(() => aviso.classList.remove('ver'), ms); }
    const htmlHoja = i => { const t = HOJAS[i] || ''; const k = t.indexOf('\x01'); return k < 0 ? esc(t) : esc(t.slice(0, k)) + '<span class="firma">' + esc(t.slice(k + 1)) + '</span>'; };

    // ---- 1. el sobre cerrado: el sello o la tira ----
    function abrirSobre(){
      if (etapa !== 'cerrada') return; etapa = 'abriendo';
      avisar('', 0);
      sobreEl.classList.add('abierto');
      if (window.BRILLO) BRILLO.apagar(id);                  // la primera vez que se abre, el brillo (brillo.js) se apaga aquí y en la sala
      if (c.apertura.modo !== 'nada'){ lluvia = lluviaCorazones($('.posados'), $('.cayendo'), paletaLluvia); lluvia.arrancar(); }
      // el pliego sale del sobre y se desdobla
      pliego.querySelectorAll('.copia').forEach(e => {
        e.style.cssText = 'padding:7% 8%;box-sizing:border-box;white-space:pre-wrap;overflow:hidden;overflow-wrap:anywhere;line-height:1.35;color:var(--p3);' +
          (c.letra === 'imprenta' ? "font:500 clamp(16px, 2.3vh, 20px)/1.35 'Cormorant Garamond',Georgia,serif" : "font:500 clamp(19px, 2.9vh, 26px)/1.35 Caveat,'Cormorant Garamond',cursive");
        e.innerHTML = htmlHoja(0);
      });
      // la solapa gira (.7 s), el pliego asoma y sube desde dentro (.85 s), el sobre cae, el pliego se desdobla (1 s) y queda la hoja
      setTimeout(() => { pliego.classList.add('ver'); }, 450);
      setTimeout(() => { sobreEl.classList.add('vacio'); }, 1250);
      setTimeout(() => { pliego.classList.add('abierto'); }, 1450);
      setTimeout(() => { pliego.classList.remove('ver'); pintarHoja(0); pila.classList.add('ver'); etapa = 'hojas'; if (nPaginas > 1) avisar('Toca la hoja para pasar a la siguiente', 3500); }, 2900);
    }
    const sello = $('.sello');
    if (sello){
      sello.innerHTML = '<i class="mitad izq"></i><i class="mitad der"></i>';         // las dos mitades en que se parte
      avisar('Toca el sello', 0);
      sello.addEventListener('pointerup', e => { if (etapa !== 'cerrada') return; e.stopPropagation(); sello.classList.add('rota'); setTimeout(abrirSobre, 250); });
      sobreEl.addEventListener('pointerup', e => { if (etapa !== 'cerrada') return; sello.classList.add('rota'); setTimeout(abrirSobre, 250); });
    } else {
      const tira = $('.tira'); let ras = null;
      avisar('Arrastra la orilla para rasgar', 0);
      sobreEl.addEventListener('pointerdown', e => {
        if (etapa !== 'cerrada' || e.button !== 0) return;
        const r = sobreEl.getBoundingClientRect();
        if (e.clientY > r.top + r.height * .3) return;                  // solo por la orilla de arriba
        e.preventDefault(); ras = { x0: e.clientX, w: r.width, id: e.pointerId }; sobreEl.classList.add('rasgando');
        try { sobreEl.setPointerCapture(e.pointerId); } catch (x) {}
      });
      sobreEl.addEventListener('pointermove', e => { if (!ras || ras.id !== e.pointerId) return; const f = clamp((e.clientX - ras.x0) / (ras.w * .75), 0, 1); ras.f = f; sobreEl.style.setProperty('--rasgado', f.toFixed(3)); });
      const fin = e => {
        if (!ras || ras.id !== e.pointerId) return; const f = ras.f || 0; ras = null;
        if (f >= .8){ sobreEl.style.setProperty('--rasgado', '1'); tira.classList.add('fuera'); sobreEl.classList.add('rasgado'); setTimeout(abrirSobre, 350); }
        else { sobreEl.style.setProperty('--rasgado', '0'); sobreEl.classList.remove('rasgando'); if (f > .05) avisar('Un poco más: hasta el otro lado', 2500); }
      };
      sobreEl.addEventListener('pointerup', fin); sobreEl.addEventListener('pointercancel', fin);
      // dos toques seguidos también la rasgan (para quien no arrastra)
      let ultimoToque = 0;
      sobreEl.addEventListener('pointerup', e => { if (etapa !== 'cerrada') return; const t = performance.now(); if (t - ultimoToque < 450){ sobreEl.classList.add('rasgando'); sobreEl.style.setProperty('--rasgado', '1'); tira.classList.add('fuera'); sobreEl.classList.add('rasgado'); setTimeout(abrirSobre, 350); } ultimoToque = t; });
    }

    // ---- 2. las hojas: sueltas y apiladas; tocar la de arriba la pasa (se va volando a la izquierda) y asoma la siguiente ----
    function pintarHoja(i){
      pagina = clamp(i, 0, nPaginas - 1);
      const esFinal = !!c.final && pagina === HOJAS.length;
      textoEl.classList.toggle('fuera', esFinal); finalEl.classList.toggle('ver', esFinal);     // (clases, no `hidden`: el display del CSS le ganaría)
      if (!esFinal){ textoEl.innerHTML = htmlHoja(pagina); textoEl.scrollTop = 0; }
      else pintarFinal();
      const restan = nPaginas - pagina - 1;
      sombras.forEach((s, k) => { s.style.display = restan > k ? 'block' : 'none'; });
      // la barra vertical solo si el texto (o la pregunta) no cabe; nunca durante una transición
      requestAnimationFrame(() => { textoEl.classList.toggle('scroll', !esFinal && textoEl.scrollHeight > textoEl.clientHeight + 2); finalEl.classList.toggle('scroll', esFinal && finalEl.scrollHeight > finalEl.clientHeight + 2); });
      atras.hidden = pagina === 0;
      quedan.textContent = restan > 1 ? 'quedan ' + restan + ' hojas' : restan === 1 ? 'queda una hoja' : '';
    }
    let pasandoT = 0;
    function pasarA(i, dir){
      const j = clamp(i, 0, nPaginas - 1); if (j === pagina || pasandoT) return;
      hoja.classList.add(dir > 0 ? 'pasando' : 'volviendo');
      pasandoT = setTimeout(() => {
        pintarHoja(j);
        hoja.classList.add('sin-transicion'); hoja.classList.remove('pasando', 'volviendo'); void hoja.offsetWidth; hoja.classList.remove('sin-transicion');
        pasandoT = 0;
      }, 380);
    }
    atras.addEventListener('click', e => { e.stopPropagation(); pasarA(pagina - 1, -1); });
    hoja.addEventListener('pointerup', e => {
      if (etapa !== 'hojas' || e.target.closest('button, textarea, .opcion, .final')) return;
      pasarA(pagina + 1, 1);
    });

    // ---- 3. el final: la pregunta ----
    let intentos = 0, muertas = false, suelta = false;
    function pintarFinal(){
      const f = c.final, r = respuesta(id);
      finalEl.innerHTML = '<div class="pregunta">' + esc(f.pregunta || (f.tipo === 'abierta' ? '¿Qué me dices?' : '¿Sí?')) + '</div>';
      if (r && !finalEl.dataset.otra){
        const d = document.createElement('div'); d.className = 'respondida';
        d.textContent = (f.tipo === 'abierta' ? 'Respondiste: «' + (r.texto || '') + '»' : 'Elegiste: ' + (r.opcion || '')) + (r.fecha ? ' · ' + r.fecha : '');
        finalEl.appendChild(d);
        const otra = document.createElement('button'); otra.type = 'button'; otra.className = 'otra'; otra.textContent = 'responder de nuevo';
        otra.onclick = () => { finalEl.dataset.otra = '1'; pintarFinal(); }; finalEl.appendChild(otra);
        return;
      }
      if (f.tipo === 'abierta'){
        const ta = document.createElement('textarea'); ta.placeholder = 'Escribe aquí...'; ta.maxLength = 2000; finalEl.appendChild(ta);
        const b = document.createElement('button'); b.type = 'button'; b.className = 'enviar'; b.textContent = 'Enviar';
        b.onclick = () => { const t = ta.value.trim(); if (!t){ ta.focus(); return; } guardarRespuesta(id, { texto: t }); celebrar(t); };
        finalEl.appendChild(b);
        return;
      }
      const zona = document.createElement('div'); zona.className = 'zona'; finalEl.appendChild(zona);
      intentos = 0; muertas = false; suelta = false;
      f.opciones.forEach((o, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'opcion'; b.textContent = o; b.dataset.i = i;
        const huye = f.obligatoria != null && i !== f.obligatoria;
        if (huye){
          const escapar = e => { if (muertas || b.classList.contains('explota') || b.classList.contains('fantasma') || b.classList.contains('borrada')) return; if (e) e.preventDefault(); huir(zona, b); };
          b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') escapar(e); });
          b.addEventListener('pointerdown', e => { e.stopPropagation(); escapar(e); });
          b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
        } else b.addEventListener('click', e => { e.stopPropagation(); zona.querySelectorAll('.opcion').forEach(x => x.classList.remove('elegida')); b.classList.add('elegida'); guardarRespuesta(id, { opcion: o }); setTimeout(() => celebrar(o), 350); });
        zona.appendChild(b);
      });
    }
    // las opciones que huyen: a la primera huida se sueltan de la fila (posición absoluta) y cada toque las manda a otro sitio
    function huir(zona, b){
      if (!suelta){
        suelta = true; const zr = zona.getBoundingClientRect();
        const pos = [...zona.querySelectorAll('.opcion')].map(x => { const r = x.getBoundingClientRect(); return [x, r.left - zr.left, r.top - zr.top, r.width]; });
        zona.classList.add('suelta'); for (const [x, l, t, w] of pos){ x.style.left = l + 'px'; x.style.top = t + 'px'; x.style.width = w + 'px'; }
      }
      intentos++;
      const zr = zona.getBoundingClientRect(), br = b.getBoundingClientRect();
      let l, t, k = 0;
      do { l = R() * Math.max(1, zr.width - br.width); t = R() * Math.max(1, zr.height - br.height); k++; }
      while (k < 12 && Math.hypot(l - (br.left - zr.left), t - (br.top - zr.top)) < br.width * .9);
      b.style.left = l + 'px'; b.style.top = t + 'px';
      if (intentos === 3) avisar('Esa no se deja...', 2200);
      if (intentos >= INTENTOS) matar(zona);
    }
    function matar(zona){
      if (muertas) return; muertas = true;
      const f = c.final, victimas = [...zona.querySelectorAll('.opcion')].filter(x => +x.dataset.i !== f.obligatoria);
      if (f.huida === 'explotar'){
        victimas.forEach((b, j) => setTimeout(() => {
          const zr = zona.getBoundingClientRect(), r = b.getBoundingClientRect(), cx = r.left - zr.left + r.width / 2, cy = r.top - zr.top + r.height / 2;
          for (let i = 0; i < 12; i++){ const s = document.createElement('i'); s.className = 'chispa'; const a = i / 12 * 6.283, d = 40 + R() * 50; s.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;background:' + MUCHOS[i % MUCHOS.length] + ';--dx:' + (Math.cos(a) * d).toFixed(0) + 'px;--dy:' + (Math.sin(a) * d).toFixed(0) + 'px'; zona.appendChild(s); setTimeout(() => s.remove(), 800); }
          b.classList.add('explota');
        }, j * 140));
      } else if (f.huida === 'fantasma') victimas.forEach((b, j) => setTimeout(() => b.classList.add('fantasma'), j * 180));
      else {
        const linea = document.createElement('i'); linea.className = 'barrido'; zona.appendChild(linea); setTimeout(() => linea.remove(), 1400);
        const zr = zona.getBoundingClientRect();
        victimas.forEach(b => { const r = b.getBoundingClientRect(); const fx = (r.left - zr.left + r.width / 2) / Math.max(1, zr.width); setTimeout(() => b.classList.add('borrada'), 150 + fx * 1000); });
      }
      setTimeout(() => avisar('Solo queda una', 2500), 900);
    }
    // ---- 4. la fiesta ----
    function celebrar(resp){
      const a = c.acepto; etapa = 'fiesta';
      capa.classList.add('fiesta'); avisar('', 0);
      $('.grito').textContent = a.texto || '¡Sí!';
      const im = $('.imagen'); if (a.imagen){ im.src = a.imagen; im.hidden = false; im.onerror = () => { im.hidden = true; }; }
      if (lluvia) lluvia.parar();
      fiesta = fiestaFondo($('.fondo-fiesta'), a.animaciones, a.colores); fiesta.arrancar();
      setTimeout(() => { capa.classList.add('fiesta-lista'); }, 900);
      if (op.alResponder) op.alResponder(resp);
    }

    // ---- cerrar ----
    function terminar(){
      if (terminado) return; terminado = true;
      if (lluvia) lluvia.parar(); if (fiesta) fiesta.parar();
      removeEventListener('keydown', teclas); removeEventListener('resize', redim);
      capa.classList.add('fuera');
      setTimeout(() => { capa.remove(); if (op.alTerminar) op.alTerminar(); }, 750);
    }
    function teclas(e){ if (e.key === 'Escape'){ e.preventDefault(); terminar(); } else if (etapa === 'hojas' && !e.target.closest('textarea')){ if (e.key === 'ArrowRight') pasarA(pagina + 1, 1); else if (e.key === 'ArrowLeft') pasarA(pagina - 1, -1); } }
    function redim(){ if (lluvia) lluvia.redim(); if (fiesta) fiesta.redim(); }
    addEventListener('keydown', teclas); addEventListener('resize', redim);
    $('.cerrar').addEventListener('click', terminar);
    capa.addEventListener('pointerup', e => { if (etapa === 'fiesta' && capa.classList.contains('fiesta-lista')) terminar(); });

    // para capturas y pruebas: ?carta=hojas|final|fiesta salta a esa etapa
    const salto = op.etapa || q.get('carta');
    if (salto){
      etapa = 'hojas'; sobreEl.classList.add('abierto', 'vacio'); pila.classList.add('ver'); avisar('', 0);
      if (salto === 'final' && c.final) pintarHoja(HOJAS.length); else pintarHoja(0);
      if (c.apertura.modo !== 'nada'){ lluvia = lluviaCorazones($('.posados'), $('.cayendo'), paletaLluvia); lluvia.arrancar(); }
      if (salto === 'fiesta') celebrar('');
    }
    return { terminar, etapa: () => etapa, pagina: () => pagina, pasarA, intentos: () => intentos, muertas: () => muertas, capa };
  }

  window.CARTA = { PAPELES, HUIDAS, ANIMACIONES, MUCHOS, MAX_HOJAS, MAX_OPCIONES, normalizar, colores, estilo, sobre, mostrar, respuesta, olvidar };
})();
