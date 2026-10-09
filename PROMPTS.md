# Prompts para las piezas ilustradas de la sala

La sala dibuja los dos sillones con SVG. Si en `assets/` existen estas
imágenes, la página las usa en su lugar (lo decide `DECORACION` en
`libros.js`; si el archivo no está, se queda el dibujo):

| Archivo | Pieza | Tamaño sugerido |
|---|---|---|
| `assets/sillon_rojo.webp` | sillón club rojo (izquierda) | 1024 × 1024, fondo transparente |
| `assets/sillon_amarillo.webp` | sillón orejero amarillo de hojas (derecha) | 1024 × 1200, fondo transparente |

Reglas para que encajen con el resto (libros vectoriales, cortinas planas,
luz de luna):

- **Vista de frente, a la altura de los ojos**, el sillón entero, centrado,
  con un poco de aire alrededor. Nada de suelo ni sombra proyectada en la
  imagen: la sombra la pone la página.
- **Estilo**: ilustración de libro de cuentos, mate, formas limpias, poco
  detalle fino, sin brillos fotográficos. Que parezca pintado, no una foto.
- **Luz**: suave y fría desde arriba a la izquierda (es de noche y la luna
  entra por la ventana), con las sombras cálidas.
- **Fondo transparente**. Si el generador no lo da, pedir fondo verde liso
  `#00ff00` y quitarlo después (rembg, remove.bg o el nodo de ComfyUI).
- Exportar a WebP con calidad 85 o 90. Un PNG también vale (cambia la
  extensión en `libros.js`).

## Sillón rojo (club)

```
storybook illustration of a single vintage club armchair, deep burgundy velvet,
rounded padded arms, low back, dark walnut wooden feet, front view at eye level,
entire chair visible and centered, matte painterly style, clean shapes, soft
cool moonlight from the upper left with warm shadows, muted cozy palette, no
floor, no cast shadow, isolated on a plain transparent background, high
resolution
```

Prompt negativo:

```
photo, photorealistic, glossy, lens flare, text, watermark, people, multiple
chairs, room, floor, wall, cropped, cut off, side view, top view, blurry
```

## Sillón amarillo (orejero)

```
storybook illustration of a single vintage wingback armchair, tall winged back,
ochre gold upholstery with a subtle dark leaf and vine damask pattern, rolled
arms, dark wooden feet, front view at eye level, entire chair visible and
centered, matte painterly style, clean shapes, soft cool moonlight from the
upper left with warm shadows, muted cozy palette, no floor, no cast shadow,
isolated on a plain transparent background, high resolution
```

Mismo prompt negativo que el rojo.

## Girasoles y limones de la lluvia

La lluvia del libro "21 Sep 2026" dibuja las flores por código. Si en
`assets/` hay `girasol_1.webp` … `girasol_4.webp` y `limon_1.webp` …
`limon_3.webp` (los nombres los fija `ARTE_GIRASOLES` en `libros.js`), los usa
en su lugar. Pueden venir varios en una misma imagen separados por huecos
vacíos: se recortan igual que los sillones. Cada flor o fruto entero, visto
desde arriba, sin tallo ni sombra.

```
four sunflowers seen from directly above, each one a separate whole flower,
arranged in a row with clear empty gaps between them, slight natural variation
in size and petal shape, golden yellow petals, dark brown seed head with a
spiral pattern, storybook illustration style, matte, soft even lighting, no
stems, no leaves, no shadow, isolated on a plain transparent background, high
resolution
```

```
three whole lemons, side view, each one a separate fruit with a single small
green leaf attached, arranged in a row with clear empty gaps between them,
bright yellow dimpled peel, storybook illustration style, matte, soft even
lighting, no shadow, isolated on a plain transparent background, high
resolution
```

Prompt negativo para los dos:

```
photo, photorealistic, glossy, text, watermark, stems, vase, bouquet,
overlapping, touching, cropped, cut off, background, table, shadow, blurry
```

## Los gatos (opcional: hoy van dibujados por código)

`gatos.js` dibuja los cuatro gatos en SVG en tres poses (de pie y echado de
perfil; sentado DE FRENTE, erguido, con las patas delanteras juntas y la cola
enroscada a un lado, redibujado el 8 oct a partir de una foto de pose) y los
anima. No hace falta ninguna imagen. Las fotos reales de
referencia están en `privado/gatos/referencia/` (fuera de git).

### Camino 1: una imagen por gato (recorte de papel)

