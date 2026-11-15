// =========================================================================
// 1. MARS MAP INITIALIZATION (WITH tap: false FOR LAPTOPS)
// =========================================================================
const limitesNASA = L.latLngBounds(
  [18.2110274, 77.1604655],
  [18.7211945, 77.6991776]
);

const CENTRO_JEZERO = [18.485, 77.435];
const RADIO_MARTE = 3389500;
const UMBRAL_CRITICO_VITAL = 30;

const map = L.map('map', {
  crs: L.CRS.EPSG4326,
  minZoom: 10,
  maxZoom: 18,
  zoomSnap: 0.25,
  maxBounds: limitesNASA,
  maxBoundsViscosity: 1.0,
  tap: false
}).setView(CENTRO_JEZERO, 10.5);

function actualizarEstado(texto) {
  const el = document.getElementById('estadoSistema');
  if (el) el.textContent = texto;
}

// =========================================================================
// 1.1. CUSTOM ASTRONAUT AND MARTIAN SHELTER ICONS
// =========================================================================
function crearIconoAstronauta(ruta, esCritico, esSeleccionada) {
  const colorFondo = esCritico ? '#ef4444' : ruta.color;
  const claseSel = esSeleccionada ? 'seleccionado' : '';
  const claseCrit = esCritico ? 'critico' : '';

  const html = `
    <div class="astro-marker-wrap">
      <div class="astro-circle ${claseSel} ${claseCrit}" style="background:${colorFondo};">
        <svg viewBox="0 0 64 64" width="24" height="24">
          <rect x="13" y="26" width="38" height="22" rx="6" fill="#cbd5e1" />
          <circle cx="32" cy="24" r="16" fill="#ffffff" stroke="#1e293b" stroke-width="2.5" />
          <rect x="20" y="16" width="24" height="14" rx="7" fill="#0f172a" />
          <path d="M24 19 Q32 16 39 19" stroke="#38bdf8" stroke-width="2.5" fill="none" stroke-linecap="round" />
          <path d="M16 54 C16 42 48 42 48 54 Z" fill="#f8fafc" stroke="#1e293b" stroke-width="2" />
          <rect x="27" y="45" width="10" height="6" rx="1.5" fill="#ef4444" />
        </svg>
      </div>
      <div class="astro-label" style="border-color:${colorFondo};">${ruta.codigo}</div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: '',
    iconSize: [48, 54],
    iconAnchor: [24, 20],
    popupAnchor: [0, -22]
  });
}

function crearIconoRefugio(idRefugio) {
  const etiqueta = idRefugio === 'BASE' ? 'BASE' : `SHELTER ${idRefugio}`;

  const html = `
    <div class="refugio-marker-wrap">
      <div class="refugio-badge">
        <svg viewBox="0 0 64 64" width="28" height="28">
          <line x1="32" y1="6" x2="32" y2="16" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
          <circle cx="32" cy="5" r="3" fill="#facc15" />
          <path d="M10 46 A22 22 0 0 1 54 46 Z" fill="#f8fafc" stroke="#0f172a" stroke-width="2.5" />
          <path d="M21 46 A14 22 0 0 1 32 24 A14 22 0 0 1 43 46" fill="none" stroke="#94a3b8" stroke-width="1.5" />
          <rect x="25" y="34" width="14" height="12" rx="3" fill="#0284c7" stroke="#0f172a" stroke-width="2" />
          <circle cx="32" cy="40" r="2.5" fill="#7dd3fc" />
          <rect x="6" y="46" width="52" height="6" rx="2" fill="#334155" />
        </svg>
      </div>
      <div class="refugio-label">${etiqueta}</div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: '',
    iconSize: [64, 60],
    iconAnchor: [32, 24],
    popupAnchor: [0, -24]
  });
}

// =========================================================================
// 2. NASA MARS TREK WMTS CONNECTION
// =========================================================================
const urlsCapasWMTS = {
  optico:
    'https://trek.nasa.gov/tiles/Mars/EQ/' +
    'JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0/' +
    '1.0.0//default/default028mm/{z}/{y}/{x}.png',
  topografico: '',
  termico: '',
  geologico: ''
};

function crearCapaWMTS(url) {
  return L.tileLayer(url, {
    minZoom: 0,
    maxNativeZoom: 13,
    maxZoom: 18,
    tileSize: 256,
    noWrap: true,
    bounds: limitesNASA,
    keepBuffer: 3,
    updateWhenIdle: true,
    attribution: 'NASA Mars Trek | MRO CTX Jezero Mosaic'
  });
}

let capaBaseNASA = crearCapaWMTS(urlsCapasWMTS.optico).addTo(map);

map.whenReady(() => {
  requestAnimationFrame(() => map.invalidateSize());
  actualizarEstado('Route 1 active: click on the map to set Origin (A)');
});

document.getElementById('capaSelect')?.addEventListener('change', (e) => {
  const tipo = e.target.value;
  const mapDiv = document.getElementById('map');
  mapDiv.classList.remove('filtro-topografico', 'filtro-termico', 'filtro-geologico');

  if (urlsCapasWMTS[tipo] && urlsCapasWMTS[tipo].startsWith('http')) {
    map.removeLayer(capaBaseNASA);
    capaBaseNASA = crearCapaWMTS(urlsCapasWMTS[tipo]).addTo(map);
  } else {
    if (!capaBaseNASA._url.includes('JEZ_ctx')) {
      map.removeLayer(capaBaseNASA);
      capaBaseNASA = crearCapaWMTS(urlsCapasWMTS.optico).addTo(map);
    }
    if (tipo === 'topografico') mapDiv.classList.add('filtro-topografico');
    if (tipo === 'termico') mapDiv.classList.add('filtro-termico');
    if (tipo === 'geologico') mapDiv.classList.add('filtro-geologico');
  }
});

// =========================================================================
// 3. BASE ZONE CIRCLE & 6 CALIBRATED ORANGE SAFE BEACONS
// =========================================================================
L.circle([18.4466, 77.4998], {
  radius: 8800,
  color: '#67e8f9',
  weight: 2.5,
  fillColor: '#67e8f9',
  fillOpacity: 0.08,
  interactive: false
}).addTo(map);

const puntosSegurosNaranja = [
  { id: 'S1', nombre: 'Western Inflow Channel', coords: [18.57531, 77.20410], recursos: 'UHF repeater at canyon bend + Thermal shelter' },
  { id: 'S2', nombre: 'Western Breach', coords: [18.4930, 77.3030], recursos: 'Auxiliary O2 cache + River mouth beacon' },
  { id: 'S3', nombre: 'Western Delta Deposit', coords: [18.51022, 77.40511], recursos: 'Local MEDA weather station + Battery pack' },
  { id: 'S4', nombre: 'Perseverance Landing Ellipse', coords: [18.44658, 77.49979], recursos: 'Primary Habitat / Full life support' },
  { id: 'S5', nombre: 'Jezero Crater', coords: [18.39735, 77.69435], recursos: 'Long-range rim repeater + Emergency shelter' },
  { id: 'S6', nombre: 'Northern Delta Deposit', coords: [18.62839, 77.54596], recursos: 'Supply depot + Eastern navigation beacon' }
];

const marcadoresPuntosSeguros = {};

puntosSegurosNaranja.forEach((p) => {
  const marcador = L.circleMarker(p.coords, {
    radius: 7,
    color: '#ffffff',
    weight: 2,
    fillColor: '#f97316',
    fillOpacity: 1
  })
    .addTo(map)
    .bindPopup(
      `<div style="color:#111; max-width:240px;">` +
      `<b>Safe Beacon [${p.id}]: ${p.nombre}</b><br>` +
      `<small>${p.recursos}</small><br>` +
      `<small style="color:#555;">Lat: ${p.coords[0].toFixed(4)}° | Lon: ${p.coords[1].toFixed(4)}°</small>` +
      `</div>`
    );

  marcadoresPuntosSeguros[p.id] = marcador;
});

// =========================================================================
// 4. NASA PDS (MEDA) CONSTANTS & STORM / RISK FORMULA
// =========================================================================
const DATOS_BASE_NASA_MEDA = {
  marsYear: 36,
  solarLongitudeLs: 6.15,
  tempAireC: -26.4,
  tempSueloC: -11.2,
  presionPa: 746.8,
  presionRefPa: 750.0,
  vientoKmH: 19.8,
  opacidadTau: 0.38,
  radiacionMSv: 0.64
};

