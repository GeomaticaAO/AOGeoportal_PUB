document.addEventListener("DOMContentLoaded", function () {
    if (typeof L === "undefined" || typeof map === "undefined") {
        console.error("Leaflet o el mapa no están definidos.");
        return;
    }

    if (!map.getPane('capasPuntosPane')) {
        map.createPane('capasPuntosPane');
        map.getPane('capasPuntosPane').style.zIndex = 650;
    }

    const capasPuntos = {};
    const controlCapasContainer = document.getElementById("controlCapasContainer");
    if (!controlCapasContainer) {
        console.error("No se encontró el contenedor #controlCapasContainer.");
        return;
    }

    const listaCapas = document.createElement("ul");
    listaCapas.className = "lista-capas";
    controlCapasContainer.appendChild(listaCapas);

    // 🏗️ Crear grupo principal para Infraestructuras
    const grupoInfraestructura = document.createElement("li");
    grupoInfraestructura.style.marginBottom = "15px";
    grupoInfraestructura.style.listStyle = "none";
    grupoInfraestructura.style.display = "block";
    grupoInfraestructura.style.width = "100%";
    
    // Contenedor para la cabecera del grupo (flecha + checkbox + label)
    const headerGrupo = document.createElement("div");
    headerGrupo.style.display = "flex";
    headerGrupo.style.alignItems = "center";
    headerGrupo.style.marginBottom = "8px";
    headerGrupo.style.width = "100%";
    headerGrupo.style.flexWrap = "nowrap";
    
    // Icono desplegable (flecha)
    const iconoToggle = document.createElement("span");
    iconoToggle.innerHTML = "▶"; // Flecha derecha
    iconoToggle.style.cursor = "pointer";
    iconoToggle.style.marginRight = "8px";
    iconoToggle.style.fontSize = "12px";
    iconoToggle.style.transition = "transform 0.3s ease";
    iconoToggle.style.display = "inline-block";
    iconoToggle.style.width = "15px";
    iconoToggle.style.flexShrink = "0";
    
    // Checkbox principal del grupo
    const checkboxGrupo = document.createElement("input");
    checkboxGrupo.type = "checkbox";
    checkboxGrupo.id = "checkboxInfraestructuras";
    checkboxGrupo.style.marginRight = "8px";
    checkboxGrupo.style.flexShrink = "0";
    
    const labelGrupo = document.createElement("label");
    labelGrupo.htmlFor = "checkboxInfraestructuras";
    labelGrupo.style.fontWeight = "bold";
    labelGrupo.style.cursor = "pointer";
    labelGrupo.style.fontSize = "14px";
    labelGrupo.style.flex = "1";
    labelGrupo.textContent = "Infraestructuras Álvaro Obregón";
    
    // Contenedor de capas hijas (sublista)
    const listaCapasInfraestructura = document.createElement("ul");
    listaCapasInfraestructura.className = "lista-capas-infraestructura";
    listaCapasInfraestructura.style.marginLeft = "25px";
    listaCapasInfraestructura.style.marginTop = "5px";
    listaCapasInfraestructura.style.display = "none"; // Inicialmente oculto
    listaCapasInfraestructura.style.listStyle = "none";
    listaCapasInfraestructura.style.paddingLeft = "0";
    listaCapasInfraestructura.style.width = "100%";
    
    // Variable para controlar el estado desplegado
    let isExpanded = false;
    
    // Función para toggle del grupo (expandir/colapsar)
    iconoToggle.addEventListener("click", function() {
        isExpanded = !isExpanded;
        listaCapasInfraestructura.style.display = isExpanded ? "block" : "none";
        iconoToggle.style.transform = isExpanded ? "rotate(90deg)" : "rotate(0deg)";
    });
    
    // También permitir expandir al hacer clic en el label
    labelGrupo.addEventListener("click", function(e) {
        if (e.target === labelGrupo) {
            iconoToggle.click();
        }
    });
    
    // Ensamblar la cabecera
    headerGrupo.appendChild(iconoToggle);
    headerGrupo.appendChild(checkboxGrupo);
    headerGrupo.appendChild(labelGrupo);
    
    grupoInfraestructura.appendChild(headerGrupo);
    grupoInfraestructura.appendChild(listaCapasInfraestructura);
    listaCapas.appendChild(grupoInfraestructura);
    
    // Función para actualizar el contador en el título
    window.actualizarContadorInfraestructuras = function() {
        labelGrupo.innerHTML = `Infraestructuras Álvaro Obregón <span style="color: #922B21; font-weight: bold;">(${window.contadorInfraestructuras.total})</span>`;
    };
    
    // Array para almacenar todos los checkboxes de las capas de infraestructura
    const checkboxesInfraestructura = [];
    
    // Variable global para rastrear el total de infraestructuras
    window.contadorInfraestructuras = {
        total: 0,
        desglose: {}
    };
    
    // Función para manejar el checkbox principal
    checkboxGrupo.addEventListener("change", function() {
        // Si se activa el checkbox, expandir automáticamente
        if (this.checked && !isExpanded) {
            iconoToggle.click();
        }
        
        // Activar/desactivar todas las capas hijas
        checkboxesInfraestructura.forEach(cb => {
            if (cb.checked !== this.checked) {
                cb.click();
            }
        });
    });



    // Íconos: Centros de Desarrollo Comunitario
   
const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQHAUUwIZdDhl16SZRrr1B7ecSWWCoYFYEXorSWP12U_0FEwoefgkVzaslXDCn4ww/pub?output=csv";

// 🔸 Icono único para CDC
const iconoCDC = L.icon({ iconUrl: "img/icono/CDC.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] });

// 🔹 Conteo por estado
const conteoEstados2 = {
    "Centros de Desarrollo Comunitario": { Bueno: 0, Regular: 0, Malo: 0 }
};

// 🔹 Agrupación por estado
const gruposPorEstado = {
    "Bueno": L.layerGroup([], { pane: 'capasPuntosPane' }),
    "Regular": L.layerGroup([], { pane: 'capasPuntosPane' }),
    "Malo": L.layerGroup([], { pane: 'capasPuntosPane' })
};

fetch(urlCSV)
    .then(response => response.text())
    .then(csvText => {
        Papa.parse(csvText, {
            header: false,
            skipEmptyLines: true,
            complete: function (results) {
                const data = results.data.slice(1);

                data.forEach(columnas => {
                    const name = columnas[1]?.trim();
                    const tipo = columnas[2]?.trim();
                    const direc = columnas[3]?.trim();
                    const lat = parseFloat(columnas[4]);
                    const lng = parseFloat(columnas[5]);
                    const linkGoogle = columnas[6]?.trim();
                    const contacto = columnas[7]?.trim();
                    const actGratis = columnas[8]?.trim();
                    const actCosto = columnas[9]?.trim();
                    const observaciones = columnas[10]?.trim();
                    const linkFoto = columnas[11]?.trim();
                    const estado = columnas[12]?.trim();
                    const estadoNormalizado = estado || "Regular";

                    if (!isNaN(lat) && !isNaN(lng)) {
                        const icono = iconoCDC;

                        let popup = `<b>${name}</b><br>`;
                        if (tipo) popup += `<b>Tipo:</b> ${tipo}<br>`;
                        if (direc) popup += `<b>Dirección:</b> ${direc}<br>`;
                        if (linkGoogle) {
                            const limpio = linkGoogle.replace(/^"+|"+$/g, "").trim();
                            const urlSegura = encodeURI(limpio);
                            popup += `<b>Ubicación:</b> <a href="${urlSegura}" target="_blank">Abrir en Google Maps</a><br>`;
                        }
                        if (contacto) popup += `<b>Contacto:</b> ${contacto}<br>`;
                        if (actGratis) popup += `<b>Actividades Gratuitas:</b> ${actGratis}<br>`;
                        if (actCosto) popup += `<b>Actividades con Costo:</b> ${actCosto}<br>`;
                        if (observaciones) popup += `<b>Observaciones:</b> ${observaciones}<br>`;
                        if (linkFoto) popup += `<b>Foto:</b> <a href="${linkFoto}" target="_blank">Ver imagen</a><br>`;

                        const marker = L.marker([lat, lng], {
                            icon: icono,
                            pane: 'capasPuntosPane'
                        }).bindPopup(popup);

                        gruposPorEstado[estadoNormalizado].addLayer(marker);

                        if (typeof registrarElementoBuscable === "function") {
                            registrarElementoBuscable({
                                nombre: name,
                                capa: "Centros de Desarrollo Comunitario",
                                marker: marker
                            });
                        }

                        if (estadoNormalizado in conteoEstados2["Centros de Desarrollo Comunitario"]) {
                            conteoEstados2["Centros de Desarrollo Comunitario"][estadoNormalizado]++;
                        }
                    }
                });

                // 📁 Panel lateral simplificado
                const grupoCompleto = L.layerGroup([], { pane: 'capasPuntosPane' });
                ["Bueno", "Regular", "Malo"].forEach(estado => {
                    gruposPorEstado[estado].eachLayer(layer => grupoCompleto.addLayer(layer));
                });

                const totalCDC = conteoEstados2["Centros de Desarrollo Comunitario"].Bueno + 
                                 conteoEstados2["Centros de Desarrollo Comunitario"].Regular + 
                                 conteoEstados2["Centros de Desarrollo Comunitario"].Malo;

                // Registrar en el contador global
                window.contadorInfraestructuras.desglose["Centros de Desarrollo Comunitario"] = totalCDC;
                window.contadorInfraestructuras.total += totalCDC;
                if (typeof window.actualizarContadorInfraestructuras === 'function') {
                    window.actualizarContadorInfraestructuras();
                }

                const itemCapa = document.createElement("li");
                itemCapa.style.marginBottom = "10px";
                itemCapa.style.fontSize = "13px";

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = false;
                checkbox.id = "checkboxCDC";

                checkbox.addEventListener("change", function () {
                    if (checkbox.checked) {
                        grupoCompleto.addTo(map);
                    } else {
                        map.removeLayer(grupoCompleto);
                    }
                });

                const label = document.createElement("label");
                label.htmlFor = "checkboxCDC";
                label.style.marginLeft = "6px";
                label.style.cursor = "pointer";
                label.innerHTML = `
                    <span style="color: #555;">(${totalCDC})</span>
                    <img src="img/icono/CDC.png" width="23" style="vertical-align: middle; margin-left: 5px; margin-right: 8px;">
                    Centros de Desarrollo Comunitario
                `;

                itemCapa.appendChild(checkbox);
                itemCapa.appendChild(label);
                listaCapasInfraestructura.appendChild(itemCapa);
                checkboxesInfraestructura.push(checkbox);
                checkboxesInfraestructura.push(checkbox);
            }
        });
    });



    // Capa: Módulos Deportivos
const urlCSVModulos = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTB17wAqRP0vSPM2x68YQBluo4oaYYtMLydDev0yDpqV65Gsx5brSHRTs7aX9rixw/pub?output=csv";

// Icono único para Módulos Deportivos
const iconoModulos = L.icon({ iconUrl: "img/icono/modulos.png", iconSize: [20, 30], iconAnchor: [25, 20], popupAnchor: [10, -20] });

// 🧮 Conteo por estado
const conteoEstados = {
  "Módulos Deportivos": { Bueno: 0, Regular: 0, Malo: 0 }
};

// 🗂️ Agrupación por estado
const gruposPorEstado2 = {
  "Bueno": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Regular": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Malo": L.layerGroup([], { pane: 'capasPuntosPane' })
};

fetch(urlCSVModulos)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        const data = results.data.slice(1);

        data.forEach(columnas => {
          const nombre = columnas[1]?.trim();
          const tipo = columnas[2]?.trim();
          const direccion = columnas[3]?.trim();
          const lat = parseFloat(columnas[4]);
          const lng = parseFloat(columnas[5]);
          const linkGoogle = columnas[6]?.trim();
          const contacto = columnas[7]?.trim();
          const actGratis = columnas[8]?.trim();
          const actCosto = columnas[9]?.trim();
          const talleres = columnas[10]?.trim();
          const horarios = columnas[11]?.trim();
          const edades = columnas[12]?.trim();
          const observaciones = columnas[13]?.trim();
          const linkFoto = columnas[14]?.trim();
          const estado = columnas[15]?.trim() || "Regular";

          if (!isNaN(lat) && !isNaN(lng)) {
            conteoEstados["Módulos Deportivos"][estado]++;
            const icono = iconoModulos;

            let popup = `<b>${nombre}</b><br>`;
            if (tipo) popup += `<b>Tipo:</b> ${tipo}<br>`;
            if (direccion) popup += `<b>Dirección:</b> ${direccion}<br>`;
            if (linkGoogle) {
              const urlSegura = encodeURI(linkGoogle.replace(/^"+|"+$/g, "").trim());
              popup += `<b>Ubicación:</b> <a href="${urlSegura}" target="_blank">Abrir en Google Maps</a><br>`;
            }
            if (contacto) popup += `<b>Contacto:</b> ${contacto}<br>`;
            if (actGratis) popup += `<b>Actividades Gratuitas:</b> ${actGratis}<br>`;
            if (actCosto) popup += `<b>Actividades con Costo:</b> ${actCosto}<br>`;
            if (talleres) popup += `<b>Talleres Eventuales:</b> ${talleres}<br>`;
            if (horarios) popup += `<b>Días y Horarios:</b> ${horarios}<br>`;
            if (edades) popup += `<b>Edades:</b> ${edades}<br>`;
            if (observaciones) popup += `<b>Observaciones:</b> ${observaciones}<br>`;
            if (linkFoto) popup += `<b>Foto:</b> <a href="${linkFoto}" target="_blank">Ver imagen</a><br>`;

            const marker = L.marker([lat, lng], {
              icon: icono,
              pane: 'capasPuntosPane'
            }).bindPopup(popup);

            gruposPorEstado2[estado].addLayer(marker);

            if (typeof registrarElementoBuscable === "function") {
              registrarElementoBuscable({
                nombre: nombre,
                capa: "Módulos Deportivos",
                marker: marker
              });
            }
          }
        });

        // 🧩 Panel lateral simplificado
        const grupoCompletoMD = L.layerGroup([], { pane: 'capasPuntosPane' });
        ["Bueno", "Regular", "Malo"].forEach(estado => {
            gruposPorEstado2[estado].eachLayer(layer => grupoCompletoMD.addLayer(layer));
        });

        const totalMD = conteoEstados["Módulos Deportivos"].Bueno + 
                        conteoEstados["Módulos Deportivos"].Regular + 
                        conteoEstados["Módulos Deportivos"].Malo;

        // Registrar en el contador global
        window.contadorInfraestructuras.desglose["Módulos Deportivos"] = totalMD;
        window.contadorInfraestructuras.total += totalMD;
        if (typeof window.actualizarContadorInfraestructuras === 'function') {
            window.actualizarContadorInfraestructuras();
        }

        const itemCapa = document.createElement("li");
        itemCapa.style.marginBottom = "10px";
        itemCapa.style.fontSize = "13px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = false;
        checkbox.id = "checkboxMD";

        checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
                grupoCompletoMD.addTo(map);
            } else {
                map.removeLayer(grupoCompletoMD);
            }
        });

        const label = document.createElement("label");
        label.htmlFor = "checkboxMD";
        label.style.marginLeft = "6px";
        label.style.cursor = "pointer";
        label.innerHTML = `
          <span style="color: #555;">(${totalMD})</span>
          <img src="img/icono/modulos.png" width="20" style="vertical-align: middle; margin-left: 5px; margin-right: 8px;">
          Módulos Deportivos
        `;

        itemCapa.appendChild(checkbox);
        itemCapa.appendChild(label);
        listaCapasInfraestructura.appendChild(itemCapa);
        checkboxesInfraestructura.push(checkbox);
      }
    });
  })
  .catch(error => console.error("Error al cargar Módulos Deportivos:", error));



