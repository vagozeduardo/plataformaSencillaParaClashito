// config-fases.js - Editor visual de las fases del torneo (se guarda en localStorage)
import {
    cargarConfig, guardarConfig, restablecerConfig, hayConfigPersonalizada,
    validarConfig, notaFase, CONFIG_POR_DEFECTO
} from './torneo-config.js';
import { obtenerJugadores } from './storage-utils.js';
import { inicializarToggleHeader } from './ui-utils.js';

const AYUDA_ALGORITMO = {
    'rotacion': 'Carrusel: todos rotan una posición por ronda (como Modo Dios).',
    'round-robin': 'Todos contra todos: cada jugador enfrenta a todos una vez (n-1 rondas si dejas vacío "Rondas").',
    'plantilla': 'Cruces exactos escritos a mano, una línea por ronda (como la Semifinal).',
    'eliminacion': 'Mismas parejas en cada ronda: una serie al mejor de N rondas.'
};

const CLASE_INPUT = 'w-full bg-slate-900/80 border border-slate-700 focus:border-[#00d2ff] focus:outline-none rounded-lg px-3 py-2 text-slate-100 text-sm';
const CLASE_LABEL = 'block text-[11px] font-orbitron font-bold uppercase tracking-wider text-slate-400 mb-1';

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// --- Cruces de plantilla <-> texto ("m1A-m1B, m2A-m2B" por línea) ---
function formatearCruces(cruces = []) {
    return cruces.map(ronda => ronda.map(([a, b]) => `${a}-${b}`).join(', ')).join('\n');
}

function leerCruces(texto = '') {
    return texto.split('\n').map(l => l.trim()).filter(Boolean).map(linea =>
        linea.split(',').map(p => p.trim()).filter(Boolean).map(par => {
            const partes = par.split(/\s*(?:-|vs)\s*/i).filter(Boolean);
            return partes.length === 2 ? partes : [par];
        })
    );
}

// Estado editable: copia de las fases + texto de cruces para el textarea
function aEstado(fases) {
    return fases.map(f => ({
        ...structuredClone(f),
        crucesTexto: formatearCruces(f.emparejamiento?.cruces)
    }));
}

// Convierte el estado del formulario en una fase limpia para guardar
function normalizar(f) {
    const limpia = { nombre: (f.nombre || '').trim() };
    ['etiqueta', 'descripcion', 'nota'].forEach(c => { if (f[c] && f[c].trim()) limpia[c] = f[c].trim(); });
    limpia.tipo = f.tipo || 'liguilla';
    limpia.registro = f.registro || 'manual';
    if (f.participantes !== undefined) limpia.participantes = f.participantes;
    if (f.clasifican !== undefined) limpia.clasifican = f.clasifican;
    if (f.destacada) limpia.destacada = true;

    if (limpia.registro === 'mesas') {
        const e = f.emparejamiento || {};
        const emp = { algoritmo: e.algoritmo };
        if (e.algoritmo === 'plantilla') emp.cruces = leerCruces(f.crucesTexto);
        else if (e.rondas !== undefined) emp.rondas = e.rondas;
        if (e.etiquetaLado && e.etiquetaLado !== 'LADO') emp.etiquetaLado = e.etiquetaLado;
        limpia.emparejamiento = emp;
    }
    return limpia;
}

function torneoEnCurso() {
    const conAvance = obtenerJugadores().some(j =>
        j.fase_maxima > 1 || Object.values(j.victorias || {}).some(v => v > 0)
    );
    const conSorteos = Object.keys(localStorage).some(k => /^(enfrentamientos|carrusel)_f\d+_cr$/.test(k));
    return conAvance || conSorteos;
}