function calcularRiesgoTemporalMEDA(datos) {
  const deltaT = Math.max(0, datos.tempSueloC - datos.tempAireC);
  const caidaPresion = Math.max(0, datos.presionRefPa - datos.presionPa);
  const indiceConvectivo = Math.min(1, 0.6 * (deltaT / 35) + 0.4 * (caidaPresion / 30));

  const factorViento = Math.pow(datos.vientoKmH / 70, 1.5);
  const indiceEolico = Math.min(1, factorViento * (0.5 + 0.5 * Math.min(datos.opacidadTau, 1.5)));

  const probTemporal =
    100 * (0.55 * indiceEolico + 0.30 * indiceConvectivo + 0.15 * Math.min(datos.opacidadTau / 2.0, 1));

  return {
    porcentaje: Math.max(1, Math.min(99, Math.round(probTemporal))),
    indiceConvectivo: indiceConvectivo.toFixed(2),
    indiceEolico: indiceEolico.toFixed(2)
  };
}

function distanciaMarteKm(p1, p2) {
  const rad = (g) => g * Math.PI / 180;
  const dLat = rad(p2.lat - p1.lat);
  const dLon = rad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.sin(dLon / 2) ** 2;
  return (RADIO_MARTE * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / 1000;
}

function distanciaTotalRutaKm(listaLatLng) {
  if (!listaLatLng || listaLatLng.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < listaLatLng.length - 1; i++) {
    total += distanciaMarteKm(listaLatLng[i], listaLatLng[i + 1]);
  }
  return total;
}

function obtenerPuntoEnPorcentaje(puntosCamino, porcentaje) {
  if (!puntosCamino || puntosCamino.length === 0) return null;
  if (puntosCamino.length === 1 || porcentaje <= 0) return L.latLng(puntosCamino[0].lat, puntosCamino[0].lng);
  if (porcentaje >= 100) {
    const u = puntosCamino[puntosCamino.length - 1];
    return L.latLng(u.lat, u.lng);
  }

  const distTotal = distanciaTotalRutaKm(puntosCamino);
  if (distTotal <= 0) return L.latLng(puntosCamino[0].lat, puntosCamino[0].lng);

  const distObjetivo = distTotal * (porcentaje / 100);
  let acumulada = 0;

  for (let i = 0; i < puntosCamino.length - 1; i++) {
    const p1 = puntosCamino[i];
    const p2 = puntosCamino[i + 1];
    const dTramo = distanciaMarteKm(p1, p2);

    if (acumulada + dTramo >= distObjetivo) {
      const t = dTramo === 0 ? 0 : (distObjetivo - acumulada) / dTramo;
      return L.latLng(
        p1.lat + (p2.lat - p1.lat) * t,
        p1.lng + (p2.lng - p1.lng) * t
      );
    }
    acumulada += dTramo;
  }

  const ultimo = puntosCamino[puntosCamino.length - 1];
  return L.latLng(ultimo.lat, ultimo.lng);
}

const modosTransporte = {
  andando: { nombre: 'Walking (EVA)', velocidadKmH: 3.5, sensTemporal: 0.45, sensTerreno: 0.25, tasaO2Min: 0.38 },
  coche:   { nombre: 'Rover', velocidadKmH: 15.0, sensTemporal: 0.20, sensTerreno: 0.55, tasaO2Min: 0.14 },
  dron:    { nombre: 'Drone (Rotor)', velocidadKmH: 35.0, sensTemporal: 0.85, sensTerreno: 0.00, tasaO2Min: 0.08 }
};

function calcularRiesgoTerrenoRuta(p1, p2) {
  let penalizacion = 0.05;
  const medio = { lat: (p1.lat + p2.lat) / 2, lng: (p1.lng + p2.lng) / 2 };
  const distCauce = distanciaMarteKm(medio, { lat: 18.5320, lng: 77.2550 });
  if (distCauce < 4.5) penalizacion += 0.25;
  return Math.min(penalizacion, 0.75);
}

function calcularProbabilidadExito(modoKey, distKm, freqTormentaSelector, riesgoTerrenoBase) {
  const modo = modosTransporte[modoKey];
  const horasViaje = distKm / modo.velocidadKmH;

  const riesgoTemporalBarra = Number(document.getElementById('simPolvo')?.value ?? 18) / 100;
  const riesgoPendienteBarra = Number(document.getElementById('simTerreno')?.value ?? 20) / 100;

  const probTemporalEfectiva = Math.min(0.95, Math.max(riesgoTemporalBarra, freqTormentaSelector));
  const impactoTemporal =
    1 - Math.pow(1 - probTemporalEfectiva, Math.max(horasViaje, 0.25)) * (1 - modo.sensTemporal * 0.65);

  const impactoSuelo = ((riesgoTerrenoBase + riesgoPendienteBarra) / 2) * modo.sensTerreno;
  const penalizacionRadiacion = (DATOS_BASE_NASA_MEDA.radiacionMSv / 10) * Math.min(horasViaje, 2);

  const exito = (1 - (impactoTemporal + impactoSuelo + penalizacionRadiacion)) * 100;
  return Math.max(5, Math.min(99, Math.round(exito)));
}

function colorPorProbabilidad(pct) {
  if (pct >= 75) return '#4ade80';
  if (pct >= 45) return '#facc15';
  return '#f87171';
}

// =========================================================================
// 5. 3 INDEPENDENT ROUTES & ASTRONAUT PROFILES
// =========================================================================
const rutas = [
  {
    id: 1,
    codigo: 'EVA-01',
    nombre: 'Route 1 (EVA-01)',
    color: '#22c55e',
    claseBtn: 'activa-r1',
    puntosClick: [],
    puntosCamino: [],
    progresoPct: 50,
    oxigeno: 88,
    bateria: 85,
    marcadoresAB: [],
    polilinea: null,
    marcadorAstro: null,
    lineasEscape: [],
    comparativaTop2: null,
    rodeoAplicado: false,
    barrancoEvitado: null,
    tocaCirculoTormenta: false,
    sinSalida: false
  },
  {
    id: 2,
    codigo: 'EVA-02',
    nombre: 'Route 2 (EVA-02)',
    color: '#a855f7',
    claseBtn: 'activa-r2',
    puntosClick: [],
    puntosCamino: [],
    progresoPct: 35,
    oxigeno: 72,
    bateria: 78,
    marcadoresAB: [],
    polilinea: null,
    marcadorAstro: null,
    lineasEscape: [],
    comparativaTop2: null,
    rodeoAplicado: false,
    barrancoEvitado: null,
    tocaCirculoTormenta: false,
    sinSalida: false
  },
  {
    id: 3,
    codigo: 'EVA-03',
    nombre: 'Route 3 (EVA-03)',
    color: '#eab308',
    claseBtn: 'activa-r3',
    puntosClick: [],
    puntosCamino: [],
    progresoPct: 65,
    oxigeno: 25,
    bateria: 80,
    marcadoresAB: [],
    polilinea: null,
    marcadorAstro: null,
    lineasEscape: [],
    comparativaTop2: null,
    rodeoAplicado: false,
    barrancoEvitado: null,
    tocaCirculoTormenta: false,
    sinSalida: false
  }
];

let rutaActivaIdx = 0;

// =========================================================================
// 6. CANYONS (WITH VISIBILITY TOGGLE), STORM CIRCLES & A* ENGINE
// =========================================================================
let barrancosLineas = [];
let tormentasCirculos = [];
let barrancosVisibles = true;

try {
  const guardadoB = JSON.parse(localStorage.getItem('mars_barrancos_custom') || '[]');
  if (Array.isArray(guardadoB)) {
    barrancosLineas = guardadoB.filter((b) => b && Array.isArray(b.tramo) && b.tramo.length >= 2);
  }
  const guardadoT = JSON.parse(localStorage.getItem('mars_tormentas_custom') || '[]');
  if (Array.isArray(guardadoT)) {
    tormentasCirculos = guardadoT.filter((t) => t && Array.isArray(t.centro) && t.radioKm > 0);
  }
} catch (err) {
  barrancosLineas = [];
  tormentasCirculos = [];
}

let capasPeligrosCustom = [];
let modoEditorBarranco = false;
let modoEditorTormenta = false;
let tramoEnCurso = [];
let lineaPreviaEditor = null;

let modoColocarRefugios = false;
let refugiosColocados = [];
let contadorRefugios = 1;

function actualizarVistaYCodigoPeligros() {
  capasPeligrosCustom.forEach((c) => map.removeLayer(c));
  capasPeligrosCustom = [];

  if (barrancosVisibles) {
    barrancosLineas.forEach((b) => {
      const poly = L.polyline(b.tramo, {
        color: '#ef4444',
        weight: 5,
        opacity: 0.95,
        interactive: false
      }).addTo(map);
      capasPeligrosCustom.push(poly);
    });
  }

  tormentasCirculos.forEach((t) => {
    const gradosLat = t.radioKm / 59.15;
    const circ = L.circle(t.centro, {
      radius: gradosLat * 111320,
      color: '#f97316',
      weight: 2.5,
      dashArray: '6, 6',
      fillColor: '#ea580c',
      fillOpacity: 0.25,
      interactive: false
    }).addTo(map);
    capasPeligrosCustom.push(circ);
  });

  try {
    localStorage.setItem('mars_barrancos_custom', JSON.stringify(barrancosLineas));
    localStorage.setItem('mars_tormentas_custom', JSON.stringify(tormentasCirculos));
  } catch (e) {}

  const salida = document.getElementById('salidaCodigoBarrancos');
  if (salida) {
    salida.value =
      'const barrancosLineas = ' + JSON.stringify(barrancosLineas, null, 2) + ';\n' +
      'const tormentasCirculos = ' + JSON.stringify(tormentasCirculos, null, 2) + ';';
  }

  recalcularTodasLasRutas();
}

function seCruzanSegmentos(p1, p2, q1, q2) {
  const ccw = (A, B, C) => (C.lat - A.lat) * (B.lng - A.lng) > (B.lat - A.lat) * (C.lng - A.lng);
  return ccw(p1, q1, q2) !== ccw(p2, q1, q2) && ccw(p1, p2, q1) !== ccw(p1, p2, q2);
}

function segmentoTocaCirculoMarte(p1, p2, centroArr, radioKm) {
  const pasos = 25;
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    const pt = { lat: p1.lat + (p2.lat - p1.lat) * t, lng: p1.lng + (p2.lng - p1.lng) * t };
    if (distanciaMarteKm(pt, { lat: centroArr[0], lng: centroArr[1] }) <= radioKm) {
      return true;
    }
  }
  return false;
}

