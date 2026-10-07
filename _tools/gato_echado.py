# -*- coding: utf-8 -*-
"""
PREPARAR LA IMAGEN DE UN GATO ILUSTRADO ECHADO.

Toma la ilustración del gato echado (PNG con fondo transparente, la que devuelve
la IA con el pedido de la carpeta del Escritorio), la recorta al contorno con un
poco de aire, la reduce a 640 px de ancho y la guarda como
assets/gatos/<id>/echado.webp. En libros.js se apunta en su entrada de GATOS:
    echado: "assets/gatos/<id>/echado.webp"
y el gato la muestra cuando duerme (en el suelo o en el sillón) en lugar de las
piezas de pie. No se corta en piezas: respira despacio por CSS.

Uso:  python _tools/gato_echado.py <imagen.png> <id> [--ancho 640]
Necesita Pillow.
"""
import os, sys
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    ruta, gid = sys.argv[1], sys.argv[2]
    ancho = int(sys.argv[sys.argv.index('--ancho') + 1]) if '--ancho' in sys.argv else 640
    im = Image.open(ruta).convert('RGBA')
    bb = im.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
    if not bb:
        sys.exit('La imagen no tiene nada opaco (¿fondo transparente de verdad?).')
    aire = int(.02 * (bb[2] - bb[0]))
    im = im.crop((max(0, bb[0] - aire), max(0, bb[1] - aire), min(im.width, bb[2] + aire), min(im.height, bb[3] + aire)))
    if im.width > ancho:
        im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    salida = os.path.join(RAIZ, 'assets', 'gatos', gid); os.makedirs(salida, exist_ok=True)
    dst = os.path.join(salida, 'echado.webp')
    im.save(dst, quality=90, method=6)
    print('echado.webp', im.size, os.path.getsize(dst) // 1024, 'KB ->', os.path.relpath(dst, RAIZ))
    print('En libros.js, en la entrada "%s" de GATOS:  echado: "assets/gatos/%s/echado.webp"' % (gid, gid))

if __name__ == '__main__':
    main()
