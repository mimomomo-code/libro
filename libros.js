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
//  - titulo: lo que se lee en el lomo y en la tapa. El poema toma el suyo
//            de poema.js si no se indica aquí.
//  - tapa: "burdeos", "verde", "azul", "marron", "negro" o "girasol".
//  - nota: (solo girasoles) el texto que aparece cuando la pantalla se llena.
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
    nota: "ññiñiñiñiñite quiero muchichichichisimo tanto y mas que estas pocas flores",
    estante: { lado: "der", fila: 0, col: 5 },
  },
];