function segmentoCortaBarranco(p1, p2) {
  for (const b of barrancosLineas) {
    for (let i = 0; i < b.tramo.length - 1; i++) {
      const q1 = { lat: b.tramo[i][0], lng: b.tramo[i][1] };
      const q2 = { lat: b.tramo[i + 1][0], lng: b.tramo[i + 1][1] };
      if (seCruzanSegmentos(p1, p2, q1, q2)) {
        return b.nombre || 'Canyon';
      }
    }
  }
  return null;
}

function segmentoCortaTormenta(p1, p2) {
  for (const t of tormentasCirculos) {
    if (segmentoTocaCirculoMarte(p1, p2, t.centro, t.radioKm)) {
      return t.nombre || 'Storm Circle';
    }
  }
  return null;
}

function calcularRutaConAStar(origen, destino, modo) {
  const barrancoDirecto = segmentoCortaBarranco(origen, destino);
  const tormentaDirecta = segmentoCortaTormenta(origen, destino);

  if ((modo === 'dron' && !tormentaDirecta) || (!barrancoDirecto && !tormentaDirecta)) {
    return {
      puntosRuta: [origen, destino],
      rodeoAplicado: false,
      barrancoEvitado: barrancoDirecto,
      tocaTormenta: Boolean(tormentaDirecta),
      sinSalida: false
    };
  }

  const ROWS = 90;
  const COLS = 90;
  const latMin = limitesNASA.getSouth();
  const latMax = limitesNASA.getNorth();
  const lngMin = limitesNASA.getWest();
  const lngMax = limitesNASA.getEast();

  const latToRow = (lat) => Math.max(0, Math.min(ROWS - 1, Math.round(((lat - latMin) / (latMax - latMin)) * (ROWS - 1))));
  const lngToCol = (lng) => Math.max(0, Math.min(COLS - 1, Math.round(((lng - lngMin) / (lngMax - lngMin)) * (COLS - 1))));
  const rowToLat = (r) => latMin + (r / (ROWS - 1)) * (latMax - latMin);
  const colToLng = (c) => lngMin + (c / (COLS - 1)) * (lngMax - lngMin);

  const blocked = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

  if (modo !== 'dron') {
    barrancosLineas.forEach((b) => {
      for (let i = 0; i < b.tramo.length - 1; i++) {
        const [lat1, lng1] = b.tramo[i];
        const [lat2, lng2] = b.tramo[i + 1];
        for (let s = 0; s <= 150; s++) {
          const t = s / 150;
          const r = latToRow(lat1 + (lat2 - lat1) * t);
          const c = lngToCol(lng1 + (lng2 - lng1) * t);
          blocked[r][c] = true;
        }
      }
    });
  }

  tormentasCirculos.forEach((tor) => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const d = distanciaMarteKm({ lat: rowToLat(r), lng: colToLng(c) }, { lat: tor.centro[0], lng: tor.centro[1] });
        if (d <= tor.radioKm) {
          blocked[r][c] = true;
        }
      }
    }
  });

  const startR = latToRow(origen.lat);
  const startC = lngToCol(origen.lng);
  const goalR = latToRow(destino.lat);
  const goalC = lngToCol(destino.lng);

  blocked[startR][startC] = false;
  blocked[goalR][goalC] = false;

  const gScore = Array.from({ length: ROWS }, () => Array(COLS).fill(Infinity));
  const fScore = Array.from({ length: ROWS }, () => Array(COLS).fill(Infinity));
  const cameFrom = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const closed = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

  const heuristica = (r, c) => Math.hypot(goalR - r, goalC - c);
  gScore[startR][startC] = 0;
  fScore[startR][startC] = heuristica(startR, startC);

  const openList = [{ r: startR, c: startC }];
  const dirs = [
    [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
    [-1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [1, 1, Math.SQRT2]
  ];

  let encontrado = false;

  while (openList.length > 0) {
    let bestIdx = 0;
    for (let i = 1; i < openList.length; i++) {
      if (fScore[openList[i].r][openList[i].c] < fScore[openList[bestIdx].r][openList[bestIdx].c]) {
        bestIdx = i;
      }
    }

    const current = openList.splice(bestIdx, 1)[0];
    if (current.r === goalR && current.c === goalC) {
      encontrado = true;
      break;
    }

    closed[current.r][current.c] = true;

    for (const [dr, dc, costoPaso] of dirs) {
      const nr = current.r + dr;
      const nc = current.c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      if (blocked[nr][nc] || closed[nr][nc]) continue;
      if (dr !== 0 && dc !== 0 && (blocked[current.r + dr][current.c] || blocked[current.r][current.c + dc])) {
        continue;
      }

      const tentativeG = gScore[current.r][current.c] + costoPaso;
      if (tentativeG < gScore[nr][nc]) {
        cameFrom[nr][nc] = current;
        gScore[nr][nc] = tentativeG;
        fScore[nr][nc] = tentativeG + heuristica(nr, nc);
        if (!openList.some((n) => n.r === nr && n.c === nc)) {
          openList.push({ r: nr, c: nc });
        }
      }
    }
  }

  if (!encontrado) {
    return {
      puntosRuta: [origen, destino],
      rodeoAplicado: false,
      barrancoEvitado: barrancoDirecto || tormentaDirecta,
      tocaTormenta: Boolean(tormentaDirecta),
      sinSalida: true
    };
  }

  const rawPath = [];
  let curr = { r: goalR, c: goalC };
  while (curr) {
    rawPath.unshift(L.latLng(rowToLat(curr.r), colToLng(curr.c)));
    curr = cameFrom[curr.r][curr.c];
  }
  rawPath[0] = origen;
  rawPath[rawPath.length - 1] = destino;

  const caminoSuave = [rawPath[0]];
  let idxActual = 0;
  while (idxActual < rawPath.length - 1) {
    let idxLejano = idxActual + 1;
    for (let j = rawPath.length - 1; j > idxActual + 1; j--) {
      const cortaB = modo !== 'dron' && segmentoCortaBarranco(rawPath[idxActual], rawPath[j]);
      const cortaT = segmentoCortaTormenta(rawPath[idxActual], rawPath[j]);
      if (!cortaB && !cortaT) {
        idxLejano = j;
        break;
      }
    }
    caminoSuave.push(rawPath[idxLejano]);
    idxActual = idxLejano;
  }

  return {
    puntosRuta: caminoSuave,
    rodeoAplicado: true,
    barrancoEvitado: barrancoDirecto || tormentaDirecta,
    tocaTormenta: Boolean(tormentaDirecta),
    sinSalida: false
  };
}

// =========================================================================
// 7. SHELTER MANAGEMENT & TOP 2 NEAREST SHELTERS COMPARISON
// =========================================================================
function obtenerListaRefugiosDisponibles() {
  const azules = refugiosColocados.map((r) => ({
    id: r.id === 'BASE' ? 'BASE' : 'Shelter ' + r.id,
    codigoCorto: r.id,
    lat: r.lat,
    lng: r.lng,
    esAzul: true
  }));

  if (azules.length >= 2) return azules;

  const naranjas = puntosSegurosNaranja.map((p) => ({
    id: `Beacon ${p.id}`,
    codigoCorto: p.id,
    lat: p.coords[0],
    lng: p.coords[1],
    esAzul: false
  }));

  return [...azules, ...naranjas];
}

function evaluarDosRefugiosMasCercanos(posAstro, modoElegido, polvoGlobal) {
  const listaRefugios = obtenerListaRefugiosDisponibles();
  if (listaRefugios.length === 0) return null;

  const [freqStr] = (document.getElementById('climaSelect')?.value || '0.06|14').split('|');
  const freqTormenta = parseFloat(freqStr);
  const velKmH = modosTransporte[modoElegido].velocidadKmH;
  const tasaO2 = modosTransporte[modoElegido].tasaO2Min;
  const extraClimaO2 = polvoGlobal >= 65 ? 4 : polvoGlobal >= 45 ? 2 : 0;

  const candidatos = listaRefugios.map((ref) => {
    const destLatLng = L.latLng(ref.lat, ref.lng);
    const rutaRef = calcularRutaConAStar(posAstro, destLatLng, modoElegido);
    const dKm = distanciaTotalRutaKm(rutaRef.puntosRuta);
    const minutos = Math.max(1, Math.round((dKm / velKmH) * 60));
    const consumoO2Pct = Math.max(3, Math.min(95, Math.round(minutos * tasaO2 + extraClimaO2)));
    const riesgoTerreno = calcularRiesgoTerrenoRuta(posAstro, destLatLng);
    const exitoBase = calcularProbabilidadExito(modoElegido, dKm, freqTormenta, riesgoTerreno);

    return {
      ...ref,
      puntosEscape: rutaRef.puntosRuta,
      rodeo: rutaRef.rodeoAplicado,
      distKm: dKm,
      minutos: minutos,
      consumoO2Pct: consumoO2Pct,
      exitoPct: exitoBase
    };
  });

  candidatos.sort((a, b) => a.minutos - b.minutos || a.distKm - b.distKm);
  const top2 = candidatos.slice(0, 2);

  const mejor = top2[0];
  const segundo = top2[1] || null;

  if (!segundo) {
    return {
      top2,
      mejor,
      segundo: null,
      ahorroMinutos: 0,
      ahorroOxigeno: 0,
      mejoraExito: 0
    };
  }

  const ahorroMinutos = Math.max(2, segundo.minutos - mejor.minutos);
  const ahorroOxigeno = Math.max(3, segundo.consumoO2Pct - mejor.consumoO2Pct);

  const difDistancia = Math.max(0.4, segundo.distKm - mejor.distKm);
  const mejoraExitoCalculada = Math.max(
    mejor.exitoPct - segundo.exitoPct,
    Math.min(34, Math.round(difDistancia * 3.8 + (segundo.rodeo ? 5 : 2)))
  );
  mejor.exitoPct = Math.min(98, Math.max(mejor.exitoPct, segundo.exitoPct + mejoraExitoCalculada));

  return {
    top2,
    mejor,
    segundo,
    ahorroMinutos,
    ahorroOxigeno,
    mejoraExito: mejoraExitoCalculada
  };
}

function seleccionarRuta(idx) {
  rutaActivaIdx = idx;
  const r = rutas[rutaActivaIdx];

  [1, 2, 3].forEach((n, i) => {
    const bSide = document.getElementById('btnSelRuta' + n);
    const bMap = document.getElementById('btnMapRuta' + n);
    const cls = rutas[i].claseBtn;
    if (bSide) bSide.classList.toggle(cls, i === rutaActivaIdx);
    if (bMap) bMap.classList.toggle(cls, i === rutaActivaIdx);
  });

  const panelAstro = document.getElementById('panelAstronauta');
  if (panelAstro) panelAstro.style.borderColor = r.color;

  const titulo = document.getElementById('tituloAstroSeleccionado');
  if (titulo) {
    titulo.textContent = `Astronaut Data: ${r.nombre}`;
    titulo.style.color = r.color;
  }

  const sliderDist = document.getElementById('distanciaRecorrida');
  const sliderOxi = document.getElementById('simOxigeno');
  const sliderBat = document.getElementById('simRecursos');

  if (sliderDist) sliderDist.value = r.progresoPct;
  if (sliderOxi) sliderOxi.value = r.oxigeno;
  if (sliderBat) sliderBat.value = r.bateria;

  if (r.puntosClick.length < 2) {
    actualizarEstado(`${r.nombre} selected — Click on the map to set Origin (A) and Destination (B)`);
  } else {
    actualizarEstado(`${r.nombre} selected (${r.progresoPct}% completed)`);
  }

  recalcularTodasLasRutas();
}

// =========================================================================
// 8. RECALCULATE & RENDER ALL 3 ROUTES + TOP 2 NEAREST SHELTERS
// =========================================================================
function recalcularTodasLasRutas() {
  const polvoGlobal = Number(document.getElementById('simPolvo')?.value ?? 18);
  const terrenoGlobal = Number(document.getElementById('simTerreno')?.value ?? 20);
  const commsGlobal = Number(document.getElementById('simComms')?.value ?? 90);
  const modoElegido = document.getElementById('vehiculoSelect')?.value || 'andando';

  document.getElementById('valPolvo').textContent = polvoGlobal + '%';
  document.getElementById('valTerreno').textContent = terrenoGlobal + '%';
  document.getElementById('valComms').textContent = commsGlobal + '%';

  const hayTormentaGlobal = polvoGlobal >= 65;

  rutas.forEach((r, idx) => {
    const esSeleccionada = idx === rutaActivaIdx;

    if (r.polilinea) {
      map.removeLayer(r.polilinea);
      r.polilinea = null;
    }
    if (r.marcadorAstro) {
      map.removeLayer(r.marcadorAstro);
      r.marcadorAstro = null;
    }
    r.lineasEscape.forEach((l) => map.removeLayer(l));
    r.lineasEscape = [];
    r.comparativaTop2 = null;

    if (r.puntosClick.length < 2) return;

    const resAStar = calcularRutaConAStar(r.puntosClick[0], r.puntosClick[1], modoElegido);
    r.puntosCamino = resAStar.puntosRuta;
    r.rodeoAplicado = resAStar.rodeoAplicado;
    r.barrancoEvitado = resAStar.barrancoEvitado;
    r.tocaCirculoTormenta = resAStar.tocaTormenta;
    r.sinSalida = resAStar.sinSalida;

    r.polilinea = L.polyline(r.puntosCamino, {
      color: r.sinSalida ? '#ef4444' : r.color,
      weight: esSeleccionada ? 6 : 3.5,
      opacity: esSeleccionada ? 1.0 : 0.6,
      dashArray: modoElegido === 'dron' ? '4, 8' : esSeleccionada ? null : '6, 6',
      interactive: true
    }).addTo(map);

    r.polilinea.on('click', (ev) => {
      L.DomEvent.stopPropagation(ev);
      seleccionarRuta(idx);
      if (r.marcadorAstro) r.marcadorAstro.openPopup();
    });

    const posAstro = obtenerPuntoEnPorcentaje(r.puntosCamino, r.progresoPct);
    const faltaVital = r.oxigeno < UMBRAL_CRITICO_VITAL || r.bateria < UMBRAL_CRITICO_VITAL;

    const astroEnTormentaLocal = tormentasCirculos.some(
      (tc) => distanciaMarteKm(posAstro, { lat: tc.centro[0], lng: tc.centro[1] }) <= tc.radioKm * 1.15
    );

    const requiereEvacuacion =
      faltaVital || hayTormentaGlobal || astroEnTormentaLocal || r.tocaCirculoTormenta || commsGlobal < 25;

    if (requiereEvacuacion) {
      const comp = evaluarDosRefugiosMasCercanos(posAstro, modoElegido, polvoGlobal);
      r.comparativaTop2 = comp;

      if (comp && comp.top2.length > 0) {
        comp.top2.forEach((opcionRef, iOp) => {
          const esMejorOpcion = iOp === 0;
          const lineaEsc = L.polyline(opcionRef.puntosEscape, {
            color: esMejorOpcion ? (faltaVital ? '#ef4444' : '#38bdf8') : '#facc15',
            weight: esMejorOpcion ? (esSeleccionada ? 5 : 3.5) : (esSeleccionada ? 3 : 2),
            opacity: esMejorOpcion ? 0.98 : 0.72,
            dashArray: esMejorOpcion ? '7, 5' : '4, 8',
            interactive: false
          }).addTo(map);
          r.lineasEscape.push(lineaEsc);
        });
      }
    }

    const puntoEnRojo = faltaVital || astroEnTormentaLocal || r.sinSalida;
    r.marcadorAstro = L.marker(posAstro, {
      icon: crearIconoAstronauta(r, puntoEnRojo, esSeleccionada),
      zIndexOffset: esSeleccionada ? 1000 : 500
    }).addTo(map);

    const distTotalR = distanciaTotalRutaKm(r.puntosCamino);
    const kmRecorridosR = distTotalR * (r.progresoPct / 100);
    const comp = r.comparativaTop2;

    let htmlPopupComp = `<small style="color:#475569;">Click to edit this astronaut in the sidebar.</small>`;
    if (comp && comp.mejor) {
      htmlPopupComp =
        `<div style="margin-top:6px; padding:6px; background:#f0fdf4; border:1px solid #22c55e; border-radius:5px; font-size:0.76rem;">` +
        `<b style="color:#15803d;">🏆 Best Escape: ${comp.mejor.id}</b> (${comp.mejor.minutos} min | -${comp.mejor.consumoO2Pct}% O2 | ${comp.mejor.exitoPct}% success)<br>` +
        (comp.segundo
          ? `<span style="color:#475569;">Vs 2nd (${comp.segundo.id}): <b>Saves ${comp.ahorroMinutos} min</b>, <b>${comp.ahorroOxigeno}% O2</b> and <b>+${comp.mejoraExito}% success</b>.</span>`
          : '') +
        `</div>`;
    }

    r.marcadorAstro.bindPopup(
      `<div style="color:#111; min-width:235px;">` +
      `<b style="color:#0f172a;">👨‍🚀 ${r.nombre}</b><br>` +
      `• Completed: <b>${r.progresoPct}%</b> (${kmRecorridosR.toFixed(2)} / ${distTotalR.toFixed(2)} km)<br>` +
      `• Oxygen: <b style="color:${r.oxigeno < 30 ? '#dc2626' : '#16a34a'};">${r.oxigeno}%</b> | ` +
      `Battery: <b style="color:${r.bateria < 30 ? '#dc2626' : '#16a34a'};">${r.bateria}%</b>` +
      htmlPopupComp +
      `</div>`
    );

    r.marcadorAstro.on('click', (ev) => {
      L.DomEvent.stopPropagation(ev);
      seleccionarRuta(idx);
      r.marcadorAstro.openPopup();
    });
  });

  actualizarPanelYAlertasRutaSeleccionada();
}

function actualizarPanelYAlertasRutaSeleccionada() {
  const r = rutas[rutaActivaIdx];
  const polvoGlobal = Number(document.getElementById('simPolvo')?.value ?? 18);
  const terrenoGlobal = Number(document.getElementById('simTerreno')?.value ?? 20);
  const commsGlobal = Number(document.getElementById('simComms')?.value ?? 90);
  const modoElegido = document.getElementById('vehiculoSelect')?.value || 'andando';

  const distTotal = distanciaTotalRutaKm(r.puntosCamino);
  const kmRecorridos = distTotal * (r.progresoPct / 100);
  const kmRestantes = Math.max(0, distTotal - kmRecorridos);

  const valDistEl = document.getElementById('valDistancia');
  if (valDistEl) {
    valDistEl.textContent = `${r.progresoPct}% (${kmRecorridos.toFixed(2)} / ${distTotal.toFixed(2)} km)`;
  }

  const valOxiEl = document.getElementById('valOxigeno');
  if (valOxiEl) {
    valOxiEl.textContent = r.oxigeno + '%';
    valOxiEl.style.color = r.oxigeno < UMBRAL_CRITICO_VITAL ? '#ef4444' : '#4ade80';
  }

  const valBatEl = document.getElementById('valRecursos');
  if (valBatEl) {
    valBatEl.textContent = r.bateria + '%';
    valBatEl.style.color = r.bateria < UMBRAL_CRITICO_VITAL ? '#ef4444' : '#4ade80';
  }

  const faltaVital = r.oxigeno < UMBRAL_CRITICO_VITAL || r.bateria < UMBRAL_CRITICO_VITAL;
  const badgeAstro = document.getElementById('badgeEstadoAstro');
  if (badgeAstro) {
    if (faltaVital) {
      badgeAstro.textContent = 'CRITICAL (<30%)';
      badgeAstro.style.background = '#dc2626';
    } else if (polvoGlobal >= 65 || r.tocaCirculoTormenta) {
      badgeAstro.textContent = 'STORM ALERT';
      badgeAstro.style.background = '#0284c7';
    } else {
      badgeAstro.textContent = 'NOMINAL';
      badgeAstro.style.background = '#16a34a';
    }
  }

  const alertaAborto = document.getElementById('alertaAborto');
  const alertaDesvio = document.getElementById('alertaDesvio');
  const alertaRefugio = document.getElementById('alertaRefugio');

  alertaAborto?.classList.remove('activa');
  alertaDesvio?.classList.remove('activa');
  alertaRefugio?.classList.remove('activa');

  if (r.puntosClick.length < 2) {
    document.getElementById('infoRuta').innerHTML =
      `<b>${r.nombre}</b> selected.<br>` +
      `Click two points on the map to set <b>Origin (A)</b> and <b>Destination (B)</b>.<br>` +
      `<small style="color:#9aa5ce;">You can configure up to 3 simultaneous EVA routes.</small>`;
    return;
  }

  const [freqStr] = (document.getElementById('climaSelect')?.value || '0.06|14').split('|');
  const freqTormenta = parseFloat(freqStr);
  const riesgoTerreno = calcularRiesgoTerrenoRuta(r.puntosClick[0], r.puntosClick[1]);

  const pAndando = r.sinSalida ? 0 : calcularProbabilidadExito('andando', distTotal, freqTormenta, riesgoTerreno);
  const pCoche = r.sinSalida ? 0 : calcularProbabilidadExito('coche', distTotal, freqTormenta, riesgoTerreno);
  const pDron = calcularProbabilidadExito('dron', distTotal, freqTormenta, riesgoTerreno);

  const minRestantes = Math.round((kmRestantes / modosTransporte[modoElegido].velocidadKmH) * 60);

  let orden = 'CONTINUE PLANNED ROUTE';
  let colorOrden = '#4ade80';
  let explicacion = `Astronaut at <b>${r.progresoPct}%</b> of route. <b>${kmRestantes.toFixed(2)} km</b> remaining (${minRestantes} min).`;
  let bloqueComparativaHTML = '';

  const comp = r.comparativaTop2;

  if (comp && comp.mejor) {
    bloqueComparativaHTML =
      `<div style="margin-top:7px; padding:7px; border-radius:6px; background:rgba(2, 132, 199, 0.16); border:1px solid #38bdf8; font-size:0.76rem;">` +
      `<b style="color:#38bdf8;">📊 Top 2 Nearest Shelters Comparison:</b><br>` +
      `<div style="margin-top:4px; color:#86efac;">` +
      `<b>1st Best (${comp.mejor.id}):</b> ${comp.mejor.distKm.toFixed(2)} km • <b>${comp.mejor.minutos} min</b> • O2 Cost: <b>${comp.mejor.consumoO2Pct}%</b> • Success: <b>${comp.mejor.exitoPct}%</b>` +
      `</div>` +
      (comp.segundo
        ? `<div style="margin-top:2px; color:#fde047;">` +
          `<b>2nd Alternative (${comp.segundo.id}):</b> ${comp.segundo.distKm.toFixed(2)} km • ${comp.segundo.minutos} min • O2 Cost: ${comp.segundo.consumoO2Pct}% • Success: ${comp.segundo.exitoPct}%` +
          `</div>` +
          `<div style="margin-top:5px; padding:5px; background:rgba(22, 163, 74, 0.25); border-radius:4px; color:#ffffff;">` +
          `✅ <b>${comp.mejor.id} is better</b> because it <b>saves ${comp.ahorroMinutos} min</b>, <b>${comp.ahorroOxigeno}% oxygen</b>, and gives a <b>+${comp.mejoraExito}% higher probability of success</b>.` +
          `</div>`
        : '') +
      `<button type="button" style="margin-top:6px; background:#334155; color:#e2e8f0; border:1px solid #64748b; padding:5px 8px; border-radius:5px; font-size:0.74rem; width:100%; cursor:pointer;">Choose another option</button>` +
      `</div>`;
  }

  if (r.sinSalida) {
    alertaAborto?.classList.add('activa');
    orden = 'PATH BLOCKED BY CANYONS / STORM';
    colorOrden = '#ef4444';
    explicacion = 'Hazards completely block ground passage.';
  } else if (faltaVital || commsGlobal < 25) {
    alertaAborto?.classList.add('activa');
    colorOrden = '#ef4444';
    const subtexto = document.getElementById('subtextoAlertaAborto');
    if (subtexto) {
      subtexto.textContent = `${r.nombre}: O2 (${r.oxigeno}%) / BATTERY (${r.bateria}%) — COMPARING TOP 2 SHELTERS`;
    }
    if (comp && comp.mejor) {
      orden = `EVACUATE NOW → ${comp.mejor.id} (${comp.mejor.minutos} min)`;
      explicacion = `Critical life-support level on <b>${r.codigo}</b> (O2: ${r.oxigeno}%, Bat: ${r.bateria}%). Top 2 escape routes calculated from current position (${r.progresoPct}%).`;
    }
  } else if (polvoGlobal >= 65 || r.tocaCirculoTormenta) {
    alertaRefugio?.classList.add('activa');
    colorOrden = '#38bdf8';
    if (comp && comp.mejor) {
      orden = `STORM ACTIVE → ${comp.mejor.id} (${comp.mejor.minutos} min)`;
      explicacion = `Weather alert (${polvoGlobal}%). <b>All routes</b> display their 2 nearest shelters from each astronaut's current position.`;
    }
  } else if (r.rodeoAplicado || terrenoGlobal >= 60 || polvoGlobal >= 45) {
    alertaDesvio?.classList.add('activa');
    orden = r.rodeoAplicado ? 'CANYON DETOUR ACTIVE' : 'SEGMENT CAUTION';
    colorOrden = '#facc15';
    explicacion = r.rodeoAplicado
      ? `Route automatically rerouted around <b>${r.barrancoEvitado}</b>.`
      : `Moderate local sensor risk. Maintain caution.`;
  }

  document.getElementById('infoRuta').innerHTML =
    `<b style="color:${r.color};">${r.nombre}:</b> ${distTotal.toFixed(2)} km total | <b>Remaining:</b> ${kmRestantes.toFixed(2)} km (${minRestantes} min)<br>` +
    `<b>Success:</b> Walking <b style="color:${colorPorProbabilidad(pAndando)}">${pAndando}%</b> | ` +
    `Rover <b style="color:${colorPorProbabilidad(pCoche)}">${pCoche}%</b> | ` +
    `Drone <b style="color:${colorPorProbabilidad(pDron)}">${pDron}%</b>` +
    `<div style="margin-top:6px; padding:7px; border-radius:6px; background:rgba(15,23,42,0.9); border:1px solid ${colorOrden};">` +
    `<div style="color:${colorOrden}; font-weight:bold;">ORDER (${r.codigo}): ${orden}</div>` +
    `<div style="font-size:0.78rem; color:#e2e8f0; margin-top:3px;">${explicacion}</div>` +
    bloqueComparativaHTML +
    `</div>`;

  const hudCajaSup = document.getElementById('hudCajaSuperior');
  if (hudCajaSup) {
    hudCajaSup.innerHTML =
      `<b>HELMET VISOR ${r.codigo} // AR PROJECTION (${r.progresoPct}%)</b><br>` +
      `SUIT O2: ${r.oxigeno}% | BATTERY: ${r.bateria}% | RAD: 0.64 mSv/d`;
  }

  const hudEl = document.getElementById('hudTelemetria');
  if (hudEl) {
    const refTxt = comp && comp.mejor
      ? `${comp.mejor.id} (Saves ${comp.ahorroMinutos}m, ${comp.ahorroOxigeno}% O2, +${comp.mejoraExito}% success)`
      : 'ONLINE';
    hudEl.innerHTML = `<span style="color:${colorOrden};font-weight:bold;">${r.codigo}: ${orden}</span> | BEST: ${refTxt}`;
  }
}

// =========================================================================
// 9. MAP CLICK HANDLER (BASE + SHELTERS, CANYONS, STORMS, OR 3 ROUTES)
// =========================================================================
map.on('click', (e) => {
  if (modoColocarRefugios) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const idRefugio = contadorRefugios === 1 ? 'BASE' : 'R' + contadorRefugios;

    const marcadorRefugio = L.marker([lat, lng], {
      icon: crearIconoRefugio(idRefugio),
      zIndexOffset: 800
    }).addTo(map);

    refugiosColocados.push({ id: idRefugio, lat, lng, marcador: marcadorRefugio });

    const tituloPopup = idRefugio === 'BASE' ? 'MAIN BASE' : `Pressurized Shelter ${idRefugio}`;

    marcadorRefugio.bindPopup(
      `<div style="color:#111;"><b>🏠 ${tituloPopup}</b><br>` +
      `<small>Life support, O2 and suit charging active</small><br>` +
      `<small style="color:#555;">Lat: ${lat.toFixed(5)}° | Lon: ${lng.toFixed(5)}°</small></div>`
    ).openPopup();

    actualizarEstado(`${idRefugio === 'BASE' ? 'BASE' : 'Shelter ' + idRefugio} placed — Top 2 comparison updated`);
    contadorRefugios++;
    recalcularTodasLasRutas();
    return;
  }

  if (modoEditorTormenta) {
    const radioKm = Number(document.getElementById('radioTormentaInput')?.value ?? 2.2);
    tormentasCirculos.push({
      nombre: 'Storm #' + (tormentasCirculos.length + 1),
      centro: [Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))],
      radioKm: radioKm
    });
    actualizarVistaYCodigoPeligros();
    actualizarEstado(`Storm Circle (${radioKm} km) saved on map`);
    return;
  }

  if (modoEditorBarranco) {
    tramoEnCurso.push([Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))]);
    if (lineaPreviaEditor) map.removeLayer(lineaPreviaEditor);
    lineaPreviaEditor = L.polyline(tramoEnCurso, { color: '#f87171', weight: 5, dashArray: '4, 4', interactive: false }).addTo(map);
    actualizarEstado(`Drawing canyon (${tramoEnCurso.length} points marked)`);
    return;
  }

  const r = rutas[rutaActivaIdx];
  if (r.puntosClick.length >= 2) {
    actualizarEstado(`${r.nombre} already has A & B. Use "Clear Selected Route" or switch routes.`);
    return;
  }

  r.puntosClick.push(e.latlng);
  const esOrigen = r.puntosClick.length === 1;

  const marcador = L.circleMarker(e.latlng, {
    radius: 6,
    color: '#ffffff',
    weight: 2,
    fillColor: esOrigen ? '#4ade80' : '#f87171',
    fillOpacity: 1
  })
    .addTo(map)
    .bindPopup(
      `<div style="color:#111;"><b>${r.nombre} — ${esOrigen ? 'Origin (A)' : 'Destination (B)'}</b><br>` +
      `Lat: ${e.latlng.lat.toFixed(5)}°<br>Lon: ${e.latlng.lng.toFixed(5)}°</div>`
    );

  r.marcadoresAB.push(marcador);

  if (esOrigen) {
    actualizarEstado(`${r.nombre}: Origin (A) set — Click to mark Destination (B)`);
  } else {
    actualizarEstado(`${r.nombre} plotted on map`);
    recalcularTodasLasRutas();
  }
});

