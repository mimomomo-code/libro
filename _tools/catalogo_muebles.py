# -*- coding: utf-8 -*-
"""
EL CATÁLOGO DE MUEBLES Y ADORNOS DE LA SALA: parejas de sillones, mesas, alfombras y adornos
para las ranuras de las librerías (como máximo 10 por tipo). Escribe en
OneDrive/Escritorio/Muebles del libro (o en la carpeta que se pase como argumento) un PEDIDO
listo para pegar en ChatGPT por variante (Sillones/, Mesas/, Alfombras/, Adornos/), CATALOGO.md,
LEEME.md y las referencias (compuestas con Pillow a partir de los assets del repo). Cada pedido
adjunta DOS referencias: la composición de la pieza tal como está hoy y referencia_estilo.png
(los muebles y un gato ya pintados: el acabado que queremos). Para añadir una variante: una
entrada más en su lista y volver a correrlo. Las imágenes que vuelvan entran con _tools/mueble.py.

Uso:  python _tools/catalogo_muebles.py [carpeta]
Necesita Pillow.
"""
import io, os, shutil, sys
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = sys.argv[1] if len(sys.argv) > 1 else r"C:/Users/basti/OneDrive/Escritorio/Muebles del libro"
SALA = r"C:/Users/basti/OneDrive/Escritorio/Sala del libro"

ESTILO = "Mismo acabado que la segunda imagen adjunta (los muebles de la sala): ilustración digital realista y pictórica, de libro de cuentos elegante y romántico, mate (sin brillos de plástico), con volumen, textura creíble y luz fría suave desde arriba a la izquierda con sombras cálidas. PROHIBIDO: dibujo plano, vectorial o de cartón; contornos negros; fondo de color."
PIE = """
SI RESPONDE CON TEXTO: contestar solo "Genera la imagen ahora".
SI SALE CON FONDO DE COLOR: contestar "El fondo tiene que ser transparente de verdad (PNG con alfa), no un color liso".

GUARDAR EL RESULTADO COMO:  {archivo}   (en la carpeta "Muebles del libro", junto al LEEME)
"""
SILLONES_T = """ADJUNTAR (las dos):
  1. referencia_sillones.png   (los dos sillones de hoy, uno junto al otro con un HUECO vacío en medio: así tiene que venir la imagen, para partirla en dos; el de la derecha es más alto)
  2. referencia_estilo.png     (el acabado que queremos: pictórico, realista y con volumen)

PEGAR ESTE TEXTO:

Genera ahora una imagen. No describas, no esperes más material.

Pinta DOS sillones para una sala de lectura, uno junto al otro, vistos de frente y a la altura de los ojos, enteros, con un HUECO VACÍO y claro entre los dos (no se tocan ni se solapan), 1536 x 1024 píxeles, fondo transparente. A la izquierda, {izq}. A la derecha, {der}. Los dos con el mismo tamaño relativo que los sillones de la primera imagen adjunta (el de la derecha, de respaldo alto, es más alto que el de la izquierda). """ + ESTILO + """ Sin suelo, sin sombra proyectada, sin pared, sin alfombra, sin cojines sueltos, sin personas, sin gatos, sin texto: solo los dos sillones sobre fondo transparente.
""" + PIE
MESA_T = """ADJUNTAR (las dos):
  1. referencia_mesa.png     (la mesa de hoy: vista de frente y un poco desde arriba, entera, sola; así tiene que venir)
  2. referencia_estilo.png   (el acabado que queremos: pictórico, realista y con volumen)

PEGAR ESTE TEXTO:

Genera ahora una imagen. No describas, no esperes más material.

Pinta UNA mesa auxiliar para una sala de lectura, vista de frente y un poco desde arriba (el mismo punto de vista que la mesa de la primera imagen adjunta), entera y centrada con un poco de aire alrededor, 1024 x 1024 píxeles, fondo transparente: {mesa}. Se tiene que ver la tapa por arriba, porque los libros se apoyan encima. """ + ESTILO + """ Sin suelo, sin sombra proyectada, sin objetos encima, sin pared, sin personas, sin texto: solo la mesa sobre fondo transparente.
""" + PIE
ALFOMBRA_T = """ADJUNTAR (las dos):
  1. referencia_alfombra.png   (la alfombra de hoy: rectangular, vista de frente en perspectiva suave, el borde de abajo más ancho que el de arriba; así tiene que venir)
  2. referencia_estilo.png     (el acabado que queremos)

PEGAR ESTE TEXTO:

Genera ahora una imagen. No describas, no esperes más material.

Pinta UNA alfombra para una sala de lectura, vista de frente en perspectiva suave como la de la primera imagen adjunta (el borde de abajo más ancho que el de arriba, apoyada en un suelo que NO se ve), entera y centrada, 1536 x 1024 píxeles, fondo transparente: {alfombra}. Textura de tejido creíble, flecos si los lleva. """ + ESTILO + """ Sin suelo, sin muebles, sin sombra proyectada, sin personas, sin gatos, sin texto: solo la alfombra sobre fondo transparente.
""" + PIE
ADORNO_T = """ADJUNTAR (las dos):
  1. referencia_estante.png   (un trozo de librería con sus libros: el adorno tiene que caber de pie en un estante así, entre los libros)
  2. referencia_estilo.png    (el acabado que queremos: pictórico, realista y con volumen)

PEGAR ESTE TEXTO:

Genera ahora una imagen. No describas, no esperes más material.

Pinta UN solo objeto para poner de pie en el estante de una librería, visto de frente y a la altura de los ojos, entero y centrado con un poco de aire alrededor, más alto que ancho, 1024 x 1536 píxeles (vertical), fondo transparente: {objeto}. Tamaño: cabe en un estante entre libros, más o menos tan alto como un libro. """ + ESTILO + """ Sin estante, sin libros, sin pared, sin sombra proyectada, sin texto: solo el objeto sobre fondo transparente.
""" + PIE