//Centro de Atención y Ciudados Infantiles
const urlCSVCACI = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPKQMLclLqV4Lw_2bNoO9SMSBjTQk7UjCvVlGnNdJadNlzMU7L1gal5oMzpkHYeQ/pub?output=csv";

// Icono único para CACI
const iconoCACI = L.icon({ iconUrl: "img/icono/CACI.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] });

// 🔢 Conteo por estado
const conteoEstadosCACI = {
  "CACI": { Bueno: 0, Regular: 0, Malo: 0 }
};

// 📦 Grupos de capa por estado
const gruposPorEstadoCACI = {
  "Bueno": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Regular": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Malo": L.layerGroup([], { pane: 'capasPuntosPane' })
};

fetch(urlCSVCACI)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        const data = results.data.slice(1);

        data.forEach(columnas => {
          const name = columnas[1]?.trim();
          const clave = columnas[2]?.trim();
          const tipo = columnas[3]?.trim();
          const direc = columnas[4]?.trim();
          const poblacion = columnas[5]?.trim();
          const lat = parseFloat(columnas[6]);
          const lng = parseFloat(columnas[7]);
          const linkGoogle = columnas[8]?.trim();
          const contacto = columnas[9]?.trim();
          const actGratis = columnas[10]?.trim();
          const actCosto = columnas[11]?.trim();
          const observaciones = columnas[12]?.trim();
          const linkFoto = columnas[13]?.trim();
          const estado = columnas[14]?.trim() || "Regular";

          if (!isNaN(lat) && !isNaN(lng)) {
            conteoEstadosCACI["CACI"][estado]++;
            const icono = iconoCACI;

            let popup = `<b>${name}</b><br>`;
            if (clave) popup += `<b>Clave:</b> ${clave}<br>`;
            if (tipo) popup += `<b>Tipo:</b> ${tipo}<br>`;
            if (direc) popup += `<b>Dirección:</b> ${direc}<br>`;
            if (poblacion) popup += `<b>Población Objetivo:</b> ${poblacion}<br>`;
            if (linkGoogle) {
              const urlSegura = encodeURI(linkGoogle.replace(/^"+|"+$/g, "").trim());
              popup += `<b>Ubicación:</b> <a href="${urlSegura}" target="_blank">Abrir en Google Maps</a><br>`;
            }
            if (contacto) popup += `<b>Contacto:</b> ${contacto}<br>`;
            if (actGratis) popup += `<b>Actividades Gratuitas:</b> ${actGratis}<br>`;
            if (actCosto) popup += `<b>Actividades con Costo:</b> ${actCosto}<br>`;
            if (observaciones) popup += `<b>Observaciones:</b> ${observaciones}<br>`;
            if (linkFoto) {
              const urlFoto = linkFoto.replace(/^"+|"+$/g, "").trim();
              popup += `<b>Foto:</b> <a href="${urlFoto}" target="_blank">Ver imagen</a><br>`;
            }

            const marker = L.marker([lat, lng], {
              icon: icono,
              pane: 'capasPuntosPane'
            }).bindPopup(popup);

            gruposPorEstadoCACI[estado].addLayer(marker);

            if (typeof registrarElementoBuscable === "function") {
              registrarElementoBuscable({
                nombre: name,
                capa: "CACI",
                marker: marker
              });
            }
          }
        });

        // 📁 Panel lateral simplificado CACI
        const grupoCompletoCACI = L.layerGroup([], { pane: 'capasPuntosPane' });
        ["Bueno", "Regular", "Malo"].forEach(estado => {
            gruposPorEstadoCACI[estado].eachLayer(layer => grupoCompletoCACI.addLayer(layer));
        });

        const totalCACI = conteoEstadosCACI["CACI"].Bueno + 
                          conteoEstadosCACI["CACI"].Regular + 
                          conteoEstadosCACI["CACI"].Malo;

        // Registrar en el contador global
        window.contadorInfraestructuras.desglose["CACI"] = totalCACI;
        window.contadorInfraestructuras.total += totalCACI;
        if (typeof window.actualizarContadorInfraestructuras === 'function') {
            window.actualizarContadorInfraestructuras();
        }

        const itemCapa = document.createElement("li");
        itemCapa.style.marginBottom = "10px";
        itemCapa.style.fontSize = "13px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = false;
        checkbox.id = "checkboxCACI";

        checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
                grupoCompletoCACI.addTo(map);
            } else {
                map.removeLayer(grupoCompletoCACI);
            }
        });

        const label = document.createElement("label");
        label.htmlFor = "checkboxCACI";
        label.style.marginLeft = "6px";
        label.style.cursor = "pointer";
        label.innerHTML = `
          <span style="color: #555;">(${totalCACI})</span>
          <img src="img/icono/CACI.png" width="25" style="vertical-align: middle; margin-left: 5px; margin-right: 8px;">
          Centros de Atención y Cuidados Infantiles (CACI)
        `;

        itemCapa.appendChild(checkbox);
        itemCapa.appendChild(label);
        listaCapasInfraestructura.appendChild(itemCapa);
        checkboxesInfraestructura.push(checkbox);
      }
    });
  })
  .catch(error => console.error("Error al cargar CACI:", error));


