# -*- coding: utf-8 -*-
# Genera el catálogo de paredes y pisos de la sala (un PEDIDO por variante) en
# OneDrive\Escritorio\Sala del libro: Paredes/, Pisos/, el pedido vertical genérico y CATALOGO.md.
import io, os
D = r"C:/Users/basti/OneDrive/Escritorio/Sala del libro"
os.makedirs(os.path.join(D, "Paredes"), exist_ok=True)
os.makedirs(os.path.join(D, "Pisos"), exist_ok=True)
for viejo in ("PEDIDO pared apaisada (PC).txt", "PEDIDO piso.txt", "PEDIDO pared vertical (celular).txt"):
    p = os.path.join(D, viejo)
    if os.path.exists(p):
        os.remove(p); print("borrado", viejo)

PARED_T = """ADJUNTAR: referencia_pared.png (SOLO la pared con su ventana y sus cortinas tal como está hoy: para que copie el ESTILO y el encuadre; los colores de esta variante son los que dice el texto)

PEGAR ESTE TEXTO:

Genera ahora una imagen. No describas, no esperes más material.

Pinta SOLO la pared del fondo de una sala de lectura, vista de frente y a la altura de los ojos, 1536 x 1024 píxeles (apaisada), con el mismo estilo, el mismo encuadre y la misma ventana que la imagen adjunta, pero con estos colores: {papel} En el borde de abajo, {zocalo}. En el centro, una ventana alta de arco redondo con marco de madera {marco}; a través del vidrio, {cielo}. A cada lado de la ventana, {cortinas}; arriba, {cenefa}. ENCUADRE: la ventana ocupa más o menos la mitad del ancho, centrada, y va en los dos tercios superiores de la imagen; el tercio inferior es pared lisa empapelada, sin nada, porque ahí se apoyan los sillones. {luz}

Estilo: ilustración de libro de cuentos, mate, pictórica, formas limpias, poco detalle fino, elegante y romántica, con la misma pincelada que la imagen adjunta. Sin muebles, sin piso, sin alfombra, sin personas, sin gatos, sin texto. Solo la pared con su ventana y sus cortinas, llenando todo el cuadro de borde a borde, sin marco ni bordes.

SI RESPONDE CON TEXTO: contestar solo "Genera la imagen ahora".

GUARDAR EL RESULTADO COMO:  pared_{clave}.png   (en la carpeta "Sala del libro", junto al LEEME)
"""
PISO_T = """ADJUNTAR: referencia_piso.png (SOLO el piso tal como está hoy, limpio: para que copie el estilo, el encuadre y la perspectiva; el material y el color de esta variante son los que dice el texto)

PEGAR ESTE TEXTO:

Genera ahora una imagen. No describas, no esperes más material.

Pinta SOLO el piso de una sala de lectura, 1536 x 1024 píxeles (apaisada), visto de frente desde la altura de los ojos de alguien sentado, en perspectiva suave como la imagen adjunta: {material} Luz tenue y pareja de noche, sin charco de luna, sin reflejos fuertes. La imagen es solo piso de borde a borde: sin pared, sin zócalo, sin alfombra, sin muebles, sin objetos, sin sombras de nada, sin personas, sin texto.

Estilo: ilustración de libro de cuentos, mate, pictórica, formas limpias, con la misma pincelada que la imagen adjunta.

SI RESPONDE CON TEXTO: contestar solo "Genera la imagen ahora".

GUARDAR EL RESULTADO COMO:  piso_{clave}.png   (en la carpeta "Sala del libro", junto al LEEME)
"""
LUZ = "Luz fría suave de luna que entra por la ventana y sombras cálidas en la pared."
PAREDES = [
 dict(n=1, clave="vino", nombre="Vino clásico (la de hoy)", para="neutra y elegante, para los dos", colores="vino, rojo, dorado",
  papel="la pared empapelada de vino oscuro con un damasco de rombos muy tenue.", zocalo="un zócalo de madera oscura", marco="oscura",
  cielo="un cielo nocturno azul profundo con estrellas pequeñas y una luna creciente color crema que ilumina",
  cortinas="una cortina de terciopelo rojo con pliegues, recogida a media altura con un lazo dorado",
  cenefa="una cenefa roja festoneada con filo dorado y una barra de cortina dorada con remates redondos", luz=LUZ),
 dict(n=2, clave="azul", nombre="Azul noche y dorado", para="sobria, para él (o para los dos)", colores="azul marino, crema, dorado",
  papel="la pared empapelada de azul marino profundo con un patrón tenue de estrellas y flores de lis doradas.", zocalo="un zócalo de madera oscura", marco="oscura",
  cielo="un cielo nocturno índigo con muchas estrellas y una luna creciente dorada",
  cortinas="una cortina de terciopelo crema con pliegues, recogida a media altura con un cordón dorado con borlas",
  cenefa="una cenefa crema festoneada con filo dorado y una barra dorada con remates redondos", luz=LUZ),
 dict(n=3, clave="esmeralda", nombre="Verde esmeralda y oro", para="elegante, para los dos", colores="verde esmeralda, mostaza, oro",
  papel="la pared empapelada de verde esmeralda oscuro con un damasco de hojas doradas muy tenue.", zocalo="un zócalo de madera oscura", marco="oscura",
  cielo="un cielo nocturno azul profundo con estrellas y una luna creciente color crema",
  cortinas="una cortina de terciopelo mostaza dorado con pliegues, recogida a media altura con un lazo verde oscuro",
  cenefa="una cenefa dorada festoneada con filo verde y una barra de bronce con remates redondos", luz=LUZ),
 dict(n=4, clave="rosa", nombre="Rosa empolvado", para="dulce y romántica, para ella", colores="rosa empolvado, marfil, dorado",
  papel="la pared empapelada de rosa empolvado con rayas finas color marfil y ramitos de flores pequeñas.", zocalo="un zócalo de madera pintada de blanco", marco="blanca",
  cielo="un cielo de atardecer rosa y lavanda con las primeras estrellas y una luna creciente blanca",
  cortinas="una cortina de gasa marfil con pliegues suaves, recogida a media altura con un lazo rosa",
  cenefa="una cenefa rosa festoneada con filo dorado y una barra dorada con remates en forma de rosa", luz="Luz suave y cálida que entra por la ventana y sombras rosadas en la pared."),
 dict(n=5, clave="lavanda", nombre="Lavanda y violetas", para="romántica, para ella", colores="lila, violeta, blanco, plata",
  papel="la pared empapelada de lila suave con un patrón tenue de violetas y hojitas.", zocalo="un zócalo de madera pintada de blanco", marco="blanca",
  cielo="un cielo nocturno azul violeta con estrellas y una luna llena grande color crema",
  cortinas="una cortina de terciopelo violeta claro con pliegues, recogida a media altura con un lazo blanco",
  cenefa="una cenefa lila festoneada con filo plateado y una barra plateada con remates redondos", luz="Luz fría suave de luna que entra por la ventana y sombras violetas en la pared."),
 dict(n=6, clave="perla", nombre="Gris perla y dorado", para="elegante y neutra, para los dos", colores="gris perla, carbón, dorado",
  papel="la pared empapelada de gris perla con un damasco dorado muy tenue.", zocalo="un zócalo de madera blanca", marco="oscura",
  cielo="un cielo nocturno azul profundo con estrellas y una luna creciente color crema",
  cortinas="una cortina de terciopelo gris carbón con pliegues, recogida a media altura con un cordón dorado con borlas",
  cenefa="una cenefa gris festoneada con filo dorado y una barra dorada con remates redondos", luz=LUZ),
 dict(n=7, clave="chocolate", nombre="Chocolate y caramelo", para="cálida y sobria, para él", colores="chocolate, crema, caramelo, bronce",
  papel="la pared con paneles de madera color chocolate en el tercio de abajo y empapelada de crema con rayas finas color café en el resto.", zocalo="un zócalo de madera chocolate", marco="chocolate",
  cielo="un cielo nocturno azul profundo con estrellas y una luna creciente dorada",
  cortinas="una cortina de terciopelo caramelo con pliegues, recogida a media altura con una cinta de cuero",
  cenefa="una cenefa café festoneada con filo dorado y una barra de bronce con remates redondos", luz="Luz cálida en la pared y luz fría de luna por la ventana."),
 dict(n=8, clave="primavera", nombre="Primavera (cerezos en flor)", para="estación: primavera; alegre, para ella", colores="verde menta, rosa, blanco",
  papel="la pared empapelada de verde menta claro con un patrón tenue de ramas de cerezo en flor rosa.", zocalo="un zócalo de madera blanca", marco="blanca",
  cielo="un amanecer rosado y celeste con una rama de cerezo en flor asomando por un lado y pétalos volando",
  cortinas="una cortina de lino blanco con pliegues, recogida a media altura con un lazo verde",
  cenefa="una cenefa verde menta festoneada con filo rosa y una barra dorada con remates redondos", luz="Luz suave de mañana que entra por la ventana y sombras tenues en la pared."),
 dict(n=9, clave="verano", nombre="Verano (girasoles y mar)", para="estación: verano; luminosa, para los dos (guiño al libro de girasoles)", colores="celeste, blanco, amarillo sol",
  papel="la pared empapelada de celeste con rayas finas blancas y girasoles pequeños dibujados entre las rayas.", zocalo="un zócalo de madera blanca", marco="blanca",
  cielo="un atardecer dorado sobre el mar en calma, con el sol bajo y unas gaviotas lejanas",
  cortinas="una cortina de lino amarillo sol con pliegues, recogida a media altura con un lazo blanco",
  cenefa="una cenefa amarilla festoneada con filo blanco y una barra de madera clara con remates redondos", luz="Luz cálida y dorada de atardecer que entra por la ventana."),
 dict(n=10, clave="otono", nombre="Otoño (hojas y luna de cosecha)", para="estación: otoño; cálida, para los dos", colores="ocre ámbar, óxido, dorado",
  papel="la pared empapelada de ocre ámbar con un patrón tenue de hojas de arce que caen.", zocalo="un zócalo de madera oscura", marco="oscura",
  cielo="un cielo nocturno azul oscuro con una luna de cosecha grande y anaranjada y ramas de arce rojizas asomando",
  cortinas="una cortina de terciopelo óxido con pliegues, recogida a media altura con un cordón dorado",
  cenefa="una cenefa café rojizo festoneada con filo dorado y una barra de bronce con remates de bellota", luz="Luz cálida de luna anaranjada que entra por la ventana y sombras cálidas en la pared."),
 dict(n=11, clave="invierno", nombre="Invierno (nevada)", para="estación: invierno; fría y serena, para los dos", colores="azul hielo, blanco, plata",
  papel="la pared empapelada de azul hielo con un patrón tenue de copos de nieve plateados.", zocalo="un zócalo de madera blanca", marco="blanca con escarcha",
  cielo="una noche de nevada suave con copos cayendo, una luna pálida y escarcha en los bordes del vidrio",
  cortinas="una cortina de terciopelo blanco con pliegues y borde de piel suave, recogida a media altura con un lazo plateado",
  cenefa="una cenefa blanca festoneada con filo plateado y una barra plateada con remates de copo de nieve", luz="Luz fría y azulada de la nieve que entra por la ventana."),
 dict(n=12, clave="navidad", nombre="Navidad", para="fiesta: Navidad; cálida y festiva", colores="rojo profundo, verde abeto, dorado",
  papel="la pared empapelada de rojo profundo con un damasco dorado tenue.", zocalo="un zócalo de madera oscura", marco="oscura, con una guirnalda de pino y lucecitas cálidas alrededor del marco",
  cielo="una noche nevada con estrellas, una luna creciente y una estrella más brillante que las demás",
  cortinas="una cortina de terciopelo verde abeto con pliegues, recogida a media altura con un lazo rojo y dorado",
  cenefa="una cenefa roja festoneada con filo dorado, con acebo y bayas rojas colgando, y una barra dorada con remates de estrella", luz="Luz cálida de las lucecitas y luz fría de luna por la ventana."),
 dict(n=13, clave="sanvalentin", nombre="San Valentín", para="fiesta: 14 de febrero; romántica", colores="rosa viejo, rojo rosado, dorado",
  papel="la pared empapelada de rosa viejo con un patrón tenue de corazones pequeños y rosas.", zocalo="un zócalo de madera blanca", marco="blanca",
  cielo="un atardecer rosa y dorado con las primeras estrellas, una luna creciente y pétalos de rosa volando",
  cortinas="una cortina de terciopelo rojo rosado con pliegues, recogida a media altura con un lazo rosa claro",
  cenefa="una cenefa roja festoneada con filo dorado y una barra dorada con remates en forma de corazón", luz="Luz cálida y rosada que entra por la ventana."),
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
for p in PAREDES:
    nombre = "PEDIDO pared - %02d %s.txt" % (p["n"], p["nombre"].split(" (")[0])
    io.open(os.path.join(D, "Paredes", nombre), "w", encoding="utf-8").write(PARED_T.format(**p))
for p in PISOS:
    nombre = "PEDIDO piso - %02d %s.txt" % (p["n"], p["nombre"].split(" (")[0])
    io.open(os.path.join(D, "Pisos", nombre), "w", encoding="utf-8").write(PISO_T.format(**p))

VERT = """ADJUNTAR: referencia_pared_celular.png (SOLO la pared con su ventana en el encuadre del celular, sin muebles ni libreros: para el encuadre) y pared_<variante>.png (la apaisada que ya generaste: para que salga LA MISMA pared, con sus mismos colores)

PEGAR ESTE TEXTO:

Genera ahora una imagen. No describas, no esperes más material.

Pinta LA MISMA pared de la imagen apaisada adjunta (mismo papel, mismos colores, misma ventana, mismas cortinas, mismo cielo, misma pincelada), pero en formato VERTICAL, 1024 x 1536 píxeles, con el encuadre de la otra imagen adjunta (la del celular): vista de frente y a la altura de los ojos, la ventana centrada ocupando unos cuatro quintos del ancho y los dos tercios superiores de la imagen; el tercio inferior es pared lisa empapelada, sin nada, porque ahí se apoyan los sillones.

Sin muebles, sin piso, sin alfombra, sin personas, sin gatos, sin texto. Solo la pared con su ventana y sus cortinas, llenando todo el cuadro de borde a borde, sin marco ni bordes.

SI RESPONDE CON TEXTO: contestar solo "Genera la imagen ahora".

GUARDAR EL RESULTADO COMO:  pared_<variante>_vertical.png   (en la carpeta "Sala del libro", con la misma <variante> que la apaisada: pared_rosa.png -> pared_rosa_vertical.png)
"""
io.open(os.path.join(D, "PEDIDO pared vertical (celular) - cualquier variante.txt"), "w", encoding="utf-8").write(VERT)

cat = ["# Catálogo de paredes y pisos de la sala", "",
 "Todas en el mismo estilo (ilustración de cuento, elegante y romántica) y con la misma ventana;",
 "cambian el papel, las cortinas, lo que se ve por la ventana y el piso. Cada fila tiene su",
 "`PEDIDO` listo para pegar en ChatGPT (carpetas `Paredes/` y `Pisos/`). Los resultados se guardan",
 "en esta carpeta con el nombre de la columna **Archivo**. Para el celular, cada pared tiene",
 "además su versión vertical con el pedido genérico `PEDIDO pared vertical (celular) - cualquier variante.txt`",
 "(se adjunta la apaisada ya hecha y sale la misma pared en 1024 × 1536).", "",
 "## Paredes (con ventana y cortinas)", "",
 "| # | Pared | Para quién / cuándo | Colores | Archivo |", "|---|---|---|---|---|"]
for p in PAREDES:
    cat.append("| %02d | %s | %s | %s | `pared_%s.png` (+ `pared_%s_vertical.png`) |" % (p["n"], p["nombre"], p["para"], p["colores"], p["clave"], p["clave"]))
cat += ["", "## Pisos (limpios, sin alfombra ni muebles)", "", "| # | Piso | Carácter | Combina con | Archivo |", "|---|---|---|---|---|"]
for p in PISOS:
    cat.append("| %02d | %s | %s | %s | `piso_%s.png` |" % (p["n"], p["nombre"], p["para"], p["combina"], p["clave"]))
cat += ["", "## Parejas sugeridas", "",
 "- **Para ella:** rosa + blancos envejecidos · lavanda + blancos envejecidos · primavera + roble miel · San Valentín + cerezo.",
 "- **Para él:** azul noche + espiga · chocolate + roble miel · perla + gris ceniza · esmeralda + damero.",
 "- **Para los dos:** vino + nogal (la de hoy) · esmeralda + espiga · perla + damero.",
 "- **Estaciones y fiestas:** primavera + roble · verano + terracota · otoño + nogal · invierno + gris ceniza · Navidad + cerezo (o damero) · San Valentín + cerezo.", "",
 "## Cómo entran en la página", "",
 "Cada imagen se convierte con `python _tools/fondo.py <imagen> pared|pared_vertical|suelo <variante>`",
 "(en `Documents/libro`), que la deja en `assets/fondos/`. Cuando haya más de un juego, la página",
 "tendrá un selector para elegir la pared y el piso (y, si se quiere, cambiar solos por estación).",
 "Mientras tanto, las primeras que lleguen se activan a mano en `DECORACION` (`libros.js`).", ""]
io.open(os.path.join(D, "CATALOGO.md"), "w", encoding="utf-8").write("\n".join(cat))
print("paredes", len(PAREDES), "pisos", len(PISOS), "+ vertical + CATALOGO.md")
