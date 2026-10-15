import { generarEnfrentamientosFase, obtenerEnfrentamientosFase } from './matchmaking-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('contenedor-duelos');
    const btnSortear = document.getElementById('btn-sortear');

    function renderizarTarjetasDuelos() {
        const duelos = obtenerEnfrentamientosFase(3);
        contenedor.innerHTML = '';

        if (duelos.length === 0) {
            // Habilitar el botón principal si aún no hay duelos
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

                    <!-- Jugador 1 -->
                    <div class="flex-1 text-center pt-3">
                        <p class="font-orbitron font-bold text-slate-100 text-lg">${duelo.jugador1.gamertag}</p>
                        <p class="text-xs text-slate-400 font-mono">${duelo.jugador1.nombre} (${duelo.jugador1.tag_jugador})</p>
                    </div>

                    <!-- Insignia VS -->
                    <div class="px-4 flex flex-col items-center pt-2">
                        <span class="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 text-amber-400 font-orbitron font-black flex items-center justify-center text-sm shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                            VS
                        </span>
                    </div>

                    <!-- Jugador 2 -->
                    <div class="flex-1 text-center pt-3">
                        <p class="font-orbitron font-bold text-slate-100 text-lg">${duelo.jugador2.gamertag}</p>
                        <p class="text-xs text-slate-400 font-mono">${duelo.jugador2.nombre} (${duelo.jugador2.tag_jugador})</p>
                    </div>
                </div>
            `;
            contenedor.innerHTML += htmlTarjeta;
        });
    }

    if (btnSortear) {
        btnSortear.addEventListener('click', () => {
            generarEnfrentamientosFase(3);
            renderizarTarjetasDuelos();
        });
    }

    // --- EXPORTAR EXCLUSIVO DE DUELOS F3 ---
    const btnExportarDuelos = document.getElementById('btn-exportar-duelos');

    if (btnExportarDuelos) {
        btnExportarDuelos.addEventListener('click', () => {
            const duelosRaw = localStorage.getItem('enfrentamientos_f3_cr');
            if (!duelosRaw || duelosRaw === '[]') {
                alert("Aún no se han generado los duelos para exportar.");
                return;
            }

            const duelosFormateados = JSON.stringify(JSON.parse(duelosRaw), null, 2);
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(duelosFormateados);
            const downloadAnchor = document.createElement('a');
            const fecha = new Date().toISOString().slice(0, 10);

            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `Duelos_Fase3_ClashRoyale_${fecha}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        });
    }

    // EVENTO IMPORTAR DUELOS
    const inputImportarDuelos = document.getElementById('input-importar-duelos');

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
                    } else {
                        alert("El archivo no contiene un formato de duelos válido.");
                    }
                } catch (err) {
                    alert("Error al leer el archivo JSON.");
                }
            };
            reader.readAsText(file);
        });
    }

    renderizarTarjetasDuelos();
});