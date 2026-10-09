# -*- coding: utf-8 -*-
"""
PREPARAR UNA IMAGEN DE FONDO DE LA SALA (la pared pintada o el piso).

Toma la imagen que devuelve la IA y la guarda en WebP a calidad 85:
  - pared / pared_vertical / suelo: sin transparencia, reducida a 1600 px de lado mayor.
  - ventanal: la ventana con sus cortinas, UNA pieza con fondo transparente; se recorta al
    contorno (alfa) con un poco de aire, se reduce a 1400 px de lado mayor y conserva el alfa.
  - sin variante:  assets/<clave>.webp                 (pared.webp, ventanal.webp, suelo.webp)
  - con variante:  assets/fondos/<nombre>.webp         (pared_rosa.webp, ventana_rosa.webp,
                                                        suelo_roble.webp, pared_rosa_vertical.webp;
                                                        el catálogo está en OneDrive/Escritorio/Sala del libro)
Después, en libros.js, activar la línea de DECORACION que imprime la herramienta:
    pared:          solo papel tapiz con zócalo, sin ventana (anclada abajo)
    ventanal:       la ventana con cortinas (sustituye al ventanal CSS; la caja toma su proporción)
    suelo:          textura: cubre todo el ancho, centrada
    pared_vertical: opcional, otra pared en 2:3 solo para el celular vertical
(el selector de juegos de pared, ventana y piso se programa cuando haya más de uno).

Uso:  python _tools/fondo.py <imagen> pared|ventanal|suelo|pared_vertical [variante] [--lado N]
Necesita Pillow.
"""
import os, sys
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLAVES = ('pared', 'pared_vertical', 'suelo', 'ventanal')

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if '--lado' in sys.argv: args = [a for a in args if a != sys.argv[sys.argv.index('--lado') + 1]]
    if len(args) < 2 or args[1] not in CLAVES:
        sys.exit(__doc__)
    ruta, clave = args[0], args[1]
    variante = args[2] if len(args) > 2 else ''
    alfa = clave == 'ventanal'
    lado = int(sys.argv[sys.argv.index('--lado') + 1]) if '--lado' in sys.argv else (1400 if alfa else 1600)
    im = Image.open(ruta).convert('RGBA' if alfa else 'RGB')
    if alfa:
        bb = im.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
        if not bb:
            sys.exit('La imagen no tiene nada opaco (¿fondo transparente de verdad?).')
        aire = int(.02 * (bb[2] - bb[0]))
        im = im.crop((max(0, bb[0] - aire), max(0, bb[1] - aire), min(im.width, bb[2] + aire), min(im.height, bb[3] + aire)))
    if max(im.size) > lado:
        f = lado / max(im.size)
        im = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
    if variante:
        nombre = ('pared_%s_vertical' % variante) if clave == 'pared_vertical' else ('%s_%s' % ('ventana' if alfa else clave, variante))
        carpeta = os.path.join(RAIZ, 'assets', 'fondos'); os.makedirs(carpeta, exist_ok=True)
        dst = os.path.join(carpeta, nombre + '.webp')
    else:
        dst = os.path.join(RAIZ, 'assets', clave + '.webp')
    im.save(dst, quality=85, method=6)
    rel = os.path.relpath(dst, RAIZ).replace(os.sep, '/')
    print(os.path.basename(dst), im.size, os.path.getsize(dst) // 1024, 'KB ->', rel)
    if variante:
        # la miniatura para el selector de la página (assets/fondos/mini/<nombre>.webp, 160 px de lado mayor)
        mini = im.copy(); mini.thumbnail((160, 160), Image.LANCZOS)
        carpeta_mini = os.path.join(RAIZ, 'assets', 'fondos', 'mini'); os.makedirs(carpeta_mini, exist_ok=True)
        mini.save(os.path.join(carpeta_mini, os.path.basename(dst)), quality=80, method=6)
        print('   mini ->', 'assets/fondos/mini/' + os.path.basename(dst), mini.size)
        print('En libros.js, en FONDOS.%s:  %s: "%s"' % ({'pared': 'paredes', 'ventanal': 'ventanas', 'suelo': 'pisos'}.get(clave, clave), variante, rel))
    else:
        print('En libros.js, en DECORACION:  %s: "%s"' % (clave, rel))

if __name__ == '__main__':
    main()