//Centros Culturales

const urlCSVCC = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHG661z-t8oJTl_ETTnRc9cKU5AAeCZKl2yUNkwgdFSqXmZzXughhU7ImB-dvnkQ/pub?output=csv";

// Icono único para Centros Culturales
const iconoCC = L.icon({ iconUrl: "img/icono/CC.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] });

const conteoEstadosCC = {
  "Centros Culturales": { Bueno: 0, Regular: 0, Malo: 0 }
};

const gruposPorEstadoCC = {
  "Bueno": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Regular": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Malo": L.layerGroup([], { pane: 'capasPuntosPane' })
};

fetch(urlCSVCC)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        const data = results.data.slice(1);

        data.forEach(columnas => {
          const nombre = columnas[1]?.trim();
          const tipo = columnas[2]?.trim();
          const direccion = columnas[3]?.trim();
          const lat = parseFloat(columnas[4]);
          const lng = parseFloat(columnas[5]);
          const linkGoogle = columnas[6]?.trim();
          const contacto = columnas[7]?.trim();
          const actGratis = columnas[8]?.trim();
          const actCosto = columnas[9]?.trim();
          const observaciones = columnas[10]?.trim();
          const linkFoto = columnas[11]?.trim();
          const estado = columnas[12]?.trim() || "Regular";

          if (!isNaN(lat) && !isNaN(lng)) {
            conteoEstadosCC["Centros Culturales"][estado]++;
            const icono = iconoCC;

            let popup = `<b>${nombre}</b><br>`;
            if (tipo) popup += `<b>Tipo:</b> ${tipo}<br>`;
            if (direccion) popup += `<b>Dirección:</b> ${direccion}<br>`;
            if (linkGoogle) {
              const urlSegura = encodeURI(linkGoogle.replace(/^"+|"+$/g, "").trim());
              popup += `<b>Ubicación:</b> <a href="${urlSegura}" target="_blank">Abrir en Google Maps</a><br>`;
            }
            if (contacto) popup += `<b>Contacto:</b> ${contacto}<br>`;
            if (actGratis) popup += `<b>Actividades Gratuitas:</b> ${actGratis}<br>`;
            if (actCosto) popup += `<b>Actividades con Costo:</b> ${actCosto}<br>`;
            if (observaciones) popup += `<b>Observaciones:</b> ${observaciones}<br>`;
            if (linkFoto) {
            const enlaceFoto = linkFoto.replace(/^"+|"+$/g, "").trim();
            popup += `<b>Foto:</b> <a href="${enlaceFoto}" target="_blank" rel="noopener noreferrer">Ver imagen</a><br>`;
            } else {
            popup += `<em>Sin imagen disponible</em><br>`;
            }

            const marker = L.marker([lat, lng], {
              icon: icono,
              pane: 'capasPuntosPane'
            }).bindPopup(popup);

            gruposPorEstadoCC[estado].addLayer(marker);

            if (typeof registrarElementoBuscable === "function") {
              registrarElementoBuscable({
                nombre: nombre,
                capa: "Centros Culturales",
                marker: marker
              });
            }
          }
        });

        // 🎛️ Panel lateral simplificado
        const grupoCompletoCC = L.layerGroup([], { pane: 'capasPuntosPane' });
        ["Bueno", "Regular", "Malo"].forEach(estado => {
            gruposPorEstadoCC[estado].eachLayer(layer => grupoCompletoCC.addLayer(layer));
        });

        const totalCC = conteoEstadosCC["Centros Culturales"].Bueno + 
                        conteoEstadosCC["Centros Culturales"].Regular + 
                        conteoEstadosCC["Centros Culturales"].Malo;

        // Registrar en el contador global
        window.contadorInfraestructuras.desglose["Centros Culturales"] = totalCC;
        window.contadorInfraestructuras.total += totalCC;
        if (typeof window.actualizarContadorInfraestructuras === 'function') {
            window.actualizarContadorInfraestructuras();
        }

        const itemCapa = document.createElement("li");
        itemCapa.style.marginBottom = "10px";
        itemCapa.style.fontSize = "13px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = false;
        checkbox.id = "checkboxCC";

        checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
                grupoCompletoCC.addTo(map);
            } else {
                map.removeLayer(grupoCompletoCC);
            }
        });

        const label = document.createElement("label");
        label.htmlFor = "checkboxCC";
        label.style.marginLeft = "6px";
        label.style.cursor = "pointer";
        label.innerHTML = `
          <span style="color: #555;">(${totalCC})</span>
          <img src="img/icono/CC.png" width="25" style="vertical-align: middle; margin-left: 5px; margin-right: 8px;">
          Centros Culturales
        `;

        itemCapa.appendChild(checkbox);
        itemCapa.appendChild(label);
        listaCapasInfraestructura.appendChild(itemCapa);
        checkboxesInfraestructura.push(checkbox);
      }
    });
  })
  .catch(error => console.error("Error al cargar Centros Culturales:", error));


