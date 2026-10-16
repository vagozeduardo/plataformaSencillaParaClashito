// torneo-config.js - Definición de las fases del torneo de Clash Royale.
//
// Las fases se editan desde la página config-fases.html y se guardan en localStorage
// ('config_fases_cr'). Si no hay nada guardado se usa CONFIG_POR_DEFECTO (abajo).
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

import { crearTorneo, esEnteroDesde } from '../comun/fases-core.js';

export const CONFIG_POR_DEFECTO = {
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

// --- Torneo de Clash Royale (núcleo compartido en comun/fases-core.js) ---

export const ALGORITMOS_VALIDOS = ['rotacion', 'round-robin', 'plantilla', 'eliminacion'];
const ETIQUETA_LUGAR = /^m\d+[AB]$/;

// Reglas propias de Clash: jugadores individuales y registro por mesas
function validarClash(config) {
    const errores = [];
    const avisos = [];
    const fases = config.fases || [];

    fases.forEach((f, i) => {
        const n = `F${i + 1}`;
        if (f.clasifican !== undefined && f.participantes !== undefined && f.clasifican >= f.participantes) {
            errores.push(`${n}: los que clasifican (${f.clasifican}) deben ser menos que los participantes (${f.participantes}).`);
        }

        if (f.registro === 'mesas') {
            const conf = f.emparejamiento || {};
            if (!ALGORITMOS_VALIDOS.includes(conf.algoritmo)) errores.push(`${n}: elige un algoritmo de emparejamiento.`);
            if (conf.rondas !== undefined && !esEnteroDesde(conf.rondas, 1)) errores.push(`${n}: las rondas deben ser un número entero de 1 o más.`);
            if (f.participantes !== undefined && f.participantes % 2 !== 0) errores.push(`${n}: una fase por mesas necesita un número par de participantes.`);
            if (conf.algoritmo === 'plantilla') {
                const cruces = conf.cruces || [];
                if (cruces.length === 0) errores.push(`${n}: la plantilla necesita al menos una ronda de cruces.`);
                cruces.flat(2).forEach(etq => {
                    if (!ETIQUETA_LUGAR.test(etq)) errores.push(`${n}: "${etq}" no es una etiqueta válida (usa m1A, m1B, m2A...).`);
                });
                const lugares = new Set(cruces.flat(2)).size;
                if (f.participantes !== undefined && lugares !== f.participantes) {
                    errores.push(`${n}: la plantilla usa ${lugares} lugares (m1A, m1B...) pero la fase tiene ${f.participantes} participantes.`);
                }
            }
        }

        // Coherencia con la fase siguiente
        const siguiente = fases[i + 1];
        if (siguiente && f.tipo === 'liguilla' && f.clasifican && siguiente.participantes && f.clasifican !== siguiente.participantes) {
            avisos.push(`${n} deja pasar ${f.clasifican} jugadores, pero F${i + 2} espera ${siguiente.participantes}.`);
        }
    });

    return { errores, avisos };
}

export const TORNEO = crearTorneo({ claveConfig: 'config_fases_cr', porDefecto: CONFIG_POR_DEFECTO, validarExtra: validarClash });

export const {
    TORNEO_CONFIG, cargarConfig, hayConfigPersonalizada, guardarConfig, restablecerConfig, validarConfig,
    obtenerFases, obtenerFase, esUltimaFase, FASE_CAMPEON, tituloFase, etiquetaTab, notaFase, descripcionFaseHTML
} = TORNEO;
