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
//             navegador recuerda el orden. Una carta con `hueco: true` nace DE
//             PIE en el hueco a la izquierda de esa columna (col 8 = a la
//             derecha de la última); sin él, acostada en un montón de dos ranuras.
//  - mesa: (opcional) true = nace DE PIE sobre la mesa en vez de en la librería
//          (la carta que espera a que la abran). Si la mesa no la admite va a su
//          `estante`. Solo la primera vez: después queda donde la dejen.
//  - brillo: (opcional) "aurea" = brilla con un reflejo de arcoíris, sutil,
//            hasta que alguien lo abre por PRIMERA vez (brillo.js); desde
//            entonces queda como los demás. Vale para libros y cartas.
// =====================================================================

// Piezas de la sala que pueden llevar una imagen propia (PNG o WebP con
// fondo transparente, vistas de frente). Si el archivo existe se usa; si no,
// se queda el dibujo. Los prompts para generarlas están en PROMPTS.md.
const DECORACION = {
  sillon_rojo: "assets/sillon_rojo.webp",
  sillon_amarillo: "assets/sillon_amarillo.webp",
  mesa: "assets/mesa.webp",            // vista de frente; los libros se apoyan en su tapa
  alfombra: "assets/alfombra.webp",    // vista en perspectiva, con el borde de abajo más ancho
  // La pared, la ventana y el piso pintados van en FONDOS (catalogo.js), a elección; estas claves sueltas
  // (pared, ventanal, suelo, pared_vertical) siguen valiendo para un archivo único sin selector.
};

// Los fondos pintados (pared, ventana, piso), los muebles a elección (sillones, mesa, alfombra), los
// adornos de las librerías y las RAZAS de mascota ya NO se escriben aquí: salen de catalogo.js, que
// genera _tools/catalogo.py desde catalogo/catalogo.xlsx (una fila por variante; solo entran las que ya
// tienen su imagen en assets/). Los PNG nuevos entran con _tools/bandeja.py. Pedidos para la IA y
// estado de cada pieza: OneDrive\Escritorio\Taller del libro (CATALOGO.md).

// Girasoles y limones ilustrados para la lluvia del libro "21 Sep 2026".
// Si estas imágenes existen (fondo transparente, cada flor o fruto solo y
// centrado), la lluvia las usa en lugar de las flores dibujadas por código;
// si falta alguna, se ignora, y si no hay ninguna vuelve el dibujo.
const ARTE_GIRASOLES = {
  girasoles: ["assets/girasol_1.webp", "assets/girasol_2.webp", "assets/girasol_3.webp", "assets/girasol_4.webp"],
  limones: ["assets/limon_1.webp", "assets/limon_2.webp", "assets/limon_3.webp"],
};

