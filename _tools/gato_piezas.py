# -*- coding: utf-8 -*-
"""
CORTAR UN GATO ILUSTRADO EN PIEZAS.

Toma la ilustración de un gato de perfil mirando a la derecha (PNG con fondo
transparente, la que devuelve la IA) y la corta en cinco piezas que el esqueleto
de gatos.js anima por separado: cola, patas traseras, patas delanteras, cuerpo y
cabeza. Los cortes se deducen de la propia silueta (no hace falta que coincida
con la plantilla):

  - patas: desde abajo, la primera fila en que la silueta deja de ser dos bloques
    separados y pasa a ser una sola franja es la panza; por debajo, patas. El hueco
    vacío más ancho entre los bloques separa las traseras de las delanteras.
  - cola: las filas en que el tramo más a la izquierda está separado del cuerpo y es
    fino, más su base (lo que queda a la izquierda de las patas traseras por encima
    de la panza).
  - cabeza: las columnas donde la silueta sube por encima del lomo (orejas y
    frente) marcan el cuello; la cabeza es lo que queda a la derecha del cuello y
    por encima de la barbilla (la fila más baja con tinta a la derecha de las patas
    delanteras).

Cada pieza lleva un solapado hacia su vecina (la cadera bajo el cuerpo, la base de
la cola bajo el cuerpo, el cuello bajo la cabeza) para que al girar no se abran
huecos, y un punto de giro (pivote). Sale:

  assets/gatos/<id>/cola.webp, patas_tras.webp, patas_del.webp, cuerpo.webp, cabeza.webp
  assets/gatos/<id>/piezas.json   (lienzo, caja y pivote de cada pieza, en píxeles del lienzo)
  _capturas/piezas_<id>.png        (el control: las piezas coloreadas y los cortes, para MIRAR)

Uso:  python _tools/gato_piezas.py <imagen.png> <id> [--ancho 640] [--ycut F] [--xsplit F]
                                                   [--xcola F] [--xcuello F] [--ybarbilla F]
      (las F son fracciones 0-1 de la caja de la silueta, por si el automático se equivoca;
       la herramienta imprime las que eligió)
Necesita Pillow y numpy.
"""
import os, sys, json
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def runs(fila, umbral=128, hueco=3):
    """Tramos [ini, fin) con alfa > umbral en una fila, uniendo huecos cortos."""
    on = fila > umbral
    out, i, n = [], 0, len(on)
    while i < n:
        if on[i]:
            j = i
            while j < n and on[j]: j += 1
            if out and i - out[-1][1] <= hueco: out[-1][1] = j
            else: out.append([i, j])
            i = j
        else: i += 1
    return out

def arg(nombre, defecto):
    a = sys.argv
    if nombre in a:
        return float(a[a.index(nombre) + 1])
    return defecto

