import {obtenerJugadores, guardarJugadores, inicializarRespaldoJSON} from './storage-utils.js';
import { inicializarToggleHeader, inicializarSwitchEstadoFase } from './ui-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const listaJugadoresContainer = document.getElementById('lista-jugadores');
    const btnFiltrar = document.getElementById('btn-filtrar');
    let mostrarEliminados = true;

    const btnAvanzarFase = document.getElementById('btn-avanzar-fase');
    
    // Límite de jugadores que califican a la siguiente fase
    const limitesClasificados = {
        "1": 15, // Pasan los mejores 15 a Fase 2
        "2": 10, // Pasan los mejores 10 a Fase 3
        "3": 4,  // Pasan los mejores 4 a Fase 4
        "4": 2   // Pasan los mejores 2 a la Final (Fase 5)
    };

    // --- LÓGICA DE NAVEGACIÓN ENTRE FASES ---
    const tabs = document.querySelectorAll('.tab-fase');
    const tituloFase = document.getElementById('titulo-fase');
    const descFase = document.getElementById('desc-fase');

    let faseActual = "1"; // Empezamos en la fase 1

    // Textos correspondientes a cada fase
    const infoFases = {
        "1": {
            titulo: "Fase 1: Todos vs Todos",
            desc: "Combate general. <span class='text-amber-400 font-bold'>Solo los primeros 15 avanzan a F2.</span>"
        },
        "2": {
            titulo: "Fase 2: X3 Elixir",
            desc: "Locura de elixir. <span class='text-amber-400 font-bold'>Solo los 10 mejores sobreviven y avanzan a F3.</span>"
        },
        "3": {
            titulo: "Fase 3: Modo Dios",
            desc: "Todos contra todos extremo. <span class='text-amber-400 font-bold'>Pasan los 4 con más victorias.</span>"
        },
        "4": {
            titulo: "Fase 4: Semifinal (Mejor de 3)",
            desc: "Enfrentamiento directo entre los 4 mejores. <span class='text-amber-400 font-bold'>Los 2 ganadores van a la final.</span>"
        },
        "5": {
            titulo: "Fase 5: Gran Final",
            desc: "El duelo definitivo por la corona galáctica. <span class='text-amber-400 font-bold'>Al mejor de 5.</span>"
        }
    };

    // Función principal para renderizar la lista
    function renderizarJugadores() {
        const jugadores = obtenerJugadores();
        listaJugadoresContainer.innerHTML = '';

        const campeon = jugadores.find(j => j.fase_maxima >= 6);

        // codigo para campeon
        if (faseActual === "5" && campeon) {
            listaJugadoresContainer.innerHTML = `
                <div class="py-12 px-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-[#121a2d] to-[#0a0f1d] border-2 border-amber-400/60 text-center shadow-[0_0_35px_rgba(251,191,36,0.25)] flex flex-col items-center justify-center my-4">
                    <div class="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center border-2 border-amber-400 mb-4 shadow-[0_0_20px_#fbbf24]">
                        <i class="fa-solid fa-trophy text-4xl text-amber-400"></i>
                    </div>
                    <span class="text-xs font-bold font-orbitron text-amber-400 uppercase tracking-[0.3em] mb-1">¡CAMPEÓN ABSOLUTO DEL TORNEO!</span>
                    <h2 class="text-4xl md:text-5xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 uppercase tracking-wider mb-2">${campeon.gamertag}</h2>
                    <p class="text-sm text-slate-300 font-mono bg-slate-900/80 px-4 py-1 rounded-full border border-slate-700/60 mb-6">
                        <i class="fa-solid fa-user text-amber-400 mr-1.5"></i>${campeon.nombre} <span class="text-slate-500">|</span> ${campeon.tag_jugador}
                    </p>
                    <div class="flex items-center gap-6 text-xs font-orbitron text-slate-400 border-t border-slate-800 pt-4">
                        <div>
                            <span class="block text-slate-500 text-[10px]">VICTORIAS FINAL</span>
                            <span class="text-emerald-400 font-bold text-base">${campeon.victorias.f5 || 0}</span>
                        </div>
                        <div class="h-6 w-[1px] bg-slate-800"></div>
                        <div>
                            <span class="block text-slate-500 text-[10px]">ESTADO</span>
                            <span class="text-amber-400 font-bold text-base"><i class="fa-solid fa-crown text-xs"></i> VICTORIOSO</span>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        const claveFase = `f${faseActual}`;
        const jugadoresEnFase = jugadores.filter(j => j.fase_maxima >= parseInt(faseActual));

        // Si no hay jugadores
        if (jugadoresEnFase.length === 0) {
            listaJugadoresContainer.innerHTML = `
                <div class="text-center py-12 border-2 border-dashed border-slate-700 rounded-lg">
                    <i class="fa-solid fa-ghost text-4xl text-slate-600 mb-3"></i>
                    <p class="text-slate-400 font-orbitron">Aún no hay jugadores clasificados en esta fase.</p>
                </div>
            `;
            return;
        }

        // Ordenar jugadores por victorias en la fase actual
        jugadoresEnFase.sort((a, b) => (b.victorias[claveFase] || 0) - (a.victorias[claveFase] || 0));

        // Generar el HTML para cada jugador
        jugadoresEnFase.forEach((jugador, index) => {
            if (!mostrarEliminados && jugador.estado === 'eliminado') {
                return; 
            }
            const esCampeon = jugador.fase_maxima >= 6;
            const esEliminado = jugador.estado === 'eliminado';
            const estaDeshabilitado = jugador.habilitado === false || esEliminado;
            const posicion = index + 1;
            const victoriasActuales = jugador.victorias[claveFase] || 0;

            // Clases CSS dinámicas  segun el estado del jugador
            let divClases = 'flex items-center justify-between p-3 rounded-lg border border-[#00d2ff]/30 bg-[#00d2ff]/5';
            
            if (esCampeon) {
                divClases = 'flex items-center justify-between p-3 rounded-lg border-2 border-amber-400/80 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.2)] cursor-pointer hover:bg-amber-500/20 transition-all';
            } else if (estaDeshabilitado) {
                divClases = 'flex items-center justify-between p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 opacity-60';
            }

            const textoNombreClases = esCampeon 
                ? 'font-bold text-amber-300 font-orbitron text-lg' 
                : (estaDeshabilitado ? 'font-bold text-slate-400 line-through' : 'font-bold text-slate-100');

            const badgeClases = esCampeon 
                ? 'text-xs text-amber-400 font-bold uppercase tracking-wider' 
                : (estaDeshabilitado ? 'text-xs text-rose-500 font-bold uppercase' : 'text-xs text-slate-500 font-mono');
            
            // CORREGIDO: Declarado como let para permitir reasignación
            let badgeTexto = jugador.tag_jugador;

            if(esCampeon){
                badgeTexto = '🏆 1° LUGAR - CAMPEÓN ABSOLUTO (Clic para ver trofeo)';
            }else if (jugador.estado === 'eliminado') {
                if(jugador.fase_maxima === 5){
                    badgeTexto = '🥈 2° LUGAR - SUBCAMPEÓN';
                }else{
                    badgeTexto = `ELIMINADO EN FASE ${jugador.fase_maxima}`;
                }
            } else if (jugador.habilitado === false) {
                badgeTexto = 'DESHABILITADO EN FASE';
            }

            // Bloqueo de botones de sumar/restar
            const estadoBotones = estaDeshabilitado ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-500 hover:text-white transition-all';
            const estadoBotonRestar = estaDeshabilitado ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-500 hover:text-white transition-all';

            const HTMLJugador = `
                <div class="${divClases}">
                    <div class="flex items-center gap-4">
                        <span class="font-orbitron font-bold text-${posicion <= 3 ? 'amber-400' : 'slate-300'} w-6 text-center">#${posicion}</span>
                        <div>
                            <p class="${textoNombreClases}">${jugador.gamertag}</p>
                            <p class="${badgeClases}">${badgeTexto}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-6">
                        <div class="text-center">
                            <p class="text-xs text-slate-400">Victorias</p>
                            <p class="font-bold text-${estaDeshabilitado ? 'slate-500' : '[#00d2ff]'}">${victoriasActuales}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="sumarVictoria('${jugador.id}')" class="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 ${estadoBotones}" ${estaDeshabilitado ? 'disabled' : ''} title="Sumar victoria">
                                <i class="fa-solid fa-plus"></i>
                            </button>

                            <button onclick="restarVictoria('${jugador.id}')" class="w-8 h-8 rounded bg-amber-500/20 text-amber-400 border border-amber-500/50 ${estadoBotonRestar}" ${estaDeshabilitado ? 'disabled' : ''} title="Restar victoria">
                                <i class="fa-solid fa-minus"></i>
                            </button>

                            <button onclick="eliminarJugador('${jugador.id}')" class="w-8 h-8 rounded ${estaDeshabilitado ? 'bg-rose-500 text-white border border-rose-500' : 'bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500 hover:text-white'} transition-all" title="Deshabilitar/Habilitar">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            listaJugadoresContainer.innerHTML += HTMLJugador;
        });
    }

    // --- Funciones Globales para los botones ---
    window.sumarVictoria = function(id) {
        let jugadores = obtenerJugadores();
        const jugadorIndex = jugadores.findIndex(j => j.id === id);
        
        if (jugadorIndex !== -1 && jugadores[jugadorIndex].estado !== 'eliminado' && jugadores[jugadorIndex].habilitado !== false) {
            const claveFase = `f${faseActual}`;
            if (!jugadores[jugadorIndex].victorias) jugadores[jugadorIndex].victorias = {};
            
            jugadores[jugadorIndex].victorias[claveFase] = (jugadores[jugadorIndex].victorias[claveFase] || 0) + 1;
            guardarJugadores(jugadores);
            renderizarJugadores();
        }
    };

    
    window.restarVictoria = function(id) {
        let jugadores = obtenerJugadores();
        const jugadorIndex = jugadores.findIndex(j => j.id === id);
        
        if (jugadorIndex !== -1 && jugadores[jugadorIndex].estado !== 'eliminado' && jugadores[jugadorIndex].habilitado !== false) {
            const claveFase = `f${faseActual}`;
            if (jugadores[jugadorIndex].victorias && jugadores[jugadorIndex].victorias[claveFase] > 0) {
                jugadores[jugadorIndex].victorias[claveFase] -= 1;
                guardarJugadores(jugadores);
                renderizarJugadores();
            }
        }
    };

    window.eliminarJugador = function(id) {
        let jugadores = obtenerJugadores();
        const jugadorIndex = jugadores.findIndex(j => j.id === id);
        
        if (jugadorIndex !== -1) {
            // Alternar variable habilitado
            const estaHabilitado = jugadores[jugadorIndex].habilitado !== false;
            jugadores[jugadorIndex].habilitado = !estaHabilitado;
            guardarJugadores(jugadores);
            renderizarJugadores();
        }
    };

    // Funcionalidad del botón Filtrar
    btnFiltrar.addEventListener('click', () => {
        mostrarEliminados = !mostrarEliminados;
        if (mostrarEliminados) {
            btnFiltrar.innerHTML = '<i class="fa-solid fa-filter"></i> Ocultar Eliminados';
            btnFiltrar.classList.remove('bg-slate-700');
        } else {
            btnFiltrar.innerHTML = '<i class="fa-solid fa-filter-circle-xmark"></i> Mostrar Eliminados';
            btnFiltrar.classList.add('bg-slate-700');
        }
        renderizarJugadores();
    });

    // Pestañas
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabClickeada = e.currentTarget;
            tabs.forEach(t => {
                t.classList.remove('text-[#00d2ff]', 'border-b-2', 'border-[#00d2ff]', 'bg-[#00d2ff]/10');
                if (t.getAttribute('data-fase') === "5") {
                    t.classList.add('text-amber-500');
                } else {
                    t.classList.add('text-slate-500');
                }
            });

            faseActual = tabClickeada.getAttribute('data-fase');
            tabClickeada.classList.remove('text-slate-500', 'text-amber-500');
            tabClickeada.classList.add('text-[#00d2ff]', 'border-b-2', 'border-[#00d2ff]', 'bg-[#00d2ff]/10');

            tituloFase.innerHTML = infoFases[faseActual].titulo;
            descFase.innerHTML = infoFases[faseActual].desc;

            renderizarJugadores();
        });
    });

    // --- LÓGICA PARA AVANZAR A LA SIGUIENTE FASE ---
    btnAvanzarFase.addEventListener('click', () => {
        
        const numFaseActual = parseInt(faseActual);
        let jugadores = obtenerJugadores();
        const claveFase = `f${faseActual}`;

        // verificar si hay campeon
        if (numFaseActual === 5) {
                    const yaHayCampeon = jugadores.some(j => j.fase_maxima >= 6);
                    if (yaHayCampeon) {
                        alert("El torneo de Clash Royale ya ha concluido.");
                        return;
                    }
                    const finalistas = jugadores.filter(j => j.fase_maxima >= 5 && j.estado !== 'eliminado');
                    if (finalistas.length === 0) return alert("No hay finalistas activos en la Fase 5.");
        
                    finalistas.sort((a, b) => (b.victorias.f5 || 0) - (a.victorias.f5 || 0));
        
                    const ganador = finalistas[0];
                    const subcampeon = finalistas[1];
        
                    if (subcampeon && (ganador.victorias.f5 || 0) === (subcampeon.victorias.f5 || 0)) {
                        return alert(`Hay un empate entre ${ganador.gamertag} y ${subcampeon.gamertag}. Desempata antes de finalizar.`);
                    }
        
                    if (!confirm(`¿Deseas finalizar el torneo y proclamar CAMPEÓN a ${ganador.gamertag}?`)) return;
        
                    jugadores = jugadores.map(j => {
                        if (j.id === ganador.id) return { ...j, fase_maxima: 6, habilitado: false };
                        if (subcampeon && j.id === subcampeon.id) return { ...j, estado: 'eliminado', habilitado: false };
                        return j;
                    });
        
                    guardarJugadores(jugadores);
                    renderizarJugadores();
                    return;
                }

        // loggica de la fase 1 a la 4
        const limite = limitesClasificados[faseActual];
        const siguienteFase = numFaseActual + 1;

        if (!confirm(`¿Confirmar avance? Solo los primeros ${limite} jugadores activos con más victorias avanzarán a la Fase ${siguienteFase}.`)) {
            return;
        }

        // 1. Filtrar jugadores activos en la fase actual
        const activosEnFase = jugadores.filter(j => j.fase_maxima >= numFaseActual && j.estado !== 'eliminado');
        // Ordenarlos por victorias
        activosEnFase.sort((a, b) => (b.victorias[claveFase] || 0) - (a.victorias[claveFase] || 0));

        const clasificados = activosEnFase.slice(0, limite);
        const eliminados = activosEnFase.slice(limite);

        if (clasificados.length === 0) {
            alert("No hay jugadores elegibles para avanzar en esta fase.");
            return;
        }

        const idsClasificados = new Set(clasificados.map(c => c.id));
        const idsEliminados = new Set(eliminados.map(e => e.id));

        // 2. Actualizar fase_maxima a clasificados y marcar como "eliminado" a los que no entraron en el corte
        jugadores = jugadores.map(j => {
            if (idsClasificados.has(j.id)) {
                return { ...j, fase_maxima: Math.max(j.fase_maxima, siguienteFase), habilitado: true };
            }
            if (idsEliminados.has(j.id)) {
                return { ...j, estado: 'eliminado', habilitado: false };
            }
            return j;
        });

        guardarJugadores(jugadores);

        // 3. Cambiar a la pestaña siguiente y apagar el switch
        const tabSiguiente = document.querySelector(`.tab-fase[data-fase="${siguienteFase}"]`);
        if (tabSiguiente) tabSiguiente.click();

        const switchEstado = document.getElementById('switch-estado-fase');
        if (switchEstado) {
            switchEstado.checked = true;
            switchEstado.dispatchEvent(new Event('change'));
        }
    });

    inicializarToggleHeader();
    inicializarSwitchEstadoFase(btnAvanzarFase);
    inicializarRespaldoJSON(() => renderizarJugadores());

    renderizarJugadores();
});