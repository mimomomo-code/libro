# -*- coding: utf-8 -*-
"""
EL CATÁLOGO DE LA SALA: una sola fuente de verdad, catalogo/catalogo.xlsx (se edita en Excel), de la
que sale TODO lo derivado. Paredes, ventanas, pisos, sillones, mesas, alfombras, adornos y mascotas
(razas) son "familias"; cada hoja del Excel es una familia y cada fila una variante.

  catalogo/catalogo.json   el espejo del Excel, para que git muestre qué cambió (el .xlsx es binario)
  catalogo.js              lo que lee la página: FONDOS, MUEBLES, ADORNOS, RAZAS y CATALOGO. Solo las
                           variantes cuyo archivo YA existe en assets/ (una fila sin imagen no sale) y
                           SIN los prompts (no viajan al navegador).
  Taller del libro         (OneDrive/Escritorio): Pedidos/<familia>/PEDIDO ... .txt listos para pegar
                           en ChatGPT, Mascotas/<raza>/ con sus pedidos por pose, CATALOGO.md (qué hay
                           y qué falta) y LEEME.md. Los PNG que vuelven se dejan en Bandeja/ y entran
                           con _tools/bandeja.py.

Uso:
  python _tools/catalogo.py                     todo: Excel -> json + catalogo.js + Taller
  python _tools/catalogo.py --solo-js           solo json + catalogo.js (no toca el Escritorio)
  python _tools/catalogo.py --taller <carpeta>  otro Taller (para probar sin tocar el de verdad)
  python _tools/catalogo.py --excel-desde-json  reconstruye el Excel desde catalogo.json (si se pierde
                                                o para la primera vez)
  python _tools/catalogo.py --referencias       recompone las referencias de muebles desde assets/
Editar el Excel sin abrirlo (tiene que estar CERRADO en Excel):
  python _tools/catalogo.py --fila pared clave=marina nombre="Azul marina" para="..." papel="..." zocalo="..." luz="..."
  python _tools/catalogo.py --editar Plantillas mascota_echado texto "..."      (hoja, clave de la fila, columna, valor)
  python _tools/catalogo.py --familia familia=lampara hoja=Lamparas nombre=Lámparas singular=lámpara carpeta=Lamparas
         prefijo=lampara tamano="1024 x 1536 (vertical)" alfa=x referencia=referencia_estante.png referencia_nota="..."
         destino=assets/adornos asset={clave}.webp mini_asset={clave}.webp lado_max=600 mini=120 postproceso=recortar
         plantilla=lampara tipo_js=lamparas columnas=objeto,luz
Necesita openpyxl (y Pillow para --referencias).
"""
import io, json, os, re, shutil, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(RAIZ, 'catalogo', 'catalogo.xlsx')
JSON_ = os.path.join(RAIZ, 'catalogo', 'catalogo.json')
JS = os.path.join(RAIZ, 'catalogo.js')
TALLER = r'C:/Users/basti/OneDrive/Escritorio/Taller del libro'
POSES = ('parado', 'echado', 'sentado')
REF_ESTILO = 'referencia_estilo.webp'          # el acabado que queremos: se adjunta con todos los pedidos (Taller/Referencias)
HOJAS_FIJAS = ('LEEME', 'Familias', 'Plantillas', 'Temporadas')
COMUNES = ('n', 'clave', 'nombre', 'para', 'precio', 'defecto')
NUMERICAS = {'n', 'precio', 'ancho', 'fila', 'col', 'pereza', 'velocidad', 'voz', 'lado_max', 'mini'}
BOOLEANAS = {'alfa', 'defecto'}
try: sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception: pass

# ---------------------------------------------------------------- json <-> Excel
def leer_json(ruta=JSON_):
    return json.loads(io.open(ruta, encoding='utf-8').read())

def escribir_json(data, ruta=JSON_):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    io.open(ruta, 'w', encoding='utf-8').write(json.dumps(data, ensure_ascii=False, indent=1) + '\n')

def valor_excel(col, v):
    if col in BOOLEANAS: return 'x' if v else ''
    if v is None: return ''
    return v

def valor_json(col, v):
    if col in BOOLEANAS: return str(v).strip().lower() in ('x', 'si', 'sí', '1', 'true', 'verdadero') if v is not None else False
    if v is None: return ''
    if col in NUMERICAS:
        if isinstance(v, str):
            v = v.strip()
            if v == '': return ''
            try: v = float(v.replace(',', '.'))
            except ValueError: return v
        if isinstance(v, float) and v.is_integer(): return int(v)
        return v
    if isinstance(v, float) and v.is_integer(): return int(v)
    return v.strip() if isinstance(v, str) else v

