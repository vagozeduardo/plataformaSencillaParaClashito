// config-fases.js - Editor visual de fases (Clash Royale o Brawl Stars según ?juego=cr|bs)
import * as CLASH from './torneo-config.js';
import * as BRAWL from '../brawl/brawl-config.js';
import { inicializarToggleHeader } from './ui-utils.js';
import { notificar, confirmar } from '../comun/avisos.js';

const JUEGO = new URLSearchParams(location.search).get('juego') === 'bs' ? 'bs' : 'cr';
const ES_BRAWL = JUEGO === 'bs';
const T = ES_BRAWL ? BRAWL : CLASH;
const ACENTO = ES_BRAWL ? '#ff2a85' : '#00d2ff';

const AYUDA_ALGORITMO = {
    'rotacion': 'Carrusel: todos rotan una posición por ronda (como Modo Dios).',
    'round-robin': 'Todos contra todos: cada jugador enfrenta a todos una vez (n-1 rondas si dejas vacío "Rondas").',
    'plantilla': 'Cruces exactos escritos a mano, una línea por ronda (como la Semifinal).',
    'eliminacion': 'Mismas parejas en cada ronda: una serie al mejor de N rondas.'
};

const ICONOS_MODO = ['fa-gamepad', 'fa-gem', 'fa-futbol', 'fa-star', 'fa-sack-dollar', 'fa-bullseye', 'fa-skull', 'fa-hockey-puck',
    'fa-basketball', 'fa-volleyball', 'fa-skull-crossbones', 'fa-user-ninja', 'fa-bolt', 'fa-crown', 'fa-fire', 'fa-shield-halved'];

const CLASE_INPUT = `w-full bg-slate-900/80 border border-slate-700 focus:border-[${ACENTO}] focus:outline-none rounded-lg px-3 py-2 text-slate-100 text-sm`;
const CLASE_LABEL = 'block text-[11px] font-orbitron font-bold uppercase tracking-wider text-slate-400 mb-1';

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const leerLS = (clave) => JSON.parse(localStorage.getItem(clave)) || [];

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
    if (f.participantes !== undefined) limpia.participantes = f.participantes;
    if (f.clasifican !== undefined) limpia.clasifican = f.clasifican;
    if (f.destacada) limpia.destacada = true;

    if (ES_BRAWL) {
        if (limpia.tipo === 'liguilla') limpia.grupos = f.grupos ?? 1;
        limpia.modos = [...(f.modos || [])];
        return limpia;
    }

    limpia.registro = f.registro || 'manual';
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
    if (ES_BRAWL) {
        const conAvance = leerLS('equipos_bs').some(e =>
            (e.fase_maxima ?? 1) > 1 || Object.values(e.puntos_fase || {}).some(v => v > 0)
        );
        return conAvance || Object.keys(localStorage).some(k => /^grupos_f\d+_bs$/.test(k));
    }
    const conAvance = leerLS('jugadores_cr').some(j =>
        j.fase_maxima > 1 || Object.values(j.victorias || {}).some(v => v > 0)
    );
    return conAvance || Object.keys(localStorage).some(k => /^(enfrentamientos|carrusel)_f\d+_cr$/.test(k));
}

function idDesdeNombre(nombre, existentes) {
    const base = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'modo';
    let id = base;
    for (let i = 2; existentes.has(id); i++) id = `${base}-${i}`;
    return id;
}

