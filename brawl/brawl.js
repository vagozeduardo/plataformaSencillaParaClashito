// brawl.js - Panel del torneo de Brawl Stars generado desde la configuración de fases
import { TORNEO, FASE_CAMPEON, obtenerFase, esUltimaFase, tituloFase, descripcionFaseHTML, modosDeFase } from './brawl-config.js';
import {
    obtenerEquipos, guardarEquipos, contarJugadoresPorEquipo, puntosEn, esCampeon, activosEnFase,
    obtenerGrupos, necesitaSorteo, sortearGrupos, equiposPorGrupo,
    calcularAvance, aplicarAvance, obtenerCampeon, calcularCampeon, aplicarCampeon
} from './equipos-utils.js';
import { renderizarTabsFases, TAB_ACTIVA_ROSA } from '../comun/tabs-ui.js';
import { inicializarReinicio } from '../comun/reinicio.js';
import { notificar, confirmar } from '../comun/avisos.js';
import { mostrarCelebracion } from '../comun/celebracion.js';

document.addEventListener('DOMContentLoaded', () => {
    const contenido = document.getElementById('contenido-fase');
    const tituloFaseEl = document.getElementById('titulo-fase');
    const descFaseEl = document.getElementById('desc-fase');
    const modosFaseEl = document.getElementById('modos-fase');
    const btnSortear = document.getElementById('btn-sortear');
    const btnAvanzar = document.getElementById('btn-avanzar-fase');
    const btnFiltrar = document.getElementById('btn-filtrar');

    let fase = obtenerFase(1);
    let mostrarEliminados = true;

    const vacio = (icono, mensaje) => `
        <div class="md:col-span-2 text-center py-12 border-2 border-dashed border-slate-700 rounded-lg">
            <i class="fa-solid ${icono} text-4xl text-slate-600 mb-3"></i>
            <p class="text-slate-400 font-orbitron">${mensaje}</p>
        </div>`;

    function htmlCampeon(equipo, jugadores) {
        return `
            <div class="md:col-span-2 py-12 px-6 rounded-2xl bg-gradient-to-b from-[#ff2a85]/10 via-[#121a2d] to-[#0a0f1d] border-2 border-amber-400/60 text-center shadow-[0_0_35px_rgba(255,42,133,0.25)] flex flex-col items-center justify-center">
                <div class="flex items-end gap-3 mb-4">
                    <img src="media/emblemas/brawl-gema.svg" alt="" class="w-10 h-11 -rotate-12">
                    <img src="media/emblemas/brawl-emblema.svg" alt="Estrella del campeón" class="emblema w-24 h-24">
                    <img src="media/emblemas/brawl-gema.svg" alt="" class="w-10 h-11 rotate-12">
                </div>
                <span class="text-xs font-bold font-orbitron text-amber-400 uppercase tracking-[0.3em] mb-1">¡EQUIPO CAMPEÓN DEL TORNEO!</span>
                <h2 class="text-4xl md:text-5xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-[#ff2a85] to-amber-400 uppercase tracking-wider mb-2">${equipo.nombre}</h2>
                <p class="text-sm text-slate-300 font-mono bg-slate-900/80 px-4 py-1 rounded-full border border-slate-700/60">
                    <i class="fa-solid fa-user-group text-[#ff2a85] mr-1.5"></i>${jugadores} Jugadores <span class="text-slate-500">|</span> ${puntosEn(equipo, fase)} pts en la final
                </p>
                <button type="button" data-ver-celebracion class="btn-juego btn-primario mt-6 px-6 py-3 rounded-xl">
                    <i class="fa-solid fa-wand-magic-sparkles mr-1"></i> Ver celebración
                </button>
            </div>`;
    }

    // --- Cabecera de la fase: título, nota y modos de juego ---
    function renderizarCabecera() {
        tituloFaseEl.innerHTML = tituloFase(fase);
        descFaseEl.innerHTML = descripcionFaseHTML(fase, 'text-[#ff2a85]');
        modosFaseEl.innerHTML = modosDeFase(fase).map(m => `
            <span class="chip-modo inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-[#ff2a85]/30 text-xs font-bold text-slate-200 uppercase tracking-wide">
                <i class="fa-solid ${m.icono} text-[#ff2a85]"></i> ${m.nombre}
            </span>`).join('');
    }

    function renderizarBotonSorteo(totalActivos) {
        const requiere = necesitaSorteo(fase, totalActivos) && !obtenerCampeon(obtenerEquipos());
        btnSortear.classList.toggle('hidden', !requiere);
        if (!requiere) return;
        const que = fase.tipo === 'eliminacion' ? 'Cruces' : 'Grupos';
        btnSortear.innerHTML = obtenerGrupos(fase.numero)
            ? `<i class="fa-solid fa-shuffle"></i> Volver a sortear ${que}`
            : `<i class="fa-solid fa-dice"></i> Sortear ${que}`;
    }

    // --- Tarjeta de un equipo (estilos de la maqueta original) ---
    function htmlEquipo(equipo, posicion, corte, jugadores) {
        const campeon = esCampeon(equipo);
        const eliminado = equipo.estado === 'eliminado';
        const deshabilitado = eliminado || equipo.habilitado === false;
        const lider = posicion === 1 && !deshabilitado;
        const pts = puntosEn(equipo, fase);

        let clases = 'border-slate-700 bg-slate-800/50';
        if (campeon) clases = 'border-2 border-amber-400/80 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.2)]';
        else if (deshabilitado) clases = 'border-rose-500/30 bg-rose-500/5 opacity-60';
        else if (lider) clases = 'border-[#ff2a85]/40 bg-[#ff2a85]/10';

        let subtitulo = `<i class="fa-solid fa-user-group text-[9px]"></i> ${jugadores} Jugadores`;
        let claseSub = 'text-slate-400';
        if (campeon) { subtitulo = '🏆 CAMPEÓN DEL TORNEO'; claseSub = 'text-amber-400 font-bold'; }
        else if (eliminado) { subtitulo = esUltimaFase(equipo.fase_maxima) ? '🥈 SUBCAMPEÓN' : `Eliminado en Fase ${equipo.fase_maxima}`; claseSub = 'text-rose-500 font-bold'; }
        else if (equipo.habilitado === false) { subtitulo = 'Deshabilitado'; claseSub = 'text-rose-500 font-bold'; }
        else if (corte && posicion <= corte) { subtitulo += ' · <span class="text-emerald-400">Clasificando</span>'; }

        const bloqueo = deshabilitado ? 'disabled' : '';
        const estiloBloqueo = deshabilitado ? 'opacity-50 cursor-not-allowed' : '';
        const nombreSeguro = equipo.nombre.replace(/'/g, "\\'");

        return `
            <div class="flex items-center justify-between p-3 rounded-lg border ${clases}">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="font-orbitron font-bold ${posicion === 1 && !deshabilitado ? 'text-amber-400' : (deshabilitado ? 'text-slate-500' : 'text-slate-300')} w-5 text-center">${campeon ? '<i class="fa-solid fa-crown text-amber-400"></i>' : posicion}</span>
                    <div class="min-w-0">
                        <p class="font-bold uppercase text-sm truncate ${campeon ? 'text-amber-300 font-orbitron' : (deshabilitado ? 'text-slate-400 line-through' : 'text-slate-100')}">${equipo.nombre}</p>
                        <p class="text-[10px] uppercase ${claseSub}">${subtitulo}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4 shrink-0">
                    <div class="text-center">
                        <p class="text-[10px] ${deshabilitado ? 'text-slate-500' : 'text-slate-400'}"><i class="fa-solid fa-star text-amber-400"></i> Pts</p>
                        <p class="font-bold ${deshabilitado ? 'text-slate-500' : (lider ? 'text-[#ff2a85]' : 'text-slate-300')}">${pts}</p>
                    </div>
                    <div class="flex gap-1">
                        <button onclick="sumarPunto('${nombreSeguro}', 1)" ${bloqueo} title="Sumar punto" class="btn-juego btn-mini btn-exito w-7 h-7 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500 hover:text-white transition-all text-xs ${estiloBloqueo}"><i class="fa-solid fa-plus"></i></button>
                        <button onclick="sumarPunto('${nombreSeguro}', -1)" ${bloqueo} title="Restar punto" class="btn-juego btn-mini btn-aviso w-7 h-7 rounded bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500 hover:text-white transition-all text-xs ${estiloBloqueo}"><i class="fa-solid fa-minus"></i></button>
                        <button onclick="alternarEquipo('${nombreSeguro}')" title="Deshabilitar/Habilitar" class="btn-juego btn-mini btn-peligro w-7 h-7 rounded transition-all text-xs ${deshabilitado ? 'bg-rose-500 text-white border border-rose-500' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-rose-500 hover:text-white'}"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
            </div>`;
    }

    // --- Render principal ---
    function renderizar() {
        const equipos = obtenerEquipos();
        const jugadoresPorEquipo = contarJugadoresPorEquipo();
        const enFase = equipos.filter(e => e.fase_maxima >= fase.numero);
        const activos = activosEnFase(equipos, fase);
        const campeon = obtenerCampeon(equipos);

        renderizarCabecera();
        renderizarBotonSorteo(activos.length);
        btnAvanzar.disabled = !!campeon;
        btnAvanzar.classList.toggle('opacity-40', !!campeon);
        btnAvanzar.classList.toggle('cursor-not-allowed', !!campeon);

        if (esUltimaFase(fase.numero) && campeon) {
            contenido.innerHTML = htmlCampeon(campeon, jugadoresPorEquipo[campeon.nombre] || 0);
            return;
        }
        if (equipos.length === 0) {
            contenido.innerHTML = vacio('fa-users-slash', 'Aún no hay equipos inscritos. Regístralos en la sección Registro.');
            return;
        }
        if (enFase.length === 0) {
            contenido.innerHTML = vacio('fa-ghost', 'Aún no hay equipos clasificados en esta fase.');
            return;
        }

        const pendienteSorteo = necesitaSorteo(fase, activos.length) && !obtenerGrupos(fase.numero) && activos.length > 0;
        const grupos = pendienteSorteo
            ? [{ nombre: 'Equipos en espera de sorteo', equipos: enFase }]
            : equiposPorGrupo(fase, enFase);
        const corte = fase.tipo === 'eliminacion' ? 1 : fase.clasifican;
        const unaColumna = grupos.length === 1;

        contenido.innerHTML = grupos.map((grupo, i) => {
            const visibles = grupo.equipos.filter(e => mostrarEliminados || e.estado !== 'eliminado');
            // Posición calculada solo entre los equipos aún en juego
            let posicion = 0;
            const filas = visibles.map(e => {
                posicion = e.estado === 'eliminado' ? posicion : posicion + 1;
                return htmlEquipo(e, e.estado === 'eliminado' ? '–' : posicion, pendienteSorteo || esUltimaFase(fase.numero) ? null : corte, jugadoresPorEquipo[e.nombre] || 0);
            }).join('');

            const color = grupo.sinGrupo ? 'text-amber-400' : (i % 2 === 0 ? 'text-[#00d2ff]' : 'text-[#ff2a85]');
            return `
                <div class="${unaColumna ? 'md:col-span-2' : ''}">
                    <h4 class="font-orbitron text-lg font-bold ${color} mb-4 border-b border-slate-700 pb-2">
                        <i class="fa-solid ${grupo.sinGrupo ? 'fa-circle-exclamation' : (fase.tipo === 'eliminacion' ? 'fa-bolt' : 'fa-users')} mr-2"></i>${grupo.nombre.toUpperCase()}
                    </h4>
                    <div class="space-y-3">${filas || '<p class="text-xs text-slate-500">Sin equipos visibles.</p>'}</div>
                </div>`;
        }).join('');

        if (pendienteSorteo) {
            contenido.insertAdjacentHTML('afterbegin', `
                <p class="md:col-span-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2">
                    <i class="fa-solid fa-dice mr-1"></i> Esta fase se juega por ${fase.tipo === 'eliminacion' ? 'cruces' : 'grupos'}: presiona "Sortear" para repartir a los equipos.
                </p>`);
        }
    }

    // --- Pantalla de campeón ---
    function celebrarCampeon() {
        const equipos = obtenerEquipos();
        const campeon = obtenerCampeon(equipos);
        if (!campeon) return;
        const final = obtenerFase(FASE_CAMPEON - 1);
        const subcampeon = equipos.find(e => e.estado === 'eliminado' && e.fase_maxima === final.numero);
        const jugadores = contarJugadoresPorEquipo()[campeon.nombre] || 0;
        const modos = modosDeFase(final).map(m => m.nombre).join(', ');
        mostrarCelebracion({
            juego: 'bs',
            nombre: campeon.nombre,
            subtitulo: `${jugadores} jugadores${modos ? ` · ${modos}` : ''}`,
            datos: [
                `⭐ ${puntosEn(campeon, final)} pts en la final`,
                subcampeon ? `🥈 Subcampeón: ${subcampeon.nombre}` : null,
                `👥 ${equipos.length} equipos`
            ].filter(Boolean),
            onReiniciar: () => document.getElementById('btn-reiniciar').click()
        });
    }

    contenido.addEventListener('click', (e) => {
        if (e.target.closest('[data-ver-celebracion]')) celebrarCampeon();
    });

    // --- Acciones de los botones de cada equipo ---
    window.sumarPunto = function(nombre, delta) {
        const equipos = obtenerEquipos();
        const equipo = equipos.find(e => e.nombre === nombre);
        if (!equipo || equipo.estado === 'eliminado' || equipo.habilitado === false) return;
        const nuevos = puntosEn(equipo, fase) + delta;
        if (nuevos < 0) return;
        equipo.puntos_fase[fase.clave] = nuevos;
        guardarEquipos(equipos);
        renderizar();
    };

    window.alternarEquipo = function(nombre) {
        const equipos = obtenerEquipos();
        const equipo = equipos.find(e => e.nombre === nombre);
        if (!equipo || equipo.estado === 'eliminado') return;
        equipo.habilitado = equipo.habilitado === false;
        guardarEquipos(equipos);
        renderizar();
    };

    btnSortear.addEventListener('click', async () => {
        const activos = activosEnFase(obtenerEquipos(), fase);
        if (activos.length < 2) return notificar('Se necesitan al menos 2 equipos activos en esta fase para sortear.', { tipo: 'aviso' });
        if (obtenerGrupos(fase.numero) && !(await confirmar('Los equipos se repartirán de nuevo. Los puntos se conservan.', { titulo: '¿Volver a sortear?', aceptar: 'Sortear de nuevo' }))) return;
        if (fase.participantes && activos.length !== fase.participantes &&
            !(await confirmar(`La fase está configurada para ${fase.participantes} equipos pero hay ${activos.length} activos.`, { titulo: '¿Sortear de todos modos?', aceptar: 'Sortear' }))) return;
        const grupos = sortearGrupos(fase, activos);
        renderizar();
        notificar(`Equipos repartidos en ${Object.keys(grupos).length} ${fase.tipo === 'eliminacion' ? 'cruces' : 'grupos'}.`, { tipo: 'exito', titulo: 'Sorteo realizado' });
    });

    btnFiltrar.addEventListener('click', () => {
        mostrarEliminados = !mostrarEliminados;
        btnFiltrar.innerHTML = mostrarEliminados
            ? '<i class="fa-solid fa-filter"></i> Ocultar Eliminados'
            : '<i class="fa-solid fa-filter-circle-xmark"></i> Mostrar Eliminados';
        btnFiltrar.classList.toggle('bg-slate-700', !mostrarEliminados);
        renderizar();
    });

    // --- Pestañas ---
    const tabs = renderizarTabsFases(document.getElementById('tabs-fases'), {
        torneo: TORNEO,
        clasesActiva: TAB_ACTIVA_ROSA,
        claseBase: 'px-6 py-4 font-orbitron text-sm font-bold hover:text-slate-300 transition-colors',
        onCambio: (numero) => {
            fase = obtenerFase(numero);
            renderizar();
        }
    });

    // --- Avanzar de fase / proclamar campeón ---
    btnAvanzar.addEventListener('click', async () => {
        let equipos = obtenerEquipos();

        if (esUltimaFase(fase.numero)) {
            if (obtenerCampeon(equipos)) return notificar('El torneo de Brawl Stars ya ha concluido.', { tipo: 'info' });
            const resultado = calcularCampeon(equipos, fase);
            if (resultado.error) return notificar(resultado.error, { tipo: 'aviso', titulo: 'No se puede finalizar' });
            if (!(await confirmar(`¿Finalizar el torneo y proclamar CAMPEÓN a ${resultado.ganador.nombre}?`, { titulo: 'Proclamar campeón', aceptar: '¡Coronar!' }))) return;
            guardarEquipos(aplicarCampeon(equipos, resultado));
            renderizar();
            celebrarCampeon();
            return;
        }

        const avance = calcularAvance(equipos, fase);
        if (avance.error) return notificar(avance.error, { tipo: 'aviso', titulo: 'No se puede avanzar' });
        if (avance.clasificados.length === 0) return notificar('No hay equipos elegibles para avanzar en esta fase.', { tipo: 'aviso' });
        if (!(await confirmar(`${avance.resumen}\nPasarán a la Fase ${fase.numero + 1}.`, { titulo: '¿Confirmar avance?', aceptar: 'Avanzar' }))) return;

        const siguiente = fase.numero + 1;
        guardarEquipos(aplicarAvance(equipos, fase, avance));
        tabs.activar(String(siguiente));
        notificar(`${avance.clasificados.length} equipos avanzan a la Fase ${siguiente}.`, { tipo: 'exito', titulo: 'Fase completada' });
    });

    inicializarReinicio(document.getElementById('btn-reiniciar'), 'bs');

    // Refrescar si otra pestaña (p. ej. Registro) modifica los equipos
    window.addEventListener('storage', (e) => { if (e.key === 'equipos_bs' || e.key === 'jugadores_bs') renderizar(); });
});
