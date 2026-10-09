# -*- coding: utf-8 -*-
"""
PREPARAR UNA PIEZA ILUSTRADA PARA LA PÁGINA: lo común a todas las familias (recortar al contorno,
encoger, guardar en WebP, miniatura, partir la pareja de sillones por el hueco del medio, cortar un
gato en piezas o guardar una pose entera). Qué se hace con cada familia lo dice la hoja Familias del
Excel (postproceso: tapiz | recortar | partir | mascota; destino, asset, lado_max, mini).

Normalmente la llama _tools/bandeja.py. Uso directo:
  python _tools/pieza.py <imagen.png> <familia> <clave> [parado|echado|sentado] [--corte 0.5]
  python _tools/pieza.py --minis-hoy      las miniaturas del selector para los muebles de DECORACION
Necesita Pillow (y numpy para las mascotas de pie, vía gato_piezas.py).
"""
import os, shutil, subprocess, sys
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
try: sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception: pass

def recortar(im, aire=.02):
    """Recorta al contorno del alfa con un poco de aire."""
    bb = im.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
    if not bb: raise SystemExit('La imagen no tiene nada opaco (¿fondo transparente de verdad?).')
    a = int(aire * (bb[2] - bb[0]))
    return im.crop((max(0, bb[0] - a), max(0, bb[1] - a), min(im.width, bb[2] + a), min(im.height, bb[3] + a)))

def encoger(im, lado):
    if max(im.size) > lado:
        f = lado / max(im.size)
        im = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
    return im

