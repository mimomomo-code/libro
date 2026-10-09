---
name: libro-pedido
description: Añade una variante nueva al catálogo de la sala del libro (una pared, ventana, piso, pareja de sillones, mesa, alfombra o adorno) y deja su PEDIDO listo para pegar en ChatGPT. Usar cuando el usuario pida "un prompt/pedido para una pared nueva", "añade al catálogo una alfombra ...", "quiero una ventana de ..." o cualquier pieza nueva de la sala que no sea una mascota (para mascotas, /libro-mascota).
---

# Una variante nueva del catálogo de la sala

Proyecto: `C:\Users\basti\Documents\libro` (la fábrica). La fuente de verdad es el Excel
`catalogo/catalogo.xlsx`; NUNCA se edita a mano `catalogo.js` ni los PEDIDO del Taller: los escribe
`python _tools/catalogo.py`. El Taller está en `C:\Users\basti\OneDrive\Escritorio\Taller del libro`.

## Pasos

1. **Mirar cómo están escritas las filas vecinas.** Leer en `catalogo/catalogo.json` la lista
   `piezas.<familia>` (familias: pared, ventana, piso, sillones, mesa, alfombra, adorno) y la plantilla
   `plantillas.<familia>` para ver qué `{campos}` rellena. Imitar el tono y el nivel de detalle de las
   filas existentes: descripciones en español, concretas (material, color, patrón, luz), pictóricas,
   de una o dos frases, terminadas en punto. Las claves de hoy son el estilo de nombre a seguir.
2. **Componer la fila:**
   - `clave`: minúsculas, sin tildes ni espacios, corta (`marina`, `tartan`, `candelabro`). Única en su hoja.
   - `nombre`: como en el catálogo ("Azul marina y plata", "Tartán y verde abeto").
   - `para`: para quién o cuándo ("sobria, para él", "estación: otoño; cálida", "fiesta: Navidad"), y con
     qué otras piezas va bien si aplica.
   - `precio`: 0 salvo que el usuario diga otra cosa.
   - los campos de la familia: pared `colores, papel, zocalo, luz`; ventana `colores, marco, cielo,
     cortinas, cenefa, luz`; piso `combina, material`; sillones `izq, der`; mesa `mesa`; alfombra
     `alfombra`; adorno `ancho (1 o 2 ranuras), lado (izq/der), fila (0-4), col (0-7), objeto`.
     Para un adorno, elegir una ranura que no use otro adorno (ver las filas existentes).
   No preguntar al usuario estos detalles si la pieza que pidió ya los sugiere: decidirlos.
3. **Escribirla** (el Excel tiene que estar CERRADO; si la herramienta dice que está abierto, pedir
   que lo cierre y repetir):
   ```
   cd C:/Users/basti/Documents/libro && python _tools/catalogo.py --fila pared clave=marina nombre="Azul marina y plata" para="sobria, para él" colores="azul marino, plata" papel="azul marino con un patrón tenue de olas plateadas." zocalo="un zócalo de madera blanca" luz="Luz fría y suave, un poco más clara en el centro."
   ```
   La herramienta calcula `n`, regenera `catalogo.json`, `catalogo.js` (la variante NO sale en la
   página hasta que tenga imagen) y el Taller con su PEDIDO. Si avisa de campos vacíos, rellenarlos.
4. **Responder al usuario** con: la ruta del PEDIDO (`Taller del libro\Pedidos\<Familia>\PEDIDO ... .txt`),
   los dos adjuntos que pide (en `Referencias\`) y el nombre con el que debe guardar el resultado en
   `Bandeja\`. Recordar que cuando lo tenga, se monta con `/libro-bandeja`.

## Reglas

- No tocar código ni `libros.js`: una variante es solo datos.
- Si el usuario pide varias piezas a la vez, una llamada `--fila` por pieza, en orden.
- Si pide cambiar una fila existente (otro texto, otro precio), usar
  `python _tools/catalogo.py --editar <Hoja> <clave> <columna> "<valor>"` y regenerar.
- Commit en la fábrica solo si el usuario lo pide; nunca push sin pedirlo. Sin "Co-Authored-By".
