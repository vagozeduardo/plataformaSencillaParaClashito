// duelos-controller.js - Sorteo y control de mesas por rondas para cualquier fase con registro 'mesas'
import {
    obtenerElegibles, validarSorteo, generarSorteo, obtenerSorteo, guardarSorteo,
    obtenerCarrusel, guardarCarrusel, totalRondas, obtenerMesasRonda
} from './matchmaking-utils.js';
import { obtenerJugadores, guardarJugadores } from './storage-utils.js';
import { obtenerFases, obtenerFase, tituloFase } from './torneo-config.js';
import { renderizarTabsFases, htmlVacio } from './fases-ui.js';

const CLASE_BTN_SORTEAR = "btn-juego btn-primario bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-900 font-orbitron font-bold px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(0,210,255,0.4)] flex items-center gap-2 transition-all cursor-pointer";
const CLASE_BTN_BLOQUEADO = "btn-juego btn-bloqueado bg-slate-800 border border-slate-700 text-slate-500 font-orbitron font-bold px-5 py-2.5 rounded-xl opacity-60 cursor-not-allowed flex items-center gap-2";
const CLASE_BTN_RONDA = "btn-juego btn-exito bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/50 font-orbitron font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2 mt-4 md:mt-0";
const CLASE_BTN_RONDA_FIN = "btn-juego btn-bloqueado bg-slate-800 border border-slate-700 text-slate-500 font-orbitron font-bold px-4 py-2 rounded-lg opacity-50 cursor-not-allowed mt-4 md:mt-0";