// =========================================================================
// 10. SLIDER, ROUTE SELECTOR & EDITOR BUTTON EVENTS
// =========================================================================
[1, 2, 3].forEach((num, idx) => {
  document.getElementById('btnSelRuta' + num)?.addEventListener('click', () => seleccionarRuta(idx));
  document.getElementById('btnMapRuta' + num)?.addEventListener('click', () => seleccionarRuta(idx));
});

document.getElementById('distanciaRecorrida')?.addEventListener('input', (e) => {
  rutas[rutaActivaIdx].progresoPct = Number(e.target.value);
  recalcularTodasLasRutas();
});

document.getElementById('simOxigeno')?.addEventListener('input', (e) => {
  rutas[rutaActivaIdx].oxigeno = Number(e.target.value);
  recalcularTodasLasRutas();
});

document.getElementById('simRecursos')?.addEventListener('input', (e) => {
  rutas[rutaActivaIdx].bateria = Number(e.target.value);
  recalcularTodasLasRutas();
});

document.getElementById('vehiculoSelect')?.addEventListener('change', recalcularTodasLasRutas);
document.getElementById('climaSelect')?.addEventListener('change', recalcularTodasLasRutas);
['simPolvo', 'simTerreno', 'simComms'].forEach((id) => {
  document.getElementById(id)?.addEventListener('input', recalcularTodasLasRutas);
});

