# -*- coding: utf-8 -*-
"""
EL CATÁLOGO DE FONDOS DE LA SALA: paredes (solo papel tapiz con zócalo, SIN ventana), ventanas
con cortinas (una pieza suelta con fondo transparente, como los sillones) y pisos (limpios).
Escribe en OneDrive/Escritorio/Sala del libro (o en la carpeta que se pase como argumento) un
PEDIDO listo para pegar en ChatGPT por cada variante (Paredes/, Ventanas/, Pisos/) y CATALOGO.md.
Cada pedido adjunta DOS referencias: el boceto de composición (la pieza tal como la dibuja hoy el
CSS, que NO hay que copiar) y referencia_estilo.png (los muebles y un gato ya pintados: el
acabado que sí queremos). Para añadir una variante: una entrada más en PAREDES, VENTANAS o
PISOS y volver a correrlo. Las imágenes que vuelvan entran con _tools/fondo.py.

Uso:  python _tools/catalogo_fondos.py [carpeta]
"""
import io, os, sys

D = sys.argv[1] if len(sys.argv) > 1 else r"C:/Users/basti/OneDrive/Escritorio/Sala del libro"

PARED_T = """ADJUNTAR (las dos):
  1. referencia_pared.png    (SOLO un BOCETO: el muro empapelado tal como está hoy, con su zócalo abajo. NO es el acabado: es un dibujo plano hecho por código y NO hay que copiarlo)
  2. referencia_estilo.png   (los muebles y un gato de la sala, ya pintados: ESE es el acabado que queremos, pictórico, realista y con volumen)

PEGAR ESTE TEXTO:

Genera ahora una imagen. No describas, no esperes más material.

Pinta SOLO una pared empapelada de una sala de lectura, vista de frente, 1536 x 1024 píxeles (apaisada), de borde a borde, SIN ventana, sin puertas, sin cuadros, sin muebles, sin piso, sin personas, sin texto: solo el papel tapiz y, en el borde de abajo, {zocalo} con molduras (como en el boceto adjunto). La primera imagen adjunta es solo un boceto de la composición: NO copies su dibujo plano. Píntala con el acabado de la segunda imagen adjunta (los muebles): ilustración realista y pictórica, con textura y luz, como un cuadro de libro de cuentos de alta calidad.

Papel tapiz de esta variante: {papel} El patrón se repite parejo por toda la pared, con relieve sutil y textura de tela o papel, más iluminado en el centro y más oscuro hacia los bordes. {luz}

Estilo: ilustración digital realista y pictórica, de libro de cuentos elegante y romántico, mate (sin brillos de plástico), con textura creíble. PROHIBIDO: dibujo plano, vectorial o de cartón; colores lisos sin textura; contornos negros; ventanas, cortinas, cuadros, lámparas o muebles. Solo la pared, llenando todo el cuadro, sin marco ni bordes.

SI RESPONDE CON TEXTO: contestar solo "Genera la imagen ahora".

GUARDAR EL RESULTADO COMO:  pared_{clave}.png   (en la carpeta "Sala del libro", junto al LEEME)
"""

VENTANA_T = """ADJUNTAR (las dos):
  1. referencia_ventana.png  (SOLO un BOCETO de la pieza: la ventana de arco con sus cortinas recogidas, la cenefa y la barra, tal como está hoy. NO es el acabado: es un dibujo plano hecho por código y NO hay que copiarlo)
  2. referencia_estilo.png   (los muebles y un gato de la sala, ya pintados: ESE es el acabado que queremos, pictórico, realista y con volumen)

PEGAR ESTE TEXTO:

Genera ahora una imagen. No describas, no esperes más material.

Pinta UNA SOLA PIEZA con fondo transparente, 1024 x 1536 píxeles (vertical), vista de frente y a la altura de los ojos: una ventana de arco de medio punto con sus cortinas, con la misma composición del boceto adjunto (el arco, las dos cortinas recogidas a media altura, la cenefa festoneada arriba y la barra con remates), pero NO copies su dibujo plano ni sus formas de cartón: píntala con el acabado de la segunda imagen adjunta (los muebles): ilustración realista y pictórica, con volumen, textura, profundidad y luz.

La pieza de esta variante: un marco de madera {marco}, con molduras y grosor real (se ven el alféizar y el canto), cristales divididos por listones finos y el vidrio reflejando apenas la luz; a través del vidrio, {cielo}, pintado con profundidad atmosférica. A cada lado, {cortinas}, de tela pesada con pliegues y caída naturales, que cuelgan un poco por debajo del alféizar; arriba, {cenefa}. {luz}

La pieza va centrada, entera, con un poco de aire alrededor, y TODO lo que no sea la pieza es transparente: sin pared, sin papel tapiz, sin piso, sin muebles, sin personas, sin texto. Las sombras solo sobre la propia pieza (nada de sombra proyectada sobre una pared que no existe).

Estilo: ilustración digital realista y pictórica, de libro de cuentos elegante y romántico, mate, con texturas creíbles (madera, terciopelo, vidrio). PROHIBIDO: dibujo plano, vectorial, de cartón o de teatro de títeres; contornos negros; fondo de color.

SI RESPONDE CON TEXTO: contestar solo "Genera la imagen ahora".

GUARDAR EL RESULTADO COMO:  ventana_{clave}.png   (en la carpeta "Sala del libro", junto al LEEME)
"""

