// =====================================================================
//  AQUÍ VA TU POEMA. Es lo único que hace falta tocar.
//
//  - titulo / autor: van grabados en la tapa y en la primera página.
//  - dedicatoria: frase en cursiva bajo el título (déjala "" si no quieres).
//  - tapa: color del cuero: "burdeos", "verde", "azul", "marron" o "negro".
//  - alinear: "izquierda" (versos alineados, lo clásico) o "centro".
//  - tamano: 1 es el tamaño normal de letra; 0.9 más chico, 1.15 más grande.
//  - paginas: cada elemento entre comillas invertidas (`) es UNA PÁGINA.
//        * Un Enter separa versos.
//        * Una línea en blanco separa estrofas dentro de la misma página.
//        * Para poner un título a una página: { titulo: "I", texto: `...` }
//  - colofon: nota de la última página (fecha, lugar, "para ti"...).
// =====================================================================

const LIBRO = {
  titulo: "Volverán las oscuras golondrinas",
  autor: "Gustavo Adolfo Bécquer",
  dedicatoria: "Un poema de muestra: cámbialo por el tuyo en poema.js",
  tapa: "burdeos",
  alinear: "izquierda",
  tamano: 1,

  paginas: [
`Volverán las oscuras golondrinas
en tu balcón sus nidos a colgar,
y otra vez con el ala a sus cristales
jugando llamarán.`,

`Pero aquellas que el vuelo refrenaban
tu hermosura y mi dicha a contemplar,
aquellas que aprendieron nuestros nombres...
¡esas... no volverán!`,

`Volverán las tupidas madreselvas
de tu jardín las tapias a escalar,
y otra vez a la tarde aún más hermosas
sus flores se abrirán.`,

`Pero aquellas, cuajadas de rocío
cuyas gotas mirábamos temblar
y caer como lágrimas del día...
¡esas... no volverán!`,

`Volverán del amor en tus oídos
las palabras ardientes a sonar;
tu corazón de su profundo sueño
tal vez despertará.`,

`Pero mudo y absorto y de rodillas
como se adora a Dios ante su altar,
como yo te he querido...; desengáñate,
¡así... no te querrán!`,
  ],

  colofon: "Rima LIII · 1871",
};
