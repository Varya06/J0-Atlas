// =========================================================================
// 1. INICIALIZACIÓN DEL MAPA DE MARTE (CON tap: false PARA PORTÁTILES)
// =========================================================================
const limitesNASA = L.latLngBounds(
  [18.2110274, 77.1604655],
  [18.7211945, 77.6991776]
);

const CENTRO_JEZERO = [18.485, 77.435];
const RADIO_MARTE = 3389500;

const map = L.map('map', {
  crs: L.CRS.EPSG4326,
  minZoom: 10,
  maxZoom: 18,
  zoomSnap: 0.25,
  maxBounds: limitesNASA,
  maxBoundsViscosity: 1.0,
  tap: false // Evita el bloqueo de clics en portátiles Windows/Chrome
}).setView(CENTRO_JEZERO, 10.5);

function actualizarEstado(texto) {
  const el = document.getElementById('estadoSistema');
  if (el) el.textContent = texto;
}

// =========================================================================
// 2. CONEXIÓN CON NASA MARS TREK WMTS
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
  actualizarEstado('Sistema activo: haz clic en el mapa para Origen (A)');
});

document.getElementById('capaSelect').addEventListener('change', (e) => {
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
// 3. CÍRCULO ZONA BASE Y LOS 6 PUNTOS SEGUROS NARANJAS (CALIBRADOS)
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
  { id: 'S1', nombre: 'Western Inflow Channel', coords: [18.57531, 77.20410], recursos: 'Repetidor UHF en curva del cañón + Refugio térmico' },
  { id: 'S2', nombre: 'Western Breach', coords: [18.4930, 77.3030], recursos: 'Depósito O2 auxiliar + Baliza boca del río' },
  { id: 'S3', nombre: 'Western Delta Deposit', coords: [18.51022, 77.40511], recursos: 'Estación meteo local MEDA + Baterías (oeste del cráter)' },
  { id: 'S4', nombre: 'Perseverance Landing Ellipse', coords: [18.44658, 77.49979], recursos: 'Hábitat principal / Soporte vital completo' },
  { id: 'S5', nombre: 'Jezero Crater', coords: [18.39735, 77.69435], recursos: 'Repetidor largo alcance en borde norte + Refugio' },
  { id: 'S6', nombre: 'Northern Delta Deposit', coords: [18.62839, 77.54596], recursos: 'Depósito suministros + Baliza oriental' }
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
      `<b>Punto Seguro [${p.id}]: ${p.nombre}</b><br>` +
      `<small>${p.recursos}</small><br>` +
      `<small style="color:#555;">Lat: ${p.coords[0].toFixed(4)}° | Lon: ${p.coords[1].toFixed(4)}°</small>` +
      `</div>`
    );

  marcadoresPuntosSeguros[p.id] = marcador;
});

// =========================================================================
// 4. FOTOS POV DE PERSEVERANCE EN JEZERO (NASA API)
// =========================================================================
async function cargarFotosPOVPerseverance() {
  const urlFotosNASA =
    'https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/latest_photos?api_key=DEMO_KEY';

  try {
    const resp = await fetch(urlFotosNASA);
    if (!resp.ok) return;
    const data = await resp.json();

    if (data.latest_photos && data.latest_photos.length > 0) {
      const foto = data.latest_photos[0];
      const pBase = puntosSegurosNaranja.find((p) => p.id === 'S4');

      marcadoresPuntosSeguros['S4'].setPopupContent(
        `<div style="color:#111; max-width:250px;">` +
        `<b>Punto Seguro [S4]: ${pBase.nombre}</b><br>` +
        `<small>${pBase.recursos}</small><br>` +
        `<div style="margin-top:6px; background:#f1f5f9; padding:5px; border-radius:4px;">` +
        `<small><b>Vista POV Superficie (NASA API - Sol ${foto.sol}):</b></small><br>` +
        `<img src="${foto.img_src}" alt="Superficie Jezero" style="width:100%; border-radius:4px; margin-top:4px;">` +
        `<small style="color:#475569;">Cámara: ${foto.camera.full_name}</small>` +
        `</div></div>`
      );
    }
  } catch (err) {
    console.warn('Sin conexión a galería POV en vivo:', err);
  }
}

