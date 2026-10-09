# -*- coding: utf-8 -*-
"""
EL PRODUCTO (bookscat). La fábrica (este repo) es la sala de UNA pareja: tiene el poema, las notas,
los dibujos, las fotos y los días de verdad. El producto es OTRO repo (DYBITSOLUTIONS/bookscat,
privado) con TODO lo demás: el código de la sala, el catálogo (Excel, herramientas, skills), los
gatos por raza y los cinco tipos de libro con contenido DE MUESTRA, para que cada pareja escriba
los suyos. Lo personal no viaja: ni poemas, ni notas, ni fotos, ni fechas, ni nombres.

  python _tools/producto.py                 copia + sustituciones + candado de muestra + guardia + commit
  python _tools/producto.py --push          y además push (añade el remoto de bookscat si falta)
  python _tools/producto.py --ver           solo lista lo que copiaría, lo que sustituye y lo que borraría
  python _tools/producto.py --destino <carpeta>    otra carpeta (por defecto Documents/bookscat)

Qué va: todo lo que git versiona aquí (git ls-files), salvo poema.js, assets/suenos/, assets/album/,
assets/calendario/, assets/candado.json, esta herramienta y su carpeta _tools/producto/. En su lugar:
un poema de muestra (_tools/producto/poema.js), tres fotos de muestra dibujadas con Pillow y unos
días de muestra (_tools/producto/dias_muestra.json), cifrados con un candado NUEVO (sal propia) cuyo número
es NUMERO_MUESTRA, con el propio _tools/candado.py del producto. Las sustituciones de texto
(SUSTITUCIONES) cambian los tramos personales de libros.js, README.md, PROMPTS.md, girasoles.js,
calendario.js, publicar.py y las skills; cada tramo tiene que aparecer EXACTAMENTE una vez, si la
fábrica cambió y ya no está, la herramienta para y lo dice (hay que actualizar la tabla).
LA GUARDIA: antes del commit se leen TODOS los archivos que viajarían (git ls-files del producto,
el Excel por dentro también) buscando PROHIBIDO (nombres, fechas, frases, la sal del candado real);
si algo aparece, no hay commit.
"""
import io, json, os, re, shutil, subprocess, sys, time, zipfile

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
PLANTILLAS = os.path.join(AQUI, 'producto')
DESTINO = os.path.join(os.path.dirname(RAIZ), 'bookscat')
REMOTO = 'https://github.com/DYBITSOLUTIONS/bookscat.git'
NUMERO_MUESTRA = '123456'
EXCLUIDOS = ('poema.js', 'assets/suenos/', 'assets/album/', 'assets/calendario/', 'assets/candado.json',
             '_tools/producto.py', '_tools/producto/', '.claude/skills/libro-producto/')
FOTOS_MUESTRA = ('muestra_1', 'muestra_2', 'muestra_3')
GENERADOS = ('poema.js', 'assets/candado.json', 'assets/calendario/dias.bin') + tuple('assets/album/%s.bin' % f for f in FOTOS_MUESTRA)
TEXTO = ('.js', '.html', '.md', '.py', '.json', '.txt', '.csv', '.yml', '.yaml', '.gitignore', '.gitattributes', '.nojekyll', '.sh')
try: sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception: pass

# ---------------------------------------------------------------- lo prohibido
# Expresiones que NO pueden aparecer en ningún archivo del producto (texto y Excel). Se añade en
# marcha la sal del candado real. Si una palabra corriente de aquí entra algún día de forma legítima,
# quitarla de la lista a conciencia.
PROHIBIDO = [
    r'Karen', r'Maquera', r'Jhuliana', r'Karencito', r'\bElma\b', r'\bChunchun\b', r'\bMia\b',
    r'Ascencio', r'Bastian', r'Me encantas', r'videollamada', r'Roblox', r'pasarela',
    r'21 Sep', r'2026-10-11', r'11 de octubre', r'Empezamos a salir', r'autitos', r'flores amarillas',
    r'mimomomo', r'añadamos', r'muchichi', r'ojala algun', r'cita_\d', r'comic_\d',
    r'assets/suenos/(casa|jardin|animales|vista|yo_y_tu|hijos)', r'dibujo sueño',
]
RUTAS_PROHIBIDAS = [r'^privado/', r'^assets/suenos/', r'(^|/)dias\.json$', r'(^|/)candado\.key$', r'^_tools/producto']
BINS_PERMITIDOS = set(g for g in GENERADOS if g.endswith('.bin'))

