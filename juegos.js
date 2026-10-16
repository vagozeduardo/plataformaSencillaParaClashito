// juegos.js - Formato de cada torneo (fases y modos) leído de su configuración
import * as CLASH from './clashito/torneo-config.js';
import * as BRAWL from './brawl/brawl-config.js';

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

function pintarFormato(contenedor, torneo, extra = () => '') {
    contenedor.innerHTML = torneo.obtenerFases().map(f => `
        <li class="dato-vivo flex items-start gap-3 p-3">
            <span class="paso-fase ${f.destacada ? 'actual' : ''} shrink-0">F${f.numero}</span>
            <div class="min-w-0">
                <p class="text-white font-extrabold leading-tight">${esc(f.nombre)}</p>
                <p class="text-xs opacity-80 mt-0.5">${esc(torneo.notaFase(f))}</p>
                ${extra(f)}
            </div>
        </li>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    pintarFormato(document.getElementById('cr-formato'), CLASH);

    pintarFormato(document.getElementById('bs-formato'), BRAWL, (f) => {
        const modos = BRAWL.modosDeFase(f);
        if (!modos.length) return '';
        return `<div class="flex flex-wrap gap-1.5 mt-2">${modos.map(m =>
            `<span class="chip-portada inline-flex items-center gap-1 px-2 py-0.5 text-[11px] uppercase text-white"><i class="fa-solid ${m.icono}"></i> ${esc(m.nombre)}</span>`
        ).join('')}</div>`;
    });
});
