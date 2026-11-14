// =========================================================================
// 1. INICIALIZACIÓN DEL MAPA DE MARTE
// =========================================================================

// Extensión geográfica REAL disponible en el mosaico NASA CTX de Jezero.
// Orden de coordenadas: [latitud, longitud].
const limitesNASA = L.latLngBounds(
    [18.2110274, 77.1604655],
    [18.7211945, 77.6991776]
);

// Centro aproximado de Jezero
const CENTRO_JEZERO = [18.46, 77.43];

// Radio medio de Marte en metros
const RADIO_MARTE = 3389500;

// Crear mapa.
// EPSG4326 utiliza coordenadas geográficas y coincide con
// la disposición de las matrices WMTS que hemos comprobado.
const map = L.map('map', {
    crs: L.CRS.EPSG4326,

    minZoom: 10,
    maxZoom: 18,

    zoomSnap: 0.25,

    maxBounds: limitesNASA,
    maxBoundsViscosity: 1.0
}).setView(CENTRO_JEZERO, 11);


// =========================================================================
// 2. COMUNICACIÓN CON NASA MARS TREK WMTS
// =========================================================================

// Mosaico óptico MRO CTX de Jezero.
// Los parámetros z, y, x corresponden a:
// TileMatrix, TileRow y TileCol respectivamente.

const urlNASA =
    'https://trek.nasa.gov/tiles/Mars/EQ/' +
    'JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0/' +
    '1.0.0//default/default028mm/{z}/{y}/{x}.png';

const capaOptica = L.tileLayer(urlNASA, {

    minZoom: 0,

    // Último nivel nativo disponible en el WMTS de NASA.
    maxNativeZoom: 13,

    // Permitimos ampliar el mapa hasta zoom 18.
    maxZoom: 18,

    tileSize: 256,

    noWrap: true,

    // Limitar las peticiones al área del mosaico.
    bounds: limitesNASA,

    // Mantener teselas cercanas cargadas.
    keepBuffer: 3,

    updateWhenIdle: true,

    attribution:
        'NASA Mars Trek | MRO CTX Jezero Mosaic'

});


// =========================================================================
// 3. CAPAS LOCALES DE RESPALDO
// =========================================================================

// Estas capas utilizan imágenes locales.
// Para que las coordenadas sean correctas, las imágenes deben
// corresponder exactamente a los límites geográficos indicados.

const capasLocales = {

    topografico: L.imageOverlay(
        'img/topografico.png',
        limitesNASA
    ),

    termico: L.imageOverlay(
        'img/termico.png',
        limitesNASA
    ),

    geologico: L.imageOverlay(
        'img/geologico.png',
        limitesNASA
    )

};


// Definición de todas las capas
const capasNASA = {

    optico: capaOptica,

    topografico: capasLocales.topografico,

    termico: capasLocales.termico,

    geologico: capasLocales.geologico

};


// Añadir capa óptica inicialmente
let capaActual = capasNASA.optico;

capaActual.addTo(map);


// Ajustar el tamaño del mapa cuando el navegador termina de dibujarlo.
map.whenReady(() => {
    requestAnimationFrame(() => {
        map.invalidateSize();
    });
});


// =========================================================================
// 4. DIAGNÓSTICO DE CARGA DE TESSELAS NASA
// =========================================================================

capaOptica.on('tileload', function (e) {
    console.log(
        'Tesela NASA cargada:',
        'Z:', e.coords.z,
        'Y:', e.coords.y,
        'X:', e.coords.x
    );
});

capaOptica.on('tileerror', function (e) {
    console.error(
        'Error al cargar tesela NASA:',
        e.coords,
        e.tile.src
    );
});


// =========================================================================
// 5. SELECTOR DE CAPAS
// =========================================================================

const capaSelect = document.getElementById('capaSelect');

capaSelect.addEventListener('change', function (e) {

    const nombreCapa = e.target.value;

    if (!capasNASA[nombreCapa]) {
        console.error('No existe esta capa:', nombreCapa);
        return;
    }

    map.removeLayer(capaActual);

    capaActual = capasNASA[nombreCapa];

    capaActual.addTo(map);

});


// =========================================================================
// 6. LOS 6 PUNTOS NARANJAS SEGUROS
// =========================================================================