Basta un archivo por gato y apuntarlo en `GATOS` (`libros.js`, campo
`imagen`, por ejemplo `assets/gatos/atigrado.webp`): la página lo usa en lugar
del dibujo y lo mueve como un recorte de papel (balanceo al caminar, volteado
cuando va a la izquierda; no se sienta ni se echa). Reglas:

- **Cuerpo entero, de perfil, caminando hacia la DERECHA**, las cuatro patas a
  la vista, cola arriba. Un solo gato por imagen, centrado, con aire
  alrededor. Sin suelo ni sombra: la sombra la pone la página.
- Mismo estilo que los muebles: ilustración de libro de cuentos, mate, formas
  limpias, luz fría desde arriba a la izquierda. Fondo transparente (o verde
  `#00ff00` y quitarlo). Unos 800 px de ancho bastan (en pantalla miden 45-130 px).
- Un sprite sheet (varios cuadros del paso) NO hace falta ni está soportado:
  el movimiento lo pone el código.

### Camino 2: ilustrar MI dibujo en MI pose (ComfyUI, para animar por piezas)

La plantilla GENÉRICA (un gato gris sin manchas, en las tres poses, con
contornos, siluetas y piezas) está guardada en `_tools/plantillas/gato/` con su
`LEEME.md`, que explica además cómo añadir un gato nuevo o un animal distinto.
`node _tools/plantillas_gatos.js` deja en `_capturas/plantillas_gatos/` cada
gato a 1024 × 683 con fondo transparente: `<id>_<pose>_color.png` (el dibujo),
`<id>_<pose>_lineas.png` (contornos negros, para ControlNet), `<id>_<pose>_silueta.png`
(máscara) y, en la pose de pie, la silueta de cada pieza
(`_pieza_cabeza/cuerpo/cola/patas`). Receta en ComfyUI (SDXL o Flux):

1. **ControlNet lineart o scribble** con `_lineas.png` (peso 0.7-0.9): obliga a
   la IA a respetar la pose y el encuadre del dibujo.
2. **IP-Adapter** con la foto del gato real (peso 0.5-0.7): le da el pelaje
   verdadero. Si no hay IP-Adapter, describirlo en el prompt (tabla de abajo).
3. Prompt base de abajo + `same pose and framing as the sketch`. Negativo igual.
4. Quitar el fondo (rembg) y guardar como PNG. **Ya no hace falta que la pose
   coincida con la plantilla**: `python _tools/gato_piezas.py <imagen.png> <id>`
   corta la ilustración por su PROPIA silueta en cinco piezas (cola, patas
   traseras, patas delanteras, cuerpo y cabeza, con solapes y pivotes) en
   `assets/gatos/<id>/` más un `piezas.json`, y deja un control en
   `_capturas/piezas_<id>.png` para mirar los cortes (si el automático falla,
   admite `--ycut --xsplit --xcola --xcuello --ybarbilla` como fracciones de la
   caja). En `GATOS` (`libros.js`) se apunta `piezas: "assets/gatos/<id>/piezas.json"`
   y el esqueleto anima las piezas pintadas; mientras cargan se ve el dibujo.
   Lo único que la imagen necesita: un solo gato, de cuerpo entero, de perfil
   mirando a la derecha, las cuatro patas abajo, la cola arriba y el fondo
   transparente. Así se montó el atigrado (7 oct).

Prompt base (cambiar la descripción del pelaje por la de cada gato):

```
storybook illustration of a single short-haired cat walking to the right, full
body in side view, all four legs visible mid-stride, tail held up, head turned
slightly toward the viewer, <PELAJE>, matte painterly style, clean shapes, soft
cool moonlight from the upper left with warm shadows, no floor, no cast shadow,
isolated on a plain transparent background, high resolution
```

| Gato | `<PELAJE>` |
|---|---|
| atigrado | `grey-brown mackerel tabby with bold narrow dark vertical stripes, ringed tail, pale cream belly and chin, green eyes` |
| carey | `brindled tortoiseshell, very dark brown almost black coat finely flecked with orange, an orange patch over one side of the face, hazel green eyes` |
| tricolor | `calico cat, white chest, belly and legs, large black and orange patches over the back and sides, face split black and orange with a white blaze, yellow-green eyes` |
| van café | `white cat with cinnamon-brown markings: a brown cap over the ears split by a white blaze on the forehead, three round brown spots on the back, solid brown tail, yellow-green eyes` |

Prompt negativo:

```
photo, photorealistic, glossy, text, watermark, multiple cats, sitting, lying,
front view, cropped, cut off, floor, shadow, background, blurry
```

## La pared (con su ventana y sus cortinas) y el piso

