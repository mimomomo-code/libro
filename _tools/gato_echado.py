# -*- coding: utf-8 -*-
"""Atajo de compatibilidad:  python _tools/gato_echado.py <imagen.png> <id>
equivale a  python _tools/gato_pose.py <imagen.png> <id> echado  (la herramienta general)."""
import os, runpy, sys
sys.argv = [sys.argv[0]] + sys.argv[1:3] + ['echado'] + sys.argv[3:]
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gato_pose.py'), run_name='__main__')
