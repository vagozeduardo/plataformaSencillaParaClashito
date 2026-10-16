// reinicio.js - Botón "Reiniciar" compartido: reiniciar fases, reiniciar torneo o borrar todo.
// También permite descargar y restaurar un respaldo completo del juego antes de reiniciar.

const leer = (clave) => JSON.parse(localStorage.getItem(clave)) || [];
const escribir = (clave, valor) => localStorage.setItem(clave, JSON.stringify(valor));

// Qué guarda cada juego en localStorage
const JUEGOS = {
    cr: {
        nombre: 'Clash Royale',
        acento: '#00d2ff',
        claveConfig: 'config_fases_cr',
        inscritos: ['jugadores_cr'],
        esProgreso: (k) => /^(enfrentamientos|carrusel)_f\d+_cr$/.test(k) || k === 'torneo_estado_cr',
        // Los jugadores siguen inscritos pero vuelven a la Fase 1 sin victorias
        limpiarInscritos() {
            escribir('jugadores_cr', leer('jugadores_cr').map(j => ({
                ...j, fase_maxima: 1, estado: 'activo', habilitado: true, victorias: {}
            })));
        }
    },
    bs: {
        nombre: 'Brawl Stars',
        acento: '#ff2a85',
        claveConfig: 'config_fases_bs',
        inscritos: ['jugadores_bs', 'equipos_bs'],
        esProgreso: (k) => /^grupos_f\d+_bs$/.test(k) || k === 'torneo_estado_bs',
        // Los equipos siguen inscritos pero vuelven a la Fase 1 sin puntos
        limpiarInscritos() {
            escribir('equipos_bs', leer('equipos_bs').map(e => ({
                ...e, fase_maxima: 1, estado: 'activo', habilitado: true, puntos: 0, puntos_fase: {}
            })));
        }
    }
};

function clavesDelJuego(j) {
    return Object.keys(localStorage).filter(k => j.esProgreso(k) || j.inscritos.includes(k) || k === j.claveConfig);
}

export function reiniciarFases(juego) {
    localStorage.removeItem(JUEGOS[juego].claveConfig);
}

export function reiniciarTorneo(juego) {
    const j = JUEGOS[juego];
    Object.keys(localStorage).filter(j.esProgreso).forEach(k => localStorage.removeItem(k));
    j.limpiarInscritos();
}

export function borrarTodo(juego) {
    clavesDelJuego(JUEGOS[juego]).forEach(k => localStorage.removeItem(k));
}

