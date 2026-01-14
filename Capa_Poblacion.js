document.addEventListener("DOMContentLoaded", function () {
  if (typeof L === "undefined" || typeof map === "undefined") {
    console.error("Leaflet o el mapa no están definidos.");
    return;
  }

  if (!map.getPane('poblacionPane')) {
    map.createPane('poblacionPane');
    map.getPane('poblacionPane').style.zIndex = 490;
  }

  // Variable global para la capa de población
  window.capaPoblacion = null;

  // Deshabilitar el checkbox hasta que la capa se cargue
  var togglePoblacionCheckbox = document.getElementById("togglePoblacionCheckbox");
  if (togglePoblacionCheckbox) {
    togglePoblacionCheckbox.disabled = true;
  }

  function cargarCapaPoblacion() {
    fetch("archivos/vectores/colonias_wgs84_geojson_renombrado.geojson")
      .then(response => {
        if (!response.ok) throw new Error("Error al cargar el GeoJSON: " + response.statusText);
        return response.json();
      })
      .then(data => {
        console.log("GeoJSON de población cargado correctamente:", data);

        // Función para obtener el color según la población (escala de rojos a café)
        function getColorPoblacion(poblacion) {
          if (poblacion === 0 || !poblacion) return 'transparent'; // Sin población
          if (poblacion > 15000) return '#5D4037';  // Muy Alto - Café oscuro
          if (poblacion > 10000) return '#A52A2A';  // Alto - Rojo oscuro (Brown)
          if (poblacion > 5000) return '#DC143C';   // Medio - Rojo (Crimson)
          if (poblacion > 2000) return '#FF6B6B';   // Medio Bajo - Rojo claro
          return '#FFB3BA';                          // Bajo - Rosa/rojo muy claro
        }

        // Función de estilo para la capa de población
        function estiloPoblacion(feature) {
          const poblacion = feature.properties?.POBTOT_sum || 0;
          return {
            fillColor: getColorPoblacion(poblacion),
            weight: 1.5,
            opacity: 1,
            color: '#000000',
            fillOpacity: 0.7
          };
        }

        window.capaPoblacion = L.geoJSON(data, {
          pane: 'poblacionPane',
          style: estiloPoblacion,
          onEachFeature: function (feature, layer) {
            const nombreColonia = feature.properties?.NOMBRE;
            const poblacion = feature.properties?.POBTOT_sum || 0;

            if (nombreColonia) {
              const popupContent = `
                <div class="popup-contenido">
                  <h4 class="popup-titulo">${nombreColonia}</h4>
                  <p style="margin: 5px 0;"><strong>Población Total:</strong> ${poblacion.toLocaleString('es-MX')}</p>
                </div>`;

              layer.bindPopup(popupContent);
            }
          }
        });

        // NO agregar la capa al mapa inicialmente (estará apagada)
        console.log("Capa de Población cargada correctamente (apagada por defecto).");

        // Habilitar el checkbox
        if (togglePoblacionCheckbox) {
          togglePoblacionCheckbox.disabled = false;
        }
      })
      .catch(error => console.error("Error al cargar la capa de población:", error));
  }

  // Cargar la capa
  cargarCapaPoblacion();
});
