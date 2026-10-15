// spectator.js - Módulo para la vista pública en tiempo real
import { obtenerJugadores } from './storage-utils.js';
import { inicializarToggleHeader } from './ui-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const listaJugadoresContainer = document.getElementById('lista-jugadores');
    const tabs = document.querySelectorAll('.tab-fase');
    const tituloFase = document.getElementById('titulo-fase');
    const descFase = document.getElementById('desc-fase');

    let faseActual = "1";

    const infoFases = {
        "1": { titulo: "Fase 1: Todos vs Todos", desc: "Combate general. <span class='text-amber-400 font-bold'>Solo los primeros 15 avanzan a F2.</span>" },
        "2": { titulo: "Fase 2: X3 Elixir", desc: "Locura de elixir. <span class='text-amber-400 font-bold'>Solo los 10 mejores sobreviven y avanzan a F3.</span>" },
        "3": { titulo: "Fase 3: Modo Dios", desc: "Todos contra todos extremo. <span class='text-amber-400 font-bold'>Pasan los 4 con más victorias.</span>" },
        "4": { titulo: "Fase 4: Semifinal (Mejor de 3)", desc: "Enfrentamiento directo entre los 4 mejores. <span class='text-amber-400 font-bold'>Los 2 ganadores van a la final.</span>" },
        "5": { titulo: "Fase 5: Gran Final", desc: "El duelo definitivo por la corona galáctica. <span class='text-amber-400 font-bold'>Al mejor de 5.</span>" },
        "6": { titulo: "🏆 Campeón Absoluto", desc: "El gran ganador del torneo de clashito." }
    };

    function renderizarJugadoresPublico() {
        const jugadores = obtenerJugadores();
        listaJugadoresContainer.innerHTML = '';

        // NUEVO: Lógica exclusiva para la pestaña de Campeón (Fase 6)
        if (faseActual === "6") {
            const campeon = jugadores.find(j => j.fase_maxima >= 6);
            if (campeon) {
                listaJugadoresContainer.innerHTML = `
                    <div class="py-12 px-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-[#121a2d] to-[#0a0f1d] border-2 border-amber-400/60 text-center shadow-[0_0_35px_rgba(251,191,36,0.25)] flex flex-col items-center justify-center my-4 animate-fade-in">
                        <div class="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center border-2 border-amber-400 mb-4 shadow-[0_0_20px_#fbbf24]">
                            <i class="fa-solid fa-trophy text-4xl text-amber-400"></i>
                        </div>
                        <span class="text-xs font-bold font-orbitron text-amber-400 uppercase tracking-[0.3em] mb-1">¡CAMPEÓN ABSOLUTO DEL TORNEO!</span>
                        <h2 class="text-4xl md:text-5xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 uppercase tracking-wider mb-2">${campeon.gamertag}</h2>
                        <p class="text-sm text-slate-300 font-mono bg-slate-900/80 px-4 py-1 rounded-full border border-slate-700/60 mb-6">
                            <i class="fa-solid fa-user text-amber-400 mr-1.5"></i>${campeon.nombre} <span class="text-slate-500">|</span> ${campeon.tag_jugador}
                        </p>
                    </div>
                `;
            } else {
                listaJugadoresContainer.innerHTML = `
                    <div class="text-center py-12 border-2 border-dashed border-slate-700 rounded-lg">
                        <i class="fa-solid fa-crown text-4xl text-slate-600 mb-3"></i>
                        <p class="text-slate-400 font-orbitron">El campeón aún no ha sido proclamado.</p>
                    </div>
                `;
            }
            return;
        }

        const claveFase = `f${faseActual}`;
        const jugadoresEnFase = jugadores.filter(j => j.fase_maxima >= parseInt(faseActual));

        if (jugadoresEnFase.length === 0) {
            listaJugadoresContainer.innerHTML = `
                <div class="text-center py-12 border-2 border-dashed border-slate-700 rounded-lg">
                    <i class="fa-solid fa-ghost text-4xl text-slate-600 mb-3"></i>
                    <p class="text-slate-400 font-orbitron">Esperando inicio o clasificación de jugadores...</p>
                </div>
            `;
            return;
        }

        jugadoresEnFase.sort((a, b) => (b.victorias[claveFase] || 0) - (a.victorias[claveFase] || 0));

        jugadoresEnFase.forEach((jugador, index) => {
            const esCampeon = jugador.fase_maxima >= 6;
            const esEliminado = jugador.estado === 'eliminado';
            const estaDeshabilitado = jugador.habilitado === false || esEliminado || esCampeon;
            const posicion = index + 1;
            const victoriasActuales = jugador.victorias[claveFase] || 0;

            let divClases = 'flex items-center justify-between p-3.5 rounded-lg border border-[#00d2ff]/30 bg-[#00d2ff]/5';
            
            if (esCampeon) {
                divClases = 'flex items-center justify-between p-4 rounded-lg border-2 border-amber-400/80 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.25)]';
            } else if (estaDeshabilitado) {
                divClases = 'flex items-center justify-between p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/5 opacity-60';
            }

            const textoNombreClases = esCampeon 
                ? 'font-bold text-amber-300 font-orbitron text-xl' 
                : (estaDeshabilitado ? 'font-bold text-slate-400 line-through' : 'font-bold text-slate-100 text-base');

            const badgeClases = esCampeon 
                ? 'text-xs text-amber-400 font-bold uppercase tracking-wider' 
                : (estaDeshabilitado ? 'text-xs text-rose-500 font-bold uppercase' : 'text-xs text-slate-500 font-mono');
            
            let badgeTexto = jugador.tag_jugador;

            if (esCampeon) {
                badgeTexto = '🏆 1° LUGAR - CAMPEÓN ABSOLUTO DEL TORNEO';
            } else if (jugador.estado === 'eliminado') {
                badgeTexto = (jugador.fase_maxima === 5) ? '🥈 2° LUGAR - SUBCAMPEÓN' : `ELIMINADO EN FASE ${jugador.fase_maxima}`;
            } else if (jugador.habilitado === false) {
                badgeTexto = 'DESHABILITADO';
            }

            // HTML LIMPIO SIN BOTONES
            const HTMLJugador = `
                <div class="${divClases}">
                    <div class="flex items-center gap-4">
                        <span class="font-orbitron font-bold text-${esCampeon ? 'amber-400 text-xl' : (posicion <= 3 ? 'amber-400 text-lg' : 'slate-300')} w-8 text-center">
                            ${esCampeon ? '<i class="fa-solid fa-crown text-amber-400"></i>' : `#${posicion}`}
                        </span>
                        <div>
                            <p class="${textoNombreClases}">${jugador.gamertag}</p>
                            <p class="${badgeClases}">${badgeTexto}</p>
                        </div>
                    </div>
                    <div class="text-right pr-4">
                        <p class="text-[10px] text-slate-400 uppercase tracking-wider font-orbitron">Victorias</p>
                        <p class="font-bold text-xl ${esCampeon ? 'text-amber-400 font-orbitron' : (estaDeshabilitado ? 'text-slate-500' : 'text-[#00d2ff]')}">
                            ${victoriasActuales}
                        </p>
                    </div>
                </div>
            `;
            listaJugadoresContainer.innerHTML += HTMLJugador;
        });
    }

    // NUEVA FUNCIÓN: Actualiza el badge visual leyendo localStorage
    function actualizarBadgeEspectador() {
        const estado = localStorage.getItem('torneo_estado_cr') || 'en_curso';
        const led = document.getElementById('espectador-led');
        const texto = document.getElementById('espectador-texto');
        
        if (!led || !texto) return;

        if (estado === 'en_curso') {
            led.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse";
            texto.textContent = "TRANSMISIÓN EN VIVO";
            texto.className = "font-orbitron text-xs font-bold text-emerald-400 uppercase tracking-wider";
        } else {
            led.className = "w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]";
            texto.textContent = "FASE CONCLUIDA";
            texto.className = "font-orbitron text-xs font-bold text-rose-400 uppercase tracking-wider";
        }
    }

    // --- ESCUCHAR CAMBIOS EN TIEMPO REAL DESDE OTRA PESTAÑA / MONITOR ---
    window.addEventListener('storage', (e) => {
        if (e.key === 'jugadores_cr') {
            renderizarJugadoresPublico();
        }
        if(e.key === 'torneo_estado_cr') {
            actualizarBadgeEspectador();
        }
    });

    // Pestañas navegables manualmente por el espectador si lo desea
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabClickeada = e.currentTarget;
            tabs.forEach(t => {
                t.classList.remove('text-[#00d2ff]', 'border-b-2', 'border-[#00d2ff]', 'bg-[#00d2ff]/10');
                t.classList.add(t.getAttribute('data-fase') === "5" ? 'text-amber-500' : 'text-slate-500');
            });

            faseActual = tabClickeada.getAttribute('data-fase');
            tabClickeada.classList.remove('text-slate-500', 'text-amber-500');
            tabClickeada.classList.add('text-[#00d2ff]', 'border-b-2', 'border-[#00d2ff]', 'bg-[#00d2ff]/10');

            tituloFase.innerHTML = infoFases[faseActual].titulo;
            descFase.innerHTML = infoFases[faseActual].desc;

            renderizarJugadoresPublico();
        });
    });

    inicializarToggleHeader();
    renderizarJugadoresPublico();
    actualizarBadgeEspectador();
});