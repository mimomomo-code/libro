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
//          "calendario" el calendario de días importantes: una página con lo
//                       que viene (y la cuenta de días juntos) y un mes por
//                       página. Los días NO están aquí: viven en
//                       privado/calendario/dias.json (fuera de git) y viajan
//                       cifrados en `cifrado` (ver calendario.js para el formato).
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
//  - candado: (opcional) ruta al candado.json. Sus fotos van cifradas (.bin) y
//             el libro pide un número antes de abrirse; el navegador lo
//             recuerda. Los libros que apuntan al MISMO candado.json comparten
//             el número (se escribe una sola vez). El número NO está aquí ni
//             en ningún archivo: se escribe al cifrar con _tools/candado.py
//             (ver ese archivo para añadir fotos o días nuevos).
//  - cifrado: (opcional, con candado) un archivo de datos cifrado (.bin con un
//             JSON dentro) que el candado descifra junto con las fotos; es
//             como el calendario recibe sus días.
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
  // La pared, la ventana y el piso pintados van en FONDOS (abajo), a elección; estas claves sueltas
  // (pared, ventanal, suelo, pared_vertical) siguen valiendo para un archivo único sin selector.
};

// Los fondos pintados, tres piezas independientes que se mezclan a gusto: la PARED (solo papel tapiz
// con su zócalo, sin ventana), la VENTANA con sus cortinas (pieza con fondo transparente, como los
// sillones) y el PISO. Los archivos siguen la convención assets/fondos/pared_<clave>.webp,
// ventana_<clave>.webp y suelo_<clave>.webp (más su miniatura en assets/fondos/mini/), que deja
//   python _tools/fondo.py <imagen> pared|ventanal|suelo <clave>
// a partir de las imágenes generadas con los pedidos de OneDrive\Escritorio\Sala del libro (CATALOGO.md).
// "css" es el dibujo de siempre. `defecto` es lo que ve quien entra por primera vez; el botón ✎ abre
// el selector (fondos.js) y la elección se guarda en el navegador. `temporadas`: lo que se pone solo
// cuando se marca "que cambie con la estación" (fiestas primero, luego estaciones del hemisferio sur).
// Para añadir una variante: su archivo en assets/fondos/ y su nombre aquí.
const FONDOS = {
  paredes: {
    css: "Vino de siempre (dibujo)", vino: "Vino clásico", azul: "Azul noche y dorado", esmeralda: "Verde esmeralda y oro",
    rosa: "Rosa empolvado", lavanda: "Lavanda y violetas", perla: "Gris perla y dorado", chocolate: "Chocolate y crema",
    primavera: "Primavera (cerezos en flor)", verano: "Verano (girasoles)", otono: "Otoño (hojas)", invierno: "Invierno (copos)",
    navidad: "Navidad", sanvalentin: "San Valentín",
  },
  ventanas: {
    css: "Terciopelo rojo (dibujo)", crema: "Terciopelo crema y dorado", esmeralda: "Mostaza y verde", rosa: "Gasa marfil y lazos rosa",
    lavanda: "Violeta y plata, luna llena", chocolate: "Caramelo y cuero", primavera: "Lino blanco y cerezo en flor",
    verano: "Lino amarillo y atardecer en el mar", otono: "Óxido y luna de cosecha",
  },
  pisos: {
    css: "Nogal de siempre (dibujo)", nogal: "Nogal oscuro", roble: "Roble claro miel", cerezo: "Cerezo rojizo",
    blanco: "Tablones blancos envejecidos", gris: "Gris ceniza", damero: "Damero de mármol crema y café", terracota: "Baldosa de terracota",
  },
  defecto: { pared: "vino", ventana: "crema", piso: "nogal" },
  temporadas: [
    { desde: "12-15", hasta: "12-26", pared: "navidad", ventana: "crema", piso: "cerezo" },
    { desde: "02-01", hasta: "02-14", pared: "sanvalentin", ventana: "rosa", piso: "cerezo" },
    { meses: [9, 10, 11], pared: "primavera", ventana: "primavera", piso: "roble" },
    { meses: [12, 1, 2], pared: "verano", ventana: "verano", piso: "terracota" },
    { meses: [3, 4, 5], pared: "otono", ventana: "otono", piso: "nogal" },
    { meses: [6, 7, 8], pared: "invierno", ventana: "crema", piso: "gris" },
  ],
};