SILLONES = [
 dict(n=1, clave="esmeralda", nombre="Esmeralda y damasco dorado", para="elegante; con pared esmeralda, perla, azul",
  izq="un sillón club de terciopelo verde esmeralda, brazos redondos, asiento mullido y patas torneadas de nogal", der="un sillón orejero de alas altas tapizado en damasco dorado con hojas tenues, brazos enrollados y patas oscuras"),
 dict(n=2, clave="azul", nombre="Azul marino y crema", para="sobria, para él; con pared azul, perla, chocolate",
  izq="un sillón club de terciopelo azul marino con botones en el respaldo y patas de nogal", der="un sillón orejero de alas altas color crema con un patrón tenue de hojas doradas, brazos enrollados y patas oscuras"),
 dict(n=3, clave="rosa", nombre="Rosa empolvado y marfil", para="dulce, para ella; con pared rosa, lavanda, San Valentín",
  izq="un sillón club de terciopelo rosa empolvado con patas de madera clara", der="un sillón orejero de alas altas marfil con florecitas rosas pequeñas, brazos enrollados y patas claras"),
 dict(n=4, clave="lavanda", nombre="Lila y gris perla", para="romántica; con pared lavanda, perla, invierno",
  izq="un sillón club de terciopelo lila con patas de madera clara", der="un sillón orejero de alas altas gris perla con ribete plateado, brazos enrollados y patas oscuras"),
 dict(n=5, clave="cuero", nombre="Cuero marrón y tweed", para="clásica, para él; con pared chocolate, azul, otoño",
  izq="un sillón club de cuero marrón envejecido con tachuelas de bronce y patas de nogal", der="un sillón orejero de alas altas de tweed gris en espiga con un cojín de cuero, brazos enrollados y patas oscuras"),
 dict(n=6, clave="primavera", nombre="Lino con cerezos y menta", para="estación: primavera; con pared primavera, verano",
  izq="un sillón club de lino blanco estampado con ramas de cerezo en flor rosa, patas de madera clara", der="un sillón orejero de alas altas de lino verde menta claro, brazos enrollados y patas claras"),
 dict(n=7, clave="navidad", nombre="Tartán y verde abeto", para="fiesta: Navidad; con pared navidad, vino",
  izq="un sillón club tapizado en tartán rojo y verde con patas de nogal", der="un sillón orejero de alas altas de terciopelo verde abeto con un cojín dorado, brazos enrollados y patas oscuras"),
 dict(n=8, clave="chocolate", nombre="Chocolate y caramelo", para="cálida; con pared chocolate, otoño, vino",
  izq="un sillón club de terciopelo chocolate con patas de nogal", der="un sillón orejero de alas altas caramelo con un patrón tenue de rombos, brazos enrollados y patas oscuras"),
]
MESAS = [
 dict(n=1, clave="roble", nombre="Roble claro", para="con pisos roble, blanco; paredes claras", mesa="una mesa auxiliar redonda de roble claro color miel, con pie central torneado y tres patas curvas"),
 dict(n=2, clave="blanca", nombre="Blanca envejecida", para="con pisos blanco, roble; paredes rosa, lavanda, primavera", mesa="una mesa auxiliar redonda de madera pintada de blanco envejecido, con la pintura algo desgastada, pie central torneado y tres patas curvas"),
 dict(n=3, clave="marmol", nombre="Mármol y dorado", para="muy elegante; con pisos damero, espiga; paredes perla, esmeralda, azul", mesa="una mesa auxiliar redonda con tapa de mármol blanco veteado y pie central dorado con tres patas curvas"),
 dict(n=4, clave="baul", nombre="Baúl antiguo", para="rústica; con pisos nogal, terracota; paredes chocolate, otoño", mesa="un baúl de madera antiguo, de tapa plana, con herrajes y esquinas de bronce, que sirve de mesa"),
 dict(n=5, clave="hierro", nombre="Hierro forjado y vidrio", para="con pisos gris, damero; paredes perla, azul, invierno", mesa="una mesa auxiliar redonda de hierro forjado negro con volutas y tapa de vidrio"),
 dict(n=6, clave="cerezo", nombre="Cerezo con cajoncito", para="con pisos cerezo, nogal; paredes vino, navidad, San Valentín", mesa="una mesa auxiliar redonda de cerezo rojizo con un cajoncito con tirador de bronce bajo la tapa, pie central torneado y tres patas curvas"),
]
ALFOMBRAS = [
 dict(n=1, clave="persa", nombre="Persa roja y azul", para="clásica; con paredes vino, azul, esmeralda", alfombra="una alfombra persa rectangular, roja y azul oscuro con un medallón central y una cenefa de motivos, flecos cortos en los extremos"),
 dict(n=2, clave="rosa", nombre="Rosa con flores", para="dulce, para ella; con paredes rosa, San Valentín", alfombra="una alfombra rectangular rosa empolvado con flores pequeñas y una cenefa marfil"),
 dict(n=3, clave="lavanda", nombre="Lila con rombos", para="romántica; con paredes lavanda, perla", alfombra="una alfombra rectangular lila con rombos blancos y una cenefa violeta"),
 dict(n=4, clave="verde", nombre="Verde con hojas doradas", para="elegante; con paredes esmeralda, primavera", alfombra="una alfombra rectangular verde oscuro con hojas doradas y una cenefa dorada"),
 dict(n=5, clave="yute", nombre="Yute trenzado", para="natural; con paredes verano, primavera, chocolate", alfombra="una alfombra rectangular de yute trenzado color crema con un borde de lana oscura"),
 dict(n=6, clave="gris", nombre="Gris geométrica", para="sobria, para él; con paredes perla, azul, invierno", alfombra="una alfombra rectangular gris con un patrón geométrico blanco de líneas y rombos"),
 dict(n=7, clave="navidad", nombre="Roja y verde con acebo", para="fiesta: Navidad; con paredes navidad, vino", alfombra="una alfombra rectangular roja con cenefa verde y dorada y ramitas de acebo en las esquinas"),
 dict(n=8, clave="oveja", nombre="Piel de oveja", para="mullida; con paredes invierno, lavanda, perla", alfombra="una alfombra de piel de oveja blanca, de contorno irregular y pelo largo mullido"),
]
ADORNOS = [
 dict(n=1, clave="planta", nombre="Planta en maceta", ancho=2, objeto="una planta de interior frondosa (un helecho o un potus) en una maceta de barro"),
 dict(n=2, clave="vela", nombre="Candelabro", ancho=1, objeto="un candelabro de bronce con una vela encendida, de llama pequeña y cálida"),
 dict(n=3, clave="reloj", nombre="Reloj de mesa", ancho=2, objeto="un reloj de mesa antiguo dorado con esfera blanca y números romanos"),
 dict(n=4, clave="retrato", nombre="Portarretrato", ancho=2, objeto="un portarretrato de pie, dorado, con marco ovalado y el interior VACÍO de color crema liso (sin foto ni dibujo dentro, para poner una foto después)"),
 dict(n=5, clave="gato", nombre="Gatito de porcelana", ancho=1, objeto="una figurita de gato sentado de porcelana blanca con detalles dorados"),
 dict(n=6, clave="bola", nombre="Bola de nieve", ancho=2, objeto="una bola de nieve de cristal con una casita nevada dentro, sobre una base de madera torneada"),
 dict(n=7, clave="tetera", nombre="Tetera y taza", ancho=2, objeto="una tetera de porcelana blanca con flores pintadas y una taza a juego al lado"),
 dict(n=8, clave="farol", nombre="Farol", ancho=1, objeto="un farol de hojalata con vidrios y una vela encendida dentro"),
 dict(n=9, clave="globo", nombre="Globo terráqueo", ancho=2, objeto="un globo terráqueo pequeño y antiguo, de tonos sepia, sobre un pie de madera"),
 dict(n=10, clave="jarron", nombre="Jarrón con girasoles", ancho=2, objeto="un jarrón de cerámica azul con tres girasoles pequeños"),
]