# ---------------------------------------------------------------- las sustituciones
README_INTRO_VIEJO = """# Libro

Una sala de lectura en el navegador: dos librerías, una ventana con la luna,
dos sillones y una mesa. Los libros se toman de la librería, se abren en la
mesa y se devuelven arrastrándolos. Pensado para verse desde el celular.

**Verlo en línea:** https://mimomomo-code.github.io/libro/
"""
README_INTRO_NUEVO = """# Bookscat

Una sala de lectura en el navegador: dos librerías, una ventana con la luna,
dos sillones y una mesa. Los libros se toman de la librería, se abren en la
mesa y se devuelven arrastrándolos. Pensado para verse desde el celular.

Este repositorio es el **producto**: todo el código de la sala, el catálogo
(el Excel, las herramientas y las skills), los gatos por raza y los **cinco
tipos de libro** con contenido de muestra. Cada pareja escribirá sus propios
libros (el poema, las notas de los girasoles, los sueños, el álbum y los días
importantes) y elegirá sus mascotas, fondos y muebles; aquí no vive el
contenido de nadie.

## Los libros de muestra

- El poema de `poema.js`, las notas del libro **Girasoles**, las hojas de
  **Sueños**, las tres fotos del **Álbum de fotos** y los días del calendario
  **Días importantes** son texto e imágenes de relleno: se cambian como dice
  la sección de cada uno.
- El candado del álbum y del calendario abre con el número de muestra
  **123456** (`index.html?abrir=album&clave=123456`, servido por http, lo
  prueba). Las fotos en claro y el `dias.json` de muestra viven en `privado/`
  (fuera de git). Para poner los de verdad: fotos a `privado/album/`, días a
  `privado/calendario/dias.json` y `python _tools/candado.py --nueva-clave`
  con un número nuevo (se recifra todo con una sal nueva).
"""
README_GATOS_VIEJO = """Cuatro gatos viven en la sala, dibujados por código (`gatos.js`) a partir de
las fotos de los de verdad: **Karencito**, el atigrado (gris-marrón de rayas
marcadas y panza clara); **Elma**, la carey (brindada, con su mancha naranja
en la cara); **Mia**, la tricolor (blanca con manchas negras y naranjas en el
lomo), y **Chunchun**, la blanca con café (la gorrita partida por una raya
blanca, tres lunares y la cola café). Al tocar a uno, su nombre aparece un
momento sobre su cabeza."""
README_GATOS_NUEVO = """Cuatro gatos viven en la sala, dibujados por código (`gatos.js`): cuatro
razas del catálogo, el **atigrado** (gris-marrón de rayas marcadas y panza
clara), la **carey** (brindada, con su mancha naranja en la cara), la
**tricolor** (blanca con manchas negras y naranjas en el lomo) y la **blanca
con café** (la gorrita partida por una raya blanca, tres lunares y la cola
café), con los nombres de muestra de `MASCOTAS`. Al tocar a uno, su nombre
aparece un momento sobre su cabeza."""
README_ALBUMES_VIEJO = """  Así están hechos **Sueños** (los dibujos de Paint, un sueño por página y la
  hoja en blanco "añadamos mas sueños juntos") y **Álbum de fotos** (una foto
  por plana: la primera cita en videollamada, la primera pasarela y el intento
  de cómic; el pie va en la primera foto de cada tanda). `lomo` da un rótulo"""
README_ALBUMES_NUEVO = """  Así están hechos **Sueños** (de muestra, hojas en blanco con una frase
  arriba, un sueño por página; con dibujos sería `{ dibujo: "..." }`) y
  **Álbum de fotos** (una foto por plana, aquí tres de muestra; el pie va en
  la primera foto de cada tanda). `lomo` da un rótulo"""

