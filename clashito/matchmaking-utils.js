// matchmaking-utils.js - Sorteo, rondas y cruces de mesas para cualquier fase configurada
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

const claveSorteo = (numFase) => `enfrentamientos_f${numFase}_cr`;
const claveCarrusel = (numFase) => `carrusel_f${numFase}_cr`;

// --- SORTEO INICIAL ---

export function obtenerElegibles(fase) {
    return obtenerJugadores().filter(j => j.fase_maxima >= fase.numero && j.estado !== 'eliminado');
}

// Etiquetas que usa una plantilla (m1A, m1B, ...) para saber cuántos jugadores requiere
function etiquetasPlantilla(fase) {
    const cruces = fase.emparejamiento?.cruces || [];
    return new Set(cruces.flat(2));
}

// Devuelve un mensaje de error si no se puede sortear, o null si todo está bien
export function validarSorteo(fase, elegibles) {
    if (elegibles.length < 2) return 'Se necesitan al menos 2 jugadores activos en esta fase para el sorteo.';
    if (elegibles.length % 2 !== 0) return `Hay ${elegibles.length} jugadores activos (número impar). Ajusta la clasificación antes de sortear.`;
    if (fase.emparejamiento?.algoritmo === 'plantilla') {
        const requeridos = etiquetasPlantilla(fase).size;
        if (elegibles.length !== requeridos) return `La plantilla de cruces requiere exactamente ${requeridos} jugadores y hay ${elegibles.length}.`;
    }
    return null;
}

export function generarSorteo(fase) {
    const mezclados = mezclarArreglo(obtenerElegibles(fase));
    const parejas = [];

    for (let i = 0; i + 1 < mezclados.length; i += 2) {
        parejas.push({ mesa: (i / 2) + 1, jugador1: mezclados[i], jugador2: mezclados[i + 1] });
    }

    guardarSorteo(fase.numero, parejas);
    return parejas;
}

export function obtenerSorteo(numFase) {
    return JSON.parse(localStorage.getItem(claveSorteo(numFase))) || [];
}

export function guardarSorteo(numFase, parejas) {
    localStorage.setItem(claveSorteo(numFase), JSON.stringify(parejas));
}

// --- ESTADO DE RONDAS (rondaActual + ganadores por mesa) ---

export function obtenerCarrusel(numFase) {
    let carrusel = JSON.parse(localStorage.getItem(claveCarrusel(numFase)));
    if (!carrusel) {
        if (obtenerSorteo(numFase).length === 0) return null;
        carrusel = { rondaActual: 1, ganadoresPorRonda: {} };
        guardarCarrusel(numFase, carrusel);
    }
    if (!carrusel.ganadoresPorRonda) carrusel.ganadoresPorRonda = {};
    return carrusel;
}

export function guardarCarrusel(numFase, carrusel) {
    localStorage.setItem(claveCarrusel(numFase), JSON.stringify(carrusel));
}

// --- ALGORITMOS DE EMPAREJAMIENTO ---
// Cada algoritmo recibe el sorteo inicial y el número de ronda, y devuelve
// [{ mesa, jugadorA, jugadorB }]. Para agregar uno nuevo basta con registrarlo aquí.

// Orden "en círculo": m1A, m2A, ..., mkA, mkB, ..., m2B, m1B
function ordenCircular(sorteo) {
    return [...sorteo.map(d => d.jugador1), ...sorteo.map(d => d.jugador2).reverse()];
}

// Empareja la posición i con la posición n-1-i
function cruzarExtremos(posiciones) {
    const n = posiciones.length;
    const mesas = [];
    for (let i = 0; i < n / 2; i++) {
        mesas.push({ mesa: i + 1, jugadorA: posiciones[i], jugadorB: posiciones[n - 1 - i] });
    }
    return mesas;
}

const ALGORITMOS = {
    // Carrusel: todas las posiciones rotan un lugar por ronda
    rotacion(sorteo, ronda) {
        const circulo = ordenCircular(sorteo);
        const n = circulo.length;
        return cruzarExtremos(circulo.map((_, i) => circulo[(i + ronda - 1) % n]));
    },

    // Todos contra todos: la posición 0 queda fija y el resto rota (método del círculo)
    'round-robin'(sorteo, ronda) {
        const [fijo, ...resto] = ordenCircular(sorteo);
        const m = resto.length;
        const desplazamiento = (ronda - 1) % m;
        const rotados = resto.map((_, i) => resto[(i - desplazamiento + m) % m]);
        return cruzarExtremos([fijo, ...rotados]);
    },

    // Cruces exactos definidos en la configuración con etiquetas m1A, m1B, ...
    plantilla(sorteo, ronda, conf) {
        const lugares = {};
        sorteo.forEach(d => {
            lugares[`m${d.mesa}A`] = d.jugador1;
            lugares[`m${d.mesa}B`] = d.jugador2;
        });
        const cruces = conf.cruces[ronda - 1] || [];
        return cruces.map(([a, b], i) => ({ mesa: i + 1, jugadorA: lugares[a], jugadorB: lugares[b] }));
    },

    // Bracket: las mismas parejas del sorteo se repiten en cada ronda (serie)
    eliminacion(sorteo) {
        return sorteo.map(d => ({ mesa: d.mesa, jugadorA: d.jugador1, jugadorB: d.jugador2 }));
    }
};

export function totalRondas(fase, sorteo) {
    const conf = fase.emparejamiento || {};
    if (conf.algoritmo === 'plantilla') return conf.cruces.length;
    if (conf.rondas) return conf.rondas;
    const jugadores = sorteo.length * 2;
    if (conf.algoritmo === 'round-robin') return jugadores - 1;
    if (conf.algoritmo === 'rotacion') return jugadores / 2;
    return 1;
}

export function obtenerMesasRonda(fase, sorteo, ronda) {
    const conf = fase.emparejamiento || {};
    const algoritmo = ALGORITMOS[conf.algoritmo] || ALGORITMOS.eliminacion;
    if (sorteo.length === 0) return [];
    return algoritmo(sorteo, ronda, conf);
}
