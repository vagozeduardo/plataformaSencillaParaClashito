// storage-utils.js - Gestión de persitencia y respaldo JSON
import { notificar } from '../comun/avisos.js';

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
                notificar("No hay datos para exportar.", { tipo: 'aviso' });
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
                        notificar("Datos del torneo cargados exitosamente.", { tipo: 'exito' });
                        if (onImportSuccess) onImportSuccess();
                    } else {
                        notificar("El archivo JSON no tiene la estructura correcta.", { tipo: 'error' });
                    }
                } catch (err) {
                    notificar("Error al leer el archivo JSON.", { tipo: 'error' });
                }
            };
            reader.readAsText(file);
        });
    }
}