PISO_T = """ADJUNTAR (las dos):
  1. referencia_piso.png     (SOLO un BOCETO de la perspectiva y el encuadre del piso. NO es el acabado: es un dibujo plano hecho por código y NO hay que copiarlo)
  2. referencia_estilo.png   (los muebles y un gato de la sala, ya pintados: ESE es el acabado que queremos)

PEGAR ESTE TEXTO:

Genera ahora una imagen. No describas, no esperes más material.

Pinta SOLO el piso de una sala de lectura, 1536 x 1024 píxeles (apaisada), visto de frente desde la altura de los ojos de alguien sentado, con la perspectiva suave de la primera imagen adjunta (que es solo un boceto: NO copies su dibujo plano) y el acabado pictórico y realista de la segunda imagen adjunta (los muebles): {material} Que se note el material de verdad (veta, juntas, desgaste, pequeñas irregularidades) y un brillo mate muy sutil. Luz tenue y pareja de noche, sin charco de luna, sin reflejos fuertes. La imagen es solo piso de borde a borde: sin pared, sin zócalo, sin alfombra, sin muebles, sin objetos, sin sombras de nada, sin personas, sin texto.

Estilo: ilustración digital realista y pictórica, de libro de cuentos, mate, con textura creíble. PROHIBIDO: dibujo plano, vectorial, rayas lisas sin veta, contornos negros.

SI RESPONDE CON TEXTO: contestar solo "Genera la imagen ahora".

GUARDAR EL RESULTADO COMO:  piso_{clave}.png   (en la carpeta "Sala del libro", junto al LEEME)
"""

