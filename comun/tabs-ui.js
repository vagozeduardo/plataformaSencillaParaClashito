// tabs-ui.js - Pestañas de fases generadas desde la configuración de cualquier juego

// Colores de pestaña activa por juego
export const TAB_ACTIVA_CIAN = ['text-[#00d2ff]', 'border-b-2', 'border-[#00d2ff]', 'bg-[#00d2ff]/10'];
export const TAB_ACTIVA_ROSA = ['text-[#ff2a85]', 'border-b-2', 'border-[#ff2a85]', 'bg-[#ff2a85]/10'];

function claseInactiva(tab) {
    return tab.dataset.destacada === 'true' ? 'text-amber-500' : 'text-slate-500';
}

// Pinta una pestaña por fase dentro de `contenedor` y llama a `onCambio(numeroFase)` al hacer clic.
// opciones.torneo       -> torneo creado con crearTorneo() (fases-core.js)
// opciones.claseBase    -> clases comunes de cada botón (para respetar el estilo de cada página)
// opciones.clasesActiva -> colores de la pestaña seleccionada
// opciones.filtro       -> función para mostrar solo algunas fases
// opciones.tabCampeon   -> agrega la pestaña final de campeón (vista espectador)
export function renderizarTabsFases(contenedor, { torneo, claseBase, clasesActiva = TAB_ACTIVA_CIAN, filtro = () => true, tabCampeon = false, faseInicial, onCambio }) {
    const fases = torneo.obtenerFases().filter(filtro);
    const items = fases.map(f => ({
        valor: String(f.numero),
        texto: torneo.etiquetaTab(f) + (f.destacada ? ' <i class="fa-solid fa-trophy ml-1"></i>' : ''),
        destacada: !!f.destacada
    }));
    if (tabCampeon) items.push({ valor: String(torneo.FASE_CAMPEON), texto: '🏆 CAMPEÓN 🏆', destacada: true });

    contenedor.innerHTML = items.map(it =>
        `<button data-fase="${it.valor}" data-destacada="${it.destacada}" class="tab-fase ${claseBase} whitespace-nowrap">${it.texto}</button>`
    ).join('');

    const tabs = contenedor.querySelectorAll('.tab-fase');

    function activar(valor) {
        tabs.forEach(t => {
            t.classList.remove(...clasesActiva, 'text-slate-500', 'text-amber-500');
            if (t.dataset.fase === valor) t.classList.add(...clasesActiva);
            else t.classList.add(claseInactiva(t));
        });
        onCambio(valor);
    }

    tabs.forEach(t => t.addEventListener('click', () => activar(t.dataset.fase)));
    activar(String(faseInicial ?? items[0]?.valor));

    return { activar };
}