def escribir(carpeta, prefijo, lista, plantilla, archivo):
    os.makedirs(os.path.join(D, carpeta), exist_ok=True)
    for p in lista:
        nombre = "PEDIDO %s - %02d %s.txt" % (prefijo, p["n"], p["nombre"])
        io.open(os.path.join(D, carpeta, nombre), "w", encoding="utf-8").write(plantilla.format(archivo=archivo % p["clave"], **p))

def referencias():
    fondo = (30, 21, 17, 255)
    def abrir(rel):
        p = os.path.join(RAIZ, rel); return Image.open(p).convert("RGBA") if os.path.exists(p) else None
    def sobre_fondo(piezas, alto, sep=70, margen=50):
        ims = []
        for im in piezas:
            if im is None: continue
            bb = im.getchannel("A").point(lambda a: 255 if a > 16 else 0).getbbox(); im = im.crop(bb)
            ims.append(im.resize((round(im.width * alto / im.height), alto), Image.LANCZOS))
        if not ims: return None
        W = sum(i.width for i in ims) + sep * (len(ims) - 1) + margen * 2; H = alto + margen * 2
        lienzo = Image.new("RGBA", (W, H), fondo); x = margen
        for im in ims: lienzo.alpha_composite(im, (x, H - margen - im.height)); x += im.width + sep
        return lienzo.convert("RGB")
    s = sobre_fondo([abrir("assets/sillon_rojo.webp"), abrir("assets/sillon_amarillo.webp")], 700, sep=160)
    if s: s.save(os.path.join(D, "referencia_sillones.png"))
    m = sobre_fondo([abrir("assets/mesa.webp")], 700)
    if m: m.save(os.path.join(D, "referencia_mesa.png"))
    a = sobre_fondo([abrir("assets/alfombra.webp")], 600)
    if a: a.save(os.path.join(D, "referencia_alfombra.png"))
    cap = os.path.join(RAIZ, "_capturas", "fondos_defecto_pc.png")
    if os.path.exists(cap):
        Image.open(cap).crop((0, 0, 232, 650)).save(os.path.join(D, "referencia_estante.png"))
    est = os.path.join(SALA, "referencia_estilo.png")
    if os.path.exists(est): shutil.copyfile(est, os.path.join(D, "referencia_estilo.png"))