LUZ = "Luz suave y pareja de noche, un poco más clara en el centro."
PAREDES = [
 dict(n=1, clave="vino", nombre="Vino clásico (la de hoy)", para="neutra y elegante, para los dos", colores="vino, rojo, dorado",
  papel="vino oscuro con un damasco de rombos muy tenue, apenas más claro que el fondo.", zocalo="un zócalo de madera oscura", luz=LUZ),
 dict(n=2, clave="azul", nombre="Azul noche y dorado", para="sobria, para él (o para los dos)", colores="azul marino, dorado",
  papel="azul marino profundo con un patrón tenue de estrellas y flores de lis doradas.", zocalo="un zócalo de madera oscura", luz=LUZ),
 dict(n=3, clave="esmeralda", nombre="Verde esmeralda y oro", para="elegante, para los dos", colores="verde esmeralda, oro",
  papel="verde esmeralda oscuro con un damasco de hojas doradas muy tenue.", zocalo="un zócalo de madera oscura", luz=LUZ),
 dict(n=4, clave="rosa", nombre="Rosa empolvado", para="dulce y romántica, para ella", colores="rosa empolvado, marfil",
  papel="rosa empolvado con rayas finas color marfil y ramitos de flores pequeñas entre las rayas.", zocalo="un zócalo de madera pintada de blanco", luz="Luz suave y cálida, un poco más clara en el centro."),
 dict(n=5, clave="lavanda", nombre="Lavanda y violetas", para="romántica, para ella", colores="lila, violeta, blanco",
  papel="lila suave con un patrón tenue de violetas y hojitas.", zocalo="un zócalo de madera pintada de blanco", luz="Luz fría y suave, un poco más clara en el centro."),
 dict(n=6, clave="perla", nombre="Gris perla y dorado", para="elegante y neutra, para los dos", colores="gris perla, dorado",
  papel="gris perla con un damasco dorado muy tenue.", zocalo="un zócalo de madera blanca", luz=LUZ),
 dict(n=7, clave="chocolate", nombre="Chocolate y crema", para="cálida y sobria, para él", colores="chocolate, crema, café",
  papel="paneles de madera color chocolate en el tercio de abajo y, en el resto, papel crema con rayas finas color café.", zocalo="un zócalo de madera chocolate", luz="Luz cálida y suave, un poco más clara en el centro."),
 dict(n=8, clave="primavera", nombre="Primavera (cerezos en flor)", para="estación: primavera; alegre, para ella", colores="verde menta, rosa, blanco",
  papel="verde menta claro con un patrón tenue de ramas de cerezo en flor rosa.", zocalo="un zócalo de madera blanca", luz="Luz suave de mañana, un poco más clara en el centro."),
 dict(n=9, clave="verano", nombre="Verano (girasoles)", para="estación: verano; luminosa, para los dos (guiño al libro de girasoles)", colores="celeste, blanco, amarillo sol",
  papel="celeste con rayas finas blancas y girasoles pequeños dibujados entre las rayas.", zocalo="un zócalo de madera blanca", luz="Luz cálida y dorada de atardecer, un poco más clara en el centro."),
 dict(n=10, clave="otono", nombre="Otoño (hojas)", para="estación: otoño; cálida, para los dos", colores="ocre ámbar, óxido, dorado",
  papel="ocre ámbar con un patrón tenue de hojas de arce que caen.", zocalo="un zócalo de madera oscura", luz="Luz cálida y anaranjada, un poco más clara en el centro."),
 dict(n=11, clave="invierno", nombre="Invierno (copos)", para="estación: invierno; fría y serena, para los dos", colores="azul hielo, blanco, plata",
  papel="azul hielo con un patrón tenue de copos de nieve plateados.", zocalo="un zócalo de madera blanca", luz="Luz fría y azulada, un poco más clara en el centro."),
 dict(n=12, clave="navidad", nombre="Navidad", para="fiesta: Navidad; cálida y festiva", colores="rojo profundo, dorado",
  papel="rojo profundo con un damasco dorado tenue.", zocalo="un zócalo de madera oscura", luz="Luz cálida, un poco más clara en el centro."),
 dict(n=13, clave="sanvalentin", nombre="San Valentín", para="fiesta: 14 de febrero; romántica", colores="rosa viejo, rojo rosado, dorado",
  papel="rosa viejo con un patrón tenue de corazones pequeños y rosas.", zocalo="un zócalo de madera blanca", luz="Luz cálida y rosada, un poco más clara en el centro."),
]
LUZV = "Luz fría suave de luna que entra por el vidrio y baña las cortinas."
VENTANAS = [
 dict(n=1, clave="vino", nombre="Terciopelo rojo y luna (la de hoy)", para="con vino, navidad, chocolate", colores="rojo, dorado, noche azul",
  marco="oscura", cielo="un cielo nocturno azul profundo con estrellas pequeñas y una luna creciente color crema que ilumina",
  cortinas="una cortina de terciopelo rojo con pliegues, recogida a media altura con un lazo dorado",
  cenefa="una cenefa roja festoneada con filo dorado y una barra de cortina dorada con remates redondos", luz=LUZV),
 dict(n=2, clave="crema", nombre="Terciopelo crema y dorado", para="con azul, perla, esmeralda", colores="crema, dorado, noche índigo",
  marco="oscura", cielo="un cielo nocturno índigo con muchas estrellas y una luna creciente dorada",
  cortinas="una cortina de terciopelo crema con pliegues, recogida a media altura con un cordón dorado con borlas",
  cenefa="una cenefa crema festoneada con filo dorado y una barra dorada con remates redondos", luz=LUZV),
 dict(n=3, clave="esmeralda", nombre="Mostaza y verde", para="con esmeralda, perla, otoño", colores="mostaza, verde oscuro, bronce",
  marco="oscura", cielo="un cielo nocturno azul profundo con estrellas y una luna creciente color crema",
  cortinas="una cortina de terciopelo mostaza dorado con pliegues, recogida a media altura con un lazo verde oscuro",
  cenefa="una cenefa dorada festoneada con filo verde y una barra de bronce con remates redondos", luz=LUZV),
 dict(n=4, clave="rosa", nombre="Gasa marfil y lazos rosa", para="con rosa, San Valentín, lavanda", colores="marfil, rosa, dorado, atardecer",
  marco="blanca", cielo="un cielo de atardecer rosa y lavanda con las primeras estrellas y una luna creciente blanca",
  cortinas="una cortina de gasa marfil con pliegues suaves, recogida a media altura con un lazo rosa",
  cenefa="una cenefa rosa festoneada con filo dorado y una barra dorada con remates en forma de rosa", luz="Luz suave y cálida de atardecer que entra por el vidrio."),
 dict(n=5, clave="lavanda", nombre="Violeta y plata, luna llena", para="con lavanda, rosa, perla", colores="violeta claro, blanco, plata",
  marco="blanca", cielo="un cielo nocturno azul violeta con estrellas y una luna llena grande color crema",
  cortinas="una cortina de terciopelo violeta claro con pliegues, recogida a media altura con un lazo blanco",
  cenefa="una cenefa lila festoneada con filo plateado y una barra plateada con remates redondos", luz="Luz fría de luna llena que entra por el vidrio y baña las cortinas."),
 dict(n=6, clave="chocolate", nombre="Caramelo y cuero", para="con chocolate, otoño, vino", colores="caramelo, cuero, bronce",
  marco="chocolate", cielo="un cielo nocturno azul profundo con estrellas y una luna creciente dorada",
  cortinas="una cortina de terciopelo caramelo con pliegues, recogida a media altura con una cinta de cuero",
  cenefa="una cenefa café festoneada con filo dorado y una barra de bronce con remates redondos", luz=LUZV),
 dict(n=7, clave="primavera", nombre="Lino blanco y cerezo en flor", para="estación: primavera; con primavera, rosa, verano", colores="blanco, verde, rosa, amanecer",
  marco="blanca", cielo="un amanecer rosado y celeste con una rama de cerezo en flor asomando por un lado y pétalos volando",
  cortinas="una cortina de lino blanco con pliegues, recogida a media altura con un lazo verde",
  cenefa="una cenefa verde menta festoneada con filo rosa y una barra dorada con remates redondos", luz="Luz suave de mañana que entra por el vidrio."),
 dict(n=8, clave="verano", nombre="Lino amarillo y atardecer en el mar", para="estación: verano; con verano, primavera", colores="amarillo sol, blanco, dorado",
  marco="blanca", cielo="un atardecer dorado sobre el mar en calma, con el sol bajo y unas gaviotas lejanas",
  cortinas="una cortina de lino amarillo sol con pliegues, recogida a media altura con un lazo blanco",
  cenefa="una cenefa amarilla festoneada con filo blanco y una barra de madera clara con remates redondos", luz="Luz cálida y dorada de atardecer que entra por el vidrio."),
 dict(n=9, clave="otono", nombre="Óxido y luna de cosecha", para="estación: otoño; con otoño, chocolate, vino", colores="óxido, dorado, naranja",
  marco="oscura", cielo="un cielo nocturno azul oscuro con una luna de cosecha grande y anaranjada y ramas de arce rojizas asomando",
  cortinas="una cortina de terciopelo óxido con pliegues, recogida a media altura con un cordón dorado",
  cenefa="una cenefa café rojizo festoneada con filo dorado y una barra de bronce con remates de bellota", luz="Luz cálida de luna anaranjada que entra por el vidrio."),
 dict(n=10, clave="invierno", nombre="Blanco con piel y nevada", para="estación: invierno; con invierno, perla, azul", colores="blanco, plata, azul hielo",
  marco="blanca con escarcha", cielo="una noche de nevada suave con copos cayendo, una luna pálida y escarcha en los bordes del vidrio",
  cortinas="una cortina de terciopelo blanco con pliegues y borde de piel suave, recogida a media altura con un lazo plateado",
  cenefa="una cenefa blanca festoneada con filo plateado y una barra plateada con remates de copo de nieve", luz="Luz fría y azulada de la nieve que entra por el vidrio."),
 dict(n=11, clave="navidad", nombre="Verde abeto con guirnalda", para="fiesta: Navidad; con navidad, vino, esmeralda", colores="verde abeto, rojo, dorado",
  marco="oscura, con una guirnalda de pino y lucecitas cálidas alrededor del marco", cielo="una noche nevada con estrellas, una luna creciente y una estrella más brillante que las demás",
  cortinas="una cortina de terciopelo verde abeto con pliegues, recogida a media altura con un lazo rojo y dorado",
  cenefa="una cenefa roja festoneada con filo dorado, con acebo y bayas rojas colgando, y una barra dorada con remates de estrella", luz="Luz cálida de las lucecitas y luz fría de luna por el vidrio."),
 dict(n=12, clave="sanvalentin", nombre="Rojo rosado y pétalos", para="fiesta: 14 de febrero; con San Valentín, rosa", colores="rojo rosado, rosa claro, dorado",
  marco="blanca", cielo="un atardecer rosa y dorado con las primeras estrellas, una luna creciente y pétalos de rosa volando",
  cortinas="una cortina de terciopelo rojo rosado con pliegues, recogida a media altura con un lazo rosa claro",
  cenefa="una cenefa roja festoneada con filo dorado y una barra dorada con remates en forma de corazón", luz="Luz cálida y rosada que entra por el vidrio."),
]
PISOS = [
 dict(n=1, clave="nogal", nombre="Nogal oscuro (el de hoy)", para="neutro y elegante", combina="vino, esmeralda, azul, otoño, navidad",
  material="tablones de madera de nogal oscuro, cálidos, que corren de frente hacia el fondo (las juntas convergen apenas hacia arriba), veta sutil, acabado mate, un poco gastado."),
 dict(n=2, clave="roble", nombre="Roble claro miel", para="cálido y luminoso", combina="primavera, verano, chocolate, perla",
  material="tablones anchos de roble claro color miel, veta suave y nudos pequeños, acabado mate, que corren de frente hacia el fondo (las juntas convergen apenas hacia arriba)."),
 dict(n=3, clave="cerezo", nombre="Cerezo rojizo", para="romántico y cálido", combina="rosa, San Valentín, navidad, vino",
  material="tablones de madera de cerezo rojiza, cálida, apenas satinada, veta fina, que corren de frente hacia el fondo (las juntas convergen apenas hacia arriba)."),
 dict(n=4, clave="espiga", nombre="Parquet en espiga", para="elegante, para él o para los dos", combina="perla, azul, esmeralda, chocolate",
  material="parquet de roble medio colocado en espiga (tablillas en zigzag), acabado mate, en perspectiva suave hacia el fondo."),
 dict(n=5, clave="blanco", nombre="Tablones blancos envejecidos", para="romántico y claro, para ella", combina="rosa, lavanda, primavera, invierno",
  material="tablones de madera pintada de blanco envejecido, con la pintura algo desgastada dejando ver la veta, acabado mate, que corren de frente hacia el fondo (las juntas convergen apenas hacia arriba)."),
 dict(n=6, clave="gris", nombre="Gris ceniza", para="sobrio, para él", combina="perla, azul, invierno",
  material="tablones de madera gris ceniza, veta visible y suave, acabado mate, que corren de frente hacia el fondo (las juntas convergen apenas hacia arriba)."),
 dict(n=7, clave="damero", nombre="Damero de mármol crema y café", para="muy elegante", combina="perla, esmeralda, chocolate, navidad",
  material="baldosas de mármol en damero, crema y café oscuro, con vetas sutiles, acabado mate, en perspectiva suave hacia el fondo."),
 dict(n=8, clave="terracota", nombre="Baldosa de terracota", para="cálido y rústico", combina="otoño, verano, chocolate",
  material="baldosas cuadradas de terracota naranja tostado con juntas claras, acabado mate, algo gastadas, en perspectiva suave hacia el fondo."),
]

