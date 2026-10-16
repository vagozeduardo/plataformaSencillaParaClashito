import { obtenerJugadores, guardarJugadores, inicializarRespaldoJSON } from './storage-utils.js';
import { inicializarToggleHeader, inicializarSwitchEstadoFase } from './ui-utils.js';
import { obtenerFase, esUltimaFase, tituloFase, descripcionFaseHTML, FASE_CAMPEON } from './torneo-config.js';
import { renderizarTabsFases, htmlCampeon, htmlVacio } from './fases-ui.js';
import { inicializarReinicio } from '../comun/reinicio.js';
import {
    victoriasEn, ordenarPorVictorias, calcularAvance, aplicarAvance,
    obtenerCampeon, calcularCampeon, aplicarCampeon, insigniaJugador
} from './clasificacion-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const listaJugadoresContainer = document.getElementById('lista-jugadores');
    const btnFiltrar = document.getElementById('btn-filtrar');
    const btnAvanzarFase = document.getElementById('btn-avanzar-fase');
    const linkDuelos = document.getElementById('link-duelos');
    const tituloFaseEl = document.getElementById('titulo-fase');
    const descFaseEl = document.getElementById('desc-fase');
    let mostrarEliminados = true;

    let faseActual = obtenerFase(1);

    // Función principal para renderizar la lista
    function renderizarJugadores() {
        const jugadores = obtenerJugadores();
        listaJugadoresContainer.innerHTML = '';

        const campeon = obtenerCampeon(jugadores);

        // codigo para campeon (solo en la última fase)
        if (esUltimaFase(faseActual.numero) && campeon) {
            listaJugadoresContainer.innerHTML = htmlCampeon(campeon, `
                <div class="flex items-center gap-6 text-xs font-orbitron text-slate-400 border-t border-slate-800 pt-4">
                    <div>
                        <span class="block text-slate-500 text-[10px]">VICTORIAS FINAL</span>
                        <span class="text-emerald-400 font-bold text-base">${victoriasEn(campeon, faseActual)}</span>
                    </div>
                    <div class="h-6 w-[1px] bg-slate-800"></div>
                    <div>
                        <span class="block text-slate-500 text-[10px]">ESTADO</span>
                        <span class="text-amber-400 font-bold text-base"><i class="fa-solid fa-crown text-xs"></i> VICTORIOSO</span>
                    </div>
                </div>
            `);
            return;
        }

        const jugadoresEnFase = ordenarPorVictorias(jugadores.filter(j => j.fase_maxima >= faseActual.numero), faseActual);

        // Si no hay jugadores
        if (jugadoresEnFase.length === 0) {
            listaJugadoresContainer.innerHTML = htmlVacio('fa-ghost', 'Aún no hay jugadores clasificados en esta fase.');
            return;
        }

        // Generar el HTML para cada jugador
        jugadoresEnFase.forEach((jugador, index) => {
            if (!mostrarEliminados && jugador.estado === 'eliminado') {
                return;
            }
            const esCampeon = jugador.fase_maxima >= FASE_CAMPEON;
            const esEliminado = jugador.estado === 'eliminado';
            const estaDeshabilitado = jugador.habilitado === false || esEliminado;
            const posicion = index + 1;
            const victoriasActuales = victoriasEn(jugador, faseActual);

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

            const badgeTexto = insigniaJugador(jugador, {
                textoCampeon: '🏆 1° LUGAR - CAMPEÓN ABSOLUTO (Clic para ver trofeo)',
                textoDeshabilitado: 'DESHABILITADO EN FASE'
            });

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
    function modificarVictorias(id, delta) {
        const jugadores = obtenerJugadores();
        const jugador = jugadores.find(j => j.id === id);
        if (!jugador || jugador.estado === 'eliminado' || jugador.habilitado === false) return;

        if (!jugador.victorias) jugador.victorias = {};
        const nuevas = victoriasEn(jugador, faseActual) + delta;
        if (nuevas < 0) return;

        jugador.victorias[faseActual.clave] = nuevas;
        guardarJugadores(jugadores);
        renderizarJugadores();
    }

    window.sumarVictoria = (id) => modificarVictorias(id, 1);
    window.restarVictoria = (id) => modificarVictorias(id, -1);

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

    // Pestañas generadas desde la configuración
    const tabs = renderizarTabsFases(document.getElementById('tabs-fases'), {
        claseBase: 'px-6 py-4 font-orbitron text-sm font-bold hover:text-slate-300 transition-colors',
        onCambio: (numero) => {
            faseActual = obtenerFase(numero);
            tituloFaseEl.innerHTML = tituloFase(faseActual);
            descFaseEl.innerHTML = descripcionFaseHTML(faseActual);

            // Acceso a la página de mesas solo en fases que se juegan por rondas
            const usaMesas = faseActual.registro === 'mesas';
            linkDuelos.classList.toggle('hidden', !usaMesas);
            linkDuelos.href = `duelos.html?fase=${faseActual.numero}`;

            renderizarJugadores();
        }
    });

    // --- LÓGICA PARA AVANZAR A LA SIGUIENTE FASE ---
    btnAvanzarFase.addEventListener('click', () => {
        let jugadores = obtenerJugadores();

        // Última fase: proclamar campeón
        if (esUltimaFase(faseActual.numero)) {
            if (obtenerCampeon(jugadores)) return alert("El torneo de Clash Royale ya ha concluido.");

            const resultado = calcularCampeon(jugadores, faseActual);
            if (resultado.error) return alert(resultado.error);
            if (!confirm(`¿Deseas finalizar el torneo y proclamar CAMPEÓN a ${resultado.ganador.gamertag}?`)) return;

            guardarJugadores(aplicarCampeon(jugadores, resultado));
            renderizarJugadores();
            return;
        }

        const avance = calcularAvance(jugadores, faseActual);
        if (avance.error) return alert(avance.error);

        const siguienteFase = faseActual.numero + 1;
        if (!confirm(`¿Confirmar avance? ${avance.resumen} Pasarán a la Fase ${siguienteFase}.`)) {
            return;
        }

        if (avance.clasificados.length === 0) {
            alert("No hay jugadores elegibles para avanzar en esta fase.");
            return;
        }

        guardarJugadores(aplicarAvance(jugadores, faseActual, avance));

        // Cambiar a la pestaña siguiente y reactivar el switch
        tabs.activar(String(siguienteFase));

        const switchEstado = document.getElementById('switch-estado-fase');
        if (switchEstado) {
            switchEstado.checked = true;
            switchEstado.dispatchEvent(new Event('change'));
        }
    });

    inicializarToggleHeader();
    inicializarSwitchEstadoFase(btnAvanzarFase);
    inicializarRespaldoJSON(() => renderizarJugadores());
    inicializarReinicio(document.getElementById('btn-reiniciar'), 'cr');
});