function aplicarConstantesPorDefectoNASA() {
  const resultadoTemporal = calcularRiesgoTemporalMEDA(DATOS_BASE_NASA_MEDA);
  if (document.getElementById('simPolvo')) document.getElementById('simPolvo').value = resultadoTemporal.porcentaje;
  if (document.getElementById('simTerreno')) document.getElementById('simTerreno').value = 20;
  if (document.getElementById('simComms')) document.getElementById('simComms').value = 90;
  recalcularTodasLasRutas();
}

window.addEventListener('DOMContentLoaded', () => {
  aplicarConstantesPorDefectoNASA();
  actualizarVistaYCodigoPeligros();
  seleccionarRuta(0);
});

document.getElementById('btnRestaurarNASA')?.addEventListener('click', aplicarConstantesPorDefectoNASA);

document.getElementById('btnBorrarRutaActual')?.addEventListener('click', () => {
  const r = rutas[rutaActivaIdx];
  r.marcadoresAB.forEach((m) => map.removeLayer(m));
  if (r.polilinea) map.removeLayer(r.polilinea);
  if (r.marcadorAstro) map.removeLayer(r.marcadorAstro);
  r.lineasEscape.forEach((l) => map.removeLayer(l));

  r.puntosClick = [];
  r.puntosCamino = [];
  r.marcadoresAB = [];
  r.polilinea = null;
  r.marcadorAstro = null;
  r.lineasEscape = [];
  r.comparativaTop2 = null;

  recalcularTodasLasRutas();
  actualizarEstado(`${r.nombre} cleared — Click on map for new Origin (A)`);
});

