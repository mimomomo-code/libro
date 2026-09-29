// =====================================================================
//  LA LIBRERÍA. Cada elemento es un libro que aparece en los estantes de
//  la sala. Se toca para llevarlo a la mesa; en la mesa se toca para
//  abrirlo y se arrastra de vuelta a la librería para guardarlo.
//
//  - id: nombre interno único (sin espacios ni tildes). Con él el navegador
//        recuerda en qué ranura dejaste cada libro.
//  - tipo: "poema"      se lee página a página; el contenido vive en poema.js.
//          "girasoles"  al abrirlo caen girasoles hasta llenar la pantalla;
//                       un toque muestra la nota y otro toque la guarda.
//          "album"      se lee página a página como el poema, pero las
//                       páginas se escriben aquí mismo (lista `paginas`).
//  - titulo: lo que se lee en el lomo y en la tapa. El poema toma el suyo
//            de poema.js si no se indica aquí.
//  - lomo: (opcional) rótulo corto para el lomo si el título no cabe.
//  - tapa: "burdeos", "verde", "azul", "marron", "negro" o "girasol".
//  - notas: (solo girasoles) los textos que aparecen, uno por toque, cuando
//           la pantalla se llena (la primera es la nota; las demás, posdatas).
//  - paginas: (solo album) una entrada por página, en orden. Cada una puede ser:
//        { foto: "assets/album/x.webp", pie: "..." }   una foto pegada con marco
//                                                       blanco y, si hay `pie`,
//                                                       la frase manuscrita debajo.
//        { dibujo: "assets/suenos/x.webp", pie: "..." } un dibujo directo sobre el
//                                                       papel (PNG/WebP con fondo
//                                                       transparente).
//        { blanca: true, texto: "..." }                 una hoja en blanco con una
//                                                       frase manuscrita arriba y
//                                                       renglones para seguir.
//        `texto de poema`  o  { efecto: "...", texto: `...` }   como en poema.js.
//    Cualquiera admite `efecto` ("estrellas", "corazones"...) detrás.
//    También valen `autor`, `dedicatoria` (portadilla), `efecto_fin` y `colofon`.
//  - candado: (opcional) ruta al candado.json del libro. Sus fotos van cifradas
//             (.bin) y el libro pide un número antes de abrirse; el navegador
//             lo recuerda. El número NO está aquí ni en ningún archivo: se
//             escribe al cifrar con _tools/candado_album.py (ver ese archivo
//             para añadir fotos nuevas).
//  - estante: dónde nace el libro la PRIMERA vez: lado "izq" o "der",
//             fila 0-4 (0 = la de arriba) y columna 0-7 (0 = la de la
//             izquierda). Después cada persona lo mueve donde quiera y su
//             navegador recuerda el orden.
// =====================================================================

// Piezas de la sala que pueden llevar una imagen propia (PNG o WebP con
// fondo transparente, vistas de frente). Si el archivo existe se usa; si no,
// se queda el dibujo. Los prompts para generarlas están en PROMPTS.md.
const DECORACION = {
  sillon_rojo: "assets/sillon_rojo.webp",
  sillon_amarillo: "assets/sillon_amarillo.webp",
  mesa: "assets/mesa.webp",            // vista de frente; los libros se apoyan en su tapa
  alfombra: "assets/alfombra.webp",    // vista en perspectiva, con el borde de abajo más ancho
};

// Girasoles y limones ilustrados para la lluvia del libro "21 Sep 2026".
// Si estas imágenes existen (fondo transparente, cada flor o fruto solo y
// centrado), la lluvia las usa en lugar de las flores dibujadas por código;
// si falta alguna, se ignora, y si no hay ninguna vuelve el dibujo.
const ARTE_GIRASOLES = {
  girasoles: ["assets/girasol_1.webp", "assets/girasol_2.webp", "assets/girasol_3.webp", "assets/girasol_4.webp"],
  limones: ["assets/limon_1.webp", "assets/limon_2.webp", "assets/limon_3.webp"],
};

const LIBROS = [
  {
    id: "poema",
    tipo: "poema",
    datos: (typeof LIBRO === "object" && LIBRO) ? LIBRO : null,
    estante: { lado: "izq", fila: 0, col: 1 },
  },
  {
    id: "girasoles",
    tipo: "girasoles",
    titulo: "21 Sep 2026",
    tapa: "girasol",
    // Las notas salen una por toque cuando la pantalla está llena; el toque
    // tras la última limpia todo. Se pueden añadir más líneas a la lista.
    notas: [
      "ññiñiñiñiñite quiero muchichichichisimo tanto y mas que estas pocas flores",
      "ojala algun dia estas flores se vuelvan reales",
    ],
    estante: { lado: "der", fila: 0, col: 5 },
  },
  {
    // Los dibujos hechos en Paint (dibujo sueño.png), partidos en un sueño por
    // página, y al final una hoja en blanco para los que faltan.
    id: "suenos",
    tipo: "album",
    titulo: "Sueños",
    tapa: "azul",
    paginas: [
      { dibujo: "assets/suenos/casa.webp" },
      { dibujo: "assets/suenos/jardin.webp" },
      { dibujo: "assets/suenos/animales.webp" },
      { dibujo: "assets/suenos/vista.webp" },
      { dibujo: "assets/suenos/yo_y_tu.webp" },
      { dibujo: "assets/suenos/hijos.webp" },
      { blanca: true, texto: "añadamos mas sueños juntos" },
    ],
    efecto_fin: "estrellas",
    estante: { lado: "izq", fila: 1, col: 3 },
  },
  {
    // Una foto por plana. El pie va en la primera foto de cada tanda.
    // Con candado: las fotos están cifradas en assets/album/*.bin y las
    // originales viven en privado/album/ (fuera de git). Para añadir fotos:
    // copiarlas a privado/album/ y correr  python _tools/candado_album.py
    id: "album",
    tipo: "album",
    titulo: "Álbum de fotos",
    lomo: "Álbum",
    tapa: "marron",
    candado: "assets/album/candado.json",
    paginas: [
      { foto: "assets/album/cita_1.bin", pie: "Nuestra primera cita: donde tuvimos la primera videollamada" },
      { foto: "assets/album/cita_2.bin" },
      { foto: "assets/album/cita_3.bin" },
      { foto: "assets/album/cita_4.bin" },
      { foto: "assets/album/pasarela_1.bin", pie: "Ahí tuvimos nuestra primera pasarela" },
      { foto: "assets/album/pasarela_2.bin" },
      { foto: "assets/album/pasarela_3.bin" },
      { foto: "assets/album/pasarela_4.bin" },
      { foto: "assets/album/pasarela_5.bin" },
      { foto: "assets/album/pasarela_6.bin" },
      { foto: "assets/album/comic_1.bin", pie: "Nuestro intento de cómic" },
      { foto: "assets/album/comic_2.bin" },
    ],
    efecto_fin: "corazones",
    estante: { lado: "der", fila: 1, col: 2 },
  },
];