document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('contenedor-duelos');
    const btnSortear = document.getElementById('btn-sortear');
    const btnExportarDuelos = document.getElementById('btn-exportar-duelos');
    const inputImportarDuelos = document.getElementById('input-importar-duelos');
    const badgeFase = document.getElementById('badge-fase');

    const seccionCarrusel = document.getElementById('seccion-carrusel');
    const tituloCarrusel = document.getElementById('titulo-carrusel');
    const contenedorCarrusel = document.getElementById('contenedor-carrusel');
    const badgeRonda = document.getElementById('badge-ronda');
    const btnSiguienteRonda = document.getElementById('btn-siguiente-ronda');

    const fasesConMesas = obtenerFases().filter(f => f.registro === 'mesas');
    if (fasesConMesas.length === 0) {
        contenedor.innerHTML = htmlVacio('fa-gears', 'Ninguna fase está configurada con registro por mesas en torneo-config.js.');
        return;
    }

    // Fase indicada en la URL (?fase=3) o la primera con mesas
    const faseURL = obtenerFase(new URLSearchParams(location.search).get('fase'));
    let fase = faseURL && faseURL.registro === 'mesas' ? faseURL : fasesConMesas[0];

    // --- 1. TARJETAS DEL SORTEO INICIAL ---
    function renderizarTarjetasDuelos() {
        const duelos = obtenerSorteo(fase.numero);
        contenedor.innerHTML = '';
        badgeFase.textContent = tituloFase(fase) + (fase.participantes ? ` (${fase.participantes} jugadores)` : '');

        if (duelos.length === 0) {
            btnSortear.disabled = false;
            btnSortear.className = CLASE_BTN_SORTEAR;
            btnSortear.innerHTML = '<i class="fa-solid fa-dice text-lg"></i> Realizar Sorteo Aleatorio';
            contenedor.innerHTML = htmlVacio('fa-dice-d6', 'Presiona "Realizar Sorteo Aleatorio" para armar los duelos iniciales.');
            seccionCarrusel.classList.add('hidden');
            return;
        }

        btnSortear.disabled = true;
        btnSortear.className = CLASE_BTN_BLOQUEADO;
        btnSortear.innerHTML = '<i class="fa-solid fa-lock text-sm"></i> Sorteo Concluido';

        duelos.forEach((duelo) => {
            contenedor.innerHTML += `
                <div class="bg-[#121a2d]/90 border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_15px_rgba(0,210,255,0.08)] flex items-center justify-between relative overflow-hidden">
                    <span class="absolute top-2 left-3 text-[10px] font-orbitron text-cyan-400 uppercase tracking-widest">
                        MESA #${duelo.mesa}
                    </span>
                    <div class="flex-1 min-w-0 text-center pt-3">
                        <p class="font-orbitron font-bold text-slate-100 text-lg truncate">${duelo.jugador1.gamertag}</p>
                        <p class="text-xs text-slate-400 font-mono truncate">${duelo.jugador1.nombre} (${duelo.jugador1.tag_jugador})</p>
                    </div>
                    <div class="px-4 flex flex-col items-center pt-2">
                        <span class="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 text-amber-400 font-orbitron font-black flex items-center justify-center text-sm shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                            VS
                        </span>
                    </div>
                    <div class="flex-1 min-w-0 text-center pt-3">
                        <p class="font-orbitron font-bold text-slate-100 text-lg truncate">${duelo.jugador2.gamertag}</p>
                        <p class="text-xs text-slate-400 font-mono truncate">${duelo.jugador2.nombre} (${duelo.jugador2.tag_jugador})</p>
                    </div>
                </div>
            `;
        });

        seccionCarrusel.classList.remove('hidden');
        renderizarCarruselInteractivo();
    }

    // --- 2. MESAS DE LA RONDA ACTUAL ---
    function renderizarCarruselInteractivo() {
        const sorteo = obtenerSorteo(fase.numero);
        const carrusel = obtenerCarrusel(fase.numero);
        if (!carrusel) return;

        const rondas = totalRondas(fase, sorteo);
        const concluida = carrusel.rondaActual > rondas;
        const rondaMostrar = Math.min(carrusel.rondaActual, rondas);
        const mesas = obtenerMesasRonda(fase, sorteo, rondaMostrar);
        const ganadoresRonda = carrusel.ganadoresPorRonda[`ronda_${rondaMostrar}`] || {};
        const lado = fase.emparejamiento?.etiquetaLado || 'LADO';

        tituloCarrusel.innerHTML = `<i class="fa-solid fa-rotate"></i> CONTROL INTERACTIVO DE MESAS (${rondas} ${rondas === 1 ? 'RONDA' : 'RONDAS'})`;
        contenedorCarrusel.className = `grid grid-cols-1 md:grid-cols-2 ${mesas.length > 2 ? 'lg:grid-cols-3' : ''} gap-4 pb-12`;

        if (concluida) {
            badgeRonda.textContent = `¡FASE ${fase.numero} COMPLETA! (${rondas}/${rondas} RONDAS)`;
            btnSiguienteRonda.disabled = true;
            btnSiguienteRonda.className = CLASE_BTN_RONDA_FIN;
            btnSiguienteRonda.innerHTML = '<i class="fa-solid fa-check-double"></i> Rondas Concluidas';
        } else {
            badgeRonda.textContent = `RONDA ${carrusel.rondaActual} DE ${rondas}`;
            btnSiguienteRonda.disabled = false;
            btnSiguienteRonda.className = CLASE_BTN_RONDA;
            btnSiguienteRonda.innerHTML = 'Siguiente Ronda <i class="fa-solid fa-rotate-right"></i>';
        }

        const botonJugador = (jugador, mesa, esGanador) => {
            const clase = esGanador
                ? 'p-3 bg-emerald-500/20 border-2 border-emerald-400 rounded-lg text-center font-bold transition-all group cursor-pointer shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                : (concluida
                    ? 'p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-center opacity-40 cursor-not-allowed'
                    : 'p-3 bg-slate-800/80 hover:bg-emerald-500/10 border border-slate-700 rounded-lg text-center transition-all group cursor-pointer');
            return { jugador, mesa, esGanador, clase };
        };

        contenedorCarrusel.innerHTML = mesas.map((m) => {
            const ganadorMesaId = ganadoresRonda[m.mesa];
            const lados = [
                { letra: 'A', ...botonJugador(m.jugadorA, m.mesa, ganadorMesaId === m.jugadorA.id) },
                { letra: 'B', ...botonJugador(m.jugadorB, m.mesa, ganadorMesaId === m.jugadorB.id) }
            ];
            return `
                <div class="bg-[#121a2d]/90 border ${ganadorMesaId ? 'border-emerald-500/50' : 'border-cyan-500/30'} rounded-xl p-4 shadow-lg relative flex flex-col justify-between">
                    <span class="text-[11px] font-orbitron ${ganadorMesaId ? 'text-emerald-400' : 'text-cyan-400'} font-bold uppercase tracking-wider mb-3 block">
                        📍 MESA #${m.mesa} ${ganadorMesaId ? '✓ (SELECCIONADO)' : ''}
                    </span>
                    <div class="grid grid-cols-2 gap-3 items-center">
                        ${lados.map(l => `
                            <button ${concluida ? 'disabled' : ''}
                                    onclick="marcarGanadorMesa('${l.jugador.id}', ${l.mesa})"
                                    class="${l.clase}">
                                <span class="text-[10px] text-slate-400 block font-mono">${lado} ${l.letra}</span>
                                <span class="font-orbitron font-bold text-slate-100 group-hover:text-emerald-400 text-sm block truncate">${l.jugador.gamertag}</span>
                                <span class="text-[10px] text-emerald-400 ${l.esGanador ? 'block' : 'opacity-0 group-hover:opacity-100'} font-bold uppercase mt-1">
                                    ${l.esGanador ? '🏆 GANADOR (Clic p/ quitar)' : '<i class="fa-solid fa-trophy"></i> Seleccionar'}
                                </span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- 3. EVENTOS Y LÓGICA DE RONDAS ---
    window.marcarGanadorMesa = function(idGanador, idMesa) {
        const carrusel = obtenerCarrusel(fase.numero);
        if (!carrusel || carrusel.rondaActual > totalRondas(fase, obtenerSorteo(fase.numero))) return;

        const claveRonda = `ronda_${carrusel.rondaActual}`;
        if (!carrusel.ganadoresPorRonda[claveRonda]) carrusel.ganadoresPorRonda[claveRonda] = {};

        // Clic sobre el ganador ya marcado = quitar selección
        if (carrusel.ganadoresPorRonda[claveRonda][idMesa] === idGanador) {
            delete carrusel.ganadoresPorRonda[claveRonda][idMesa];
        } else {
            carrusel.ganadoresPorRonda[claveRonda][idMesa] = idGanador;
        }

        guardarCarrusel(fase.numero, carrusel);
        renderizarCarruselInteractivo();
    };

    btnSiguienteRonda.addEventListener('click', () => {
        const sorteo = obtenerSorteo(fase.numero);
        const carrusel = obtenerCarrusel(fase.numero);
        if (!carrusel) return;

        const rondas = totalRondas(fase, sorteo);
        const totalMesas = obtenerMesasRonda(fase, sorteo, carrusel.rondaActual).length;
        const listaIdsGanadores = Object.values(carrusel.ganadoresPorRonda[`ronda_${carrusel.rondaActual}`] || {});

        // No avanzar si faltan mesas por registrar
        if (listaIdsGanadores.length < totalMesas) {
            alert(`Debes elegir a los ganadores de las ${totalMesas} mesas antes de avanzar a la siguiente ronda. (Mesas seleccionadas: ${listaIdsGanadores.length}/${totalMesas})`);
            return;
        }

        // Aplicar puntos a jugadores en la tabla general
        const jugadores = obtenerJugadores();
        listaIdsGanadores.forEach(idG => {
            const jugador = jugadores.find(j => j.id === idG);
            if (jugador) {
                if (!jugador.victorias) jugador.victorias = {};
                jugador.victorias[fase.clave] = (jugador.victorias[fase.clave] || 0) + 1;
            }
        });
        guardarJugadores(jugadores);

        carrusel.rondaActual += 1;
        guardarCarrusel(fase.numero, carrusel);
        if (carrusel.rondaActual > rondas) {
            alert(`¡Fase ${fase.numero} completada! Se guardaron oficialmente todas las victorias de las ${rondas} rondas en la tabla general.`);
        }
        renderizarCarruselInteractivo();
    });

    // --- 4. SORTEO, IMPORTAR Y EXPORTAR ---
    btnSortear.addEventListener('click', () => {
        const elegibles = obtenerElegibles(fase);
        const error = validarSorteo(fase, elegibles);
        if (error) return alert(error);

        if (fase.participantes && elegibles.length !== fase.participantes &&
            !confirm(`La fase está configurada para ${fase.participantes} jugadores pero hay ${elegibles.length} activos. ¿Sortear de todos modos?`)) {
            return;
        }

        generarSorteo(fase);
        renderizarTarjetasDuelos();
    });

    btnExportarDuelos.addEventListener('click', () => {
        const duelos = obtenerSorteo(fase.numero);
        if (duelos.length === 0) return alert(`Aún no se han generado los duelos de la Fase ${fase.numero} para exportar.`);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(duelos, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `Duelos_Fase${fase.numero}_ClashRoyale_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    inputImportarDuelos.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const datosValidados = JSON.parse(event.target.result);
                if (Array.isArray(datosValidados)) {
                    guardarSorteo(fase.numero, datosValidados);
                    alert(`¡Duelos de Fase ${fase.numero} importados con éxito!`);
                    renderizarTarjetasDuelos();
                }
            } catch (err) { alert("Error al leer el archivo JSON."); }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // Pestañas para cambiar de fase sin salir de la página
    renderizarTabsFases(document.getElementById('tabs-fases'), {
        claseBase: 'px-6 py-3 font-orbitron font-bold text-xs tracking-wider transition-all',
        filtro: f => f.registro === 'mesas',
        faseInicial: fase.numero,
        onCambio: (numero) => {
            fase = obtenerFase(numero);
            history.replaceState(null, '', `?fase=${fase.numero}`);
            renderizarTarjetasDuelos();
        }
    });
});