LEEME_EXCEL = """EL CATÁLOGO DE LA SALA (fuente de verdad: este Excel)
Cada hoja de variantes (Paredes, Ventanas, Pisos, Sillones, Mesas, Alfombras, Adornos, Mascotas) es una FAMILIA de piezas; cada fila es una variante.
Para añadir una pieza: una fila nueva con su clave (corta, sin tildes ni espacios: es el nombre del archivo), su nombre y los campos que usa su plantilla.
Para añadir una familia nueva (lámparas, cuadros, perros...): una fila en Familias, una hoja con su nombre y una plantilla de pedido en Plantillas.
Después, en la carpeta del proyecto:   python _tools/catalogo.py   (reescribe catalogo.json, catalogo.js y el Taller del Escritorio).

Columnas comunes de las hojas de variantes:
  n        número de orden (sale en el nombre del PEDIDO).
  clave    identificador: nombre del archivo (pared_<clave>.png) y de la variante en la página.
  nombre   lo que se lee en el selector y en el catálogo.
  para     para quién / cuándo / con qué va bien (solo informativo, sale en CATALOGO.md).
  precio   0 = gratis. Cuando haya tienda, lo que cuesta.
  defecto  una x en la variante que ve quien entra por primera vez (si ninguna, el dibujo de siempre).
Los demás campos de cada hoja son los huecos {campo} de su plantilla de pedido (hoja Plantillas).

Hoja Familias: la configuración técnica de cada familia (tamaño pedido, si lleva fondo transparente, referencia de composición, dónde va en assets/, cómo se procesa). Normalmente no se toca.
Hoja Plantillas: los textos de los pedidos. {estilo} es el párrafo de estilo común; {clave}, {nombre} y los campos de la fila se rellenan solos.
Hoja Temporadas: lo que se pone solo con "que cambie con la estación" (fiestas primero, luego estaciones del hemisferio sur). Las claves tienen que existir en su hoja.
Hoja Mascotas: cada fila es una RAZA (lo que se vende). La pareja elige una raza y le pone nombre en su sala (MASCOTAS en libros.js). pelaje = receta del dibujo de respaldo (atigrado, carey, tricolor, van_cafe); pelaje_es = descripción para el pedido; pereza/velocidad/sillon/voz = carácter por defecto.
Las variantes cuya imagen aún no existe en assets/ NO salen en la página: aparecen como pendientes en CATALOGO.md del Taller."""