document.addEventListener('DOMContentLoaded', () => {
    const listaFases = document.getElementById('lista-fases');
    const catalogoEl = document.getElementById('catalogo-modos');
    const panelErrores = document.getElementById('panel-errores');
    const estadoGuardado = document.getElementById('estado-guardado');

    // Identidad visual del juego que se edita
    document.getElementById('subtitulo-juego').innerHTML = ES_BRAWL
        ? '<i class="fa-solid fa-star text-[#ff2a85] mr-1"></i> Brawl Stars · por equipos'
        : '<i class="fa-solid fa-crown text-amber-400 mr-1"></i> Clash Royale · 1v1';
    document.getElementById('link-volver').href = ES_BRAWL ? 'brawl.html' : 'clash.html';
    const acento = document.getElementById('titulo-acento');
    if (ES_BRAWL) acento.className = 'text-[#ff2a85] neon-text-pink';
    const btnAgregar = document.getElementById('btn-agregar');
    if (ES_BRAWL) btnAgregar.className = 'btn-juego btn-secundario flex items-center gap-2 bg-[#ff2a85]/20 border border-[#ff2a85]/50 text-[#ff2a85] font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#ff2a85]/30';
    document.title = `Configurar Fases - ${ES_BRAWL ? 'Brawl Stars' : 'Clash Royale'}`;

    const configInicial = T.cargarConfig();
    let fases = aEstado(configInicial.fases);
    let modos = ES_BRAWL ? structuredClone(configInicial.modos || BRAWL.MODOS_POR_DEFECTO) : [];
    let sucio = false;

    function marcarSucio(valor = true) {
        sucio = valor;
        if (sucio) {
            estadoGuardado.innerHTML = '<span class="text-amber-400">● Cambios sin guardar</span>';
        } else if (T.hayConfigPersonalizada()) {
            estadoGuardado.innerHTML = '<span class="text-emerald-400"><i class="fa-solid fa-check"></i> Configuración guardada</span>';
        } else {
            estadoGuardado.innerHTML = '<span class="text-slate-500">Usando configuración por defecto</span>';
        }
    }

    // --- Componentes de formulario ---
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

    // --- Secciones específicas de cada juego ---
    function htmlMesasClash(f, i) {
        if (f.registro !== 'mesas') return '';
        const algoritmo = f.emparejamiento?.algoritmo;
        return `
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
            </div>`;
    }

    function htmlModosBrawl(f, i) {
        const elegidos = new Set(f.modos || []);
        return `
            <div class="mt-4 border border-[#ff2a85]/30 bg-[#ff2a85]/5 rounded-xl p-4">
                <p class="font-orbitron text-xs font-bold text-[#ff2a85] uppercase tracking-wider mb-3"><i class="fa-solid fa-gamepad mr-1"></i> Modos de juego de esta fase (${elegidos.size})</p>
                <div class="flex flex-wrap gap-2">
                    ${modos.map(m => {
                        const activo = elegidos.has(m.id);
                        return `
                        <button data-modo="${esc(m.id)}" data-i="${i}" type="button"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide transition-all ${activo
                                ? 'bg-[#ff2a85]/20 border-[#ff2a85] text-slate-100 shadow-[0_0_10px_rgba(255,42,133,0.3)]'
                                : 'bg-slate-900/80 border-slate-700 text-slate-500 hover:text-slate-300'}">
                            <i class="fa-solid ${activo ? 'fa-check' : m.icono} ${activo ? 'text-[#ff2a85]' : ''}"></i> ${esc(m.nombre)}
                        </button>`;
                    }).join('')}
                </div>
            </div>`;
    }

    // --- Tarjeta de una fase ---
    function htmlFase(f, i) {
        const total = fases.length;
        const esFinal = i === total - 1;
        const notaAuto = T.notaFase({ ...normalizar(f), nota: undefined, numero: i + 1 }, total);
        const unidad = ES_BRAWL ? 'equipos' : 'jugadores';

        let ayudaClasifican = 'Los N con más victorias pasan a la siguiente fase.';
        if (esFinal) ayudaClasifican = 'La última fase corona al campeón.';
        else if (f.tipo === 'eliminacion') ayudaClasifican = 'En eliminación avanza el ganador de cada cruce.';
        else if (ES_BRAWL) ayudaClasifican = 'Equipos que pasan POR GRUPO.';

        const botonIcono = (accion, icono, titulo, deshabilitado = false, color = `hover:text-[${ACENTO}] hover:border-[${ACENTO}]/50`) => `
            <button data-accion="${accion}" data-i="${i}" ${deshabilitado ? 'disabled' : ''} title="${titulo}"
                class="btn-juego btn-mini ${accion === 'eliminar' ? 'btn-peligro' : 'btn-secundario'} w-8 h-8 rounded bg-slate-800 border border-slate-700 text-slate-400 ${color} disabled:opacity-30 disabled:cursor-not-allowed">
                <i class="fa-solid ${icono}"></i>
            </button>`;

        const camposJuego = ES_BRAWL
            ? `${f.tipo === 'liguilla' ? campoNumero(i, 'grupos', 'Número de grupos', { placeholder: '1', ayuda: '1 = una sola tabla general.' }) : '<div class="hidden md:block"></div>'}`
            : campoSelect(i, 'registro', 'Registro de resultados', [['manual', 'Manual (botones + / −)'], ['mesas', 'Por mesas (sorteo y rondas)']]);

        return `
            <div class="bg-[#121a2d] rounded-2xl border ${esFinal ? 'border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.1)]' : 'border-slate-800'} p-4 md:p-5 shadow-xl">
                <div class="flex items-center justify-between gap-3 mb-4">
                    <div class="flex items-center gap-3 min-w-0">
                        <span class="shrink-0 font-orbitron font-black text-sm px-2.5 py-1 rounded ${esFinal ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : `bg-[${ACENTO}]/10 text-[${ACENTO}] border border-[${ACENTO}]/40`}">
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
                    ${campoTexto(i, 'nota', 'Nota destacada (vacío = automática)', { placeholder: notaAuto, ancho: 'md:col-span-2' })}
                    ${campoSelect(i, 'tipo', 'Tipo de fase', [['liguilla', ES_BRAWL ? 'Liguilla / grupos (tabla por puntos)' : 'Liguilla (tabla por victorias)'], ['eliminacion', 'Eliminación directa (cruces)']])}
                    ${camposJuego}
                    ${campoNumero(i, 'participantes', `Participantes (${unidad})`, { placeholder: 'Opcional', ayuda: 'Se valida al hacer el sorteo.' })}
                    ${campoNumero(i, 'clasifican', ES_BRAWL ? 'Clasifican por grupo' : 'Clasifican a la siguiente fase', { deshabilitado: esFinal || f.tipo === 'eliminacion', ayuda: ayudaClasifican })}
                    <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer md:col-span-2">
                        <input type="checkbox" data-i="${i}" data-campo="destacada" ${f.destacada ? 'checked' : ''} class="w-4 h-4 accent-amber-400">
                        Pestaña destacada en dorado
                    </label>
                </div>

                ${ES_BRAWL ? htmlModosBrawl(f, i) : htmlMesasClash(f, i)}
            </div>`;
    }

    // --- Catálogo de modos (Brawl Stars) ---
    function renderizarCatalogo() {
        if (!ES_BRAWL) return;
        catalogoEl.classList.remove('hidden');
        const enUso = (id) => fases.filter(f => (f.modos || []).includes(id)).length;
        catalogoEl.innerHTML = `
            <details class="bg-[#121a2d] rounded-2xl border border-[#ff2a85]/30 p-4 md:p-5 shadow-xl" ${catalogoEl.dataset.abierto === 'true' ? 'open' : ''}>
                <summary class="cursor-pointer font-orbitron font-bold text-slate-100 flex items-center justify-between gap-3">
                    <span><i class="fa-solid fa-layer-group text-[#ff2a85] mr-2"></i>Catálogo de modos de juego <span class="text-slate-500 text-xs">(${modos.length})</span></span>
                    <span class="text-[11px] text-slate-500 font-normal">Clic para ${catalogoEl.dataset.abierto === 'true' ? 'cerrar' : 'editar'}</span>
                </summary>
                <p class="text-xs text-slate-400 mt-3 mb-4">Brawl Stars rota sus modos cada temporada: aquí puedes renombrarlos, agregar nuevos o quitar los que ya no existan. Luego elígelos en cada fase.</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    ${modos.map((m, k) => `
                        <div class="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-lg p-2">
                            <select data-modo-campo="icono" data-k="${k}" class="bg-slate-900 border border-slate-700 rounded px-1 py-1.5 text-xs text-slate-300 w-24" title="Icono">
                                ${ICONOS_MODO.map(ic => `<option value="${ic}" ${ic === m.icono ? 'selected' : ''}>${ic.replace('fa-', '')}</option>`).join('')}
                            </select>
                            <i class="fa-solid ${m.icono} text-[#ff2a85] w-4 text-center"></i>
                            <input type="text" data-modo-campo="nombre" data-k="${k}" value="${esc(m.nombre)}" class="${CLASE_INPUT} !py-1.5">
                            <span class="text-[10px] text-slate-500 whitespace-nowrap" title="Fases que lo usan">${enUso(m.id)} fase(s)</span>
                            <button data-quitar-modo="${k}" type="button" title="Quitar del catálogo" class="w-7 h-7 shrink-0 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50"><i class="fa-solid fa-trash text-xs"></i></button>
                        </div>`).join('')}
                </div>
                <div class="flex flex-col sm:flex-row gap-2 mt-4">
                    <input id="nuevo-modo" type="text" placeholder="Nombre del nuevo modo (ej. Asedio)" class="${CLASE_INPUT}">
                    <button id="btn-agregar-modo" type="button" class="shrink-0 flex items-center justify-center gap-2 bg-[#ff2a85]/20 border border-[#ff2a85]/50 text-[#ff2a85] font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#ff2a85]/30">
                        <i class="fa-solid fa-plus"></i> Agregar modo
                    </button>
                </div>
            </details>`;
    }

    function renderizar() {
        renderizarCatalogo();
        listaFases.innerHTML = fases.map(htmlFase).join('');
    }

    // --- Edición de campos de fase ---
    function leerInput(el) {
        if (el.type === 'checkbox') return el.checked || undefined;
        if (el.type === 'number') return el.value === '' ? undefined : Number(el.value);
        return el.value;
    }

    // Mientras se escribe: solo actualizar estado (sin re-render para no perder el foco)
    listaFases.addEventListener('input', (e) => {
        const el = e.target;
        if (!el.dataset.campo) return;
        asignarValor(fases[el.dataset.i], el.dataset.campo, leerInput(el));
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

    listaFases.addEventListener('click', async (e) => {
        // Activar/desactivar un modo de juego en la fase
        const chip = e.target.closest('button[data-modo]');
        if (chip) {
            const fase = fases[chip.dataset.i];
            const actuales = new Set(fase.modos || []);
            if (actuales.has(chip.dataset.modo)) actuales.delete(chip.dataset.modo);
            else actuales.add(chip.dataset.modo);
            // Conservar el orden del catálogo
            fase.modos = modos.map(m => m.id).filter(id => actuales.has(id));
            marcarSucio();
            renderizar();
            return;
        }

        const btn = e.target.closest('button[data-accion]');
        if (!btn) return;
        const i = Number(btn.dataset.i);
        const accion = btn.dataset.accion;

        if (accion === 'subir' && i > 0) [fases[i - 1], fases[i]] = [fases[i], fases[i - 1]];
        if (accion === 'bajar' && i < fases.length - 1) [fases[i + 1], fases[i]] = [fases[i], fases[i + 1]];
        if (accion === 'eliminar') {
            if (fases.length === 1) return;
            if (!(await confirmar(`Se eliminará la fase F${i + 1}: ${fases[i].nombre || 'Sin nombre'}.`, { titulo: '¿Eliminar fase?', aceptar: 'Eliminar', peligro: true }))) return;
            fases.splice(i, 1);
        }
        marcarSucio();
        renderizar();
    });

    // --- Edición del catálogo de modos ---
    catalogoEl.addEventListener('toggle', (e) => {
        catalogoEl.dataset.abierto = e.target.open;
        const pista = catalogoEl.querySelector('summary span:last-child');
        if (pista) pista.textContent = `Clic para ${e.target.open ? 'cerrar' : 'editar'}`;
    }, true);

    catalogoEl.addEventListener('input', (e) => {
        const el = e.target;
        if (el.dataset.modoCampo !== 'nombre') return;
        modos[el.dataset.k].nombre = el.value;
        marcarSucio();
    });

    catalogoEl.addEventListener('change', (e) => {
        const el = e.target;
        if (!el.dataset.modoCampo) return;
        modos[el.dataset.k][el.dataset.modoCampo] = el.value;
        marcarSucio();
        renderizar();
    });

    function agregarModo() {
        const entrada = catalogoEl.querySelector('#nuevo-modo');
        const nombre = entrada.value.trim();
        if (!nombre) return entrada.focus();
        if (modos.some(m => m.nombre.toLowerCase() === nombre.toLowerCase())) return notificar(`El modo "${nombre}" ya está en el catálogo.`, { tipo: 'aviso' });
        modos.push({ id: idDesdeNombre(nombre, new Set(modos.map(m => m.id))), nombre, icono: 'fa-gamepad' });
        marcarSucio();
        renderizar();
        catalogoEl.querySelector('#nuevo-modo').focus();
    }

    catalogoEl.addEventListener('click', async (e) => {
        if (e.target.closest('#btn-agregar-modo')) return agregarModo();
        const quitar = e.target.closest('button[data-quitar-modo]');
        if (!quitar) return;
        const modo = modos[quitar.dataset.quitarModo];
        const usos = fases.filter(f => (f.modos || []).includes(modo.id)).length;
        if (!(await confirmar(`Se quitará "${modo.nombre}" del catálogo.${usos ? ` También se quitará de ${usos} fase(s).` : ''}`, { titulo: '¿Quitar modo?', aceptar: 'Quitar', peligro: true }))) return;
        modos.splice(quitar.dataset.quitarModo, 1);
        fases.forEach(f => { f.modos = (f.modos || []).filter(id => id !== modo.id); });
        marcarSucio();
        renderizar();
    });

    catalogoEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.id === 'nuevo-modo') { e.preventDefault(); agregarModo(); }
    });

    // --- Acciones generales ---
    btnAgregar.addEventListener('click', () => {
        // La nueva fase se inserta antes de la final para no reemplazarla
        const nueva = ES_BRAWL
            ? { nombre: 'Nueva fase', descripcion: '', tipo: 'liguilla', grupos: 1, modos: modos.slice(0, 1).map(m => m.id) }
            : { nombre: 'Nueva fase', descripcion: '', tipo: 'liguilla', registro: 'manual', crucesTexto: '' };
        const posicion = Math.max(fases.length - 1, 0);
        fases.splice(posicion, 0, nueva);
        marcarSucio();
        renderizar();
        listaFases.children[posicion].scrollIntoView({ behavior: 'smooth', block: 'center' });
        listaFases.children[posicion].querySelector('[data-campo="nombre"]').select();
    });

    function configActual() {
        const config = { juego: T.CONFIG_POR_DEFECTO.juego, fases: fases.map(normalizar) };
        if (ES_BRAWL) config.modos = modos.map(m => ({ ...m, nombre: m.nombre.trim() }));
        return config;
    }

    function mostrarErrores(errores) {
        panelErrores.classList.toggle('hidden', errores.length === 0);
        panelErrores.innerHTML = errores.length === 0 ? '' : `
            <p class="font-orbitron font-bold text-rose-400 mb-2"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Corrige esto antes de guardar:</p>
            <ul class="list-disc pl-5 space-y-1">${errores.map(er => `<li>${esc(er)}</li>`).join('')}</ul>`;
        if (errores.length) panelErrores.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    document.getElementById('btn-guardar').addEventListener('click', async () => {
        const config = configActual();
        const { errores, avisos } = T.validarConfig(config);
        mostrarErrores(errores);
        if (errores.length) return;

        if (avisos.length && !(await confirmar(`Revisa estos detalles:\n• ${avisos.join('\n• ')}`, { titulo: '¿Guardar de todos modos?', aceptar: 'Guardar' }))) return;

        if (torneoEnCurso() && !(await confirmar(
            'Hay resultados, fases avanzadas o sorteos guardados.\n' +
            'Los resultados se guardan por número de fase (F1, F2...). Si agregaste, quitaste o reordenaste fases, ' +
            'los puntos pueden quedar en la fase equivocada.\n' +
            'Te recomendamos descargar un respaldo antes (botón Reiniciar → Descargar respaldo).',
            { titulo: 'Hay un torneo en curso', aceptar: 'Guardar de todos modos', peligro: true }
        ))) return;

        T.guardarConfig(config);
        fases = aEstado(config.fases);
        marcarSucio(false);
        renderizar();
        notificar('El panel del torneo y las demás vistas usarán esta configuración al recargarse.', { tipo: 'exito', titulo: '¡Fases guardadas!' });
    });

    document.getElementById('btn-restablecer').addEventListener('click', async () => {
        if (!(await confirmar('Se perderá la configuración personalizada y volverán las fases originales.', { titulo: '¿Restablecer fases?', aceptar: 'Restablecer', peligro: true }))) return;
        T.restablecerConfig();
        fases = aEstado(T.CONFIG_POR_DEFECTO.fases);
        modos = ES_BRAWL ? structuredClone(BRAWL.MODOS_POR_DEFECTO) : [];
        mostrarErrores([]);
        marcarSucio(false);
        renderizar();
        notificar('Se restablecieron las fases originales.', { tipo: 'exito' });
    });

    document.getElementById('btn-exportar').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configActual(), null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `Fases_${ES_BRAWL ? 'BrawlStars' : 'ClashRoyale'}_${new Date().toISOString().slice(0, 10)}.json`);
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
                if (!datos || !Array.isArray(datos.fases)) return notificar("El archivo no tiene la estructura de fases correcta.", { tipo: 'error' });
                fases = aEstado(datos.fases);
                if (ES_BRAWL && Array.isArray(datos.modos)) modos = datos.modos;
                mostrarErrores(T.validarConfig(configActual()).errores);
                marcarSucio();
                renderizar();
                notificar('Revisa y presiona "Guardar cambios" para aplicarlas.', { tipo: 'info', titulo: 'Fases cargadas en el editor' });
            } catch (err) { notificar("Error al leer el archivo JSON.", { tipo: 'error' }); }
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
