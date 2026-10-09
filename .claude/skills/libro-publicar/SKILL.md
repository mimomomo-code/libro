---
name: libro-publicar
description: Publica la sala del libro en la vitrina (el repo público del que sirve GitHub Pages) copiando solo lo que el navegador necesita, sin Excel, herramientas ni prompts. Usar cuando el usuario diga "publica", "súbelo", "que se vea en línea", "actualiza la página de Karen" o pida ver los cambios en la web.
---

# Publicar la vitrina

Fábrica (privada, lo tiene todo): `C:\Users\basti\Documents\libro`. Vitrina (pública, solo la página):
`C:\Users\basti\Documents\libro-publico`, repo aparte del que sirve GitHub Pages en
https://mimomomo-code.github.io/libro/. Herramienta: `_tools/publicar.py` (copia en espejo, escribe un
`catalogo.js` PÚBLICO sin precios ni tienda, README corto, hook del candado, y hace el commit allí).

## Pasos

1. Comprobar que la fábrica está en el estado que se quiere publicar (`git -C C:/Users/basti/Documents/libro status --short`
   vacío o con solo lo que el usuario sabe; el test `?test=1` en OK si hubo cambios de código).
2. `cd C:/Users/basti/Documents/libro && python _tools/publicar.py --ver` y leer qué entra y qué se borra.
   Nunca deben aparecer `catalogo/`, `_tools/` (salvo `_tools/hooks/pre-commit`), `PROMPTS.md`, `privado/`,
   `.claude/` ni imágenes en claro en `assets/album` o `assets/calendario`.
3. `python _tools/publicar.py` hace el commit en la vitrina. Con `--push` además lo sube.
   Si dice que la vitrina no tiene remoto, es la primera vez: el usuario tiene que (a) en GitHub,
   renombrar el repo `libro` a `libro-taller` y ponerlo privado, (b) crear un repo público nuevo
   llamado `libro`, (c) activar Pages en él (rama main, raíz). Entonces:
   ```
   git -C "C:/Users/basti/Documents/libro" remote set-url origin https://mimomomo-code@github.com/mimomomo-code/libro-taller.git
   git -C "C:/Users/basti/Documents/libro-publico" remote add origin https://mimomomo-code@github.com/mimomomo-code/libro.git
   python _tools/publicar.py --push
   ```
   La credencial de GitHub de esta cuenta es la de mimomomo-code (no confundir con DYBITSOLUTIONS).
4. Verificar: `git -C C:/Users/basti/Documents/libro-publico ls-files | grep -c "^catalogo/"` da 0;
   `grep -c precio C:/Users/basti/Documents/libro-publico/catalogo.js` da 0. Tras el push, Pages tarda
   uno o dos minutos; dar la URL.
5. Responder con el commit de la vitrina y qué cambió para quien entre.

## Reglas

- `--push` solo si el usuario pidió verlo en línea; el push de la FÁBRICA es otra cosa y también se pide aparte.
- La vitrina no se edita a mano: cualquier cambio se hace en la fábrica y se vuelve a publicar.
