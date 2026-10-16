// fases-core.js - Lógica común de fases configurables para cualquier juego del torneo.
//
// Cada juego crea su torneo con crearTorneo({ claveConfig, porDefecto, validarExtra }).
// La configuración se guarda en localStorage (claveConfig); si no existe se usa `porDefecto`.
// El número de fase (F1, F2, ...) es la posición en el arreglo y la ÚLTIMA fase corona al campeón.

export const esEnteroDesde = (valor, minimo) => Number.isInteger(valor) && valor >= minimo;

export function crearTorneo({ claveConfig, porDefecto, validarExtra = () => ({ errores: [], avisos: [] }) }) {

    function cargarConfig() {
        try {
            const guardada = JSON.parse(localStorage.getItem(claveConfig));
            if (guardada && Array.isArray(guardada.fases) && guardada.fases.length > 0) return { ...porDefecto, ...guardada };
        } catch (err) { /* sin localStorage o JSON inválido: usar valores por defecto */ }
        return porDefecto;
    }

    function hayConfigPersonalizada() {
        try { return localStorage.getItem(claveConfig) !== null; } catch (err) { return false; }
    }

    function guardarConfig(config) {
        localStorage.setItem(claveConfig, JSON.stringify(config));
    }

    function restablecerConfig() {
        localStorage.removeItem(claveConfig);
    }

    // Reglas comunes + reglas propias del juego. Devuelve { errores, avisos }.
    function validarConfig(config) {
        const errores = [];
        const avisos = [];
        const fases = config.fases || [];
        if (fases.length === 0) errores.push('El torneo necesita al menos una fase.');

        fases.forEach((f, i) => {
            const n = `F${i + 1}`;
            const ultima = i === fases.length - 1;
            if (!f.nombre || !f.nombre.trim()) errores.push(`${n}: el nombre es obligatorio.`);
            if (f.participantes !== undefined && !esEnteroDesde(f.participantes, 2)) errores.push(`${n}: "participantes" debe ser un número entero de 2 o más.`);
            if (!ultima && f.tipo === 'liguilla' && !esEnteroDesde(f.clasifican, 1)) errores.push(`${n}: indica cuántos clasifican (1 o más).`);
        });

        const extra = validarExtra(config);
        return { errores: [...new Set([...errores, ...extra.errores])], avisos: [...avisos, ...extra.avisos] };
    }

    const config = cargarConfig();
    const FASES = config.fases.map((fase, i) => ({ ...fase, numero: i + 1, clave: `f${i + 1}` }));

    const obtenerFases = () => FASES;
    const obtenerFase = (numero) => FASES[Number(numero) - 1] || null;
    const esUltimaFase = (numero) => Number(numero) === FASES.length;

    // Un participante campeón queda con fase_maxima = número de fases + 1
    const FASE_CAMPEON = FASES.length + 1;

    const tituloFase = (fase) => `Fase ${fase.numero}: ${fase.nombre}`;
    const etiquetaTab = (fase) => `F${fase.numero}: ${(fase.etiqueta || fase.nombre).toUpperCase()}`;

    // `totalFases` permite previsualizar notas de una configuración que aún no se guarda
    function notaFase(fase, totalFases = FASES.length) {
        if (fase.nota) return fase.nota;
        if (fase.numero === totalFases) return 'El ganador se corona campeón del torneo.';
        if (fase.tipo === 'eliminacion') return `Los ganadores de cada cruce avanzan a F${fase.numero + 1}.`;
        if (fase.grupos > 1) return `Pasan los ${fase.clasifican} mejores de cada grupo a F${fase.numero + 1}.`;
        return `Solo los primeros ${fase.clasifican} avanzan a F${fase.numero + 1}.`;
    }

    function descripcionFaseHTML(fase, claseNota = 'text-amber-400') {
        return `${fase.descripcion || ''} <span class='${claseNota} font-bold'>${notaFase(fase)}</span>`;
    }

    return {
        CONFIG_POR_DEFECTO: porDefecto, TORNEO_CONFIG: config,
        cargarConfig, hayConfigPersonalizada, guardarConfig, restablecerConfig, validarConfig,
        obtenerFases, obtenerFase, esUltimaFase, FASE_CAMPEON,
        tituloFase, etiquetaTab, notaFase, descripcionFaseHTML
    };
}
