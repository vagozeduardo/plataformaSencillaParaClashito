// espectador-controller.js
import { obtenerFases, obtenerFase } from './torneo-config.js';
import { obtenerSorteo, totalRondas, obtenerMesasRonda } from './matchmaking-utils.js';

const CLASE_TAB_ACTIVA = "px-6 py-2 rounded font-orbitron font-bold bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)] transition-all";
const CLASE_TAB_INACTIVA = "px-6 py-2 rounded font-orbitron font-bold bg-slate-800 text-slate-400 hover:text-white transition-all";

document.addEventListener('DOMContentLoaded', () => {
    const zonaA = document.getElementById('zona-a');
    const zonaB = document.getElementById('zona-b');
    const textoRonda = document.getElementById('texto-ronda');
    const textoEstado = document.getElementById('texto-estado');
    const contenedorTabs = document.getElementById('tabs-fases');

    const fasesConMesas = obtenerFases().filter(f => f.registro === 'mesas');
    let faseActiva = fasesConMesas[0];
    let ultimaRondaRenderizada = 0;

    // --- MANEJO DE PESTAÑAS (una por cada fase con mesas) ---
    contenedorTabs.innerHTML = fasesConMesas.map(f =>
        `<button data-fase="${f.numero}" class="${CLASE_TAB_INACTIVA}">FASE ${f.numero}: ${f.nombre.toUpperCase()}</button>`
    ).join('');

    const tabs = contenedorTabs.querySelectorAll('button');
    function activarTab(numero) {
        faseActiva = obtenerFase(numero);
        ultimaRondaRenderizada = 0; // Forzar re-render con animación
        tabs.forEach(t => { t.className = t.dataset.fase === String(numero) ? CLASE_TAB_ACTIVA : CLASE_TAB_INACTIVA; });
        renderizarEspectador();
    }
    tabs.forEach(t => t.addEventListener('click', () => activarTab(t.dataset.fase)));

    // --- FUNCIÓN DE RENDERIZADO PRINCIPAL ---
    function renderizarEspectador() {
        if (!faseActiva) {
            textoRonda.textContent = 'SIN FASES CON MESAS';
            textoEstado.textContent = 'Configura una fase con registro por mesas';
            return;
        }

        const sorteo = obtenerSorteo(faseActiva.numero);
        const carrusel = JSON.parse(localStorage.getItem(`carrusel_f${faseActiva.numero}_cr`));

        if (!carrusel || sorteo.length === 0) {
            zonaA.innerHTML = '';
            zonaB.innerHTML = '';
            textoRonda.textContent = `ESPERANDO FASE ${faseActiva.numero}...`;
            textoEstado.textContent = "Sorteo pendiente";
            return;
        }

        const maxRondas = totalRondas(faseActiva, sorteo);
        const rondaActual = carrusel.rondaActual;
        const esFinDeFase = rondaActual > maxRondas;
        const rondaMostrar = esFinDeFase ? maxRondas : rondaActual;

        // Actualizar Textos Centrales
        if (esFinDeFase) {
            textoRonda.textContent = `FASE ${faseActiva.numero} COMPLETADA`;
            textoEstado.textContent = "Revisa la tabla global para ver a los clasificados";
            textoRonda.classList.replace('text-white', 'text-emerald-400');
        } else {
            textoRonda.textContent = `RONDA ${rondaMostrar}`;
            textoEstado.textContent = "Enfrentamientos en curso";
            textoRonda.classList.replace('text-emerald-400', 'text-white');
        }

        // Detectar si hubo cambio de ronda para lanzar animación
        const animar = rondaMostrar !== ultimaRondaRenderizada;
        ultimaRondaRenderizada = rondaMostrar;

        const mesas = obtenerMesasRonda(faseActiva, sorteo, rondaMostrar);
        const ganadoresRonda = (carrusel.ganadoresPorRonda && carrusel.ganadoresPorRonda[`ronda_${rondaMostrar}`]) || {};

        zonaA.innerHTML = '';
        zonaB.innerHTML = '';

        mesas.forEach((m) => {
            const ganadorId = ganadoresRonda[m.mesa];

            // Determinar estados (Verde para ganador, Rojo para perdedor, Neutral si no hay ganador aún)
            const estadoA = ganadorId === m.jugadorA.id ? 'ganador border-emerald-500 bg-emerald-900/40 text-emerald-100' : (ganadorId ? 'perdedor border-red-500 bg-red-900/20 text-red-200' : 'border-slate-600 bg-[#121a2d]/90 text-white');
            const estadoB = ganadorId === m.jugadorB.id ? 'ganador border-emerald-500 bg-emerald-900/40 text-emerald-100' : (ganadorId ? 'perdedor border-red-500 bg-red-900/20 text-red-200' : 'border-slate-600 bg-[#121a2d]/90 text-white');

            // Iconos dinámicos
            const iconA = ganadorId === m.jugadorA.id ? '<i class="fa-solid fa-check-circle text-emerald-400 text-xl"></i>' : (ganadorId ? '<i class="fa-solid fa-xmark text-red-500 text-xl"></i>' : `<span class="text-slate-500 font-mono text-xs">MESA ${m.mesa}</span>`);
            const iconB = ganadorId === m.jugadorB.id ? '<i class="fa-solid fa-check-circle text-emerald-400 text-xl"></i>' : (ganadorId ? '<i class="fa-solid fa-xmark text-red-500 text-xl"></i>' : `<span class="text-slate-500 font-mono text-xs">MESA ${m.mesa}</span>`);

            // Tarjeta Zona A (Superior)
            zonaA.innerHTML += `
                <div class="jugador-card w-48 p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center shadow-lg ${estadoA} ${animar ? 'rotacion-anim' : ''}">
                    ${iconA}
                    <h3 class="font-orbitron font-bold text-lg mt-2 truncate w-full">${m.jugadorA.gamertag}</h3>
                </div>
            `;

            // Tarjeta Zona B (Inferior)
            zonaB.innerHTML += `
                <div class="jugador-card w-48 p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center shadow-lg ${estadoB} ${animar ? 'rotacion-anim' : ''}">
                    <h3 class="font-orbitron font-bold text-lg mb-2 truncate w-full">${m.jugadorB.gamertag}</h3>
                    ${iconB}
                </div>
            `;
        });
    }

    if (faseActiva) activarTab(faseActiva.numero);
    else renderizarEspectador();

    // --- LOOP DE SINCRONIZACIÓN EN TIEMPO REAL ---
    // Lee los cambios del localStorage 2 veces por segundo (ideal para multipantalla local)
    setInterval(renderizarEspectador, 500);
});