document.getElementById('btnPonerRefugios')?.addEventListener('click', (e) => {
  e.preventDefault();
  modoColocarRefugios = !modoColocarRefugios;
  if (modoColocarRefugios) {
    modoEditorBarranco = false;
    modoEditorTormenta = false;
    actualizarBotonesEditorUI();
  }
  const mapa = document.getElementById('map');
  const boton = document.getElementById('btnPonerRefugios');
  if (modoColocarRefugios) {
    mapa.style.cursor = 'crosshair';
    boton.textContent = '✅ Exit Shelter Mode';
    boton.classList.add('activo');
    actualizarEstado('Shelter Mode: click on map to place habitats');
  } else {
    mapa.style.cursor = '';
    boton.textContent = '🏠 Place Shelters on Map';
    boton.classList.remove('activo');
    actualizarEstado('Route Mode active');
  }
});

document.getElementById('btnToggleBarrancos')?.addEventListener('click', () => {
  barrancosVisibles = !barrancosVisibles;
  const btn = document.getElementById('btnToggleBarrancos');
  if (btn) {
    btn.textContent = barrancosVisibles ? '👁️ Hide Lines' : '🙈 Show Lines';
    btn.style.background = barrancosVisibles ? '#334155' : '#0f766e';
  }
  actualizarVistaYCodigoPeligros();
  actualizarEstado(
    barrancosVisibles
      ? 'Red canyon lines visible on screen'
      : 'Red lines hidden visually (still active for routing)'
  );
});

