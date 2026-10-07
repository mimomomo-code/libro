# -*- coding: utf-8 -*-
"""
EL CANDADO (antes candado_album.py).

Lo que los libros con candado no deben enseñar en GitHub viaja cifrado con una
clave derivada del número que abre el libro (PBKDF2-SHA256 + AES-256-GCM, lo
mismo que descifra el navegador en candado.js). Hoy son dos libros y un solo
candado (assets/candado.json: la sal y una prueba de la clave; el número NO
está ahí ni en ningún archivo del repositorio):

  ÁLBUM        privado/album/*.jpg|png|webp   ->  assets/album/<nombre>.bin
  CALENDARIO   privado/calendario/dias.json   ->  assets/calendario/dias.bin

Uso, desde la carpeta del proyecto (python _tools/candado.py ...):
  python _tools/candado.py               cifra lo que falte o esté viejo en los dos libros
  python _tools/candado.py album         solo las fotos del álbum
  python _tools/candado.py calendario    solo los días del calendario

La primera vez pide el número (no se ve al escribirlo) y guarda la clave
derivada en privado/candado.key (fuera de git) para no volver a pedirlo en
esta computadora. Opciones:
  --clave 123456    el número por parámetro (queda en el historial de la consola)
  --sin-recordar    no guardar la clave en privado/candado.key
  --olvidar         borrar privado/candado.key y salir
  --nueva-clave     cambiar el número: se recifra TODO y cada celular tendrá
                    que volver a escribirlo

Para añadir fotos: copiarlas a privado/album/ (nombre corto, sin espacios ni
tildes), correr la herramienta y pegar en libros.js las líneas que imprime.
Para añadir días: editar privado/calendario/dias.json (el formato está en
calendario.js) y correr la herramienta. Después: git add -A, commit y push.
Necesita Pillow y cryptography:  pip install pillow cryptography
"""
import os, sys, json, base64, getpass
from PIL import Image
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRIV = os.path.join(RAIZ, 'privado')
CFG = os.path.join(RAIZ, 'assets', 'candado.json')
CFG_VIEJO = os.path.join(RAIZ, 'assets', 'album', 'candado.json')      # donde vivía hasta el 7 oct 2026
KEY = os.path.join(PRIV, 'candado.key')
LIBROS = os.path.join(RAIZ, 'libros.js')
ALBUM_PRIV, ALBUM_OUT = os.path.join(PRIV, 'album'), os.path.join(RAIZ, 'assets', 'album')
CAL_PRIV, CAL_OUT = os.path.join(PRIV, 'calendario', 'dias.json'), os.path.join(RAIZ, 'assets', 'calendario', 'dias.bin')
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

def mas_nuevo(dst, src):
    return os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src)

def borrar_bins():
    for carpeta in (ALBUM_OUT, os.path.dirname(CAL_OUT)):
        if os.path.isdir(carpeta):
            for f in os.listdir(carpeta):
                if f.endswith('.bin'): os.remove(os.path.join(carpeta, f))

# ---------------------------------------------------------------- la clave
def obtener_clave(args):
    """Devuelve (clave, cfg). Crea o cambia el candado si hace falta."""
    nueva = '--nueva-clave' in args
    numero = args[args.index('--clave') + 1] if '--clave' in args else None
    cfg = None
    if not os.path.exists(CFG) and os.path.exists(CFG_VIEJO):
        os.replace(CFG_VIEJO, CFG); print('candado.json movido de assets/album/ a assets/ (ahora lo comparten el álbum y el calendario)')
    if os.path.exists(CFG) and not nueva:
        with open(CFG, encoding='utf-8') as fh: cfg = json.load(fh)
        prueba = unb64(cfg['prueba'])
        # la clave guardada en esta computadora evita pedir el número
        if numero is None and os.path.exists(KEY):
            try:
                with open(KEY, encoding='ascii') as fh: clave = unb64(fh.read().strip())
            except Exception:
                clave = b''
            if descifra_bien(clave, prueba):
                print('clave tomada de privado/candado.key (no hace falta el número)'); return clave, cfg
            print('privado/candado.key no abre el candado actual: se ignora y se pide el número')
    if numero is None:
        numero = getpass.getpass('Número del candado: ').strip()
    if not numero.isdigit():
        sys.exit('El número solo lleva cifras.')
    if cfg is not None:
        clave = derivar(numero, unb64(cfg['sal']), cfg['iter'])
        if not descifra_bien(clave, unb64(cfg['prueba'])):
            sys.exit('Ese no es el número del candado actual. Si quieres cambiarlo, corre con --nueva-clave.')
    else:
        sal = os.urandom(16)
        clave = derivar(numero, sal, ITER)
        cfg = { 'v': 1, 'sal': b64(sal), 'iter': ITER, 'largo': len(numero), 'prueba': b64(cifrar(clave, b'abierto')) }
        os.makedirs(os.path.dirname(CFG), exist_ok=True)
        with open(CFG, 'w', encoding='utf-8') as fh: json.dump(cfg, fh)
        print('candado.json nuevo' + (' (clave cambiada: se recifra todo)' if nueva else ''))
        borrar_bins()
    if '--sin-recordar' not in args:
        os.makedirs(PRIV, exist_ok=True)
        with open(KEY, 'w', encoding='ascii') as fh: fh.write(b64(clave) + '\n')
        print('clave guardada en privado/candado.key (fuera de git) para no pedir el número la próxima vez; --olvidar la borra')
    return clave, cfg

