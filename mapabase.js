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

    // 📍 Botón de geolocalización
    let marcadorUbicacion = null;
    let circuloUbicacion = null;
    let watchId = null;
    let mejorPrecision = Infinity;
    let intentos = 0;
    const MAX_INTENTOS = 8;
    const PRECISION_ACEPTABLE = 100; // metros
    
    const geolocateButton = L.control({ position: 'topright' });
    geolocateButton.onAdd = function () {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        div.innerHTML = '<i class="bi bi-crosshair" style="font-size: 20px; cursor: pointer; color: #555;"></i>';
        div.style.backgroundColor = 'white';
        div.style.padding = '8px';
        div.style.borderRadius = '4px';
        div.style.marginTop = '10px';
        div.style.textAlign = 'center';
        div.style.width = '35px';
        div.style.height = '35px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.title = "Encontrar mi ubicación (requiere GPS)";
        
        div.onclick = () => {
            console.log("📍 Botón de geolocalización clicado");
            
            if (!navigator.geolocation) {
                alert("Tu navegador no soporta geolocalización");
                return;
            }
            
            // Si ya hay un watch activo, detenerlo
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
            
            // Resetear variables
            mejorPrecision = Infinity;
            intentos = 0;
            
            // Cambiar el icono mientras se busca
            div.innerHTML = '<i class="bi bi-arrow-clockwise" style="font-size: 20px; color: #922B21; animation: spin 1s linear infinite;"></i>';
            
            // Usar watchPosition para obtener actualizaciones continuas y mejorar la precisión
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    intentos++;
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const accuracy = position.coords.accuracy;
                    
                    console.log(`📍 Intento ${intentos}/${MAX_INTENTOS}: Lat ${lat}, Lng ${lng}, Precisión: ±${accuracy}m`);
                    
                    // Detectar si está usando geolocalización por IP (muy imprecisa)
                    if (accuracy > 5000 && intentos === 1) {
                        navigator.geolocation.clearWatch(watchId);
                        watchId = null;
                        div.innerHTML = '<i class="bi bi-crosshair" style="font-size: 20px; cursor: pointer; color: #555;"></i>';
                        
                        alert(
                            "⚠️ Precisión muy baja (geolocalización por IP)\n\n" +
                            "Tu dispositivo no tiene GPS activado o no está disponible.\n\n" +
                            "Para mejor precisión:\n" +
                            "• Usa un dispositivo móvil con GPS\n" +
                            "• Activa el GPS/Ubicación en tu dispositivo\n" +
                            "• Permite el acceso a ubicación precisa (no aproximada)\n" +
                            "• Sal al exterior o acércate a una ventana\n\n" +
                            "Precisión actual: ±" + Math.round(accuracy) + " metros"
                        );
                        return;
                    }
                    
                    // Solo actualizar si la precisión mejora o si es el primer intento
                    if (accuracy < mejorPrecision || intentos === 1) {
                        mejorPrecision = accuracy;
                        
                        // Remover marcador y círculo anteriores si existen
                        if (marcadorUbicacion) {
                            map.removeLayer(marcadorUbicacion);
                        }
                        if (circuloUbicacion) {
                            map.removeLayer(circuloUbicacion);
                        }
                        
                        // Determinar color basado en precisión
                        let colorPrecision = '#4285F4'; // Azul por defecto
                        if (accuracy > 500) {
                            colorPrecision = '#EA4335'; // Rojo si muy impreciso
                        } else if (accuracy > 100) {
                            colorPrecision = '#FBBC04'; // Amarillo si impreciso
                        } else if (accuracy < 50) {
                            colorPrecision = '#34A853'; // Verde si muy preciso
                        }
                        
                        // Crear círculo de precisión
                        circuloUbicacion = L.circle([lat, lng], {
                            radius: accuracy,
                            color: colorPrecision,
                            fillColor: colorPrecision,
                            fillOpacity: 0.15,
                            weight: 2
                        }).addTo(map);
                        
                        // Crear marcador de ubicación con pulso
                        const iconoUbicacion = L.divIcon({
                            html: `
                                <div style="position: relative;">
                                    <div style="background-color: ${colorPrecision}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(66,133,244,0.6); position: relative; z-index: 2;"></div>
                                    ${accuracy > 200 ? '' : '<div style="background-color: ' + colorPrecision + '; width: 16px; height: 16px; border-radius: 50%; opacity: 0.3; position: absolute; top: 0; left: 0; animation: pulse 2s infinite;"></div>'}
                                </div>
                            `,
                            className: '',
                            iconSize: [22, 22],
                            iconAnchor: [11, 11]
                        });
                        
                        marcadorUbicacion = L.marker([lat, lng], {
                            icon: iconoUbicacion,
                            zIndexOffset: 1000
                        }).addTo(map);
                        
                        let emoji = '📍';
                        let titulo = 'Tu ubicación aproximada';
                        if (accuracy < 50) {
                            emoji = '🎯';
                            titulo = 'Tu ubicación precisa';
                        } else if (accuracy > 500) {
                            emoji = '⚠️';
                            titulo = 'Ubicación muy imprecisa';
                        }
                        
                        const mensaje = `
                            <strong>${emoji} ${titulo}</strong><br>
                            Precisión: ±${Math.round(accuracy)} metros<br>
                            ${accuracy > PRECISION_ACEPTABLE ? '<small style="color: #EA4335;">Buscando mejor señal GPS...</small>' : '<small style="color: #34A853;">✓ Ubicación obtenida</small>'}
                        `;
                        
                        marcadorUbicacion.bindPopup(mensaje).openPopup();
                        
                        // Centrar el mapa en la ubicación solo en el primer intento
                        if (intentos === 1) {
                            const zoom = accuracy > 500 ? 14 : (accuracy > 100 ? 16 : 17);
                            map.setView([lat, lng], zoom);
                        }
                        
                        console.log(`✅ Mejor precisión hasta ahora: ±${Math.round(accuracy)}m`);
                    }
                    
                    // Si tenemos buena precisión o llegamos al máximo de intentos, detener
                    if (accuracy < PRECISION_ACEPTABLE || intentos >= MAX_INTENTOS) {
                        navigator.geolocation.clearWatch(watchId);
                        watchId = null;
                        
                        let emoji = accuracy < 50 ? '🎯' : (accuracy < 200 ? '📍' : '⚠️');
                        let color = accuracy < 50 ? '#34A853' : (accuracy < 200 ? '#4285F4' : '#EA4335');
                        
                        // Actualizar popup final
                        if (marcadorUbicacion) {
                            marcadorUbicacion.setPopupContent(`
                                <strong>${emoji} Tu ubicación</strong><br>
                                Precisión: ±${Math.round(mejorPrecision)} metros<br>
                                <small style="color: ${color};">
                                    ${mejorPrecision < 100 ? '✓ Ubicación precisa obtenida' : 'Mejor precisión disponible'}<br>
                                    Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}
                                </small>
                            `);
                        }
                        
                        // Restaurar el icono original
                        div.innerHTML = `<i class="bi bi-crosshair" style="font-size: 20px; cursor: pointer; color: ${color};"></i>`;
                        console.log(`✅ Geolocalización completada. Mejor precisión: ±${Math.round(mejorPrecision)}m`);
                        
                        // Si la precisión es muy mala, avisar
                        if (mejorPrecision > 1000) {
                            setTimeout(() => {
                                alert(
                                    "⚠️ Baja precisión GPS\n\n" +
                                    "La ubicación obtenida es aproximada (±" + Math.round(mejorPrecision) + "m).\n\n" +
                                    "Para mejorar la precisión:\n" +
                                    "• Sal al exterior o acércate a una ventana\n" +
                                    "• Verifica que el GPS esté activado\n" +
                                    "• Espera unos segundos y vuelve a intentar\n" +
                                    "• Usa un dispositivo móvil en lugar de computadora"
                                );
                            }, 500);
                        }
                    }
                },
                (error) => {
                    console.error("Error de geolocalización:", error);
                    
                    // Detener el watch si hay error
                    if (watchId !== null) {
                        navigator.geolocation.clearWatch(watchId);
                        watchId = null;
                    }
                    
                    let mensaje = "No se pudo obtener tu ubicación";
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            mensaje = "🚫 Permiso de ubicación denegado\n\n" +
                                     "Para usar esta función:\n" +
                                     "1. Permite el acceso a la ubicación en tu navegador\n" +
                                     "2. Selecciona 'Ubicación precisa' (no aproximada)\n" +
                                     "3. Activa el GPS en tu dispositivo\n" +
                                     "4. Recarga la página e intenta nuevamente";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            mensaje = "📡 Información de ubicación no disponible\n\n" +
                                     "Verifica que:\n" +
                                     "1. Tu dispositivo tenga GPS\n" +
                                     "2. El GPS esté activado\n" +
                                     "3. Estés en un lugar con buena señal\n" +
                                     "4. Permitas acceso a ubicación precisa";
                            break;
                        case error.TIMEOUT:
                            mensaje = "⏱️ Tiempo de espera agotado\n\n" +
                                     "El GPS no pudo obtener señal.\n\n" +
                                     "Intenta:\n" +
                                     "1. Salir al exterior o acercarte a una ventana\n" +
                                     "2. Verificar que el GPS esté activado\n" +
                                     "3. Esperar y volver a intentar\n" +
                                     "4. Reiniciar el GPS de tu dispositivo";
                            break;
                    }
                    
                    alert(mensaje);
                    
                    // Restaurar el icono original
                    div.innerHTML = '<i class="bi bi-crosshair" style="font-size: 20px; cursor: pointer; color: #555;"></i>';
                },
                {
                    enableHighAccuracy: true,      // Máxima precisión GPS
                    timeout: 40000,                 // 40 segundos de timeout
                    maximumAge: 0                   // No usar ubicaciones en caché
                }
            );
        };
        
        return div;
    };
    geolocateButton.addTo(map);

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
        const togglePoblacion = document.getElementById('togglePoblacionCheckbox');
        
        const idsActivo = toggleIDS && toggleIDS.checked;
        const poblacionActivo = togglePoblacion && togglePoblacion.checked;

        if (!idsActivo && !poblacionActivo) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        let html = '<div style="font-weight: bold; margin-bottom: 8px; text-align: center; font-size: 12px;">Simbología</div>';

        if (idsActivo) {
            html += `
                <div style="margin-bottom: 10px;">
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

        if (poblacionActivo) {
            html += `
                <div>
                    <div style="font-weight: bold; margin-bottom: 5px; font-size: 11px;">Población Total</div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #5D4037; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>> 15,000</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #A52A2A; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>10,001 - 15,000</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #DC143C; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>5,001 - 10,000</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #FF6B6B; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>2,001 - 5,000</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 3px;">
                        <div style="width: 20px; height: 15px; background-color: #FFB3BA; margin-right: 5px; border: 1px solid #333;"></div>
                        <span>1 - 2,000</span>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    };

    console.log("🗺️ Mapa base cargado correctamente.");
});