def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    ruta, gid = sys.argv[1], sys.argv[2]
    ancho_obj = int(arg('--ancho', 640))
    im = Image.open(ruta).convert('RGBA')
    if im.width > ancho_obj:
        im = im.resize((ancho_obj, round(im.height * ancho_obj / im.width)), Image.LANCZOS)
    W, H = im.size
    A = np.array(im)[:, :, 3]
    ys, xs = np.where(A > 16)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    bw, bh = x1 - x0, y1 - y0
    fr = lambda f, eje: int(round((x0 + f * bw) if eje == 'x' else (y0 + f * bh)))

    # ---- patas: la panza es la primera fila desde abajo con un solo tramo que cruza el centro ----
    ycut = None
    centro = (x0 + x1) // 2
    for y in range(y1 - 1, y0, -1):
        r = runs(A[y])
        cruza = [t for t in r if t[0] <= centro <= t[1]]
        if cruza and (cruza[0][1] - cruza[0][0]) > .5 * bw:          # una sola franja ancha: la panza
            ycut = y; break
    if '--ycut' in sys.argv: ycut = fr(arg('--ycut', 0), 'y')
    if ycut is None: ycut = fr(.7, 'y')
    # bloques de patas y el hueco que separa traseras de delanteras
    perfil = (A[ycut + 2:y1] > 128).any(axis=0)
    cols = runs(perfil.astype(np.uint8) * 255, 128, 2)
    cols = [c for c in cols if c[1] - c[0] > .04 * bw]
    if len(cols) >= 2:
        huecos = [(cols[i + 1][0] - cols[i][1], (cols[i][1] + cols[i + 1][0]) // 2) for i in range(len(cols) - 1)]
        xsplit = max(huecos)[1]
    else:
        xsplit = centro
    if '--xsplit' in sys.argv: xsplit = fr(arg('--xsplit', .5), 'x')
    x_tras_izq = cols[0][0] if cols else fr(.2, 'x')
    x_del_der = cols[-1][1] if cols else fr(.8, 'x')

    # ---- cola: tramos izquierdos separados y finos, más la base a la izquierda de las patas traseras ----
    cola = np.zeros_like(A, dtype=bool)
    y_base = None
    for y in range(y0, ycut):
        r = runs(A[y])
        if not r: continue
        t = r[0]
        if len(r) >= 2 and (t[1] - t[0]) < .22 * bw and r[1][0] - t[1] >= 3:
            cola[y, t[0]:t[1]] = True
        elif y_base is None and cola[:y].any() and t[0] < x_tras_izq:
            y_base = y
    if y_base is None: y_base = ycut - int(.15 * bh)
    xcola = fr(arg('--xcola', (x_tras_izq - x0) / bw), 'x') if '--xcola' in sys.argv else x_tras_izq
    cola[y_base:ycut, :xcola] |= A[y_base:ycut, :xcola] > 16
    solape = int(.035 * bw)
    cola_pieza = cola.copy()
    cola_pieza[y_base:ycut, xcola:xcola + solape] |= A[y_base:ycut, xcola:xcola + solape] > 16     # base bajo el cuerpo
    pivote_cola = (xcola, (y_base + ycut) // 2)

    # ---- cabeza: columnas que suben por encima del lomo marcan el cuello ----
    tope = np.full(W, H, dtype=int)
    for x in range(x0, x1):
        col = np.where(A[:, x] > 128)[0]
        if len(col): tope[x] = col.min()
    lomo = int(np.median(tope[fr(.35, 'x'):fr(.6, 'x')]))
    xcuello = None
    for x in range(fr(.5, 'x'), x1):
        if tope[x] < lomo - .06 * bh: xcuello = x; break
    if xcuello is None: xcuello = fr(.68, 'x')
    if '--xcuello' in sys.argv: xcuello = fr(arg('--xcuello', .68), 'x')
    derecha = np.where(A[:, min(x_del_der + int(.02 * bw), x1 - 1):x1] > 128)[0]
    ybarbilla = (derecha.max() if len(derecha) else fr(.55, 'y')) + int(.03 * bh)
    if '--ybarbilla' in sys.argv: ybarbilla = fr(arg('--ybarbilla', .55), 'y')
    ybarbilla = min(ybarbilla, ycut - 1)
    cabeza = np.zeros_like(A, dtype=bool)
    cabeza[:ybarbilla, xcuello:] = A[:ybarbilla, xcuello:] > 16
    cabeza_pieza = cabeza.copy()
    cabeza_pieza[:ybarbilla + int(.02 * bh), xcuello - int(.015 * bw):] |= A[:ybarbilla + int(.02 * bh), xcuello - int(.015 * bw):] > 16
    pivote_cabeza = (xcuello + int(.06 * bw), ybarbilla)

    # ---- patas (con la cadera metida bajo el cuerpo) y cuerpo (todo lo demás, con solapes) ----
    arriba_patas = ycut - int(.08 * bh)
    patas = (A > 16); patas[:arriba_patas, :] = False
    patas &= ~cola & ~cabeza
    tras = patas.copy(); tras[:, xsplit:] = False
    dele = patas.copy(); dele[:, :xsplit] = False
    pivote_tras = ((x_tras_izq + xsplit) // 2, ycut - int(.05 * bh))
    pivote_del = ((xsplit + x_del_der) // 2, ycut - int(.05 * bh))
    cuerpo = (A > 16) & ~cola & ~cabeza
    cuerpo[ycut + int(.03 * bh):, :] = False
    cuerpo[:ybarbilla + int(.03 * bh), xcuello:xcuello + int(.03 * bw)] |= A[:ybarbilla + int(.03 * bh), xcuello:xcuello + int(.03 * bw)] > 16   # cuello bajo la cabeza
    pivote_cuerpo = (x_tras_izq, ycut)

    # ---- guardar las piezas (recortadas a su caja, borde suavizado) ----
    salida = os.path.join(RAIZ, 'assets', 'gatos', gid); os.makedirs(salida, exist_ok=True)
    piezas = [('cola', cola_pieza, pivote_cola, 0), ('patas_tras', tras, pivote_tras, 1), ('patas_del', dele, pivote_del, 2), ('cuerpo', cuerpo, pivote_cuerpo, 3), ('cabeza', cabeza_pieza, pivote_cabeza, 4)]
    meta = { 'v': 1, 'lienzo': [W, H], 'caja': [int(x0), int(y0), int(x1), int(y1)], 'cortes': { 'ycut': int(ycut), 'xsplit': int(xsplit), 'xcola': int(xcola), 'xcuello': int(xcuello), 'ybarbilla': int(ybarbilla) }, 'piezas': {} }
    control = Image.new('RGBA', (W * 2, H), (90, 110, 150, 255))
    control.paste(im, (0, 0), im)
    colores = [(230, 80, 80), (80, 160, 230), (80, 200, 120), (240, 200, 80), (200, 110, 230)]
    for (nombre, mask, piv, z), color in zip(piezas, colores):
        if not mask.any():
            print('AVISO: la pieza', nombre, 'salió vacía'); continue
        m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
        alfa = Image.fromarray(np.minimum(np.array(m), A).astype(np.uint8))
        pieza = im.copy(); pieza.putalpha(alfa)
        bb = alfa.getbbox()
        pieza.crop(bb).save(os.path.join(salida, nombre + '.webp'), quality=90, method=6)
        meta['piezas'][nombre] = { 'x': bb[0], 'y': bb[1], 'w': bb[2] - bb[0], 'h': bb[3] - bb[1], 'pivote': [int(piv[0]), int(piv[1])], 'z': z }
        tinte = Image.new('RGBA', (W, H), color + (150,)); tinte.putalpha(Image.fromarray((mask * 150).astype(np.uint8)))
        control.alpha_composite(tinte, (W, 0))
        print('%-11s caja %4d,%4d %4dx%4d  pivote %d,%d  %d KB' % (nombre, bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1], piv[0], piv[1], os.path.getsize(os.path.join(salida, nombre + '.webp')) // 1024))
    d = ImageDraw.Draw(control)
    for (nombre, mask, piv, z) in piezas:
        d.ellipse([W + piv[0] - 5, piv[1] - 5, W + piv[0] + 5, piv[1] + 5], fill=(255, 255, 255), outline=(0, 0, 0))
    d.line([W + x0, ycut, W + x1, ycut], fill=(255, 255, 255), width=1)
    d.line([W + xsplit, ycut, W + xsplit, y1], fill=(255, 255, 255), width=1)
    d.line([W + xcuello, y0, W + xcuello, ybarbilla], fill=(255, 255, 255), width=1)
    d.line([W + xcuello, ybarbilla, W + x1, ybarbilla], fill=(255, 255, 255), width=1)
    with open(os.path.join(salida, 'piezas.json'), 'w', encoding='utf-8') as fh: json.dump(meta, fh)
    os.makedirs(os.path.join(RAIZ, '_capturas'), exist_ok=True)
    control.save(os.path.join(RAIZ, '_capturas', 'piezas_' + gid + '.png'))
    print('cortes (fracciones de la caja): ycut %.2f  xsplit %.2f  xcola %.2f  xcuello %.2f  ybarbilla %.2f' % ((ycut - y0) / bh, (xsplit - x0) / bw, (xcola - x0) / bw, (xcuello - x0) / bw, (ybarbilla - y0) / bh))
    print('piezas en', os.path.relpath(salida, RAIZ), '· control en _capturas/piezas_%s.png' % gid)

if __name__ == '__main__':
    main()
