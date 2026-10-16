// spectator.js - Módulo para la vista pública en tiempo real
import { obtenerJugadores } from './storage-utils.js';
import { inicializarToggleHeader } from './ui-utils.js';
import { obtenerFase, tituloFase, descripcionFaseHTML, FASE_CAMPEON } from './torneo-config.js';
import { renderizarTabsFases, htmlCampeon, htmlVacio } from './fases-ui.js';
import { victoriasEn, ordenarPorVictorias, obtenerCampeon, insigniaJugador } from './clasificacion-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const listaJugadoresContainer = document.getElementById('lista-jugadores');
    const tituloFaseEl = document.getElementById('titulo-fase');
    const descFaseEl = document.getElementById('desc-fase');

    let numeroFase = 1;

    function renderizarJugadoresPublico() {
        const jugadores = obtenerJugadores();
        listaJugadoresContainer.innerHTML = '';

        // Pestaña exclusiva de Campeón (fase posterior a la última configurada)
        if (numeroFase === FASE_CAMPEON) {
            const campeon = obtenerCampeon(jugadores);
            listaJugadoresContainer.innerHTML = campeon
                ? htmlCampeon(campeon)
                : htmlVacio('fa-crown', 'El campeón aún no ha sido proclamado.');
            return;
        }

        const fase = obtenerFase(numeroFase);
        const jugadoresEnFase = ordenarPorVictorias(jugadores.filter(j => j.fase_maxima >= numeroFase), fase);

        if (jugadoresEnFase.length === 0) {
            listaJugadoresContainer.innerHTML = htmlVacio('fa-ghost', 'Esperando inicio o clasificación de jugadores...');
            return;
        }

        jugadoresEnFase.forEach((jugador, index) => {
            const esCampeon = jugador.fase_maxima >= FASE_CAMPEON;
            const esEliminado = jugador.estado === 'eliminado';
            const estaDeshabilitado = jugador.habilitado === false || esEliminado || esCampeon;
            const posicion = index + 1;
            const victoriasActuales = victoriasEn(jugador, fase);

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

            const badgeTexto = insigniaJugador(jugador, {
                textoCampeon: '🏆 1° LUGAR - CAMPEÓN ABSOLUTO DEL TORNEO',
                textoDeshabilitado: 'DESHABILITADO'
            });

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

    // Actualiza el badge visual leyendo localStorage
    function actualizarBadgeEspectador() {
        const estado = localStorage.getItem('torneo_estado_cr') || 'en_curso';
        const led = document.getElementById('espectador-led');
        const texto = document.getElementById('espectador-texto');

        if (!led || !texto) return;

        if (estado === 'en_curso') {
            led.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse";
            texto.textContent = "FASE EN CURSO";
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
        if (e.key === 'torneo_estado_cr') {
            actualizarBadgeEspectador();
        }
    });

    // Pestañas navegables manualmente por el espectador si lo desea
    renderizarTabsFases(document.getElementById('tabs-fases'), {
        claseBase: 'px-6 py-3 font-orbitron font-bold text-xs tracking-wider transition-all',
        tabCampeon: true,
        onCambio: (valor) => {
            numeroFase = Number(valor);
            if (numeroFase === FASE_CAMPEON) {
                tituloFaseEl.innerHTML = '🏆 Campeón Absoluto';
                descFaseEl.innerHTML = 'El gran ganador del torneo de clashito.';
            } else {
                const fase = obtenerFase(numeroFase);
                tituloFaseEl.innerHTML = tituloFase(fase);
                descFaseEl.innerHTML = descripcionFaseHTML(fase);
            }
            renderizarJugadoresPublico();
        }
    });

    inicializarToggleHeader();
    actualizarBadgeEspectador();
});
