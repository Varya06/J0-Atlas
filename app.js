// 1. Inicializar el mapa centrado en el Cráter Jezero (18.38° N, 77.58° E)
const map = L.map('map').setView([18.38, 77.58], 10);

// 2. Cuadrícula visual de respaldo (se muestra mientras no pegues las URLs de NASA Mars Trek)
function crearCuadriculaTactica(nombreCapa, colorLinea) {
  const grid = L.GridLayer.extend({
    createTile: function (coords) {
      const tile = document.createElement('canvas');
      const size = this.getTileSize();
      tile.width = size.x;
      tile.height = size.y;
      const ctx = tile.getContext('2d');

      ctx.strokeStyle = colorLinea;
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, size.x, size.y);

      ctx.fillStyle = colorLinea;
      ctx.font = '11px monospace';
      ctx.fillText(`${nombreCapa} | Z:${coords.z} X:${coords.x} Y:${coords.y}`, 10, 20);
      return tile;
    }
  });
  return new grid();
}

// 3. Configurar capas (sustituye las URLs entre comillas cuando las copies de NASA Mars Trek)
const urlOptico = '[URL_WMTS_OPTICO_MARS_TREK]';
const urlTopografico = '[URL_WMTS_TOPOGRAFICO_MARS_TREK]';
const urlTermico = '[URL_WMTS_TERMICO_MARS_TREK]';

const capasNASA = {
  optico: urlOptico.startsWith('http')
    ? L.tileLayer(urlOptico, { maxZoom: 18, attribution: 'NASA / Mars Trek' })
    : crearCuadriculaTactica('CAPA ÓPTICA', 'rgba(255, 158, 100, 0.35)'),

  topografico: urlTopografico.startsWith('http')
    ? L.tileLayer(urlTopografico, { maxZoom: 18, attribution: 'NASA / MOLA' })
    : crearCuadriculaTactica('CAPA TOPOGRÁFICA', 'rgba(122, 162, 247, 0.35)'),

  termico: urlTermico.startsWith('http')
    ? L.tileLayer(urlTermico, { maxZoom: 18, attribution: 'NASA / THEMIS' })
    : crearCuadriculaTactica('CAPA TÉRMICA', 'rgba(247, 118, 142, 0.35)')
};

let capaActual = capasNASA.optico.addTo(map);

// Cambiar capa desde el menú desplegable
document.getElementById('capaSelect').addEventListener('change', (e) => {
  map.removeLayer(capaActual);
  capaActual = capasNASA[e.target.value].addTo(map);
});

// 4. Selección de puntos Origen (A) y Destino (B) y cálculo de ruta en Marte
let puntos = [];
let marcadores = [];
let lineaRuta = null;

// Radio medio real de Marte en metros (3.389,5 km)
const RADIO_MARTE = 3389500;

function distanciaMarteKm(p1, p2) {
  const rad = (grados) => grados * Math.PI / 180;
  const dLat = rad(p2.lat - p1.lat);
  const dLon = rad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (RADIO_MARTE * c) / 1000;
}

function actualizarCalculos() {
  if (puntos.length < 2) return;

  const km = distanciaMarteKm(puntos[0], puntos[1]);
  const selectVehiculo = document.getElementById('vehiculoSelect');
  const velocidadKmH = parseFloat(selectVehiculo.value);
  const nombreVehiculo = selectVehiculo.options[selectVehiculo.selectedIndex].text.split('(')[0].trim();
  const horas = km / velocidadKmH;
  const minutos = Math.round(horas * 60);

  document.getElementById('infoRuta').innerHTML = `
    <b>Vehículo:</b> ${nombreVehiculo}<br>
    <b>Distancia en Marte:</b> ${km.toFixed(2)} km<br>
    <b>Tiempo estimado:</b> ${horas.toFixed(2)} h (${minutos} min)<br>
    <span class="estado-ok">Ruta base trazada.</span>
  `;
}

map.on('click', (e) => {
  if (puntos.length >= 2) return;

  puntos.push(e.latlng);
  const esOrigen = puntos.length === 1;

  const marcador = L.circleMarker(e.latlng, {
    radius: 8,
    color: '#ffffff',
    weight: 2,
    fillColor: esOrigen ? '#4ade80' : '#f87171',
    fillOpacity: 1
  })
    .addTo(map)
    .bindPopup(
      `<b>${esOrigen ? 'Origen (A)' : 'Destino (B)'}</b><br>` +
      `Lat: ${e.latlng.lat.toFixed(4)}°<br>` +
      `Lon: ${e.latlng.lng.toFixed(4)}°`
    )
    .openPopup();

  marcadores.push(marcador);

  if (puntos.length === 2) {
    lineaRuta = L.polyline(puntos, {
      color: '#ff9e64',
      weight: 4,
      dashArray: '8, 6'
    }).addTo(map);
    actualizarCalculos();
  }
});

// Recalcular tiempo automáticamente si cambias de vehículo en el desplegable
document.getElementById('vehiculoSelect').addEventListener('change', actualizarCalculos);

// Botón para limpiar marcadores y ruta
document.getElementById('btnLimpiar').addEventListener('click', () => {
  marcadores.forEach((m) => map.removeLayer(m));
  if (lineaRuta) map.removeLayer(lineaRuta);
  puntos = [];
  marcadores = [];
  lineaRuta = null;
  document.getElementById('infoRuta').innerHTML =
    'Haz clic en dos puntos del mapa para marcar el <b>Origen (A)</b> y el <b>Destino (B)</b>.';
});