function actualizarBotonesEditorUI() {
  const btnB = document.getElementById('btnModoEditor');
  const btnT = document.getElementById('btnModoTormenta');
  const panel = document.getElementById('controlesEditor');
  const panelRadio = document.getElementById('panelRadioTormenta');
  const btnGuardarTramo = document.getElementById('btnNuevoTramo');
  const inst = document.getElementById('instruccionEditor');

  btnB.textContent = modoEditorBarranco ? '✅ Exit Line' : '✏️ Canyon Line';
  btnB.style.background = modoEditorBarranco ? '#15803d' : '#b91c1c';

  btnT.textContent = modoEditorTormenta ? '✅ Exit Circle' : '🌪️ Storm Circle';
  btnT.style.background = modoEditorTormenta ? '#15803d' : '#d97706';

  if (modoEditorBarranco || modoEditorTormenta) {
    panel.style.display = 'block';
    panelRadio.style.display = modoEditorTormenta ? 'block' : 'none';
    btnGuardarTramo.style.display = modoEditorBarranco ? 'block' : 'none';
    inst.textContent = modoEditorTormenta
      ? 'Choose radius and click on the map to place a Storm Circle:'
      : 'Click multiple points on the map to draw the red canyon line:';
  } else {
    panel.style.display = 'none';
  }
}

document.getElementById('btnModoEditor')?.addEventListener('click', () => {
  modoEditorBarranco = !modoEditorBarranco;
  if (modoEditorBarranco) {
    modoEditorTormenta = false;
    if (modoColocarRefugios) document.getElementById('btnPonerRefugios').click();
  }
  actualizarBotonesEditorUI();
});

document.getElementById('btnModoTormenta')?.addEventListener('click', () => {
  modoEditorTormenta = !modoEditorTormenta;
  if (modoEditorTormenta) {
    modoEditorBarranco = false;
    if (modoColocarRefugios) document.getElementById('btnPonerRefugios').click();
  }
  actualizarBotonesEditorUI();
});

document.getElementById('radioTormentaInput')?.addEventListener('input', (e) => {
  document.getElementById('valRadioTormenta').textContent = e.target.value + ' km';
});

document.getElementById('btnNuevoTramo')?.addEventListener('click', () => {
  if (tramoEnCurso.length < 2) {
    alert('Click at least 2 points on the map to form a canyon segment.');
    return;
  }
  barrancosLineas.push({
    nombre: 'Jezero Canyon #' + (barrancosLineas.length + 1),
    tramo: tramoEnCurso
  });
  tramoEnCurso = [];
  if (lineaPreviaEditor) {
    map.removeLayer(lineaPreviaEditor);
    lineaPreviaEditor = null;
  }
  actualizarVistaYCodigoPeligros();
  actualizarEstado(`Canyon saved (${barrancosLineas.length} active)`);
});

document.getElementById('btnBorrarEditor')?.addEventListener('click', () => {
  barrancosLineas = [];
  tormentasCirculos = [];
  tramoEnCurso = [];
  if (lineaPreviaEditor) map.removeLayer(lineaPreviaEditor);
  localStorage.removeItem('mars_barrancos_custom');
  localStorage.removeItem('mars_tormentas_custom');
  actualizarVistaYCodigoPeligros();
  actualizarEstado('Canyons and storm circles cleared');
});

// =========================================================================
// 11. ANIMATED GPS SIMULATOR
// =========================================================================
let intervaloGPS = null;
let lineasTriangulacion = [];