//Centros Interactivos
const urlCSV_CI = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSESYWPbYWjhESKJclNKWd0gqEKw5PdFlHaY0NpDzg11inxf27cR_Y2jTiAS_6_2Q/pub?output=csv";

// Icono único para Centros Interactivos
const iconoCI = L.icon({ iconUrl: "img/icono/CI.png", iconSize: [20, 20], iconAnchor: [15, 20], popupAnchor: [0, -20] });

const conteoEstadosCI = {
  "Centros Interactivos": { Bueno: 0, Regular: 0, Malo: 0 }
};

const gruposPorEstadoCI = {
  "Bueno": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Regular": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Malo": L.layerGroup([], { pane: 'capasPuntosPane' })
};

fetch(urlCSV_CI)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        const data = results.data.slice(1);

        data.forEach(columnas => {
          const nombre = columnas[1]?.trim();
          const tipo = columnas[2]?.trim();
          const direccion = columnas[3]?.trim();
          const lat = parseFloat(columnas[4]);
          const lng = parseFloat(columnas[5]);
          const linkGoogle = columnas[6]?.trim();
          const contacto = columnas[7]?.trim();
          const actGratis = columnas[8]?.trim();
          const actCosto = columnas[9]?.trim();
          const observaciones = columnas[10]?.trim();
          const linkFoto = columnas[11]?.trim();
          const estado = columnas[12]?.trim() || "Regular";

          if (!isNaN(lat) && !isNaN(lng)) {
            conteoEstadosCI["Centros Interactivos"][estado]++;
            const icono = iconoCI;

            let popup = `<b>${nombre}</b><br>`;
            if (tipo) popup += `<b>Tipo:</b> ${tipo}<br>`;
            if (direccion) popup += `<b>Dirección:</b> ${direccion}<br>`;
            if (linkGoogle) {
              const urlSegura = encodeURI(linkGoogle.replace(/^"+|"+$/g, "").trim());
              popup += `<b>Ubicación:</b> <a href="${urlSegura}" target="_blank">Abrir en Google Maps</a><br>`;
            }
            if (contacto) popup += `<b>Contacto:</b> ${contacto}<br>`;
            if (actGratis) popup += `<b>Actividades Gratuitas:</b> ${actGratis}<br>`;
            if (actCosto) popup += `<b>Actividades con Costo:</b> ${actCosto}<br>`;
            if (observaciones) popup += `<b>Observaciones:</b> ${observaciones}<br>`;
            if (linkFoto) {
            const enlaceFoto = linkFoto.replace(/^"+|"+$/g, "").trim();
             popup += `<b>Foto:</b> <a href="${enlaceFoto}" target="_blank" rel="noopener noreferrer">Ver imagen</a><br>`;
            } else {
             popup += `<em>Sin imagen disponible</em><br>`;
            }

            const marker = L.marker([lat, lng], {
              icon: icono,
              pane: 'capasPuntosPane'
            }).bindPopup(popup);

            gruposPorEstadoCI[estado].addLayer(marker);

            if (typeof registrarElementoBuscable === "function") {
              registrarElementoBuscable({
                nombre: nombre,
                capa: "Centros Interactivos",
                marker: marker
              });
            }
          }
        });

        // 🎛️ Panel lateral simplificado
        const grupoCompletoCI = L.layerGroup([], { pane: 'capasPuntosPane' });
        ["Bueno", "Regular", "Malo"].forEach(estado => {
            gruposPorEstadoCI[estado].eachLayer(layer => grupoCompletoCI.addLayer(layer));
        });

        const totalCI = conteoEstadosCI["Centros Interactivos"].Bueno + 
                        conteoEstadosCI["Centros Interactivos"].Regular + 
                        conteoEstadosCI["Centros Interactivos"].Malo;

        // Registrar en el contador global
        window.contadorInfraestructuras.desglose["Centros Interactivos"] = totalCI;
        window.contadorInfraestructuras.total += totalCI;
        if (typeof window.actualizarContadorInfraestructuras === 'function') {
            window.actualizarContadorInfraestructuras();
        }

        const itemCapa = document.createElement("li");
        itemCapa.style.marginBottom = "10px";
        itemCapa.style.fontSize = "13px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = false;
        checkbox.id = "checkboxCI";

        checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
                grupoCompletoCI.addTo(map);
            } else {
                map.removeLayer(grupoCompletoCI);
            }
        });

        const label = document.createElement("label");
        label.htmlFor = "checkboxCI";
        label.style.marginLeft = "6px";
        label.style.cursor = "pointer";
        label.innerHTML = `
          <span style="color: #555;">(${totalCI})</span>
          <img src="img/icono/CI.png" width="20" style="vertical-align: middle; margin-left: 5px; margin-right: 8px;">
          Centros Interactivos
        `;

        itemCapa.appendChild(checkbox);
        itemCapa.appendChild(label);
        listaCapasInfraestructura.appendChild(itemCapa);
        checkboxesInfraestructura.push(checkbox);
      }
    });
  })
  .catch(error => console.error("Error al cargar Centros Interactivos:", error));


