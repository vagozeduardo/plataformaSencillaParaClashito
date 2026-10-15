// storage-utils.js - Gestión de persitencia y respaldo JSON

export function obtenerJugadores() {
    return JSON.parse(localStorage.getItem('jugadores_cr')) || [];
}

export function guardarJugadores(jugadores) {
    localStorage.setItem('jugadores_cr', JSON.stringify(jugadores));
}

export function inicializarRespaldoJSON(onImportSuccess) {
    const btnExportar = document.getElementById('btn-exportar-json');
    const inputImportar = document.getElementById('input-importar-json');

    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            const jugadoresRaw = localStorage.getItem('jugadores_cr');
            if (!jugadoresRaw || jugadoresRaw === '[]') {
                alert("No hay datos para exportar.");
                return;
            }
            const jugadoresFormateados = JSON.stringify(JSON.parse(jugadoresRaw), null, 2);
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jugadoresFormateados);
            const downloadAnchor = document.createElement('a');
            const fecha = new Date().toISOString().slice(0, 10);
            
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `Torneo_ClashRoyale_${fecha}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        });
    }

    if (inputImportar) {
        inputImportar.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const datosValidados = JSON.parse(event.target.result);
                    if (Array.isArray(datosValidados)) {
                        guardarJugadores(datosValidados);
                        alert("¡Datos del torneo cargados exitosamente!");
                        if (onImportSuccess) onImportSuccess();
                    } else {
                        alert("El archivo JSON no tiene la estructura correcta.");
                    }
                } catch (err) {
                    alert("Error al leer el archivo JSON.");
                }
            };
            reader.readAsText(file);
        });
    }
}