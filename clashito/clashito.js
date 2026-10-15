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
        const jugadores = JSON.parse(localStorage.getItem('jugadores_cr')) || [];
        listaJugadoresContainer.innerHTML = '';

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

            const esEliminado = jugador.estado === 'eliminado';
            const estaDeshabilitado = jugador.habilitado === false || esEliminado;
            const posicion = index + 1;
            const victoriasActuales = jugador.victorias[claveFase] || 0;

            // Clases CSS dinámicas
            const divClases = estaDeshabilitado 
                ? 'flex items-center justify-between p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 opacity-60'
                : 'flex items-center justify-between p-3 rounded-lg border border-[#00d2ff]/30 bg-[#00d2ff]/5';

            const textoNombreClases = estaDeshabilitado ? 'font-bold text-slate-400 line-through' : 'font-bold text-slate-100';
            const badgeClases = estaDeshabilitado ? 'text-xs text-rose-500 font-bold uppercase' : 'text-xs text-slate-500 font-mono';
            
            // CORREGIDO: Declarado como let para permitir reasignación
            let badgeTexto = jugador.tag_jugador;

            if (jugador.estado === 'eliminado') {
                badgeTexto = `ELIMINADO EN FASE ${jugador.fase_maxima}`;
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
        let jugadores = JSON.parse(localStorage.getItem('jugadores_cr')) || [];
        const jugadorIndex = jugadores.findIndex(j => j.id === id);
        
        if (jugadorIndex !== -1 && jugadores[jugadorIndex].estado !== 'eliminado' && jugadores[jugadorIndex].habilitado !== false) {
            const claveFase = `f${faseActual}`;
            if (!jugadores[jugadorIndex].victorias) jugadores[jugadorIndex].victorias = {};
            
            jugadores[jugadorIndex].victorias[claveFase] = (jugadores[jugadorIndex].victorias[claveFase] || 0) + 1;
            localStorage.setItem('jugadores_cr', JSON.stringify(jugadores));
            renderizarJugadores();
        }
    };

    window.restarVictoria = function(id) {
        let jugadores = JSON.parse(localStorage.getItem('jugadores_cr')) || [];
        const jugadorIndex = jugadores.findIndex(j => j.id === id);
        
        if (jugadorIndex !== -1 && jugadores[jugadorIndex].estado !== 'eliminado' && jugadores[jugadorIndex].habilitado !== false) {
            const claveFase = `f${faseActual}`;
            if (jugadores[jugadorIndex].victorias && jugadores[jugadorIndex].victorias[claveFase] > 0) {
                jugadores[jugadorIndex].victorias[claveFase] -= 1;
                localStorage.setItem('jugadores_cr', JSON.stringify(jugadores));
                renderizarJugadores();
            }
        }
    };

    window.eliminarJugador = function(id) {
        let jugadores = JSON.parse(localStorage.getItem('jugadores_cr')) || [];
        const jugadorIndex = jugadores.findIndex(j => j.id === id);
        
        if (jugadorIndex !== -1) {
            // Alternar variable habilitado
            const estaHabilitado = jugadores[jugadorIndex].habilitado !== false;
            jugadores[jugadorIndex].habilitado = !estaHabilitado;
            localStorage.setItem('jugadores_cr', JSON.stringify(jugadores));
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
    
        if (numFaseActual >= 5) {
            alert("¡Ya estás en la Fase Final!");
            return;
        }

        const limite = limitesClasificados[faseActual];
        const siguienteFase = numFaseActual + 1;

        if (!confirm(`¿Confirmar avance? Solo los primeros ${limite} jugadores activos con más victorias avanzarán a la Fase ${siguienteFase}.`)) {
            return;
        }

        let jugadores = JSON.parse(localStorage.getItem('jugadores_cr')) || [];
        const claveFase = `f${faseActual}`;

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

        localStorage.setItem('jugadores_cr', JSON.stringify(jugadores));

        // 3. Cambiar a la pestaña siguiente y apagar el switch
        const tabSiguiente = document.querySelector(`.tab-fase[data-fase="${siguienteFase}"]`);
        if (tabSiguiente) tabSiguiente.click();

        const switchEstado = document.getElementById('switch-estado-fase');
        if (switchEstado) {
            switchEstado.checked = true;
            switchEstado.dispatchEvent(new Event('change'));
        }
    });

    // --- LÓGICA DEL SWITCH DE ESTADO DE FASE ---
    const switchEstado = document.getElementById('switch-estado-fase');
    const ledFase = document.getElementById('led-fase');
    const textoEstadoFase = document.getElementById('texto-estado-fase');
    const btnAvanzar = document.getElementById('btn-avanzar-fase');

    function actualizarEstadoFaseUI() {
        if (!switchEstado) return;
        const enCurso = switchEstado.checked;

        if (enCurso) {
            ledFase.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse";
            textoEstadoFase.textContent = "EN CURSO";
            textoEstadoFase.className = "font-orbitron text-xs font-bold text-emerald-400 uppercase tracking-wider";
            btnAvanzar.disabled = true;
        } else {
            ledFase.className = "w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]";
            textoEstadoFase.textContent = "CONCLUIDA";
            textoEstadoFase.className = "font-orbitron text-xs font-bold text-rose-400 uppercase tracking-wider";
            btnAvanzar.disabled = false;
        }
    }

    if (switchEstado) {
        switchEstado.addEventListener('change', actualizarEstadoFaseUI);
        actualizarEstadoFaseUI();
    }

    renderizarJugadores();
});