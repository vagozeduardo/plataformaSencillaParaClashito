// duelos-controller.js
import { generarEnfrentamientosFase, obtenerEnfrentamientosFase, obtenerEstadoCarruselF3, obtenerMesasRondaActual, rotarCarruselSiguienteRonda } from './matchmaking-utils.js';
import { obtenerJugadores, guardarJugadores } from './storage-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Referencias Originales
    const contenedor = document.getElementById('contenedor-duelos');
    const btnSortear = document.getElementById('btn-sortear');
    const btnExportarDuelos = document.getElementById('btn-exportar-duelos');
    const inputImportarDuelos = document.getElementById('input-importar-duelos');

    // Referencias Nuevas (Carrusel)
    const seccionCarrusel = document.getElementById('seccion-carrusel');
    const contenedorCarrusel = document.getElementById('contenedor-carrusel');
    const badgeRonda = document.getElementById('badge-ronda');
    const btnSiguienteRonda = document.getElementById('btn-siguiente-ronda');

    // --- 1. FUNCIÓN ORIGINAL: RENDERIZAR TARJETAS ESTÁTICAS ---
    function renderizarTarjetasDuelos() {
        const duelos = obtenerEnfrentamientosFase(3);
        contenedor.innerHTML = '';

        if (duelos.length === 0) {
            if (btnSortear) {
                btnSortear.disabled = false;
                btnSortear.className = "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-900 font-orbitron font-bold px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(0,210,255,0.4)] flex items-center gap-2 transition-all cursor-pointer";
                btnSortear.innerHTML = '<i class="fa-solid fa-dice text-lg"></i> Realizar Sorteo Aleatorio';
            }
            contenedor.innerHTML = `
                <div class="col-span-full text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
                    <i class="fa-solid fa-dice-d6 text-4xl text-slate-600 mb-3"></i>
                    <p class="text-slate-400 font-orbitron">Presiona "Realizar Sorteo Aleatorio" para armar los duelos iniciales.</p>
                </div>
            `;
            if (seccionCarrusel) seccionCarrusel.classList.add('hidden'); // Ocultar carrusel
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

        // Mostrar carrusel interactivo al tener duelos
        if (seccionCarrusel) seccionCarrusel.classList.remove('hidden');
        renderizarCarruselInteractivo();
    }

    // --- 2. NUEVA FUNCIÓN: RENDERIZAR CARRUSEL (Abajo) ---
    function renderizarCarruselInteractivo() {
        const carrusel = obtenerEstadoCarruselF3();
        if (!carrusel || !contenedorCarrusel) return;

        const mesas = obtenerMesasRondaActual();
        if (badgeRonda) badgeRonda.textContent = `RONDA ${carrusel.rondaActual} DE 5`;

        contenedorCarrusel.innerHTML = '';

        mesas.forEach((m) => {
            const htmlMesa = `
                <div class="bg-[#121a2d]/90 border border-emerald-500/30 rounded-xl p-4 shadow-lg relative flex flex-col justify-between">
                    <span class="text-[11px] font-orbitron text-emerald-400 font-bold uppercase tracking-wider mb-3 block">
                        📍 MESA #${m.mesa}
                    </span>
                    <div class="grid grid-cols-2 gap-3 items-center">
                        <button onclick="marcarGanadorMesa('${m.jugadorA.id}', this)" 
                                class="p-3 bg-slate-800/80 hover:bg-emerald-500/20 hover:border-emerald-500/60 border border-slate-700 rounded-lg text-center transition-all group cursor-pointer">
                            <span class="text-[10px] text-slate-400 block font-mono">ZONA A</span>
                            <span class="font-orbitron font-bold text-slate-100 group-hover:text-emerald-400 text-sm block">${m.jugadorA.gamertag}</span>
                            <span class="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 font-bold uppercase block mt-1"><i class="fa-solid fa-trophy"></i> Victoria</span>
                        </button>
                        <button onclick="marcarGanadorMesa('${m.jugadorB.id}', this)" 
                                class="p-3 bg-slate-800/80 hover:bg-emerald-500/20 hover:border-emerald-500/60 border border-slate-700 rounded-lg text-center transition-all group cursor-pointer">
                            <span class="text-[10px] text-slate-400 block font-mono">ZONA B</span>
                            <span class="font-orbitron font-bold text-slate-100 group-hover:text-emerald-400 text-sm block">${m.jugadorB.gamertag}</span>
                            <span class="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 font-bold uppercase block mt-1"><i class="fa-solid fa-trophy"></i> Victoria</span>
                        </button>
                    </div>
                </div>
            `;
            contenedorCarrusel.innerHTML += htmlMesa;
        });
    }

    // --- 3. EVENTOS Y LÓGICA DE ROTACIÓN ---
    window.marcarGanadorMesa = function(idGanador, botonHtml) {
        let jugadores = obtenerJugadores();
        const idxG = jugadores.findIndex(j => j.id === idGanador);
        if (idxG !== -1) {
            if (!jugadores[idxG].victorias) jugadores[idxG].victorias = {};
            jugadores[idxG].victorias.f3 = (jugadores[idxG].victorias.f3 || 0) + 1;
            guardarJugadores(jugadores);
            
            botonHtml.classList.replace('border-slate-700', 'border-emerald-400');
            botonHtml.classList.replace('bg-slate-800/80', 'bg-emerald-500/20');
        }
    };

    if (btnSiguienteRonda) {
        btnSiguienteRonda.addEventListener('click', () => {
            const estado = rotarCarruselSiguienteRonda();
            if (estado) {
                renderizarCarruselInteractivo();
            } else {
                alert("Has completado las 5 rondas. Todos los jugadores han competido entre sí.");
            }
        });
    }

    // --- 4. EVENTOS ORIGINALES (Sorteo, Importar, Exportar) ---
    if (btnSortear) {
        btnSortear.addEventListener('click', () => {
            generarEnfrentamientosFase(3);
            renderizarTarjetasDuelos();
        });
    }

    if (btnExportarDuelos) {
        btnExportarDuelos.addEventListener('click', () => {
            const duelosRaw = localStorage.getItem('enfrentamientos_f3_cr');
            if (!duelosRaw || duelosRaw === '[]') return alert("Aún no se han generado los duelos para exportar.");
            const duelosFormateados = JSON.stringify(JSON.parse(duelosRaw), null, 2);
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(duelosFormateados);
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `Duelos_Fase3_ClashRoyale_${new Date().toISOString().slice(0, 10)}.json`);
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
                        localStorage.setItem('enfrentamientos_f3_cr', JSON.stringify(datosValidados));
                        alert("¡Duelos de Fase 3 importados con éxito!");
                        renderizarTarjetasDuelos();
                    }
                } catch (err) { alert("Error al leer el archivo JSON."); }
            };
            reader.readAsText(file);
        });
    }

    renderizarTarjetasDuelos();
});