# -*- coding: utf-8 -*-
"""
LA BANDEJA DE ENTRADA. Los PNG que devuelve la IA (con el nombre que dice el pedido o con el nombre
raro que les pone ChatGPT) se dejan en <Taller del libro>/Bandeja y esta herramienta los identifica,
los convierte y los activa en la página.

  python _tools/bandeja.py
      Lista lo que hay en la Bandeja (número, archivo, tamaño, alfa, hora, qué parece), deja la hoja
      de contacto numerada en Bandeja/_hoja.png (MIRARLA) y dice qué variantes faltan por familia.

  python _tools/bandeja.py 1=pared_rosa 2=ventana_rosa 3=atigrado_echado
      Monta cada imagen: la procesa según su familia (pieza.py) hacia assets/, guarda el original como
      WebP SIN pérdida en Hechos/ (o en Mascotas/<raza>/) con su nombre bueno y borra el PNG, reescribe
      catalogo.js y el Taller (catalogo.py) y deja una tira de control en _capturas/bandeja.png
      (MIRARLA). El nombre es el que dice el pedido en "GUARDAR EL RESULTADO COMO" sin el .png:
      <prefijo>_<clave> o, en mascotas, <raza>_<pose>.
      También vale  pared_rosa=<ruta a un png>  (una imagen que no está en la Bandeja).

  Opciones:  --taller <carpeta>   --corte 0.5 (sillones: por dónde partir)   --sin-mover (deja el PNG)
             --pendientes (solo la lista de lo que falta)
             --pasada-webp (una vez: los PNG originales que ya están en el Taller y en privado/ a WebP sin pérdida)
Necesita Pillow y openpyxl.
"""
import glob, os, re, shutil, sys, time
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import catalogo as C
import pieza as P
RAIZ = C.RAIZ
EXT = ('.png', '.webp', '.jpg', '.jpeg')
try: sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception: pass

def fuente(tam):
    for f in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(f): return ImageFont.truetype(f, tam)
    return ImageFont.load_default()

def a_webp_sin_perdida(src, dst, borrar=True):
    """Guarda src como WebP SIN pérdida (alfa intacto), comprueba píxel a píxel y, si coincide, borra el PNG. None si no coincide."""
    im = Image.open(src); modo = 'RGBA' if im.mode in ('RGBA', 'LA', 'P', 'PA') else 'RGB'
    im = im.convert(modo)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, 'WEBP', lossless=True, method=6, exact=True)       # exact: conserva también el color bajo el alfa 0
    if Image.open(dst).convert(modo).tobytes() != im.tobytes():
        os.remove(dst); return None
    if borrar and os.path.abspath(src) != os.path.abspath(dst): os.remove(src)
    return dst

def pasada_webp(taller):
    """Una vez: los originales PNG del Taller (Hechos/, Referencias/, Mascotas/<raza>_<pose>.png) y de
    privado/gatos/ilustrados/ pasan a WebP sin pérdida. Las plantillas de los gatos (_color, _lineas, _silueta,
    _pieza_*) se quedan en PNG: las genera el código y pesan poco."""
    rutas = []
    for dp, dn, fn in os.walk(os.path.join(taller, 'Hechos')): rutas += [os.path.join(dp, f) for f in fn if f.lower().endswith('.png')]
    rutas += glob.glob(os.path.join(taller, 'Referencias', '*.png'))
    for d in glob.glob(os.path.join(taller, 'Mascotas', '*')):
        for f in os.listdir(d):
            base, ext = os.path.splitext(f)
            if ext.lower() == '.png' and re.match(r'^[a-z0-9]+_(parado|echado|sentado)(_anterior)?$', base): rutas.append(os.path.join(d, f))
    rutas += glob.glob(os.path.join(RAIZ, 'privado', 'gatos', 'ilustrados', '*.png'))
    antes = despues = 0; fallos = []
    for r in rutas:
        antes += os.path.getsize(r); dst = os.path.splitext(r)[0] + '.webp'
        if a_webp_sin_perdida(r, dst): despues += os.path.getsize(dst)
        else: fallos.append(r); despues += os.path.getsize(r)
        print('  ', os.path.relpath(r, taller) if r.startswith(taller) else os.path.relpath(r, RAIZ), '->', os.path.basename(dst) if r not in fallos else 'SE QUEDA PNG')
    print('%d PNG a WebP sin pérdida: %.0f MB -> %.0f MB' % (len(rutas) - len(fallos), antes / 2**20, despues / 2**20))
    for f in fallos: print('  no coincidió píxel a píxel, se deja el PNG:', f)