README_PRODUCTO_VIEJO = """- **El producto (bookscat).** La sala también será un producto para otras
  parejas, y vive en un tercer repo, privado, de la empresa
  (`DYBITSOLUTIONS/bookscat`, carpeta `Documents/bookscat`): todo lo de aquí
  (código, Excel, herramientas, skills, gatos por raza) menos lo personal.
  `python _tools/producto.py` lo genera en espejo: deja fuera `poema.js`, los
  dibujos de Sueños, las fotos y los días cifrados y el candado real; pone en
  su lugar un poema de muestra y unos días de muestra (`_tools/producto/`),
  tres fotos dibujadas y un candado nuevo cuyo número es 123456; sustituye
  los tramos personales de `libros.js`, `README.md`, `PROMPTS.md`, los
  comentarios y el test (nombres de las mascotas, título y notas de los
  girasoles, páginas de los álbumes, fechas); y antes del commit pasa una
  **guardia** que lee todo lo que viajaría (el Excel por dentro también)
  buscando nombres, fechas y frases prohibidas: si encuentra algo, no hay
  commit. Con `--push` lo sube; `--ver` solo lista. Si la fábrica cambia un
  tramo sustituido, la herramienta para y pide actualizar su tabla.
"""

LIBROS_MASCOTAS_VIEJO = """const MASCOTAS = [
  { raza: "atigrado", nombre: "Karencito" },
  { raza: "carey", nombre: "Elma" },
  { raza: "tricolor", nombre: "Mia" },
  { raza: "vancafe", nombre: "Chunchun" },
];"""
LIBROS_MASCOTAS_NUEVO = """const MASCOTAS = [
  { raza: "atigrado", nombre: "Tigre" },
  { raza: "carey", nombre: "Canela" },
  { raza: "tricolor", nombre: "Luna" },
  { raza: "vancafe", nombre: "Nube" },
];"""
LIBROS_GIRASOLES_VIEJO = """    titulo: "21 Sep 2026",
    tapa: "girasol",
    // Las notas salen una por toque cuando la pantalla está llena; el toque
    // tras la última limpia todo. Se pueden añadir más líneas a la lista.
    notas: [
      "ññiñiñiñiñite quiero muchichichichisimo tanto y mas que estas pocas flores",
      "ojala algun dia estas flores se vuelvan reales",
    ],"""
LIBROS_GIRASOLES_NUEVO = """    titulo: "Girasoles",
    tapa: "girasol",
    // Las notas salen una por toque cuando la pantalla está llena; el toque
    // tras la última limpia todo. Se pueden añadir más líneas a la lista.
    notas: [
      "Aquí va tu nota: aparece cuando la pantalla se llena de flores",
      "y aquí una posdata, si quieres (o bórrala)",
    ],"""
LIBROS_SUENOS_VIEJO = """    // Los dibujos hechos en Paint (dibujo sueño.png), partidos en un sueño por
    // página, y al final una hoja en blanco para los que faltan.
    id: "suenos",
    tipo: "album",
    titulo: "Sueños",
    tapa: "azul",
    paginas: [
      { dibujo: "assets/suenos/casa.webp" },
      { dibujo: "assets/suenos/jardin.webp" },
      { dibujo: "assets/suenos/animales.webp" },
      { dibujo: "assets/suenos/vista.webp" },
      { dibujo: "assets/suenos/yo_y_tu.webp" },
      { dibujo: "assets/suenos/hijos.webp" },
      { blanca: true, texto: "añadamos mas sueños juntos" },
    ],"""
LIBROS_SUENOS_NUEVO = """    // Un sueño por página: dibujos con fondo transparente ({ dibujo: "..." })
    // o, como aquí de muestra, hojas en blanco con una frase arriba.
    id: "suenos",
    tipo: "album",
    titulo: "Sueños",
    tapa: "azul",
    paginas: [
      { blanca: true, texto: "Un sueño por página" },
      { blanca: true, texto: "Dibujado o escrito, como salga" },
      { blanca: true, texto: "Y aquí caben muchos más" },
    ],"""
