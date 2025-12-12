document.addEventListener("DOMContentLoaded", function () {
    function verEstadisticas(nombreColonia) {
        fetch("archivos/vectores/colonias_wgs84_geojson_renombrado.geojson")
            .then(response => response.ok ? response.json() : Promise.reject("Error al cargar el archivo GeoJSON"))
            .then(data => {
                let coloniaEncontrada = data.features.find(feature => 
                    feature.properties.NOMBRE.trim().toLowerCase() === nombreColonia.trim().toLowerCase());

                if (!coloniaEncontrada) {
                    alert("No se encontraron estadísticas para la colonia seleccionada.");
                    return;
                }

                let props = coloniaEncontrada.properties;

                // Aplicar Montserrat Medium dinámicamente
                const estadisticasModalLabel = document.getElementById("estadisticasModalLabel");
                const estadisticasInfo = document.getElementById("estadisticasInfo");

                estadisticasModalLabel.style.fontFamily = "Montserrat, sans-serif";
                estadisticasModalLabel.style.fontWeight = "400";
                estadisticasInfo.style.fontFamily = "Montserrat, sans-serif";
                estadisticasInfo.style.fontWeight = "400";

                estadisticasModalLabel.innerText = `Estadísticas de ${nombreColonia}`;

                // Construir la tabla de estadísticas
                let rows = [];
                const estadisticas = [
                    { label: "Población Total", value: props.pob_tot_p },
                    { label: "Población de 0 a 2 años", value: props._0_2_p },
                    { label: "Población de 3 a 5 años", value: props._3_5_p },
                    { label: "Población de 6 a 11 años", value: props._6_11_p },
                    { label: "Población de 12 a 14 años", value: props._12_14_p },
                    { label: "Población de 15 a 64 años", value: props._15_64_p },
                    { label: "Población de 65 años y más", value: props._65mas_p },
                    { label: "Total de Viviendas Habitadas", value: props.viv_hab_p }
                ];

                estadisticas.forEach(stat => {
                    if (stat.value !== undefined && stat.value !== null) {
                        rows.push(`<tr><td><strong>${stat.label}:</strong></td><td>${stat.value}</td></tr>`);
                    }
                });

                estadisticasInfo.innerHTML = `<table class="table table-bordered"><tbody>${rows.join("")}</tbody></table>`;

                // Generar gráfica poblacional
                let chartLabels = [], chartDataMasculino = [], chartDataFemenino = [];
                const gruposEdad = [
                    { label: "Población Total", male: props.xPOBMAS, female: props.xPOBFEM },
                    { label: "Población Económicamente Activa", male: props.xPEA_M, female: props.xPEA_F },
                    { label: "Población 60 años y más", male: props.x_60MAS_M, female: props.x_60MAS_F }
                ];

                gruposEdad.forEach(grupo => {
                    if (grupo.male || grupo.female) {
                        chartLabels.push(grupo.label);
                        chartDataMasculino.push(-(grupo.male ?? 0));
                        chartDataFemenino.push(grupo.female ?? 0);
                    }
                });

                const chartCanvas = document.getElementById("estadisticasChart");
                if (chartLabels.length === 0) {
                    chartCanvas.style.display = "none";
                } else {
                    chartCanvas.style.display = "block";
                    const ctx = chartCanvas.getContext("2d");

                    // Destruir el gráfico anterior si existe
                    if (window.estadisticasChart) {
                        window.estadisticasChart.destroy();
                    }

                    window.estadisticasChart = new Chart(ctx, {
                        type: "bar",
                        data: {
                            labels: chartLabels,
                            datasets: [
                                { label: "Masculino", backgroundColor: "rgba(0, 123, 255, 0.6)", data: chartDataMasculino },
                                { label: "Femenino", backgroundColor: "rgba(255, 99, 132, 0.6)", data: chartDataFemenino }
                            ]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                x: { stacked: true },
                                y: { stacked: true }
                            }
                        }
                    });
                }

                new bootstrap.Modal(document.getElementById("estadisticasModal")).show();
            })
            .catch(error => console.error("Error al cargar estadísticas:", error));
    }

    window.verEstadisticas = verEstadisticas;
});