const puntosSegurosNaranja = [

    {
        id: 'S1',
        nombre: 'Baliza Neretva Norte',
        coords: [18.5280, 77.2780],
        recursos: 'Repetidor UHF + Refugio térmico'
    },

    {
        id: 'S2',
        nombre: 'Puesto Entrada Delta',
        coords: [18.4750, 77.3350],
        recursos: 'Depósito O2 auxiliar + Baliza'
    },

    {
        id: 'S3',
        nombre: 'Terraza Occidental',
        coords: [18.4830, 77.3880],
        recursos: 'Estación meteo local + Baterías'
    },

    {
        id: 'S4',
        nombre: 'Base Perseverance (Hub)',
        coords: [18.4447, 77.4508],
        recursos: 'Hábitat / Soporte vital completo'
    },

    {
        id: 'S5',
        nombre: 'Mirador Noreste Jezero',
        coords: [18.5590, 77.5100],
        recursos: 'Repetidor largo alcance + Refugio'
    },

    {
        id: 'S6',
        nombre: 'Estación Cuenca Sureste',
        coords: [18.4180, 77.6050],
        recursos: 'Depósito suministros + Baliza'
    }

];


// Representar las balizas en el mapa.
puntosSegurosNaranja.forEach((p) => {

    L.circleMarker(p.coords, {

        radius: 7,

        color: '#ffffff',

        weight: 2,

        fillColor: '#f97316',

        fillOpacity: 1

    })

    .addTo(map)

    .bindPopup(`
        <div style="color:#111;">
            <b>Punto Seguro [${p.id}]: ${p.nombre}</b>
            <br>
            <small>${p.recursos}</small>
        </div>
    `);

});


// =========================================================================
// 7. CÁLCULO DE DISTANCIA EN MARTE
// =========================================================================

function distanciaMarteKm(p1, p2) {

    const rad = (g) => g * Math.PI / 180;

    const dLat = rad(p2.lat - p1.lat);

    const dLon = rad(p2.lng - p1.lng);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(p1.lat)) *
        Math.cos(rad(p2.lat)) *
        Math.sin(dLon / 2) ** 2;

    return (
        RADIO_MARTE *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        )
    ) / 1000;

}


// =========================================================================
// 8. MODOS DE TRANSPORTE
// =========================================================================

const modosTransporte = {

    andando: {
        nombre: 'Andando (EVA)',
        velocidadKmH: 3.5,
        sensViento: 0.35,
        sensPolvo: 0.45,
        sensTerreno: 0.25
    },

    coche: {
        nombre: 'En Coche (Rover)',
        velocidadKmH: 15.0,
        sensViento: 0.10,
        sensPolvo: 0.20,
        sensTerreno: 0.55
    },

    dron: {
        nombre: 'Con Dron (Rotor)',
        velocidadKmH: 35.0,
        sensViento: 0.85,
        sensPolvo: 0.70,
        sensTerreno: 0.00
    }

};


// =========================================================================
// 9. CÁLCULO DE RIESGO DEL TERRENO
// =========================================================================

function calcularRiesgoTerrenoRuta(p1, p2) {

    let penalizacion = 0.05;

    const medio = {
        lat: (p1.lat + p2.lat) / 2,
        lng: (p1.lng + p2.lng) / 2
    };

    const distCauce = distanciaMarteKm(
        medio,
        {
            lat: 18.5280,
            lng: 77.2780
        }
    );

    if (distCauce < 4.5) {
        penalizacion += 0.25;
    }

    return Math.min(penalizacion, 0.75);

}


// =========================================================================
// 10. PROBABILIDAD DE ÉXITO
// =========================================================================

function calcularProbabilidadExito(
    modoKey,
    distKm,
    freqTormenta,
    vientoKmH,
    riesgoTerreno
) {

    const modo = modosTransporte[modoKey];

    const horasViaje = distKm / modo.velocidadKmH;

    const probTormenta =
        1 - Math.pow(
            1 - freqTormenta,
            Math.max(horasViaje, 0.25)
        );

    const factorViento = Math.min(vientoKmH / 80, 1);

    const riesgoClimatico =
        probTormenta *
        (modo.sensPolvo + modo.sensViento * factorViento);

    const riesgoSuelo =
        riesgoTerreno * modo.sensTerreno;

    const exito =
        (1 - (riesgoClimatico + riesgoSuelo)) * 100;

    return Math.max(
        5,
        Math.min(99, Math.round(exito))
    );

}


// =========================================================================
// 11. COLORES SEGÚN PROBABILIDAD
// =========================================================================

function colorPorProbabilidad(pct) {

    if (pct >= 75) return '#4ade80';

    if (pct >= 45) return '#facc15';

    return '#f87171';

}


// =========================================================================
// 12. VARIABLES DE LA RUTA
// =========================================================================

let puntos = [];

let marcadores = [];

let lineaRuta = null;

let lineaDesvioSeguro = null;


// =========================================================================
// 13. ACTUALIZACIÓN DE SENSORES Y CÁLCULOS
// =========================================================================