//Casas del Adulto Mayor
const urlCSV_CAM = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5IFXp46_S-RTabO95mZuiiJTWToudyW71SCZIeu1GGfwcsNEJ04OEU2DMc8Jw5Q/pub?output=csv";

// Icono único para Casas del Adulto Mayor
const iconoCAM = L.icon({ iconUrl: "img/icono/CAM.png", iconSize: [30, 30], iconAnchor: [15, 20], popupAnchor: [0, -20] });

const conteoEstadosCAM = {
  "Casas del Adulto Mayor": { Bueno: 0, Regular: 0, Malo: 0 }
};

const gruposPorEstadoCAM = {
  "Bueno": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Regular": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Malo": L.layerGroup([], { pane: 'capasPuntosPane' })
};

fetch(urlCSV_CAM)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        const data = results.data.slice(1);

        data.forEach(columnas => {
          const nombre = columnas[1]?.trim();
          const tipo = columnas[2]?.trim();
          const direccion = columnas[3]?.trim();
          const lat = parseFloat(columnas[4]);
          const lng = parseFloat(columnas[5]);
          const linkGoogle = columnas[6]?.trim();
          const contacto = columnas[7]?.trim();
          const actGratis = columnas[8]?.trim();
          const actCosto = columnas[9]?.trim();
          const observaciones = columnas[10]?.trim();
          const linkFoto = columnas[11]?.trim();
          const estado = columnas[12]?.trim() || "Regular";

          if (!isNaN(lat) && !isNaN(lng)) {
            conteoEstadosCAM["Casas del Adulto Mayor"][estado]++;
            const icono = iconoCAM;

            let popup = `<b>${nombre}</b><br>`;
            if (tipo) popup += `<b>Tipo:</b> ${tipo}<br>`;
            if (direccion) popup += `<b>Dirección:</b> ${direccion}<br>`;
            if (linkGoogle) {
              const urlSegura = encodeURI(linkGoogle.replace(/^"+|"+$/g, "").trim());
              popup += `<b>Ubicación:</b> <a href="${urlSegura}" target="_blank">Abrir en Google Maps</a><br>`;
            }
            if (contacto) popup += `<b>Contacto:</b> ${contacto}<br>`;
            if (actGratis) popup += `<b>Actividades Gratuitas:</b> ${actGratis}<br>`;
            if (actCosto) popup += `<b>Actividades con Costo:</b> ${actCosto}<br>`;
            if (observaciones) popup += `<b>Observaciones:</b> ${observaciones}<br>`;
            if (linkFoto) {
            const enlaceFoto = linkFoto.replace(/^"+|"+$/g, "").trim();
            popup += `<b>Foto:</b> <a href="${enlaceFoto}" target="_blank" rel="noopener noreferrer">Ver imagen</a><br>`;
            } else {
            popup += `<em>Sin imagen disponible</em><br>`;
            }

            const marker = L.marker([lat, lng], {
              icon: icono,
              pane: 'capasPuntosPane'
            }).bindPopup(popup);

            gruposPorEstadoCAM[estado].addLayer(marker);

            if (typeof registrarElementoBuscable === "function") {
              registrarElementoBuscable({
                nombre: nombre,
                capa: "Casas del Adulto Mayor",
                marker: marker
              });
            }
          }
        });

        // 🎛️ Panel lateral simplificado
        const grupoCompletoCAM = L.layerGroup([], { pane: 'capasPuntosPane' });
        ["Bueno", "Regular", "Malo"].forEach(estado => {
            gruposPorEstadoCAM[estado].eachLayer(layer => grupoCompletoCAM.addLayer(layer));
        });

        const totalCAM = conteoEstadosCAM["Casas del Adulto Mayor"].Bueno + 
                         conteoEstadosCAM["Casas del Adulto Mayor"].Regular + 
                         conteoEstadosCAM["Casas del Adulto Mayor"].Malo;

        // Registrar en el contador global
        window.contadorInfraestructuras.desglose["Casas del Adulto Mayor"] = totalCAM;
        window.contadorInfraestructuras.total += totalCAM;
        if (typeof window.actualizarContadorInfraestructuras === 'function') {
            window.actualizarContadorInfraestructuras();
        }

        const itemCapa = document.createElement("li");
        itemCapa.style.marginBottom = "10px";
        itemCapa.style.fontSize = "13px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = false;
        checkbox.id = "checkboxCAM";

        checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
                grupoCompletoCAM.addTo(map);
            } else {
                map.removeLayer(grupoCompletoCAM);
            }
        });

        const label = document.createElement("label");
        label.htmlFor = "checkboxCAM";
        label.style.marginLeft = "6px";
        label.style.cursor = "pointer";
        label.innerHTML = `
          <span style="color: #555;">(${totalCAM})</span>
          <img src="img/icono/CAM.png" width="25" style="vertical-align: middle; margin-left: 5px; margin-right: 8px;">
          Casas del Adulto Mayor
        `;

        itemCapa.appendChild(checkbox);
        itemCapa.appendChild(label);
        listaCapasInfraestructura.appendChild(itemCapa);
        checkboxesInfraestructura.push(checkbox);
      }
    });
  })
  .catch(error => console.error("Error al cargar Casas del Adulto Mayor:", error));

//Centros de Artes y Oficios
const urlCSV_CAO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vROHBchPW4nHQ6PN9Ivf1I0XR6OMvOpSUYLmUV4dxgpQoPDOfh_sCrbiA9csekUmg/pub?output=csv";

// Icono único para Centros de Artes y Oficios
const iconoCAO = L.icon({ iconUrl: "img/icono/CAO.png", iconSize: [20, 20], iconAnchor: [15, 20], popupAnchor: [0, -20] });

const conteoEstadosCAO = {
  "Centros de Artes y Oficios": { Bueno: 0, Regular: 0, Malo: 0 }
};

const gruposPorEstadoCAO = {
  "Bueno": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Regular": L.layerGroup([], { pane: 'capasPuntosPane' }),
  "Malo": L.layerGroup([], { pane: 'capasPuntosPane' })
};

