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

`gatos.js` dibuja los cuatro gatos en SVG en tres poses (de pie, sentado,
echado) y los anima. No hace falta ninguna imagen. Las fotos reales de
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
4. Quitar el fondo (rembg) y guardar como PNG/WebP **sin recortar ni mover**:
   mientras el gato quede donde estaba en la plantilla, se puede cortar en
   piezas con las máscaras `_pieza_*` y montarlo en el esqueleto, con patas,
   cola y ojos animados pero pintados. Ese montaje se hace cuando exista la
   primera ilustración (todavía no está programado: primero hay que ver una).

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