LIBROS_ALBUM_VIEJO = """    paginas: [
      { foto: "assets/album/cita_1.bin", pie: "Nuestra primera cita: donde tuvimos la primera videollamada" },
      { foto: "assets/album/cita_2.bin" },
      { foto: "assets/album/cita_3.bin" },
      { foto: "assets/album/cita_4.bin" },
      { foto: "assets/album/pasarela_1.bin", pie: "Ahí tuvimos nuestra primera pasarela" },
      { foto: "assets/album/pasarela_2.bin" },
      { foto: "assets/album/pasarela_3.bin" },
      { foto: "assets/album/pasarela_4.bin" },
      { foto: "assets/album/pasarela_5.bin" },
      { foto: "assets/album/pasarela_6.bin" },
      { foto: "assets/album/comic_1.bin", pie: "Nuestro intento de cómic" },
      { foto: "assets/album/comic_2.bin" },
    ],"""
LIBROS_ALBUM_NUEVO = """    paginas: [
      { foto: "assets/album/muestra_1.bin", pie: "Una foto de muestra: pon aquí la tuya" },
      { foto: "assets/album/muestra_2.bin" },
      { foto: "assets/album/muestra_3.bin", pie: "El pie va en la primera foto de cada tanda" },
    ],"""

SKILL_PUBLICAR_CAB_VIEJO = r"""Fábrica (privada, lo tiene todo): `C:\Users\basti\Documents\libro`. Vitrina (pública, solo la página):
`C:\Users\basti\Documents\libro-publico`, repo aparte del que sirve GitHub Pages en
https://mimomomo-code.github.io/libro/. Herramienta: `_tools/publicar.py` (copia en espejo, escribe un"""
SKILL_PUBLICAR_CAB_NUEVO = r"""Fábrica (privada, lo tiene todo): `C:\Users\basti\Documents\bookscat`. Vitrina (pública, solo la página):
`C:\Users\basti\Documents\bookscat-publico`, repo aparte del que sirve GitHub Pages
(la URL la da el repo público cuando exista). Herramienta: `_tools/publicar.py` (copia en espejo, escribe un"""
SKILL_PUBLICAR_REMOTO_VIEJO = """   Si dice que la vitrina no tiene remoto, es la primera vez: el usuario tiene que (a) en GitHub,
   renombrar el repo `libro` a `libro-taller` y ponerlo privado, (b) crear un repo público nuevo
   llamado `libro`, (c) activar Pages en él (rama main, raíz). Entonces:
   ```
   git -C "C:/Users/basti/Documents/libro" remote set-url origin https://mimomomo-code@github.com/mimomomo-code/libro-taller.git
   git -C "C:/Users/basti/Documents/libro-publico" remote add origin https://mimomomo-code@github.com/mimomomo-code/libro.git
   python _tools/publicar.py --push
   ```
   La credencial de GitHub de esta cuenta es la de mimomomo-code (no confundir con DYBITSOLUTIONS).
"""
SKILL_PUBLICAR_REMOTO_NUEVO = """   Si dice que la vitrina no tiene remoto, es la primera vez: crear en GitHub un repo público nuevo
   para la vitrina y activar Pages en él (rama main, raíz). Entonces:
   ```
   git -C "C:/Users/basti/Documents/bookscat-publico" remote add origin <URL del repo público>
   python _tools/publicar.py --push
   ```
"""

SALA_TEST_VIEJO = """      const D = { dias: [{ fecha: '2026-10-11', nombre: 'Inicio', inicio: true }, { dia: 30, mes: 9, nombre: 'Autitos', icono: 'auto' }] };
      const ev = (y, m) => CALENDARIO.eventos(D, y, m).map(e => e.d + ':' + e.nombre).join('|');
      ok(ev(2026, 9) === '11:Inicio' && ev(2026, 10) === '11:1 mes juntos' && ev(2027, 9) === '11:1 año juntos' && ev(2027, 8) === '11:11 meses juntos|30:Autitos' && ev(2026, 8) === '30:Autitos',
        'calendario: el inicio marca cada mes y cada año; los días del año se repiten');
      const px = CALENDARIO.proximos(D, new Date(2026, 9, 7), 3).map(e => e.dias + ':' + e.nombre).join('|');
      ok(px === '4:Inicio|35:1 mes juntos|65:2 meses juntos' && CALENDARIO.paginas(new Date(2026, 9, 7)).length === 13 && CALENDARIO.paginas(new Date(2026, 9, 7))[1].mes === '2026-10',"""
