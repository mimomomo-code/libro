---
name: libro-bandeja
description: Monta en la sala del libro las imágenes que el usuario generó con ChatGPT y dejó en la Bandeja del Taller (identificarlas con la hoja de contacto, convertirlas, activarlas en la página, verificar con capturas y test, y hacer el commit). Usar cuando diga "ya generé las imágenes", "están en la bandeja", "monta lo que dejé en el escritorio" o similar.
---

# Montar lo que hay en la Bandeja

Fábrica: `C:\Users\basti\Documents\libro`. Taller: `C:\Users\basti\OneDrive\Escritorio\Taller del libro`
(los PNG de ChatGPT caen en `Bandeja\`, con el nombre del pedido o con nombre UUID). Herramienta:
`_tools/bandeja.py`. Regla de la casa: todo cambio visual se CAPTURA y se MIRA, nunca se da por bueno a ciegas.

## Pasos

1. **Listar:** `cd C:/Users/basti/Documents/libro && python _tools/bandeja.py`
   Imprime cada imagen numerada (tamaño, alfa, hora, qué parece) y la lista FALTAN por familia, y deja
   `Bandeja\_hoja.png`. **Abrir `_hoja.png` con Read y mirarla.** Identificar cada número cruzando: lo
   que se ve, la lista de lo que falta, lo que el usuario dijo que generó y la hora (ChatGPT guarda
   cada tanda en minutos distintos). Si queda alguna duda real, preguntar con los números y los
   candidatos; si no, decidir.
2. **Montar:** `python _tools/bandeja.py 1=pared_marina 2=adorno_planta 3=atigrado_echado`
   (el nombre = el de "GUARDAR EL RESULTADO COMO" sin .png; mascotas `<raza>_<pose>`). Si una pareja
   de sillones no encuentra el hueco, repetir solo esa con `--corte 0.5` (fracción del ancho). Si una
   imagen "no tiene nada opaco", el fondo no era transparente de verdad: avisar y que la pida de nuevo.
   La herramienta convierte a `assets/`, guarda el original como WebP sin pérdida en `Hechos\` o en
   `Mascotas\<raza>\`, regenera `catalogo.js` y el Taller, y deja `_capturas/bandeja.png`.
3. **Mirar los controles:** Read de `_capturas/bandeja.png`; si entró una mascota de pie, también
   `_capturas/piezas_<raza>.png` (los cortes de cola, patas, cuerpo y cabeza tienen que caer bien; si
   no, `python _tools/pieza.py <webp> mascota <raza> parado` no admite ajustes: usar
   `python _tools/gato_piezas.py <imagen> <raza> --ycut F --xsplit F --xcuello F` y mirar otra vez).
4. **Test de la página:**
   ```
   node _tools/capturar_cdp.js 'nav:file:///C:/Users/basti/Documents/libro/index.html?test=1' 'wait:document.title.startsWith("TEST")' 'state:(document.body.innerText.match(/TEST[^\n]*comprobaciones/)||[""])[0]'
   ```
   Tiene que decir `TEST OK · N comprobaciones` (N = 26 al 9 oct 2026; si sube, bien; si falla, parar).
5. **Capturar la pieza puesta** y mirarla, en PC y en celular (`--movil`). Forzar la variante con
   `?fondo=pared:<clave>` / `ventana:` / `piso:` / `sillones:` / `mesa:` / `alfombra:` (se combinan con
   comas); los adornos salen solos; las mascotas con `?semilla=7`. Ejemplo:
   ```
   node _tools/capturar_cdp.js --w 1366 --h 800 'nav:file:///C:/Users/basti/Documents/libro/index.html?fondo=pared:marina&semilla=7' 'sleep:3500' 'shot:C:/Users/basti/Documents/libro/_capturas/marina_pc.png'
   ```
   Juzgar: ¿encaja la escala?, ¿el alfa está limpio?, ¿el zócalo cae en la línea del piso?, ¿el adorno
   cabe en su estante?, ¿la mascota pisa el suelo? Si algo está mal, decirlo y proponer el arreglo
   (otra imagen, o un ajuste de código) antes de seguir.
6. **Commit en la fábrica** con mensaje narrativo largo (qué entró, qué se verificó, qué falta), via
   `git commit -F <archivo>`, SIN "Co-Authored-By". No push salvo que el usuario lo pida. Si quiere
   verlo en línea, seguir con `/libro-publicar`.
7. **Responder** con lo montado, lo que sigue faltando (lo dice la herramienta) y las capturas miradas.
