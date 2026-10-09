---
name: libro-mascota
description: Añade una raza de mascota nueva al catálogo de la sala del libro (fila en el Excel, bocetos, pedidos por pose para ChatGPT y, cuando lleguen las imágenes, el montaje en piezas) o pone una mascota del catálogo en la sala con su nombre. Usar cuando el usuario pida "un gato nuevo", "otra raza", "prompts para ilustrar a <gato>", "pon a <nombre> en la sala" o similar.
---

# Una raza nueva (o una mascota nueva en la sala)

Fábrica: `C:\Users\basti\Documents\libro`. En el catálogo las mascotas son RAZAS (hoja Mascotas del
Excel → `RAZAS` en `catalogo.js`); en la sala, `MASCOTAS` en `libros.js` es la lista de la pareja:
`{ raza, nombre }` (y opcional `caracter`). Hoy hay cuatro razas: atigrado, carey, tricolor, vancafe.
Cada raza tiene tres imágenes: de pie (se corta en 5 piezas y el esqueleto la anima), echada y
sentada (enteras). Las dibuja ChatGPT a partir de un boceto por pose y la foto real.

## Solo poner en la sala una raza que ya existe

Añadir `{ raza: "<clave>", nombre: "<nombre que dio el usuario>" }` a `MASCOTAS` en `libros.js`
(si hay dos de la misma raza, los ids se derivan solos). Test `?test=1`, captura con `?semilla=7`
mirada en PC y celular (el gato camina, se sienta, duerme), commit. Listo.

## Una raza nueva, de principio a fin

1. **El pelaje de respaldo.** Si el pelaje es uno de los existentes (`atigrado`, `carey`, `tricolor`,
   `van_cafe`) se reutiliza. Si es distinto (negro, blanco, siamés, naranja...), hay que escribir una
   receta nueva en `PELAJES` de `gatos.js`, copiando la estructura de la más parecida (es una función del
   marco del cuerpo: caja, espina, cola; con rama `F.frontal` para el sentado). Es código: probar con
   `?plantilla=<clave>&pose=parado&estilo=color` y mirar.
2. **La fila** (Excel cerrado):
   ```
   python _tools/catalogo.py --fila mascota clave=<clave> nombre="<Raza>" para="<carácter en dos palabras>" especie=gato pelaje=<receta> pelaje_es="<descripción detallada en español del pelaje real: colores, manchas, cara, cola, ojos>" pelaje_en="<lo mismo en inglés, corto>" pereza=0.5 velocidad=1 sillon=rojo voz=
   ```
   `pelaje_es` es lo que ChatGPT lee: concreto y fiel a la foto. `pereza` 0-1 (cuánto duerme),
   `velocidad` (1 normal), `sillon` rojo|amarillo|vacío, `voz` (1 normal, menos = más grave).
3. **Los bocetos:** `node _tools/plantillas_gatos.js <clave>` deja 13 PNG en `_capturas/plantillas_gatos/`
   (color, líneas y silueta por pose + piezas de la pose de pie). Copiarlos a
   `Taller del libro\Mascotas\<nn> <Raza>\` (la carpeta la crea `python _tools/catalogo.py`, que
   también escribe allí `PEDIDO parado|echado|sentado - <Raza>.txt` y `<Raza>.md`).
4. **La foto real:** pedir al usuario la foto del animal; guardarla como `foto_referencia.jpg` en esa
   carpeta y una copia en `privado/gatos/referencia/` (fuera de git). Sin foto no hay pedido.
5. **Decir al usuario** qué hacer: primero `PEDIDO parado` (adjunta el boceto de pie y la foto), guardar
   como `<clave>_parado.png` en `Bandeja\`; después echado y sentado (adjuntan además la de pie que ya
   salió, para que sea el mismo animal).
6. **Cuando lleguen:** `/libro-bandeja` con `<clave>_parado` primero (mirar `_capturas/piezas_<clave>.png`:
   los cortes de cola, patas traseras, patas delanteras, cuerpo y cabeza; si uno cae mal,
   `python _tools/gato_piezas.py <imagen> <clave> --ycut F --xsplit F --xcuello F --ybarbilla F` y mirar
   otra vez), luego `<clave>_echado` y `<clave>_sentado`.
7. Si la mascota es para ESTA sala, el paso "solo poner en la sala". Commit narrativo, sin push salvo pedido.

## Reglas

- Las plantillas (`_color`, `_lineas`, `_silueta`, `_pieza_*`) se quedan en PNG; los originales de
  ChatGPT los guarda la bandeja como WebP sin pérdida.
- Una raza sin imagen de pie funciona igual con el dibujo por código (se ve el SVG del pelaje).
- Los nombres propios (Karencito, Elma, Mia, Chunchun) son de la pareja, no de la raza.
