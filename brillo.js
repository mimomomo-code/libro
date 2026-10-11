// =====================================================================
//  EL BRILLO. Un efecto para libros y cartas: mientras nadie los haya abierto
//  brillan con un reflejo de arcoíris, sutil, como cuando una gota de luz cae
//  en una gota de agua y se abre en todos sus colores. Al abrirlos por PRIMERA
//  vez el brillo se apaga para siempre (en ese navegador): el objeto deja de
//  ser nuevo. Hasta entonces se ve brillar en la mesa (el libro de pie o el
//  sobre), en el lomo de la librería, en la carta de pie, en el montón o la
//  torre que lo guarden y, en el visor de la carta, hasta que se rompe el sello.
//
//  Una entrada de LIBROS (o un libro propio de CUENTA) lo pide con
//    brillo: "aurea"          (hoy el único efecto; `true` vale como "aurea")
//  Quién lo apaga: sala.js al abrir un libro; carta.js al abrir el sobre.
//  En el producto es una mejora de la tienda (MEJORAS.brillo): comprada, el
//  creador ofrece la casilla en cada libro o carta nueva.
//
//  Expone window.BRILLO { EFECTOS, tiene(l), vivo(l), html(l), apagar(id),
//    encender(id), abiertos() }. Guarda en localStorage 'libro.brillo.v1'.
//  ?brillo=1 fuerza el brillo aunque ya se haya abierto (para capturas);
//  ?brillo=0 lo apaga todo. Con ?test, ?limpio, ?borrador, ?abrir, ?mesa...
//  no se guarda nada (como el resto de la sala).
// =====================================================================
window.BRILLO = (function(){
  'use strict';
  const q = new URLSearchParams(location.search);
  const SIN_GUARDAR = ['mesa', 'abrir', 'p', 'lleno', 'nota', 'limpio', 'test', 'clave', 'borrador', 'demo', 'brillo'].some(k => q.has(k));
  const CLAVE = 'libro.brillo.v1';
  const EFECTOS = {
    aurea: { nombre: 'Brillo áureo', para: 'un reflejo de arcoíris recorre el libro o la carta hasta que lo abren por primera vez' },
  };
  const forzado = q.get('brillo');                       // '1': brilla todo lo que tenga brillo; '0': nada
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---- lo que ya se abrió: { id: 'AAAA-MM-DD' } ----
  function leer(){ try { const t = JSON.parse(localStorage.getItem(CLAVE) || '{}'); return (t && typeof t === 'object') ? t : {}; } catch (e){ return {}; } }
  let abiertos = (q.has('limpio') || q.has('test')) ? {} : leer();
  function guardar(){ if (SIN_GUARDAR) return; try { localStorage.setItem(CLAVE, JSON.stringify(abiertos)); } catch (e) {} }

  const efecto = l => (l && l.brillo) ? (EFECTOS[l.brillo] ? l.brillo : 'aurea') : null;
  const tiene = l => !!efecto(l);
  const vivo = l => tiene(l) && forzado !== '0' && (forzado === '1' || !abiertos[l.id]);
  // la pieza de HTML que va DENTRO del objeto, la última (se pinta encima; el objeto debe ser relative o absolute)
  const html = l => vivo(l) ? '<i class="aurea ' + efecto(l) + '" data-de="' + esc(l.id) + '"></i>' : '';
  // se abrió por primera vez: se anota y lo que esté brillando en pantalla se apaga con un fundido
  function apagar(id){
    if (!id || abiertos[id]) return false;
    abiertos[id] = new Date().toISOString().slice(0, 10); guardar();
    document.querySelectorAll('.aurea[data-de="' + id + '"]').forEach(e => { e.classList.add('apagando'); setTimeout(() => e.remove(), 2400); });
    document.dispatchEvent(new CustomEvent('brillo-apagado', { detail: { id } }));
    return true;
  }
  function encender(id){ if (!abiertos[id]) return false; delete abiertos[id]; guardar(); return true; }

  // ---- el CSS: un haz prismático que cruza el objeto en diagonal y un halo que cambia de color. El haz va en DOS capas con
  //      la misma forma y el mismo paso: ::before mezclada con `screen` (luce sobre lo oscuro: cuero, papel negro; sobre el
  //      papel claro no se ve, screen sobre blanco es blanco) y ::after con `multiply` (tiñe el papel claro de colores pastel,
  //      como un arcoíris proyectado; sobre lo oscuro apenas se nota). OJO: .aurea NO lleva z-index, opacity ni transform:
  //      cualquiera de ellos la aislaría y el haz dejaría de mezclarse con lo que tiene debajo (una capa que crea stacking
  //      context es un grupo aislado para mix-blend-mode). Va la última en el DOM. ----
  const css = document.createElement('style');
  css.textContent = `
.aurea{position:absolute;inset:0;border-radius:inherit;pointer-events:none;overflow:hidden;animation:aurea-halo 9s linear infinite}
.aurea::before,.aurea::after{content:'';position:absolute;top:-70%;bottom:-70%;left:-30%;width:60%;filter:blur(1px);
  transform:rotate(18deg) translateX(-140%);animation:aurea-barrido 4.6s cubic-bezier(.45,.1,.5,.9) infinite}
.aurea::before{mix-blend-mode:screen;
  background:linear-gradient(90deg,transparent 0%,rgba(255,96,120,0) 8%,rgba(255,96,120,.36) 26%,rgba(255,214,102,.4) 38%,rgba(132,255,180,.4) 50%,rgba(110,200,255,.4) 62%,rgba(200,140,255,.36) 74%,transparent 92%)}
.aurea::after{mix-blend-mode:multiply;
  background:linear-gradient(90deg,transparent 0%,rgba(255,60,100,0) 8%,rgba(255,60,100,.34) 26%,rgba(255,190,40,.34) 38%,rgba(40,205,125,.32) 50%,rgba(40,150,255,.34) 62%,rgba(170,80,255,.34) 74%,transparent 92%)}
@keyframes aurea-barrido{0%{transform:rotate(18deg) translateX(-140%)}58%,100%{transform:rotate(18deg) translateX(340%)}}
@keyframes aurea-halo{
  0%{box-shadow:0 0 6px 1px rgba(255,255,255,.2), 0 0 18px 5px rgba(255,120,140,.4)}
  25%{box-shadow:0 0 6px 1px rgba(255,255,255,.2), 0 0 18px 5px rgba(255,214,102,.4)}
  50%{box-shadow:0 0 6px 1px rgba(255,255,255,.2), 0 0 18px 5px rgba(120,230,170,.4)}
  75%{box-shadow:0 0 6px 1px rgba(255,255,255,.2), 0 0 18px 5px rgba(120,190,255,.4)}
  100%{box-shadow:0 0 6px 1px rgba(255,255,255,.2), 0 0 18px 5px rgba(255,120,140,.4)}}
/* al abrirlo por primera vez: el halo y el haz se van en un fundido (animaciones, no transiciones: el halo nace animado) */
.aurea.apagando{animation:aurea-apaga 1.8s ease forwards}
.aurea.apagando::before,.aurea.apagando::after{animation:aurea-fuera 1.8s ease forwards}
@keyframes aurea-apaga{to{box-shadow:0 0 0 0 rgba(255,255,255,0), 0 0 0 0 rgba(255,255,255,0)}}
@keyframes aurea-fuera{to{opacity:0}}
/* en lo chico (franjas de la torre de la mesa, lomos finos) el halo más corto para que no se coma a los vecinos */
.libro-torre .aurea,.carta-torre .aurea,.carta-hueco .aurea{animation-name:aurea-halo-chico}
@keyframes aurea-halo-chico{
  0%{box-shadow:0 0 3px 1px rgba(255,255,255,.14), 0 0 9px 2px rgba(255,120,140,.3)}
  25%{box-shadow:0 0 3px 1px rgba(255,255,255,.14), 0 0 9px 2px rgba(255,214,102,.3)}
  50%{box-shadow:0 0 3px 1px rgba(255,255,255,.14), 0 0 9px 2px rgba(120,230,170,.3)}
  75%{box-shadow:0 0 3px 1px rgba(255,255,255,.14), 0 0 9px 2px rgba(120,190,255,.3)}
  100%{box-shadow:0 0 3px 1px rgba(255,255,255,.14), 0 0 9px 2px rgba(255,120,140,.3)}}
/* en el visor el sobre es grande: el haz más ancho y más lento, el halo más amplio */
#carta-vista .sobre.grande .aurea{animation-duration:11s}
#carta-vista .sobre.grande .aurea::before,#carta-vista .sobre.grande .aurea::after{width:70%;filter:blur(2px);animation-duration:5.6s}
@media (prefers-reduced-motion: reduce){.aurea::before,.aurea::after{animation-duration:14s}.aurea{animation-duration:20s}}
`;
  document.head.appendChild(css);

  return { EFECTOS, tiene, vivo, html, apagar, encender, abiertos: () => Object.assign({}, abiertos) };
})();
