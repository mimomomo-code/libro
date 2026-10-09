---
name: libro-familia
description: Crea una familia nueva de piezas en el catálogo de la sala del libro (lámparas, cuadros, cojines, plantas de piso, perros...), con su hoja en el Excel, su plantilla de pedido, su referencia y, si hace falta, el cableado en la página. Usar cuando el usuario pida un tipo de objeto que no es pared, ventana, piso, sillones, mesa, alfombra, adorno de estante ni gato.
---

# Una familia nueva de piezas

Fábrica: `C:\Users\basti\Documents\libro`. Las familias viven en la hoja Familias del Excel; cada una
tiene su hoja de variantes y su plantilla. La página solo sabe colgar hoy: fondos (pared, ventana,
piso), muebles (sillones, mesa, alfombra), adornos de estante y razas de mascota. Antes de crear nada,
decidir con el usuario UNA de estas tres situaciones:

**A. Es un objeto de estante** (lámpara de mesa, cuadrito, figura, libro falso): NO es familia nueva,
es una fila más de `adorno` (`/libro-pedido` con familia adorno). Cero código.

**B. Es una variante de algo que ya se cuelga** (otra forma de ventana, otra mesa): fila en esa familia.

**C. Es un sitio nuevo en la sala** (un cuadro en la pared, una lámpara de pie junto al sillón, una
planta grande en el suelo, una mascota que no es gato): familia nueva + código. Entonces:

1. **Configuración por analogía.** Elegir la familia más parecida y copiar su fila de Familias
   cambiando lo necesario. Columnas: `familia` (clave), `hoja` (nombre de la hoja), `grupo`
   (fondos|muebles|adornos|mascotas|otro), `nombre`, `singular`, `carpeta` (en Pedidos/), `prefijo`
   (del archivo: `lampara_<clave>.png`), `tamano` (texto del pedido), `alfa` (x si lleva fondo
   transparente), `referencia` + `referencia_nota` (el boceto de composición en `Referencias\`),
   `destino` (carpeta en assets), `asset` (patrón de archivo, con {clave}; varios separados por coma),
   `mini_asset`, `lado_max`, `mini` (px, 0 = sin miniatura), `postproceso` (tapiz = sin alfa, de borde a
   borde | recortar = una pieza con alfa | partir = dos piezas con hueco en medio | mascota), `plantilla`
   (clave en Plantillas), `tipo_sel`/`tipo_js`/`base_clave`/`base_nombre` (cómo la nombra el selector;
   vacíos si no va en el selector).
   ```
   python _tools/catalogo.py --familia familia=lampara hoja=Lamparas nombre=Lámparas singular=lámpara carpeta=Lamparas prefijo=lampara tamano="1024 x 1536 (vertical)" alfa=x referencia=referencia_lampara.webp referencia_nota="..." destino=assets/lamparas asset="{clave}.webp" mini_asset="{clave}.webp" lado_max=800 mini=120 postproceso=recortar plantilla=lampara tipo_js=lamparas columnas=objeto,luz
   ```
   Crea la fila, la hoja con las columnas comunes + `columnas`, y una plantilla vacía.
2. **La plantilla de pedido:** `python _tools/catalogo.py --editar Plantillas lampara texto "<texto>"`
   con la estructura de las existentes (leerlas en `catalogo/catalogo.json`): "Genera ahora una imagen.
   No describas, no esperes más material." + qué pintar, encuadre, tamaño y fondo + los `{campos}` de
   la hoja + `{estilo}` + prohibiciones (dibujo plano, vectorial, contornos negros, fondo de color) +
   "solo la pieza". Las ADJUNTAR y GUARDAR las añade el generador.
3. **La referencia de composición:** una imagen en `Taller del libro\Referencias\` que muestre dónde y
   a qué tamaño va la pieza (captura de la sala con un recuadro, o composición con Pillow). WebP.
4. **El cableado en la página (código):** dónde se cuelga (elemento y CSS en `index.html`), cómo se elige
   (`fondos.js`: TIPOS, ETIQ, LISTAS, rutas(), MINI, y el panel ✎) y qué constante la lleva: ampliar
   `escribir_js` en `_tools/catalogo.py` para que emita la lista de la familia nueva (hoy emite FONDOS,
   MUEBLES, ADORNOS, RAZAS). Probar con `?test=1` y capturas MIRADAS en PC y celular (412×915 y 390×844).
5. **Las variantes:** `/libro-pedido` por cada una. Después, `/libro-bandeja` cuando lleguen.
6. Commit narrativo en la fábrica. Sin push salvo pedido.

## Reglas

- No inventar columnas que la plantilla no use ni plantillas con campos que la hoja no tenga: el
  generador para con un error claro si no cuadran.
- Tamaños de pedido que ChatGPT respeta: 1536×1024, 1024×1536, 1024×1024.
