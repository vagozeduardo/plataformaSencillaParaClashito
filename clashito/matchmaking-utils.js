
// matchmaking-utils.js - Lógica de sorteo y emparejamientos
import { obtenerJugadores } from './storage-utils.js';

// Mezcla aleatoria Fisher-Yates
function mezclarArreglo(arreglo) {
    const copia = [...arreglo];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

export function generarEnfrentamientosFase(numFase) {
    const jugadores = obtenerJugadores();
    // Filtrar los 10 activos de la Fase 3
    const elegibles = jugadores.filter(j => j.fase_maxima >= numFase && j.estado !== 'eliminado');

    if (elegibles.length < 2) return [];

    const mezclados = mezclarArreglo(elegibles);
    const parejas = [];

    for (let i = 0; i < mezclados.length; i += 2) {
        if (mezclados[i + 1]) {
            parejas.push({
                mesa: (i / 2) + 1,
                jugador1: mezclados[i],
                jugador2: mezclados[i + 1]
            });
        }
    }

    // Guardar los duelos generados
    localStorage.setItem(`enfrentamientos_f${numFase}_cr`, JSON.stringify(parejas));
    return parejas;
}

export function obtenerEnfrentamientosFase(numFase) {
    return JSON.parse(localStorage.getItem(`enfrentamientos_f${numFase}_cr`)) || [];
}