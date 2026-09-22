# Libro

Una sala de lectura en el navegador: dos librerías, una ventana con la luna,
dos sillones y una mesa. Los libros se toman de la librería, se abren en la
mesa y se devuelven arrastrándolos. Pensado para verse desde el celular.

**Verlo en línea:** https://mimomomo-code.github.io/libro/

## La sala

- **Tocar un libro de la librería** lo lleva a la mesa. El primero queda de
  pie, listo para abrirse; los siguientes se apilan en una torre a su lado.
- **Tocar el libro de pie** lo abre. **Tocar uno de la torre** lo cambia por
  el que está de pie.
- **Arrastrar** un libro de la mesa (o de la torre) hasta la librería lo
  guarda en la ranura donde se suelte, como una pieza de rompecabezas. Cada
  librería tiene 5 filas y 8 ranuras invisibles por fila, así que el orden de
  la biblioteca lo decide quien la usa. Un lomo también se puede arrastrar de
  ranura en ranura. El navegador recuerda dónde quedó cada libro.
- Arriba a la izquierda del lector hay una flecha para **volver a la sala**.
  Al terminar un libro (o cerrarlo) también se vuelve solo.

## Los libros

El catálogo vive en `libros.js`. Cada libro tiene un `id`, un `tipo`, un
`titulo`, una `tapa` y el `estante` donde nace la primera vez (lado `izq` o
`der`, fila 0-4, columna 0-7).

- `tipo: "poema"` se lee página a página. Su contenido sigue en `poema.js`
  (título, autor, dedicatoria, páginas, efectos, música), igual que antes.
- `tipo: "girasoles"` es el libro **21 Sep 2026**: al abrirlo caen girasoles
  hasta llenar la pantalla (un toque durante la lluvia suelta una ráfaga).
  Cuando está llena, un toque muestra la `nota`; otro toque limpia todo y el
  libro queda en la mesa. Las flores que aterrizan se pintan una sola vez en
  un lienzo aparte, así que no se arrastra ni con mil flores.

Colores de tapa: `burdeos`, `verde`, `azul`, `marron`, `negro`, `girasol`.

## Cambiar el poema

Todo el contenido del poema vive en `poema.js`. No hace falta tocar `index.html`.

- `titulo` y `autor` van grabados en la tapa y en la primera página.
- `paginas` es la lista de páginas: cada elemento entre acentos graves (`` ` ``)
  es una página. Un Enter separa versos; una línea en blanco separa estrofas
  dentro de la misma página. `{ efecto: "nieve", texto: `...` }` añade una
  animación detrás del texto.
- `dedicatoria` (cursiva bajo el título) y `colofon` (nota de la última página)
  se pueden dejar en `""`.
- `tapa`: color del cuero. `alinear`: `izquierda` o `centro`. `tamano`: 1
  normal, 0.9 más chico, 1.15 más grande.

Después de editar: `git add -A`, `git commit -m "mi cambio"`, `git push`.
GitHub Pages republica solo en uno o dos minutos.

## Música de fondo

`musica/piano.mp3` es una pieza de piano original generada para esta página
(sin copyright de terceros). En `poema.js`, el bloque `musica` indica el
archivo y el volumen (0 a 1); `musica: null` la quita. Arranca con el primer
toque (los navegadores bloquean el sonido automático), suena bajita en la sala
y en el lector, se repite sin costura y el botón ♪ de la esquina la silencia.
Para poner otra pieza basta con cambiar el archivo, siempre que tengas derecho
a usarla.

## Controles del lector

| Gesto | Acción |
|---|---|
| Toque en el libro cerrado | abre la tapa |
| Toque (o toque en el lado derecho) | pasa la página |
| Toque en el borde izquierdo / deslizar a la derecha | vuelve una página |
| Deslizar a la izquierda | pasa la página |
| Flecha ‹ arriba a la izquierda | vuelve a la sala |
| Teclado: → espacio Enter / ← / Esc | siguiente / anterior / cerrar (y con el libro cerrado, volver a la sala) |

En pantalla ancha (PC o celular apaisado) el libro se muestra abierto con
dos páginas; en vertical, una página por vez.

## Probar en la computadora

Basta con abrir `index.html` en el navegador (las tipografías se descargan
de Google Fonts, así que conviene tener internet). Parámetros útiles (no
guardan nada en el navegador):

| URL | Qué muestra |
|---|---|
| `index.html?mesa=poema,girasoles` | la sala con esos libros en la mesa (el primero de pie) |
| `index.html?abrir=poema` | el lector con el poema cerrado |
| `index.html?p=3` | el poema abierto en la página 3 (`?modo=2` fuerza doble página) |
| `index.html?abrir=girasoles&lleno=1` | la pantalla ya llena de girasoles (`&nota=1` con la nota a la vista) |
| `index.html?limpio=1` | ignora lo que el navegador recuerda |
| `index.html?test=1` | prueba automática de la sala (toques, torre, ranuras, arrastres y vuelos); el resultado sale arriba |

## Publicar en GitHub Pages

Repositorio → Settings → Pages → *Build and deployment* → Source:
**Deploy from a branch**, Branch: **main**, carpeta **/ (root)** → Save.
El sitio queda en `https://<usuario>.github.io/libro/`.