fetch(urlCSV_CAO)
  .then(response => response.text())
  .then(csvText => {
    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: function (results) {
        const data = results.data.slice(1);

        data.forEach(columnas => {
          const nombre = columnas[1]?.trim();
          const tipo = columnas[2]?.trim();
          const direccion = columnas[3]?.trim();
          const lat = parseFloat(columnas[4]);
          const lng = parseFloat(columnas[5]);
          const linkGoogle = columnas[6]?.trim();
          const contacto = columnas[7]?.trim();
          const actGratis = columnas[8]?.trim();
          const actCosto = columnas[9]?.trim();
          const observaciones = columnas[10]?.trim();
          const linkFoto = columnas[11]?.trim();
          const estado = columnas[12]?.trim() || "Regular";

          if (!isNaN(lat) && !isNaN(lng)) {
            conteoEstadosCAO["Centros de Artes y Oficios"][estado]++;
            const icono = iconoCAO;

            let popup = `<b>${nombre}</b><br>`;
            if (tipo) popup += `<b>Tipo:</b> ${tipo}<br>`;
            if (direccion) popup += `<b>Dirección:</b> ${direccion}<br>`;
            if (linkGoogle) {
              const urlSegura = encodeURI(linkGoogle.replace(/^"+|"+$/g, "").trim());
              popup += `<b>Ubicación:</b> <a href="${urlSegura}" target="_blank">Abrir en Google Maps</a><br>`;
            }
            if (contacto) popup += `<b>Contacto:</b> ${contacto}<br>`;
            if (actGratis) popup += `<b>Actividades Gratuitas:</b> ${actGratis}<br>`;
            if (actCosto) popup += `<b>Actividades con Costo:</b> ${actCosto}<br>`;
            if (observaciones) popup += `<b>Observaciones:</b> ${observaciones}<br>`;
            if (linkFoto) {
             const enlaceFoto = linkFoto.replace(/^"+|"+$/g, "").trim();
                 popup += `<b>Foto:</b> <a href="${enlaceFoto}" target="_blank" rel="noopener noreferrer">Ver imagen</a><br>`;
                    } else {
                 popup += `<em>Sin imagen disponible</em><br>`;
                    }

            const marker = L.marker([lat, lng], {
              icon: icono,
              pane: 'capasPuntosPane'
            }).bindPopup(popup);

            gruposPorEstadoCAO[estado].addLayer(marker);

            if (typeof registrarElementoBuscable === "function") {
              registrarElementoBuscable({
                nombre: nombre,
                capa: "Centros de Artes y Oficios",
                marker: marker
              });
            }
          }
        });

        // 🎛️ Panel lateral simplificado
        const grupoCompletoCAO = L.layerGroup([], { pane: 'capasPuntosPane' });
        ["Bueno", "Regular", "Malo"].forEach(estado => {
            gruposPorEstadoCAO[estado].eachLayer(layer => grupoCompletoCAO.addLayer(layer));
        });

        const totalCAO = conteoEstadosCAO["Centros de Artes y Oficios"].Bueno + 
                         conteoEstadosCAO["Centros de Artes y Oficios"].Regular + 
                         conteoEstadosCAO["Centros de Artes y Oficios"].Malo;

        // Registrar en el contador global
        window.contadorInfraestructuras.desglose["Centros de Artes y Oficios"] = totalCAO;
        window.contadorInfraestructuras.total += totalCAO;
        if (typeof window.actualizarContadorInfraestructuras === 'function') {
            window.actualizarContadorInfraestructuras();
        }

        const itemCapa = document.createElement("li");
        itemCapa.style.marginBottom = "10px";
        itemCapa.style.fontSize = "13px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = false;
        checkbox.id = "checkboxCAO";

        checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
                grupoCompletoCAO.addTo(map);
            } else {
                map.removeLayer(grupoCompletoCAO);
            }
        });

        const label = document.createElement("label");
        label.htmlFor = "checkboxCAO";
        label.style.marginLeft = "6px";
        label.style.cursor = "pointer";
        label.innerHTML = `
          <span style="color: #555;">(${totalCAO})</span>
          <img src="img/icono/CAO.png" width="20" style="vertical-align: middle; margin-left: 5px; margin-right: 8px;">
          Centros de Artes y Oficios
        `;

        itemCapa.appendChild(checkbox);
        itemCapa.appendChild(label);
        listaCapasInfraestructura.appendChild(itemCapa);
        checkboxesInfraestructura.push(checkbox);
      }
    });
  })
  .catch(error => console.error("Error al cargar Centros de Artes y Oficios:", error));

// ============================================================================
// 🏢 GRUPO: EQUIPAMIENTOS URBANOS
// ============================================================================

// 🏗️ Crear grupo principal para Equipamientos Urbanos
const grupoEquipamientos = document.createElement("li");
grupoEquipamientos.style.marginBottom = "15px";
grupoEquipamientos.style.listStyle = "none";
grupoEquipamientos.style.display = "block";
grupoEquipamientos.style.width = "100%";

// Contenedor para la cabecera del grupo (flecha + checkbox + label)
const headerEquipamientos = document.createElement("div");
headerEquipamientos.style.display = "flex";
headerEquipamientos.style.alignItems = "center";
headerEquipamientos.style.marginBottom = "8px";
headerEquipamientos.style.width = "100%";
headerEquipamientos.style.flexWrap = "nowrap";

// Icono desplegable (flecha)
const iconoToggleEquip = document.createElement("span");
iconoToggleEquip.innerHTML = "▶";
iconoToggleEquip.style.cursor = "pointer";
iconoToggleEquip.style.marginRight = "8px";
iconoToggleEquip.style.fontSize = "12px";
iconoToggleEquip.style.transition = "transform 0.3s ease";
iconoToggleEquip.style.display = "inline-block";
iconoToggleEquip.style.width = "15px";
iconoToggleEquip.style.flexShrink = "0";

// Checkbox principal del grupo
const checkboxEquipamientos = document.createElement("input");
checkboxEquipamientos.type = "checkbox";
checkboxEquipamientos.id = "checkboxEquipamientos";
checkboxEquipamientos.style.marginRight = "8px";
checkboxEquipamientos.style.flexShrink = "0";

const labelEquipamientos = document.createElement("label");
labelEquipamientos.htmlFor = "checkboxEquipamientos";
labelEquipamientos.style.fontWeight = "bold";
labelEquipamientos.style.cursor = "pointer";
labelEquipamientos.style.fontSize = "14px";
labelEquipamientos.style.flex = "1";
labelEquipamientos.textContent = "Equipamientos Urbanos";

// Contenedor de capas hijas (sublista)
const listaCapasEquipamientos = document.createElement("ul");
listaCapasEquipamientos.className = "lista-capas-equipamientos";
listaCapasEquipamientos.style.marginLeft = "25px";
listaCapasEquipamientos.style.marginTop = "5px";
listaCapasEquipamientos.style.display = "none";
listaCapasEquipamientos.style.listStyle = "none";
listaCapasEquipamientos.style.paddingLeft = "0";
listaCapasEquipamientos.style.width = "100%";

// Variable para controlar el estado desplegado
let isExpandedEquip = false;

// Función para toggle del grupo
iconoToggleEquip.addEventListener("click", function() {
    isExpandedEquip = !isExpandedEquip;
    listaCapasEquipamientos.style.display = isExpandedEquip ? "block" : "none";
    iconoToggleEquip.style.transform = isExpandedEquip ? "rotate(90deg)" : "rotate(0deg)";
});

labelEquipamientos.addEventListener("click", function(e) {
    if (e.target === labelEquipamientos) {
        iconoToggleEquip.click();
    }
});

// Ensamblar la cabecera
headerEquipamientos.appendChild(iconoToggleEquip);
headerEquipamientos.appendChild(checkboxEquipamientos);
headerEquipamientos.appendChild(labelEquipamientos);

grupoEquipamientos.appendChild(headerEquipamientos);
grupoEquipamientos.appendChild(listaCapasEquipamientos);
listaCapas.appendChild(grupoEquipamientos);

// Array para almacenar checkboxes de equipamientos
const checkboxesEquipamientos = [];