# inicio el 15 de marzo de 2026 y un día anual el 20 de febrero; "hoy" el 11 de marzo: las mismas cuentas
# (4 días para el inicio, 35 para el primer mes, 65 para el segundo; 11 meses en febrero de 2027)
SALA_TEST_NUEVO = """      const D = { dias: [{ fecha: '2026-03-15', nombre: 'Inicio', inicio: true }, { dia: 20, mes: 2, nombre: 'Regalo', icono: 'regalo' }] };
      const ev = (y, m) => CALENDARIO.eventos(D, y, m).map(e => e.d + ':' + e.nombre).join('|');
      ok(ev(2026, 2) === '15:Inicio' && ev(2026, 3) === '15:1 mes juntos' && ev(2027, 2) === '15:1 año juntos' && ev(2027, 1) === '15:11 meses juntos|20:Regalo' && ev(2026, 1) === '20:Regalo',
        'calendario: el inicio marca cada mes y cada año; los días del año se repiten');
      const px = CALENDARIO.proximos(D, new Date(2026, 2, 11), 3).map(e => e.dias + ':' + e.nombre).join('|');
      ok(px === '4:Inicio|35:1 mes juntos|65:2 meses juntos' && CALENDARIO.paginas(new Date(2026, 2, 11)).length === 13 && CALENDARIO.paginas(new Date(2026, 2, 11))[1].mes === '2026-03',"""

# archivo -> lista de (viejo, nuevo); cada viejo tiene que estar EXACTAMENTE una vez
SUSTITUCIONES = {
    'libros.js': [
        ('// Girasoles y limones ilustrados para la lluvia del libro "21 Sep 2026".',
         '// Girasoles y limones ilustrados para la lluvia del libro "Girasoles".'),
        (LIBROS_MASCOTAS_VIEJO, LIBROS_MASCOTAS_NUEVO),
        (LIBROS_GIRASOLES_VIEJO, LIBROS_GIRASOLES_NUEVO),
        (LIBROS_SUENOS_VIEJO, LIBROS_SUENOS_NUEVO),
        (LIBROS_ALBUM_VIEJO, LIBROS_ALBUM_NUEVO),
    ],
    'girasoles.js': [
        ('//  LOS GIRASOLES. Al abrir el libro "21 Sep 2026" caen girasoles hasta',
         '//  LOS GIRASOLES. Al abrir el libro "Girasoles" caen girasoles hasta'),
    ],
    'calendario.js': [
        ('//    { "dia": 30, "mes": 9, "nombre": "Día de los autitos", "icono": "auto" }',
         '//    { "dia": 25, "mes": 12, "nombre": "Navidad", "icono": "regalo" }'),
        ('//    { "fecha": "2026-10-11", "nombre": "Empezamos a salir", "inicio": true }',
         '//    { "fecha": "2026-01-01", "nombre": "Nuestro primer día", "inicio": true }'),
    ],
    # el test de la sala usa días de prueba: los mismos cálculos con fechas que no son de nadie
    'sala.js': [
        (SALA_TEST_VIEJO, SALA_TEST_NUEVO),
    ],
    'PROMPTS.md': [
        ('La lluvia del libro "21 Sep 2026" dibuja las flores por código. Si en',
         'La lluvia del libro "Girasoles" dibuja las flores por código. Si en'),
    ],
    'README.md': [
        (README_INTRO_VIEJO, README_INTRO_NUEVO),
        ('- `tipo: "girasoles"` es el libro **21 Sep 2026**: al abrirlo caen girasoles',
         '- `tipo: "girasoles"` es el libro **Girasoles**: al abrirlo caen girasoles'),
        (README_ALBUMES_VIEJO, README_ALBUMES_NUEVO),
        ('  año; `{ "fecha": "2026-10-11", "nombre": "...", "inicio": true }` es un día',
         '  año; `{ "fecha": "2026-01-01", "nombre": "...", "inicio": true }` es un día'),
        (README_GATOS_VIEJO, README_GATOS_NUEVO),
        # el párrafo que explica ESTA herramienta no tiene sentido en el producto (allí no existe)
        (README_PRODUCTO_VIEJO, ''),
    ],
    '_tools/publicar.py': [
        ("DESTINO = os.path.join(os.path.dirname(RAIZ), 'libro-publico')",
         "DESTINO = os.path.join(os.path.dirname(RAIZ), 'bookscat-publico')"),
        ('otra carpeta (por defecto Documents/libro-publico)', 'otra carpeta (por defecto Documents/bookscat-publico)'),
        ('para verse desde el celular. Verla en línea: https://mimomomo-code.github.io/libro/',
         'para verse desde el celular.'),
    ],
    '.claude/skills/libro-mascota/SKILL.md': [
        ('- Los nombres propios (Karencito, Elma, Mia, Chunchun) son de la pareja, no de la raza.',
         '- Los nombres propios (los de MASCOTAS en libros.js) son de la pareja, no de la raza.'),
    ],
    '.claude/skills/libro-publicar/SKILL.md': [
        ('"actualiza la página de Karen"', '"actualiza la página pública"'),
        (SKILL_PUBLICAR_CAB_VIEJO, SKILL_PUBLICAR_CAB_NUEVO),
        (SKILL_PUBLICAR_REMOTO_VIEJO, SKILL_PUBLICAR_REMOTO_NUEVO),
    ],
}
# sustituciones que pueden repetirse (al menos una vez) en el archivo
REPETIBLES = {
    '_tools/publicar.py': [
        ('https://mimomomo-code@github.com/mimomomo-code/libro.git', '<URL del repo público>'),
    ],
}
# en todas las skills, después de lo anterior: las rutas de esta máquina apuntan al producto
RUTAS_SKILLS = [
    (re.compile(r'libro-publico'), 'bookscat-publico'),
    (re.compile(r'Documents([/\\])libro(?![\w-])'), r'Documents\1bookscat'),
]

