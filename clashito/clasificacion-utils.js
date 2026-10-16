// clasificacion-utils.js - Reglas de clasificación según el tipo de fase configurado
import { esUltimaFase, FASE_CAMPEON } from './torneo-config.js';
import { obtenerSorteo } from './matchmaking-utils.js';

export const victoriasEn = (jugador, fase) => (jugador.victorias && jugador.victorias[fase.clave]) || 0;

export function ordenarPorVictorias(jugadores, fase) {
    return [...jugadores].sort((a, b) => victoriasEn(b, fase) - victoriasEn(a, fase));
}

export function activosEnFase(jugadores, fase) {
    return jugadores.filter(j => j.fase_maxima >= fase.numero && j.estado !== 'eliminado');
}

// Calcula quién avanza y quién queda eliminado. Devuelve { clasificados, eliminados, resumen } o { error }.
export function calcularAvance(jugadores, fase) {
    const activos = ordenarPorVictorias(activosEnFase(jugadores, fase), fase);
    const sorteo = obtenerSorteo(fase.numero);

    // Bracket con mesas sorteadas: avanza quien tenga más victorias dentro de su cruce
    if (fase.tipo === 'eliminacion' && sorteo.length > 0) {
        const clasificados = [];
        for (const duelo of sorteo) {
            const a = activos.find(j => j.id === duelo.jugador1.id);
            const b = activos.find(j => j.id === duelo.jugador2.id);
            if (!a || !b) { if (a || b) clasificados.push(a || b); continue; }
            if (victoriasEn(a, fase) === victoriasEn(b, fase)) {
                return { error: `Empate en la mesa #${duelo.mesa} entre ${a.gamertag} y ${b.gamertag}. Desempata antes de avanzar.` };
            }
            clasificados.push(victoriasEn(a, fase) > victoriasEn(b, fase) ? a : b);
        }
        const ids = new Set(clasificados.map(c => c.id));
        return {
            clasificados,
            eliminados: activos.filter(j => !ids.has(j.id)),
            resumen: `Avanzarán los ganadores de cada mesa (${clasificados.length} jugadores).`
        };
    }

    const limite = fase.clasifican ?? Math.ceil(activos.length / 2);
    return {
        clasificados: activos.slice(0, limite),
        eliminados: activos.slice(limite),
        resumen: `Solo los primeros ${limite} jugadores activos con más victorias avanzarán.`
    };
}

// Aplica el avance sobre la lista de jugadores y devuelve la lista actualizada
export function aplicarAvance(jugadores, fase, { clasificados, eliminados }) {
    const siguiente = fase.numero + 1;
    const idsClasificados = new Set(clasificados.map(c => c.id));
    const idsEliminados = new Set(eliminados.map(e => e.id));

    return jugadores.map(j => {
        if (idsClasificados.has(j.id)) return { ...j, fase_maxima: Math.max(j.fase_maxima, siguiente), habilitado: true };
        if (idsEliminados.has(j.id)) return { ...j, estado: 'eliminado', habilitado: false };
        return j;
    });
}

// --- FINAL: proclamar campeón ---

export function obtenerCampeon(jugadores) {
    return jugadores.find(j => j.fase_maxima >= FASE_CAMPEON);
}

export function calcularCampeon(jugadores, fase) {
    const finalistas = ordenarPorVictorias(activosEnFase(jugadores, fase), fase);
    if (finalistas.length === 0) return { error: `No hay finalistas activos en la Fase ${fase.numero}.` };

    const [ganador, subcampeon] = finalistas;
    if (subcampeon && victoriasEn(ganador, fase) === victoriasEn(subcampeon, fase)) {
        return { error: `Hay un empate entre ${ganador.gamertag} y ${subcampeon.gamertag}. Desempata antes de finalizar.` };
    }
    return { ganador, resto: finalistas.slice(1) };
}

export function aplicarCampeon(jugadores, { ganador, resto }) {
    const idsResto = new Set(resto.map(r => r.id));
    return jugadores.map(j => {
        if (j.id === ganador.id) return { ...j, fase_maxima: FASE_CAMPEON, habilitado: false };
        if (idsResto.has(j.id)) return { ...j, estado: 'eliminado', habilitado: false };
        return j;
    });
}

// Texto de la insignia bajo el gamertag (compartido por admin y espectador)
export function insigniaJugador(jugador, { textoCampeon, textoDeshabilitado }) {
    if (jugador.fase_maxima >= FASE_CAMPEON) return textoCampeon;
    if (jugador.estado === 'eliminado') {
        return esUltimaFase(jugador.fase_maxima) ? '🥈 2° LUGAR - SUBCAMPEÓN' : `ELIMINADO EN FASE ${jugador.fase_maxima}`;
    }
    if (jugador.habilitado === false) return textoDeshabilitado;
    return jugador.tag_jugador;
}
