// =====================================================================
//  EL CALENDARIO DE DÍAS IMPORTANTES. Un libro de tipo "calendario" se
//  escribe solo cada vez que se abre: una primera página con lo que viene
//  (y la cuenta de días juntos) y después un mes por página, doce, desde
//  el mes en curso. Los días NO están en el código: viajan cifrados en
//  assets/calendario/dias.bin (los cifra _tools/candado.py desde
//  privado/calendario/dias.json, fuera de git) y el candado los deja en
//  datos._cifrado al abrir el libro.
//
//  Formato de dias.json:  { "dias": [ ... ] }  con entradas de dos clases:
//    { "dia": 30, "mes": 9, "nombre": "Día de los autitos", "icono": "auto" }
//          se repite todos los años.
//    { "fecha": "2026-10-11", "nombre": "Empezamos a salir", "inicio": true }
//          un día concreto. Con `inicio` además cuenta los días juntos, marca
//          el mismo día de cada mes ("N meses juntos") y cada aniversario
//          ("N años juntos"); `"meses": false` quita la marca mensual.
//  Iconos: corazon, flor, auto, estrella, regalo (sin icono: estrella; el
//  inicio, corazon).
//  ?hoy=AAAA-MM-DD finge la fecha de hoy (para pruebas y capturas).
// =====================================================================
window.CALENDARIO = (function(){
  'use strict';
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
  const MESES_VISTA = 12;
  const PROXIMOS = 6;
  const q = new URLSearchParams(location.search);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const Cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  // ---- los iconitos (SVG en línea, color por CSS) ----
  const ICONOS = {
    corazon: '<path d="M12 21s-7.2-4.7-9.6-9.2C.4 8.2 2.4 4 6.4 4c2.1 0 3.8 1.1 5.6 3 1.8-1.9 3.5-3 5.6-3 4 0 6 4.2 4 7.8C19.2 16.3 12 21 12 21z"/>',
    estrella: '<path d="M12 2.5l2.9 6.4 7 .8-5.2 4.7 1.4 6.9L12 17.8l-6.1 3.5 1.4-6.9L2.1 9.7l7-.8z"/>',
    flor: '<circle cx="12" cy="5.6" r="3.3"/><circle cx="18.1" cy="10" r="3.3"/><circle cx="15.8" cy="17.2" r="3.3"/><circle cx="8.2" cy="17.2" r="3.3"/><circle cx="5.9" cy="10" r="3.3"/><circle cx="12" cy="12" r="3.1" class="centro"/>',
    auto: '<path d="M4.4 12.6l1.9-4.8A2 2 0 0 1 8.2 6.5h7.6a2 2 0 0 1 1.9 1.3l1.9 4.8H21a1 1 0 0 1 1 1V17a1 1 0 0 1-1 1h-1.5a2.5 2.5 0 0 1-5 0h-5a2.5 2.5 0 0 1-5 0H3a1 1 0 0 1-1-1v-3.4a1 1 0 0 1 1-1zm2.7-.1h9.8l-1.3-3.3a.6.6 0 0 0-.6-.4H9a.6.6 0 0 0-.6.4z"/>',
    regalo: '<path d="M3 9h18v4H3zM4.5 13h15v8h-15z"/><path d="M12 9v12M3 11h18M12 9c-1.6-3.4-5.8-4.2-5.8-1.3 0 1.5 2.5 1.3 5.8 1.3zm0 0c1.6-3.4 5.8-4.2 5.8-1.3 0 1.5-2.5 1.3-5.8 1.3z" class="cinta"/>'
  };
  const icono = k => {
    const n = ICONOS[k] ? k : 'estrella';
    return '<svg class="ico ' + n + '" viewBox="0 0 24 24" aria-hidden="true">' + ICONOS[n] + '</svg>';
  };

  // ---- fechas ----
  function hoy(){
    const h = q.get('hoy');
    if (h && /^\d{4}-\d{1,2}-\d{1,2}$/.test(h)){ const p = h.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
    const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  const fechaDe = s => { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  const diasEntre = (a, b) => Math.round((b - a) / 864e5);
  const diasDelMes = (y, m0) => new Date(y, m0 + 1, 0).getDate();
  const largo = f => f.getDate() + ' de ' + MESES[f.getMonth()] + ' de ' + f.getFullYear();
  const corto = f => f.getDate() + ' ' + MESES[f.getMonth()].slice(0, 3);
  const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);

  // ---- los días marcados de un mes: [{ d, nombre, icono, nuestro }] ordenados por día ----
  function eventos(D, y, m0){
    const out = [];
    const lista = (D && Array.isArray(D.dias)) ? D.dias : [];
    for (const e of lista){
      if (!e || !e.nombre) continue;
      const ico = e.icono || (e.inicio ? 'corazon' : 'estrella');
      if (e.fecha){
        const f = fechaDe(e.fecha); if (isNaN(f)) continue;
        const k = (y - f.getFullYear()) * 12 + (m0 - f.getMonth());        // meses transcurridos desde esa fecha
        if (k === 0) out.push({ d: f.getDate(), nombre: String(e.nombre), icono: ico, nuestro: !!e.inicio });
        else if (k > 0 && e.inicio){
          const d = Math.min(f.getDate(), diasDelMes(y, m0));
          if (k % 12 === 0) out.push({ d, nombre: plural(k / 12, 'año juntos', 'años juntos'), icono: ico, nuestro: true });
          else if (e.meses !== false) out.push({ d, nombre: plural(k, 'mes juntos', 'meses juntos'), icono: ico, nuestro: true });
        }
      } else if (+e.mes === m0 + 1 && +e.dia >= 1){
        out.push({ d: Math.min(+e.dia, diasDelMes(y, m0)), nombre: String(e.nombre), icono: ico, nuestro: false });
      }
    }
    return out.sort((a, b) => a.d - b.d);
  }
  // los próximos días, de hoy en adelante, hasta `cuantos`
  function proximos(D, h, cuantos){
    const out = [];
    for (let k = 0; k <= MESES_VISTA; k++){
      const f = new Date(h.getFullYear(), h.getMonth() + k, 1);
      for (const e of eventos(D, f.getFullYear(), f.getMonth())){
        const fe = new Date(f.getFullYear(), f.getMonth(), e.d), dias = diasEntre(h, fe);
        if (dias >= 0) out.push(Object.assign({ fecha: fe, dias }, e));
      }
    }
    return out.sort((a, b) => a.dias - b.dias || (b.nuestro ? 1 : 0) - (a.nuestro ? 1 : 0)).slice(0, cuantos || PROXIMOS);
  }

  // ---- las páginas del libro: lo que viene + doce meses desde el mes en curso ----
  function paginas(h){
    h = h || hoy();
    const pags = [{ proximos: true }];
    for (let k = 0; k < MESES_VISTA; k++){
      const f = new Date(h.getFullYear(), h.getMonth() + k, 1);
      pags.push({ mes: f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0') });
    }
    return pags;
  }
  // La sala lo llama antes de abrir el libro: toma los días (descifrados por el
  // candado, o escritos en el catálogo como `dias`) y escribe las páginas con la fecha de hoy.
  function preparar(l){
    if (!l.datos) l.datos = l;
    l.datos._dias = l.datos._cifrado || l.dias || null;
    l.datos.paginas = paginas();
    return l.datos.paginas;
  }

  // ---- el HTML de cada página (lo pide el lector) ----
  function htmlMes(D, ym, h, i, viva, estilo){
    const p = ym.split('-').map(Number), y = p[0], m0 = p[1] - 1;
    const ev = eventos(D, y, m0), porDia = {};
    ev.forEach(e => { (porDia[e.d] = porDia[e.d] || []).push(e); });
    const primero = (new Date(y, m0, 1).getDay() + 6) % 7;             // la semana empieza en lunes
    const n = diasDelMes(y, m0);
    let celdas = SEMANA.map(s => '<span class="sem">' + s + '</span>').join('');
    for (let k = 0; k < primero; k++) celdas += '<span class="dia vacio"></span>';
    for (let d = 1; d <= n; d++){
      const es = porDia[d], esHoy = h.getFullYear() === y && h.getMonth() === m0 && h.getDate() === d;
      celdas += '<span class="dia' + (es ? ' marcado' + (es.some(e => e.nuestro) ? ' nuestro' : '') : '') + (esHoy ? ' hoy' : '') + '">' +
        '<b>' + d + '</b>' + (es ? icono(es[0].icono) : '') + '</span>';
    }
    const lista = ev.length
      ? '<ul class="mes-lista">' + ev.map(e => '<li' + (e.nuestro ? ' class="nuestro"' : '') + '><span class="n">' + e.d + '</span>' + icono(e.icono) +
          '<span class="t">' + esc(e.nombre) + '</span></li>').join('') + '</ul>'
      : '<p class="mes-vacio">Un mes tranquilo</p>';
    return '<div class="contenido mes' + (viva ? ' viva' : '') + '" style="' + estilo + '">' +
      '<div class="mes-cab"><div class="mes-nombre">' + Cap(MESES[m0]) + '</div><div class="mes-anio">' + y + '</div></div>' +
      '<div class="mes-grid">' + celdas + '</div>' + lista + '<div class="folio">' + i + '</div></div>';
  }
  function htmlProximos(D, h, i, viva, estilo){
    const ini = ((D && D.dias) || []).find(e => e && e.inicio && e.fecha);
    let cab = '';
    if (ini){
      const f = fechaDe(ini.fecha), dias = diasEntre(f, h);
      if (dias === 0) cab = '<div class="juntos"><b class="palabra">Hoy</b><div class="que">' + esc(ini.nombre) + '</div><div class="desde">' + largo(f) + '</div></div>';
      else if (dias > 0) cab = '<div class="juntos"><b>' + dias + '</b><div class="que">' + (dias === 1 ? 'día juntos' : 'días juntos') + '</div><div class="desde">desde el ' + largo(f) + '</div></div>';
      else cab = '<div class="juntos"><b>' + (-dias) + '</b><div class="que">' + (dias === -1 ? 'día para empezar' : 'días para empezar') + '</div><div class="desde">' + esc(ini.nombre) + ' · ' + largo(f) + '</div></div>';
    }
    const px = proximos(D, h);
    const cuando = d => d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : 'En ' + d + ' días';
    const lista = px.length
      ? '<ul class="prox-lista">' + px.map(e => '<li' + (e.nuestro ? ' class="nuestro"' : '') + '><span class="cuando">' + cuando(e.dias) + '</span>' +
          '<span class="fecha">' + corto(e.fecha) + '</span>' + icono(e.icono) + '<span class="t">' + esc(e.nombre) + '</span></li>').join('') + '</ul>'
      : '<p class="mes-vacio">Todavía no hay días apuntados</p>';
    return '<div class="contenido proximos' + (viva ? ' viva' : '') + '" style="' + estilo + '">' + cab +
      '<div class="prox-tit">Lo que viene</div>' + lista + '<div class="folio">' + i + '</div></div>';
  }
  function html(p, L, i, viva, estilo){
    const D = L._dias || L._cifrado || L.dias || null, h = hoy();
    if (p.mes) return htmlMes(D, p.mes, h, i, viva, estilo);
    return htmlProximos(D, h, i, viva, estilo);
  }

  return { hoy, eventos, proximos, paginas, preparar, html };
})();
