// brawl-config.js - Fases y modos de juego del torneo de Brawl Stars (por equipos).
//
// Se editan desde config-fases.html?juego=bs y se guardan en localStorage ('config_fases_bs').
// Si no hay nada guardado se usa CONFIG_POR_DEFECTO.
//
// Campos de cada fase (además de nombre, etiqueta, descripcion, nota y destacada):
//   tipo          'liguilla'    -> tabla por puntos; pasan los `clasifican` mejores de cada grupo.
//                 'eliminacion' -> cruces de 2 equipos; pasa el de más puntos en su cruce.
//   grupos        (solo liguilla) Número de grupos. 1 = tabla general única.
//   clasifican    Equipos que avanzan POR GRUPO (solo liguilla).
//   participantes (opcional) Equipos esperados en la fase.
//   modos         Lista de ids de `modos` (catálogo de abajo) que se juegan en la fase.
//
// `modos` es el catálogo de modos disponibles; se puede ampliar desde la interfaz
// porque el juego rota sus modos con cada temporada.
import { crearTorneo, esEnteroDesde } from '../comun/fases-core.js';

export const MODOS_POR_DEFECTO = [
    { id: 'atrapagemas', nombre: 'Atrapagemas', icono: 'fa-gem' },
    { id: 'balon-brawl', nombre: 'Balón Brawl', icono: 'fa-futbol' },
    { id: 'caza-estelar', nombre: 'Caza Estelar', icono: 'fa-star' },
    { id: 'atraco', nombre: 'Atraco', icono: 'fa-sack-dollar' },
    { id: 'zona-restringida', nombre: 'Zona Restringida', icono: 'fa-bullseye' },
    { id: 'noqueo', nombre: 'Noqueo', icono: 'fa-skull' },
    { id: 'hockey-brawl', nombre: 'Hockey Brawl', icono: 'fa-hockey-puck' },
    { id: 'basket-brawl', nombre: 'Basket Brawl', icono: 'fa-basketball' },
    { id: 'voley-brawl', nombre: 'Vóley Brawl', icono: 'fa-volleyball' },
    { id: 'supervivencia', nombre: 'Supervivencia', icono: 'fa-skull-crossbones' },
    { id: 'duelos', nombre: 'Duelos', icono: 'fa-user-ninja' }
];

export const CONFIG_POR_DEFECTO = {
    juego: 'Brawl Stars',
    modos: MODOS_POR_DEFECTO,
    fases: [
        {
            nombre: 'Fase de Grupos',
            etiqueta: 'Grupos',
            descripcion: 'Todos contra todos dentro de cada grupo.',
            tipo: 'liguilla',
            grupos: 2,
            clasifican: 2,
            modos: ['balon-brawl', 'atrapagemas']
        },
        {
            nombre: 'Semifinal',
            descripcion: 'Cruces directos entre los mejores de cada grupo.',
            tipo: 'eliminacion',
            participantes: 4,
            modos: ['atrapagemas', 'atraco', 'zona-restringida']
        },
        {
            nombre: 'Gran Final',
            descripcion: 'El duelo definitivo por la corona.',
            tipo: 'eliminacion',
            participantes: 2,
            modos: ['caza-estelar', 'balon-brawl', 'noqueo'],
            destacada: true
        }
    ]
};

// Reglas propias de Brawl: grupos y modos por fase
function validarBrawl(config) {
    const errores = [];
    const avisos = [];
    const fases = config.fases || [];
    const idsModos = new Set((config.modos || []).map(m => m.id));

    if (idsModos.size === 0) errores.push('El catálogo necesita al menos un modo de juego.');
    (config.modos || []).forEach(m => { if (!m.nombre || !m.nombre.trim()) errores.push('Hay un modo de juego sin nombre en el catálogo.'); });

    fases.forEach((f, i) => {
        const n = `F${i + 1}`;
        const grupos = f.grupos ?? 1;
        if (f.tipo === 'liguilla' && !esEnteroDesde(grupos, 1)) errores.push(`${n}: el número de grupos debe ser 1 o más.`);
        if (!f.modos || f.modos.length === 0) errores.push(`${n}: elige al menos un modo de juego.`);
        (f.modos || []).forEach(id => { if (!idsModos.has(id)) errores.push(`${n}: el modo "${id}" ya no existe en el catálogo.`); });

        if (f.tipo === 'liguilla' && f.participantes !== undefined && f.clasifican !== undefined && f.clasifican * grupos >= f.participantes) {
            errores.push(`${n}: clasifican ${f.clasifican * grupos} equipos (${f.clasifican} × ${grupos} grupos) y deben ser menos que los participantes (${f.participantes}).`);
        }

        const siguiente = fases[i + 1];
        if (siguiente && f.tipo === 'liguilla' && f.clasifican && siguiente.participantes && f.clasifican * grupos !== siguiente.participantes) {
            avisos.push(`${n} deja pasar ${f.clasifican * grupos} equipos, pero F${i + 2} espera ${siguiente.participantes}.`);
        }
    });

    return { errores, avisos };
}

export const TORNEO = crearTorneo({ claveConfig: 'config_fases_bs', porDefecto: CONFIG_POR_DEFECTO, validarExtra: validarBrawl });

export const {
    TORNEO_CONFIG, cargarConfig, hayConfigPersonalizada, guardarConfig, restablecerConfig, validarConfig,
    obtenerFases, obtenerFase, esUltimaFase, FASE_CAMPEON, tituloFase, etiquetaTab, notaFase, descripcionFaseHTML
} = TORNEO;

export function obtenerModos() {
    return TORNEO_CONFIG.modos || MODOS_POR_DEFECTO;
}

export function modosDeFase(fase) {
    const catalogo = obtenerModos();
    return (fase.modos || []).map(id => catalogo.find(m => m.id === id)).filter(Boolean);
}