document.addEventListener('DOMContentLoaded', () => {
    const listaFases = document.getElementById('lista-fases');
    const panelErrores = document.getElementById('panel-errores');
    const estadoGuardado = document.getElementById('estado-guardado');

    let fases = aEstado(cargarConfig().fases);
    let sucio = false;

    function marcarSucio(valor = true) {
        sucio = valor;
        if (sucio) {
            estadoGuardado.innerHTML = '<span class="text-amber-400">● Cambios sin guardar</span>';
        } else if (hayConfigPersonalizada()) {
            estadoGuardado.innerHTML = '<span class="text-emerald-400"><i class="fa-solid fa-check"></i> Configuración guardada</span>';
        } else {
            estadoGuardado.innerHTML = '<span class="text-slate-500">Usando configuración por defecto</span>';
        }
    }

    // --- Componentes de formulario ---
    function campoTexto(i, campo, etiqueta, { placeholder = '', ancho = '' } = {}) {
        return `
            <label class="${ancho}">
                <span class="${CLASE_LABEL}">${etiqueta}</span>
                <input type="text" data-i="${i}" data-campo="${campo}" value="${esc(obtenerValor(fases[i], campo))}" placeholder="${esc(placeholder)}" class="${CLASE_INPUT}">
            </label>`;
    }

    function campoNumero(i, campo, etiqueta, { placeholder = '', deshabilitado = false, ayuda = '' } = {}) {
        return `
            <label>
                <span class="${CLASE_LABEL}">${etiqueta}</span>
                <input type="number" min="1" step="1" data-i="${i}" data-campo="${campo}" value="${esc(obtenerValor(fases[i], campo))}" placeholder="${esc(placeholder)}" ${deshabilitado ? 'disabled' : ''} class="${CLASE_INPUT} disabled:opacity-40">
                ${ayuda ? `<span class="block text-[11px] text-slate-500 mt-1">${ayuda}</span>` : ''}
            </label>`;
    }

    function campoSelect(i, campo, etiqueta, opciones, ayuda = '') {
        const actual = obtenerValor(fases[i], campo);
        return `
            <label>
                <span class="${CLASE_LABEL}">${etiqueta}</span>
                <select data-i="${i}" data-campo="${campo}" class="${CLASE_INPUT}">
                    ${opciones.map(([valor, texto]) => `<option value="${valor}" ${valor === actual ? 'selected' : ''}>${texto}</option>`).join('')}
                </select>
                ${ayuda ? `<span class="block text-[11px] text-slate-500 mt-1">${ayuda}</span>` : ''}
            </label>`;
    }

    function obtenerValor(fase, ruta) {
        return ruta.split('.').reduce((obj, k) => (obj == null ? undefined : obj[k]), fase);
    }

    function asignarValor(fase, ruta, valor) {
        const claves = ruta.split('.');
        const ultima = claves.pop();
        const destino = claves.reduce((obj, k) => (obj[k] ??= {}), fase);
        if (valor === undefined) delete destino[ultima];
        else destino[ultima] = valor;
    }

    // --- Tarjeta de una fase ---
    function htmlFase(f, i) {
        const total = fases.length;
        const esFinal = i === total - 1;
        const usaMesas = f.registro === 'mesas';
        const algoritmo = f.emparejamiento?.algoritmo;
        const notaAuto = notaFase({ ...normalizar(f), nota: undefined, numero: i + 1 }, total);

        const ayudaClasifican = esFinal
            ? 'La última fase corona al campeón.'
            : (f.tipo === 'eliminacion' ? 'En eliminación avanza el ganador de cada mesa.' : 'Los N con más victorias pasan a la siguiente fase.');

        const botonIcono = (accion, icono, titulo, deshabilitado = false, color = 'hover:text-[#00d2ff] hover:border-[#00d2ff]/50') => `
            <button data-accion="${accion}" data-i="${i}" ${deshabilitado ? 'disabled' : ''} title="${titulo}"
                class="w-8 h-8 rounded bg-slate-800 border border-slate-700 text-slate-400 ${color} disabled:opacity-30 disabled:cursor-not-allowed">
                <i class="fa-solid ${icono}"></i>
            </button>`;

        return `
            <div class="bg-[#121a2d] rounded-2xl border ${esFinal ? 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.1)]' : 'border-slate-800'} p-4 md:p-5 shadow-xl">
                <div class="flex items-center justify-between gap-3 mb-4">
                    <div class="flex items-center gap-3 min-w-0">
                        <span class="shrink-0 font-orbitron font-black text-sm px-2.5 py-1 rounded ${esFinal ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/40'}">
                            F${i + 1}${esFinal ? ' · FINAL' : ''}
                        </span>
                        <h3 data-titulo="${i}" class="font-orbitron font-bold text-slate-100 truncate">${esc(f.nombre) || '<span class="text-slate-500">Sin nombre</span>'}</h3>
                    </div>
                    <div class="flex gap-2 shrink-0">
                        ${botonIcono('subir', 'fa-arrow-up', 'Mover arriba', i === 0)}
                        ${botonIcono('bajar', 'fa-arrow-down', 'Mover abajo', esFinal)}
                        ${botonIcono('eliminar', 'fa-trash', 'Eliminar fase', total === 1, 'hover:text-rose-400 hover:border-rose-500/50')}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    ${campoTexto(i, 'nombre', 'Nombre *', { placeholder: 'Ej. Cuartos de Final' })}
                    ${campoTexto(i, 'etiqueta', 'Texto corto de la pestaña', { placeholder: 'Si se deja vacío usa el nombre' })}
                    ${campoTexto(i, 'descripcion', 'Descripción', { placeholder: 'Ej. Duelos directos.', ancho: 'md:col-span-2' })}
                    ${campoTexto(i, 'nota', 'Nota en dorado (vacío = automática)', { placeholder: notaAuto, ancho: 'md:col-span-2' })}
                    ${campoSelect(i, 'tipo', 'Tipo de fase', [['liguilla', 'Liguilla (tabla por victorias)'], ['eliminacion', 'Eliminación directa (bracket)']])}
                    ${campoSelect(i, 'registro', 'Registro de resultados', [['manual', 'Manual (botones + / −)'], ['mesas', 'Por mesas (sorteo y rondas)']])}
                    ${campoNumero(i, 'participantes', 'Participantes', { placeholder: 'Opcional', ayuda: 'Se valida al hacer el sorteo.' })}
                    ${campoNumero(i, 'clasifican', 'Clasifican a la siguiente fase', { deshabilitado: esFinal || f.tipo === 'eliminacion', ayuda: ayudaClasifican })}
                    <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer md:col-span-2">
                        <input type="checkbox" data-i="${i}" data-campo="destacada" ${f.destacada ? 'checked' : ''} class="w-4 h-4 accent-amber-400">
                        Pestaña destacada en dorado
                    </label>
                </div>

                ${usaMesas ? `
                <div class="mt-4 border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-4">
                    <p class="font-orbitron text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3"><i class="fa-solid fa-dice mr-1"></i> Emparejamiento por mesas</p>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        ${campoSelect(i, 'emparejamiento.algoritmo', 'Algoritmo', [
                            ['rotacion', 'Rotación (carrusel)'], ['round-robin', 'Todos contra todos'],
                            ['plantilla', 'Plantilla de cruces'], ['eliminacion', 'Eliminación (serie)']
                        ], AYUDA_ALGORITMO[algoritmo] || '')}
                        ${algoritmo === 'plantilla' ? '' : campoNumero(i, 'emparejamiento.rondas', 'Rondas', { placeholder: algoritmo === 'eliminacion' ? '1' : 'Automático' })}
                        ${campoSelect(i, 'emparejamiento.etiquetaLado', 'Texto de cada lado', [['LADO', 'LADO A / LADO B'], ['ZONA', 'ZONA A / ZONA B']])}
                        ${algoritmo === 'plantilla' ? `
                        <label class="md:col-span-3">
                            <span class="${CLASE_LABEL}">Cruces por ronda (una línea por ronda)</span>
                            <textarea data-i="${i}" data-campo="crucesTexto" rows="4" placeholder="m1A-m1B, m2A-m2B&#10;m2A-m1A, m2B-m1B" class="${CLASE_INPUT} font-mono">${esc(f.crucesTexto)}</textarea>
                            <span class="block text-[11px] text-slate-500 mt-1">m1A y m1B son los dos jugadores sorteados en la mesa 1, m2A y m2B los de la mesa 2, etc.</span>
                        </label>` : ''}
                    </div>
                </div>` : ''}
            </div>`;
    }

    function renderizar() {
        listaFases.innerHTML = fases.map(htmlFase).join('');
    }

    // --- Edición de campos ---
    function leerInput(el) {
        if (el.type === 'checkbox') return el.checked || undefined;
        if (el.type === 'number') return el.value === '' ? undefined : Number(el.value);
        return el.value;
    }

    // Mientras se escribe: solo actualizar estado (sin re-render para no perder el foco)
    listaFases.addEventListener('input', (e) => {
        const el = e.target;
        if (!el.dataset.campo) return;
        const fase = fases[el.dataset.i];
        asignarValor(fase, el.dataset.campo, leerInput(el));
        if (el.dataset.campo === 'nombre') {
            listaFases.querySelector(`[data-titulo="${el.dataset.i}"]`).textContent = el.value || 'Sin nombre';
        }
        marcarSucio();
    });

    // Al confirmar un cambio: re-render (muestra/oculta campos según tipo, registro y algoritmo)
    listaFases.addEventListener('change', (e) => {
        const el = e.target;
        if (!el.dataset.campo) return;
        const fase = fases[el.dataset.i];
        if (el.dataset.campo === 'registro' && el.value === 'mesas' && !fase.emparejamiento?.algoritmo) {
            fase.emparejamiento = { algoritmo: 'round-robin' };
        }
        renderizar();
    });

    listaFases.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-accion]');
        if (!btn) return;
        const i = Number(btn.dataset.i);
        const accion = btn.dataset.accion;

        if (accion === 'subir' && i > 0) [fases[i - 1], fases[i]] = [fases[i], fases[i - 1]];
        if (accion === 'bajar' && i < fases.length - 1) [fases[i + 1], fases[i]] = [fases[i], fases[i + 1]];
        if (accion === 'eliminar') {
            if (fases.length === 1) return;
            if (!confirm(`¿Eliminar la fase F${i + 1}: ${fases[i].nombre || 'Sin nombre'}?`)) return;
            fases.splice(i, 1);
        }
        marcarSucio();
        renderizar();
    });

    // --- Acciones generales ---
    document.getElementById('btn-agregar').addEventListener('click', () => {
        // La nueva fase se inserta antes de la final para no reemplazarla
        const nueva = { nombre: 'Nueva fase', descripcion: '', tipo: 'liguilla', registro: 'manual', crucesTexto: '' };
        const posicion = Math.max(fases.length - 1, 0);
        fases.splice(posicion, 0, nueva);
        marcarSucio();
        renderizar();
        listaFases.children[posicion].scrollIntoView({ behavior: 'smooth', block: 'center' });
        listaFases.children[posicion].querySelector('[data-campo="nombre"]').select();
    });

    function configActual() {
        return { juego: CONFIG_POR_DEFECTO.juego, fases: fases.map(normalizar) };
    }

    function mostrarErrores(errores) {
        panelErrores.classList.toggle('hidden', errores.length === 0);
        panelErrores.innerHTML = errores.length === 0 ? '' : `
            <p class="font-orbitron font-bold text-rose-400 mb-2"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Corrige esto antes de guardar:</p>
            <ul class="list-disc pl-5 space-y-1">${errores.map(er => `<li>${esc(er)}</li>`).join('')}</ul>`;
        if (errores.length) panelErrores.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    document.getElementById('btn-guardar').addEventListener('click', () => {
        const config = configActual();
        const { errores, avisos } = validarConfig(config);
        mostrarErrores(errores);
        if (errores.length) return;

        if (avisos.length && !confirm(`Revisa estos detalles:\n\n• ${avisos.join('\n• ')}\n\n¿Guardar de todos modos?`)) return;

        if (torneoEnCurso() && !confirm(
            'Hay un torneo en curso (jugadores con victorias, fases avanzadas o sorteos).\n\n' +
            'Las victorias se guardan por número de fase (F1, F2...). Si agregaste, quitaste o reordenaste fases, ' +
            'los puntos pueden quedar en la fase equivocada.\n\nTe recomendamos exportar el JSON del torneo antes. ¿Guardar de todos modos?'
        )) return;

        guardarConfig(config);
        fases = aEstado(config.fases);
        marcarSucio(false);
        renderizar();
        alert('¡Fases guardadas! El panel del torneo, los duelos y las vistas de espectador usarán esta configuración al recargarse.');
    });

    document.getElementById('btn-restablecer').addEventListener('click', () => {
        if (!confirm('¿Volver a las fases originales (F1 Todos vs Todos … F5 Gran Final)? Se perderá la configuración personalizada.')) return;
        restablecerConfig();
        fases = aEstado(CONFIG_POR_DEFECTO.fases);
        mostrarErrores([]);
        marcarSucio(false);
        renderizar();
    });

    document.getElementById('btn-exportar').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configActual(), null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `Fases_ClashRoyale_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    document.getElementById('input-importar').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const datos = JSON.parse(event.target.result);
                if (!datos || !Array.isArray(datos.fases)) return alert("El archivo no tiene la estructura de fases correcta.");
                fases = aEstado(datos.fases);
                mostrarErrores(validarConfig(configActual()).errores);
                marcarSucio();
                renderizar();
                alert('Fases cargadas en el editor. Revisa y presiona "Guardar cambios" para aplicarlas.');
            } catch (err) { alert("Error al leer el archivo JSON."); }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    window.addEventListener('beforeunload', (e) => {
        if (sucio) { e.preventDefault(); e.returnValue = ''; }
    });

    inicializarToggleHeader();
    marcarSucio(false);
    renderizar();
});