# ---------------------------------------------------------------- utilidades
def git(donde, *args, ok=True):
    r = subprocess.run(['git', '-C', donde] + list(args), capture_output=True, text=True, encoding='utf-8', errors='replace')
    if ok and r.returncode: raise SystemExit('git %s falló:\n%s%s' % (' '.join(args), r.stdout, r.stderr))
    return r

def leer(p): return io.open(p, encoding='utf-8').read()
def escribir(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with io.open(p, 'w', encoding='utf-8', newline='') as fh: fh.write(s)

def excluido(r): return any(r == e or (e.endswith('/') and r.startswith(e)) for e in EXCLUIDOS)

def fuentes():
    """{ruta relativa: ruta en la fábrica} de todo lo que git versiona aquí menos lo excluido."""
    out = {}
    for r in git(RAIZ, 'ls-files').stdout.splitlines():
        r = r.strip()
        if not r or excluido(r): continue
        p = os.path.join(RAIZ, r)
        if os.path.isfile(p): out[r] = p
    return out

def existentes(destino):
    out = {}
    for dp, dn, fn in os.walk(destino):
        dn[:] = [d for d in dn if d not in ('.git', 'privado', '_capturas', '__pycache__')]
        for f in fn: out[os.path.relpath(os.path.join(dp, f), destino).replace(os.sep, '/')] = os.path.join(dp, f)
    return out

def sustituir(r, texto):
    for viejo, nuevo in SUSTITUCIONES.get(r, ()):
        n = texto.count(viejo)
        if n != 1:
            raise SystemExit('SUSTITUCIÓN: en %s el tramo aparece %d veces (tiene que ser 1); la fábrica cambió, actualizar producto.py:\n%s' % (r, n, viejo[:160]))
        texto = texto.replace(viejo, nuevo)
    for viejo, nuevo in REPETIBLES.get(r, ()):
        if viejo not in texto:
            raise SystemExit('SUSTITUCIÓN: en %s ya no está %r; actualizar producto.py' % (r, viejo))
        texto = texto.replace(viejo, nuevo)
    if r.startswith('.claude/skills/'):
        for rx, nuevo in RUTAS_SKILLS: texto = rx.sub(nuevo, texto)
    return texto

# ---------------------------------------------------------------- las muestras
def foto_muestra(n):
    """Una 'foto' dibujada: degradado suave, una tarjeta y el rótulo. Determinista (misma imagen cada vez)."""
    from PIL import Image, ImageDraw, ImageFont
    W, H = 1280, 960
    paletas = [((246, 222, 196), (214, 170, 150)), ((200, 222, 236), (150, 176, 206)), ((214, 232, 206), (160, 196, 160))]
    a, b = paletas[(n - 1) % len(paletas)]
    im = Image.new('RGB', (W, H))
    px = im.load()
    for y in range(H):
        t = y / (H - 1)
        c = tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
        for x in range(W): px[x, y] = c
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((120, 120, W - 120, H - 120), radius=40, fill=(252, 250, 246), outline=(120, 100, 90), width=4)
    fuente = None
    for f in ('georgiai.ttf', 'georgia.ttf', 'arial.ttf'):
        try: fuente = ImageFont.truetype(os.path.join('C:/Windows/Fonts', f), 72); break
        except Exception: pass
    chica = None
    for f in ('georgia.ttf', 'arial.ttf'):
        try: chica = ImageFont.truetype(os.path.join('C:/Windows/Fonts', f), 40); break
        except Exception: pass
    t1, t2 = 'Foto de muestra %d' % n, 'pon aquí la tuya'
    if fuente:
        w1 = d.textlength(t1, font=fuente); d.text(((W - w1) / 2, H / 2 - 90), t1, fill=(90, 70, 60), font=fuente)
        w2 = d.textlength(t2, font=chica); d.text(((W - w2) / 2, H / 2 + 20), t2, fill=(140, 120, 110), font=chica)
    else:
        d.text((W / 2 - 100, H / 2), t1, fill=(90, 70, 60))
    buf = io.BytesIO(); im.save(buf, 'WEBP', quality=82, method=6)
    return buf.getvalue()

def escribir_si_cambia(p, datos):
    """No reescribe si ya está igual (así candado.py no recifra y el repo no cambia por nada)."""
    if os.path.exists(p):
        with open(p, 'rb') as fh:
            if fh.read() == datos: return False
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'wb') as fh: fh.write(datos)
    return True

