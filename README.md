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

- `tipo: "calendario"` es el libro **Días importantes**: se escribe solo cada
  vez que se abre. La primera página es *Lo que viene*: la cuenta de días
  juntos (o los que faltan para empezar) y los próximos seis días marcados,
  con "hoy", "mañana" o "en N días"; después, un mes por página, doce desde el
  mes en curso, con el día de hoy en un anillo, los días marcados en una
  moneda (dorada; rosa los nuestros) con su iconito, y debajo la lista del mes.
  Los días **no están en el código**: viven en `privado/calendario/dias.json`
  (fuera de git) y viajan cifrados en `assets/calendario/dias.bin` con el
  mismo candado del álbum. El formato de `dias.json` está en `calendario.js`:
  `{ "dia": 30, "mes": 9, "nombre": "...", "icono": "auto" }` se repite cada
  año; `{ "fecha": "2026-10-11", "nombre": "...", "inicio": true }` es un día
  concreto que además cuenta los días juntos y marca cada mes ("N meses
  juntos") y cada aniversario ("N años juntos"). Iconos: `corazon`, `flor`,
  `auto`, `estrella`, `regalo`.

Colores de tapa: `burdeos`, `verde`, `azul`, `marron`, `negro`, `girasol`.

Para preparar imágenes nuevas: fotos a 1280 px de lado mayor en WebP (calidad
82, ~130 KB cada una); dibujos con el blanco vuelto transparente en WebP sin
pérdida (`assets/suenos/` pesa 31 KB entre los seis).

## El candado (álbum y calendario)

El **Álbum de fotos** y **Días importantes** llevan candado: en la librería y
en la mesa se les ve un candadito, y al tocarlos piden un número antes de
abrirse. Los dos comparten el mismo candado (`assets/candado.json`), así que
es un solo número y el navegador lo recuerda: se escribe una vez por celular
y abre los dos libros.

No es solo una cortina: las fotos están **cifradas** en `assets/album/*.bin`
y los días en `assets/calendario/dias.bin` (AES-256-GCM con una clave derivada
del número por PBKDF2, 250 000 vueltas). Lo que viaja a GitHub es ilegible sin
el número, y el número no aparece en ningún archivo del repositorio. Un número
de seis cifras frena a cualquier curioso y a un intento razonable de
adivinarlo; no frena a alguien con mucho tiempo y una tarjeta gráfica probando
el millón de combinaciones, así que si algún día hiciera falta más, basta un
número más largo.

Lo que no se cifra vive en `privado/` (carpeta fuera de git): las fotos en
`privado/album/` y los días en `privado/calendario/dias.json`. La herramienta
es `python _tools/candado.py` desde la carpeta del proyecto (`album` o
`calendario` para hacer solo uno; sin nada, los dos):

- **Añadir fotos**: copiarlas a `privado/album/` (jpg, png o webp, nombre
  corto sin espacios), correr la herramienta y pegar en `libros.js` las líneas
  `{ foto: "assets/album/nombre.bin" }` que imprime.
- **Añadir días**: editar `privado/calendario/dias.json` y correr la
  herramienta (revisa el formato antes de cifrar).
- La primera vez pide el número (no se ve al escribirlo) y guarda la clave
  derivada en `privado/candado.key`, también fuera de git, para no volver a
  pedirlo en esta computadora; `--olvidar` la borra y `--sin-recordar` no la
  guarda. `--clave N` lo pasa por parámetro. `--nueva-clave` cambia el número
  (se recifra todo y cada celular tendrá que volver a escribirlo).
- Luego `git add -A`, commit y push.

**La guardia del candado**: `_tools/hooks/pre-commit` frena cualquier commit
que intente subir algo de `privado/`, una imagen en claro en `assets/album/` o
`assets/calendario/`, un `dias.json` o la `candado.key`. Se instala una vez
por clon con `git config core.hooksPath _tools/hooks` (en esta computadora ya
está).

Para probarlo en la computadora hay que servir la carpeta por http (por
ejemplo `python -m http.server` y abrir `http://localhost:8000/`): abierto
como archivo, el navegador no deja leer los `.bin`. `?abrir=album&clave=N` o
`?abrir=calendario&clave=N` abren sin preguntar (solo para probar; no guardan
nada).

## Los gatos

Cuatro gatos viven en la sala, dibujados por código (`gatos.js`) a partir de
las fotos de los de verdad: el **atigrado** (gris-marrón de rayas marcadas y
panza clara), la **carey** (brindada, con su mancha naranja en la cara), la
**tricolor** (blanca con manchas negras y naranjas en el lomo) y la **blanca
con café** (la gorrita partida por una raya blanca, tres lunares y la cola
café). Caminan por el suelo entre los sillones y la mesa (más chicos cuanto
más lejos, y detrás o delante de la mesa según dónde pisen), se paran a
mirar, se echan a dormir, de vez en cuando saltan a un sillón a hacer la
siesta y vuelven a bajar. **Tocar un gato** lo detiene, ladea la cabeza y
suelta corazones. No tocan los libros ni estorban al arrastrarlos.

La lista está en `libros.js` (`GATOS`: `id`, `pelaje` y, opcional, `nombre`).
Si algún día se quieren ilustrados, se les da una `imagen` (PNG/WebP de perfil
mirando a la derecha, fondo transparente; los prompts están en `PROMPTS.md`)
y la página la mueve como un recorte de papel. `?gatos=0` los quita y
`?semilla=N` repite el mismo azar (para capturas).

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
| `index.html?abrir=calendario&clave=N&p=2&hoy=2026-10-07` | el calendario abierto en su primer mes (`p=1` es *Lo que viene*); `hoy=` finge la fecha |
| `index.html?abrir=girasoles&lleno=1` | la pantalla ya llena de girasoles (`&nota=1` con la nota a la vista, `&nota=2` la posdata) |
| `index.html?limpio=1` | ignora lo que el navegador recuerda |
| `index.html?test=1` | prueba automática de la sala (toques, torre, ranuras, arrastres, vuelos y las cuentas del calendario); el resultado sale arriba |

## Publicar en GitHub Pages

Repositorio → Settings → Pages → *Build and deployment* → Source:
**Deploy from a branch**, Branch: **main**, carpeta **/ (root)** → Save.
El sitio queda en `https://<usuario>.github.io/libro/`.