// Función para manejar el checkbox principal
checkboxEquipamientos.addEventListener("change", function() {
    if (this.checked && !isExpandedEquip) {
        iconoToggleEquip.click();
    }
    checkboxesEquipamientos.forEach(cb => {
        if (cb.checked !== this.checked) {
            cb.click();
        }
    });
});

// ============================================================================
// 🏥 CAPA: HOSPITALES
// ============================================================================
fetch("archivos/vectores/hospitales.geojson")
  .then(response => response.json())
  .then(data => {
    const iconoHospital = L.divIcon({
      html: '<div style="font-size: 28px; line-height: 1;">🏥</div>',
      className: 'emoji-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });

    const grupoHospitales = L.layerGroup([], { pane: 'capasPuntosPane' });

    data.features.forEach(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      let popup = `<b>${props.nom_estab || 'Hospital'}</b><br>`;
      if (props.raz_social) popup += `<b>Razón Social:</b> ${props.raz_social}<br>`;
      if (props.nom_vial) popup += `<b>Vialidad:</b> ${props.nom_vial}<br>`;
      if (props.cod_postal) popup += `<b>C.P.:</b> ${props.cod_postal}<br>`;

      const marker = L.marker([coords[1], coords[0]], {
        icon: iconoHospital,
        pane: 'capasPuntosPane'
      }).bindPopup(popup);

      grupoHospitales.addLayer(marker);

      if (typeof registrarElementoBuscable === "function") {
        registrarElementoBuscable({
          nombre: props.nom_estab || 'Hospital',
          capa: "Hospitales",
          marker: marker
        });
      }
    });

    // Agregar al panel
    const itemCapa = document.createElement("li");
    itemCapa.style.marginBottom = "10px";
    itemCapa.style.fontSize = "13px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;
    checkbox.id = "checkboxHospitales";

    checkbox.addEventListener("change", function() {
      if (checkbox.checked) {
        grupoHospitales.addTo(map);
      } else {
        map.removeLayer(grupoHospitales);
      }
    });

    const label = document.createElement("label");
    label.htmlFor = "checkboxHospitales";
    label.style.marginLeft = "6px";
    label.style.cursor = "pointer";
    label.innerHTML = `
      <span style="color: #555;">(${data.features.length})</span>
      <span style="font-size: 18px; margin-left: 5px; margin-right: 8px;">🏥</span>
      Hospitales
    `;

    itemCapa.appendChild(checkbox);
    itemCapa.appendChild(label);
    listaCapasEquipamientos.appendChild(itemCapa);
    checkboxesEquipamientos.push(checkbox);
  })
  .catch(error => console.error("Error al cargar Hospitales:", error));

// ============================================================================
// 🛒 CAPA: MERCADOS
// ============================================================================
fetch("archivos/vectores/mercados.geojson")
  .then(response => response.json())
  .then(data => {
    const iconoMercado = L.divIcon({
      html: '<div style="font-size: 28px; line-height: 1;">🛒</div>',
      className: 'emoji-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });

    const grupoMercados = L.layerGroup([], { pane: 'capasPuntosPane' });

    data.features.forEach(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      let popup = `<b>${props.Name || 'Mercado'}</b><br>`;
      if (props.descriptio) popup += `${props.descriptio}<br>`;

      const marker = L.marker([coords[1], coords[0]], {
        icon: iconoMercado,
        pane: 'capasPuntosPane'
      }).bindPopup(popup);

      grupoMercados.addLayer(marker);

      if (typeof registrarElementoBuscable === "function") {
        registrarElementoBuscable({
          nombre: props.Name || 'Mercado',
          capa: "Mercados",
          marker: marker
        });
      }
    });

    // Agregar al panel
    const itemCapa = document.createElement("li");
    itemCapa.style.marginBottom = "10px";
    itemCapa.style.fontSize = "13px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;
    checkbox.id = "checkboxMercados";

    checkbox.addEventListener("change", function() {
      if (checkbox.checked) {
        grupoMercados.addTo(map);
      } else {
        map.removeLayer(grupoMercados);
      }
    });

    const label = document.createElement("label");
    label.htmlFor = "checkboxMercados";
    label.style.marginLeft = "6px";
    label.style.cursor = "pointer";
    label.innerHTML = `
      <span style="color: #555;">(${data.features.length})</span>
      <span style="font-size: 18px; margin-left: 5px; margin-right: 8px;">🛒</span>
      Mercados
    `;

    itemCapa.appendChild(checkbox);
    itemCapa.appendChild(label);
    listaCapasEquipamientos.appendChild(itemCapa);
    checkboxesEquipamientos.push(checkbox);
  })
  .catch(error => console.error("Error al cargar Mercados:", error));

// ============================================================================
// 🌳 CAPA: PARQUES
// ============================================================================
fetch("archivos/vectores/parques.geojson")
  .then(response => response.json())
  .then(data => {
    const iconoParque = L.divIcon({
      html: '<div style="font-size: 28px; line-height: 1;">🌳</div>',
      className: 'emoji-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });

    const grupoParques = L.layerGroup([], { pane: 'capasPuntosPane' });

    data.features.forEach(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      let popup = `<b>${props.Name || 'Parque'}</b><br>`;

      const marker = L.marker([coords[1], coords[0]], {
        icon: iconoParque,
        pane: 'capasPuntosPane'
      }).bindPopup(popup);

      grupoParques.addLayer(marker);

      if (typeof registrarElementoBuscable === "function") {
        registrarElementoBuscable({
          nombre: props.Name || 'Parque',
          capa: "Parques",
          marker: marker
        });
      }
    });

    // Agregar al panel
    const itemCapa = document.createElement("li");
    itemCapa.style.marginBottom = "10px";
    itemCapa.style.fontSize = "13px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;
    checkbox.id = "checkboxParques";

    checkbox.addEventListener("change", function() {
      if (checkbox.checked) {
        grupoParques.addTo(map);
      } else {
        map.removeLayer(grupoParques);
      }
    });

    const label = document.createElement("label");
    label.htmlFor = "checkboxParques";
    label.style.marginLeft = "6px";
    label.style.cursor = "pointer";
    label.innerHTML = `
      <span style="color: #555;">(${data.features.length})</span>
      <span style="font-size: 18px; margin-left: 5px; margin-right: 8px;">🌳</span>
      Parques
    `;

    itemCapa.appendChild(checkbox);
    itemCapa.appendChild(label);
    listaCapasEquipamientos.appendChild(itemCapa);
    checkboxesEquipamientos.push(checkbox);
  })
  .catch(error => console.error("Error al cargar Parques:", error));

// ============================================================================
// 🏛️ CAPA: PILARES
// ============================================================================
fetch("archivos/vectores/pilares.geojson")
  .then(response => response.json())
  .then(data => {
    const iconoPilar = L.divIcon({
      html: '<div style="font-size: 28px; line-height: 1;">🏛️</div>',
      className: 'emoji-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });

    const grupoPilares = L.layerGroup([], { pane: 'capasPuntosPane' });

    data.features.forEach(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      let popup = `<b>${props.Name || 'PILAR'}</b><br>`;
      if (props.descriptio) popup += `<b>Dirección:</b> ${props.descriptio}<br>`;

      const marker = L.marker([coords[1], coords[0]], {
        icon: iconoPilar,
        pane: 'capasPuntosPane'
      }).bindPopup(popup);

      grupoPilares.addLayer(marker);

      if (typeof registrarElementoBuscable === "function") {
        registrarElementoBuscable({
          nombre: props.Name || 'PILAR',
          capa: "PILARES",
          marker: marker
        });
      }
    });

    // Agregar al panel
    const itemCapa = document.createElement("li");
    itemCapa.style.marginBottom = "10px";
    itemCapa.style.fontSize = "13px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;
    checkbox.id = "checkboxPilares";

    checkbox.addEventListener("change", function() {
      if (checkbox.checked) {
        grupoPilares.addTo(map);
      } else {
        map.removeLayer(grupoPilares);
      }
    });

    const label = document.createElement("label");
    label.htmlFor = "checkboxPilares";
    label.style.marginLeft = "6px";
    label.style.cursor = "pointer";
    label.innerHTML = `
      <span style="color: #555;">(${data.features.length})</span>
      <span style="font-size: 18px; margin-left: 5px; margin-right: 8px;">🏛️</span>
      PILARES
    `;

    itemCapa.appendChild(checkbox);
    itemCapa.appendChild(label);
    listaCapasEquipamientos.appendChild(itemCapa);
    checkboxesEquipamientos.push(checkbox);
  })
  .catch(error => console.error("Error al cargar PILARES:", error));

// ============================================================================
// 👶 CAPA: PREESCOLAR
// ============================================================================
fetch("archivos/vectores/preescolar.geojson")
  .then(response => response.json())
  .then(data => {
    const iconoPreescolar = L.divIcon({
      html: '<div style="font-size: 26px; line-height: 1;">👶</div>',
      className: 'emoji-icon',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -13]
    });

    const grupoPreescolar = L.layerGroup([], { pane: 'capasPuntosPane' });

    data.features.forEach(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      let popup = `<b>${props.nombre || 'Preescolar'}</b><br>`;
      if (props.domicilio) popup += `<b>Domicilio:</b> ${props.domicilio}<br>`;
      if (props.colonia) popup += `<b>Colonia:</b> ${props.colonia}<br>`;

      const marker = L.marker([coords[1], coords[0]], {
        icon: iconoPreescolar,
        pane: 'capasPuntosPane'
      }).bindPopup(popup);

      grupoPreescolar.addLayer(marker);

      if (typeof registrarElementoBuscable === "function") {
        registrarElementoBuscable({
          nombre: props.nombre || 'Preescolar',
          capa: "Preescolar",
          marker: marker
        });
      }
    });

    // Agregar al panel
    const itemCapa = document.createElement("li");
    itemCapa.style.marginBottom = "10px";
    itemCapa.style.fontSize = "13px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;
    checkbox.id = "checkboxPreescolar";

    checkbox.addEventListener("change", function() {
      if (checkbox.checked) {
        grupoPreescolar.addTo(map);
      } else {
        map.removeLayer(grupoPreescolar);
      }
    });

    const label = document.createElement("label");
    label.htmlFor = "checkboxPreescolar";
    label.style.marginLeft = "6px";
    label.style.cursor = "pointer";
    label.innerHTML = `
      <span style="color: #555;">(${data.features.length})</span>
      <span style="font-size: 18px; margin-left: 5px; margin-right: 8px;">👶</span>
      Preescolar
    `;

    itemCapa.appendChild(checkbox);
    itemCapa.appendChild(label);
    listaCapasEquipamientos.appendChild(itemCapa);
    checkboxesEquipamientos.push(checkbox);
  })
  .catch(error => console.error("Error al cargar Preescolar:", error));

// ============================================================================
// 📚 CAPA: PRIMARIAS
// ============================================================================
fetch("archivos/vectores/primarias.geojson")
  .then(response => response.json())
  .then(data => {
    const iconoPrimaria = L.divIcon({
      html: '<div style="font-size: 26px; line-height: 1;">📚</div>',
      className: 'emoji-icon',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -13]
    });

    const grupoPrimarias = L.layerGroup([], { pane: 'capasPuntosPane' });

    data.features.forEach(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      let popup = `<b>${props.nombre || 'Primaria'}</b><br>`;
      if (props.domicilio) popup += `<b>Domicilio:</b> ${props.domicilio}<br>`;
      if (props.colonia) popup += `<b>Colonia:</b> ${props.colonia}<br>`;

      const marker = L.marker([coords[1], coords[0]], {
        icon: iconoPrimaria,
        pane: 'capasPuntosPane'
      }).bindPopup(popup);

      grupoPrimarias.addLayer(marker);

      if (typeof registrarElementoBuscable === "function") {
        registrarElementoBuscable({
          nombre: props.nombre || 'Primaria',
          capa: "Primarias",
          marker: marker
        });
      }
    });

    // Agregar al panel
    const itemCapa = document.createElement("li");
    itemCapa.style.marginBottom = "10px";
    itemCapa.style.fontSize = "13px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;
    checkbox.id = "checkboxPrimarias";

    checkbox.addEventListener("change", function() {
      if (checkbox.checked) {
        grupoPrimarias.addTo(map);
      } else {
        map.removeLayer(grupoPrimarias);
      }
    });

    const label = document.createElement("label");
    label.htmlFor = "checkboxPrimarias";
    label.style.marginLeft = "6px";
    label.style.cursor = "pointer";
    label.innerHTML = `
      <span style="color: #555;">(${data.features.length})</span>
      <span style="font-size: 18px; margin-left: 5px; margin-right: 8px;">📚</span>
      Primarias
    `;

    itemCapa.appendChild(checkbox);
    itemCapa.appendChild(label);
    listaCapasEquipamientos.appendChild(itemCapa);
    checkboxesEquipamientos.push(checkbox);
  })
  .catch(error => console.error("Error al cargar Primarias:", error));

