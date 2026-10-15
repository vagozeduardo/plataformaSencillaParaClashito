// fases-ui.js - Componentes visuales compartidos que se generan a partir de torneo-config.js
import { obtenerFases, etiquetaTab, FASE_CAMPEON } from './torneo-config.js';

const CLASES_TAB_ACTIVA = ['text-[#00d2ff]', 'border-b-2', 'border-[#00d2ff]', 'bg-[#00d2ff]/10'];

function claseInactiva(tab) {
    return tab.dataset.destacada === 'true' ? 'text-amber-500' : 'text-slate-500';
}

// Pinta una pestaña por fase dentro de `contenedor` y llama a `onCambio(numeroFase)` al hacer clic.
// opciones.claseBase   -> clases comunes de cada botón (para respetar el estilo de cada página)
// opciones.filtro      -> función para mostrar solo algunas fases
// opciones.tabCampeon  -> agrega la pestaña final de campeón (vista espectador)
export function renderizarTabsFases(contenedor, { claseBase, filtro = () => true, tabCampeon = false, faseInicial, onCambio }) {
    const fases = obtenerFases().filter(filtro);
    const items = fases.map(f => ({
        valor: String(f.numero),
        texto: etiquetaTab(f) + (f.destacada ? ' <i class="fa-solid fa-trophy ml-1"></i>' : ''),
        destacada: !!f.destacada
    }));
    if (tabCampeon) items.push({ valor: String(FASE_CAMPEON), texto: '🏆 CAMPEÓN 🏆', destacada: true });

    contenedor.innerHTML = items.map(it =>
        `<button data-fase="${it.valor}" data-destacada="${it.destacada}" class="tab-fase ${claseBase} whitespace-nowrap">${it.texto}</button>`
    ).join('');

    const tabs = contenedor.querySelectorAll('.tab-fase');

    function activar(valor) {
        tabs.forEach(t => {
            t.classList.remove(...CLASES_TAB_ACTIVA, 'text-slate-500', 'text-amber-500');
            if (t.dataset.fase === valor) t.classList.add(...CLASES_TAB_ACTIVA);
            else t.classList.add(claseInactiva(t));
        });
        onCambio(valor);
    }

    tabs.forEach(t => t.addEventListener('click', () => activar(t.dataset.fase)));
    activar(String(faseInicial ?? items[0]?.valor));

    return { activar };
}

export function htmlCampeon(campeon, extra = '') {
    return `
        <div class="py-12 px-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-[#121a2d] to-[#0a0f1d] border-2 border-amber-400/60 text-center shadow-[0_0_35px_rgba(251,191,36,0.25)] flex flex-col items-center justify-center my-4">
            <div class="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center border-2 border-amber-400 mb-4 shadow-[0_0_20px_#fbbf24]">
                <i class="fa-solid fa-trophy text-4xl text-amber-400"></i>
            </div>
            <span class="text-xs font-bold font-orbitron text-amber-400 uppercase tracking-[0.3em] mb-1">¡CAMPEÓN ABSOLUTO DEL TORNEO!</span>
            <h2 class="text-4xl md:text-5xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 uppercase tracking-wider mb-2">${campeon.gamertag}</h2>
            <p class="text-sm text-slate-300 font-mono bg-slate-900/80 px-4 py-1 rounded-full border border-slate-700/60 mb-6">
                <i class="fa-solid fa-user text-amber-400 mr-1.5"></i>${campeon.nombre} <span class="text-slate-500">|</span> ${campeon.tag_jugador}
            </p>
            ${extra}
        </div>
    `;
}

export function htmlVacio(icono, mensaje) {
    return `
        <div class="col-span-full text-center py-12 border-2 border-dashed border-slate-700 rounded-lg">
            <i class="fa-solid ${icono} text-4xl text-slate-600 mb-3"></i>
            <p class="text-slate-400 font-orbitron">${mensaje}</p>
        </div>
    `;
}
