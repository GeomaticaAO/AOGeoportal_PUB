// ============================================================================
// CAPA: CLÚSTER UNIVERSITARIO
// ============================================================================

// Función para cargar y mostrar la capa de Clúster Universitario
(function cargarCapaCluster() {
  // URL del archivo GeoJSON de clúster con cache busting
  const urlCluster = "archivos/vectores/cluster.geojson?v=" + new Date().getTime();

  // Realizamos la petición para obtener el archivo GeoJSON
  fetch(urlCluster)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al cargar el archivo cluster.geojson");
      }
      return response.json();
    })
    .then((dataCluster) => {
      console.log("Archivo cluster.geojson cargado correctamente:", dataCluster);

      // Crear un grupo de capas para los marcadores de clúster
      const Cluster_layer = L.layerGroup();

      // Función para obtener el ícono basado en el ID con tamaños personalizados
      function obtenerIconoCluster(id) {
        // Configuraciones específicas por ID (ancho, alto)
        const tamaños = {
          1: [40, 40],   // Cuadrado
          2: [40, 40],   // Cuadrado
          3: [90, 30],   // Rectangular horizontal muy ancho - CIDE
          4: [40, 40],   // Cuadrado
          5: [40, 40],   // Cuadrado
          6: [40, 40],   // Cuadrado - Colegio de México
          7: [90, 30],   // Rectangular horizontal - CESSA
          8: [40, 40],   // Cuadrado - FLACSO México
          9: [40, 40],   // Cuadrado
          10: [90, 30],  // Rectangular horizontal - Instituto Cultural Helénico
          11: [40, 40],  // Cuadrado
          12: [40, 40],  // Cuadrado (jpg)
          13: [90, 30],  // Rectangular horizontal muy ancho (jpg)
          14: [90, 30],  // Rectangular horizontal - ITAO (jpg)
          15: [90, 30],  // Rectangular horizontal - ITC
          16: [90, 30],  // Rectangular horizontal - SEP
          17: [40, 40],  // Cuadrado
          18: [90, 30],  // Rectangular horizontal muy ancho
          19: [40, 40],  // Cuadrado
          20: [90, 30],  // Rectangular horizontal - UNIPOL
          21: [40, 40],  // Cuadrado
          22: [40, 40],  // Cuadrado - Universidad Iberoamericana
          23: [90, 30],  // Rectangular horizontal muy ancho
          24: [40, 40],  // Cuadrado
          25: [40, 40],  // Cuadrado
          26: [90, 30]   // Rectangular horizontal muy ancho
        };
        
        const size = tamaños[id] || [40, 40];
        const extension = (id === 12 || id === 13 || id === 14) ? 'jpg' : 'png';
        
        return L.icon({
          iconUrl: `img/img_cluster/${id}.${extension}`,
          iconSize: size,
          iconAnchor: [size[0] / 2, size[1] / 2],  // Centro de la imagen
          popupAnchor: [0, -size[1] / 2]           // Arriba del centro
        });
      }

      // Recorrer todas las features del GeoJSON
      dataCluster.features.forEach((feature) => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;

        // Crear el contenido del popup (solo mostrar el nombre)
        let popupContent = `<b>${props.Name || 'Clúster Universitario'}</b>`;

        // Obtener el ícono basado en el ID
        const iconoCluster = obtenerIconoCluster(props.ID);

        // Crear el marcador con el ícono personalizado
        const marker = L.marker([coords[1], coords[0]], {
          icon: iconoCluster
        }).bindPopup(popupContent);

        // Agregar el marcador al grupo de capas
        Cluster_layer.addLayer(marker);

        // Registrar el elemento en el buscador si la función está disponible
        if (typeof registrarElementoBuscable === "function") {
          registrarElementoBuscable({
            nombre: props.Name || 'Clúster Universitario',
            capa: "Clúster Universitario",
            tipo: "Universidad",
            marker: marker,
            checkboxId: "toggleClusterCheckbox"
          });
        }
      });

      // Hacer el layer accesible globalmente
      window.Cluster_layer = Cluster_layer;

      console.log(`Capa Clúster Universitario creada con ${dataCluster.features.length} elementos.`);

      // Habilitar el checkbox una vez cargado el layer
      const checkboxCluster = document.getElementById("toggleClusterCheckbox");
      if (checkboxCluster) {
        checkboxCluster.disabled = false;
      }
    })
    .catch((error) => {
      console.error("Error al cargar o procesar cluster.geojson:", error);
    });
})();
