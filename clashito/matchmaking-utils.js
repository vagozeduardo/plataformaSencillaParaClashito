
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

// --- NUEVA LÓGICA DE CARRUSEL (Agregar al final de matchmaking-utils.js) ---

export function obtenerEstadoCarruselF3() {
    let carrusel = JSON.parse(localStorage.getItem('carrusel_f3_cr'));
    
    if (!carrusel) {
        const duelosIniciales = JSON.parse(localStorage.getItem('enfrentamientos_f3_cr')) || [];
        if (duelosIniciales.length === 0) return null;

        // Construir la estructura inicial: 10 posiciones ordenadas en bucle
        carrusel = {
            rondaActual: 1,
            posiciones: [
                duelosIniciales[0].jugador1, // m1A
                duelosIniciales[1].jugador1, // m2A
                duelosIniciales[2].jugador1, // m3A
                duelosIniciales[3].jugador1, // m4A
                duelosIniciales[4].jugador1, // m5A
                duelosIniciales[4].jugador2, // m5B
                duelosIniciales[3].jugador2, // m4B
                duelosIniciales[2].jugador2, // m3B
                duelosIniciales[1].jugador2, // m2B
                duelosIniciales[0].jugador2  // m1B
            ]
        };
        localStorage.setItem('carrusel_f3_cr', JSON.stringify(carrusel));
    }
    return carrusel;
}

export function obtenerMesasRondaActual() {
    const carrusel = obtenerEstadoCarruselF3();
    if (!carrusel) return [];
    const pos = carrusel.posiciones;
    return [
        { mesa: 1, jugadorA: pos[0], jugadorB: pos[9] },
        { mesa: 2, jugadorA: pos[1], jugadorB: pos[8] },
        { mesa: 3, jugadorA: pos[2], jugadorB: pos[7] },
        { mesa: 4, jugadorA: pos[3], jugadorB: pos[6] },
        { mesa: 5, jugadorA: pos[4], jugadorB: pos[5] }
    ];
}

export function rotarCarruselSiguienteRonda() {
    const carrusel = obtenerEstadoCarruselF3();
    if (!carrusel || carrusel.rondaActual >= 5) return null;

    const pos = carrusel.posiciones;
    // Lógica de rotación física (Desplazar 1 posición)
    const primero = pos.shift();
    pos.push(primero);

    carrusel.rondaActual += 1;
    carrusel.posiciones = pos;

    localStorage.setItem('carrusel_f3_cr', JSON.stringify(carrusel));
    return carrusel;
}