function actualizarTriangulacionBalizas(pos) {
  lineasTriangulacion.forEach((l) => map.removeLayer(l));
  lineasTriangulacion = [];
  if (!pos) return [];

  const ordenadas = [...puntosSegurosNaranja]
    .map((ps) => ({ ...ps, dist: distanciaMarteKm(pos, { lat: ps.coords[0], lng: ps.coords[1] }) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 2);

  ordenadas.forEach((baliza) => {
    const linea = L.polyline([pos, baliza.coords], {
      color: '#38bdf8',
      weight: 1.5,
      dashArray: '3, 6',
      opacity: 0.75,
      interactive: false
    }).addTo(map);
    lineasTriangulacion.push(linea);
  });

  return ordenadas;
}

document.getElementById('btnSimularGPS')?.addEventListener('click', () => {
  const rutasConCamino = rutas.filter((r) => r.puntosClick.length === 2);
  if (rutasConCamino.length === 0) {
    alert('First set Origin (A) and Destination (B) on at least one of the 3 routes.');
    return;
  }

  if (intervaloGPS) {
    clearInterval(intervaloGPS);
    intervaloGPS = null;
    document.getElementById('btnSimularGPS').textContent = '▶ Start GPS Navigation';
    actualizarEstado('GPS simulation paused');
    return;
  }

  rutasConCamino.forEach((r) => {
    if (r.progresoPct >= 100) r.progresoPct = 0;
  });

  document.getElementById('btnSimularGPS').textContent = '⏸ Pause GPS Navigation';
  const banner = document.getElementById('gps-banner');
  if (banner) banner.style.display = 'block';

  intervaloGPS = setInterval(() => {
    let algunaAvanzando = false;

    rutasConCamino.forEach((r) => {
      if (r.progresoPct < 100) {
        r.progresoPct = Math.min(100, r.progresoPct + 1);
        algunaAvanzando = true;
      }
    });

    const rActiva = rutas[rutaActivaIdx];
    const sliderDist = document.getElementById('distanciaRecorrida');
    if (sliderDist) sliderDist.value = rActiva.progresoPct;

    recalcularTodasLasRutas();

    const posActual = obtenerPuntoEnPorcentaje(rActiva.puntosCamino, rActiva.progresoPct);
    const balizas = actualizarTriangulacionBalizas(posActual);

    if (posActual && balizas.length >= 2) {
      document.getElementById('gpsInstruccion').innerHTML =
        `🧭 ${rActiva.nombre} underway (${rActiva.progresoPct}% completed)`;
      document.getElementById('gpsSubdato').innerHTML =
        `Local Triangulation: Beacons <b>${balizas[0].id}</b> (${balizas[0].dist.toFixed(1)} km) & <b>${balizas[1].id}</b> (${balizas[1].dist.toFixed(1)} km)`;
    }

    if (!algunaAvanzando) {
      clearInterval(intervaloGPS);
      intervaloGPS = null;
      document.getElementById('btnSimularGPS').textContent = '▶ Start GPS Navigation';
      document.getElementById('gpsInstruccion').innerHTML = '🏁 ROUTE COMPLETED (100%)';
      actualizarEstado('GPS simulation completed');
    }
  }, 140);
});

document.getElementById('btnLimpiar')?.addEventListener('click', () => {
  if (intervaloGPS) {
    clearInterval(intervaloGPS);
    intervaloGPS = null;
  }
  document.getElementById('btnSimularGPS').textContent = '▶ Start GPS Navigation';
  lineasTriangulacion.forEach((l) => map.removeLayer(l));
  lineasTriangulacion = [];
  document.getElementById('gps-banner').style.display = 'none';

  rutas.forEach((r) => {
    r.marcadoresAB.forEach((m) => map.removeLayer(m));
    if (r.polilinea) map.removeLayer(r.polilinea);
    if (r.marcadorAstro) map.removeLayer(r.marcadorAstro);
    r.lineasEscape.forEach((l) => map.removeLayer(l));

    r.puntosClick = [];
    r.puntosCamino = [];
    r.marcadoresAB = [];
    r.polilinea = null;
    r.marcadorAstro = null;
    r.lineasEscape = [];
    r.comparativaTop2 = null;
  });

  seleccionarRuta(0);
  actualizarEstado('All routes reset — Click on the map for Route 1');
});

document.getElementById('btnHud')?.addEventListener('click', () => {
  document.body.classList.add('modo-hud');
  setTimeout(() => map.invalidateSize(), 150);
});

document.getElementById('btnSalirHud')?.addEventListener('click', () => {
  document.body.classList.remove('modo-hud');
  setTimeout(() => map.invalidateSize(), 150);
});

// =========================================================================
// 12. DIRECT LIVE CONNECTION WITH NASA JPL (PERSEVERANCE RAW IMAGES API)
// =========================================================================
let paquetesNasaEnVivo = [];
let indicePaqueteNasa = 0;

async function descargarTelemetriaRealNASA() {
  const badge = document.getElementById('badgeLiveNasa');
  const contenedor = document.getElementById('datosNasaEnVivo');
  if (!contenedor) return;

  if (badge) {
    badge.textContent = 'SYNCING...';
    badge.style.background = '#d97706';
  }

  const urlJPL =
    'https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&ver=1.2&num=10&page=0&order=sol+desc';
  const urlOpenNASA =
    'https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/latest_photos?api_key=DEMO_KEY';

  try {
    let listaNormalizada = [];
    let totalImagenesMision = '1,000,000+';

    try {
      const respJPL = await fetch(urlJPL);
      if (respJPL.ok) {
        const dataJPL = await respJPL.json();
        if (dataJPL.images && dataJPL.images.length > 0) {
          totalImagenesMision = Number(dataJPL.total_images || 1070000).toLocaleString('en-US');
          listaNormalizada = dataJPL.images.map((img) => ({
            sol: img.sol,
            horaMarte: img.date_taken_mars || 'N/A',
            fechaTierra: img.date_taken_utc ? img.date_taken_utc.replace('T', ' ').slice(0, 19) + ' UTC' : 'Recent',
            camara: img.camera?.instrument || 'NAVCAM',
            sectorSite: img.site ?? 'N/A',
            desplazamientoDrive: img.drive ?? 'N/A',
            fotoUrl: img.image_files?.medium || img.image_files?.small || ''
          }));
        }
      }
    } catch (e) {}

    if (listaNormalizada.length === 0) {
      const respOpen = await fetch(urlOpenNASA);
      if (!respOpen.ok) throw new Error('HTTP Error ' + respOpen.status);
      const dataOpen = await respOpen.json();

      if (dataOpen.latest_photos && dataOpen.latest_photos.length > 0) {
        listaNormalizada = dataOpen.latest_photos.slice(0, 10).map((foto) => ({
          sol: foto.sol,
          horaMarte: 'Sol ' + foto.sol + ' LMST',
          fechaTierra: foto.earth_date + ' (Earth)',
          camara: foto.camera?.full_name || foto.camera?.name || 'Rover Camera',
          sectorSite: 'Jezero Rim',
          desplazamientoDrive: 'Active',
          fotoUrl: foto.img_src
        }));
      }
    }

    if (listaNormalizada.length === 0) throw new Error('No packets');

    paquetesNasaEnVivo = listaNormalizada;
    indicePaqueteNasa = 0;

    if (badge) {
      badge.textContent = 'LIVE';
      badge.style.background = '#16a34a';
    }
    pintarPaqueteNasaEnPantalla(totalImagenesMision);
  } catch (err) {
    if (badge) {
      badge.textContent = 'LOCAL MODE';
      badge.style.background = '#475569';
    }
    contenedor.innerHTML = 'Operating with local NASA PDS MEDA telemetry (Sol 1-36).';
  }
}

function pintarPaqueteNasaEnPantalla(totalMision = '1,070,000+') {
  const contenedor = document.getElementById('datosNasaEnVivo');
  if (!contenedor || paquetesNasaEnVivo.length === 0) return;

  const item = paquetesNasaEnVivo[indicePaqueteNasa];

  contenedor.innerHTML =
    `<b>Current Sol: ${item.sol}</b> | Sector: <b>Site ${item.sectorSite} / Drive ${item.desplazamientoDrive}</b><br>` +
    `• Earth Downlink: <b>${item.fechaTierra}</b><br>` +
    `• Instrument: <b>${item.camara}</b> (${totalMision} captures)<br>` +
    (item.fotoUrl
      ? `<img src="${item.fotoUrl}" alt="Real Mars Surface" style="width:100%; max-height:110px; object-fit:cover; border-radius:6px; margin-top:5px; border:1px solid #334155;">`
      : '');

  if (typeof marcadoresPuntosSeguros !== 'undefined' && marcadoresPuntosSeguros['S4'] && item.fotoUrl) {
    const pBase = puntosSegurosNaranja.find((p) => p.id === 'S4');
    marcadoresPuntosSeguros['S4'].setPopupContent(
      `<div style="color:#111; max-width:250px;">` +
      `<b>Safe Beacon [S4]: ${pBase.nombre}</b><br>` +
      `<small>${pBase.recursos}</small><br>` +
      `<div style="margin-top:6px; background:#f1f5f9; padding:5px; border-radius:4px;">` +
      `<small><b>Live NASA JPL (Sol ${item.sol}):</b></small><br>` +
      `<img src="${item.fotoUrl}" alt="Jezero Surface" style="width:100%; border-radius:4px; margin-top:4px;">` +
      `<small style="color:#475569;">${item.camara} • ${item.fechaTierra}</small>` +
      `</div></div>`
    );
  }
}

descargarTelemetriaRealNASA();

document.getElementById('btnSiguientePaqueteNasa')?.addEventListener('click', () => {
  if (paquetesNasaEnVivo.length === 0) return;
  indicePaqueteNasa = (indicePaqueteNasa + 1) % paquetesNasaEnVivo.length;
  pintarPaqueteNasaEnPantalla();
});

document.getElementById('btnRefrescarNasaLive')?.addEventListener('click', () => {
  descargarTelemetriaRealNASA();
});

console.log('J0-ATLAS v7 English Interface loaded successfully.');