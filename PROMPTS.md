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

## Si quieres ir más lejos (todavía no lo lee la página)

Estas piezas hoy son CSS con textura procedural. Si algún día quieres
ilustrarlas, estos prompts siguen la misma línea; avísame y las cableo igual
que los sillones:

- **Mesa redonda**: `storybook illustration of a small round wooden pedestal
  side table, warm walnut, three splayed legs, front view slightly from above,
  matte painterly style, soft cool moonlight from the upper left, no cast
  shadow, isolated on a transparent background`
- **Alfombra**: `storybook illustration of a rectangular vintage rug seen
  from the front in soft perspective, dusty blue with a darker woven border
  and a faint diamond pattern, matte painterly style, isolated on a
  transparent background`
