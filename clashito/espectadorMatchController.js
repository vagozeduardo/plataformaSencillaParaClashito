// espectador-controller.js

document.addEventListener('DOMContentLoaded', () => {
    const zonaA = document.getElementById('zona-a');
    const zonaB = document.getElementById('zona-b');
    const textoRonda = document.getElementById('texto-ronda');
    const textoEstado = document.getElementById('texto-estado');
    
    const tabF3 = document.getElementById('tab-f3');
    const tabF4 = document.getElementById('tab-f4');

    let faseActiva = 3; // Por defecto mostramos la Fase 3
    let ultimaRondaRenderizada = 0;

    // --- MANEJO DE PESTAÑAS (F3 / F4) ---
    tabF3.addEventListener('click', () => {
        faseActiva = 3;
        ultimaRondaRenderizada = 0; // Forzar re-render con animación
        tabF3.className = "px-6 py-2 rounded font-orbitron font-bold bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)] transition-all";
        tabF4.className = "px-6 py-2 rounded font-orbitron font-bold bg-slate-800 text-slate-400 hover:text-white transition-all";
        renderizarEspectador();
    });

    tabF4.addEventListener('click', () => {
        faseActiva = 4;
        ultimaRondaRenderizada = 0;
        tabF4.className = "px-6 py-2 rounded font-orbitron font-bold bg-cyan-600 text-white shadow-[0_0_10px_rgba(8,145,178,0.5)] transition-all";
        tabF3.className = "px-6 py-2 rounded font-orbitron font-bold bg-slate-800 text-slate-400 hover:text-white transition-all";
        renderizarEspectador();
    });

    // --- FUNCIÓN DE RENDERIZADO PRINCIPAL ---
    function renderizarEspectador() {
        const keyStorage = faseActiva === 3 ? 'carrusel_f3_cr' : 'carrusel_f4_cr';
        const maxRondas = faseActiva === 3 ? 5 : 3;
        const carrusel = JSON.parse(localStorage.getItem(keyStorage));

        if (!carrusel) {
            zonaA.innerHTML = '';
            zonaB.innerHTML = '';
            textoRonda.textContent = `ESPERANDO FASE ${faseActiva}...`;
            textoEstado.textContent = "Sorteo pendiente";
            return;
        }

        const rondaActual = carrusel.rondaActual;
        const esFinDeFase = rondaActual > maxRondas;
        const rondaMostrar = esFinDeFase ? maxRondas : rondaActual;

        // Actualizar Textos Centrales
        if (esFinDeFase) {
            textoRonda.textContent = `FASE ${faseActiva} COMPLETADA`;
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

        // Obtener la estructura de mesas reconstruida según la fase
        const mesas = reconstruirMesasParaEspectador(carrusel, faseActiva, rondaMostrar);
        const claveRonda = `ronda_${rondaMostrar}`;
        const ganadoresRonda = (carrusel.ganadoresPorRonda && carrusel.ganadoresPorRonda[claveRonda]) || {};

        zonaA.innerHTML = '';
        zonaB.innerHTML = '';

        // Limpiar en caso de fin de fase (opcional, si quieres dejarlo en blanco al terminar)
        // if (esFinDeFase) return; // Descomenta esto si prefieres que desaparezcan las tarjetas al terminar

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

    // --- RECONSTRUCCIÓN LÓGICA PARA LECTURA DE ESPECTADOR ---
    function reconstruirMesasParaEspectador(carrusel, fase, rondaMostrar) {
        if (fase === 3) {
            const pos = carrusel.posiciones;
            return [
                { mesa: 1, jugadorA: pos[0], jugadorB: pos[9] },
                { mesa: 2, jugadorA: pos[1], jugadorB: pos[8] },
                { mesa: 3, jugadorA: pos[2], jugadorB: pos[7] },
                { mesa: 4, jugadorA: pos[3], jugadorB: pos[6] },
                { mesa: 5, jugadorA: pos[4], jugadorB: pos[5] }
            ];
        } else if (fase === 4) {
            const { m1A, m1B, m2A, m2B } = carrusel.base;
            if (rondaMostrar === 1) return [{ mesa: 1, jugadorA: m1A, jugadorB: m1B }, { mesa: 2, jugadorA: m2A, jugadorB: m2B }];
            if (rondaMostrar === 2) return [{ mesa: 1, jugadorA: m2A, jugadorB: m1A }, { mesa: 2, jugadorA: m2B, jugadorB: m1B }];
            if (rondaMostrar === 3) return [{ mesa: 1, jugadorA: m2A, jugadorB: m1B }, { mesa: 2, jugadorA: m2B, jugadorB: m1A }];
        }
        return [];
    }

    // --- LOOP DE SINCRONIZACIÓN EN TIEMPO REAL ---
    // Lee los cambios del localStorage 2 veces por segundo (ideal para multipantalla local)
    setInterval(renderizarEspectador, 500);
});