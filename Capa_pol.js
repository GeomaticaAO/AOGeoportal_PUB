// Verificar que Leaflet esté disponible antes de ejecutar el script
if (typeof L === "undefined") {
  console.error("Leaflet no está cargado correctamente. Verifica que la biblioteca se haya incluido en index.html.");
} else {
  document.addEventListener("DOMContentLoaded", function () {
      console.log("DOM cargado, iniciando carga del GeoJSON...");

      // Verificar que 'map' ya esté definido
      if (typeof map === "undefined") {
          console.error("El objeto 'map' no está definido. Verifica que se haya inicializado en otro archivo.");
          return;
      }

      // Si existe un grupo de capas previo, lo removemos
      if (map.geojsonBaseLayerGroup) {
          map.removeLayer(map.geojsonBaseLayerGroup);
      }

      // Creamos un grupo de capas exclusivo para el GeoJSON
      map.geojsonBaseLayerGroup = L.layerGroup().addTo(map);

      // Declarar la variable global para la capa IDS_AO
      IDS_AO_layer = null;

      // Deshabilitar el checkbox hasta que la capa se cargue
      var toggleCheckbox = document.getElementById("toggleIDSCheckbox");
      if (toggleCheckbox) {
          toggleCheckbox.disabled = true;
      }

      // Función para cargar el GeoJSON
      function loadGeoJSON(url) {
          console.log("Número de capas previas en geojsonBaseLayerGroup antes de limpiar:", map.geojsonBaseLayerGroup.getLayers().length);
          map.geojsonBaseLayerGroup.clearLayers();
          IDS_AO_layer = null;

          // Agregar un parámetro de cache busting para evitar el uso de versiones cacheadas
          const urlConCacheBust = url + "?v=" + Date.now();
          console.log(`Cargando GeoJSON desde: ${urlConCacheBust}`);

          fetch(urlConCacheBust)
              .then(response => response.ok ? response.json() : Promise.reject(`Error al cargar el archivo: ${response.statusText}`))
              .then(data => {
                  console.log("GeoJSON cargado:", data);

                  if (!data || !data.features || data.features.length === 0) {
                      throw new Error("El archivo GeoJSON no contiene 'features' válidos.");
                  }

                  // Paleta de colores para cada categoría
                  const coloresPorCategoria = {
                      "Muy alto": "#08810C",
                      "Alto": "#97FE9A",
                      "Medio": "#EC7063",
                      "Bajo": "#922B21",
                      "Muy bajo": "#641E16",
                  };

                  // Crear la capa GeoJSON y asignar estilos
                  IDS_AO_layer = L.geoJSON(data, {
                      style: feature => {
                          let categoria = (feature.properties?.e_idsm || "Sin información").trim();
                          if (categoria === "Sin información") {
                              return { stroke: false, fill: false };
                          }
                          return { color: coloresPorCategoria[categoria] || "gray", weight: 2, fillOpacity: 0.6 };
                      },
                      onEachFeature: (feature, layer) => {
                          let popupContent = `<h3>${feature.properties?.name || "Sin título"}</h3>
                                              <p><strong>e_idsm:</strong> ${feature.properties?.e_idsm || "No especificado"}</p>`;
                          layer.bindPopup(popupContent);

                          if (L.DomEvent && typeof L.DomEvent.disableClickPropagation === "function") {
                              L.DomEvent.disableClickPropagation(layer);
                          }

                          // Eventos de resaltado
                          layer.on("mouseover", () => layer.setStyle({ fillOpacity: 1, weight: 3 }));
                          layer.on("mouseout", () => layer.setStyle({ fillOpacity: 0.6, weight: 2 }));
                      }
                  });

                  // NO agregar la capa al mapa inicialmente (estará apagada)
                  // map.geojsonBaseLayerGroup.addLayer(IDS_AO_layer);
                  // IDS_AO_layer.eachLayer(layer => layer.bringToBack());

                  console.log("Capa GeoJSON cargada correctamente (apagada por defecto).");

                  // Habilitar el checkbox para que el usuario pueda interactuar
                  if (toggleCheckbox) {
                      toggleCheckbox.disabled = false;
                  }
              })
              .catch(error => console.error("Error al cargar el GeoJSON:", error));
      }

      // Ejecutar la carga del GeoJSON
      loadGeoJSON("archivos/vectores/IDS_AO.geojson");

      // Aplicar fuente Montserrat Medium dinámicamente
      document.querySelectorAll(".lista-capas li span, .lista-capas li label, .form-check-label").forEach(element => {
          element.style.fontFamily = "Montserrat, sans-serif";
          element.style.fontWeight = "400";
      });
  });
}