def main():
    os.makedirs(D, exist_ok=True)
    escribir("Sillones", "sillones", SILLONES, SILLONES_T, "sillones_%s.png")
    escribir("Mesas", "mesa", MESAS, MESA_T, "mesa_%s.png")
    escribir("Alfombras", "alfombra", ALFOMBRAS, ALFOMBRA_T, "alfombra_%s.png")
    escribir("Adornos", "adorno", ADORNOS, ADORNO_T, "adorno_%s.png")
    referencias()
    cat = ["# Catálogo de muebles y adornos de la sala", "",
     "Cuatro tipos de pieza, como máximo diez por tipo, todas en el mismo estilo (ilustración de cuento,",
     "realista y pictórica) y sobre fondo transparente. Cada fila tiene su `PEDIDO` listo para pegar en",
     "ChatGPT (carpetas `Sillones/`, `Mesas/`, `Alfombras/` y `Adornos/`); cada pedido adjunta la",
     "referencia de composición de la pieza (cómo tiene que venir) y `referencia_estilo.png` (el acabado).",
     "Los resultados se guardan en esta carpeta con el nombre de la columna **Archivo**.", "",
     "## Parejas de sillones (una imagen con los dos y un hueco en medio)", "",
     "| # | Pareja | Para quién / con qué | Archivo |", "|---|---|---|---|"]
    for p in SILLONES: cat.append("| %02d | %s | %s | `sillones_%s.png` |" % (p["n"], p["nombre"], p["para"], p["clave"]))
    cat += ["", "## Mesas", "", "| # | Mesa | Con qué | Archivo |", "|---|---|---|---|"]
    for p in MESAS: cat.append("| %02d | %s | %s | `mesa_%s.png` |" % (p["n"], p["nombre"], p["para"], p["clave"]))
    cat += ["", "## Alfombras", "", "| # | Alfombra | Con qué | Archivo |", "|---|---|---|---|"]
    for p in ALFOMBRAS: cat.append("| %02d | %s | %s | `alfombra_%s.png` |" % (p["n"], p["nombre"], p["para"], p["clave"]))
    cat += ["", "## Adornos para las librerías (ocupan ranuras de libros)", "", "| # | Adorno | Ranuras que ocupa | Archivo |", "|---|---|---|---|"]
    for p in ADORNOS: cat.append("| %02d | %s | %d | `adorno_%s.png` |" % (p["n"], p["nombre"], p["ancho"], p["clave"]))
    cat += ["", "## Cómo entran en la página", "",
     "Cada imagen se convierte con `python _tools/mueble.py <imagen> sillones|mesa|alfombra|adorno <clave>`",
     "(en `Documents/libro`): la pareja de sillones se parte sola por el hueco del medio en izquierdo y",
     "derecho, todo queda en `assets/muebles/` o `assets/adornos/` con su miniatura, y el nombre de cada",
     "variante ya está en `MUEBLES` y `ADORNOS` (`libros.js`). El botón ✎ de la página los ofrece:",
     "sillones, mesa y alfombra se eligen como los fondos; los adornos se encienden y apagan uno por uno.",
     "Cada adorno nace en una ranura fija de una librería y tapa tantas ranuras como diga su ancho: los",
     "libros no pueden ir ahí (si uno estaba, se corre al hueco vecino).", ""]
    io.open(os.path.join(D, "CATALOGO.md"), "w", encoding="utf-8").write("\n".join(cat))
    leeme = """# Muebles del libro: sillones, mesas, alfombras y adornos pintados con IA

Igual que los fondos de `Sala del libro`: cada `PEDIDO ....txt` se pega en ChatGPT
con sus DOS imágenes adjuntas y el resultado se guarda aquí con el nombre que dice la
última línea. `CATALOGO.md` lista las variantes (8 parejas de sillones, 6 mesas, 8
alfombras y 10 adornos) y con qué fondos van bien.

## Qué se le pasa a la IA

1. Abrir ChatGPT y una conversación nueva. Abrir el `PEDIDO` que se quiera.
2. **Adjuntar las DOS imágenes** que dice el principio: la referencia de composición de esa
   pieza (`referencia_sillones.png`, `referencia_mesa.png`, `referencia_alfombra.png` o
   `referencia_estante.png`) y `referencia_estilo.png` (el acabado).
3. **Pegar** lo que va debajo de "PEGAR ESTE TEXTO" y enviar. Si responde con texto:
   `Genera la imagen ahora`. Si el fondo sale de color: "el fondo tiene que ser
   transparente de verdad (PNG con alfa)".
4. Guardar el resultado en esta carpeta con el nombre de la última línea del pedido
   (`sillones_rosa.png`, `mesa_roble.png`, `alfombra_persa.png`, `adorno_planta.png`...).
   Si queda con nombre raro en el Escritorio, avisar y se renombra.
5. Avisar: en el proyecto se convierten y aparecen en el selector ✎.

## Reglas por tipo

- **Sillones:** UNA imagen con los DOS sillones y un hueco vacío claro entre ellos (la
  herramienta la parte por ese hueco). El de la izquierda es el club bajo, el de la
  derecha el orejero alto, como hoy. Vistos de frente, enteros, sin suelo ni sombra.
- **Mesas:** una sola, vista de frente y un poco desde arriba (se tiene que ver la tapa,
  los libros se apoyan encima), entera, sin nada encima.
- **Alfombras:** rectangular (o de contorno irregular si es piel), vista de frente en
  perspectiva suave, el borde de abajo más ancho, entera, sin suelo.
- **Adornos:** UN objeto de pie, visto de frente, más alto que ancho, vertical. Tiene que
  caber en un estante entre libros. El portarretrato va con el interior VACÍO (crema
  liso) para poder ponerle una foto después.
- Todo con fondo transparente de verdad, sin texto, sin marco.
"""
    io.open(os.path.join(D, "LEEME.md"), "w", encoding="utf-8").write(leeme)
    print("sillones", len(SILLONES), "mesas", len(MESAS), "alfombras", len(ALFOMBRAS), "adornos", len(ADORNOS), "+ CATALOGO.md, LEEME.md y referencias en", D)

if __name__ == "__main__":
    main()