function actualizarTodo() {

    const polvo = Number(
        document.getElementById('simPolvo').value
    );

    const terreno = Number(
        document.getElementById('simTerreno').value
    );

    const comms = Number(
        document.getElementById('simComms').value
    );

    const recursos = Number(
        document.getElementById('simRecursos').value
    );


    // Actualizar valores visibles de los sensores.

    document.getElementById('valPolvo').textContent =
        `${polvo}%`;

    document.getElementById('valTerreno').textContent =
        `${terreno}%`;

    document.getElementById('valComms').textContent =
        `${comms}%`;

    document.getElementById('valRecursos').textContent =
        `${recursos}%`;


    if (lineaDesvioSeguro) {

        map.removeLayer(lineaDesvioSeguro);

        lineaDesvioSeguro = null;

    }


    if (puntos.length < 2) return;


    // A) Probabilidades por transporte.

    const distKm = distanciaMarteKm(
        puntos[0],
        puntos[1]
    );

    const [freqStr, vientoStr] =
        document.getElementById('climaSelect').value.split('|');

    const freqTormenta = parseFloat(freqStr);

    const vientoKmH = parseFloat(vientoStr);

    const modoElegido =
        document.getElementById('vehiculoSelect').value;

    const riesgoTerreno = calcularRiesgoTerrenoRuta(
        puntos[0],
        puntos[1]
    );


    const pAndando = calcularProbabilidadExito(
        'andando',
        distKm,
        freqTormenta,
        vientoKmH,
        riesgoTerreno
    );

    const pCoche = calcularProbabilidadExito(
        'coche',
        distKm,
        freqTormenta,
        vientoKmH,
        riesgoTerreno
    );

    const pDron = calcularProbabilidadExito(
        'dron',
        distKm,
        freqTormenta,
        vientoKmH,
        riesgoTerreno
    );


    const minutos = Math.round(
        (distKm / modosTransporte[modoElegido].velocidadKmH) * 60
    );


    // B) Decisión táctica en mitad del trayecto.

    const posActual = {

        lat: (puntos[0].lat + puntos[1].lat) / 2,

        lng: (puntos[0].lng + puntos[1].lng) / 2

    };


    const distRestante = distanciaMarteKm(
        posActual,
        puntos[1]
    );

    const distRegreso = distanciaMarteKm(
        posActual,
        puntos[0]
    );


    let puntoMasCercano = puntosSegurosNaranja[0];

    let distMinimaSeguro = Infinity;


    puntosSegurosNaranja.forEach((ps) => {

        const d = distanciaMarteKm(
            posActual,
            {
                lat: ps.coords[0],
                lng: ps.coords[1]
            }
        );

        if (d < distMinimaSeguro) {

            distMinimaSeguro = d;

            puntoMasCercano = ps;

        }

    });


    let orden = '';

    let colorOrden = '#4ade80';

    let explicacion = '';


    if (
        recursos < 30 ||
        (comms < 25 && distMinimaSeguro > 3.5)
    ) {

        orden = 'REGRESAR A BASE (ABORTO)';

        colorOrden = '#ef4444';

        explicacion =
            `Recursos críticos (${recursos}%) o pérdida de enlace (${comms}%). ` +
            `Retorno inmediato a Origen (${distRegreso.toFixed(2)} km).`;

        lineaDesvioSeguro = L.polyline(
            [posActual, puntos[0]],
            {
                color: '#ef4444',
                weight: 4,
                dashArray: '6, 6'
            }
        ).addTo(map);

    } else if (
        polvo >= 65 &&
        distMinimaSeguro < distRestante &&
        recursos >= 35
    ) {

        orden =
            `ESPERAR EN PUNTO DE APOYO (${puntoMasCercano.id})`;

        colorOrden = '#38bdf8';

        explicacion =
            `Tormenta local predicha (${polvo}%). ` +
            `Refugiarse en <b>${puntoMasCercano.nombre}</b> ` +
            `a ${distMinimaSeguro.toFixed(2)} km.`;

        lineaDesvioSeguro = L.polyline(
            [posActual, puntoMasCercano.coords],
            {
                color: '#38bdf8',
                weight: 4,
                dashArray: '5, 5'
            }
        ).addTo(map);

    } else if (
        terreno >= 60 ||
        (polvo >= 45 && polvo < 65)
    ) {

        orden = 'CAMBIAR DE TRAMO (DESVÍO)';

        colorOrden = '#facc15';

        explicacion =
            `Riesgo en tramo (Terreno: ${terreno}%, ` +
            `Polvo: ${polvo}%). Desviar ruta bordeando obstáculo.`;

    } else {

        orden = 'CONTINUAR RUTA PREVISTA';

        colorOrden = '#4ade80';

        explicacion =
            `Sensores nominales. Quedan ${distRestante.toFixed(2)} km ` +
            `hasta destino con margen seguro.`;

    }


    // C) Actualizar panel de información.

    document.getElementById('infoRuta').innerHTML = `

        <b>Distancia A → B:</b>
        ${distKm.toFixed(2)} km

        |

        <b>Tiempo:</b>
        ${minutos} min

        <br>

        <b>Éxito:</b>

        Andando
        <b style="color:${colorPorProbabilidad(pAndando)}">
            ${pAndando}%
        </b>

        |

        Coche
        <b style="color:${colorPorProbabilidad(pCoche)}">
            ${pCoche}%
        </b>

        |

        Dron
        <b style="color:${colorPorProbabilidad(pDron)}">
            ${pDron}%
        </b>

        <div style="
            margin-top:8px;
            padding:8px;
            border-radius:6px;
            background:rgba(15,23,42,0.9);
            border:1px solid ${colorOrden};
        ">

            <div style="
                color:${colorOrden};
                font-weight:bold;
            ">
                ORDEN: ${orden}
            </div>

            <div style="
                font-size:0.8rem;
                color:#e2e8f0;
                margin-top:3px;
            ">
                ${explicacion}
            </div>

        </div>

    `;


    // D) Actualizar telemetría HUD.

    document.getElementById('hudTelemetria').innerHTML = `

        <span style="color:${colorOrden};font-weight:bold;">
            ${orden}
        </span>

        |

        REFUGIO: ${puntoMasCercano.id}

        (${distMinimaSeguro.toFixed(1)} km)

    `;

}


