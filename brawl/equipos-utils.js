// equipos-utils.js - Equipos, grupos/cruces y clasificación del torneo de Brawl Stars
import { FASE_CAMPEON } from './brawl-config.js';

const leer = (clave, defecto) => JSON.parse(localStorage.getItem(clave)) || defecto;
const escribir = (clave, valor) => localStorage.setItem(clave, JSON.stringify(valor));

// registro.js solo guarda { nombre, puntos, estado }: completamos el resto con valores iniciales
function normalizarEquipo(e) {
    return {
        ...e,
        fase_maxima: e.fase_maxima ?? 1,
        estado: e.estado || 'activo',
        habilitado: e.habilitado ?? true,
        puntos_fase: e.puntos_fase || {}
    };
}

export function obtenerEquipos() {
    return leer('equipos_bs', []).map(normalizarEquipo);
}

export function guardarEquipos(equipos) {
    escribir('equipos_bs', equipos);
}

export function contarJugadoresPorEquipo() {
    const conteo = {};
    leer('jugadores_bs', []).forEach(j => { conteo[j.equipo] = (conteo[j.equipo] || 0) + 1; });
    return conteo;
}

export const puntosEn = (equipo, fase) => equipo.puntos_fase[fase.clave] || 0;

export const esCampeon = (equipo) => equipo.fase_maxima >= FASE_CAMPEON;

export function activosEnFase(equipos, fase) {
    return equipos.filter(e => e.fase_maxima >= fase.numero && e.estado !== 'eliminado');
}

export function ordenarPorPuntos(equipos, fase) {
    return [...equipos].sort((a, b) => puntosEn(b, fase) - puntosEn(a, fase));
}

// --- GRUPOS / CRUCES ---

const claveGrupos = (numFase) => `grupos_f${numFase}_bs`;

export function obtenerGrupos(numFase) {
    return leer(claveGrupos(numFase), null);
}

// Liguilla de un solo grupo no necesita sorteo; la última fase tampoco si quedan 2 equipos
export function necesitaSorteo(fase, totalActivos) {
    if (fase.tipo === 'eliminacion') return totalActivos > 2;
    return (fase.grupos ?? 1) > 1;
}

function mezclar(arreglo) {
    const copia = [...arreglo];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

// Devuelve { "Grupo A": [nombres], ... } o { "Cruce 1": [nombres], ... }
export function sortearGrupos(fase, activos) {
    const nombres = mezclar(activos.map(e => e.nombre));
    const grupos = {};

    if (fase.tipo === 'eliminacion') {
        for (let i = 0; i < nombres.length; i += 2) grupos[`Cruce ${i / 2 + 1}`] = nombres.slice(i, i + 2);
    } else {
        const total = fase.grupos ?? 1;
        const etiquetas = Array.from({ length: total }, (_, i) => `Grupo ${String.fromCharCode(65 + i)}`);
        etiquetas.forEach(g => { grupos[g] = []; });
        nombres.forEach((nombre, i) => grupos[etiquetas[i % total]].push(nombre));
    }

    escribir(claveGrupos(fase.numero), grupos);
    return grupos;
}

// Agrupa los equipos activos según el sorteo (o en una sola tabla si no hace falta)
export function equiposPorGrupo(fase, equiposEnFase) {
    const grupos = obtenerGrupos(fase.numero);
    if (!grupos) return [{ nombre: 'Tabla General', equipos: ordenarPorPuntos(equiposEnFase, fase) }];

    const asignados = new Set(Object.values(grupos).flat());
    const resultado = Object.entries(grupos).map(([nombre, miembros]) => ({
        nombre,
        equipos: ordenarPorPuntos(equiposEnFase.filter(e => miembros.includes(e.nombre)), fase)
    }));
    const sinGrupo = equiposEnFase.filter(e => !asignados.has(e.nombre));
    if (sinGrupo.length) resultado.push({ nombre: 'Sin grupo asignado', equipos: sinGrupo, sinGrupo: true });
    return resultado;
}

// --- CLASIFICACIÓN ---

export function calcularAvance(equipos, fase) {
    const activos = activosEnFase(equipos, fase);
    if (necesitaSorteo(fase, activos.length) && !obtenerGrupos(fase.numero)) {
        return { error: `Primero realiza el sorteo de ${fase.tipo === 'eliminacion' ? 'cruces' : 'grupos'} de esta fase.` };
    }

    const corte = fase.tipo === 'eliminacion' ? 1 : (fase.clasifican ?? 1);
    const clasificados = [];
    const eliminados = [];

    for (const grupo of equiposPorGrupo(fase, activos)) {
        if (grupo.sinGrupo) { eliminados.push(...grupo.equipos); continue; }
        const lista = grupo.equipos;
        const ultimo = lista[corte - 1];
        const primeroFuera = lista[corte];
        if (ultimo && primeroFuera && puntosEn(ultimo, fase) === puntosEn(primeroFuera, fase)) {
            return { error: `Empate en ${grupo.nombre} entre ${ultimo.nombre} y ${primeroFuera.nombre} (${puntosEn(ultimo, fase)} pts). Desempata antes de avanzar.` };
        }
        clasificados.push(...lista.slice(0, corte));
        eliminados.push(...lista.slice(corte));
    }

    const resumen = fase.tipo === 'eliminacion'
        ? `Avanzará el ganador de cada cruce (${clasificados.length} equipos).`
        : `Avanzarán los ${corte} mejores de cada grupo (${clasificados.length} equipos).`;
    return { clasificados, eliminados, resumen };
}

export function aplicarAvance(equipos, fase, { clasificados, eliminados }) {
    const siguiente = fase.numero + 1;
    const pasan = new Set(clasificados.map(e => e.nombre));
    const fuera = new Set(eliminados.map(e => e.nombre));
    return equipos.map(e => {
        if (pasan.has(e.nombre)) return { ...e, fase_maxima: Math.max(e.fase_maxima, siguiente), habilitado: true };
        if (fuera.has(e.nombre)) return { ...e, estado: 'eliminado', habilitado: false };
        return e;
    });
}

export function obtenerCampeon(equipos) {
    return equipos.find(esCampeon);
}

export function calcularCampeon(equipos, fase) {
    const finalistas = ordenarPorPuntos(activosEnFase(equipos, fase), fase);
    if (finalistas.length === 0) return { error: `No hay equipos activos en la Fase ${fase.numero}.` };
    const [ganador, segundo] = finalistas;
    if (segundo && puntosEn(ganador, fase) === puntosEn(segundo, fase)) {
        return { error: `Hay un empate entre ${ganador.nombre} y ${segundo.nombre}. Desempata antes de finalizar.` };
    }
    return { ganador, resto: finalistas.slice(1) };
}

export function aplicarCampeon(equipos, { ganador, resto }) {
    const fuera = new Set(resto.map(e => e.nombre));
    return equipos.map(e => {
        if (e.nombre === ganador.nombre) return { ...e, fase_maxima: FASE_CAMPEON, habilitado: false };
        if (fuera.has(e.nombre)) return { ...e, estado: 'eliminado', habilitado: false };
        return e;
    });
}
