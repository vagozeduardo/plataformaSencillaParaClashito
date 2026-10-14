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
        // Obtenemos los datos de localStorage
        const jugadores = JSON.parse(localStorage.getItem('jugadores_cr')) || [];
        //console.log("Clash Royale", jugadores);

        // Limpiamos el contenedor
        listaJugadoresContainer.innerHTML = '';

        const claveFase = `f${faseActual}`;
        const jugadoresEnFase = jugadores.filter(j => j.fase_maxima >= parseInt(faseActual));

        // Si no hay jugadores, mostramos el estado vacío
        if (jugadores.length === 0) {
            listaJugadoresContainer.innerHTML = `
                <div class="text-center py-12 border-2 border-dashed border-slate-700 rounded-lg">
                    <i class="fa-solid fa-ghost text-4xl text-slate-600 mb-3"></i>
                    <p class="text-slate-400 font-orbitron">Aún no hay jugadores registrados en esta fase.</p>
                </div>
            `;
            return;
        }

        // Ordenar jugadores por victorias (descendente)
        jugadoresEnFase.sort((a, b) => (b.victorias[claveFase] || 0) - (a.victorias[claveFase] || 0));

        // Generar el HTML para cada jugador
        jugadoresEnFase.forEach((jugador, index) => {
            // Lógica del filtro: Si mostrarEliminados es falso y el jugador está eliminado, no lo renderizamos
            if (!mostrarEliminados && jugador.estado === 'eliminado') {
                return; 
            }

            const esEliminado = jugador.estado === 'eliminado';
            const posicion = index + 1;
            const victoriasActuales = jugador.victorias[claveFase] || 0;

            // Clases CSS dinámicas dependiendo del estado
            const divClases = esEliminado 
                ? 'flex items-center justify-between p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 opacity-60'
                : 'flex items-center justify-between p-3 rounded-lg border border-[#00d2ff]/30 bg-[#00d2ff]/5';
            
            const textoNombreClases = esEliminado ? 'font-bold text-slate-400 line-through' : 'font-bold text-slate-100';
            const badgeClases = esEliminado ? 'text-xs text-rose-500 font-bold uppercase' : 'text-xs text-slate-500 font-mono';
            const badgeTexto = esEliminado ? 'Eliminado' : jugador.tag_jugador;
            const botonVictoriaClases = esEliminado ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-500 hover:text-white transition-all';

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
                            <p class="font-bold text-${esEliminado ? 'slate-500' : '[#00d2ff]'}">${victoriasActuales}</p>
                        </div>
                        <div class="flex gap-2">

                            <button onclick="sumarVictoria('${jugador.id}')" class="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500 hover:text-white transition-all ${botonVictoriaClases}" ${esEliminado ? 'disabled' : ''} title="Sumar victoria">
                                <i class="fa-solid fa-plus"></i>
                            </button>

                            <button onclick="restarVictoria('${jugador.id}')" class="w-8 h-8 rounded bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500 hover:text-white transition-all ${botonVictoriaClases}" ${esEliminado ? 'disabled' : ''} title="Restar victoria">
                                <i class="fa-solid fa-minus"></i>
                            </button>

                            <button onclick="eliminarJugador('${jugador.id}')" class="w-8 h-8 rounded ${esEliminado ? 'bg-rose-500 text-white border border-rose-500' : 'bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500 hover:text-white'} transition-all">
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
        
        if (jugadorIndex !== -1 && jugadores[jugadorIndex].estado !== 'eliminado') {
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
        
        if (jugadorIndex !== -1 && jugadores[jugadorIndex].estado !== 'eliminado') {
            const claveFase = `f${faseActual}`;
            // Evitar que las victorias sean números negativos
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
            // Alternar estado (si estaba activo pasa a eliminado y viceversa)
            jugadores[jugadorIndex].estado = jugadores[jugadorIndex].estado === 'eliminado' ? 'activo' : 'eliminado';
            localStorage.setItem('jugadores_cr', JSON.stringify(jugadores));
            renderizarJugadores();
        }
    };

    // Funcionalidad del botón Filtrar
    btnFiltrar.addEventListener('click', () => {
        mostrarEliminados = !mostrarEliminados;
        
        // Cambiar el texto e icono del botón
        if (mostrarEliminados) {
            btnFiltrar.innerHTML = '<i class="fa-solid fa-filter"></i> Ocultar Eliminados';
            btnFiltrar.classList.remove('bg-slate-700');
        } else {
            btnFiltrar.innerHTML = '<i class="fa-solid fa-filter-circle-xmark"></i> Mostrar Eliminados';
            btnFiltrar.classList.add('bg-slate-700');
        }
        
        renderizarJugadores();
    });



    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // 2. Poner estilo activo a la pestaña que fue clickeada
            const tabClickeada = e.currentTarget;
            faseActual = tabClickeada.getAttribute('data-fase'); // Obtenemos si es la 1, 2, 3...

            // 1. Quitar estilos activos a TODAS las pestañas
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

            // 3. Cambiar los textos de la cabecera dinámicamente
            tituloFase.innerHTML = infoFases[faseActual].titulo;
            descFase.innerHTML = infoFases[faseActual].desc;

            // 4. Volver a renderizar los jugadores (Aquí a futuro pondremos un filtro para que solo salgan los que pasaron)
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

        // 1. Filtrar jugadores activos que pertenecen a la fase actual y ordenarlos por victorias
        const clasificados = jugadores
            .filter(j => j.fase_maxima >= numFaseActual && j.estado !== 'eliminado')
            .sort((a, b) => (b.victorias[claveFase] || 0) - (a.victorias[claveFase] || 0))
            .slice(0, limite); // Tomar solo los mejores según el límite

        if (clasificados.length === 0) {
            alert("No hay jugadores elegibles para avanzar en esta fase.");
            return;
        }

        // 2. Actualizar fase_maxima a los que clasificaron
        const idsClasificados = new Set(clasificados.map(c => c.id));
        jugadores = jugadores.map(j => {
            if (idsClasificados.has(j.id)) {
                return { ...j, fase_maxima: Math.max(j.fase_maxima, siguienteFase) };
            }
            return j;
        });

        // 3. Guardar cambios
        localStorage.setItem('jugadores_cr', JSON.stringify(jugadores));

        // 4. Hacer clic automáticamente en la pestaña de la siguiente fase para refrescar la vista
        const tabSiguiente = document.querySelector(`.tab-fase[data-fase="${siguienteFase}"]`);
        if (tabSiguiente) tabSiguiente.click();
    });

    // --- LÓGICA DEL SWITCH DE ESTADO DE FASE ---
    const switchEstado = document.getElementById('switch-estado-fase');
    const ledFase = document.getElementById('led-fase');
    const textoEstadoFase = document.getElementById('texto-estado-fase');
    const btnAvanzar = document.getElementById('btn-avanzar-fase');

    function actualizarEstadoFaseUI() {
        const enCurso = switchEstado.checked;

        if (enCurso) {
            // Fase Activa / En Curso
            ledFase.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse";
            textoEstadoFase.textContent = "EN CURSO";
            textoEstadoFase.className = "font-orbitron text-xs font-bold text-emerald-400 uppercase tracking-wider";
            btnAvanzar.disabled = true; // Bloquea el botón
        } else {
            // Fase Finalizada / Lista para avanzar
            ledFase.className = "w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]";
            textoEstadoFase.textContent = "CONCLUIDA";
            textoEstadoFase.className = "font-orbitron text-xs font-bold text-rose-400 uppercase tracking-wider";
            btnAvanzar.disabled = false; // Habilita el botón
        }
    }

    // Escuchar el click en el Switch
    switchEstado.addEventListener('change', actualizarEstadoFaseUI);

    // Inicializar estado al cargar la página
    actualizarEstadoFaseUI();

    // Renderizar inicialmente al cargar la página
    renderizarJugadores();
});