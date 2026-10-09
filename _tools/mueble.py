# -*- coding: utf-8 -*-
"""
PREPARAR UN MUEBLE O UN ADORNO ILUSTRADO (los pedidos están en OneDrive/Escritorio/Muebles del libro).

Toma la imagen con fondo transparente que devuelve la IA y la deja lista para la página:
  sillones  UNA imagen con los DOS sillones y un hueco vacío en medio: la parte por ese hueco en
            assets/muebles/sillon_<clave>_izq.webp y sillon_<clave>_der.webp (recortados al
            contorno, 1100 px de lado mayor, con alfa) y deja la miniatura de la pareja en
            assets/muebles/mini/sillones_<clave>.webp. Si no encuentra el hueco, --corte 0.5
            (fracción del ancho por donde partir).
  mesa      assets/muebles/mesa_<clave>.webp (+ mini)       recortada al contorno, 1100 px
  alfombra  assets/muebles/alfombra_<clave>.webp (+ mini)   recortada al contorno, 1400 px
  adorno    assets/adornos/<clave>.webp (+ mini en assets/adornos/mini/)   recortado, 600 px de alto
Después, el nombre de la variante tiene que estar en MUEBLES o ADORNOS (libros.js); el selector ✎
la ofrece sola. Las miniaturas de "hoy" (los muebles de DECORACION) se hacen con --minis-hoy.

Uso:  python _tools/mueble.py <imagen.png> sillones|mesa|alfombra|adorno <clave> [--corte 0.5]
      python _tools/mueble.py --minis-hoy
Necesita Pillow.
"""
import os, sys
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIPOS = ('sillones', 'mesa', 'alfombra', 'adorno')

def recortar(im, aire=.02):
    bb = im.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
    if not bb:
        sys.exit('La imagen no tiene nada opaco (¿fondo transparente de verdad?).')
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
    print(os.path.basename(dst), im.size, os.path.getsize(dst) // 1024, 'KB ->', rel)
    return rel

def mini(im, dst, lado=160):
    m = im.copy(); m.thumbnail((lado, lado), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    m.save(dst, quality=80, method=6)
    print('   mini ->', os.path.relpath(dst, RAIZ).replace(os.sep, '/'), m.size)

def hueco_central(im):
    """La columna vacía más ancha cerca del centro (entre el 25 % y el 75 % del ancho)."""
    a = im.getchannel('A')
    w, h = im.size
    ocupada = [False] * w
    px = a.load()
    for x in range(w):
        for y in range(0, h, 2):
            if px[x, y] > 16:
                ocupada[x] = True; break
    mejor, actual = None, None
    for x in range(w + 1):
        libre = x < w and not ocupada[x]
        if libre and actual is None: actual = x
        if (not libre) and actual is not None:
            ini, fin = actual, x
            c = (ini + fin) / 2
            if fin - ini >= w * .015 and w * .25 <= c <= w * .75 and (mejor is None or fin - ini > mejor[1] - mejor[0]):
                mejor = (ini, fin)
            actual = None
    return None if mejor is None else (mejor[0] + mejor[1]) // 2

def minis_hoy():
    def abrir(rel):
        p = os.path.join(RAIZ, rel); return Image.open(p).convert('RGBA') if os.path.exists(p) else None
    r, am = abrir('assets/sillon_rojo.webp'), abrir('assets/sillon_amarillo.webp')
    if r and am:
        alto = 400; sep = 40
        r = recortar(r); am = recortar(am)
        r = r.resize((round(r.width * alto / r.height), alto), Image.LANCZOS); am = am.resize((round(am.width * alto / am.height), alto), Image.LANCZOS)
        lienzo = Image.new('RGBA', (r.width + sep + am.width, alto), (0, 0, 0, 0))
        lienzo.alpha_composite(r, (0, alto - r.height)); lienzo.alpha_composite(am, (r.width + sep, 0))
        mini(lienzo, os.path.join(RAIZ, 'assets', 'muebles', 'mini', 'sillones_hoy.webp'))
    m = abrir('assets/mesa.webp')
    if m: mini(recortar(m), os.path.join(RAIZ, 'assets', 'muebles', 'mini', 'mesa_hoy.webp'))
    al = abrir('assets/alfombra.webp')
    if al: mini(recortar(al), os.path.join(RAIZ, 'assets', 'muebles', 'mini', 'alfombra_hoy.webp'))

def main():
    if '--minis-hoy' in sys.argv:
        minis_hoy(); return
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if '--corte' in sys.argv: args = [a for a in args if a != sys.argv[sys.argv.index('--corte') + 1]]
    if len(args) < 3 or args[1] not in TIPOS:
        sys.exit(__doc__)
    ruta, tipo, clave = args[0], args[1], args[2]
    im = Image.open(ruta).convert('RGBA')
    if tipo == 'sillones':
        corte = int(im.width * float(sys.argv[sys.argv.index('--corte') + 1])) if '--corte' in sys.argv else hueco_central(im)
        if corte is None:
            sys.exit('No encuentro un hueco vacío entre los dos sillones: pásalo con --corte 0.5 (fracción del ancho).')
        izq = encoger(recortar(im.crop((0, 0, corte, im.height))), 1100)
        der = encoger(recortar(im.crop((corte, 0, im.width, im.height))), 1100)
        guardar(izq, os.path.join(RAIZ, 'assets', 'muebles', 'sillon_%s_izq.webp' % clave))
        guardar(der, os.path.join(RAIZ, 'assets', 'muebles', 'sillon_%s_der.webp' % clave))
        mini(recortar(im), os.path.join(RAIZ, 'assets', 'muebles', 'mini', 'sillones_%s.webp' % clave))
        print('En libros.js, en MUEBLES.sillones:  %s: "<nombre>"' % clave)
    elif tipo in ('mesa', 'alfombra'):
        pieza = encoger(recortar(im), 1400 if tipo == 'alfombra' else 1100)
        guardar(pieza, os.path.join(RAIZ, 'assets', 'muebles', '%s_%s.webp' % (tipo, clave)))
        mini(pieza, os.path.join(RAIZ, 'assets', 'muebles', 'mini', '%s_%s.webp' % (tipo, clave)))
        print('En libros.js, en MUEBLES.%s:  %s: "<nombre>"' % ('mesas' if tipo == 'mesa' else 'alfombras', clave))
    else:
        pieza = encoger(recortar(im), 600)
        guardar(pieza, os.path.join(RAIZ, 'assets', 'adornos', '%s.webp' % clave))
        mini(pieza, os.path.join(RAIZ, 'assets', 'adornos', 'mini', '%s.webp' % clave), 120)
        print('En libros.js, en ADORNOS:  { id: "%s", nombre: "...", estante: { lado, fila, col }, ancho: N }' % clave)

if __name__ == '__main__':
    main()
