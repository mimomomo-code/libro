// fondos.js: la pared, la ventana y el piso pintados, a elección (8 oct 2026).
//
//  Las tres piezas son independientes y se mezclan: la PARED (solo papel tapiz con su zócalo,
//  va como background de .fondo-pared, anclada abajo), la VENTANA con sus cortinas (una imagen
//  con alfa dentro de .ventanal, que esconde la ventana dibujada por CSS) y el PISO (background
//  de .suelo). El catálogo vive en FONDOS (libros.js): nombres por clave y la combinación por
//  defecto; los archivos siguen la convención assets/fondos/pared_<clave>.webp,
//  ventana_<clave>.webp y suelo_<clave>.webp, con su miniatura en assets/fondos/mini/
//  (los deja _tools/fondo.py). La clave "css" es el dibujo de siempre.
//
//  El botón ✎ (abajo a la izquierda) abre el panel: una tira de muestras por pieza y la casilla
//  "que cambie sola con la estación y las fiestas" (FONDOS.temporadas, hemisferio sur). La
//  elección se guarda en localStorage ('libro.fondos.v1'). Para capturas y pruebas:
//    ?fondo=pared:rosa,ventana:rosa,piso:blanco[,auto]   fuerza una combinación (no se guarda)
//    ?hoy=AAAA-MM-DD                                      finge la fecha (la misma del calendario)
//  Expone window.FONDOS_SALA { eleccion, elegir, auto, porTemporada, vivo }.
(() => {
  const F = (typeof FONDOS === 'object' && FONDOS) ? FONDOS : null;
  const sala = document.getElementById('sala');
  if (!F || !sala) return;
  const q = new URLSearchParams(location.search);
  const pared = sala.querySelector('.fondo-pared'), ventanal = sala.querySelector('.ventanal'), suelo = sala.querySelector('.suelo');
  if (!pared || !ventanal || !suelo) return;

  const TIPOS = ['pared', 'ventana', 'piso'];
  const ETIQ = { pared: 'Pared', ventana: 'Ventana', piso: 'Piso' };
  const LISTAS = { pared: F.paredes || {}, ventana: F.ventanas || {}, piso: F.pisos || {} };
  const ARCHIVO = { pared: 'pared_', ventana: 'ventana_', piso: 'suelo_' };
  const ruta = (tipo, v) => 'assets/fondos/' + ARCHIVO[tipo] + v + '.webp';
  const mini = (tipo, v) => 'assets/fondos/mini/' + ARCHIVO[tipo] + v + '.webp';
  // la muestra del dibujo de siempre, por pieza
  const MUESTRA_CSS = { pared: 'linear-gradient(135deg,#5c141b,#3f0d12)', ventana: 'linear-gradient(90deg,#a5242e 0 22%,#1a2050 22% 78%,#a5242e 78%)', piso: 'linear-gradient(180deg,#3a2314,#24150c)' };
  const CLAVE = 'libro.fondos.v1';

  // ---- la elección: la guardada, si no la de defecto; ?fondo= la fuerza sin guardar ----
  let eleccion = Object.assign({ pared: 'css', ventana: 'css', piso: 'css', auto: false }, F.defecto || {});
  const sinGuardar = q.has('fondo') || q.has('test');
  if (!q.has('fondo')){
    try { const g = JSON.parse(localStorage.getItem(CLAVE) || 'null'); if (g && typeof g === 'object') eleccion = Object.assign(eleccion, g); } catch (e) {}
  } else {
    for (const par of q.get('fondo').split(',')){
      const [k, v] = par.split(':');
      if (k === 'auto') eleccion.auto = v !== '0';
      else if (LISTAS[k] && v) eleccion[k] = v;
    }
  }
  function guardar(){ if (sinGuardar) return; try { localStorage.setItem(CLAVE, JSON.stringify(eleccion)); } catch (e) {} }

  // ---- la fecha (fingible con ?hoy=) y la temporada ----
  function fecha(){
    const h = q.get('hoy'); if (h && /^\d{4}-\d{2}-\d{2}$/.test(h)){ const [y, m, d] = h.split('-').map(Number); return new Date(y, m - 1, d); }
    return new Date();
  }
  // FONDOS.temporadas: [{ desde: 'MM-DD', hasta: 'MM-DD', ... }] (fiestas, mandan) y [{ meses: [..], ... }] (estaciones)
  function porTemporada(dia){
    const t = F.temporadas || []; if (!t.length) return null;
    const md = (dia.getMonth() + 1) * 100 + dia.getDate(), mes = dia.getMonth() + 1;
    const dentro = r => { const a = +r.desde.replace('-', ''), b = +r.hasta.replace('-', ''); return a <= b ? (md >= a && md <= b) : (md >= a || md <= b); };
    const fiesta = t.find(r => r.desde && r.hasta && dentro(r));
    const estacion = t.find(r => r.meses && r.meses.includes(mes));
    const r = fiesta || estacion; if (!r) return null;
    const out = {}; for (const k of TIPOS) if (r[k]) out[k] = r[k];
    return out;
  }
  function efectiva(){
    const e = { pared: eleccion.pared, ventana: eleccion.ventana, piso: eleccion.piso, auto: !!eleccion.auto };
    if (e.auto){ const t = porTemporada(fecha()); if (t) Object.assign(e, t); }
    for (const k of TIPOS) if (!LISTAS[k][e[k]]) e[k] = 'css';
    return e;
  }

  // ---- aplicar una pieza (con un fundido corto) ----
  const vivo = { pared: null, ventana: null, piso: null };
  const EL = { pared, ventana: ventanal, piso: suelo };
  function poner(tipo, v, im){
    const el = EL[tipo], r = ruta(tipo, v);
    if (tipo === 'ventana'){
      let foto = el.querySelector('.foto');
      if (!foto){ foto = document.createElement('img'); foto.className = 'foto'; foto.alt = ''; foto.draggable = false; el.insertBefore(foto, el.firstChild); }
      foto.src = r; el.style.aspectRatio = im.naturalWidth + ' / ' + im.naturalHeight;
    } else el.style.setProperty('--foto', 'url("' + r + '")');
    el.classList.add('con-imagen');
  }
  function quitar(tipo){
    const el = EL[tipo];
    if (tipo === 'ventana'){ const foto = el.querySelector('.foto'); if (foto) foto.remove(); el.style.aspectRatio = ''; }
    else el.style.removeProperty('--foto');
    el.classList.remove('con-imagen');
  }
  function fundir(el, cambio){
    el.classList.add('cambiando');
    setTimeout(() => { cambio(); requestAnimationFrame(() => el.classList.remove('cambiando')); }, 220);
  }
  function aplicar(tipo, v){
    if (vivo[tipo] === v) return;
    vivo[tipo] = v;
    const el = EL[tipo];
    if (v === 'css'){ if (el.classList.contains('con-imagen')) fundir(el, () => quitar(tipo)); else quitar(tipo); return; }
    const im = new Image();
    im.onload = () => { if (vivo[tipo] !== v) return; if (el.classList.contains('con-imagen')) fundir(el, () => poner(tipo, v, im)); else poner(tipo, v, im); };
    im.onerror = () => { if (vivo[tipo] === v){ vivo[tipo] = 'css'; quitar(tipo); } };   // falta el archivo: el dibujo de siempre
    im.src = ruta(tipo, v);
  }
  function aplicarTodo(){ const e = efectiva(); for (const t of TIPOS) aplicar(t, e[t]); }

  // ---- el botón y el panel ----
  const btn = document.getElementById('fondos-btn'), panel = document.getElementById('fondos');
  let construido = false;
  function construir(){
    construido = true; panel.innerHTML = '';
    const h = document.createElement('h3'); h.textContent = 'La sala';
    const x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.textContent = '✕'; x.onclick = cerrar; h.appendChild(x); panel.appendChild(h);
    for (const tipo of TIPOS){
      const fila = document.createElement('div'); fila.className = 'fila'; fila.dataset.tipo = tipo;
      const et = document.createElement('span'); et.textContent = ETIQ[tipo]; fila.appendChild(et);
      const tira = document.createElement('div'); tira.className = 'tira';
      for (const v of Object.keys(LISTAS[tipo])){
        const b = document.createElement('button'); b.type = 'button'; b.dataset.v = v; b.title = LISTAS[tipo][v]; b.setAttribute('aria-label', LISTAS[tipo][v]);
        if (v === 'css'){ b.className = 'css'; b.style.background = MUESTRA_CSS[tipo]; }
        else b.style.backgroundImage = 'url("' + mini(tipo, v) + '")';
        b.onclick = () => elegir(tipo, v);
        tira.appendChild(b);
      }
      fila.appendChild(tira);
      const n = document.createElement('div'); n.className = 'nombre'; fila.appendChild(n);
      panel.appendChild(fila);
    }
    const auto = document.createElement('label'); auto.className = 'auto';
    const c = document.createElement('input'); c.type = 'checkbox'; c.onchange = () => { eleccion.auto = c.checked; guardar(); aplicarTodo(); marcar(); };
    auto.appendChild(c); auto.appendChild(document.createTextNode(' Que cambie sola con la estación y las fiestas'));
    panel.appendChild(auto);
  }
  function marcar(){
    if (!construido) return;
    const e = efectiva();
    panel.querySelectorAll('.fila').forEach(f => {
      const t = f.dataset.tipo, tira = f.querySelector('.tira');
      f.querySelectorAll('.tira button').forEach(b => b.classList.toggle('elegido', b.dataset.v === e[t]));
      f.querySelector('.nombre').textContent = (LISTAS[t][e[t]] || '') + (e.auto && eleccion[t] !== e[t] ? ' (por la temporada)' : '');
      const sel = tira.querySelector('.elegido');                                   // la muestra elegida, a la vista en la tira
      if (sel) tira.scrollLeft = Math.max(0, sel.offsetLeft - tira.clientWidth / 2 + sel.offsetWidth / 2);
    });
    panel.querySelector('.auto input').checked = !!eleccion.auto;
  }
  function elegir(tipo, v){ if (!LISTAS[tipo] || !LISTAS[tipo][v]) return; eleccion[tipo] = v; eleccion.auto = false; guardar(); aplicarTodo(); marcar(); }
  function abrir(){ if (!construido) construir(); marcar(); panel.hidden = false; btn.classList.add('abierto'); setTimeout(() => document.addEventListener('pointerdown', fuera), 0); }
  function cerrar(){ panel.hidden = true; btn.classList.remove('abierto'); document.removeEventListener('pointerdown', fuera); }
  function fuera(e){ if (!panel.contains(e.target) && e.target !== btn) cerrar(); }
  if (btn && panel){
    btn.hidden = false;
    btn.addEventListener('click', () => panel.hidden ? abrir() : cerrar());
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) cerrar(); });
  }

  aplicarTodo();
  window.FONDOS_SALA = {
    eleccion: efectiva, elegir, porTemporada, vivo: () => Object.assign({}, vivo),
    auto: on => { eleccion.auto = !!on; guardar(); aplicarTodo(); marcar(); },
  };
})();
