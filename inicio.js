// inicio.js - Estado en vivo de ambos torneos en la portada (inscritos, fase actual, campeón)
import * as CLASH from './clashito/torneo-config.js';
import * as BRAWL from './brawl/brawl-config.js';
import { obtenerEquipos } from './brawl/equipos-utils.js';

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
const leer = (clave) => { try { return JSON.parse(localStorage.getItem(clave)) || []; } catch (err) { return []; } };

// Fase en curso = la más alta alcanzada por un participante aún activo
function faseEnCurso(participantes, totalFases) {
    const activos = participantes.filter(p => p.estado !== 'eliminado');
    const maxima = Math.max(1, ...activos.map(p => p.fase_maxima ?? 1));
    return Math.min(maxima, totalFases);
}

function pintarRuta(contenedor, torneo, actual, terminado) {
    const fases = torneo.obtenerFases();
    contenedor.innerHTML = fases.map((f, i) => {
        const estado = terminado || f.numero < actual ? 'hecho' : (f.numero === actual ? 'actual' : '');
        const icono = estado === 'hecho' ? '<i class="fa-solid fa-check"></i>' : `F${f.numero}`;
        return `${i ? '<span class="conector"></span>' : ''}<span class="paso-fase ${estado}" title="${esc(torneo.tituloFase(f))}">${icono}</span>`;
    }).join('') + `<span class="conector"></span><span class="paso-fase ${terminado ? 'actual' : ''}" title="Campeón"><i class="fa-solid fa-trophy"></i></span>`;
}

function pintarJuego({ prefijo, torneo, participantes, nombreDe }) {
    const totalFases = torneo.obtenerFases().length;
    const campeon = participantes.find(p => (p.fase_maxima ?? 1) >= torneo.FASE_CAMPEON);
    const actual = faseEnCurso(participantes, totalFases);
    const estado = document.getElementById(`${prefijo}-estado`);
    const rotulo = document.getElementById(`${prefijo}-estado-rotulo`);

    document.getElementById(`${prefijo}-inscritos`).textContent = participantes.length;

    if (campeon) {
        estado.textContent = nombreDe(campeon);
        rotulo.innerHTML = '<i class="fa-solid fa-trophy"></i> Campeón';
    } else if (participantes.length === 0) {
        estado.textContent = 'Inscripciones';
        rotulo.innerHTML = '<i class="fa-solid fa-door-open"></i> Abiertas';
    } else {
        estado.textContent = torneo.obtenerFase(actual).etiqueta || torneo.obtenerFase(actual).nombre;
        rotulo.innerHTML = `<i class="fa-solid fa-flag"></i> Fase ${actual} de ${totalFases}`;
    }

    pintarRuta(document.getElementById(`${prefijo}-ruta`), torneo, actual, !!campeon);
    return { actual, campeon };
}

function actualizar() {
    pintarJuego({ prefijo: 'cr', torneo: CLASH, participantes: leer('jugadores_cr'), nombreDe: j => j.gamertag });

    const { actual, campeon } = pintarJuego({ prefijo: 'bs', torneo: BRAWL, participantes: obtenerEquipos(), nombreDe: e => e.nombre });

    // Modos de juego de la fase en curso de Brawl Stars
    const modos = campeon ? [] : BRAWL.modosDeFase(BRAWL.obtenerFase(actual));
    document.getElementById('bs-modos').innerHTML = modos.map(m =>
        `<span class="chip-portada inline-flex items-center gap-1.5 px-3 py-1 text-xs uppercase text-white"><i class="fa-solid ${m.icono}"></i> ${esc(m.nombre)}</span>`
    ).join('');
}

document.addEventListener('DOMContentLoaded', actualizar);

// Si otra pestaña registra jugadores o avanza fases, la portada se actualiza sola
window.addEventListener('storage', actualizar);