// Girasoles y limones ilustrados para la lluvia del libro "21 Sep 2026".
// Si estas imágenes existen (fondo transparente, cada flor o fruto solo y
// centrado), la lluvia las usa en lugar de las flores dibujadas por código;
// si falta alguna, se ignora, y si no hay ninguna vuelve el dibujo.
const ARTE_GIRASOLES = {
  girasoles: ["assets/girasol_1.webp", "assets/girasol_2.webp", "assets/girasol_3.webp", "assets/girasol_4.webp"],
  limones: ["assets/limon_1.webp", "assets/limon_2.webp", "assets/limon_3.webp"],
};

// Los gatos de la sala (gatos.js los dibuja por código y los hace vivir).
//  - id: nombre interno. - nombre: (opcional) aparece sobre el gato al tocarlo (y al pasar el ratón).
//  - pelaje: "atigrado" (mackerel tabby gris-marrón), "carey" (brindada, con la
//    mancha naranja en la cara), "tricolor" (calicó: blanca con manchas negras
//    y naranjas) o "van_cafe" (blanca con café en la cabeza, el lomo y la cola).
//  - caracter: (opcional) pereza 0-1 (cuánto se echa a dormir), velocidad (1 =
//    normal), sillon ("rojo" o "amarillo": su favorito para la siesta) y voz
//    (tono del maullido: 1 = normal, menos = más grave).
//  - piezas: (opcional) el piezas.json de un gato ILUSTRADO cortado en piezas
//    con _tools/gato_piezas.py (assets/gatos/<id>/): cola, patas, cuerpo y
//    cabeza pintados que el esqueleto anima; mientras cargan (o si faltan) se
//    ve el dibujo. El ilustrado solo tiene la pose de pie...
//  - echado: (opcional, con piezas) la imagen del mismo gato echado
//    (_tools/gato_echado.py, assets/gatos/<id>/echado.webp): la muestra al
//    dormir en el suelo o en el sillón. Sin ella, en vez de echarse se queda
//    de pie mirando.
//  - imagen: (opcional) un PNG/WebP del gato entero, de perfil mirando a la
//    derecha, con fondo transparente (prompts en PROMPTS.md); si existe, el
//    gato se mueve como recorte de papel en lugar del dibujo.
// Poses enteras del ilustrado: `echado` (de perfil) y `sentado` (de frente, mirando a quien mira);
// las prepara  python _tools/gato_pose.py <png> <id> echado|sentado  (originales en privado/gatos/ilustrados/).
const GATOS = [
  { id: "atigrado", nombre: "Karencito", pelaje: "atigrado", piezas: "assets/gatos/atigrado/piezas.json", echado: "assets/gatos/atigrado/echado.webp", sentado: "assets/gatos/atigrado/sentado.webp", caracter: { pereza: .7, velocidad: .85, sillon: "rojo" } },
  { id: "carey", nombre: "Elma", pelaje: "carey", piezas: "assets/gatos/carey/piezas.json", echado: "assets/gatos/carey/echado.webp", sentado: "assets/gatos/carey/sentado.webp", caracter: { pereza: .35, velocidad: 1.15 } },
  { id: "tricolor", nombre: "Mia", pelaje: "tricolor", piezas: "assets/gatos/tricolor/piezas.json", echado: "assets/gatos/tricolor/echado.webp", sentado: "assets/gatos/tricolor/sentado.webp", caracter: { pereza: .5, velocidad: 1, sillon: "amarillo" } },
  { id: "vancafe", nombre: "Chunchun", pelaje: "van_cafe", piezas: "assets/gatos/vancafe/piezas.json", echado: "assets/gatos/vancafe/echado.webp", sentado: "assets/gatos/vancafe/sentado.webp", caracter: { pereza: .65, velocidad: .9, sillon: "amarillo" } },
];

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
    // copiarlas a privado/album/ y correr  python _tools/candado.py
    id: "album",
    tipo: "album",
    titulo: "Álbum de fotos",
    lomo: "Álbum",
    tapa: "marron",
    candado: "assets/candado.json",
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
  {
    // Los días importantes. Se escriben en privado/calendario/dias.json (fuera
    // de git; el formato está en calendario.js) y se cifran con el mismo
    // candado del álbum:  python _tools/candado.py   (pide el número una vez).
    id: "calendario",
    tipo: "calendario",
    titulo: "Días importantes",
    lomo: "Días",
    tapa: "verde",
    dedicatoria: "Los días que son nuestros",
    candado: "assets/candado.json",
    cifrado: "assets/calendario/dias.bin",
    efecto_fin: "estrellas",
    estante: { lado: "izq", fila: 0, col: 5 },
  },
];
