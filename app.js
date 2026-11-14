// =========================================================================
// 1. INICIALIZACIÓN DEL MAPA DE MARTE (API NASA MARS TREK WMTS)
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
  maxBoundsViscosity: 1.0
}).setView(CENTRO_JEZERO, 10.5);

// =========================================================================
// 2. CONEXIÓN EN VIVO CON NASA MARS TREK WMTS (CAPAS CIENTÍFICAS)
// =========================================================================
const urlsCapasWMTS = {
  optico:
    'https://trek.nasa.gov/tiles/Mars/EQ/' +
    'JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0/' +
    '1.0.0//default/default028mm/{z}/{y}/{x}.png',
  // Si copias las URLs WMTS de MOLA / THEMIS / USGS desde Mars Trek (F12 -> Network), pégalas aquí:
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
});

// Selector de capas: usa teselas WMTS reales si has pegado la URL, o modo espectral visual como respaldo
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
// 3. CÍRCULO ZONA BASE COMPAGINADO Y LOS 6 PUNTOS SEGUROS CALIBRADOS
// =========================================================================

// Radio ampliado a 8800 para que el perímetro cian toque el borde del delta igual que en Mars Trek
const circuloZonaBase = L.circle([18.4447, 77.4508], {
  radius: 8800,
  color: '#67e8f9',
  weight: 2.5,
  fillColor: '#67e8f9',
  fillOpacity: 0.08
})
  .addTo(map)
  .bindPopup(
    '<div style="color:#111;"><b>Perímetro Base Jezero (Elipse Perseverance)</b><br>' +
    '<small>Zona segura de operaciones principales (Radio real: ~4.6 km)</small></div>'
  );

// Coordenadas ajustadas al píxel sobre el cauce, la boca del cañón, el delta y las colinas
const puntosSegurosNaranja = [
  {
    id: 'S1',
    nombre: 'Meandro Neretva Vallis',
    coords: [18.5345, 77.2830],
    recursos: 'Repetidor UHF en curva del cañón + Refugio térmico'
  },
  {
    id: 'S2',
    nombre: 'Garganta Entrada Delta',
    coords: [18.4865, 77.3265],
    recursos: 'Depósito O2 auxiliar + Baliza boca del río'
  },
  {
    id: 'S3',
    nombre: 'Terraza Delta Occidental',
    coords: [18.4885, 77.3625],
    recursos: 'Estación meteo local MEDA + Baterías (oeste del cráter)'
  },
  {
    id: 'S4',
    nombre: 'Base Perseverance (Hub Central)',
    coords: [18.4447, 77.4508],
    recursos: 'Hábitat principal / Soporte vital completo'
  },
  {
    id: 'S5',
    nombre: 'Colinas Norte Jezero',
    coords: [18.5565, 77.4930],
    recursos: 'Repetidor largo alcance en borde norte + Refugio'
  },
  {
    id: 'S6',
    nombre: 'Llanura Cuenca Sureste',
    coords: [18.4165, 77.5830],
    recursos: 'Depósito suministros + Baliza oriental'
  }
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
    .bindPopup(`
      <div style="color:#111; max-width:240px;">
        <b>Punto Seguro [${p.id}]: ${p.nombre}</b><br>
        <small>${p.recursos}</small><br>
        <small style="color:#555;">Lat: ${p.coords[0].toFixed(4)}° | Lon: ${p.coords[1].toFixed(4)}°</small>
      </div>
    `);

  marcadoresPuntosSeguros[p.id] = marcador;
});

// =========================================================================
// 4. SEGUNDA CONEXIÓN API NASA: FOTOS POV REALES DE PERSEVERANCE EN JEZERO
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

      marcadoresPuntosSeguros['S4'].setPopupContent(`
        <div style="color:#111; max-width:250px;">
          <b>Punto Seguro [S4]: ${pBase.nombre}</b><br>
          <small>${pBase.recursos}</small><br>
          <div style="margin-top:6px; background:#f1f5f9; padding:5px; border-radius:4px;">
            <small><b>Vista POV Superficie (NASA API - Sol ${foto.sol}):</b></small><br>
            <img src="${foto.img_src}" alt="Superficie Jezero" style="width:100%; border-radius:4px; margin-top:4px;">
            <small style="color:#475569;">Cámara: ${foto.camera.full_name}</small>
          </div>
        </div>
      `);
      console.log('Foto POV real cargada desde NASA Perseverance API (Sol ' + foto.sol + ')');
    }
  } catch (err) {
    console.warn('No se pudo cargar foto POV en vivo (límite DEMO_KEY o sin red):', err);
  }
}

