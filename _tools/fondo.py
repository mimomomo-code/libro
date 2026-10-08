# -*- coding: utf-8 -*-
"""
PREPARAR UNA IMAGEN DE FONDO DE LA SALA (la pared pintada o el piso).

Toma la imagen que devuelve la IA (PNG o JPG, sin transparencia), la reduce a
1600 px de lado mayor y la guarda como assets/<clave>.webp a calidad 85.
Después, en libros.js, activar la línea de DECORACION:
    pared:          "assets/pared.webp"            (trae pintadas la ventana y las cortinas:
                                                    tapa el ventanal CSS; anclada arriba)
    pared_vertical: "assets/pared_vertical.webp"   (opcional: la variante para el celular
                                                    vertical; sin ella se usa `pared`)
    suelo:          "assets/suelo.webp"            (textura: cubre todo el ancho, centrada)

Uso:  python _tools/fondo.py <imagen> pared|pared_vertical|suelo [--lado 1600]
Necesita Pillow.
"""
import os, sys
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLAVES = ('pared', 'pared_vertical', 'suelo')

def main():
    if len(sys.argv) < 3 or sys.argv[2] not in CLAVES:
        sys.exit(__doc__)
    ruta, clave = sys.argv[1], sys.argv[2]
    lado = int(sys.argv[sys.argv.index('--lado') + 1]) if '--lado' in sys.argv else 1600
    im = Image.open(ruta).convert('RGB')
    if max(im.size) > lado:
        f = lado / max(im.size)
        im = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
    dst = os.path.join(RAIZ, 'assets', clave + '.webp')
    im.save(dst, quality=85, method=6)
    print(clave + '.webp', im.size, os.path.getsize(dst) // 1024, 'KB ->', os.path.relpath(dst, RAIZ))
    print('En libros.js, en DECORACION:  %s: "assets/%s.webp"' % (clave, clave))

if __name__ == '__main__':
    main()
