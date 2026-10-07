// LAS PLANTILLAS DE LOS GATOS. Dibuja cada gato de la sala (gatos.js) a 1024 × 683
// sobre fondo transparente, en sus tres poses y tres estilos, para ilustrarlos con IA
// (la receta está en PROMPTS.md, sección "Los gatos"):
//   <id>_<pose>_color.png     el dibujo tal cual (referencia de pelaje y pose)
//   <id>_<pose>_lineas.png    solo contornos negros sobre blanco (ControlNet lineart / scribble)
//   <id>_<pose>_silueta.png   la silueta en negro (máscara)
//   <id>_parado_pieza_<cabeza|cuerpo|cola|patas>.png   la silueta de cada pieza del esqueleto
//                              (para cortar la ilustración en piezas y animarla)
// Salen en _capturas/plantillas_gatos/ (carpeta fuera de git).
// Uso: node _tools/plantillas_gatos.js [id ...]      (sin ids: los cuatro)
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const RAIZ = path.resolve(__dirname, '..');
const OUT = path.join(RAIZ, '_capturas', 'plantillas_gatos');
fs.mkdirSync(OUT, { recursive: true });
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['atigrado', 'carey', 'tricolor', 'vancafe'];
const poses = ['parado', 'sentado', 'echado'], estilos = ['color', 'lineas', 'silueta'], piezas = ['cabeza', 'cuerpo', 'cola', 'patas'];
const url = 'file:///' + RAIZ.replace(/\\/g, '/') + '/index.html';
const pasos = [];
const toma = (id, pose, estilo, pieza) => {
  const nombre = id + '_' + pose + '_' + (pieza ? 'pieza_' + pieza : estilo) + '.png';
  pasos.push('nav:' + url + '?plantilla=' + id + '&pose=' + pose + '&estilo=' + estilo + (pieza ? '&pieza=' + pieza : ''),
    'wait:document.title.startsWith("plantilla")', 'sleep:250', 'shot:' + path.join(OUT, nombre));
};
for (const id of ids){
  for (const pose of poses) for (const estilo of estilos) toma(id, pose, estilo);
  for (const pieza of piezas) toma(id, 'parado', 'silueta', pieza);
}
const r = spawnSync(process.execPath, [path.join(__dirname, 'capturar_cdp.js'), '--w', '1024', '--h', '683', '--transparente', ...pasos], { stdio: 'inherit' });
console.log(r.status === 0 ? 'Plantillas en ' + OUT : 'Falló la captura');
process.exit(r.status || 0);