Hoy la pared, la ventana con cortinas y el piso son CSS. `DECORACION` admite
tres piezas pintadas INDEPENDIENTES que se mezclan: `pared` (solo papel tapiz
con su zócalo, SIN ventana, apaisada 3:2; va anclada abajo para que el zócalo
caiga en la línea del piso y se recorta por arriba o los lados según la
pantalla), `ventanal` (la ventana con sus cortinas, cenefa y barra, UNA pieza
con fondo transparente, vertical; sustituye al ventanal CSS y la caja toma su
proporción) y `suelo` (textura apaisada, centrada). `pared_vertical` queda
como opción para una pared distinta en el celular vertical. Se preparan con
`python _tools/fondo.py <imagen> pared|ventanal|suelo [variante]` (WebP en
`assets/`, o en `assets/fondos/` con variante; la ventana conserva el alfa y se
recorta sola al contorno) y se activan descomentando sus líneas en `libros.js`.
Los pedidos en español para ChatGPT están en `OneDrive\Escritorio\Sala del libro`,
con el CATÁLOGO de 13 paredes, 12 ventanas y 8 pisos (un pedido por variante,
generado por `_tools/catalogo_fondos.py`: una variante nueva = una entrada más
y volver a correrlo). LECCIÓN (8 oct): cada pedido adjunta DOS referencias, el
boceto de la pieza (la captura del CSS, que NO hay que copiar) y
`referencia_estilo.png` (sillones, mesa y gato ya pintados: el acabado que sí),
porque con una sola la IA copió el dibujo plano tal cual. En inglés, el prompt
base de la pared CON ventana (la versión antigua, por si sirve de punto de partida):

```
storybook illustration of the back wall of a cozy reading room at night, front
view at eye level, 3:2 landscape, dark burgundy wine damask wallpaper with a
faint diamond pattern, dark wood baseboard along the bottom edge, a tall
round-arched window with a dark wooden frame in the center showing a deep blue
night sky with small stars and a glowing cream crescent moon, red velvet
pleated curtains tied back at mid height with gold ribbons on both sides, a
scalloped red valance with gold trim and a gold curtain rod with round finials
above, the window centered taking about half the width and the upper two
thirds, the lower third plain wallpaper, soft cool moonlight from the window
with warm shadows, matte painterly style, clean shapes, muted cozy palette, no
furniture, no floor, no people, no text, no frame, fills the whole canvas
```

Para la vertical, cambiar `3:2 landscape` por `2:3 portrait` y `about half the
width` por `about four fifths of the width` (y adjuntar la apaisada para que
salga la misma pared).

```
storybook illustration of a dark walnut wooden plank floor seen from the front
at seated eye level in gentle perspective, planks running away from the viewer
and converging slightly, subtle wood grain, matte worn finish, warm brown, dim
even night lighting, no moonlight pool, no reflections, floor only edge to
edge, no wall, no baseboard, no rug, no furniture, no objects, no shadows, no
text, 3:2 landscape
```

Prompt negativo para los dos:

```
photo, photorealistic, glossy, text, watermark, frame, border, furniture,
people, cats, rug, lamp, cropped, blurry
```

## Muebles y adornos a elección (catálogo)

`_tools/catalogo_muebles.py` escribe en `OneDrive\Escritorio\Muebles del libro`
un pedido por variante (8 parejas de sillones, 6 mesas, 8 alfombras y 10 adornos
para las ranuras de las librerías), con sus referencias de composición (los
sillones de hoy con un hueco en medio, la mesa, la alfombra, un trozo de
librería con libros) y `referencia_estilo.png`. Los resultados entran con
`python _tools/mueble.py <imagen> sillones|mesa|alfombra|adorno <clave>` y los
ofrece el selector ✎ (`MUEBLES` y `ADORNOS` en `libros.js`). Las reglas por tipo
están en el LEEME de esa carpeta.

## Mesa y alfombra (ya cableadas)

`assets/mesa.webp` (vista de frente; los libros se apoyan a un 19 % de su
alto, ajustable con `--mesa-tapa`) y `assets/alfombra.webp` (en perspectiva,
borde de abajo más ancho). Se generaron con estos prompts:

- **Mesa redonda**: `storybook illustration of a small round wooden pedestal
  side table, warm walnut, three splayed legs, front view slightly from above,
  matte painterly style, soft cool moonlight from the upper left, no cast
  shadow, isolated on a transparent background`
- **Alfombra**: `storybook illustration of a rectangular vintage rug seen
  from the front in soft perspective, dusty blue with a darker woven border
  and a faint diamond pattern, matte painterly style, isolated on a
  transparent background`