cargarFotosPOVPerseverance();

// =========================================================================
// 5. CÁLCULO DE DISTANCIA EN MARTE Y PROBABILIDAD DE ÉXITO POR TRANSPORTE
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
// 6. SELECCIÓN DE PUNTOS EN EL MAPA Y DECISIÓN TÁCTICA SIN SATÉLITE
// =========================================================================
let puntos = [];
let marcadores = [];
let lineaRuta = null;
let lineaDesvioSeguro = null;

function actualizarTodo() {
  const polvo = Number(document.getElementById('simPolvo').value);
  const terreno = Number(document.getElementById('simTerreno').value);
  const comms = Number(document.getElementById('simComms').value);
  const recursos = Number(document.getElementById('simRecursos').value);

  document.getElementById('valPolvo').textContent = `${polvo}%`;
  document.getElementById('valTerreno').textContent = `${terreno}%`;
  document.getElementById('valComms').textContent = `${comms}%`;
  document.getElementById('valRecursos').textContent = `${recursos}%`;

  if (lineaDesvioSeguro) {
    map.removeLayer(lineaDesvioSeguro);
    lineaDesvioSeguro = null;
  }

  if (puntos.length < 2) return;

  const distKm = distanciaMarteKm(puntos[0], puntos[1]);
  const [freqStr, vientoStr] = document.getElementById('climaSelect').value.split('|');
  const freqTormenta = parseFloat(freqStr);
  const vientoKmH = parseFloat(vientoStr);
  const modoElegido = document.getElementById('vehiculoSelect').value;
  const riesgoTerreno = calcularRiesgoTerrenoRuta(puntos[0], puntos[1]);

  const pAndando = calcularProbabilidadExito('andando', distKm, freqTormenta, vientoKmH, riesgoTerreno);
  const pCoche = calcularProbabilidadExito('coche', distKm, freqTormenta, vientoKmH, riesgoTerreno);
  const pDron = calcularProbabilidadExito('dron', distKm, freqTormenta, vientoKmH, riesgoTerreno);

  const minutos = Math.round((distKm / modosTransporte[modoElegido].velocidadKmH) * 60);

  const posActual = {
    lat: (puntos[0].lat + puntos[1].lat) / 2,
    lng: (puntos[0].lng + puntos[1].lng) / 2
  };

  const distRestante = distanciaMarteKm(posActual, puntos[1]);
  const distRegreso = distanciaMarteKm(posActual, puntos[0]);

  let puntoMasCercano = puntosSegurosNaranja[0];
  let distMinimaSeguro = Infinity;

  puntosSegurosNaranja.forEach((ps) => {
    const d = distanciaMarteKm(posActual, { lat: ps.coords[0], lng: ps.coords[1] });
    if (d < distMinimaSeguro) {
      distMinimaSeguro = d;
      puntoMasCercano = ps;
    }
  });

  let orden = '';
  let colorOrden = '#4ade80';
  let explicacion = '';

  if (recursos < 30 || (comms < 25 && distMinimaSeguro > 3.5)) {
    orden = 'REGRESAR A BASE (ABORTO)';
    colorOrden = '#ef4444';
    explicacion = `Recursos críticos (${recursos}%) o pérdida de enlace (${comms}%). Retorno inmediato a Origen (${distRegreso.toFixed(2)} km).`;
    lineaDesvioSeguro = L.polyline([posActual, puntos[0]], { color: '#ef4444', weight: 4, dashArray: '6, 6' }).addTo(map);
  } else if (polvo >= 65 && distMinimaSeguro < distRestante && recursos >= 35) {
    orden = `ESPERAR EN PUNTO DE APOYO (${puntoMasCercano.id})`;
    colorOrden = '#38bdf8';
    explicacion = `Tormenta local predicha (${polvo}%). Refugiarse en <b>${puntoMasCercano.nombre}</b> a ${distMinimaSeguro.toFixed(2)} km.`;
    lineaDesvioSeguro = L.polyline([posActual, puntoMasCercano.coords], { color: '#38bdf8', weight: 4, dashArray: '5, 5' }).addTo(map);
  } else if (terreno >= 60 || (polvo >= 45 && polvo < 65)) {
    orden = 'CAMBIAR DE TRAMO (DESVÍO)';
    colorOrden = '#facc15';
    explicacion = `Riesgo en tramo (Terreno: ${terreno}%, Polvo: ${polvo}%). Desviar ruta bordeando obstáculo.`;
  } else {
    orden = 'CONTINUAR RUTA PREVISTA';
    colorOrden = '#4ade80';
    explicacion = `Sensores nominales. Quedan ${distRestante.toFixed(2)} km hasta destino con margen seguro.`;
  }

  document.getElementById('infoRuta').innerHTML = `
    <b>Distancia A → B:</b> ${distKm.toFixed(2)} km | <b>Tiempo:</b> ${minutos} min<br>
    <b>Éxito:</b>
    Andando <b style="color:${colorPorProbabilidad(pAndando)}">${pAndando}%</b> |
    Coche <b style="color:${colorPorProbabilidad(pCoche)}">${pCoche}%</b> |
    Dron <b style="color:${colorPorProbabilidad(pDron)}">${pDron}%</b>
    <div style="margin-top:8px; padding:8px; border-radius:6px; background:rgba(15,23,42,0.9); border:1px solid ${colorOrden};">
      <div style="color:${colorOrden}; font-weight:bold;">ORDEN: ${orden}</div>
      <div style="font-size:0.8rem; color:#e2e8f0; margin-top:3px;">${explicacion}</div>
    </div>
  `;

  document.getElementById('hudTelemetria').innerHTML = `
    <span style="color:${colorOrden};font-weight:bold;">${orden}</span>
    | REFUGIO: ${puntoMasCercano.id} (${distMinimaSeguro.toFixed(1)} km)
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
    .bindPopup(`
      <div style="color:#111;">
        <b>${esOrigen ? 'Origen (A)' : 'Destino (B)'}</b><br>
        Lat: ${e.latlng.lat.toFixed(5)}°<br>
        Lon: ${e.latlng.lng.toFixed(5)}°
      </div>
    `)
    .openPopup();

  marcadores.push(marcador);

  if (puntos.length === 2) {
    lineaRuta = L.polyline(puntos, { color: '#ff9e64', weight: 4, dashArray: '8, 6' }).addTo(map);
    actualizarTodo();
  }
});

// =========================================================================
// 7. EVENTOS DE CONTROLES, LIMPIEZA Y MODO HUD
// =========================================================================
document.getElementById('vehiculoSelect').addEventListener('change', actualizarTodo);
document.getElementById('climaSelect').addEventListener('change', actualizarTodo);
['simPolvo', 'simTerreno', 'simComms', 'simRecursos'].forEach((id) => {
  document.getElementById(id).addEventListener('input', actualizarTodo);
});

document.getElementById('btnLimpiar').addEventListener('click', () => {
  marcadores.forEach((m) => map.removeLayer(m));
  if (lineaRuta) map.removeLayer(lineaRuta);
  if (lineaDesvioSeguro) map.removeLayer(lineaDesvioSeguro);
  puntos = [];
  marcadores = [];
  lineaRuta = null;
  lineaDesvioSeguro = null;

  document.getElementById('infoRuta').innerHTML = `
    Haz clic en dos puntos del mapa para marcar <b>Origen (A)</b> y <b>Destino (B)</b>.<br>
    <small style="color:#9aa5ce;">Los puntos naranjas son balizas/refugios seguros y el círculo cian es la zona base.</small>
  `;
  document.getElementById('hudTelemetria').textContent =
    'SISTEMA DE NAVEGACIÓN ACTIVO — Marca Origen (A) y Destino (B)';
});

document.getElementById('btnHud').addEventListener('click', () => {
  document.body.classList.add('modo-hud');
  setTimeout(() => map.invalidateSize(), 150);
});

document.getElementById('btnSalirHud').addEventListener('click', () => {
  document.body.classList.remove('modo-hud');
  setTimeout(() => map.invalidateSize(), 150);
});