def json_a_excel(data, ruta=XLSX):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.comments import Comment
    wb = Workbook(); wb.remove(wb.active)
    negrita = Font(bold=True); relleno = PatternFill('solid', fgColor='FFF2E6D9'); envuelve = Alignment(wrap_text=True, vertical='top')
    ANCHOS = {'n': 5, 'clave': 14, 'nombre': 30, 'para': 40, 'precio': 8, 'defecto': 9, 'colores': 28, 'texto': 110, 'familia': 11,
              'hoja': 11, 'grupo': 10, 'singular': 10, 'carpeta': 11, 'prefijo': 10, 'tamano': 26, 'alfa': 6, 'referencia': 24,
              'referencia_nota': 50, 'destino': 20, 'asset': 36, 'mini_asset': 22, 'lado_max': 9, 'mini': 6, 'postproceso': 12,
              'plantilla': 16, 'tipo_sel': 9, 'tipo_js': 10, 'base_clave': 10, 'base_nombre': 26, 'especie': 8, 'pelaje': 10,
              'pelaje_es': 60, 'pelaje_en': 60, 'pereza': 8, 'velocidad': 9, 'sillon': 9, 'voz': 6, 'ancho': 7, 'lado': 6, 'fila': 6,
              'col': 6, 'desde': 8, 'hasta': 8, 'meses': 10, 'combina': 34}
    def hoja(nombre, filas, columnas=None):
        ws = wb.create_sheet(nombre)
        if not filas and not columnas: return ws
        columnas = columnas or list(dict.fromkeys(k for f in filas for k in f.keys()))
        ws.append(columnas)
        for c in ws[1]: c.font = negrita; c.fill = relleno
        for f in filas: ws.append([valor_excel(c, f.get(c)) for c in columnas])
        for i, c in enumerate(columnas, 1):
            letra = ws.cell(row=1, column=i).column_letter
            ws.column_dimensions[letra].width = ANCHOS.get(c, 46 if any(isinstance(f.get(c), str) and len(f.get(c)) > 40 for f in filas) else 14)
            for fila in ws.iter_rows(min_row=2, min_col=i, max_col=i):
                for celda in fila: celda.alignment = envuelve
        ws.freeze_panes = 'A2'
        return ws
    ws = wb.create_sheet('LEEME'); ws.column_dimensions['A'].width = 150
    for linea in LEEME_EXCEL.split('\n'): ws.append([linea])
    ws['A1'].font = negrita
    hoja('Familias', data['familias'])
    ws = hoja('Plantillas', [{'clave': k, 'texto': v} for k, v in data['plantillas'].items()])
    for fila in ws.iter_rows(min_row=2):
        fila[1].alignment = envuelve
        ws.row_dimensions[fila[0].row].height = min(400, 15 * (1 + len(str(fila[1].value or '')) // 100 + str(fila[1].value or '').count('\n')))
    for fam in data['familias']:
        filas = data['piezas'].get(fam['familia'], [])
        columnas = list(COMUNES) + [k for k in dict.fromkeys(k for f in filas for k in f.keys()) if k not in COMUNES]
        hoja(fam['hoja'], filas, columnas)
    hoja('Temporadas', data['temporadas'], ['nombre', 'desde', 'hasta', 'meses', 'pared', 'ventana', 'piso', 'sillones', 'mesa', 'alfombra'])
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    wb.save(ruta)

def excel_a_json(ruta=XLSX):
    from openpyxl import load_workbook
    wb = load_workbook(ruta, data_only=True)
    def filas(nombre, clave='clave'):
        if nombre not in wb.sheetnames: return []
        ws = wb[nombre]; it = ws.iter_rows(values_only=True)
        cab = [str(c).strip() if c is not None else '' for c in next(it, [])]
        out = []
        for r in it:
            d = {c: valor_json(c, v) for c, v in zip(cab, r) if c}
            if clave and not d.get(clave): continue
            if not clave and not any(v not in ('', None, False) for v in d.values()): continue
            out.append(d)
        return out
    data = {'version': 1, 'familias': filas('Familias', 'familia'),
            'plantillas': {f['clave']: (f.get('texto') or '') for f in filas('Plantillas')}, 'piezas': {}, 'temporadas': filas('Temporadas', None)}
    for fam in data['familias']:
        data['piezas'][fam['familia']] = filas(fam['hoja'])
    return data

# ---------------------------------------------------------------- lo que existe en assets/
def archivos_de(fam, p):
    """Las rutas (relativas al repo) que la variante necesita en assets/."""
    destino = fam['destino'].format(clave=p['clave'])
    return [destino + '/' + a.strip().format(clave=p['clave']) for a in fam['asset'].split(',') if a.strip()]

def estado(data):
    """Marca cada variante con `hecha` (todos sus archivos existen) y, en mascotas, `poses` hechas."""
    for fam in data['familias']:
        for p in data['piezas'].get(fam['familia'], []):
            rutas = archivos_de(fam, p)
            existe = {r: os.path.exists(os.path.join(RAIZ, r)) for r in rutas}
            if fam['postproceso'] == 'mascota':
                p['_poses'] = {'parado': existe.get(rutas[0], False), 'echado': existe.get(rutas[1], False) if len(rutas) > 1 else False,
                               'sentado': existe.get(rutas[2], False) if len(rutas) > 2 else False}
                p['_hecha'] = p['_poses']['parado']
            else:
                p['_hecha'] = all(existe.values())
            p['_archivos'] = rutas
    return data

def familia(data, nombre):
    for f in data['familias']:
        if f['familia'] == nombre: return f
    return None

# ---------------------------------------------------------------- catalogo.js
def js(v): return json.dumps(v, ensure_ascii=False)

def escribir_js(data, ruta=JS, publico=False):
    """catalogo.js. Con publico=True (la vitrina): sin precios ni la tabla CATALOGO, solo lo que la página usa hoy."""
    fams = {f['familia']: f for f in data['familias']}
    def lista(familia_):
        fam = fams[familia_]; d = {}
        if fam.get('base_clave'): d[fam['base_clave']] = fam['base_nombre']
        for p in data['piezas'].get(familia_, []):
            if p.get('_hecha'): d[p['clave']] = p['nombre']
        return d
    def defecto(familia_):
        fam = fams[familia_]
        for p in data['piezas'].get(familia_, []):
            if p.get('defecto') and p.get('_hecha'): return p['clave']
        return fam.get('base_clave') or ''
    temporadas = []
    avisos = []
    for t in data['temporadas']:
        e = {}
        if t.get('desde') and t.get('hasta'): e['desde'] = str(t['desde']); e['hasta'] = str(t['hasta'])
        elif t.get('meses'): e['meses'] = [int(x) for x in re.split(r'[,\s;]+', str(t['meses']).strip()) if x]
        for k in ('pared', 'ventana', 'piso', 'sillones', 'mesa', 'alfombra'):
            v = t.get(k)
            if v:
                fam = next((f for f in data['familias'] if f.get('tipo_sel') == k), None)
                hechas = lista(fam['familia']) if fam else {}
                if v not in hechas: avisos.append('temporada %s: %s "%s" no existe o no está hecha' % (t.get('nombre', '?'), k, v))
                e[k] = v
        temporadas.append(e)
    F = {'paredes': lista('pared'), 'ventanas': lista('ventana'), 'pisos': lista('piso'),
         'defecto': {'pared': defecto('pared'), 'ventana': defecto('ventana'), 'piso': defecto('piso')}, 'temporadas': temporadas}
    M = {'sillones': lista('sillones'), 'mesas': lista('mesa'), 'alfombras': lista('alfombra'),
         'defecto': {'sillones': defecto('sillones'), 'mesa': defecto('mesa'), 'alfombra': defecto('alfombra')}}
    A = [{'id': p['clave'], 'nombre': p['nombre'], 'estante': {'lado': p['lado'], 'fila': int(p['fila']), 'col': int(p['col'])}, 'ancho': int(p['ancho'])}
         for p in data['piezas'].get('adorno', []) if p.get('_hecha')]
    R = {}
    for p in data['piezas'].get('mascota', []):
        r = {'nombre': p['nombre'], 'especie': p.get('especie') or 'gato', 'pelaje': p.get('pelaje') or p['clave']}
        rutas = p.get('_archivos', []); poses = p.get('_poses', {})
        if poses.get('parado'): r['piezas'] = rutas[0]
        if poses.get('echado'): r['echado'] = rutas[1]
        if poses.get('sentado'): r['sentado'] = rutas[2]
        car = {}
        for k in ('pereza', 'velocidad', 'voz'):
            if p.get(k) not in ('', None): car[k] = p[k]
        if p.get('sillon'): car['sillon'] = p['sillon']
        if car: r['caracter'] = car
        if not publico: r['precio'] = p.get('precio') or 0
        R[p['clave']] = r
    C = {'familias': [{'familia': f['familia'], 'grupo': f['grupo'], 'nombre': f['nombre'], 'tipo': f.get('tipo_sel') or f['tipo_js']} for f in data['familias']],
         'piezas': {f['familia']: [{'clave': p['clave'], 'nombre': p['nombre'], 'para': p.get('para') or '', 'precio': p.get('precio') or 0,
                                    'hecha': bool(p.get('_hecha'))} for p in data['piezas'].get(f['familia'], [])] for f in data['familias']}}
    if publico:
        lineas = ['// GENERADO. Lo que la sala sabe de sus fondos (pared, ventana, piso), muebles (sillones, mesa, alfombra),',
                  '// adornos de las librerías y razas de gato: fondos.js, sala.js y libros.js lo leen. No editar a mano.']
    else:
        lineas = ['// GENERADO por _tools/catalogo.py desde catalogo/catalogo.xlsx. NO EDITAR A MANO: se pisa en cada corrida.',
                  '// Solo salen las variantes cuya imagen existe en assets/. Las pendientes están en CATALOGO.md del Taller.',
                  '// FONDOS (pared, ventana, piso), MUEBLES (sillones, mesa, alfombra) y ADORNOS los lee fondos.js / sala.js;',
                  '// RAZAS las mascotas vendibles (libros.js arma GATOS con MASCOTAS + RAZAS); CATALOGO, la tienda de mañana.']
    lineas.append('const FONDOS = {')
    for k in ('paredes', 'ventanas', 'pisos', 'defecto'): lineas.append('  %s: %s,' % (k, js(F[k])))
    lineas.append('  temporadas: [')
    for t in F['temporadas']: lineas.append('    %s,' % js(t))
    lineas += ['  ],', '};', 'const MUEBLES = {']
    for k in ('sillones', 'mesas', 'alfombras', 'defecto'): lineas.append('  %s: %s,' % (k, js(M[k])))
    lineas += ['};', 'const ADORNOS = [']
    for a in A: lineas.append('  %s,' % js(a))
    lineas += ['];', 'const RAZAS = {']
    for k, r in R.items(): lineas.append('  %s: %s,' % (js(k), js(r)))
    lineas.append('};')
    if not publico:
        lineas += ['const CATALOGO = {', '  familias: %s,' % js(C['familias']), '  piezas: {']
        for k, v in C['piezas'].items(): lineas.append('    %s: %s,' % (k, js(v)))
        lineas += ['  },', '};']
    lineas.append('')
    io.open(ruta, 'w', encoding='utf-8').write('\n'.join(lineas))
    return avisos

# ---------------------------------------------------------------- editar el Excel desde la terminal
def abrir_excel(ruta=XLSX):
    from openpyxl import load_workbook
    return load_workbook(ruta)

def guardar_excel(wb, ruta=XLSX):
    try: wb.save(ruta)
    except PermissionError: raise SystemExit('No puedo escribir %s: está abierto en Excel. Ciérralo y repite.' % ruta)

def cabecera(ws):
    return [str(c.value).strip() if c.value is not None else '' for c in ws[1]]

def anadir_fila(familia_, campos, ruta=XLSX):
    """Una variante nueva: clave=... nombre=... y los campos de su plantilla. n se calcula solo. Devuelve la fila escrita."""
    data = excel_a_json(ruta); fam = familia(data, familia_)
    if not fam: raise SystemExit('Familia desconocida: %s (hay: %s)' % (familia_, ', '.join(f['familia'] for f in data['familias'])))
    if not campos.get('clave') or not campos.get('nombre'): raise SystemExit('Hacen falta al menos clave=... y nombre=...')
    if not re.match(r'^[a-z0-9_]+$', campos['clave']): raise SystemExit('La clave va en minúsculas, sin tildes ni espacios: %r' % campos['clave'])
    if any(p['clave'] == campos['clave'] for p in data['piezas'].get(familia_, [])): raise SystemExit('La clave %s ya existe en %s' % (campos['clave'], fam['hoja']))
    wb = abrir_excel(ruta); ws = wb[fam['hoja']]; cab = cabecera(ws)
    desconocidos = [k for k in campos if k not in cab]
    if desconocidos: raise SystemExit('La hoja %s no tiene estas columnas: %s (tiene: %s)' % (fam['hoja'], ', '.join(desconocidos), ', '.join(c for c in cab if c)))
    n = max([int(p['n']) for p in data['piezas'].get(familia_, []) if p.get('n') not in ('', None)] or [0]) + 1
    fila = {c: campos.get(c, '') for c in cab}; fila['n'] = n
    if 'precio' in fila and fila['precio'] == '': fila['precio'] = 0
    ws.append([valor_excel(c, fila[c]) if c in BOOLEANAS else fila[c] for c in cab])
    guardar_excel(wb, ruta)
    faltan = [c for c in cab if c and c not in COMUNES and not campos.get(c)]
    if faltan: print('AVISO: la fila quedó con estos campos vacíos (los pide la plantilla): %s' % ', '.join(faltan))
    return fila

def editar_celda(hoja, clave, columna, valor, ruta=XLSX):
    """Cambia una celda: la fila cuya primera columna clave vale `clave` (en Plantillas, la clave del texto)."""
    wb = abrir_excel(ruta)
    if hoja not in wb.sheetnames: raise SystemExit('No hay hoja %s (hay: %s)' % (hoja, ', '.join(wb.sheetnames)))
    ws = wb[hoja]; cab = cabecera(ws)
    if columna not in cab: raise SystemExit('La hoja %s no tiene columna %s (tiene: %s)' % (hoja, columna, ', '.join(c for c in cab if c)))
    col_clave = cab.index('clave' if 'clave' in cab else ('familia' if 'familia' in cab else cab[0]))
    for fila in ws.iter_rows(min_row=2):
        if str(fila[col_clave].value).strip() == clave:
            fila[cab.index(columna)].value = valor; guardar_excel(wb, ruta); return True
    raise SystemExit('No hay fila %s en la hoja %s' % (clave, hoja))

def nueva_familia(campos, ruta=XLSX):
    """Una familia nueva: fila en Familias + hoja con las columnas comunes y las de `campos` (lista separada por comas) + plantilla vacía."""
    from openpyxl.styles import Font, PatternFill
    wb = abrir_excel(ruta); ws = wb['Familias']; cab = cabecera(ws)
    for k in ('familia', 'hoja', 'nombre', 'singular', 'carpeta', 'prefijo', 'destino', 'asset', 'postproceso', 'plantilla'):
        if not campos.get(k): raise SystemExit('Falta %s=... (columnas de Familias: %s)' % (k, ', '.join(c for c in cab if c)))
    if campos['hoja'] in wb.sheetnames: raise SystemExit('Ya hay una hoja %s' % campos['hoja'])
    columnas = [c.strip() for c in campos.pop('columnas', '').split(',') if c.strip()]
    ws.append([valor_excel(c, campos.get(c, '')) if c in BOOLEANAS else campos.get(c, '') for c in cab])
    h = wb.create_sheet(campos['hoja']); h.append(list(COMUNES) + columnas)
    for c in h[1]: c.font = Font(bold=True); c.fill = PatternFill('solid', fgColor='FFF2E6D9')
    h.freeze_panes = 'A2'
    pl = wb['Plantillas']; pl.append([campos['plantilla'].format(pose='parado'), 'Genera ahora una imagen. No describas, no esperes más material.\n\n(ESCRIBIR AQUÍ EL PEDIDO con {campos} de la hoja %s y {estilo})' % campos['hoja']])
    guardar_excel(wb, ruta)
    return columnas

# ---------------------------------------------------------------- el Taller del Escritorio
def nombre_archivo(fam, p, pose=None, ext='png'):
    """El archivo que tiene que devolver la IA (sin carpeta); con ext='webp', cómo queda guardado en Hechos/."""
    if fam['postproceso'] == 'mascota': return '%s_%s.%s' % (p['clave'], pose or 'parado', ext)
    return '%s_%s.%s' % (fam['prefijo'], p['clave'], ext)

def carpeta_raza(fam, p): return os.path.join(fam['carpeta'], '%02d %s' % (int(p['n']), p['nombre']))

def texto_pedido(data, fam, p, pose=None):
    pl = data['plantillas']
    clave_pl = fam['plantilla'].format(pose=pose or 'parado')
    if clave_pl not in pl: raise SystemExit('Falta la plantilla "%s" en la hoja Plantillas' % clave_pl)
    campos = dict(p); campos['estilo'] = pl.get('estilo', ''); campos['nombre_raza'] = p['nombre']
    try: cuerpo = pl[clave_pl].format(**campos)
    except KeyError as e: raise SystemExit('La plantilla "%s" pide el campo %s y la fila %s/%s no lo tiene' % (clave_pl, e, fam['hoja'], p['clave']))
    if cuerpo.lstrip().startswith('ADJUNTAR'):
        texto = cuerpo
    else:
        texto = ('ADJUNTAR (las dos, de la carpeta Referencias):\n  1. %s   (%s)\n  2. %s   (%s)\n\nPEGAR ESTE TEXTO:\n\n%s'
                 % (fam['referencia'], fam['referencia_nota'], REF_ESTILO, pl.get('adjuntar_estilo', ''), cuerpo))
    texto += '\n\n' + pl.get('pie_texto', '')
    if fam.get('alfa') and pl.get('pie_alfa'): texto += '\n' + pl['pie_alfa']
    texto += '\n\nGUARDAR EL RESULTADO COMO:  %s   %s\n' % (nombre_archivo(fam, p, pose), pl.get('pie_guardar', ''))
    return texto

def escribir_taller(data, taller=TALLER):
    for sub in ('Pedidos', 'Referencias', 'Bandeja', 'Hechos'): os.makedirs(os.path.join(taller, sub), exist_ok=True)
    escritos = 0
    for fam in data['familias']:
        piezas = data['piezas'].get(fam['familia'], [])
        if fam['postproceso'] == 'mascota':
            for p in piezas:
                d = os.path.join(taller, carpeta_raza(fam, p)); os.makedirs(d, exist_ok=True)
                for pose in POSES:
                    io.open(os.path.join(d, 'PEDIDO %s - %s.txt' % (pose, p['nombre'])), 'w', encoding='utf-8').write(texto_pedido(data, fam, p, pose)); escritos += 1
                if data['plantillas'].get('mascota_prompt_en'):
                    md = ['# %s (`%s`)' % (p['nombre'], p['clave']), '',
                          '**Cómo es de verdad** (`foto_referencia.jpg`): %s' % p.get('pelaje_es', ''), '',
                          '**Archivos de esta carpeta:** `%s_<pose>_color.png` (el dibujo de la página en cada pose), `_lineas.png` (contornos, para ControlNet),' % p['clave'],
                          '`_silueta.png` (máscara), `%s_parado_pieza_*.png` (las piezas del esqueleto), la foto real y un `PEDIDO <pose>` por pose para ChatGPT.' % p['clave'],
                          '**Lo que hay que devolver:** `%s_parado.png`, `%s_echado.png` y `%s_sentado.png` (1024 x 683, fondo transparente) a la Bandeja del Taller.' % (p['clave'], p['clave'], p['clave']), '',
                          '## Prompt en inglés (ComfyUI / Midjourney, pose de pie)', '', '```', data['plantillas']['mascota_prompt_en'].format(**p), '```', '',
                          'Para la pose sentada (DE FRENTE) cambiar el arranque por `a single short-haired cat sitting upright facing the viewer, front view, chest tall, both front legs straight and together, paws on the ground, tail curled on the floor to one side`;',
                          'para la echada, `a single short-haired cat lying down in a loaf, side view, paws tucked under, tail wrapped along the body`.', '',
                          'Negativo: `photo, photorealistic, glossy, text, watermark, multiple cats, cropped, cut off, floor, shadow, background, blurry, extra legs`', '']
                    io.open(os.path.join(d, p['nombre'] + '.md'), 'w', encoding='utf-8').write('\n'.join(md))
            continue
        d = os.path.join(taller, 'Pedidos', fam['carpeta']); os.makedirs(d, exist_ok=True)
        nuevos = set()
        for p in piezas:
            nombre = 'PEDIDO %s - %02d %s.txt' % (fam['singular'], int(p['n']), p['nombre'])
            io.open(os.path.join(d, nombre), 'w', encoding='utf-8').write(texto_pedido(data, fam, p)); nuevos.add(nombre); escritos += 1
        for viejo in os.listdir(d):                       # un pedido de una variante que ya no está en el Excel
            if viejo.startswith('PEDIDO ') and viejo.endswith('.txt') and viejo not in nuevos: os.remove(os.path.join(d, viejo))
    escribir_catalogo_md(data, taller)
    escribir_leeme(data, taller)
    faltan = [f['referencia'] for f in data['familias'] if f.get('referencia') and not os.path.exists(os.path.join(taller, 'Referencias', f['referencia']))]
    if not os.path.exists(os.path.join(taller, 'Referencias', REF_ESTILO)): faltan.append(REF_ESTILO)
    return escritos, faltan

def escribir_catalogo_md(data, taller):
    L = ['# Catálogo de la sala', '',
         'Todo lo que se puede pintar, por familia, con su estado. La fuente de verdad es `catalogo/catalogo.xlsx` en el',
         'proyecto (una fila por variante); este archivo lo escribe `python _tools/catalogo.py`. Cada variante tiene su',
         '`PEDIDO` en `Pedidos/<familia>/` (las mascotas, en `Mascotas/<raza>/`, uno por pose). El PNG que devuelve la IA se',
         'deja en `Bandeja/` y `python _tools/bandeja.py` lo identifica, lo convierte y lo activa en la página.', '']
    for fam in data['familias']:
        piezas = data['piezas'].get(fam['familia'], [])
        hechas = sum(1 for p in piezas if p.get('_hecha'))
        L += ['## %s (%d de %d hechas)' % (fam['nombre'], hechas, len(piezas)), '']
        if fam['postproceso'] == 'mascota':
            L += ['| # | Raza | Carácter | Precio | De pie | Echado | Sentado |', '|---|---|---|---|---|---|---|']
            for p in piezas:
                po = p.get('_poses', {})
                L.append('| %02d | %s | %s | %s | %s | %s | %s |' % (int(p['n']), p['nombre'], p.get('para', ''), precio(p),
                         *(('✔' if po.get(x) else 'pendiente') for x in POSES)))
        else:
            L += ['| # | %s | Para quién / con qué | Precio | Archivo | Estado |' % fam['singular'].capitalize(), '|---|---|---|---|---|---|']
            for p in piezas:
                L.append('| %02d | %s | %s | %s | `%s` | %s |' % (int(p['n']), p['nombre'], p.get('para', ''), precio(p), nombre_archivo(fam, p), '✔ hecha' if p.get('_hecha') else 'PENDIENTE'))
        L.append('')
    if data['temporadas']:
        L += ['## Temporadas (lo que se pone solo con "que cambie con la estación")', '', '| Temporada | Cuándo | Pared | Ventana | Piso |', '|---|---|---|---|---|']
        for t in data['temporadas']:
            cuando = ('%s a %s' % (t['desde'], t['hasta'])) if t.get('desde') else ('meses %s' % t.get('meses', ''))
            L.append('| %s | %s | %s | %s | %s |' % (t.get('nombre', ''), cuando, t.get('pared', ''), t.get('ventana', ''), t.get('piso', '')))
        L.append('')
    io.open(os.path.join(taller, 'CATALOGO.md'), 'w', encoding='utf-8').write('\n'.join(L))

def precio(p):
    v = p.get('precio')
    return 'gratis' if v in ('', None, 0, '0') else str(v)

LEEME_TALLER = """# Taller del libro: todo lo que se pinta con IA para la sala

Una sola carpeta para paredes, ventanas, pisos, sillones, mesas, alfombras, adornos y mascotas.
La lista de lo que existe y lo que falta es `CATALOGO.md` (la fuente de verdad es el Excel
`catalogo/catalogo.xlsx` del proyecto; este Taller lo escribe `python _tools/catalogo.py`).

## Carpetas

- `Pedidos/<familia>/`  un `PEDIDO ... .txt` por variante, listo para pegar en ChatGPT.
- `Mascotas/<raza>/`    por raza: sus bocetos (`<raza>_<pose>_color.png` y compañía), la foto real,
                        un `PEDIDO <pose>` por pose (de pie, echado, sentado) y las ilustraciones ya hechas.
- `Referencias/`        las imágenes que se adjuntan con cada pedido (el boceto de la pieza y
                        `referencia_estilo.png`, el acabado que queremos).
- `Bandeja/`            AQUÍ se dejan los PNG tal como salen de ChatGPT (con el nombre que diga el
                        pedido o con el nombre raro que les pone: da igual).
- `Hechos/`             los originales ya identificados y montados, con su nombre, guardados en WebP
                        SIN pérdida (`pared_rosa.webp`...: píxel a píxel iguales al PNG y la mitad de peso).

## El flujo, paso a paso

1. Abrir ChatGPT en una conversación nueva y abrir el `PEDIDO` de la pieza que se quiera.
2. **Adjuntar las imágenes que dice el principio del pedido** (están en `Referencias/`; las de
   mascotas, en la carpeta de la raza). Casi siempre son dos: el BOCETO de la pieza (cómo va
   compuesta; NO es el acabado, no hay que copiarlo) y `referencia_estilo.png` (ESE es el acabado).
3. **Pegar** lo que va debajo de "PEGAR ESTE TEXTO" y enviar.
   Si responde con texto: `Genera la imagen ahora`.
   Si el fondo sale de color: "el fondo tiene que ser transparente de verdad (PNG con alfa)".
   Si una pared sale con ventana: "quita la ventana, solo el papel tapiz".
4. Descargar el resultado a `Bandeja/`. Se pueden hacer varios seguidos.
5. En el proyecto (`Documents\\libro`):  `python _tools/bandeja.py`
   Hace una hoja de contacto numerada de lo que hay en la Bandeja y dice qué falta de cada familia.
   Después:  `python _tools/bandeja.py 1=pared_rosa 2=ventana_rosa 3=atigrado_echado`
   (el número de la hoja = el nombre que diga el pedido, sin .png). La herramienta convierte cada
   imagen, la deja en `assets/`, mueve el PNG a `Hechos/` (o a la carpeta de la raza) y reescribe
   `catalogo.js`: la pieza aparece en el selector ✎ de la página. Luego commit y push.

## Reglas de los resultados

- Pared y piso: solo textura, de borde a borde, sin marco ni objetos (se recortan según la pantalla).
- Ventana, mesa, alfombra, adornos y mascotas: UNA pieza entera, centrada, con aire alrededor y
  TODO lo demás transparente; sombras solo sobre la propia pieza.
- Sillones: los DOS en una imagen con un hueco vacío claro en medio (se parte por ahí).
- Adornos: de pie, más altos que anchos; caben en un estante entre libros.
- Mascotas: de pie = de perfil caminando a la derecha; echado = hogaza de perfil; sentado = DE FRENTE.
  Primero la de pie; las otras dos adjuntan la de pie para que salga el mismo animal.
- Sin texto, sin marcos, sin bordes blancos.

## Añadir cosas nuevas

- Una variante más (otra pared, otro adorno): una fila en su hoja del Excel y `python _tools/catalogo.py`.
- Una familia nueva (lámparas, cuadros, perros): una fila en la hoja Familias, una hoja con sus
  variantes y una plantilla de pedido en la hoja Plantillas. Si la pieza necesita un trato nuevo en
  la página (dónde se cuelga, cómo se anima), eso sí es código.
"""

def escribir_leeme(data, taller):
    io.open(os.path.join(taller, 'LEEME.md'), 'w', encoding='utf-8').write(LEEME_TALLER)

# ---------------------------------------------------------------- referencias de muebles (desde assets)
def referencias(taller=TALLER):
    from PIL import Image
    fondo = (30, 21, 17, 255); R = os.path.join(taller, 'Referencias'); os.makedirs(R, exist_ok=True)
    def abrir(rel):
        p = os.path.join(RAIZ, rel); return Image.open(p).convert('RGBA') if os.path.exists(p) else None
    def sobre_fondo(piezas, alto, sep=70, margen=50):
        ims = []
        for im in piezas:
            if im is None: continue
            bb = im.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox(); im = im.crop(bb)
            ims.append(im.resize((round(im.width * alto / im.height), alto), Image.LANCZOS))
        if not ims: return None
        W = sum(i.width for i in ims) + sep * (len(ims) - 1) + margen * 2; H = alto + margen * 2
        lienzo = Image.new('RGBA', (W, H), fondo); x = margen
        for im in ims: lienzo.alpha_composite(im, (x, H - margen - im.height)); x += im.width + sep
        return lienzo.convert('RGB')
    for nombre, piezas, alto, sep in (('referencia_sillones.png', ['assets/sillon_rojo.webp', 'assets/sillon_amarillo.webp'], 700, 160),
                                      ('referencia_mesa.png', ['assets/mesa.webp'], 700, 70), ('referencia_alfombra.png', ['assets/alfombra.webp'], 600, 70)):
        im = sobre_fondo([abrir(p) for p in piezas], alto, sep)
        if im: im.save(os.path.join(R, nombre)); print('  ', nombre, im.size)
    cap = os.path.join(RAIZ, '_capturas', 'fondos_defecto_pc.png')
    if os.path.exists(cap): Image.open(cap).crop((0, 0, 232, 650)).save(os.path.join(R, 'referencia_estante.png')); print('   referencia_estante.png')

# ---------------------------------------------------------------- main
def regenerar(taller=TALLER, solo_js=False, data=None):
    """Excel -> json -> catalogo.js (-> Taller). Devuelve (data, avisos)."""
    if data is None:
        if not os.path.exists(XLSX): raise SystemExit('No existe %s: crearlo con --excel-desde-json' % XLSX)
        data = excel_a_json(XLSX)
    escribir_json(data)
    estado(data)
    avisos = escribir_js(data)
    resumen = ['%s %d/%d' % (f['familia'], sum(1 for p in data['piezas'].get(f['familia'], []) if p.get('_hecha')), len(data['piezas'].get(f['familia'], []))) for f in data['familias']]
    print('catalogo.json + catalogo.js:', ', '.join(resumen))
    if not solo_js:
        escritos, faltan = escribir_taller(data, taller)
        print('Taller:', escritos, 'pedidos + CATALOGO.md + LEEME.md en', taller)
        if faltan: avisos.append('faltan referencias en %s/Referencias: %s' % (taller, ', '.join(faltan)))
    for a in avisos: print('AVISO:', a)
    return data, avisos

def pares(lista):
    """['clave=x', 'nombre=Y z'] -> dict (los valores pueden llevar espacios si vienen entre comillas)."""
    d = {}
    for t in lista:
        if '=' not in t: raise SystemExit('Esperaba campo=valor y llegó: %r' % t)
        k, v = t.split('=', 1); d[k.strip()] = v
    return d

def main():
    a = sys.argv[1:]
    taller = a[a.index('--taller') + 1] if '--taller' in a else TALLER
    if '--fila' in a:                                   # python _tools/catalogo.py --fila pared clave=marina nombre="Azul marina" papel="..." ...
        i = a.index('--fila'); fila = anadir_fila(a[i + 1], pares([t for t in a[i + 2:] if '=' in t]))
        print('Fila %d añadida a %s: %s' % (fila['n'], a[i + 1], fila['clave']))
        regenerar(taller); return
    if '--editar' in a:                                 # python _tools/catalogo.py --editar Plantillas mascota_echado texto "..."
        i = a.index('--editar'); editar_celda(a[i + 1], a[i + 2], a[i + 3], a[i + 4]); print('Celda escrita.'); regenerar(taller); return
    if '--familia' in a:                                # python _tools/catalogo.py --familia familia=lampara hoja=Lamparas ... columnas=objeto,luz
        i = a.index('--familia'); cols = nueva_familia(pares([t for t in a[i + 1:] if '=' in t]))
        print('Familia creada con columnas:', ', '.join(list(COMUNES) + cols), '| falta escribir su plantilla en la hoja Plantillas'); regenerar(taller); return
    if '--excel-desde-json' in a:
        data = leer_json(); json_a_excel(data); print('Excel escrito:', XLSX)
        vuelta = excel_a_json(XLSX)
        if json.dumps(vuelta, sort_keys=True, ensure_ascii=False) != json.dumps(json.loads(json.dumps(data)), sort_keys=True, ensure_ascii=False):
            print('AVISO: el Excel no reproduce el json exacto (revisar tipos)')
        return
    if '--referencias' in a:
        referencias(taller); return
    regenerar(taller, solo_js='--solo-js' in a)

if __name__ == '__main__':
    main()
