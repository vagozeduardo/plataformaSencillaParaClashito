// torneo-config.js - ÚNICO lugar donde se definen las fases del torneo de Clash Royale.
//
// Para agregar, quitar o reordenar fases basta con editar el arreglo `fases`.
// El número de fase (F1, F2, ...) se calcula según su posición en el arreglo, y la
// ÚLTIMA fase siempre es la que corona al campeón.
//
// Campos de cada fase:
//   nombre        Texto del título: "Fase N: <nombre>".
//   etiqueta      (opcional) Texto corto de la pestaña: "FN: <etiqueta>". Por defecto usa `nombre`.
//   descripcion   Texto descriptivo bajo el título.
//   nota          (opcional) Texto resaltado en dorado. Si se omite se genera según el tipo.
//   tipo          'liguilla'    -> tabla por victorias, avanzan los `clasifican` mejores.
//                 'eliminacion' -> bracket: avanza el ganador de cada mesa (más victorias en su cruce).
//   registro      'manual' -> victorias con botones +/- en la tabla.
//                 'mesas'  -> además se habilita la página de duelos (sorteo + rondas por mesa).
//   participantes (opcional) Jugadores esperados en la fase (se valida al hacer el sorteo).
//   clasifican    Jugadores que avanzan a la siguiente fase (solo 'liguilla').
//   destacada     (opcional) Pinta la pestaña en dorado.
//   emparejamiento (solo registro 'mesas'):
//       algoritmo   'rotacion'    -> carrusel: todos rotan una posición por ronda.
//                   'round-robin' -> todos contra todos (método del círculo, n-1 rondas).
//                   'plantilla'   -> cruces exactos por ronda usando etiquetas m1A, m1B, m2A...
//                   'eliminacion' -> mismas parejas todas las rondas (serie al mejor de `rondas`).
//       rondas      Número de rondas (en 'plantilla' se toma de `cruces`).
//       cruces      (solo 'plantilla') Arreglo de rondas; cada ronda es una lista de [ladoA, ladoB].
//       etiquetaLado (opcional) Texto de cada lado de la mesa: 'LADO' (defecto) o 'ZONA'.

export const TORNEO_CONFIG = {
    juego: 'Clash Royale',
    fases: [
        {
            nombre: 'Todos vs Todos',
            descripcion: 'Combate general.',
            nota: 'Solo los primeros 15 avanzan a F2.',
            tipo: 'liguilla',
            registro: 'manual',
            clasifican: 15
        },
        {
            nombre: 'X3 Elixir',
            descripcion: 'Locura de elixir.',
            nota: 'Solo los 10 mejores sobreviven y avanzan a F3.',
            tipo: 'liguilla',
            registro: 'manual',
            clasifican: 10
        },
        {
            nombre: 'Modo Dios',
            descripcion: 'Todos contra todos extremo.',
            nota: 'Pasan los 4 con más victorias.',
            tipo: 'liguilla',
            registro: 'mesas',
            participantes: 10,
            clasifican: 4,
            emparejamiento: { algoritmo: 'rotacion', rondas: 5, etiquetaLado: 'ZONA' }
        },
        {
            nombre: 'Semifinal (Mejor de 3)',
            etiqueta: 'Mejor de 3',
            descripcion: 'Enfrentamiento directo entre los 4 mejores.',
            nota: 'Los 2 ganadores van a la final.',
            tipo: 'liguilla',
            registro: 'mesas',
            participantes: 4,
            clasifican: 2,
            emparejamiento: {
                algoritmo: 'plantilla',
                cruces: [
                    [['m1A', 'm1B'], ['m2A', 'm2B']],
                    [['m2A', 'm1A'], ['m2B', 'm1B']],
                    [['m2A', 'm1B'], ['m2B', 'm1A']]
                ]
            }
        },
        {
            nombre: 'Gran Final',
            descripcion: 'El duelo definitivo por la corona galáctica.',
            nota: 'Al mejor de 5.',
            tipo: 'eliminacion',
            registro: 'manual',
            participantes: 2,
            destacada: true
        }
    ]
};

// --- Helpers de lectura (el resto del código solo usa estas funciones) ---

const FASES = TORNEO_CONFIG.fases.map((fase, i) => ({ ...fase, numero: i + 1, clave: `f${i + 1}` }));

export function obtenerFases() {
    return FASES;
}

export function obtenerFase(numero) {
    return FASES[Number(numero) - 1] || null;
}

export function esUltimaFase(numero) {
    return Number(numero) === FASES.length;
}

// Un jugador campeón queda con fase_maxima = número de fases + 1
export const FASE_CAMPEON = FASES.length + 1;

export function tituloFase(fase) {
    return `Fase ${fase.numero}: ${fase.nombre}`;
}

export function etiquetaTab(fase) {
    return `F${fase.numero}: ${(fase.etiqueta || fase.nombre).toUpperCase()}`;
}

export function notaFase(fase) {
    if (fase.nota) return fase.nota;
    if (esUltimaFase(fase.numero)) return 'El ganador se corona campeón del torneo.';
    if (fase.tipo === 'eliminacion') return `Los ganadores de cada mesa avanzan a F${fase.numero + 1}.`;
    return `Solo los primeros ${fase.clasifican} avanzan a F${fase.numero + 1}.`;
}

export function descripcionFaseHTML(fase) {
    return `${fase.descripcion || ''} <span class='text-amber-400 font-bold'>${notaFase(fase)}</span>`;
}
