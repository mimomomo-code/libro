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
  titulo: "Me encantas",
  autor: "Un amigo extraño",
  dedicatoria: "",
  tapa: "burdeos",
  alinear: "izquierda",
  tamano: 1,

  paginas: [
`Me encantas agrupa
Cual grupo de hojas
Sentimientos vividos
Que en algún momento sentí.`,

`Cuando las veo
Una por una
Llega tu brisa
Se vuelven a ir.`,

`Como explicar en breves palabras
Lo que significa que siento por ti
Un cariño que va creciendo y creciendo
Calentando en invierno
Y refrescando en abril.`,

`Pero ese no es el significado
Que yo le he dado
A un me encantas forzado
Lo podrías pensar.`,

`Veelo mejor no como algo malo
Sino un freno de mano
¡Me tiemblan las manos!

Motor encendido
Sentado y seguro
Manos al volante
Ya quiero partir`,

`Limitarme a palabra
Quizás te confunde
Porqué me limito
A decir tu nombre

Ay karen suspiro
Jhuliana susurro
Me gustas te digo
Y en me encantas me freno
Cuchito te digo
Cuentitos te leo`,

`Te extraño de día
en las tardes te espero
en las noches reímos
Y empezamos de nuevo`,

`He hablado de tu risa? Claro que sí estoy seguro
Te he dicho te quiero, estoy seguro que si!
De tus ojos almendrados, y de tu pelito negro,
ahora lo hago
Disculpa la pausa
Es que babeo por ti.`,

`Talvez te dije que a ojos cerrados
Aveces es la forma en las que te vuelvo a ver
Que sueño contigo estando a tu lado
A ojos abiertos y viendote comer
Tomando agüita
Midiendonos las manos
Abrazándote desde los hombros
Y tu pelo oler.`,

`Ha pasado tan poco tiempo y haces bien en temer
Tremendo poder el qué te he dado
Mi amor infinito es díficil de ver`,

`Te quiero y te extraño
Es divertido y comodo
Imaginarme a tu lado
En un atardecer de otoño
De aquí a unos años
Esperemos que funcione todo
Te quiero y te adoro
Te la dedica
Un amigo extraño.`,
  ],

  colofon: "",
};
