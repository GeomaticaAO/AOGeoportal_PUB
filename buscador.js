document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("floatingInput");
    const suggestionsBox = document.getElementById("suggestions");
    const btnLimpiar = document.getElementById("btnLimpiarBusqueda");

    let elementosBuscables = []; // colonias, marcadores y actividades
    let nombresColonias = [];
    let capasEncendidasPorBusqueda = new Set(); // Rastrear capas encendidas por búsqueda

    // Carga inicial de colonias desde JSON
    fetch("archivos/json/NOMGEO.json")
        .then(response => {
            if (!response.ok) throw new Error("Error al cargar JSON: " + response.statusText);
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) throw new Error("El JSON no tiene el formato esperado.");
            nombresColonias = data.map(c => String(c));
            const entradaColonias = nombresColonias.map(nombre => ({
                nombre: nombre,
                tipo: "colonia"
            }));
            elementosBuscables = [...entradaColonias, ...elementosBuscables];
            console.log("Colonias cargadas:", nombresColonias.length);
        })
        .catch(error => console.error("Error al cargar colonias:", error));

    // Escucha escritura en el input
    input.addEventListener("input", function () {
        mostrarSugerencias(this.value.trim());
    });

    // Botón limpiar búsqueda
    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", function () {
            // Limpiar el input
            input.value = "";
            
            // Ocultar sugerencias
            suggestionsBox.style.display = "none";
            suggestionsBox.innerHTML = "";
            
            // Cerrar todos los tooltips de búsqueda abiertos
            map.eachLayer(function(layer) {
                if (layer._tooltipBusqueda) {
                    layer.closeTooltip();
                    layer.unbindTooltip();
                    delete layer._tooltipBusqueda;
                }
            });
            
            // Apagar capas que fueron encendidas por la búsqueda
            capasEncendidasPorBusqueda.forEach(checkboxId => {
                const checkbox = document.getElementById(checkboxId);
                if (checkbox && checkbox.checked) {
                    checkbox.click(); // Apagar la capa
                }
            });
            
            // Limpiar el set de capas encendidas
            capasEncendidasPorBusqueda.clear();
            
            // Cerrar cualquier popup abierto
            if (map && map.closePopup) {
                map.closePopup();
            }
            
            console.log("Búsqueda limpiada");
        });
    }

    // Cierra sugerencias al hacer clic fuera
    document.addEventListener("click", function (event) {
        if (!input.contains(event.target) && !suggestionsBox.contains(event.target)) {
            suggestionsBox.style.display = "none";
        }
    });

    function mostrarSugerencias(filtro) {
        suggestionsBox.innerHTML = "";

        if (filtro === "" || elementosBuscables.length === 0) {
            suggestionsBox.style.display = "none";
            return;
        }

        const coincidencias = elementosBuscables
            .filter(item => item.nombre.toLowerCase().includes(filtro.toLowerCase()))
            .slice(0, 10); // Aumentado el límite de sugerencias

        if (coincidencias.length === 0) {
            suggestionsBox.style.display = "none";
            return;
        }

        coincidencias.forEach(item => {
            const div = document.createElement("div");
            div.textContent = item.nombre + (item.capa ? ` (${item.capa})` : "");
            div.classList.add("suggestion-item");

            div.onclick = function () {
                input.value = item.nombre;
                suggestionsBox.style.display = "none";

                if (item.tipo === "colonia") {
                    if (typeof zoomAColonia === "function") {
                        zoomAColonia(item.nombre);
                    }
                } else if (item.tipo === "marcador" && item.marker) {
                    // Encender la capa si tiene checkbox asociado
                    if (item.checkboxId) {
                        const checkbox = document.getElementById(item.checkboxId);
                        if (checkbox && !checkbox.checked) {
                            checkbox.click();
                            capasEncendidasPorBusqueda.add(item.checkboxId);
                        }
                    }
                    map.setView(item.marker.getLatLng(), 17);
                    item.marker.openPopup();
                } else if (item.tipo === "actividad" && item.marcadores) {
                    // Buscar actividad: encender capas y mostrar todos los marcadores
                    const capasEncendidas = new Set();
                    item.marcadores.forEach(markerInfo => {
                        if (markerInfo.checkboxId && !capasEncendidas.has(markerInfo.checkboxId)) {
                            const checkbox = document.getElementById(markerInfo.checkboxId);
                            if (checkbox && !checkbox.checked) {
                                checkbox.click();
                                capasEncendidasPorBusqueda.add(markerInfo.checkboxId);
                            }
                            capasEncendidas.add(markerInfo.checkboxId);
                        }
                    });
                    
                    // Ajustar zoom para mostrar todos los marcadores de esta actividad
                    if (item.marcadores.length > 0) {
                        if (item.marcadores.length === 1) {
                            // Si solo hay un marcador, hacer zoom directo
                            if (item.marcadores[0].marker) {
                                map.setView(item.marcadores[0].marker.getLatLng(), 17);
                                item.marcadores[0].marker.openPopup();
                            }
                        } else {
                            // Si hay múltiples marcadores, ajustar bounds para mostrarlos todos
                            const bounds = L.latLngBounds();
                            
                            item.marcadores.forEach(markerInfo => {
                                if (markerInfo.marker) {
                                    const latLng = markerInfo.marker.getLatLng();
                                    bounds.extend(latLng);
                                }
                            });
                            
                            if (bounds.isValid()) {
                                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                                
                                // Para múltiples marcadores, usar tooltips permanentes en lugar de popups
                                setTimeout(() => {
                                    item.marcadores.forEach(markerInfo => {
                                        if (markerInfo.marker) {
                                            // Obtener el contenido del popup
                                            const popupContent = markerInfo.marker.getPopup().getContent();
                                            
                                            // Crear tooltip permanente con el contenido del popup
                                            if (!markerInfo.marker._tooltipBusqueda) {
                                                markerInfo.marker._tooltipBusqueda = L.tooltip({
                                                    permanent: true,
                                                    direction: 'top',
                                                    className: 'tooltip-busqueda',
                                                    opacity: 0.95
                                                }).setContent(popupContent);
                                                
                                                markerInfo.marker.bindTooltip(markerInfo.marker._tooltipBusqueda);
                                            }
                                            markerInfo.marker.openTooltip();
                                        }
                                    });
                                }, 500);
                            }
                        }
                    }
                }
            };

            suggestionsBox.appendChild(div);
        });

        suggestionsBox.style.display = "block";
    }

    // Almacenar actividades indexadas por nombre
    const actividadesPorNombre = {};

    // Esta función puede llamarse desde otras capas al crear nuevos puntos buscables
    window.registrarElementoBuscable = function ({ nombre, capa, marker, checkboxId, actividades }) {
        // Registrar el marcador
        elementosBuscables.push({
            nombre: nombre,
            tipo: "marcador",
            capa: capa,
            marker: marker,
            checkboxId: checkboxId
        });

        // Registrar actividades si existen
        if (actividades && Array.isArray(actividades)) {
            actividades.forEach(actividad => {
                const actividadNormalizada = actividad.toLowerCase().trim();
                if (actividadNormalizada && actividadNormalizada !== '') {
                    if (!actividadesPorNombre[actividadNormalizada]) {
                        actividadesPorNombre[actividadNormalizada] = {
                            nombre: actividad,
                            tipo: "actividad",
                            capa: capa,
                            marcadores: []
                        };
                    }
                    actividadesPorNombre[actividadNormalizada].marcadores.push({
                        marker: marker,
                        checkboxId: checkboxId
                    });
                }
            });

            // Actualizar la lista de elementos buscables con actividades únicas
            elementosBuscables = elementosBuscables.filter(item => item.tipo !== "actividad");
            Object.values(actividadesPorNombre).forEach(actInfo => {
                elementosBuscables.push(actInfo);
            });
        }
    };
});