def muestras(destino):
    priv = os.path.join(destino, 'privado')
    for i, f in enumerate(FOTOS_MUESTRA, 1):
        if escribir_si_cambia(os.path.join(priv, 'album', f + '.webp'), foto_muestra(i)): print('   foto de muestra', f)
    # (la plantilla no se llama dias.json a propósito: la guardia del candado frena cualquier dias.json)
    with open(os.path.join(PLANTILLAS, 'dias_muestra.json'), 'rb') as fh: dias = fh.read()
    if escribir_si_cambia(os.path.join(priv, 'calendario', 'dias.json'), dias): print('   días de muestra')
    r = subprocess.run([sys.executable, os.path.join(destino, '_tools', 'candado.py'), '--clave', NUMERO_MUESTRA],
                       cwd=destino, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode: raise SystemExit('candado.py del producto falló:\n' + r.stdout + r.stderr)
    for lin in r.stdout.splitlines():
        if lin.strip() and not lin.startswith('      {'): print('   candado:', lin.strip())

# ---------------------------------------------------------------- la guardia
def guardia(destino, sal_real):
    patrones = [re.compile(p) for p in PROHIBIDO + ([re.escape(sal_real)] if sal_real else [])]
    rutas = [re.compile(p) for p in RUTAS_PROHIBIDAS]
    archivos = [l.strip() for l in git(destino, 'ls-files').stdout.splitlines() if l.strip()]
    malos = []
    for r in archivos:
        if any(rx.search(r) for rx in rutas): malos.append((r, 'ruta prohibida'))
        if r.endswith('.bin') and r not in BINS_PERMITIDOS: malos.append((r, 'un .bin que no es de muestra'))
        p = os.path.join(destino, r)
        textos = []
        if r.endswith(TEXTO) or r == '_tools/hooks/pre-commit':
            textos.append((r, leer(p)))
        elif r.endswith('.xlsx'):
            with zipfile.ZipFile(p) as z:
                for n in z.namelist():
                    if n.endswith('.xml'): textos.append((r + '!' + n, z.read(n).decode('utf-8', 'replace')))
        for nombre, t in textos:
            for rx in patrones:
                m = rx.search(t)
                if m:
                    i = t.rfind('\n', 0, m.start()) + 1; j = t.find('\n', m.end()); j = len(t) if j < 0 else j
                    malos.append((nombre, '%s: %s' % (rx.pattern, t[i:j].strip()[:140])))
    return archivos, malos

# ---------------------------------------------------------------- main
def main():
    a = sys.argv[1:]
    destino = a[a.index('--destino') + 1] if '--destino' in a else DESTINO
    fs = fuentes()
    ya = existentes(destino) if os.path.isdir(destino) else {}
    borrar = sorted(r for r in ya if r not in fs and r not in GENERADOS)
    nuevos = sorted(r for r in fs if r not in ya)
    print('Producto:', destino)
    print('  viajan: %d archivos de la fábrica + %d generados | nuevos: %d | a borrar (ya no están en la fábrica): %d | con sustituciones: %d'
          % (len(fs), len(GENERADOS), len(nuevos), len(borrar), len(SUSTITUCIONES)))
    faltan = [r for r in SUSTITUCIONES if r not in fs]
    if faltan: raise SystemExit('SUSTITUCIONES para archivos que ya no existen en la fábrica: %s' % faltan)
    if '--ver' in a:
        for r in nuevos: print('   nuevo  ', r)
        for r in borrar: print('   borrar ', r)
        for r in SUSTITUCIONES: print('   sustituye', r, '(%d tramos)' % len(SUSTITUCIONES[r]))
        for r in GENERADOS: print('   genera ', r)
        # las sustituciones se comprueban también en --ver, para saber antes si la fábrica cambió
        for r in SUSTITUCIONES: sustituir(r, leer(fs[r]))
        print('  (las sustituciones encajan; los demás archivos se copian igual y git dirá cuáles cambiaron)')
        return
    os.makedirs(destino, exist_ok=True)
    if not os.path.isdir(os.path.join(destino, '.git')):
        git(destino, 'init', '-b', 'main'); print('  git init en el producto')
    for r in borrar:
        os.remove(ya[r]); print('   borrado', r)
    for r, src in fs.items():
        dst = os.path.join(destino, r); os.makedirs(os.path.dirname(dst), exist_ok=True)
        if r in SUSTITUCIONES or r in REPETIBLES or r.startswith('.claude/skills/'):
            escribir(dst, sustituir(r, leer(src)))
        else:
            shutil.copy2(src, dst)
    shutil.copy2(os.path.join(PLANTILLAS, 'poema.js'), os.path.join(destino, 'poema.js'))
    muestras(destino)
    git(destino, 'config', 'core.hooksPath', '_tools/hooks')
    git(destino, 'add', '-A')
    sal_real = None
    try: sal_real = json.load(io.open(os.path.join(RAIZ, 'assets', 'candado.json'), encoding='utf-8'))['sal']
    except Exception: pass
    archivos, malos = guardia(destino, sal_real)
    if malos:
        print('\nGUARDIA: el producto NO puede subir así (%d hallazgos); sin commit.' % len(malos))
        for r, que in malos: print('   ', r, '->', que)
        raise SystemExit(1)
    print('  guardia: %d archivos revisados, nada personal' % len(archivos))
    estado = git(destino, 'status', '--porcelain').stdout.strip()
    if not estado:
        print('  nada nuevo que anotar: el producto ya está al día con la fábrica')
    else:
        print('  cambios en el producto: %d archivos' % len(estado.splitlines()))
        hash_fab = git(RAIZ, 'rev-parse', '--short', 'HEAD', ok=False).stdout.strip() or 'sin git'
        msg = 'Producto %s desde la fábrica %s' % (time.strftime('%Y-%m-%d %H:%M'), hash_fab)
        git(destino, 'commit', '-q', '-m', msg); print('  commit en el producto:', msg)
    if '--push' in a:   # también sin commit nuevo: lo que falte por subir, sube
        if not git(destino, 'remote', ok=False).stdout.strip():
            git(destino, 'remote', 'add', 'origin', REMOTO); print('  remoto añadido:', REMOTO)
        r = git(destino, 'push', '-u', 'origin', 'main', ok=False)
        if r.returncode: raise SystemExit('push falló:\n' + r.stdout + r.stderr)
        print('  subido al remoto del producto')
    else:
        print('  sin push (añadir --push para subirlo)')

if __name__ == '__main__':
    main()