cargarFotosPOVPerseverance();

// =========================================================================
// 5. CÁLCULO DE DISTANCIA EN MARTE Y PROBABILIDAD DE ÉXITO
// =========================================================================
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
  let total = 0;
  for (let i = 0; i < listaLatLng.length - 1; i++) {
    total += distanciaMarteKm(listaLatLng[i], listaLatLng[i + 1]);
  }
  return total;
}

const modosTransporte = {
  andando: { nombre: 'Andando (EVA)', velocidadKmH: 3.5, sensViento: 0.35, sensPolvo: 0.45, sensTerreno: 0.25 },
  coche:   { nombre: 'En Coche (Rover)', velocidadKmH: 15.0, sensViento: 0.10, sensPolvo: 0.20, sensTerreno: 0.55 },
  dron:    { nombre: 'Con Dron (Rotor)', velocidadKmH: 35.0, sensViento: 0.85, sensPolvo: 0.70, sensTerreno: 0.00 }
};

function calcularRiesgoTerrenoRuta(p1, p2) {
  let penalizacion = 0.05;
  const medio = { lat: (p1.lat + p2.lat) / 2, lng: (p1.lng + p2.lng) / 2 };
  const distCauce = distanciaMarteKm(medio, { lat: 18.5320, lng: 77.2550 });
  if (distCauce < 4.5) penalizacion += 0.25;
  return Math.min(penalizacion, 0.75);
}

function calcularProbabilidadExito(modoKey, distKm, freqTormenta, vientoKmH, riesgoTerreno) {
  const modo = modosTransporte[modoKey];
  const horasViaje = distKm / modo.velocidadKmH;
  const probTormenta = 1 - Math.pow(1 - freqTormenta, Math.max(horasViaje, 0.25));
  const factorViento = Math.min(vientoKmH / 80, 1);
  const riesgoClimatico = probTormenta * (modo.sensPolvo + modo.sensViento * factorViento);
  const riesgoSuelo = riesgoTerreno * modo.sensTerreno;
  const exito = (1 - (riesgoClimatico + riesgoSuelo)) * 100;
  return Math.max(5, Math.min(99, Math.round(exito)));
}

function colorPorProbabilidad(pct) {
  if (pct >= 75) return '#4ade80';
  if (pct >= 45) return '#facc15';
  return '#f87171';
}

// =========================================================================
// 6. BARRANCOS INFRANQUEABLES + MOTOR A* PARA RODEAR CUALQUIER LÍNEA ROJA
// =========================================================================
let barrancosLineas = [];
try {
  const guardado = JSON.parse(localStorage.getItem('mars_barrancos_custom') || '[]');
  if (Array.isArray(guardado)) {
    barrancosLineas = guardado.filter((b) => b && Array.isArray(b.tramo) && b.tramo.length >= 2);
  }
} catch (err) {
  barrancosLineas = [];
}

let capasBarrancosCustom = [];
let modoEditorActivo = false;
let tramoEnCurso = [];
let lineaPreviaEditor = null;

let puntos = [];
let marcadores = [];
let lineaRuta = null;
let lineaDesvioSeguro = null;

let modoColocarRefugios = false;
let refugiosColocados = [];
let contadorRefugios = 1;

function actualizarVistaYCodigoBarrancos() {
  capasBarrancosCustom.forEach((c) => map.removeLayer(c));
  capasBarrancosCustom = [];

  barrancosLineas.forEach((b) => {
    const poly = L.polyline(b.tramo, {
      color: '#ef4444',
      weight: 5,
      opacity: 0.95,
      interactive: false
    }).addTo(map);
    capasBarrancosCustom.push(poly);
  });

  try {
    localStorage.setItem('mars_barrancos_custom', JSON.stringify(barrancosLineas));
  } catch (e) {}

  const salida = document.getElementById('salidaCodigoBarrancos');
  if (salida) {
    salida.value = 'const barrancosLineas = ' + JSON.stringify(barrancosLineas, null, 2) + ';';
  }

  if (puntos.length === 2) {
    actualizarTodo();
  }
}

actualizarVistaYCodigoBarrancos();

