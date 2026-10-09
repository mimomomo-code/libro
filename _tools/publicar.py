# -*- coding: utf-8 -*-
"""
PUBLICAR LA VITRINA. La fábrica (este repo, privado) tiene todo: el Excel, las herramientas, los prompts
y la historia. La vitrina es OTRO repo, público, con SOLO lo que el navegador necesita, y de él sirve
GitHub Pages. Esta herramienta copia a la carpeta de la vitrina lo publicable, en espejo (lo que ya no
existe aquí se borra allá), escribe un catalogo.js PÚBLICO (sin precios ni la tabla de tienda) y hace el
commit en la vitrina.

  python _tools/publicar.py                 copia + commit en la vitrina (sin push)
  python _tools/publicar.py --push          y además push (la vitrina tiene que tener remoto)
  python _tools/publicar.py --ver           solo lista lo que copiaría y lo que borraría
  python _tools/publicar.py --destino <carpeta>    otra carpeta (por defecto Documents/libro-publico)

Qué va: index.html, los .js de la página, assets/ (los .bin y candado.json van cifrados), musica/,
.nojekyll, .gitattributes, un README corto, un .gitignore y la guardia del candado (_tools/hooks/pre-commit
con core.hooksPath). Qué NO va: _tools/ (salvo el hook), catalogo/, PROMPTS.md, privado/, _capturas/,
.claude/ ni el README de la fábrica.
La primera vez crea la carpeta y hace git init. El remoto lo pone el usuario cuando exista el repo
público en GitHub:   git -C "<vitrina>" remote add origin https://mimomomo-code@github.com/mimomomo-code/libro.git
"""
import io, os, shutil, subprocess, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import catalogo as C
RAIZ = C.RAIZ
DESTINO = os.path.join(os.path.dirname(RAIZ), 'libro-publico')
CARPETAS = ('assets', 'musica')
SUELTOS = ('index.html', '.nojekyll', '.gitattributes')
GENERADOS = ('catalogo.js', 'README.md', '.gitignore')
README_PUBLICO = """# Sala de lectura

Una sala en el navegador: dos librerías, una ventana, dos sillones, una mesa y cuatro gatos.
Los libros se toman de la librería, se abren en la mesa y se devuelven arrastrándolos. Pensada
para verse desde el celular. Verla en línea: https://mimomomo-code.github.io/libro/

Este repositorio contiene solo la página publicada.
"""
GITIGNORE_PUBLICO = "Thumbs.db\n.DS_Store\n_capturas/\nprivado/\n"
try: sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception: pass

def publicables():
    """{ruta relativa publicada: ruta en la fábrica}"""
    out = {}
    for s in SUELTOS:
        if os.path.exists(os.path.join(RAIZ, s)): out[s] = os.path.join(RAIZ, s)
    for f in sorted(os.listdir(RAIZ)):
        if f.endswith('.js') and f != 'catalogo.js' and os.path.isfile(os.path.join(RAIZ, f)): out[f] = os.path.join(RAIZ, f)
    for c in CARPETAS:
        for dp, dn, fn in os.walk(os.path.join(RAIZ, c)):
            for f in fn:
                if f in ('Thumbs.db', '.DS_Store'): continue
                p = os.path.join(dp, f); out[os.path.relpath(p, RAIZ).replace(os.sep, '/')] = p
    out['_tools/hooks/pre-commit'] = os.path.join(RAIZ, '_tools', 'hooks', 'pre-commit')
    return out

def git(donde, *args, ok=True):
    r = subprocess.run(['git', '-C', donde] + list(args), capture_output=True, text=True, encoding='utf-8', errors='replace')
    if ok and r.returncode: raise SystemExit('git %s falló:\n%s%s' % (' '.join(args), r.stdout, r.stderr))
    return r

def main():
    a = sys.argv[1:]
    destino = a[a.index('--destino') + 1] if '--destino' in a else DESTINO
    fuentes = publicables()
    existentes = {}
    if os.path.isdir(destino):
        for dp, dn, fn in os.walk(destino):
            dn[:] = [d for d in dn if d != '.git']
            for f in fn: existentes[os.path.relpath(os.path.join(dp, f), destino).replace(os.sep, '/')] = os.path.join(dp, f)
    borrar = [r for r in existentes if r not in fuentes and r not in GENERADOS]
    nuevos = [r for r in fuentes if r not in existentes]
    print('Vitrina:', destino)
    print('  publicables: %d archivos | nuevos: %d | a borrar (ya no están en la fábrica): %d' % (len(fuentes), len(nuevos), len(borrar)))
    if '--ver' in a:
        for r in nuevos: print('   nuevo  ', r)
        for r in borrar: print('   borrar ', r)
        print('  (los demás se copian igual y git dirá cuáles cambiaron)')
        return
    os.makedirs(destino, exist_ok=True)
    if not os.path.isdir(os.path.join(destino, '.git')):
        git(destino, 'init', '-b', 'main'); print('  git init en la vitrina (sin remoto todavía)')
    for r in borrar:
        os.remove(existentes[r]); print('   borrado', r)
    for r, src in fuentes.items():
        dst = os.path.join(destino, r); os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
    data = C.estado(C.excel_a_json(C.XLSX))
    C.escribir_js(data, os.path.join(destino, 'catalogo.js'), publico=True)
    io.open(os.path.join(destino, 'README.md'), 'w', encoding='utf-8', newline='\n').write(README_PUBLICO)
    io.open(os.path.join(destino, '.gitignore'), 'w', encoding='utf-8', newline='\n').write(GITIGNORE_PUBLICO)
    git(destino, 'config', 'core.hooksPath', '_tools/hooks')
    git(destino, 'add', '-A')
    estado = git(destino, 'status', '--porcelain').stdout.strip()
    if not estado:
        print('  nada que publicar: la vitrina ya está al día'); return
    print('  cambios en la vitrina: %d archivos' % len(estado.splitlines()))
    hash_fab = git(RAIZ, 'rev-parse', '--short', 'HEAD', ok=False).stdout.strip() or 'sin git'
    msg = 'Publicación %s desde la fábrica %s' % (time.strftime('%Y-%m-%d %H:%M'), hash_fab)
    git(destino, 'commit', '-q', '-m', msg); print('  commit en la vitrina:', msg)
    if '--push' in a:
        if not git(destino, 'remote', ok=False).stdout.strip():
            raise SystemExit('La vitrina no tiene remoto todavía. Cuando exista el repo público:\n  git -C "%s" remote add origin https://mimomomo-code@github.com/mimomomo-code/libro.git' % destino)
        r = git(destino, 'push', '-u', 'origin', 'main', ok=False)
        if r.returncode: raise SystemExit('push falló:\n' + r.stdout + r.stderr)
        print('  publicado en el remoto de la vitrina')
    else:
        print('  sin push (añadir --push para subirlo)')

if __name__ == '__main__':
    main()
