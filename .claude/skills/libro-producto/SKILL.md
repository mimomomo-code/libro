---
name: libro-producto
description: Actualiza el PRODUCTO de la sala del libro (el repo privado DYBITSOLUTIONS/bookscat, en Documents/bookscat) desde la fábrica, sin nada personal (ni poemas, ni notas, ni fotos, ni fechas, ni nombres) y con libros de muestra. Usar cuando el usuario diga "sube bookscat", "actualiza el producto", "pasa lo nuevo al repo privado de la empresa", "exporta la versión vendible" o similar.
---

# Actualizar el producto (bookscat)

Fábrica (la sala de la pareja, lo tiene todo): `C:\Users\basti\Documents\libro`. Producto (el repo de
DYBITSOLUTIONS, privado, para vender la sala a otras parejas): `C:\Users\basti\Documents\bookscat`,
remoto `https://github.com/DYBITSOLUTIONS/bookscat.git` (credencial de github.com = DYBITSOLUTIONS).
Herramienta: `_tools/producto.py` (copia en espejo todo lo versionado, sustituye los tramos personales,
cifra un candado DE MUESTRA con número 123456, pasa la GUARDIA y hace el commit allí).

## OJO: desde el 9 oct (noche) el producto vive aparte

bookscat ya tiene su propio desarrollo (cuenta.js, tienda.js, editor.js, crear.js y cambios en sala.js,
gatos.js, fondos.js e index.html) que la fábrica NO tiene. `producto.py` se frena si el último commit del
producto no es una exportación ("Producto <fecha>..."), y `--forzar` lo pisaría todo: NO usarlo. Lo que
cambie en la fábrica y haga falta en el producto se lleva A MANO (diff del archivo y aplicar), y al revés
igual (los libros nuevos de muestra, los arreglos de gatos.js...). Los pasos de abajo valen solo para
regenerar un producto desde cero en otra carpeta (`--destino`), por ejemplo para comparar.

## Pasos

1. Comprobar que la fábrica está como se quiere exportar (`git -C C:/Users/basti/Documents/libro status --short`
   vacío o con solo lo que el usuario sabe; si hubo cambios de código, `?test=1` en OK).
2. `cd C:/Users/basti/Documents/libro && python _tools/producto.py --ver`. Si dice que un tramo de
   sustitución ya no aparece, la fábrica cambió ese texto: actualizar la tabla `SUSTITUCIONES` de
   `producto.py` (el viejo tiene que coincidir EXACTAMENTE) antes de seguir.
3. `python _tools/producto.py` hace el commit en el producto. Con `--push` además lo sube.
   Si la GUARDIA para con hallazgos, NO forzar: o es contenido personal nuevo en la fábrica (añadir
   su sustitución o excluir el archivo) o es una palabra corriente que entró de forma legítima (quitarla
   de `PROHIBIDO` a conciencia, diciéndolo).
4. Verificar: test del producto servido por http (el candado no abre desde file://):
   ```
   cd C:/Users/basti/Documents/bookscat && python -m http.server 8765 --bind 127.0.0.1   (en segundo plano)
   node _tools/capturar_cdp.js 'nav:http://127.0.0.1:8765/index.html?test=1' 'wait:document.title.startsWith("TEST")' 'state:(document.body.innerText.match(/TEST.*comprobaciones/)||[""])[0]'
   ```
   y, si cambió algo visible, capturar y MIRAR (`?abrir=album&clave=123456&p=1`, `?abrir=calendario&clave=123456&p=1`).
5. Responder con el commit del producto, qué viajó y qué se sustituyó.

## Reglas

- Lo personal NUNCA viaja: poema.js, assets/suenos/, assets/album/, assets/calendario/, assets/candado.json
  (el real), `_tools/producto.py` y `_tools/producto/` (la tabla de sustituciones CONTIENE los textos
  personales) y esta skill. En su lugar van el poema y los días de `_tools/producto/`, tres fotos
  dibujadas y un candado con sal propia.
- El producto no se edita a mano: cualquier cambio se hace en la fábrica y se vuelve a exportar. Si
  algún día el producto se desarrolla aparte (cuentas, tienda), ese día se decide el sentido del flujo.
- Un contenido personal nuevo en la fábrica (un libro, una nota, un nombre) necesita su sustitución
  en `producto.py` ANTES de exportar; la guardia lo recordará.
