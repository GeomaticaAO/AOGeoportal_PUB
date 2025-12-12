document.addEventListener("DOMContentLoaded", function () {
    if (typeof L === "undefined") {
        console.error("Leaflet no se ha cargado correctamente.");
        return;
    }

    // 🗺️ Crear y configurar el mapa
    const map = L.map('map', {
        center: [19.344796609, -99.238588729],
        zoom: 13,
        minZoom: 10,
        maxZoom: 19,
        zoomControl: false,
        tap: false
    });

    // Hacer el mapa accesible desde otros scripts
    window.map = map;

    // 🌈 Estilo original: borde rojo, sin relleno
    window.estiloColoniasBase = {
        color: "#BF23CF",
        weight: 3,
        opacity: 0.7,
        fillOpacity: 0
    };

    // Variables globales accesibles desde otras capas
    window.capaColonias = null;
    window.vistaInicialAplicada = false;
    window.coloniaSeleccionada = null;

    // 🌍 Capas base
    const satelital = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; OpenStreetMap contributors',
            minZoom: 10,
            maxZoom: 19
        }
    ).addTo(map);

    const street = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            minZoom: 10,
            maxZoom: 19
        }
    );

    L.control.layers({
        "Mapa Satelital": satelital,
        "Mapa Street": street
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // 🧼 Función para reiniciar vista y estilo de colonias
    window.resetearColonias = function () {
        if (capaColonias && capaColonias.eachLayer) {
            capaColonias.eachLayer(layer => {
                if (capaColonias.resetStyle) {
                    capaColonias.resetStyle(layer);
                }
                if (layer.setStyle) {
                    layer.setStyle(estiloColoniasBase);
                }
            });
            map.setView([19.344796609, -99.238588729], 13);
        } else {
            console.warn("⚠️ La capa de colonias no está disponible.");
        }
    };

    // 🏠 Botón tipo casita
    const reloadButton = L.control({ position: 'topright' });
    reloadButton.onAdd = function () {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        div.innerHTML = '<img src="img/icons/home-gray-icon.png" alt="Restablecer" style="width: 35px; cursor: pointer;">';
        div.style.backgroundColor = 'white';
        div.style.padding = '5px';
        div.style.borderRadius = '4px';
        div.style.marginTop = '5px';
        div.title = "Restablecer vista de colonias";
        div.onclick = () => {
            console.log("🏡 Botón restablecer colonias clicado");
            resetearColonias();
        };
        return div;
    };
    reloadButton.addTo(map);

    // 🧱 Límite de la alcaldía
    function agregarLimiteAlcaldia() {
        fetch("archivos/vectores/limite_alcaldia.geojson")
            .then(response => response.ok ? response.json() : Promise.reject("Error al cargar limite_alcaldia"))
            .then(data => {
                L.geoJSON(data, {
                    style: {
                        color: "#BB1400",
                        weight: 2,
                        fillOpacity: 0
                    }
                }).addTo(map).bringToBack();
                console.log("Capa límite alcaldía cargada correctamente.");
            })
            .catch(error => console.error("Error al cargar limite_alcaldia:", error));
    }
    agregarLimiteAlcaldia();

    // 🖼️ Crear control de simbología dinámica
    window.simboloControl = L.control({ position: 'bottomright' });
    window.simboloControl.onAdd = function () {
        const div = L.DomUtil.create('div', 'leaflet-control-symbol');
        div.id = 'simbologiaContainer';
        div.style.backgroundColor = 'white';
        div.style.padding = '10px';
        div.style.borderRadius = '5px';
        div.style.border = '2px solid #333';
        div.style.fontSize = '11px';
        div.style.fontFamily = 'Montserrat, sans-serif';
        div.style.maxWidth = '200px';
        div.style.display = 'none'; // Oculto por defecto
        return div;
    };
    window.simboloControl.addTo(map);

    // Función para actualizar la simbología
    window.actualizarSimbologia = function() {
        const container = document.getElementById('simbologiaContainer');
        if (!container) return;

        const toggleIDS = document.getElementById('toggleIDSCheckbox');
        const toggleZonas = document.getElementById('toggleSeccionesCheckbox');
        
        const idsActivo = toggleIDS && toggleIDS.checked;
        const zonasActivo = toggleZonas && toggleZonas.checked;

        if (!idsActivo && !zonasActivo) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        let html = '<div style="font-weight: bold; margin-bottom: 8px; text-align: center; font-size: 12px;">Simbología</div>';

        if (idsActivo) {
            html += `
                <div style="margin-bottom: ${zonasActivo ? '10px' : '0'};">
                    <div style="font-weight: bold; margin-bottom: 5px; font-size: 11px;">Índice de Desarrollo Social</div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #08810C; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>Muy alto</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #97FE9A; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>Alto</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #EC7063; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>Medio</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #922B21; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>Bajo</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #641E16; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>Muy bajo</span>
                    </div>
                </div>
            `;
        }

        if (zonasActivo) {
            html += `
                <div>
                    <div style="font-weight: bold; margin-bottom: 5px; font-size: 11px;">Zonas</div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #8B1538; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>AA - Guinda</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #FF6B35; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>BA - Naranja</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #F5DEB3; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>CA - Beige</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #28A745; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>AB - Verde</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #FFD700; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>BB - Amarillo</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #87CEEB; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>CC - Azul claro</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #1E3A8A; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>DD - Azul fuerte</span>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    };

    console.log("🗺️ Mapa base cargado correctamente.");
});