// ============================================================================
// 🎓 CAPA: SECUNDARIAS
// ============================================================================
fetch("archivos/vectores/secundarias.geojson")
  .then(response => response.json())
  .then(data => {
    const iconoSecundaria = L.divIcon({
      html: '<div style="font-size: 26px; line-height: 1;">🎓</div>',
      className: 'emoji-icon',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -13]
    });

    const grupoSecundarias = L.layerGroup([], { pane: 'capasPuntosPane' });

    data.features.forEach(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      let popup = `<b>${props.nombre || 'Secundaria'}</b><br>`;
      if (props.domicilio) popup += `<b>Domicilio:</b> ${props.domicilio}<br>`;
      if (props.colonia) popup += `<b>Colonia:</b> ${props.colonia}<br>`;

      const marker = L.marker([coords[1], coords[0]], {
        icon: iconoSecundaria,
        pane: 'capasPuntosPane'
      }).bindPopup(popup);

      grupoSecundarias.addLayer(marker);

      if (typeof registrarElementoBuscable === "function") {
        registrarElementoBuscable({
          nombre: props.nombre || 'Secundaria',
          capa: "Secundarias",
          marker: marker
        });
      }
    });

    // Agregar al panel
    const itemCapa = document.createElement("li");
    itemCapa.style.marginBottom = "10px";
    itemCapa.style.fontSize = "13px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;
    checkbox.id = "checkboxSecundarias";

    checkbox.addEventListener("change", function() {
      if (checkbox.checked) {
        grupoSecundarias.addTo(map);
      } else {
        map.removeLayer(grupoSecundarias);
      }
    });

    const label = document.createElement("label");
    label.htmlFor = "checkboxSecundarias";
    label.style.marginLeft = "6px";
    label.style.cursor = "pointer";
    label.innerHTML = `
      <span style="color: #555;">(${data.features.length})</span>
      <span style="font-size: 18px; margin-left: 5px; margin-right: 8px;">🎓</span>
      Secundarias
    `;

    itemCapa.appendChild(checkbox);
    itemCapa.appendChild(label);
    listaCapasEquipamientos.appendChild(itemCapa);
    checkboxesEquipamientos.push(checkbox);
  })
  .catch(error => console.error("Error al cargar Secundarias:", error));

});