def mirar(ruta):
    """Qué es la imagen: tamaño, si tiene alfa de verdad, si hay un hueco central (sillones) y una pista."""
    im = Image.open(ruta); w, h = im.size
    alfa = False
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        a = im.convert('RGBA').getchannel('A')
        lo, hi = a.getextrema(); alfa = lo < 16
    hueco = False; lleno = 1.0
    if alfa:
        rgba = im.convert('RGBA')
        bb = rgba.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
        if bb: lleno = (bb[2] - bb[0]) * (bb[3] - bb[1]) / float(w * h)
        chico = rgba.resize((min(w, 512), max(1, round(h * min(w, 512) / w))))
        hueco = P.hueco_central(chico) is not None
    r = w / float(h)
    if not alfa: pista = 'pared o piso' if r > 1.2 else 'sin alfa (pared/piso vertical?)'
    elif hueco and r > 1.2: pista = 'sillones (hueco en medio)'
    elif r < 0.8: pista = 'ventana o adorno'
    elif r > 1.2: pista = 'alfombra o mascota'
    else: pista = 'mesa (o adorno)'
    return dict(ruta=ruta, nombre=os.path.basename(ruta), w=w, h=h, alfa=alfa, hueco=hueco, lleno=lleno, pista=pista, hora=os.path.getmtime(ruta))

def listar(taller):
    b = os.path.join(taller, 'Bandeja')
    os.makedirs(b, exist_ok=True)
    archivos = sorted((os.path.join(b, f) for f in os.listdir(b) if f.lower().endswith(EXT) and not f.startswith('_')), key=os.path.getmtime)
    return [mirar(a) for a in archivos]

