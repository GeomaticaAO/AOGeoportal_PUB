document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("floatingInput");
    const suggestionsBox = document.getElementById("suggestions");

    let elementosBuscables = []; // colonias y marcadores
    let nombresColonias = [];

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
            .slice(0, 8); // Limita el número de sugerencias

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
                    map.setView(item.marker.getLatLng(), 17);
                    item.marker.openPopup();
                }
            };

            suggestionsBox.appendChild(div);
        });

        suggestionsBox.style.display = "block";
    }

    // Esta función puede llamarse desde otras capas al crear nuevos puntos buscables
    window.registrarElementoBuscable = function ({ nombre, capa, marker }) {
        elementosBuscables.push({
            nombre: nombre,
            tipo: "marcador",
            capa: capa,
            marker: marker
        });
    };
});