function seCruzanSegmentos(p1, p2, q1, q2) {
  const ccw = (A, B, C) => (C.lat - A.lat) * (B.lng - A.lng) > (B.lat - A.lat) * (C.lng - A.lng);
  return ccw(p1, q1, q2) !== ccw(p2, q1, q2) && ccw(p1, p2, q1) !== ccw(p1, p2, q2);
}

function segmentoCortaBarranco(p1, p2) {
  for (const b of barrancosLineas) {
    for (let i = 0; i < b.tramo.length - 1; i++) {
      const q1 = { lat: b.tramo[i][0], lng: b.tramo[i][1] };
      const q2 = { lat: b.tramo[i + 1][0], lng: b.tramo[i + 1][1] };
      if (seCruzanSegmentos(p1, p2, q1, q2)) {
        return b.nombre || 'Barranco';
      }
    }
  }
  return null;
}

function calcularRutaConAStar(origen, destino, modo) {
  const barrancoDirecto = segmentoCortaBarranco(origen, destino);

  if (modo === 'dron' || !barrancoDirecto) {
    return {
      puntosRuta: [origen, destino],
      rodeoAplicado: false,
      barrancoEvitado: barrancoDirecto,
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
      barrancoEvitado: barrancoDirecto,
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
      if (!segmentoCortaBarranco(rawPath[idxActual], rawPath[j])) {
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
    barrancoEvitado: barrancoDirecto,
    sinSalida: false
  };
}

// =========================================================================
// 7. REFUGIOS AZULES Y DECISIÓN TÁCTICA
// =========================================================================
function buscarRefugioMasCercano(posicion) {
  if (refugiosColocados.length === 0) return null;

  let refugioCercano = null;
  let distanciaMinima = Infinity;

  refugiosColocados.forEach((refugio) => {
    const distancia = distanciaMarteKm(posicion, { lat: refugio.lat, lng: refugio.lng });
    if (distancia < distanciaMinima) {
      distanciaMinima = distancia;
      refugioCercano = refugio;
    }
  });

  return { refugio: refugioCercano, distanciaKm: distanciaMinima };
}

function actualizarTodo() {
  const polvo = Number(document.getElementById('simPolvo').value);
  const terreno = Number(document.getElementById('simTerreno').value);
  const comms = Number(document.getElementById('simComms').value);
  const recursos = Number(document.getElementById('simRecursos').value);

  document.getElementById('valPolvo').textContent = polvo + '%';
  document.getElementById('valTerreno').textContent = terreno + '%';
  document.getElementById('valComms').textContent = comms + '%';
  document.getElementById('valRecursos').textContent = recursos + '%';

  if (lineaDesvioSeguro) {
    map.removeLayer(lineaDesvioSeguro);
    lineaDesvioSeguro = null;
  }

  if (puntos.length < 2) return;

  const modoElegido = document.getElementById('vehiculoSelect').value;
  const resultadoRuta = calcularRutaConAStar(puntos[0], puntos[1], modoElegido);

  if (lineaRuta) map.removeLayer(lineaRuta);
  lineaRuta = L.polyline(resultadoRuta.puntosRuta, {
    color: resultadoRuta.sinSalida ? '#ef4444' : resultadoRuta.rodeoAplicado ? '#facc15' : '#ff9e64',
    weight: 4.5,
    dashArray: modoElegido === 'dron' ? '4, 8' : '8, 6',
    interactive: false
  }).addTo(map);

  const distKm = distanciaTotalRutaKm(resultadoRuta.puntosRuta);
  const distRectaKm = distanciaMarteKm(puntos[0], puntos[1]);
  const kmExtraRodeo = Math.max(0, distKm - distRectaKm);

  const [freqStr, vientoStr] = document.getElementById('climaSelect').value.split('|');
  const freqTormenta = parseFloat(freqStr);
  const vientoKmH = parseFloat(vientoStr);
  const riesgoTerreno = calcularRiesgoTerrenoRuta(puntos[0], puntos[1]);

  const pAndando = resultadoRuta.sinSalida ? 0 : calcularProbabilidadExito('andando', distKm, freqTormenta, vientoKmH, riesgoTerreno);
  const pCoche = resultadoRuta.sinSalida ? 0 : calcularProbabilidadExito('coche', distKm, freqTormenta, vientoKmH, riesgoTerreno);
  const pDron = calcularProbabilidadExito('dron', distRectaKm, freqTormenta, vientoKmH, riesgoTerreno);

  const minutos = Math.round((distKm / modosTransporte[modoElegido].velocidadKmH) * 60);

  const idxMedio = Math.floor(resultadoRuta.puntosRuta.length / 2);
  const posActual = resultadoRuta.puntosRuta[idxMedio];
  const distRestante = distanciaMarteKm(posActual, puntos[1]);

  let distMinimaSeguro = Infinity;
  puntosSegurosNaranja.forEach((ps) => {
    const d = distanciaMarteKm(posActual, { lat: ps.coords[0], lng: ps.coords[1] });
    if (d < distMinimaSeguro) distMinimaSeguro = d;
  });

  const resultadoRefugioAzul = buscarRefugioMasCercano(posActual);

  let orden = '';
  let colorOrden = '#4ade80';
  let explicacion = '';

  const alertaAborto = document.getElementById('alertaAborto');
  const alertaDesvio = document.getElementById('alertaDesvio');
  const alertaRefugio = document.getElementById('alertaRefugio');

  if (resultadoRuta.sinSalida) {
    alertaAborto.classList.add('activa');
    alertaDesvio.classList.remove('activa');
    alertaRefugio.classList.remove('activa');
    orden = 'BLOQUEADO POR BARRANCOS (USAR DRON)';
    colorOrden = '#ef4444';
    explicacion = 'Los barrancos rojos cierran el paso por tierra. Cambia el modo a <b>Con Dron</b> para sobrevolar.';
  } else if (recursos < 30 || (comms < 25 && distMinimaSeguro > 3.5)) {
    alertaAborto.classList.add('activa');
    alertaDesvio.classList.remove('activa');
    alertaRefugio.classList.remove('activa');
    colorOrden = '#ef4444';

    if (resultadoRefugioAzul !== null) {
      const refugio = resultadoRefugioAzul.refugio;
      orden = `ABORTAR MISIÓN → REFUGIO (${refugio.id})`;
      explicacion = `Recursos críticos (${recursos}%) o pérdida de enlace (${comms}%). Ruta de emergencia hacia <b>${refugio.id}</b> (${resultadoRefugioAzul.distanciaKm.toFixed(2)} km).`;
      lineaDesvioSeguro = L.polyline([posActual, [refugio.lat, refugio.lng]], {
        color: '#ef4444', weight: 5, dashArray: '6, 6', interactive: false
      }).addTo(map);
      refugio.marcador.openPopup();
    } else {
      orden = 'ABORTAR MISIÓN: NO HAY REFUGIOS';
      explicacion = `¡EMERGENCIA! Recursos críticos (${recursos}%) o enlace bajo (${comms}%). Activa "Colocar puntos de refugios" y añade un refugio azul.`;
    }
  } else if (polvo >= 65 && recursos >= 35) {
    alertaAborto.classList.remove('activa');
    alertaDesvio.classList.remove('activa');

    if (resultadoRefugioAzul !== null) {
      alertaRefugio.classList.add('activa');
      const refugio = resultadoRefugioAzul.refugio;
      orden = `ESPERAR EN REFUGIO (${refugio.id})`;
      colorOrden = '#38bdf8';
      explicacion = `Tormenta local predicha (${polvo}%). Dirigirse al refugio <b>${refugio.id}</b> (${resultadoRefugioAzul.distanciaKm.toFixed(2)} km).`;
      lineaDesvioSeguro = L.polyline([posActual, [refugio.lat, refugio.lng]], {
        color: '#38bdf8', weight: 5, dashArray: '5, 5', interactive: false
      }).addTo(map);
      refugio.marcador.openPopup();
    } else {
      alertaRefugio.classList.remove('activa');
      orden = 'ADVERTENCIA: NO HAY REFUGIOS';
      colorOrden = '#facc15';
      explicacion = `¡ATENCIÓN! Se ha detectado tormenta (${polvo}%), pero no has colocado ningún refugio azul en el mapa.`;
    }
  } else if (resultadoRuta.rodeoAplicado || terreno >= 60 || (polvo >= 45 && polvo < 65)) {
    orden = resultadoRuta.rodeoAplicado ? 'RODEO BARRANCO ACTIVO' : 'CAMBIAR DE TRAMO (DESVÍO)';
    alertaAborto.classList.remove('activa');
    alertaDesvio.classList.add('activa');
    alertaRefugio.classList.remove('activa');
    colorOrden = '#facc15';
    explicacion = resultadoRuta.rodeoAplicado
      ? `Barranco evitado (<b>${resultadoRuta.barrancoEvitado}</b>). Desvío automático aplicado (+${kmExtraRodeo.toFixed(2)} km).`
      : `Riesgo en tramo (Terreno: ${terreno}%, Polvo: ${polvo}%). Desviar ruta bordeando obstáculo.`;
  } else {
    orden = 'CONTINUAR RUTA PREVISTA';
    alertaAborto.classList.remove('activa');
    alertaDesvio.classList.remove('activa');
    alertaRefugio.classList.remove('activa');
    colorOrden = '#4ade80';
    explicacion = modoElegido === 'dron' && resultadoRuta.barrancoEvitado
      ? `Dron sobrevolando <b>${resultadoRuta.barrancoEvitado}</b> sin obstáculos.`
      : `Sensores nominales. Quedan ${distRestante.toFixed(2)} km hasta destino con margen seguro.`;
  }

  if (resultadoRefugioAzul) {
    explicacion += `<br>Refugio personalizado más cercano: <b>${resultadoRefugioAzul.refugio.id}</b> (${resultadoRefugioAzul.distanciaKm.toFixed(2)} km).`;
  }

  document.getElementById('infoRuta').innerHTML =
    `<b>Distancia real:</b> ${distKm.toFixed(2)} km | <b>Tiempo:</b> ${minutos} min<br>` +
    `<b>Éxito:</b> Andando <b style="color:${colorPorProbabilidad(pAndando)}">${pAndando}%</b> | ` +
    `Coche <b style="color:${colorPorProbabilidad(pCoche)}">${pCoche}%</b> | ` +
    `Dron <b style="color:${colorPorProbabilidad(pDron)}">${pDron}%</b>` +
    `<div style="margin-top:8px; padding:8px; border-radius:6px; background:rgba(15,23,42,0.9); border:1px solid ${colorOrden};">` +
    `<div style="color:${colorOrden}; font-weight:bold;">ORDEN: ${orden}</div>` +
    `<div style="font-size:0.8rem; color:#e2e8f0; margin-top:3px;">${explicacion}</div>` +
    `</div>`;

  const textoRefugioHUD = resultadoRefugioAzul ? resultadoRefugioAzul.refugio.id : 'NO DISPONIBLE';
  document.getElementById('hudTelemetria').innerHTML =
    `<span style="color:${colorOrden};font-weight:bold;">${orden}</span> | REFUGIO: ${textoRefugioHUD}`;
}

// =========================================================================
// 8. CLIC EN EL MAPA (REFUGIOS, BARRANCOS O RUTAS)
// =========================================================================
map.on('click', (e) => {
  if (modoColocarRefugios) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const idRefugio = 'R' + contadorRefugios;

    const marcadorRefugio = L.circleMarker([lat, lng], {
      radius: 9,
      color: '#ffffff',
      weight: 2,
      fillColor: '#007bff',
      fillOpacity: 1
    }).addTo(map);

    refugiosColocados.push({ id: idRefugio, lat, lng, marcador: marcadorRefugio });

    marcadorRefugio.bindPopup(
      `<div style="color:#111;"><b>Refugio ${idRefugio}</b><br>Lat: ${lat.toFixed(5)}°<br>Lon: ${lng.toFixed(5)}°</div>`
    ).openPopup();

    actualizarEstado(`Refugio ${idRefugio} colocado en el mapa`);
    contadorRefugios++;
    if (puntos.length === 2) actualizarTodo();
    return;
  }

  if (modoEditorActivo) {
    tramoEnCurso.push([Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))]);
    if (lineaPreviaEditor) map.removeLayer(lineaPreviaEditor);
    lineaPreviaEditor = L.polyline(tramoEnCurso, { color: '#f87171', weight: 5, dashArray: '4, 4', interactive: false }).addTo(map);
    actualizarEstado(`Dibujando barranco (${tramoEnCurso.length} puntos marcados)`);
    return;
  }

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
    .bindPopup(`<div style="color:#111;"><b>${esOrigen ? 'Origen (A)' : 'Destino (B)'}</b><br>Lat: ${e.latlng.lat.toFixed(5)}°<br>Lon: ${e.latlng.lng.toFixed(5)}°</div>`)
    .openPopup();

  marcadores.push(marcador);

  if (esOrigen) {
    actualizarEstado('Origen (A) fijado — Haz clic para marcar Destino (B)');
  } else {
    actualizarEstado('Ruta A → B calculada');
    actualizarTodo();
  }
});