// Las mascotas de ESTA sala. Cada una es una RAZA del catálogo (RAZAS en catalogo.js: el dibujo de
// respaldo, las piezas pintadas, las poses y el carácter por defecto) con el nombre que le puso la
// pareja. Cuando haya cuentas, esta lista será lo que cada pareja tenga elegido o comprado (la idea: una
// ranura gratis con cualquiera de las razas, y más de pago). `caracter` aquí pisa el de la raza
// (pereza 0-1, velocidad, sillon "rojo"/"amarillo", voz); `id` solo hace falta si hay dos de la misma raza.
const MASCOTAS = [
  { raza: "atigrado", nombre: "Karencito" },
  { raza: "carey", nombre: "Elma" },
  { raza: "tricolor", nombre: "Mia" },
  { raza: "vancafe", nombre: "Chunchun" },
];
// GATOS es lo que anima gatos.js (no cambia): la raza más lo propio de cada mascota.
const GATOS = MASCOTAS.map((m, i) => {
  const r = (typeof RAZAS === 'object' && RAZAS && RAZAS[m.raza]) || { pelaje: m.raza };
  const repetidas = MASCOTAS.slice(0, i).filter(o => o.raza === m.raza).length;
  return Object.assign({}, r, m, { id: m.id || (m.raza + (repetidas ? '_' + (repetidas + 1) : '')),
    caracter: Object.assign({}, r.caracter || {}, m.caracter || {}) });
});

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
  // ---- LAS CARTAS (carta.js). Diez repartidas por la sala, cortas, para irlas encontrando de a poco: acostadas en montones
  //      (dos ranuras de la librería), de pie en el hueco entre dos libros (hueco: true) y una sola, distinta, esperando sobre la
  //      mesa. NINGUNA de las diez dice "te amo": eso lo dice solo la de la mesa. Formato completo del bloque `carta`: color del
  //      papel (crema, marfil, rosa, celeste, lavanda, menta, rojo, negro), cierre "cera" (se rompe el sello) | "rasgar" (se
  //      arranca la tira), letra "manuscrita" | "imprenta", apertura { modo: "muchos" | "colores" con 1-3 colores | "nada" }
  //      (los corazones que llueven al abrir), hojas (1 a 5, cada una con sus saltos de línea), firma (opcional), final
  //      (null, o una pregunta abierta { tipo: "abierta", pregunta } o cerrada { tipo: "cerrada", pregunta, opciones (2-5),
  //      obligatoria: índice o null, huida: "explotar" | "fantasma" | "barrido" }) y acepto (la fiesta: imagen, animaciones
  //      "fuegos" | "flores" | "corazones" | "estrellas" | "confeti", colores, texto). Las respuestas quedan en el navegador de
  //      quien la abre. ----
  {
    id: "carta", tipo: "carta", titulo: "Ábreme",
    carta: { color: "rosa", cierre: "cera", apertura: { modo: "muchos" },
      hojas: ["Te quiero.\n\nAsí, en chiquito, para que lo leas rapidito y sigas con tu día sabiendo que te quiero un montón."] },
    estante: { lado: "der", fila: 2, col: 6 },
  },
  {
    id: "buenos_dias", tipo: "carta", titulo: "Buenos días",
    carta: { color: "crema", cierre: "rasgar", apertura: { modo: "colores", colores: ["#ffd166", "#f4a261", "#ffffff"] },
      hojas: ["Buenos días, Karen.\n\nOjalá hoy te pase algo bonito. Y si no te pasa nada, igual tienes esto: te quiero."] },
    estante: { lado: "izq", fila: 0, col: 2, hueco: true },
  },
  {
    id: "buenas_noches", tipo: "carta", titulo: "Buenas noches",
    carta: { color: "lavanda", cierre: "cera", apertura: { modo: "colores", colores: ["#8338ec", "#c8b9e2", "#ffffff"] },
      hojas: ["Buenas noches.\n\nA esta hora te extraño un poquito más que el resto del día. Duerme rico, mañana seguimos."] },
    estante: { lado: "izq", fila: 1, col: 5 },
  },
  {
    id: "psst", tipo: "carta", titulo: "Psst",
    carta: { color: "menta", cierre: "rasgar", apertura: { modo: "muchos" },
      hojas: ["Te extraño.\n\nNada más eso. Ya la puedes guardar."] },
    estante: { lado: "izq", fila: 1, col: 5 },
  },
  {
    id: "si_estas_triste", tipo: "carta", titulo: "Si estás triste",
    carta: { color: "celeste", cierre: "cera", apertura: { modo: "colores", colores: ["#70d6ff", "#118ab2", "#ffffff"] },
      hojas: ["Si abriste esta es porque andas bajoneada.\n\nRespira. Ya va a pasar. Y mientras pasa, acá estoy yo, que te quiero y te necesito igual en tus días lindos que en los feos."] },
    estante: { lado: "izq", fila: 2, col: 6 },
  },
  {
    id: "para_despues", tipo: "carta", titulo: "Para después",
    carta: { color: "marfil", cierre: "cera", apertura: { modo: "muchos" },
      hojas: ["Me encanta cómo te ríes. Me encanta cómo hablas rápido cuando te emocionas. Me encanta todo lo que eres, y eso no se me va a pasar."] },
    estante: { lado: "izq", fila: 3, col: 1 },
  },
  {
    id: "hoy", tipo: "carta", titulo: "Hoy",
    carta: { color: "rojo", cierre: "cera", apertura: { modo: "colores", colores: ["#e63946", "#ffd166"] },
      hojas: ["Hoy pensé en ti como mil veces.\n\nMás o menos lo normal."] },
    estante: { lado: "izq", fila: 3, col: 4, hueco: true },
  },
  {
    id: "leeme", tipo: "carta", titulo: "Léeme",
    carta: { color: "celeste", cierre: "rasgar", apertura: { modo: "muchos" },
      hojas: ["Te necesito.\n\nNo de una forma dramática, sino de la buena: contigo todo me sale mejor."] },
    estante: { lado: "der", fila: 0, col: 1 },
  },
  {
    id: "una_mas", tipo: "carta", titulo: "Una más",
    carta: { color: "rosa", cierre: "rasgar", apertura: { modo: "muchos" },
      hojas: ["Eres mi persona favorita.\n\nLo digo en serio. No es una carta cualquiera (bueno, sí, pero igual lo digo en serio)."] },
    estante: { lado: "der", fila: 1, col: 3, hueco: true },
  },
  {
    id: "para_ti", tipo: "carta", titulo: "Para ti",
    carta: { color: "crema", cierre: "cera", apertura: { modo: "muchos" },
      hojas: ["Gracias por aguantarme, por escucharme y por quererme así como soy.\n\nTe quiero muchichichichisimo."] },
    estante: { lado: "der", fila: 3, col: 5 },
  },
  {
    // LA CARTA DE LA MESA: la única que dice "te amo". Nace de pie sobre la mesa (mesa: true) y BRILLA (brillo: "aurea",
    // brillo.js) con un reflejo de arcoíris, sutil, hasta que Karen rompe el sello por primera vez; desde entonces queda
    // como una carta más. Al abrirla llueven corazones ROJOS Y NEGROS. Las hojas van en el tono del usuario (sin tildes, como
    // sus notas); las frases entre comillas en el pedido del 11 oct son suyas tal cual y el resto se puede retocar aquí.
    // Al final, la pregunta: hay cinco opciones pero solo "acepto" se deja tocar (obligatoria: 0; las otras huyen del dedo y
    // al séptimo intento explotan). Al aceptar, la fiesta: el grito "wiwiwiwiwi..." gigante y volando por toda la pantalla
    // (animación "texto") entre corazones y fuegos.
    id: "karen", tipo: "carta", titulo: "Para Karen",
    mesa: true, brillo: "aurea",
    carta: { color: "marfil", cierre: "cera", letra: "manuscrita",
      apertura: { modo: "colores", colores: ["#e63946", "#1a1618"] },
      hojas: [
        // la primera hoja son las palabras del usuario TAL CUAL (11 oct noche); solo se partió en párrafos para leerla
        "hoy no encontre palabras para expresar el como me siento, estoy feliz muy feliz, es algo que he soñado siempre, y es algo que me hubiera encantado que resultara contigo... y la verdad? es que siiii paso contigo!!\n\nse que tengo otros escritos para ti donde se siente mucho la poesia, los sentimientos y todo eso, pero de hace unas semanas que me estoy sintiendo mmmm como era la palabra? inefable! creo que solo me quedan 2 palabras para poder expresar lo que siento por ti, y las empezaras a escuchar muy seguido de ahora en adelante...\n\nse que te he dicho varias veces lo que me gusta fisicamente de ti, y no sera esta la excepcion, tus ojitos negros obsidiana, tu pelito azabache, tus labios de tan amplio volumnen y tu nariz afilada y cincelada... si hable de tus ojos? ME ENCANTAN TUS OJOS ALMENDRADOS!!\n\ny como persona? me gusta tu amor por los animales, me inspira mucho la disiplina que tienes frente a tus objetivos, lo linda que eres y el como te llevas con tu familia.. tus gustos en colores oscuros o tu gran gusto por la comida ajena y mas si nunca antes la habias probado.. me gustaria ser tu nuevo sabor favorito, tu nuevo aroma, persona y lugar.",
        "no se escribir bonito pero si se lo que siento, y es bien simple:\n\nte amo.\n\nte quiamuuu muchichisiiiiiimoooo mi wawita bellaaaaaaaa. hoy que empezamos y todos los dias que vienen, que ojala sean muchisimos.",
      ],
      firma: "",
      final: { tipo: "cerrada", pregunta: "cielito mio de mi corazon, seria mucha molestia que acepte este corazon? te gustaria pololear conmigo?",
        opciones: ["acepto", "mmm...", "lo pienso", "mañana te digo", "nop"], obligatoria: 0, huida: "explotar" },
      // la imagen de la fiesta: un GIF (o PNG) en assets/karen/fiesta.gif, o un enlace directo (https://...gif); si el archivo
      // no existe, la fiesta sale sin imagen (el visor la esconde sola). Mejor liviano (menos de ~3 MB): se descarga en el celular.
      acepto: { imagen: "assets/karen/fiesta.gif", animaciones: ["texto", "corazones", "fuegos"], colores: ["#e63946", "#ff70a6", "#ffd166", "#fff3e0"], texto: "wiwiwiwiwi wiwiwiwi wiiiiiiiiii" } },
    estante: { lado: "der", fila: 3, col: 2 },
  },
];

// LAS TORRES DE CARTAS (el cordón): cuántas hay en esta sala. Cada torre ata hasta 100 cartas y es un objeto
// suelto: nace al costado de la librería derecha, se arrastra a donde quieras (sobre la mesa, junto a un sillón) y
// se apila sobre otra torre, hasta cinco de alto; un toque abre su lista y tocar una carta la lleva a la mesa;
// arrastrar una carta hasta la torre la ata. En la librería las cartas forman MONTONES de hasta 10 (dos ranuras).
// 0 = sin torres.
const TORRES_CARTAS = 1;