// =========================================================================
// 14. SELECCIÓN DE PUNTOS EN EL MAPA
// =========================================================================

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
            <b>${esOrigen ? 'Origen (A)' : 'Destino (B)'}</b>
            <br>
            Latitud: ${e.latlng.lat.toFixed(5)}
            <br>
            Longitud: ${e.latlng.lng.toFixed(5)}
        </div>
    `)

    .openPopup();


    marcadores.push(marcador);


    if (puntos.length === 2) {

        lineaRuta = L.polyline(puntos, {

            color: '#ff9e64',

            weight: 4,

            dashArray: '8, 6'

        }).addTo(map);

        actualizarTodo();

    }

});


// =========================================================================
// 15. EVENTOS DE LOS CONTROLES
// =========================================================================

document.getElementById('vehiculoSelect')
    .addEventListener('change', actualizarTodo);

document.getElementById('climaSelect')
    .addEventListener('change', actualizarTodo);


[
    'simPolvo',
    'simTerreno',
    'simComms',
    'simRecursos'
].forEach((id) => {

    document.getElementById(id)
        .addEventListener('input', actualizarTodo);

});


// =========================================================================
// 16. BOTÓN REINICIAR RUTA
// =========================================================================

document.getElementById('btnLimpiar')
    .addEventListener('click', () => {

        // Eliminar marcadores.

        marcadores.forEach((m) => {
            map.removeLayer(m);
        });


        // Eliminar línea principal.

        if (lineaRuta) {
            map.removeLayer(lineaRuta);
        }


        // Eliminar desvío.

        if (lineaDesvioSeguro) {
            map.removeLayer(lineaDesvioSeguro);
        }


        // Reiniciar variables.

        puntos = [];

        marcadores = [];

        lineaRuta = null;

        lineaDesvioSeguro = null;


        // Restaurar panel.

        document.getElementById('infoRuta').innerHTML = `

            Haz clic en dos puntos del mapa para marcar
            <b>Origen (A)</b> y <b>Destino (B)</b>.

            <br>

            <small style="color:#9aa5ce;">
                Los puntos naranjas son refugios seguros.
            </small>

        `;


        // Restaurar HUD.

        document.getElementById('hudTelemetria').textContent =
            'SISTEMA DE NAVEGACIÓN ACTIVO — Marca Origen (A) y Destino (B)';

    });


// =========================================================================
// 17. MODO HUD CASCO AR
// =========================================================================

document.getElementById('btnHud')
    .addEventListener('click', () => {

        document.body.classList.add('modo-hud');

        setTimeout(() => {
            map.invalidateSize();
        }, 150);

    });


document.getElementById('btnSalirHud')
    .addEventListener('click', () => {

        document.body.classList.remove('modo-hud');

        setTimeout(() => {
            map.invalidateSize();
        }, 150);

    });


// =========================================================================
// 18. INICIALIZACIÓN FINAL
// =========================================================================

console.log('MarsWalk SafeNav inicializado.');

console.log('Conectando con NASA Mars Trek WMTS...');

console.log('Área de cobertura:', limitesNASA);