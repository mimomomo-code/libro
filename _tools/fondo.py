# -*- coding: utf-8 -*-
"""
PREPARAR UNA IMAGEN DE FONDO DE LA SALA (la pared pintada o el piso).

Toma la imagen que devuelve la IA (PNG o JPG, sin transparencia), la reduce a
1600 px de lado mayor y la guarda en WebP a calidad 85:
  - sin variante:  assets/<clave>.webp                 (pared.webp, pared_vertical.webp, suelo.webp)
  - con variante:  assets/fondos/<nombre>.webp         (pared_rosa.webp, pared_rosa_vertical.webp,
                                                        suelo_roble.webp; el catálogo de variantes
                                                        está en OneDrive/Escritorio/Sala del libro)
Después, en libros.js, activar la línea de DECORACION:
    pared:          "assets/pared.webp"            (trae pintadas la ventana y las cortinas:
                                                    tapa el ventanal CSS; anclada arriba)
    pared_vertical: "assets/pared_vertical.webp"   (opcional: la variante para el celular
                                                    vertical; sin ella se usa `pared`)
    suelo:          "assets/suelo.webp"            (textura: cubre todo el ancho, centrada)
(con variantes, apuntar la ruta de assets/fondos/ que imprime la herramienta; el
selector de juegos de pared y piso se programa cuando haya más de uno).

Uso:  python _tools/fondo.py <imagen> pared|pared_vertical|suelo [variante] [--lado 1600]
Necesita Pillow.
"""
import os, sys
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLAVES = ('pared', 'pared_vertical', 'suelo')

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) < 2 or args[1] not in CLAVES:
        sys.exit(__doc__)
    ruta, clave = args[0], args[1]
    variante = args[2] if len(args) > 2 else ''
    lado = int(sys.argv[sys.argv.index('--lado') + 1]) if '--lado' in sys.argv else 1600
    im = Image.open(ruta).convert('RGB')
    if max(im.size) > lado:
        f = lado / max(im.size)
        im = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
    if variante:
        nombre = ('pared_%s_vertical' % variante) if clave == 'pared_vertical' else ('%s_%s' % (clave, variante))
        carpeta = os.path.join(RAIZ, 'assets', 'fondos'); os.makedirs(carpeta, exist_ok=True)
        dst = os.path.join(carpeta, nombre + '.webp')
    else:
        dst = os.path.join(RAIZ, 'assets', clave + '.webp')
    im.save(dst, quality=85, method=6)
    rel = os.path.relpath(dst, RAIZ).replace(os.sep, '/')
    print(os.path.basename(dst), im.size, os.path.getsize(dst) // 1024, 'KB ->', rel)
    print('En libros.js, en DECORACION:  %s: "%s"' % (clave, rel))

if __name__ == '__main__':
    main()