def guardar(im, dst, calidad=85):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, quality=calidad, method=6)
    rel = os.path.relpath(dst, RAIZ).replace(os.sep, '/')
    print('  ', os.path.basename(dst), im.size, os.path.getsize(dst) // 1024, 'KB ->', rel)
    return rel

def mini(im, dst, lado=160):
    m = im.copy(); m.thumbnail((lado, lado), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    m.save(dst, quality=80, method=6)
    print('      mini ->', os.path.relpath(dst, RAIZ).replace(os.sep, '/'), m.size)

def hueco_central(im):
    """La columna vacía más ancha cerca del centro (entre el 25 % y el 75 % del ancho); None si no hay."""
    a = im.getchannel('A'); w, h = im.size; px = a.load()
    ocupada = [False] * w
    for x in range(w):
        for y in range(0, h, 2):
            if px[x, y] > 16: ocupada[x] = True; break
    mejor, actual = None, None
    for x in range(w + 1):
        libre = x < w and not ocupada[x]
        if libre and actual is None: actual = x
        if (not libre) and actual is not None:
            ini, fin = actual, x; c = (ini + fin) / 2
            if fin - ini >= w * .004 and w * .25 <= c <= w * .75 and (mejor is None or fin - ini > mejor[1] - mejor[0]): mejor = (ini, fin)
            actual = None
    return None if mejor is None else (mejor[0] + mejor[1]) // 2

def procesar(fam, p, ruta, pose=None, corte=None):
    """fam: la fila de Familias; p: la fila de la variante; ruta: el PNG de la IA. Devuelve las rutas escritas (relativas al repo)."""
    post, clave = fam['postproceso'], p['clave']
    destino = os.path.join(RAIZ, fam['destino'].format(clave=clave))
    archivos = [a.strip().format(clave=clave) for a in str(fam['asset']).split(',') if a.strip()]
    lado = int(fam.get('lado_max') or 1600); tam_mini = int(fam.get('mini') or 0)
    nombre_mini = str(fam['mini_asset']).format(clave=clave) if fam.get('mini_asset') else None
    escritos = []
    if post == 'tapiz':                                   # pared, piso: sin alfa, de borde a borde
        im = encoger(Image.open(ruta).convert('RGB'), lado)
        escritos.append(guardar(im, os.path.join(destino, archivos[0])))
        if tam_mini: mini(im, os.path.join(destino, 'mini', nombre_mini), tam_mini)
    elif post == 'recortar':                              # ventana, mesa, alfombra, adorno: una pieza con alfa
        im = encoger(recortar(Image.open(ruta).convert('RGBA')), lado)
        escritos.append(guardar(im, os.path.join(destino, archivos[0])))
        if tam_mini: mini(im, os.path.join(destino, 'mini', nombre_mini), tam_mini)
    elif post == 'partir':                                # sillones: los dos en una imagen con hueco en medio
        im = Image.open(ruta).convert('RGBA')
        x = int(im.width * float(corte)) if corte else hueco_central(im)
        if x is None: raise SystemExit('No encuentro un hueco vacío entre los dos sillones: pásalo con --corte 0.5 (fracción del ancho).')
        izq = encoger(recortar(im.crop((0, 0, x, im.height))), lado); der = encoger(recortar(im.crop((x, 0, im.width, im.height))), lado)
        escritos.append(guardar(izq, os.path.join(destino, archivos[0]))); escritos.append(guardar(der, os.path.join(destino, archivos[1])))
        if tam_mini: mini(recortar(im), os.path.join(destino, 'mini', nombre_mini), tam_mini)
    elif post == 'mascota':                               # de pie: en piezas (gato_piezas.py); echado/sentado: entera
        pose = pose or 'parado'
        os.makedirs(destino, exist_ok=True)
        if pose == 'parado':
            r = subprocess.run([sys.executable, os.path.join(RAIZ, '_tools', 'gato_piezas.py'), ruta, clave], cwd=RAIZ)
            if r.returncode: raise SystemExit('gato_piezas.py no pudo cortar la imagen (ver arriba; admite --ycut --xsplit... a mano).')
            escritos.append(fam['destino'].format(clave=clave) + '/piezas.json')
            print('   MIRAR el control de las piezas: _capturas/piezas_%s.png' % clave)
        else:
            im = encoger(recortar(Image.open(ruta).convert('RGBA')), min(lado, 640))
            escritos.append(guardar(im, os.path.join(destino, pose + '.webp'), 90))
        priv = os.path.join(RAIZ, 'privado', 'gatos', 'ilustrados'); os.makedirs(priv, exist_ok=True)      # el original, fuera de git, sin pérdida
        Image.open(ruta).convert('RGBA').save(os.path.join(priv, '%s_%s.webp' % (clave, pose)), 'WEBP', lossless=True, method=6, exact=True)
    else:
        raise SystemExit('postproceso desconocido en la hoja Familias: %r' % post)
    return escritos

def control(rutas, dst, alto=260):
    """Una tira con las piezas recién montadas, para MIRARLAS (fondo a cuadros bajo el alfa)."""
    ims = []
    for rel in rutas:
        p = os.path.join(RAIZ, rel)
        if rel.endswith('.json'):                        # un gato en piezas: su control ya lo dejó gato_piezas.py
            c = os.path.join(RAIZ, '_capturas', 'piezas_' + os.path.basename(os.path.dirname(rel)) + '.png')
            if not os.path.exists(c): continue
            p = c
        if not os.path.exists(p): continue
        im = Image.open(p).convert('RGBA')
        im = im.resize((max(1, round(im.width * alto / im.height)), alto), Image.LANCZOS)
        cuadros = Image.new('RGBA', im.size, (150, 150, 150, 255))
        claro = Image.new('RGBA', (16, 16), (200, 200, 200, 255))
        for y in range(0, im.height, 16):
            for x in range(0, im.width, 16):
                if (x // 16 + y // 16) % 2: cuadros.paste(claro, (x, y))
        cuadros.alpha_composite(im); ims.append(cuadros)
    if not ims: return None
    sep = 12; W = sum(i.width for i in ims) + sep * (len(ims) + 1); H = alto + 2 * sep
    tira = Image.new('RGB', (W, H), (40, 30, 25)); x = sep
    for im in ims: tira.paste(im.convert('RGB'), (x, sep)); x += im.width + sep
    os.makedirs(os.path.dirname(dst), exist_ok=True); tira.save(dst)
    return dst

def minis_hoy():
    """Las miniaturas del selector para los muebles de DECORACION (los "de hoy", que no están en el catálogo)."""
    def abrir(rel):
        p = os.path.join(RAIZ, rel); return Image.open(p).convert('RGBA') if os.path.exists(p) else None
    r, am = abrir('assets/sillon_rojo.webp'), abrir('assets/sillon_amarillo.webp')
    if r and am:
        alto, sep = 400, 40; r, am = recortar(r), recortar(am)
        r = r.resize((round(r.width * alto / r.height), alto), Image.LANCZOS); am = am.resize((round(am.width * alto / am.height), alto), Image.LANCZOS)
        lienzo = Image.new('RGBA', (r.width + sep + am.width, alto), (0, 0, 0, 0))
        lienzo.alpha_composite(r, (0, alto - r.height)); lienzo.alpha_composite(am, (r.width + sep, 0))
        mini(lienzo, os.path.join(RAIZ, 'assets', 'muebles', 'mini', 'sillones_hoy.webp'))
    for rel, nombre in (('assets/mesa.webp', 'mesa_hoy.webp'), ('assets/alfombra.webp', 'alfombra_hoy.webp')):
        im = abrir(rel)
        if im: mini(recortar(im), os.path.join(RAIZ, 'assets', 'muebles', 'mini', nombre))

def main():
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import catalogo as C
    if '--minis-hoy' in sys.argv: minis_hoy(); return
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    corte = sys.argv[sys.argv.index('--corte') + 1] if '--corte' in sys.argv else None
    if corte: a = [x for x in a if x != corte]
    if len(a) < 3: sys.exit(__doc__)
    data = C.estado(C.excel_a_json(C.XLSX))
    fam = C.familia(data, a[1])
    if not fam: sys.exit('Familia desconocida: %s (las de la hoja Familias: %s)' % (a[1], ', '.join(f['familia'] for f in data['familias'])))
    p = next((x for x in data['piezas'][fam['familia']] if x['clave'] == a[2]), None)
    if not p: sys.exit('La clave %s no está en la hoja %s del Excel' % (a[2], fam['hoja']))
    escritos = procesar(fam, p, a[0], a[3] if len(a) > 3 else None, corte)
    print('Escritos:', ', '.join(escritos))

if __name__ == '__main__':
    main()
