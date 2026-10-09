// fondos.js: la sala a elección (8 oct 2026): la pared, la ventana y el piso pintados, los
// sillones, la mesa y la alfombra, y los adornos de las librerías.
//
//  FONDOS (libros.js): la pared (solo papel tapiz con su zócalo, background de .fondo-pared anclada
//  abajo), la ventana con sus cortinas (imagen con alfa dentro de .ventanal, que esconde la dibujada
//  por CSS) y el piso (background de .suelo); archivos assets/fondos/pared_<clave>.webp,
//  ventana_<clave>.webp, suelo_<clave>.webp con miniatura en assets/fondos/mini/ (_tools/fondo.py).
//  "css" es el dibujo de siempre.
//  MUEBLES (libros.js): la pareja de sillones (sillon_<clave>_izq/_der.webp), la mesa
//  (mesa_<clave>.webp) y la alfombra (alfombra_<clave>.webp) en assets/muebles/ con miniatura en
//  assets/muebles/mini/ (_tools/mueble.py); "hoy" son los archivos de DECORACION.
//  ADORNOS (libros.js): se encienden y apagan uno por uno; quién los pinta y tapa ranuras es sala.js
//  (SALA_ADORNOS.ocultar); aquí solo viven los botones y la lista de apagados.
//
//  El botón ✎ (abajo a la izquierda) abre el panel: una tira de muestras por pieza (las variantes
//  sin miniatura, es decir sin archivo todavía, no se muestran) y la casilla "que cambie sola con la
//  estación y las fiestas" (FONDOS.temporadas, hemisferio sur; una temporada puede fijar cualquier
//  pieza). La elección se guarda en localStorage ('libro.fondos.v1'). Para capturas y pruebas:
//    ?fondo=pared:rosa,ventana:rosa,piso:blanco,sillones:rosa,mesa:blanca,alfombra:rosa[,auto][,adornos:0]
//                                                         fuerza una combinación (no se guarda)
//    ?hoy=AAAA-MM-DD                                      finge la fecha (la misma del calendario)
//  Expone window.FONDOS_SALA { eleccion, elegir, auto, porTemporada, vivo, adornosOcultos, adorno }.
(() => {
  const F = (typeof FONDOS === 'object' && FONDOS) ? FONDOS : null;
  const M = (typeof MUEBLES === 'object' && MUEBLES) ? MUEBLES : {};
  const ADS = (typeof ADORNOS !== 'undefined' && Array.isArray(ADORNOS)) ? ADORNOS : [];
  const DEC = (typeof DECORACION === 'object' && DECORACION) ? DECORACION : {};
  const sala = document.getElementById('sala');
  if (!F || !sala) return;
  const q = new URLSearchParams(location.search);
  const EL = {
    pared: sala.querySelector('.fondo-pared'), ventana: sala.querySelector('.ventanal'), piso: sala.querySelector('.suelo'),
    sillones: [sala.querySelector('.sillon.rojo'), sala.querySelector('.sillon.amarillo')], mesa: sala.querySelector('.mesa'), alfombra: sala.querySelector('.alfombra'),
  };
  if (!EL.pared || !EL.ventana || !EL.piso) return;

  const TIPOS = ['pared', 'ventana', 'piso', 'sillones', 'mesa', 'alfombra'];
  const ETIQ = { pared: 'Pared', ventana: 'Ventana', piso: 'Piso', sillones: 'Sillones', mesa: 'Mesa', alfombra: 'Alfombra' };
  const LISTAS = { pared: F.paredes || {}, ventana: F.ventanas || {}, piso: F.pisos || {}, sillones: M.sillones || {}, mesa: M.mesas || {}, alfombra: M.alfombras || {} };
  const NADA = { pared: 'css', ventana: 'css', piso: 'css', sillones: 'hoy', mesa: 'hoy', alfombra: 'hoy' };
  const ESPERA = ['css', 'hoy'];                                  // las claves que no tienen archivo propio
  // los archivos de cada pieza y variante (null = sin archivo: el dibujo CSS)
  function rutas(tipo, v){
    if (v === 'css') return null;
    if (tipo === 'pared') return ['assets/fondos/pared_' + v + '.webp'];
    if (tipo === 'ventana') return ['assets/fondos/ventana_' + v + '.webp'];
    if (tipo === 'piso') return ['assets/fondos/suelo_' + v + '.webp'];
    if (tipo === 'sillones') return v === 'hoy' ? [DEC.sillon_rojo, DEC.sillon_amarillo] : ['assets/muebles/sillon_' + v + '_izq.webp', 'assets/muebles/sillon_' + v + '_der.webp'];
    if (tipo === 'mesa') return v === 'hoy' ? [DEC.mesa] : ['assets/muebles/mesa_' + v + '.webp'];
    if (tipo === 'alfombra') return v === 'hoy' ? [DEC.alfombra] : ['assets/muebles/alfombra_' + v + '.webp'];
    return null;
  }
  const MINI = { pared: 'assets/fondos/mini/pared_', ventana: 'assets/fondos/mini/ventana_', piso: 'assets/fondos/mini/suelo_', sillones: 'assets/muebles/mini/sillones_', mesa: 'assets/muebles/mini/mesa_', alfombra: 'assets/muebles/mini/alfombra_' };
  const mini = (tipo, v) => MINI[tipo] + v + '.webp';
  const miniAdorno = id => 'assets/adornos/mini/' + id + '.webp';
  // la muestra del dibujo de siempre, por pieza (las de "hoy" tienen miniatura propia: _tools/mueble.py --minis-hoy)
  const MUESTRA_CSS = { pared: 'linear-gradient(135deg,#5c141b,#3f0d12)', ventana: 'linear-gradient(90deg,#a5242e 0 22%,#1a2050 22% 78%,#a5242e 78%)', piso: 'linear-gradient(180deg,#3a2314,#24150c)' };
  const CLAVE = 'libro.fondos.v1';

  // ---- la elección: la guardada, si no la de defecto; ?fondo= la fuerza sin guardar ----
  let eleccion = Object.assign({ auto: false, adornosOcultos: [] }, NADA, F.defecto || {}, M.defecto || {});
  const sinGuardar = q.has('fondo') || q.has('test');
  if (!q.has('fondo')){
    try { const g = JSON.parse(localStorage.getItem(CLAVE) || 'null'); if (g && typeof g === 'object') eleccion = Object.assign(eleccion, g); } catch (e) {}
  } else {
    for (const par of q.get('fondo').split(',')){
      const [k, v] = par.split(':');
      if (k === 'auto') eleccion.auto = v !== '0';
      else if (k === 'adornos' && v === '0') eleccion.adornosOcultos = ADS.map(a => a.id);
      else if (LISTAS[k] && v) eleccion[k] = v;
    }
  }
  if (!Array.isArray(eleccion.adornosOcultos)) eleccion.adornosOcultos = [];
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
    const e = { auto: !!eleccion.auto }; for (const k of TIPOS) e[k] = eleccion[k];
    if (e.auto){ const t = porTemporada(fecha()); if (t) Object.assign(e, t); }
    for (const k of TIPOS) if (!LISTAS[k][e[k]]) e[k] = NADA[k];
    return e;
  }

  // ---- aplicar una pieza (con un fundido corto) ----
  const vivo = {}; for (const k of TIPOS) vivo[k] = null;
  function fundir(el, cambio){
    el.classList.add('cambiando');
    setTimeout(() => { cambio(); requestAnimationFrame(() => el.classList.remove('cambiando')); }, 220);
  }
  const conFundido = (el, cambio) => { if (el.classList.contains('con-imagen')) fundir(el, cambio); else cambio(); };
  // los fondos: pared y piso como background (variable --foto), la ventana como <img class="foto">
  function ponerFondo(tipo, r, im){
    const el = EL[tipo];
    if (tipo === 'ventana'){
      let foto = el.querySelector(':scope > img.foto');
      if (!foto){ foto = document.createElement('img'); foto.className = 'foto'; foto.alt = ''; foto.draggable = false; el.insertBefore(foto, el.firstChild); }
      foto.src = r; el.style.aspectRatio = im.naturalWidth + ' / ' + im.naturalHeight;
    } else el.style.setProperty('--foto', 'url("' + r + '")');
    el.classList.add('con-imagen');
  }
  function quitarFondo(tipo){
    const el = EL[tipo];
    if (tipo === 'ventana'){ const foto = el.querySelector(':scope > img.foto'); if (foto) foto.remove(); el.style.aspectRatio = ''; }
    else el.style.removeProperty('--foto');
    el.classList.remove('con-imagen');
  }
  // los muebles: la foto sustituye al dibujo SVG (y al tejido recortado de los sillones); la mesa avisa para que se re-mida
  function ponerFoto(el, r, tras){
    let foto = el.querySelector(':scope > img.foto');
    if (!foto){
      const svg = el.querySelector(':scope > svg'); if (svg) svg.remove();
      const tela = el.querySelector('.tela'); if (tela) tela.remove();
      foto = document.createElement('img'); foto.className = 'foto'; foto.alt = ''; foto.draggable = false;
      el.insertBefore(foto, el.firstChild); el.classList.add('con-imagen');
    }
    foto.onload = tras || null; foto.src = r;
  }
  function aplicar(tipo, v){
    if (vivo[tipo] === v) return;
    vivo[tipo] = v;
    const rs = rutas(tipo, v);
    if (tipo === 'pared' || tipo === 'ventana' || tipo === 'piso'){
      const el = EL[tipo];
      if (!rs){ conFundido(el, () => quitarFondo(tipo)); return; }
      const im = new Image();
      im.onload = () => { if (vivo[tipo] === v) conFundido(el, () => ponerFondo(tipo, rs[0], im)); };
      im.onerror = () => { if (vivo[tipo] === v){ vivo[tipo] = 'css'; quitarFondo(tipo); } };   // falta el archivo: el dibujo de siempre
      im.src = rs[0];
      return;
    }
    if (!rs || rs.some(r => !r)) return;
    const els = tipo === 'sillones' ? EL.sillones : [EL[tipo]];
    rs.forEach((r, i) => {
      const el = els[i]; if (!el) return;
      const im = new Image();
      im.onload = () => { if (vivo[tipo] === v) conFundido(el, () => ponerFoto(el, r, tipo === 'mesa' ? () => dispatchEvent(new Event('resize')) : null)); };
      im.onerror = () => {};                                 // falta el archivo: se queda lo que había
      im.src = r;
    });
  }
  function aplicarTodo(){ const e = efectiva(); for (const t of TIPOS) aplicar(t, e[t]); }
  function aplicarAdornos(){ if (window.SALA_ADORNOS) SALA_ADORNOS.ocultar(eleccion.adornosOcultos); }

  // ---- el botón y el panel ----
  const btn = document.getElementById('fondos-btn'), panel = document.getElementById('fondos');
  let construido = false;
  // una muestra con miniatura; si la miniatura no existe (la variante aún no tiene archivo), el botón se esconde
  function muestra(src, titulo, alClic){
    const b = document.createElement('button'); b.type = 'button'; b.title = titulo; b.setAttribute('aria-label', titulo);
    b.style.backgroundImage = 'url("' + src + '")'; b.onclick = alClic;
    const t = new Image(); t.onerror = () => { b.hidden = true; }; t.src = src;
    return b;
  }
  function construir(){
    construido = true; panel.innerHTML = '';
    const h = document.createElement('h3'); h.textContent = 'La sala';
    const x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Cerrar'); x.textContent = '✕'; x.onclick = cerrar; h.appendChild(x); panel.appendChild(h);
    for (const tipo of TIPOS){
      if (!Object.keys(LISTAS[tipo]).length) continue;
      const fila = document.createElement('div'); fila.className = 'fila'; fila.dataset.tipo = tipo;
      const et = document.createElement('span'); et.textContent = ETIQ[tipo]; fila.appendChild(et);
      const tira = document.createElement('div'); tira.className = 'tira';
      for (const v of Object.keys(LISTAS[tipo])){
        let b;
        if (v === 'css'){ b = document.createElement('button'); b.type = 'button'; b.className = 'css'; b.title = LISTAS[tipo][v]; b.setAttribute('aria-label', LISTAS[tipo][v]); b.style.background = MUESTRA_CSS[tipo]; b.onclick = () => elegir(tipo, v); }
        else b = muestra(mini(tipo, v), LISTAS[tipo][v], () => elegir(tipo, v));
        b.dataset.v = v; tira.appendChild(b);
      }
      fila.appendChild(tira);
      const n = document.createElement('div'); n.className = 'nombre'; fila.appendChild(n);
      panel.appendChild(fila);
    }
    if (ADS.length){
      const fila = document.createElement('div'); fila.className = 'fila adornos';
      const et = document.createElement('span'); et.textContent = 'Adornos (toca para apagar o encender)'; fila.appendChild(et);
      const tira = document.createElement('div'); tira.className = 'tira';
      for (const a of ADS){ const b = muestra(miniAdorno(a.id), a.nombre || a.id, () => adorno(a.id)); b.dataset.adorno = a.id; tira.appendChild(b); }
      fila.appendChild(tira); panel.appendChild(fila);
    }
    const auto = document.createElement('label'); auto.className = 'auto';
    const c = document.createElement('input'); c.type = 'checkbox'; c.onchange = () => { eleccion.auto = c.checked; guardar(); aplicarTodo(); marcar(); };
    auto.appendChild(c); auto.appendChild(document.createTextNode(' Que cambie sola con la estación y las fiestas'));
    panel.appendChild(auto);
  }
  function marcar(){
    if (!construido) return;
    const e = efectiva();
    panel.querySelectorAll('.fila[data-tipo]').forEach(f => {
      const t = f.dataset.tipo, tira = f.querySelector('.tira');
      f.querySelectorAll('.tira button').forEach(b => b.classList.toggle('elegido', b.dataset.v === e[t]));
      f.querySelector('.nombre').textContent = (LISTAS[t][e[t]] || '') + (e.auto && eleccion[t] !== e[t] ? ' (por la temporada)' : '');
      const sel = tira.querySelector('.elegido');                                   // la muestra elegida, a la vista en la tira
      if (sel) tira.scrollLeft = Math.max(0, sel.offsetLeft - tira.clientWidth / 2 + sel.offsetWidth / 2);
    });
    panel.querySelectorAll('.fila.adornos .tira button').forEach(b => b.classList.toggle('apagado', eleccion.adornosOcultos.includes(b.dataset.adorno)));
    panel.querySelector('.auto input').checked = !!eleccion.auto;
  }
  function elegir(tipo, v){ if (!LISTAS[tipo] || !LISTAS[tipo][v]) return; eleccion[tipo] = v; eleccion.auto = false; guardar(); aplicarTodo(); marcar(); }
  function adorno(id, encender){
    const oc = eleccion.adornosOcultos.filter(x => x !== id);
    if (encender === undefined ? !eleccion.adornosOcultos.includes(id) : !encender) oc.push(id);
    eleccion.adornosOcultos = oc; guardar(); aplicarAdornos(); marcar();
  }
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
    adornosOcultos: () => eleccion.adornosOcultos.slice(), adorno,
  };
})();
