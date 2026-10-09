// =====================================================================
//  AQUÍ VA TU POEMA. Es lo único que hace falta tocar.
//
//  - titulo / autor: van grabados en la tapa y en la primera página.
//  - dedicatoria: frase en cursiva bajo el título (déjala "" si no quieres).
//  - tapa: color del cuero: "burdeos", "verde", "azul", "marron" o "negro".
//  - alinear: "izquierda" (versos alineados, lo clásico) o "centro".
//  - tamano: 1 es el tamaño normal de letra; 0.9 más chico, 1.15 más grande.
//  - paginas: cada elemento es UNA PÁGINA. Puede ser solo el texto entre
//    comillas invertidas (`), o { efecto: "...", texto: `...` }.
//        * Un Enter separa versos.
//        * Una línea en blanco separa estrofas dentro de la misma página.
//        * titulo: "I" pone un titulito arriba de la página (opcional).
//        * efecto: animación detrás del texto. Opciones:
//              "hojas"       hojas de otoño cayendo
//              "brisa"       hojas y ráfagas que cruzan de lado
//              "nieve"       copos
//              "petalos"     pétalos rosados
//              "estrellas"   cielo que titila con alguna estrella fugaz
//              "luciernagas" lucecitas que vagan
//              "lluvia"      lluvia fina
//              "corazones"   corazones que suben
//          Sin efecto = página quieta (también vale, no todas lo necesitan).
//  - efecto_fin: efecto de la última página ("Fin").
//  - colofon: nota de la última página (fecha, lugar, "para ti"...).
//
//  Lo que sigue es un poema DE MUESTRA para ver el libro funcionando:
//  cámbialo por el tuyo.
// =====================================================================

const LIBRO = {
  titulo: "Tu poema",
  autor: "Quien lo escriba",
  dedicatoria: "Para quien lo lea",
  tapa_solo_titulo: true,   // en la tapa solo el título; el autor y la dedicatoria van en la primera página
  tapa: "burdeos",
  alinear: "izquierda",
  tamano: 1,

  paginas: [
{ efecto: "hojas", texto:
`Este libro está esperando
a quien lo quiera escribir:
cada página una hoja,
cada hoja un porvenir.` },

{ efecto: "brisa", texto:
`Puede llevar un poema,
una carta, una canción,
la lista de lo que te gusta
o un secreto a media voz.` },

{ efecto: "estrellas", texto:
`De noche, cuando la sala
se queda quieta y en paz,
los gatos duermen en los sillones
y los libros vuelven a su lugar.` },

{ efecto: "petalos", texto:
`Escríbelo con calma,
sin prisa, verso a verso.
Lo que importa no es la rima:
es que sea tuyo el texto.` },
  ],

  efecto_fin: "luciernagas",
  colofon: "Escrito para la sala de lectura",

  // Música de fondo: una pieza de piano ORIGINAL generada para esta página
  // (sin copyright de terceros), guardada en la carpeta musica/. Arranca con
  // el primer toque, suena bajita y se repite sin costura. musica: null la quita.
  musica: {
    archivo: "musica/piano.mp3",
    volumen: 0.05,   // 0 a 1 (0.05 = 5 %)
  },
};
