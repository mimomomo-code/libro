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
// =====================================================================

const LIBRO = {
  titulo: "Me encantas",
  autor: "Bastian M. Ascencio",
  dedicatoria: "Para Karen Maquera",
  tapa_solo_titulo: true,   // en la tapa solo el título; el autor y la dedicatoria van en la primera página
  tapa: "burdeos",
  alinear: "izquierda",
  tamano: 1,

  paginas: [
{ efecto: "hojas", texto:
`Me encantas agrupa
Cual grupo de hojas
Sentimientos vividos
Que en algún momento sentí.` },

{ efecto: "brisa", texto:
`Cuando las veo
Una por una
Llega tu brisa
Se vuelven a ir.` },

{ efecto: "nieve", texto:
`Cómo explicar en breves palabras
Lo que significa que siento por ti
Un cariño que va creciendo y creciendo
Calentando en invierno
Y refrescando en abril.` },

`Pero ese no es el significado
Que yo le he dado
A un me encantas forzado
Lo podrías pensar.`,

`Velo mejor, no como algo malo
Sino un freno de mano
¡Me tiemblan las manos!

Motor encendido
Sentado y seguro
Manos al volante
Ya quiero partir`,

{ efecto: "petalos", texto:
`Limitarme a palabra
Quizás te confunde
Por qué me limito
A decir tu nombre

Ay, Karen, suspiro
Jhuliana susurro
Me gustas te digo
Y en me encantas me freno
Cuchito te digo
Cuentitos te leo` },

{ efecto: "estrellas", texto:
`Te extraño de día
En las tardes te espero
En las noches reímos
Y empezamos de nuevo` },

`¿He hablado de tu risa? Claro que sí, estoy seguro
Te he dicho te quiero, ¡estoy seguro que sí!
De tus ojos almendrados, y de tu pelito negro,
Ahora lo hago
Disculpa la pausa
Es que babeo por ti.`,

{ efecto: "luciernagas", texto:
`Tal vez te dije que a ojos cerrados
A veces es la forma en la que te vuelvo a ver
Que sueño contigo estando a tu lado
A ojos abiertos y viéndote comer
Tomando agüita
Midiéndonos las manos
Abrazándote desde los hombros
Y tu pelo oler.` },

{ efecto: "lluvia", texto:
`Ha pasado tan poco tiempo y haces bien en temer
Tremendo poder el que te he dado
Mi amor infinito es difícil de ver` },

{ efecto: "hojas", texto:
`Te quiero y te extraño
Es divertido y cómodo
Imaginarme a tu lado
En un atardecer de otoño
De aquí a unos años
Esperemos que funcione todo
Te quiero y te adoro
Te la dedica
Un amigo extraño.` },
  ],

  efecto_fin: "petalos",
  colofon: "",

  // Música de fondo: una pieza de piano ORIGINAL generada para esta página
  // (sin copyright de terceros), guardada en la carpeta musica/. Arranca con
  // el primer toque, suena bajita y se repite sin costura. musica: null la quita.
  musica: {
    archivo: "musica/piano.mp3",
    volumen: 0.05,   // 0 a 1 (0.05 = 5 %)
  },
};