function descargarRespaldo(juego) {
    const j = JUEGOS[juego];
    const datos = { juego, fecha: new Date().toISOString(), claves: {} };
    clavesDelJuego(j).forEach(k => { datos.claves[k] = localStorage.getItem(k); });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datos, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Respaldo_${j.nombre.replace(' ', '')}_${datos.fecha.slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function restaurarRespaldo(juego, texto) {
    const datos = JSON.parse(texto);
    if (datos.juego !== juego || !datos.claves) throw new Error(`El archivo no es un respaldo de ${JUEGOS[juego].nombre}.`);
    borrarTodo(juego);
    Object.entries(datos.claves).forEach(([k, v]) => localStorage.setItem(k, v));
}

// --- Ventana modal ---

const OPCIONES = [
    {
        id: 'fases', icono: 'fa-sliders', color: 'amber',
        titulo: 'Reiniciar fases',
        detalle: 'Vuelve a la configuración de fases original. No toca inscritos ni resultados.',
        confirmar: (n) => confirm(`¿Restablecer las fases de ${n} a su configuración original?`),
        ejecutar: reiniciarFases
    },
    {
        id: 'torneo', icono: 'fa-rotate-left', color: 'cyan',
        titulo: 'Reiniciar torneo',
        detalle: 'Conserva a los inscritos y las fases, pero borra puntos, victorias, sorteos y avances. Todos vuelven a la Fase 1.',
        confirmar: (n) => confirm(`¿Reiniciar el torneo de ${n}? Se perderán todos los resultados y avances.`),
        ejecutar: reiniciarTorneo
    },
    {
        id: 'todo', icono: 'fa-trash-can', color: 'rose',
        titulo: 'Borrar todo',
        detalle: 'Elimina inscritos, resultados y configuración de fases. El juego queda como nuevo.',
        confirmar: (n) => (prompt(`Esto borra TODOS los datos de ${n}, incluidos los inscritos.\nEscribe BORRAR para confirmar:`) || '').trim().toUpperCase() === 'BORRAR',
        ejecutar: borrarTodo
    }
];

const COLORES = {
    amber: 'border-amber-500/40 hover:bg-amber-500/10 text-amber-400',
    cyan: 'border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400',
    rose: 'border-rose-500/40 hover:bg-rose-500/10 text-rose-400'
};

export function inicializarReinicio(boton, juego) {
    const j = JUEGOS[juego];
    if (!boton || !j) return;

    const modal = document.createElement('div');
    modal.className = 'hidden fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="w-full max-w-lg bg-[#121a2d] border rounded-2xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto" style="border-color:${j.acento}55">
            <div class="flex items-center justify-between mb-1">
                <h3 class="font-orbitron text-lg font-black text-slate-100 uppercase">
                    <i class="fa-solid fa-power-off mr-2" style="color:${j.acento}"></i>Reiniciar ${j.nombre}
                </h3>
                <button data-cerrar class="w-8 h-8 rounded text-slate-400 hover:text-white hover:bg-slate-800" title="Cerrar"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <p class="text-xs text-slate-400 mb-4">Descarga un respaldo antes de reiniciar: podrás restaurarlo si te equivocas.</p>

            <div class="flex flex-wrap gap-2 mb-4 pb-4 border-b border-slate-800">
                <button data-respaldo class="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-slate-300 px-3 py-2 rounded-lg text-xs font-bold">
                    <i class="fa-solid fa-download text-emerald-400"></i> Descargar respaldo
                </button>
                <label class="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-300 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer">
                    <i class="fa-solid fa-upload text-cyan-400"></i> Restaurar respaldo
                    <input data-restaurar type="file" accept=".json" class="hidden">
                </label>
            </div>

            <div class="space-y-3">
                ${OPCIONES.map(o => `
                    <button data-opcion="${o.id}" class="w-full text-left flex items-start gap-3 p-3 rounded-xl border bg-slate-900/60 transition-all ${COLORES[o.color]}">
                        <i class="fa-solid ${o.icono} text-lg mt-0.5 w-5 text-center"></i>
                        <span>
                            <span class="block font-orbitron font-bold text-sm uppercase">${o.titulo}</span>
                            <span class="block text-xs text-slate-400 mt-0.5">${o.detalle}</span>
                        </span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const abrir = () => modal.classList.remove('hidden');
    const cerrar = () => modal.classList.add('hidden');

    boton.addEventListener('click', abrir);
    modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('[data-cerrar]')) cerrar(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });

    modal.querySelector('[data-respaldo]').addEventListener('click', () => descargarRespaldo(juego));

    modal.querySelector('[data-restaurar]').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                if (!confirm(`Se reemplazarán todos los datos actuales de ${j.nombre} por los del respaldo. ¿Continuar?`)) return;
                restaurarRespaldo(juego, event.target.result);
                alert('¡Respaldo restaurado!');
                location.reload();
            } catch (err) {
                alert(err.message.startsWith('El archivo') ? err.message : 'Error al leer el archivo de respaldo.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    modal.querySelectorAll('[data-opcion]').forEach(btn => btn.addEventListener('click', () => {
        const opcion = OPCIONES.find(o => o.id === btn.dataset.opcion);
        if (!opcion.confirmar(j.nombre)) return;
        opcion.ejecutar(juego);
        alert(`${opcion.titulo}: listo.`);
        location.reload();
    }));
}