def escribir(carpeta, prefijo, lista, plantilla):
    os.makedirs(os.path.join(D, carpeta), exist_ok=True)
    for p in lista:
        nombre = "PEDIDO %s - %02d %s.txt" % (prefijo, p["n"], p["nombre"].split(" (")[0])
        io.open(os.path.join(D, carpeta, nombre), "w", encoding="utf-8").write(plantilla.format(**p))

def main():
    escribir("Paredes", "pared", PAREDES, PARED_T)
    escribir("Ventanas", "ventana", VENTANAS, VENTANA_T)
    escribir("Pisos", "piso", PISOS, PISO_T)
    cat = ["# Catálogo de paredes, ventanas y pisos de la sala", "",
     "Tres piezas independientes que se mezclan libremente: la PARED (solo papel tapiz con su",
     "zócalo, sin ventana), la VENTANA con sus cortinas (una pieza suelta con fondo transparente,",
     "como los sillones) y el PISO (limpio). Todas en el mismo estilo (ilustración de cuento,",
     "realista y pictórica, elegante y romántica). Cada fila tiene su `PEDIDO` listo para pegar en",
     "ChatGPT (carpetas `Paredes/`, `Ventanas/` y `Pisos/`); cada pedido adjunta el BOCETO de la",
     "pieza (que NO hay que copiar) y `referencia_estilo.png` (el acabado que sí queremos). Los",
     "resultados se guardan en esta carpeta con el nombre de la columna **Archivo**.", "",
     "## Paredes (solo papel tapiz, sin ventana)", "",
     "| # | Pared | Para quién / cuándo | Colores | Archivo |", "|---|---|---|---|---|"]
    for p in PAREDES:
        cat.append("| %02d | %s | %s | %s | `pared_%s.png` |" % (p["n"], p["nombre"], p["para"], p["colores"], p["clave"]))
    cat += ["", "## Ventanas con cortinas (pieza suelta, fondo transparente)", "",
     "| # | Ventana | Va bien con | Colores | Archivo |", "|---|---|---|---|---|"]
    for p in VENTANAS:
        cat.append("| %02d | %s | %s | %s | `ventana_%s.png` |" % (p["n"], p["nombre"], p["para"], p["colores"], p["clave"]))
    cat += ["", "## Pisos (limpios, sin alfombra ni muebles)", "", "| # | Piso | Carácter | Combina con | Archivo |", "|---|---|---|---|---|"]
    for p in PISOS:
        cat.append("| %02d | %s | %s | %s | `piso_%s.png` |" % (p["n"], p["nombre"], p["para"], p["combina"], p["clave"]))
    cat += ["", "## Parejas sugeridas (pared + ventana + piso)", "",
     "- **Para ella:** rosa + gasa marfil + blancos envejecidos · lavanda + violeta y plata + blancos · primavera + lino blanco + roble miel · San Valentín + rojo rosado + cerezo.",
     "- **Para él:** azul noche + terciopelo crema + espiga · chocolate + caramelo y cuero + roble miel · perla + terciopelo crema + gris ceniza · esmeralda + mostaza y verde + damero.",
     "- **Para los dos:** vino + terciopelo rojo + nogal (la de hoy) · esmeralda + mostaza y verde + espiga · perla + terciopelo crema + damero.",
     "- **Estaciones y fiestas:** primavera + cerezo en flor + roble · verano + atardecer en el mar + terracota · otoño + luna de cosecha + nogal · invierno + nevada + gris ceniza · Navidad + guirnalda + cerezo (o damero) · San Valentín + pétalos + cerezo.",
     "- Y cualquier otra mezcla: las tres piezas son independientes.", "",
     "## Cómo entran en la página", "",
     "Cada imagen se convierte con `python _tools/fondo.py <imagen> pared|ventanal|suelo <variante>`",
     "(en `Documents/libro`), que la deja en `assets/fondos/` (la ventana conserva su transparencia).",
     "Cuando haya más de un juego, la página tendrá un selector para elegir pared, ventana y piso",
     "(y, si se quiere, cambiar solos por estación). Mientras tanto, las primeras que lleguen se",
     "activan a mano en `DECORACION` (`libros.js`).", ""]
    io.open(os.path.join(D, "CATALOGO.md"), "w", encoding="utf-8").write("\n".join(cat))
    print("paredes", len(PAREDES), "ventanas", len(VENTANAS), "pisos", len(PISOS), "+ CATALOGO.md en", D)

if __name__ == "__main__":
    main()
