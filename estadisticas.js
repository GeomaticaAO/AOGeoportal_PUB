function verEstadisticas(nombreColonia, claveUT) {
    console.log("Iniciando verEstadisticas para:", nombreColonia, "con CLAVE UT:", claveUT);
    
    // Función para formatear números con comas
    function formatearNumero(numero) {
        if (numero === null || numero === undefined || numero === 'N/D') return 'N/D';
        return Number(numero).toLocaleString('es-MX');
    }
    
    // Cargar COPACOS en la pestaña correspondiente
    function cargarCOPACOS(claveUT) {
        const copacosInfo = document.getElementById("copacosInfo");
        if (!copacosInfo) {
            console.error("No se encontró el contenedor de COPACOS");
            return;
        }
        
        if (!claveUT || !window.copacoPorClaveUT || !window.copacoPorClaveUT[claveUT]) {
            copacosInfo.innerHTML = `
                <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle"></i> No hay COPACOS registrados para esta colonia.
                </div>`;
            return;
        }
        
        const listaCopacos = window.copacoPorClaveUT[claveUT];
        copacosInfo.innerHTML = `
            <h5 style="margin-bottom: 15px; color: #922B21;">
                <i class="bi bi-people-fill"></i> COPACOS de ${nombreColonia}
            </h5>
            <p class="text-muted">Los Comités de Participación Comunitaria (COPACOS) son organizaciones ciudadanas que representan a los habitantes de cada colonia.</p>
            <div class="list-group" style="margin-top: 20px;">
                ${listaCopacos.map((nombre, index) => `
                    <div class="list-group-item" style="border-left: 4px solid #922B21; margin-bottom: 10px;">
                        <h6 class="mb-1">
                            <i class="bi bi-person-badge"></i> COPACO ${index + 1}
                        </h6>
                        <p class="mb-0" style="font-size: 14px;">${nombre}</p>
                    </div>
                `).join('')}
            </div>
            <div class="alert alert-secondary mt-3" role="alert" style="font-size: 13px;">
                <strong>Total de COPACOS:</strong> ${listaCopacos.length}
            </div>`;
    }
    
    fetch("archivos/vectores/colonias_wgs84_geojson_renombrado.geojson")
            .then(response => response.ok ? response.json() : Promise.reject("Error al cargar el archivo GeoJSON"))
            .then(data => {
                console.log("GeoJSON cargado correctamente");
                
                let coloniaEncontrada = data.features.find(feature => 
                    feature.properties.NOMBRE.trim().toLowerCase() === nombreColonia.trim().toLowerCase());

                if (!coloniaEncontrada) {
                    alert("No se encontraron estadísticas para la colonia seleccionada.");
                    return;
                }

                console.log("Colonia encontrada:", coloniaEncontrada.properties.NOMBRE);
                let props = coloniaEncontrada.properties;

                // Verificar que los elementos existen antes de usarlos
                const estadisticasModalLabel = document.getElementById("estadisticasModalLabel");
                const estadisticasInfo = document.getElementById("estadisticasInfo");

                if (!estadisticasModalLabel || !estadisticasInfo) {
                    console.error("No se encontraron los elementos del modal");
                    alert("Error: No se pudo cargar el modal de estadísticas");
                    return;
                }

                // Aplicar Montserrat Medium dinámicamente
                estadisticasModalLabel.style.fontFamily = "Montserrat, sans-serif";
                estadisticasModalLabel.style.fontWeight = "400";
                estadisticasInfo.style.fontFamily = "Montserrat, sans-serif";
                estadisticasInfo.style.fontWeight = "400";

                estadisticasModalLabel.innerText = `Estadísticas de ${nombreColonia}`;
                console.log("Título del modal actualizado");

                // Construir el contenido del popup
                let contenidoHTML = '';
                
                // Información inicial: Número de manzanas y viviendas habitadas
                contenidoHTML += `
                    <div style="margin-bottom: 15px;">
                        <p style="margin: 5px 0;"><strong>Número de Manzanas:</strong> ${formatearNumero(props.Num_mzas)}</p>
                        <p style="margin: 5px 0;"><strong>Viviendas Habitadas:</strong> ${formatearNumero(props.viv_hab_p)}</p>
                    </div>
                `;
                
                // Tabla de población por rangos de edad y género
                contenidoHTML += `
                    <table class="table table-bordered table-sm">
                        <thead style="background-color: #922B21; color: white;">
                            <tr>
                                <th>Rango de Edad</th>
                                <th>Población Total</th>
                                <th>Hombres</th>
                                <th>Mujeres</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                // Rangos de edad con sus datos
                const rangosEdad = [
                    { 
                        label: "0 a 2 años", 
                        total: props.P_0A2_sum || 0,
                        hombres: props.P_0A2_M_sum || 0,
                        mujeres: props.P_0A2_F_sum || 0
                    },
                    { 
                        label: "3 a 5 años", 
                        total: props.P_3A5_sum || 0,
                        hombres: props.P_3A5_M_sum || 0,
                        mujeres: props.P_3A5_F_sum || 0
                    },
                    { 
                        label: "6 a 11 años", 
                        total: props.P_6A11_sum || 0,
                        hombres: props.P_6A11_M_sum || 0,
                        mujeres: props.P_6A11_F_sum || 0
                    },
                    { 
                        label: "8 a 14 años", 
                        total: props.P_8A14_sum || 0,
                        hombres: props.P_8A14_M_sum || 0,
                        mujeres: props.P_8A14_F_sum || 0
                    },
                    { 
                        label: "12 a 14 años", 
                        total: props.P_12A14_sum || 0,
                        hombres: props.P_12A14_M_sum || 0,
                        mujeres: props.P_12A14_F_sum || 0
                    },
                    { 
                        label: "15 a 17 años", 
                        total: props.P_15A17_sum || 0,
                        hombres: props.P_15A17_M_sum || 0,
                        mujeres: props.P_15A17_F_sum || 0
                    },
                    { 
                        label: "18 a 24 años", 
                        total: props.P_18A24_sum || 0,
                        hombres: props.P_18A24_M_sum || 0,
                        mujeres: props.P_18A24_F_sum || 0
                    },
                    { 
                        label: "60 años y más", 
                        total: props.P_60YMAS_sum || 0,
                        hombres: props.P_60YMAS_M_sum || 0,
                        mujeres: props.P_60YMAS_F_sum || 0
                    }
                ];
                
                // Agregar fila de totales al inicio
                contenidoHTML += `
                    <tr style="background-color: #f8f9fa; font-weight: bold;">
                        <td>TOTAL</td>
                        <td>${formatearNumero(props.POBTOT_sum)}</td>
                        <td>${formatearNumero(props.POBMAS_sum)}</td>
                        <td>${formatearNumero(props.POBFEM_sum)}</td>
                    </tr>
                `;
                
                // Agregar filas de rangos de edad
                rangosEdad.forEach(rango => {
                    contenidoHTML += `
                        <tr>
                            <td>${rango.label}</td>
                            <td>${formatearNumero(rango.total)}</td>
                            <td>${formatearNumero(rango.hombres)}</td>
                            <td>${formatearNumero(rango.mujeres)}</td>
                        </tr>
                    `;
                });
                
                contenidoHTML += `
                        </tbody>
                    </table>
                `;

                console.log("Actualizando contenido HTML del modal");
                estadisticasInfo.innerHTML = contenidoHTML;

                // Crear pirámide poblacional
                const canvasPiramide = document.getElementById("piramidePoblacional");
                if (canvasPiramide && typeof Chart !== "undefined") {
                    const ctx = canvasPiramide.getContext("2d");
                    
                    // Destruir gráfico anterior si existe
                    if (window.piramidePoblacionalChart && typeof window.piramidePoblacionalChart.destroy === "function") {
                        try {
                            window.piramidePoblacionalChart.destroy();
                        } catch (e) {
                            console.warn("Error al destruir gráfico anterior:", e);
                        }
                    }

                    // Preparar datos para la pirámide
                    const etiquetas = rangosEdad.map(r => r.label);
                    const hombres = rangosEdad.map(r => -(r.hombres)); // Negativo para izquierda
                    const mujeres = rangosEdad.map(r => r.mujeres);

                    window.piramidePoblacionalChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: etiquetas,
                            datasets: [
                                {
                                    label: 'Hombres',
                                    data: hombres,
                                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                                    borderColor: 'rgba(54, 162, 235, 1)',
                                    borderWidth: 1,
                                    barThickness: 12
                                },
                                {
                                    label: 'Mujeres',
                                    data: mujeres,
                                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                                    borderColor: 'rgba(255, 99, 132, 1)',
                                    borderWidth: 1,
                                    barThickness: 12
                                }
                            ]
                        },
                        options: {
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: true,
                            aspectRatio: 2,
                            layout: {
                                padding: {
                                    left: 10,
                                    right: 10
                                }
                            },
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Pirámide Poblacional',
                                    font: {
                                        size: 13,
                                        family: 'Montserrat, sans-serif',
                                        weight: '500'
                                    }
                                },
                                legend: {
                                    display: true,
                                    position: 'top'
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            let label = context.dataset.label || '';
                                            if (label) {
                                                label += ': ';
                                            }
                                            label += Math.abs(context.parsed.x).toLocaleString('es-MX');
                                            return label;
                                        }
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    stacked: true,
                                    ticks: {
                                        callback: function(value) {
                                            return Math.abs(value).toLocaleString('es-MX');
                                        }
                                    },
                                    title: {
                                        display: true,
                                        text: 'Población'
                                    }
                                },
                                y: {
                                    stacked: true,
                                    grid: {
                                        display: false
                                    },
                                    ticks: {
                                        autoSkip: false
                                    },
                                    title: {
                                        display: true,
                                        text: 'Rango de Edad'
                                    }
                                }
                            },
                            categoryPercentage: 0.95,
                            barPercentage: 0.98
                        }
                    });
                }

                // Verificar que Bootstrap está disponible y mostrar el modal
                const modalElement = document.getElementById("estadisticasModal");
                if (!modalElement) {
                    console.error("No se encontró el elemento del modal");
                    alert("Error: No se pudo mostrar el modal de estadísticas");
                    return;
                }
                
                if (typeof bootstrap === "undefined") {
                    console.error("Bootstrap no está cargado");
                    alert("Error: Bootstrap no está disponible");
                    return;
                }

                console.log("Mostrando modal de estadísticas");
                const modal = new bootstrap.Modal(modalElement);
                
                // Cargar COPACOS en la pestaña correspondiente
                cargarCOPACOS(claveUT);
                
                // Asegurar que la pestaña de estadísticas esté activa
                const datosTab = document.getElementById('datos-tab');
                if (datosTab) {
                    datosTab.click();
                }
                
                modal.show();
            })
            .catch(error => {
                console.error("Error al cargar estadísticas:", error);
                alert("Error al cargar las estadísticas: " + error);
            });
}