# ---------------------------------------------------------------- el álbum
def album(clave):
    os.makedirs(ALBUM_PRIV, exist_ok=True); os.makedirs(ALBUM_OUT, exist_ok=True)
    # 1) jpg/png -> webp (si no existe ya un .webp más nuevo)
    for f in sorted(os.listdir(ALBUM_PRIV)):
        base, ext = os.path.splitext(f)
        if ext.lower() not in ('.jpg', '.jpeg', '.png'):
            continue
        src = os.path.join(ALBUM_PRIV, f); dst = os.path.join(ALBUM_PRIV, base + '.webp')
        if mas_nuevo(dst, src):
            continue
        im = Image.open(src).convert('RGB'); im.thumbnail((LADO, LADO), Image.LANCZOS)
        im.save(dst, quality=CALIDAD, method=6)
        print('convertida', f, '->', base + '.webp', im.size, os.path.getsize(dst) // 1024, 'KB')
    fotos = sorted(f for f in os.listdir(ALBUM_PRIV) if f.lower().endswith('.webp'))
    if not fotos:
        print('ÁLBUM: no hay fotos .webp en privado/album/'); return
    # 2) cifrar lo que falte o esté viejo
    hechos = 0
    for f in fotos:
        src = os.path.join(ALBUM_PRIV, f); dst = os.path.join(ALBUM_OUT, os.path.splitext(f)[0] + '.bin')
        if mas_nuevo(dst, src):
            continue
        with open(src, 'rb') as fh: datos = fh.read()
        with open(dst, 'wb') as fh: fh.write(cifrar(clave, datos))
        hechos += 1
        print('cifrada', f, '->', os.path.basename(dst), os.path.getsize(dst) // 1024, 'KB')
    print('ÁLBUM:', hechos, 'fotos cifradas;', len(fotos), 'en el álbum.')
    # 3) avisos: .bin sin foto de origen, y fotos que aún no están en libros.js
    nombres = { os.path.splitext(f)[0] for f in fotos }
    for f in sorted(os.listdir(ALBUM_OUT)):
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

# ---------------------------------------------------------------- el calendario
def revisar_dias(D):
    """Devuelve la lista de problemas del dias.json (vacía si está bien)."""
    malo = []
    if not isinstance(D, dict) or not isinstance(D.get('dias'), list):
        return ['el archivo tiene que ser { "dias": [ ... ] }']
    for i, e in enumerate(D['dias']):
        donde = 'entrada %d' % (i + 1)
        if not isinstance(e, dict) or not e.get('nombre'):
            malo.append(donde + ': falta "nombre"'); continue
        if e.get('fecha'):
            p = str(e['fecha']).split('-')
            if len(p) != 3 or not all(x.isdigit() for x in p):
                malo.append(donde + ' (%s): "fecha" tiene que ser AAAA-MM-DD' % e['nombre'])
        elif not (isinstance(e.get('dia'), int) and 1 <= e['dia'] <= 31 and isinstance(e.get('mes'), int) and 1 <= e['mes'] <= 12):
            malo.append(donde + ' (%s): hacen falta "dia" (1-31) y "mes" (1-12), o una "fecha"' % e['nombre'])
    if sum(1 for e in D['dias'] if isinstance(e, dict) and e.get('inicio')) > 1:
        malo.append('solo una entrada puede llevar "inicio": true')
    return malo

def calendario(clave):
    if not os.path.exists(CAL_PRIV):
        print('CALENDARIO: no existe', os.path.relpath(CAL_PRIV, RAIZ), '(el formato está en calendario.js)'); return
    with open(CAL_PRIV, encoding='utf-8') as fh: texto = fh.read()
    try:
        D = json.loads(texto)
    except ValueError as e:
        sys.exit('CALENDARIO: dias.json no es un JSON válido: %s' % e)
    malo = revisar_dias(D)
    if malo:
        sys.exit('CALENDARIO: dias.json tiene errores:\n  ' + '\n  '.join(malo))
    if mas_nuevo(CAL_OUT, CAL_PRIV) and descifra_bien(clave, open(CAL_OUT, 'rb').read()):
        print('CALENDARIO: dias.bin ya está al día (%d días).' % len(D['dias'])); return
    os.makedirs(os.path.dirname(CAL_OUT), exist_ok=True)
    compacto = json.dumps(D, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    with open(CAL_OUT, 'wb') as fh: fh.write(cifrar(clave, compacto))
    print('CALENDARIO: %d días cifrados -> %s (%d bytes)' % (len(D['dias']), os.path.relpath(CAL_OUT, RAIZ), os.path.getsize(CAL_OUT)))

# ---------------------------------------------------------------- main
def main():
    args = sys.argv[1:]
    if '--olvidar' in args:
        if os.path.exists(KEY): os.remove(KEY); print('privado/candado.key borrado: la próxima vez pedirá el número.')
        else: print('no había clave guardada.')
        return
    que = [a for a in args if not a.startswith('--') and a not in (args[args.index('--clave') + 1] if '--clave' in args else '',)]
    if any(a not in ('album', 'calendario') for a in que):
        sys.exit('Libros válidos: album, calendario (sin nada: los dos).')
    clave, cfg = obtener_clave(args)
    if not que or 'album' in que: album(clave)
    if not que or 'calendario' in que: calendario(clave)
    print('\nListo. Si cambió algo: git add -A && git commit && git push')

if __name__ == '__main__':
    main()
