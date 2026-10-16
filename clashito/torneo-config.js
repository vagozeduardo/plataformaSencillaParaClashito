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

// --- Persistencia de la configuración editada desde la interfaz ---

const CLAVE_CONFIG = 'config_fases_cr';
export const ALGORITMOS_VALIDOS = ['rotacion', 'round-robin', 'plantilla', 'eliminacion'];
const ETIQUETA_LUGAR = /^m\d+[AB]$/;

export function cargarConfig() {
    try {
        const guardada = JSON.parse(localStorage.getItem(CLAVE_CONFIG));
        if (guardada && Array.isArray(guardada.fases) && guardada.fases.length > 0) return guardada;
    } catch (err) { /* sin localStorage o JSON inválido: usar valores por defecto */ }
    return CONFIG_POR_DEFECTO;
}

export function hayConfigPersonalizada() {
    try { return localStorage.getItem(CLAVE_CONFIG) !== null; } catch (err) { return false; }
}

export function guardarConfig(config) {
    localStorage.setItem(CLAVE_CONFIG, JSON.stringify(config));
}

export function restablecerConfig() {
    localStorage.removeItem(CLAVE_CONFIG);
}

const esEnteroDesde = (valor, minimo) => Number.isInteger(valor) && valor >= minimo;

// Devuelve { errores, avisos }. Los errores impiden guardar; los avisos solo se confirman.
export function validarConfig(config) {
    const errores = [];
    const avisos = [];
    const fases = config.fases || [];
    if (fases.length === 0) errores.push('El torneo necesita al menos una fase.');

    fases.forEach((f, i) => {
        const n = `F${i + 1}`;
        const ultima = i === fases.length - 1;
        if (!f.nombre || !f.nombre.trim()) errores.push(`${n}: el nombre es obligatorio.`);
        if (f.participantes !== undefined && !esEnteroDesde(f.participantes, 2)) errores.push(`${n}: "participantes" debe ser un número entero de 2 o más.`);
        if (!ultima && f.tipo === 'liguilla' && !esEnteroDesde(f.clasifican, 1)) errores.push(`${n}: indica cuántos jugadores clasifican (1 o más).`);
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

    return { errores: [...new Set(errores)], avisos };
}

export const TORNEO_CONFIG = cargarConfig();

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

// `totalFases` permite previsualizar notas de una configuración que aún no se guarda
export function notaFase(fase, totalFases = FASES.length) {
    if (fase.nota) return fase.nota;
    if (fase.numero === totalFases) return 'El ganador se corona campeón del torneo.';
    if (fase.tipo === 'eliminacion') return `Los ganadores de cada mesa avanzan a F${fase.numero + 1}.`;
    return `Solo los primeros ${fase.clasifican} avanzan a F${fase.numero + 1}.`;
}

export function descripcionFaseHTML(fase) {
    return `${fase.descripcion || ''} <span class='text-amber-400 font-bold'>${notaFase(fase)}</span>`;
}
