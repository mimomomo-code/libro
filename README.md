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
  hasta llenar la pantalla, y entre ellos, repartidos a lo largo de la lluvia,
  hasta 12 limones que quedan encima del manto (un toque durante la lluvia
  suelta una ráfaga). Cuando está llena, cada toque muestra la siguiente de
  las `notas` (la primera es la nota, las demás posdatas); el toque tras la
  última limpia todo y el libro queda en la mesa. Las flores que aterrizan se
  pintan una sola vez en un lienzo aparte, así que no se arrastra ni con mil
  flores.
- `tipo: "album"` se lee página a página como el poema, pero sus páginas se
  escriben en el propio `libros.js` (lista `paginas`, una entrada por página):
  `{ foto: "assets/album/x.webp", pie: "..." }` pega una foto con marco blanco,
  un poco ladeada, y la frase manuscrita debajo si hay `pie`;
  `{ dibujo: "assets/suenos/x.webp" }` pone un dibujo con fondo transparente
  directo sobre el papel; `{ blanca: true, texto: "..." }` es una hoja en
  blanco con una frase arriba y renglones para seguir escribiendo; y también
  valen páginas de texto como las del poema. Tocar una foto o un dibujo lo
  abre en la **lupa** (pantalla completa; pellizco, doble toque o rueda para
  acercar; toque fuera para cerrar). Las imágenes se piden al abrir el libro.
  Así están hechos **Sueños** (los dibujos de Paint, un sueño por página y la
  hoja en blanco "añadamos mas sueños juntos") y **Álbum de fotos** (una foto
  por plana: la primera cita en videollamada, la primera pasarela y el intento
  de cómic; el pie va en la primera foto de cada tanda). `lomo` da un rótulo
  corto para el lomo cuando el título no cabe.

Colores de tapa: `burdeos`, `verde`, `azul`, `marron`, `negro`, `girasol`.

Para preparar imágenes nuevas: fotos a 1280 px de lado mayor en WebP (calidad
82, ~130 KB cada una); dibujos con el blanco vuelto transparente en WebP sin
pérdida (`assets/suenos/` pesa 31 KB entre los seis).

## El candado del álbum

El **Álbum de fotos** lleva candado: en la librería y en la mesa se le ve un
candadito, y al tocarlo pide un número antes de abrirse. El navegador recuerda
el número, así que solo se escribe una vez por celular.

No es solo una cortina: las fotos están **cifradas** en `assets/album/*.bin`
(AES-256-GCM con una clave derivada del número por PBKDF2, 250 000 vueltas).
Lo que viaja a GitHub es ilegible sin el número, y el número no aparece en
ningún archivo del repositorio. Un número de seis cifras frena a cualquier
curioso y a un intento razonable de adivinarlo; no frena a alguien con mucho
tiempo y una tarjeta gráfica probando el millón de combinaciones, así que si
algún día hiciera falta más, basta un número más largo.

Las fotos sin cifrar viven en `privado/album/` (carpeta fuera de git). Para
**añadir fotos**: copiarlas ahí (jpg, png o webp, nombre corto sin espacios) y
correr `python _tools/candado_album.py` desde la carpeta del proyecto: pide el
número, convierte a WebP lo que haga falta, cifra lo nuevo y al final imprime
las líneas `{ foto: "assets/album/nombre.bin" }` que faltan en `libros.js`.
Luego `git add -A`, commit y push. `--nueva-clave` cambia el número (se
recifra todo y cada celular tendrá que volver a escribirlo).

Para probarlo en la computadora hay que servir la carpeta por http (por
ejemplo `python -m http.server` y abrir `http://localhost:8000/`): abierto
como archivo, el navegador no deja leer los `.bin`. `?abrir=album&clave=N`
abre sin preguntar (solo para probar; no guarda nada).

## Texturas y sillones ilustrados

Las tramas (veta de madera, tejido, terciopelo, papel, cuero) no son
imágenes: `texturas.js` las genera en un canvas al cargar y el CSS las
mezcla con `multiply` sobre los colores de siempre. No pesan nada y se ven
igual en cualquier pantalla.

Los sillones, la mesa y la alfombra tienen su imagen ilustrada en `assets/`
(WebP con fondo transparente); `DECORACION` en `libros.js` dice qué archivo
mira cada pieza y `PROMPTS.md` guarda los prompts con que se generaron. Los
girasoles y los limones de la lluvia también son ilustrados (`girasol_1-4.webp`
y `limon_1-3.webp`, listados en `ARTE_GIRASOLES`); sin ellos vuelve el dibujo
por código. Si
falta un archivo, la pieza vuelve a su dibujo en CSS/SVG. La mesa manda su
propia proporción (nunca más del 30 % del alto de la sala) y los libros se
apoyan en su tapa; la alfombra rellena el suelo en pantalla ancha y en
celular vertical muestra su centro sin deformarse.

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
| `index.html?abrir=album&p=5` | un álbum abierto en su página 5 (`&lupa=1` con esa foto ya en la lupa; también `abrir=suenos`); el álbum con candado necesita `&clave=N` y servirse por http |
| `index.html?abrir=girasoles&lleno=1` | la pantalla ya llena de girasoles (`&nota=1` con la nota a la vista, `&nota=2` la posdata) |
| `index.html?limpio=1` | ignora lo que el navegador recuerda |
| `index.html?test=1` | prueba automática de la sala (toques, torre, ranuras, arrastres y vuelos); el resultado sale arriba |

## Publicar en GitHub Pages

Repositorio → Settings → Pages → *Build and deployment* → Source:
**Deploy from a branch**, Branch: **main**, carpeta **/ (root)** → Save.
El sitio queda en `https://<usuario>.github.io/libro/`.
