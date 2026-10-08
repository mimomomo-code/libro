# -*- coding: utf-8 -*-
"""
PREPARAR LA IMAGEN DE UN GATO ILUSTRADO EN UNA POSE ENTERA (echado o sentado).

Toma la ilustración del gato en esa pose (PNG con fondo transparente, la que
devuelve la IA con el PEDIDO de la carpeta del Escritorio), la recorta al
contorno con un poco de aire, la reduce a 640 px de ancho y la guarda como
assets/gatos/<id>/<pose>.webp. En libros.js se apunta en su entrada de GATOS:
    echado:  "assets/gatos/<id>/echado.webp"
    sentado: "assets/gatos/<id>/sentado.webp"
y el gato la muestra en esa pose (en el suelo o en el sillón) en lugar de las
piezas de pie. No se corta en piezas: respira (y el sentado cabecea) por CSS.

Uso:  python _tools/gato_pose.py <imagen.png> <id> echado|sentado [--ancho 640]
Necesita Pillow.
"""
import os, sys
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSES = ('echado', 'sentado')

def main():
    if len(sys.argv) < 4 or sys.argv[3] not in POSES:
        sys.exit(__doc__)
    ruta, gid, pose = sys.argv[1], sys.argv[2], sys.argv[3]
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
    dst = os.path.join(salida, pose + '.webp')
    im.save(dst, quality=90, method=6)
    print(pose + '.webp', im.size, os.path.getsize(dst) // 1024, 'KB ->', os.path.relpath(dst, RAIZ))
    print('En libros.js, en la entrada "%s" de GATOS:  %s: "assets/gatos/%s/%s.webp"' % (gid, pose, gid, pose))

if __name__ == '__main__':
    main()
