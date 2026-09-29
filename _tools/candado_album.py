# -*- coding: utf-8 -*-
"""
EL CANDADO DEL ÁLBUM.

Las fotos del libro con candado no viajan a GitHub tal cual: se cifran con una
clave derivada del número que abre el libro (PBKDF2-SHA256 + AES-256-GCM, lo
mismo que descifra el navegador en candado.js). El número NO se guarda en el
repositorio ni en este archivo: se escribe al correr la herramienta.

Cómo añadir fotos al álbum:
  1. Copia las fotos nuevas (jpg, png o webp) a privado/album/ (esa carpeta
     no se sube a GitHub). Ponles un nombre corto sin espacios ni tildes.
  2. Desde la carpeta del proyecto:
        python _tools/candado_album.py
     Pide el número (no se ve al escribirlo). Convierte las jpg/png a WebP de
     1280 px, cifra todos los .webp a assets/album/<nombre>.bin y escribe
     assets/album/candado.json (la sal y una prueba de la clave).
  3. Pega en libros.js las líneas que la herramienta imprime al final
     ({ foto: "assets/album/<nombre>.bin", pie: "..." }) y haz commit y push.

Opciones:  --clave 123456   (para no escribirlo a mano)
           --nueva-clave    cambia el número del candado: se recifra TODO y cada
                            celular tendrá que volver a escribirlo.
Necesita Pillow y cryptography:  pip install pillow cryptography
"""
import os, sys, json, base64, getpass, re
from PIL import Image
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRIV = os.path.join(RAIZ, 'privado', 'album')
OUT = os.path.join(RAIZ, 'assets', 'album')
CFG = os.path.join(OUT, 'candado.json')
LIBROS = os.path.join(RAIZ, 'libros.js')
ITER = 250000          # vueltas de PBKDF2: ~medio segundo en un celular, y cada intento a ciegas cuesta lo mismo
LADO = 1280            # lado mayor de las fotos
CALIDAD = 82

b64 = lambda b: base64.b64encode(b).decode('ascii')
unb64 = lambda s: base64.b64decode(s)

def derivar(numero, sal, iteraciones):
    return PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=sal, iterations=iteraciones).derive(numero.encode('utf-8'))

def cifrar(clave, datos):
    iv = os.urandom(12)
    return iv + AESGCM(clave).encrypt(iv, datos, None)

def descifra_bien(clave, blob):
    try:
        AESGCM(clave).decrypt(blob[:12], blob[12:], None); return True
    except Exception:
        return False

def main():
    args = sys.argv[1:]
    nueva = '--nueva-clave' in args
    numero = None
    if '--clave' in args:
        numero = args[args.index('--clave') + 1]
    os.makedirs(PRIV, exist_ok=True); os.makedirs(OUT, exist_ok=True)

    # 1) jpg/png -> webp (si no existe ya un .webp más nuevo)
    for f in sorted(os.listdir(PRIV)):
        base, ext = os.path.splitext(f)
        if ext.lower() not in ('.jpg', '.jpeg', '.png'):
            continue
        src = os.path.join(PRIV, f); dst = os.path.join(PRIV, base + '.webp')
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
            continue
        im = Image.open(src).convert('RGB'); im.thumbnail((LADO, LADO), Image.LANCZOS)
        im.save(dst, quality=CALIDAD, method=6)
        print('convertida', f, '->', base + '.webp', im.size, os.path.getsize(dst) // 1024, 'KB')

    fotos = sorted(f for f in os.listdir(PRIV) if f.lower().endswith('.webp'))
    if not fotos:
        print('No hay fotos .webp en', PRIV); return

    # 2) el número y la clave
    if numero is None:
        numero = getpass.getpass('Número del candado: ').strip()
    if not numero.isdigit():
        print('El número solo lleva cifras.'); return
    cfg = None
    if os.path.exists(CFG) and not nueva:
        with open(CFG, encoding='utf-8') as fh: cfg = json.load(fh)
        clave = derivar(numero, unb64(cfg['sal']), cfg['iter'])
        if not descifra_bien(clave, unb64(cfg['prueba'])):
            print('Ese no es el número del candado actual. Si quieres cambiarlo, corre con --nueva-clave.'); return
    else:
        sal = os.urandom(16)
        clave = derivar(numero, sal, ITER)
        cfg = { 'v': 1, 'sal': b64(sal), 'iter': ITER, 'largo': len(numero), 'prueba': b64(cifrar(clave, b'abierto')) }
        with open(CFG, 'w', encoding='utf-8') as fh: json.dump(cfg, fh)
        print('candado.json nuevo' + (' (clave cambiada: se recifra todo)' if nueva else ''))
        for f in os.listdir(OUT):
            if f.endswith('.bin'): os.remove(os.path.join(OUT, f))

    # 3) cifrar lo que falte o esté viejo
    hechos = 0
    for f in fotos:
        src = os.path.join(PRIV, f); dst = os.path.join(OUT, os.path.splitext(f)[0] + '.bin')
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
            continue
        with open(src, 'rb') as fh: datos = fh.read()
        with open(dst, 'wb') as fh: fh.write(cifrar(clave, datos))
        hechos += 1
        print('cifrada', f, '->', os.path.basename(dst), os.path.getsize(dst) // 1024, 'KB')
    print(hechos, 'fotos cifradas;', len(fotos), 'en el álbum.')

    # 4) avisos: .bin sin foto de origen, y fotos que aún no están en libros.js
    nombres = { os.path.splitext(f)[0] for f in fotos }
    for f in sorted(os.listdir(OUT)):
        if f.endswith('.bin') and os.path.splitext(f)[0] not in nombres:
            print('SOBRA en assets/album (no tiene foto en privado/album):', f)
    try:
        with open(LIBROS, encoding='utf-8') as fh: texto = fh.read()
    except OSError:
        texto = ''
    faltan = [n for n in sorted(nombres) if ('assets/album/' + n + '.bin') not in texto]
    if faltan:
        print('\nFaltan en libros.js (pégalas en `paginas` del álbum, en el orden que quieras):')
        for n in faltan:
            print('      { foto: "assets/album/%s.bin" },' % n)

if __name__ == '__main__':
    main()
