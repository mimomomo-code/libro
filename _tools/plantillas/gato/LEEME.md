# La plantilla genérica del gato

Estas imágenes son el gato "en blanco" de la sala (`gatos.js`): gris liso, sin
manchas, en sus tres poses, a 1024 × 683 con fondo transparente. Sirven de
base para ilustrar cualquier gato nuevo con IA y como referencia de cómo está
armado el esqueleto. Las plantillas de cada gato real salen con
`node _tools/plantillas_gatos.js` (en `_capturas/plantillas_gatos/`, fuera de git).

| Archivo | Qué es |
|---|---|
| `generico_<pose>_color.png` | el dibujo tal cual (parado y echado de perfil mirando a la derecha; el sentado DE FRENTE, erguido, patas juntas y cola enroscada a un lado, desde el 8 oct) |
| `generico_<pose>_lineas.png` | solo contornos negros: la guía de pose para ControlNet (lineart o scribble) |
| `generico_<pose>_silueta.png` | la silueta en negro: máscara del gato entero |
| `generico_parado_pieza_<cabeza·cuerpo·cola·patas>.png` | la silueta de cada pieza del esqueleto en la pose de pie, para cortar una ilustración en piezas y animarla |

Los contornos, las siluetas y las piezas son IGUALES para todos los gatos (solo
cambia el pelaje), así que valen para cualquier gato nuevo. Se regeneran con
`node _tools/plantillas_gatos.js generico` y copiando aquí los archivos.

## Añadir un gato nuevo

1. En `gatos.js`, dentro de `PELAJES`, una receta nueva: colores (`base`,
   `lejos`, `borde`, `oreja`, `ojos`, `cola`, `voz`) y las funciones `cuerpo(F, u)`,
   `cabeza(u)`, `colaExtra(F, u)` y `pata(lejos, nombre)` que devuelven el SVG de
   las manchas o rayas. `F` es el marco de la pose (caja `bbox`, línea del lomo
   `espina`, cola), así la misma receta viste las tres poses; los ayudantes
   `rel`, `elipseRel` y `motas` colocan manchas por fracciones de la caja.
2. En `libros.js`, una entrada más en `GATOS` con su `id`, `pelaje` y `caracter`.
3. `node _tools/plantillas_gatos.js <id>` para sus plantillas, si se va a ilustrar.

## Añadir otro animal

El esqueleto es un conjunto de poses (`POSES` en `gatos.js`: silueta del
cuerpo, caja, espina, cola, dónde va la cabeza, qué patas tiene) más una
cabeza común y las recetas de pelaje. Un perro, un conejo o un pájaro es un
archivo hermano con sus propias poses y cabeza (la cabeza del gato no sirve) y
la misma maquinita de estados; conviene copiar `gatos.js`, cambiar los dibujos
y dejar la lógica de la sala (caja del suelo, mesa, sillones, toque) tal cual.
