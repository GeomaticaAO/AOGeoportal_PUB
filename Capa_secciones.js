// Verificar que Leaflet esté disponible antes de ejecutar el script
if (typeof L === "undefined") {
  console.error("Leaflet no está cargado correctamente. Verifica que la biblioteca se haya incluido en index.html.");
} else {
  document.addEventListener("DOMContentLoaded", function () {
      console.log("DOM cargado, iniciando carga del GeoJSON de Secciones...");

      // Verificar que 'map' ya esté definido
      if (typeof map === "undefined") {
          console.error("El objeto 'map' no está definido. Verifica que se haya inicializado en otro archivo.");
          return;
      }

      // Si existe un grupo de capas previo, lo removemos
      if (map.geojsonSeccionesLayerGroup) {
          map.removeLayer(map.geojsonSeccionesLayerGroup);
      }

      // Creamos un grupo de capas exclusivo para el GeoJSON de Secciones
      map.geojsonSeccionesLayerGroup = L.layerGroup().addTo(map);

      // Declarar la variable global para la capa Secciones
      window.Secciones_layer = null;

      // Deshabilitar el checkbox hasta que la capa se cargue
      var toggleCheckbox = document.getElementById("toggleSeccionesCheckbox");
      if (toggleCheckbox) {
          toggleCheckbox.disabled = true;
      }

      // Función para cargar el GeoJSON
      function loadGeoJSON(url) {
          console.log("Número de capas previas en geojsonSeccionesLayerGroup antes de limpiar:", map.geojsonSeccionesLayerGroup.getLayers().length);
          map.geojsonSeccionesLayerGroup.clearLayers();
          window.Secciones_layer = null;

          // Agregar un parámetro de cache busting para evitar el uso de versiones cacheadas
          const urlConCacheBust = url + "?v=" + Date.now();
          console.log(`Cargando GeoJSON de Secciones desde: ${urlConCacheBust}`);

          fetch(urlConCacheBust)
              .then(response => response.ok ? response.json() : Promise.reject(`Error al cargar el archivo: ${response.statusText}`))
              .then(data => {
                  console.log("GeoJSON de Secciones cargado:", data);

                  if (!data || !data.features || data.features.length === 0) {
                      throw new Error("El archivo GeoJSON no contiene 'features' válidos.");
                  }

                  // Paleta de colores para cada categoría de TRANSICIÓ
                  const coloresPorTransicio = {
                      "AA": "#8B1538",    // Guinda
                      "BA": "#FF6B35",    // Naranja fuerte
                      "CA": "#F5DEB3",    // Beige
                      "AB": "#28A745",    // Verde
                      "BB": "#FFD700",    // Amarillo
                      "CC": "#87CEEB",    // Azul claro
                      "DD": "#1E3A8A"     // Azul fuerte
                  };

                  // Crear la capa GeoJSON y asignar estilos
                  window.Secciones_layer = L.geoJSON(data, {
                      style: feature => {
                          let transicio = (feature.properties?.TRANSICIÓ || feature.properties?.TRANSICIO || "Sin información").trim();
                          if (transicio === "Sin información") {
                              return { stroke: true, color: "#999", weight: 1, fillOpacity: 0.3, fillColor: "#ccc" };
                          }
                          return { 
                              color: "#333", 
                              weight: 1, 
                              fillOpacity: 0.7,
                              fillColor: coloresPorTransicio[transicio] || "#999"
                          };
                      },
                      onEachFeature: (feature, layer) => {
                          let transicio = feature.properties?.TRANSICIÓ || feature.properties?.TRANSICIO || "No especificado";
                          let popupContent = `<h3>Sección</h3>
                                              <p><strong>TRANSICIÓ:</strong> ${transicio}</p>`;
                          
                          // Agregar otras propiedades disponibles
                          if (feature.properties) {
                              for (let key in feature.properties) {
                                  if (key !== "TRANSICIÓ" && key !== "TRANSICIO") {
                                      popupContent += `<p><strong>${key}:</strong> ${feature.properties[key]}</p>`;
                                  }
                              }
                          }
                          
                          layer.bindPopup(popupContent);

                          if (L.DomEvent && typeof L.DomEvent.disableClickPropagation === "function") {
                              L.DomEvent.disableClickPropagation(layer);
                          }

                          // Eventos de resaltado
                          layer.on("mouseover", () => layer.setStyle({ fillOpacity: 0.9, weight: 2 }));
                          layer.on("mouseout", () => layer.setStyle({ fillOpacity: 0.7, weight: 1 }));
                      }
                  });

                  // NO agregar la capa al mapa inicialmente (estará apagada)
                  // map.geojsonSeccionesLayerGroup.addLayer(window.Secciones_layer);
                  // window.Secciones_layer.eachLayer(layer => layer.bringToBack());

                  console.log("Capa GeoJSON de Zonas cargada correctamente (apagada por defecto).");

                  // Habilitar el checkbox para que el usuario pueda interactuar
                  if (toggleCheckbox) {
                      toggleCheckbox.disabled = false;
                  }
              })
              .catch(error => console.error("Error al cargar el GeoJSON de Secciones:", error));
      }

      // Ejecutar la carga del GeoJSON
      loadGeoJSON("archivos/vectores/secciones.geojson");
  });
}