def hoja(items, dst, col=4, ancho=340, alto=290):
    f, fp = fuente(15), fuente(20)
    filas = (len(items) + col - 1) // col
    H = Image.new('RGB', (col * ancho, max(1, filas) * alto), (46, 36, 30)); d = ImageDraw.Draw(H)
    for i, it in enumerate(items):
        x0, y0 = (i % col) * ancho, (i // col) * alto
        im = Image.open(it['ruta']).convert('RGBA'); im.thumbnail((ancho - 20, alto - 92), Image.LANCZOS)
        fondo = Image.new('RGBA', im.size, (120, 120, 120, 255)); claro = Image.new('RGBA', (12, 12), (170, 170, 170, 255))
        for y in range(0, im.height, 12):
            for x in range(0, im.width, 12):
                if (x // 12 + y // 12) % 2: fondo.paste(claro, (x, y))
        fondo.alpha_composite(im)
        H.paste(fondo.convert('RGB'), (x0 + 10 + (ancho - 20 - im.width) // 2, y0 + 34))
        d.rectangle((x0 + 6, y0 + 6, x0 + 38, y0 + 30), fill=(220, 180, 60)); d.text((x0 + 12, y0 + 7), str(i + 1), font=fp, fill=(30, 20, 10))
        d.text((x0 + 46, y0 + 10), it['nombre'][:30], font=f, fill=(240, 230, 210))
        d.text((x0 + 10, y0 + alto - 52), '%d x %d   %s   %s' % (it['w'], it['h'], 'con alfa' if it['alfa'] else 'opaca', time.strftime('%d/%m %H:%M', time.localtime(it['hora']))), font=f, fill=(200, 190, 170))
        d.text((x0 + 10, y0 + alto - 30), 'parece: ' + it['pista'], font=f, fill=(220, 180, 60))
    H.save(dst)
    return dst

def pendientes(data):
    out = []
    for fam in data['familias']:
        for p in data['piezas'].get(fam['familia'], []):
            if fam['postproceso'] == 'mascota':
                faltan = [pose for pose in C.POSES if not p.get('_poses', {}).get(pose)]
                if faltan: out.append((fam['nombre'], '%s: %s' % (p['nombre'], ', '.join('%s_%s' % (p['clave'], x) for x in faltan))))
            elif not p.get('_hecha'):
                out.append((fam['nombre'], '%s  (%s)' % (C.nombre_archivo(fam, p)[:-4], p['nombre'])))
    return out

def resolver(token, data):
    """'pared_rosa' -> (familia, variante, None); 'atigrado_echado' -> (familia mascota, raza, pose)."""
    t = token.strip().lower()
    for e in EXT:
        if t.endswith(e): t = t[:-len(e)]
    for fam in data['familias']:
        piezas = data['piezas'].get(fam['familia'], [])
        if fam['postproceso'] == 'mascota':
            if '_' in t:
                clave, pose = t.rsplit('_', 1)
                p = next((x for x in piezas if x['clave'] == clave), None)
                if p and pose in C.POSES: return fam, p, pose
            continue
        pref = fam['prefijo'] + '_'
        if t.startswith(pref):
            p = next((x for x in piezas if x['clave'] == t[len(pref):]), None)
            if p: return fam, p, None
    raise SystemExit('No sé qué es "%s": tiene que ser <prefijo>_<clave> de una fila del Excel (pared_rosa, sillones_azul, adorno_planta) o <raza>_<pose> (atigrado_echado).' % token)

def montar(asignaciones, data, taller, corte=None, mover=True):
    escritos = []
    for ruta, token in asignaciones:
        fam, p, pose = resolver(token, data)
        if fam['postproceso'] == 'mascota' and pose != 'parado' and not p.get('_poses', {}).get('parado'):
            print('AVISO: %s todavía no tiene la pose de pie; la %s entra igual, pero el pedido de la pose adjunta la de pie.' % (p['nombre'], pose))
        print('%s  ->  %s / %s%s' % (os.path.basename(ruta), fam['nombre'], p['nombre'], (' / ' + pose) if pose else ''))
        escritos += P.procesar(fam, p, ruta, pose, corte)
        if not mover: continue
        # el original se guarda en WebP SIN pérdida (píxel a píxel igual, mitad de peso) en Hechos/ o en la carpeta de la raza
        destino = os.path.join(taller, C.carpeta_raza(fam, p)) if fam['postproceso'] == 'mascota' else os.path.join(taller, 'Hechos')
        os.makedirs(destino, exist_ok=True)
        base = os.path.join(destino, C.nombre_archivo(fam, p, pose, 'webp')[:-5])
        for ext in ('.webp', '.png'):                         # la versión anterior (en cualquiera de los dos formatos) no se pisa
            viejo = base + ext
            if os.path.exists(viejo) and os.path.abspath(viejo) != os.path.abspath(ruta):
                shutil.move(viejo, base + '_anterior' + ext); print('   (la versión anterior queda como %s)' % os.path.basename(base + '_anterior' + ext))
        if ruta.lower().endswith('.webp'):
            shutil.move(ruta, base + '.webp'); final = base + '.webp'
        elif a_webp_sin_perdida(ruta, base + '.webp'):
            final = base + '.webp'
        else:
            shutil.move(ruta, base + '.png'); final = base + '.png'; print('   (no coincidió píxel a píxel en WebP sin pérdida: se guarda el PNG)')
        print('   original ->', os.path.relpath(final, taller), '(%d KB)' % (os.path.getsize(final) // 1024))
    return escritos

def main():
    a = sys.argv[1:]
    taller = a[a.index('--taller') + 1] if '--taller' in a else C.TALLER
    corte = a[a.index('--corte') + 1] if '--corte' in a else None
    omitir = {taller, corte}
    tokens = [x for x in a if '=' in x and x not in omitir and not x.startswith('--')]
    if '--pasada-webp' in a: pasada_webp(taller); return
    data = C.estado(C.excel_a_json(C.XLSX))
    if '--pendientes' in a or not tokens:
        items = listar(taller)
        if items and '--pendientes' not in a:
            print('EN LA BANDEJA (%s/Bandeja):' % taller)
            for i, it in enumerate(items, 1):
                print('  %2d  %-40s %5dx%-5d %-6s %s   parece: %s' % (i, it['nombre'][:40], it['w'], it['h'], 'alfa' if it['alfa'] else 'opaca', time.strftime('%d/%m %H:%M', time.localtime(it['hora'])), it['pista']))
            print('  Hoja de contacto (MIRARLA):', hoja(items, os.path.join(taller, 'Bandeja', '_hoja.png')))
        elif '--pendientes' not in a:
            print('La Bandeja está vacía:', os.path.join(taller, 'Bandeja'))
        pend = pendientes(data)
        if pend:
            print('FALTAN (%d):' % len(pend))
            for fam, txt in pend: print('  %-10s %s' % (fam, txt))
        else: print('No falta nada del catálogo.')
        if items: print('Para montar:  python _tools/bandeja.py 1=<nombre del pedido> 2=...   (por ejemplo 1=pared_rosa)')
        return
    items = listar(taller)
    asignaciones = []
    for t in tokens:
        izq, der = t.split('=', 1)
        if izq.isdigit():
            n = int(izq)
            if not (1 <= n <= len(items)): raise SystemExit('No hay imagen %d en la Bandeja (hay %d).' % (n, len(items)))
            asignaciones.append((items[n - 1]['ruta'], der))
        else:
            if not os.path.exists(der): raise SystemExit('No existe %s' % der)
            asignaciones.append((der, izq))
    escritos = montar(asignaciones, data, taller, corte, '--sin-mover' not in a)
    ctrl = P.control(escritos, os.path.join(RAIZ, '_capturas', 'bandeja.png'))
    print('Montados:', len(asignaciones), '| escritos:', ', '.join(escritos))
    if ctrl: print('Control (MIRARLO):', ctrl)
    C.regenerar(taller)
    print('Listo. Falta: mirar el control, abrir la página (selector ✎) y hacer commit + push.')

if __name__ == '__main__':
    main()