// =========================================================================
// 9. SIMULADOR GPS EN MOVIMIENTO CON TRIANGULACIÓN SIN SATÉLITE
// =========================================================================
let rutaWaypoints = [];
let marcadorGPS = null;
let lineasTriangulacion = [];
let intervaloGPS = null;
let indiceTramo = 0;
let progresoTramo = 0;
let posicionActualGPS = null;
let estadoEmergenciaActivo = false;

function calcularRumboGrados(p1, p2) {
  const rad = (g) => g * Math.PI / 180;
  const deg = (r) => (r * 180 / Math.PI + 360) % 360;
  const dLon = rad(p2.lng - p1.lng);
  const y = Math.sin(dLon) * Math.cos(rad(p2.lat));
  const x = Math.cos(rad(p1.lat)) * Math.sin(rad(p2.lat)) -
            Math.sin(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.cos(dLon);
  return Math.round(deg(Math.atan2(y, x)));
}

function rumboTexto(grados) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(grados / 45) % 8];
}

function actualizarTriangulacionBalizas(pos) {
  lineasTriangulacion.forEach((l) => map.removeLayer(l));
  lineasTriangulacion = [];

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

document.getElementById('btnSimularGPS').addEventListener('click', () => {
  if (puntos.length < 2) {
    alert('Primero haz clic en el mapa para marcar Origen (A) y Destino (B).');
    return;
  }

  if (intervaloGPS) clearInterval(intervaloGPS);
  if (marcadorGPS) map.removeLayer(marcadorGPS);

  const modo = document.getElementById('vehiculoSelect').value;
  const resultado = calcularRutaConAStar(puntos[0], puntos[1], modo);

  if (resultado.sinSalida) {
    alert('Ruta terrestre bloqueada por barrancos. Cambia a Con Dron o borra alguna barrera roja.');
    return;
  }

  rutaWaypoints = resultado.puntosRuta;
  estadoEmergenciaActivo = false;
  actualizarEstado('Navegación GPS en curso...');

  if (lineaRuta) map.removeLayer(lineaRuta);
  lineaRuta = L.polyline(rutaWaypoints, { color: '#4ade80', weight: 5, interactive: false }).addTo(map);

  indiceTramo = 0;
  progresoTramo = 0;
  posicionActualGPS = rutaWaypoints[0];

  marcadorGPS = L.circleMarker(posicionActualGPS, {
    radius: 10,
    color: '#ffffff',
    weight: 3,
    fillColor: '#38bdf8',
    fillOpacity: 1
  }).addTo(map);

  const banner = document.getElementById('gps-banner');
  banner.style.display = 'block';
  banner.style.borderColor = '#38bdf8';

  intervaloGPS = setInterval(() => {
    if (indiceTramo >= rutaWaypoints.length - 1) {
      clearInterval(intervaloGPS);
      actualizarEstado('Navegación GPS finalizada');
      document.getElementById('gpsInstruccion').innerHTML =
        estadoEmergenciaActivo ? 'REFUGIO ALCANZADO CON ÉXITO' : 'DESTINO CIENTÍFICO ALCANZADO';
      document.getElementById('gpsSubdato').textContent = 'Navegación completada.';
      return;
    }

    const pInicio = rutaWaypoints[indiceTramo];
    const pFin = rutaWaypoints[indiceTramo + 1];

    const polvo = Number(document.getElementById('simPolvo').value);
    const recursos = Number(document.getElementById('simRecursos').value);

    if (!estadoEmergenciaActivo && (polvo >= 65 || recursos < 30)) {
      estadoEmergenciaActivo = true;
      const refAzul = buscarRefugioMasCercano(posicionActualGPS);
      const balizas = actualizarTriangulacionBalizas(posicionActualGPS);

      const destinoSeguro = refAzul
        ? L.latLng(refAzul.refugio.lat, refAzul.refugio.lng)
        : L.latLng(balizas[0].coords[0], balizas[0].coords[1]);
      const nombreRefugio = refAzul ? 'Refugio Azul ' + refAzul.refugio.id : 'Baliza ' + balizas[0].id;

      const rutaEvacuacion = calcularRutaConAStar(posicionActualGPS, destinoSeguro, document.getElementById('vehiculoSelect').value);
      rutaWaypoints = rutaEvacuacion.puntosRuta;
      indiceTramo = 0;
      progresoTramo = 0;

      if (lineaRuta) map.removeLayer(lineaRuta);
      lineaRuta = L.polyline(rutaWaypoints, { color: '#ef4444', weight: 5, dashArray: '6, 6', interactive: false }).addTo(map);
      banner.style.borderColor = '#ef4444';
      document.getElementById('gpsInstruccion').innerHTML = 'RECALCULANDO RUTA → Evacuando hacia ' + nombreRefugio;
      return;
    }

    const modoActual = document.getElementById('vehiculoSelect').value;
    const paso = modoActual === 'dron' ? 0.045 : modoActual === 'coche' ? 0.025 : 0.012;
    progresoTramo += paso;

    if (progresoTramo >= 1) {
      progresoTramo = 0;
      indiceTramo++;
      posicionActualGPS = pFin;
    } else {
      posicionActualGPS = L.latLng(
        pInicio.lat + (pFin.lat - pInicio.lat) * progresoTramo,
        pInicio.lng + (pFin.lng - pInicio.lng) * progresoTramo
      );
    }

    marcadorGPS.setLatLng(posicionActualGPS);
    const balizasCercanas = actualizarTriangulacionBalizas(posicionActualGPS);
    const distRestante = distanciaMarteKm(posicionActualGPS, rutaWaypoints[rutaWaypoints.length - 1]);
    const rumbo = calcularRumboGrados(posicionActualGPS, pFin);
    const minRestantes = Math.max(1, Math.round((distRestante / modosTransporte[modoActual].velocidadKmH) * 60));

    if (!estadoEmergenciaActivo) {
      document.getElementById('gpsInstruccion').innerHTML =
        `Rumbo ${rumbo}° (${rumboTexto(rumbo)}) • Faltan ${distRestante.toFixed(2)} km (${minRestantes} min)`;
    }
    document.getElementById('gpsSubdato').innerHTML =
      `Triangulación Local: Balizas <b>${balizasCercanas[0].id}</b> (${balizasCercanas[0].dist.toFixed(1)} km) y <b>${balizasCercanas[1].id}</b> (${balizasCercanas[1].dist.toFixed(1)} km)`;
  }, 120);
});

// =========================================================================
// 10. EVENTOS DE BOTONES Y CONTROLES
// =========================================================================
document.getElementById('vehiculoSelect').addEventListener('change', actualizarTodo);
document.getElementById('climaSelect').addEventListener('change', actualizarTodo);
['simPolvo', 'simTerreno', 'simComms', 'simRecursos'].forEach((id) => {
  document.getElementById(id).addEventListener('input', actualizarTodo);
});

document.getElementById('btnPonerRefugios').addEventListener('click', (e) => {
  e.preventDefault();
  modoColocarRefugios = !modoColocarRefugios;
  if (modoColocarRefugios && modoEditorActivo) document.getElementById('btnModoEditor').click();

  const mapa = document.getElementById('map');
  const boton = document.getElementById('btnPonerRefugios');
  if (modoColocarRefugios) {
    mapa.style.cursor = 'crosshair';
    boton.textContent = 'Salir del modo refugios';
    boton.classList.add('activo');
    actualizarEstado('Modo Refugios: haz clic en el mapa para poner refugios azules');
  } else {
    mapa.style.cursor = '';
    boton.textContent = 'Colocar puntos de refugios';
    boton.classList.remove('activo');
    actualizarEstado('Modo Ruta activo');
  }
});

document.getElementById('btnModoEditor').addEventListener('click', () => {
  modoEditorActivo = !modoEditorActivo;
  if (modoEditorActivo && modoColocarRefugios) document.getElementById('btnPonerRefugios').click();

  const btn = document.getElementById('btnModoEditor');
  const panel = document.getElementById('controlesEditor');
  if (modoEditorActivo) {
    btn.textContent = 'Salir del Modo Dibujo';
    btn.style.background = '#15803d';
    panel.style.display = 'block';
    actualizarEstado('Modo Dibujo: haz clic en el mapa para trazar barrancos');
  } else {
    btn.textContent = 'Activar Dibujo de Barrancos';
    btn.style.background = '#b91c1c';
    panel.style.display = 'none';
    actualizarEstado('Modo Ruta activo');
  }
});

document.getElementById('btnNuevoTramo').addEventListener('click', () => {
  if (tramoEnCurso.length < 2) {
    alert('Haz clic al menos en 2 puntos del mapa para formar una línea de barranco.');
    return;
  }
  barrancosLineas.push({
    nombre: 'Barranco Jezero #' + (barrancosLineas.length + 1),
    tramo: tramoEnCurso
  });
  tramoEnCurso = [];
  if (lineaPreviaEditor) {
    map.removeLayer(lineaPreviaEditor);
    lineaPreviaEditor = null;
  }
  actualizarVistaYCodigoBarrancos();
  actualizarEstado(`Barranco guardado (${barrancosLineas.length} activos)`);
});

document.getElementById('btnBorrarEditor').addEventListener('click', () => {
  barrancosLineas = [];
  tramoEnCurso = [];
  if (lineaPreviaEditor) map.removeLayer(lineaPreviaEditor);
  localStorage.removeItem('mars_barrancos_custom');
  actualizarVistaYCodigoBarrancos();
  actualizarEstado('Barrancos borrados');
});

document.getElementById('btnLimpiar').addEventListener('click', () => {
  if (intervaloGPS) clearInterval(intervaloGPS);
  if (marcadorGPS) map.removeLayer(marcadorGPS);
  lineasTriangulacion.forEach((l) => map.removeLayer(l));
  lineasTriangulacion = [];
  document.getElementById('gps-banner').style.display = 'none';

  marcadores.forEach((m) => map.removeLayer(m));
  if (lineaRuta) map.removeLayer(lineaRuta);
  if (lineaDesvioSeguro) map.removeLayer(lineaDesvioSeguro);

  puntos = [];
  marcadores = [];
  lineaRuta = null;
  lineaDesvioSeguro = null;
  rutaWaypoints = [];
  estadoEmergenciaActivo = false;

  document.getElementById('alertaAborto').classList.remove('activa');
  document.getElementById('alertaDesvio').classList.remove('activa');
  document.getElementById('alertaRefugio').classList.remove('activa');

  document.getElementById('infoRuta').innerHTML =
    'Haz clic en dos puntos del mapa para marcar <b>Origen (A)</b> y <b>Destino (B)</b>.<br>' +
    '<small style="color:#9aa5ce;">Los puntos naranjas son balizas seguras y los círculos azules son refugios personalizados.</small>';
  document.getElementById('hudTelemetria').textContent =
    'SISTEMA DE NAVEGACIÓN ACTIVO — Marca Origen (A) y Destino (B)';
  actualizarEstado('Ruta reiniciada — Haz clic en Origen (A)');
});

document.getElementById('btnHud').addEventListener('click', () => {
  document.body.classList.add('modo-hud');
  setTimeout(() => map.invalidateSize(), 150);
});

document.getElementById('btnSalirHud').addEventListener('click', () => {
  document.body.classList.remove('modo-hud');
  setTimeout(() => map.invalidateSize(), 150);
});

console.log('MarsWalk SafeNav v3 cargado correctamente.');