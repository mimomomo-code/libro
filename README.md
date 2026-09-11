# Libro

Un libro que se abre en el navegador y muestra un poema página a página.
Pensado para verse desde el celular: se toca para abrir la tapa, se toca
para pasar la hoja, se desliza a la derecha para volver.

**Verlo en línea:** https://mimomomo-code.github.io/libro/

## Cambiar el poema

Todo el contenido vive en `poema.js`. No hace falta tocar `index.html`.

- `titulo` y `autor` van grabados en la tapa y en la primera página.
- `paginas` es la lista de páginas: cada elemento entre acentos graves (`` ` ``)
  es una página. Un Enter separa versos; una línea en blanco separa estrofas
  dentro de la misma página.
- `dedicatoria` (cursiva bajo el título) y `colofon` (nota de la última página)
  se pueden dejar en `""`.
- `tapa`: color del cuero (`burdeos`, `verde`, `azul`, `marron`, `negro`).
- `alinear`: `izquierda` o `centro`. `tamano`: 1 normal, 0.9 más chico, 1.15 más grande.

Después de editar: `git add -A`, `git commit -m "mi poema"`, `git push`.
GitHub Pages republica solo en uno o dos minutos.

## Música de fondo

En `poema.js`, el bloque `musica` tiene dos formas y se elige con `usar`:

- `"spotify"`: un banner de 80 px como el de Spotify. `spotify` es el ID de la
  canción (lo que sigue a `/track/` en el enlace). Suena completa si el visitante
  tiene sesión de Spotify abierta en ese navegador; si no, Spotify solo deja
  30 segundos de muestra.
- `"youtube"`: una tarjeta de 200 px con el video (YouTube exige que el video se
  vea; no permite usarlo como audio escondido). `youtube` es el ID del video (lo
  que sigue a `v=`); si se pone una lista, se prueba el siguiente cuando uno no
  permite insertarse. Suena completa para todos.

En los dos casos arranca con el primer toque en el libro (los navegadores
bloquean el sonido automático) y se repite en bucle. `musica: null` la quita.
Subir un mp3 al repositorio no es opción: sería redistribuir la canción.

## Controles

| Gesto | Acción |
|---|---|
| Toque en el libro cerrado | abre la tapa |
| Toque (o toque en el lado derecho) | pasa la página |
| Toque en el borde izquierdo / deslizar a la derecha | vuelve una página |
| Deslizar a la izquierda | pasa la página |
| Teclado: → espacio Enter / ← / Esc | siguiente / anterior / cerrar |

En pantalla ancha (PC o celular apaisado) el libro se muestra abierto con
dos páginas; en vertical, una página por vez.

## Probar en la computadora

Basta con abrir `index.html` en el navegador (las tipografías se descargan
de Google Fonts, así que conviene tener internet). `index.html?p=3` abre
directo en la página 3; `?modo=2` fuerza la vista de dos páginas.

## Publicar en GitHub Pages

Repositorio → Settings → Pages → *Build and deployment* → Source:
**Deploy from a branch**, Branch: **main**, carpeta **/ (root)** → Save.
El sitio queda en `https://<usuario>.github.io/libro/`.
