// duelos4-controller.js
import { 
    generarEnfrentamientosFase4, 
    obtenerEnfrentamientosFase4, 
    obtenerEstadoCarruselF4, 
    obtenerMesasRondaActualF4, 
    avanzarRondaCarruselF4 
} from './matchmaking-utils.js';
import { obtenerJugadores, guardarJugadores } from './storage-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('contenedor-duelos');
    const btnSortear = document.getElementById('btn-sortear');
    const btnExportarDuelos = document.getElementById('btn-exportar-duelos');
    const inputImportarDuelos = document.getElementById('input-importar-duelos');

    const seccionCarrusel = document.getElementById('seccion-carrusel');
    const contenedorCarrusel = document.getElementById('contenedor-carrusel');
    const badgeRonda = document.getElementById('badge-ronda');
    const btnSiguienteRonda = document.getElementById('btn-siguiente-ronda');

    function renderizarTarjetasDuelos() {
        const duelos = obtenerEnfrentamientosFase4();
        contenedor.innerHTML = '';

        if (duelos.length === 0) {
            if (btnSortear) {
                btnSortear.disabled = false;
                btnSortear.className = "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-900 font-orbitron font-bold px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(0,210,255,0.4)] flex items-center gap-2 transition-all cursor-pointer";
                btnSortear.innerHTML = '<i class="fa-solid fa-dice text-lg"></i> Realizar Sorteo Inicial';
            }
            contenedor.innerHTML = `
                <div class="col-span-full text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
                    <i class="fa-solid fa-dice-d6 text-4xl text-slate-600 mb-3"></i>
                    <p class="text-slate-400 font-orbitron">Presiona "Realizar Sorteo Inicial" para armar los cruces de la Semifinal.</p>
                </div>
            `;
            if (seccionCarrusel) seccionCarrusel.classList.add('hidden');
            return;
        }

        if (btnSortear) {
            btnSortear.disabled = true;
            btnSortear.className = "bg-slate-800 border border-slate-700 text-slate-500 font-orbitron font-bold px-5 py-2.5 rounded-xl opacity-60 cursor-not-allowed flex items-center gap-2";
            btnSortear.innerHTML = '<i class="fa-solid fa-lock text-sm"></i> Sorteo Concluido';
        }

        duelos.forEach((duelo) => {
            const htmlTarjeta = `
                <div class="bg-[#121a2d]/90 border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_15px_rgba(0,210,255,0.08)] flex items-center justify-between relative overflow-hidden">
                    <span class="absolute top-2 left-3 text-[10px] font-orbitron text-cyan-400 uppercase tracking-widest">
                        MESA #${duelo.mesa}
                    </span>
                    <div class="flex-1 text-center pt-3">
                        <p class="font-orbitron font-bold text-slate-100 text-lg">${duelo.jugador1.gamertag}</p>
                        <p class="text-xs text-slate-400 font-mono">${duelo.jugador1.nombre} (${duelo.jugador1.tag_jugador})</p>
                    </div>
                    <div class="px-4 flex flex-col items-center pt-2">
                        <span class="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 text-amber-400 font-orbitron font-black flex items-center justify-center text-sm shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                            VS
                        </span>
                    </div>
                    <div class="flex-1 text-center pt-3">
                        <p class="font-orbitron font-bold text-slate-100 text-lg">${duelo.jugador2.gamertag}</p>
                        <p class="text-xs text-slate-400 font-mono">${duelo.jugador2.nombre} (${duelo.jugador2.tag_jugador})</p>
                    </div>
                </div>
            `;
            contenedor.innerHTML += htmlTarjeta;
        });

        if (seccionCarrusel) seccionCarrusel.classList.remove('hidden');
        renderizarCarruselInteractivo();
    }

    // --- MARCAR GANADOR (BORRADOR CON TOGGLE) ---
    window.marcarGanadorMesa = function(idGanador, idMesa) {
        let carrusel = obtenerEstadoCarruselF4();
        if (!carrusel || carrusel.rondaActual > 3) return;

        if (!carrusel.ganadoresPorRonda) carrusel.ganadoresPorRonda = {};
        const claveRonda = `ronda_${carrusel.rondaActual}`;
        if (!carrusel.ganadoresPorRonda[claveRonda]) carrusel.ganadoresPorRonda[claveRonda] = {};

        if (carrusel.ganadoresPorRonda[claveRonda][idMesa] === idGanador) {
            delete carrusel.ganadoresPorRonda[claveRonda][idMesa];
        } else {
            carrusel.ganadoresPorRonda[claveRonda][idMesa] = idGanador;
        }

        localStorage.setItem('carrusel_f4_cr', JSON.stringify(carrusel));
        renderizarCarruselInteractivo();
    };

    function renderizarCarruselInteractivo() {
        const carrusel = obtenerEstadoCarruselF4();
        if (!carrusel || !contenedorCarrusel) return;

        const mesas = obtenerMesasRondaActualF4();
        const claveRonda = `ronda_${carrusel.rondaActual}`;
        const ganadoresRonda = (carrusel.ganadoresPorRonda && carrusel.ganadoresPorRonda[claveRonda]) || {};

        if (badgeRonda) badgeRonda.textContent = `RONDA ${carrusel.rondaActual} DE 3`;

        if (carrusel.rondaActual > 3) {
            if (badgeRonda) badgeRonda.textContent = `¡FASE 4 COMPLETA! (3/3 RONDAS)`;
            if (btnSiguienteRonda) {
                btnSiguienteRonda.disabled = true;
                btnSiguienteRonda.className = "bg-slate-800 border border-slate-700 text-slate-500 font-orbitron font-bold px-4 py-2 rounded-lg opacity-50 cursor-not-allowed";
                btnSiguienteRonda.innerHTML = '<i class="fa-solid fa-check-double"></i> Rondas Concluidas';
            }
        }

        contenedorCarrusel.innerHTML = '';

        mesas.forEach((m) => {
            const ganadorMesaId = ganadoresRonda[m.mesa];
            const estadoG_A = ganadorMesaId === m.jugadorA.id;
            const estadoG_B = ganadorMesaId === m.jugadorB.id;

            const btnClassA = estadoG_A
                ? 'p-3 bg-emerald-500/20 border-2 border-emerald-400 rounded-lg text-center font-bold transition-all group cursor-pointer shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                : (carrusel.rondaActual > 3
                    ? 'p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-center opacity-40 cursor-not-allowed'
                    : 'p-3 bg-slate-800/80 hover:bg-emerald-500/10 border border-slate-700 rounded-lg text-center transition-all group cursor-pointer');

            const btnClassB = estadoG_B
                ? 'p-3 bg-emerald-500/20 border-2 border-emerald-400 rounded-lg text-center font-bold transition-all group cursor-pointer shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                : (carrusel.rondaActual > 3
                    ? 'p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-center opacity-40 cursor-not-allowed'
                    : 'p-3 bg-slate-800/80 hover:bg-emerald-500/10 border border-slate-700 rounded-lg text-center transition-all group cursor-pointer');

            const htmlMesa = `
                <div class="bg-[#121a2d]/90 border ${ganadorMesaId ? 'border-emerald-500/50' : 'border-cyan-500/30'} rounded-xl p-4 shadow-lg relative flex flex-col justify-between">
                    <span class="text-[11px] font-orbitron ${ganadorMesaId ? 'text-emerald-400' : 'text-cyan-400'} font-bold uppercase tracking-wider mb-3 block">
                        📍 MESA #${m.mesa} ${ganadorMesaId ? '✓ (SELECCIONADO)' : ''}
                    </span>
                    <div class="grid grid-cols-2 gap-3 items-center">
                        <button ${carrusel.rondaActual > 3 ? 'disabled' : ''} 
                                onclick="marcarGanadorMesa('${m.jugadorA.id}', ${m.mesa})" 
                                class="${btnClassA}">
                            <span class="text-[10px] text-slate-400 block font-mono">LADO A</span>
                            <span class="font-orbitron font-bold text-slate-100 group-hover:text-emerald-400 text-sm block">${m.jugadorA.gamertag}</span>
                            <span class="text-[10px] text-emerald-400 ${estadoG_A ? 'block' : 'opacity-0 group-hover:opacity-100'} font-bold uppercase mt-1">
                                ${estadoG_A ? '🏆 GANADOR (Clic p/ quitar)' : '<i class="fa-solid fa-trophy"></i> Seleccionar'}
                            </span>
                        </button>

                        <button ${carrusel.rondaActual > 3 ? 'disabled' : ''} 
                                onclick="marcarGanadorMesa('${m.jugadorB.id}', ${m.mesa})" 
                                class="${btnClassB}">
                            <span class="text-[10px] text-slate-400 block font-mono">LADO B</span>
                            <span class="font-orbitron font-bold text-slate-100 group-hover:text-emerald-400 text-sm block">${m.jugadorB.gamertag}</span>
                            <span class="text-[10px] text-emerald-400 ${estadoG_B ? 'block' : 'opacity-0 group-hover:opacity-100'} font-bold uppercase mt-1">
                                ${estadoG_B ? '🏆 GANADOR (Clic p/ quitar)' : '<i class="fa-solid fa-trophy"></i> Seleccionar'}
                            </span>
                        </button>
                    </div>
                </div>
            `;
            contenedorCarrusel.innerHTML += htmlMesa;
        });
    }

    // --- ACCIÓN "SIGUIENTE RONDA" (SUMA EN VICTORIAS.F4 Y AVANZA) ---
    if (btnSiguienteRonda) {
        btnSiguienteRonda.addEventListener('click', () => {
            const carrusel = obtenerEstadoCarruselF4();
            if (!carrusel) return;

            const claveRonda = `ronda_${carrusel.rondaActual}`;
            const ganadoresRonda = (carrusel.ganadoresPorRonda && carrusel.ganadoresPorRonda[claveRonda]) || {};
            const listaIdsGanadores = Object.values(ganadoresRonda);

            if (listaIdsGanadores.length < 2) {
                alert(`Debes elegir a los ganadores de las 2 mesas antes de avanzar a la siguiente ronda. (Mesas seleccionadas: ${listaIdsGanadores.length}/2)`);
                return;
            }

            // Sumar +1 en victorias.f4 a los ganadores
            let jugadores = obtenerJugadores();
            listaIdsGanadores.forEach(idG => {
                const idx = jugadores.findIndex(j => j.id === idG);
                if (idx !== -1) {
                    if (!jugadores[idx].victorias) jugadores[idx].victorias = {};
                    jugadores[idx].victorias.f4 = (jugadores[idx].victorias.f4 || 0) + 1;
                }
            });
            guardarJugadores(jugadores);

            const estado = avanzarRondaCarruselF4();
            if (estado) {
                renderizarCarruselInteractivo();
            } else {
                carrusel.rondaActual = 4;
                localStorage.setItem('carrusel_f4_cr', JSON.stringify(carrusel));
                alert("¡Semifinal (Fase 4) completada! Todas las victorias se han guardado en la tabla general.");
                renderizarCarruselInteractivo();
            }
        });
    }

    // --- EVENTOS DE SORTEO, IMPORTAR Y EXPORTAR ---
    if (btnSortear) {
        btnSortear.addEventListener('click', () => {
            generarEnfrentamientosFase4();
            renderizarTarjetasDuelos();
        });
    }

    if (btnExportarDuelos) {
        btnExportarDuelos.addEventListener('click', () => {
            const duelosRaw = localStorage.getItem('enfrentamientos_f4_cr');
            if (!duelosRaw || duelosRaw === '[]') return alert("Aún no se han generado los duelos de Fase 4 para exportar.");
            const duelosFormateados = JSON.stringify(JSON.parse(duelosRaw), null, 2);
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(duelosFormateados);
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `Duelos_Fase4_ClashRoyale_${new Date().toISOString().slice(0, 10)}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        });
    }

    if (inputImportarDuelos) {
        inputImportarDuelos.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const datosValidados = JSON.parse(event.target.result);
                    if (Array.isArray(datosValidados)) {
                        localStorage.setItem('enfrentamientos_f4_cr', JSON.stringify(datosValidados));
                        alert("¡Duelos de Fase 4 importados con éxito!");
                        renderizarTarjetasDuelos();
                    }
                } catch (err) { alert("Error al leer el archivo JSON."); }
            };
            reader.readAsText(file);
        });
    }

    renderizarTarjetasDuelos();
});