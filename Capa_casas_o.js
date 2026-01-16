// Verificar que Leaflet esté disponible antes de ejecutar el script
if (typeof L === "undefined") {
  console.error("Leaflet no está cargado correctamente. Verifica que la biblioteca se haya incluido en index.html.");
} else {
  document.addEventListener("DOMContentLoaded", function () {
      console.log("DOM cargado, iniciando carga del GeoJSON de Casas Obregonenses...");

      // Verificar que 'map' ya esté definido
      if (typeof map === "undefined") {
          console.error("El objeto 'map' no está definido. Verifica que se haya inicializado en otro archivo.");
          return;
      }

      // Declarar la variable global para la capa de Casas Obregonenses
      window.Casas_O_layer = null;

      // Deshabilitar el checkbox hasta que la capa se cargue
      var toggleCheckbox = document.getElementById("toggleCasasOCheckbox");
      if (toggleCheckbox) {
          toggleCheckbox.disabled = true;
      }

      // Función para cargar el GeoJSON
      function loadGeoJSON(url) {
          window.Casas_O_layer = null;

          // Agregar un parámetro de cache busting para evitar el uso de versiones cacheadas
          const urlConCacheBust = url + "?v=" + Date.now();
          console.log(`Cargando GeoJSON de Casas Obregonenses desde: ${urlConCacheBust}`);

          fetch(urlConCacheBust)
              .then(response => response.ok ? response.json() : Promise.reject(`Error al cargar el archivo: ${response.statusText}`))
              .then(data => {
                  console.log("GeoJSON de Casas Obregonenses cargado:", data);

                  if (!data || !data.features || data.features.length === 0) {
                      throw new Error("El archivo GeoJSON no contiene 'features' válidos.");
                  }

                  // Crear la capa GeoJSON y asignar estilos
                  window.Casas_O_layer = L.geoJSON(data, {
                      pointToLayer: (feature, latlng) => {
                          // Icono con las letras AO (Álvaro Obregón) con fondo guinda
                          const iconoCasasO = L.divIcon({
                              html: '<div style="background-color: #922B21; color: white; font-weight: bold; font-size: 14px; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">AO</div>',
                              className: 'casas-o-icon',
                              iconSize: [32, 32],
                              iconAnchor: [16, 16],
                              popupAnchor: [0, -16]
                          });
                          return L.marker(latlng, { icon: iconoCasasO });
                      },
                      style: feature => {
                          // Estilo para polígonos (si hubiera)
                          return { 
                              color: "#922B21", 
                              weight: 2, 
                              fillOpacity: 0.6,
                              fillColor: "#922B21"
                          };
                      },
                      onEachFeature: (feature, layer) => {
                          const props = feature.properties;
                          let popupContent = `<div style="font-size: 12px;"><h4 style="font-size: 14px; margin-bottom: 8px;">${props?.Name || "Casa Obregonense"}</h4>`;
                          
                          // Mostrar todos los atributos disponibles excepto Name y fid
                          if (props) {
                              for (let key in props) {
                                  if (key !== 'Name' && key !== 'fid' && props[key]) {
                                      popupContent += `<p style="margin: 4px 0;"><strong>${key}:</strong> ${props[key]}</p>`;
                                  }
                              }
                          }
                          
                          popupContent += `</div>`;
                          layer.bindPopup(popupContent);

                          if (L.DomEvent && typeof L.DomEvent.disableClickPropagation === "function") {
                              L.DomEvent.disableClickPropagation(layer);
                          }

                          // Eventos de resaltado (solo para polígonos)
                          if (layer.setStyle) {
                              layer.on("mouseover", () => layer.setStyle({ fillOpacity: 1, weight: 3 }));
                              layer.on("mouseout", () => layer.setStyle({ fillOpacity: 0.6, weight: 2 }));
                          }
                      }
                  });

                  console.log("Capa GeoJSON de Casas Obregonenses cargada correctamente (apagada por defecto).");

                  // Habilitar el checkbox para que el usuario pueda interactuar
                  if (toggleCheckbox) {
                      toggleCheckbox.disabled = false;
                  }
              })
              .catch(error => console.error("Error al cargar el GeoJSON de Casas Obregonenses:", error));
      }

      // Ejecutar la carga del GeoJSON
      loadGeoJSON("archivos/vectores/casas_o.geojson");
  });
}
