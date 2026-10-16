// avisos.js - Tarjetas flotantes que reemplazan alert(), confirm() y prompt() del navegador.
//
//   notificar(mensaje, { tipo, titulo })       -> tarjeta flotante que se cierra sola
//   await confirmar(mensaje, { titulo, ... })  -> true / false
//   await pedirTexto(mensaje, { titulo, ... }) -> texto escrito o null si se cancela
//   notificarTrasRecarga(mensaje, opciones)    -> se muestra después de location.reload()
//
// Usan las clases de panel (bg-[#121a2d]) y botón (btn-juego) para heredar el tema
// visual del juego activo (temas/clash.css o temas/brawl.css).

const TIPOS = {
    exito: { icono: 'fa-circle-check', color: '#34d399', titulo: '¡Listo!' },
    error: { icono: 'fa-circle-xmark', color: '#f43f5e', titulo: 'Ups…' },
    aviso: { icono: 'fa-triangle-exclamation', color: '#fbbf24', titulo: 'Atención' },
    info: { icono: 'fa-circle-info', color: '#38bdf8', titulo: 'Aviso' }
};

const CLAVE_PENDIENTE = 'aviso_pendiente';

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Texto plano a HTML: respeta saltos de línea y convierte líneas "• ..." en lista
function formatear(mensaje) {
    const lineas = esc(mensaje).split('\n');
    let html = '';
    let enLista = false;
    for (const linea of lineas) {
        const vineta = linea.trim().startsWith('•');
        if (vineta && !enLista) { html += '<ul class="list-disc pl-5 my-2 space-y-1">'; enLista = true; }
        if (!vineta && enLista) { html += '</ul>'; enLista = false; }
        if (vineta) html += `<li>${linea.trim().slice(1).trim()}</li>`;
        else if (linea.trim()) html += `<p class="mb-1">${linea}</p>`;
    }
    return enLista ? html + '</ul>' : html;
}

function inyectarEstilos() {
    if (document.getElementById('avisos-estilos')) return;
    const estilo = document.createElement('style');
    estilo.id = 'avisos-estilos';
    estilo.textContent = `
        @keyframes aviso-entra { from { opacity: 0; transform: translateY(16px) scale(.96); } to { opacity: 1; transform: none; } }
        @keyframes aviso-sale { to { opacity: 0; transform: translateX(40px); } }
        @keyframes aviso-barra { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        @keyframes modal-entra { from { opacity: 0; transform: scale(.9) translateY(10px); } to { opacity: 1; transform: none; } }
        .aviso-tarjeta { animation: aviso-entra .25s ease-out; }
        .aviso-tarjeta.saliendo { animation: aviso-sale .25s ease-in forwards; }
        .aviso-barra { transform-origin: left; animation: aviso-barra linear forwards; }
        .modal-tarjeta { animation: modal-entra .2s ease-out; }
        @media (prefers-reduced-motion: reduce) { .aviso-tarjeta, .modal-tarjeta, .aviso-barra { animation: none !important; } }
    `;
    document.head.appendChild(estilo);
}

function contenedorAvisos() {
    let cont = document.getElementById('avisos-flotantes');
    if (!cont) {
        inyectarEstilos();
        cont = document.createElement('div');
        cont.id = 'avisos-flotantes';
        cont.setAttribute('aria-live', 'polite');
        cont.className = 'fixed z-[90] bottom-4 left-4 right-4 sm:left-auto sm:w-96 flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(cont);
    }
    return cont;
}

// --- Notificación flotante (reemplaza alert) ---
export function notificar(mensaje, { tipo = 'info', titulo, duracion } = {}) {
    const t = TIPOS[tipo] || TIPOS.info;
    const ms = duracion ?? Math.min(9000, 3500 + String(mensaje).length * 35);
    const tarjeta = document.createElement('div');
    tarjeta.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    tarjeta.className = 'aviso-tarjeta pointer-events-auto relative overflow-hidden bg-[#121a2d] border border-slate-700 rounded-2xl shadow-2xl p-4 pl-5 flex items-start gap-3 text-slate-100';
    tarjeta.innerHTML = `
        <span class="absolute left-0 top-0 bottom-0 w-1.5" style="background:${t.color}"></span>
        <i class="fa-solid ${t.icono} text-xl mt-0.5" style="color:${t.color}"></i>
        <div class="flex-1 min-w-0 text-sm">
            <h4 class="font-orbitron font-bold text-base leading-tight mb-1">${esc(titulo || t.titulo)}</h4>
            <div class="text-slate-300 break-words">${formatear(mensaje)}</div>
        </div>
        <button type="button" class="text-slate-400 hover:text-white w-6 h-6 shrink-0" title="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        <span class="aviso-barra absolute left-0 bottom-0 h-1 w-full" style="background:${t.color};animation-duration:${ms}ms"></span>
    `;

    const cerrar = () => {
        if (tarjeta.classList.contains('saliendo')) return;
        tarjeta.classList.add('saliendo');
        setTimeout(() => tarjeta.remove(), 250);
    };
    tarjeta.querySelector('button').addEventListener('click', cerrar);
    let temporizador = setTimeout(cerrar, ms);
    // Pausar mientras el cursor está encima
    tarjeta.addEventListener('mouseenter', () => { clearTimeout(temporizador); tarjeta.querySelector('.aviso-barra').style.animationPlayState = 'paused'; });
    tarjeta.addEventListener('mouseleave', () => { temporizador = setTimeout(cerrar, 2000); tarjeta.querySelector('.aviso-barra').style.animationPlayState = 'running'; });

    contenedorAvisos().appendChild(tarjeta);
}

// Para mensajes que deben verse después de recargar la página
export function notificarTrasRecarga(mensaje, opciones = {}) {
    try { sessionStorage.setItem(CLAVE_PENDIENTE, JSON.stringify({ mensaje, opciones })); } catch (err) { /* sin almacenamiento */ }
}

// --- Tarjeta modal base (confirmar / pedir texto) ---
function abrirModal({ titulo, mensaje, tipo, aceptar, cancelar, peligro, conEntrada, placeholder }) {
    inyectarEstilos();
    const t = TIPOS[tipo] || TIPOS.aviso;

    return new Promise((resolver) => {
        const capa = document.createElement('div');
        capa.className = 'fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4';
        capa.innerHTML = `
            <div role="dialog" aria-modal="true" class="modal-tarjeta w-full max-w-md bg-[#121a2d] border border-slate-700 rounded-2xl shadow-2xl p-5 text-slate-100 max-h-[90vh] overflow-y-auto">
                <div class="flex items-start gap-3 mb-3">
                    <span class="shrink-0 w-11 h-11 rounded-full flex items-center justify-center border-2" style="border-color:${t.color};background:${t.color}22">
                        <i class="fa-solid ${t.icono} text-xl" style="color:${t.color}"></i>
                    </span>
                    <h3 class="font-orbitron text-lg font-black leading-tight pt-2">${esc(titulo)}</h3>
                </div>
                <div class="text-sm text-slate-300 mb-4">${formatear(mensaje)}</div>
                ${conEntrada ? `<input type="text" placeholder="${esc(placeholder || '')}" class="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm mb-4 focus:outline-none">` : ''}
                <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button type="button" data-cancelar class="btn-juego btn-secundario bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold">${esc(cancelar)}</button>
                    <button type="button" data-aceptar class="btn-juego ${peligro ? 'btn-peligro bg-rose-600' : 'btn-primario bg-emerald-500'} text-white px-4 py-2 rounded-lg text-sm font-bold">${esc(aceptar)}</button>
                </div>
            </div>`;

        const entrada = capa.querySelector('input');
        const enfocadoAntes = document.activeElement;

        function terminar(valor) {
            document.removeEventListener('keydown', teclas, true);
            capa.remove();
            if (enfocadoAntes && enfocadoAntes.focus) enfocadoAntes.focus();
            resolver(valor);
        }
        const aceptarValor = () => terminar(conEntrada ? entrada.value : true);
        const cancelarValor = () => terminar(conEntrada ? null : false);

        function teclas(e) {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelarValor(); }
            if (e.key === 'Enter' && (conEntrada ? document.activeElement === entrada : true)) { e.preventDefault(); aceptarValor(); }
        }

        capa.querySelector('[data-aceptar]').addEventListener('click', aceptarValor);
        capa.querySelector('[data-cancelar]').addEventListener('click', cancelarValor);
        capa.addEventListener('click', (e) => { if (e.target === capa) cancelarValor(); });
        document.addEventListener('keydown', teclas, true);

        document.body.appendChild(capa);
        (entrada || capa.querySelector(peligro ? '[data-cancelar]' : '[data-aceptar]')).focus();
    });
}

// --- Confirmación (reemplaza confirm). Devuelve una promesa con true/false ---
export function confirmar(mensaje, { titulo = '¿Confirmar?', aceptar = 'Aceptar', cancelar = 'Cancelar', tipo = 'aviso', peligro = false } = {}) {
    return abrirModal({ titulo, mensaje, tipo, aceptar, cancelar, peligro });
}

// --- Entrada de texto (reemplaza prompt). Devuelve el texto o null ---
export function pedirTexto(mensaje, { titulo = 'Escribe tu respuesta', aceptar = 'Aceptar', cancelar = 'Cancelar', tipo = 'aviso', peligro = false, placeholder = '' } = {}) {
    return abrirModal({ titulo, mensaje, tipo, aceptar, cancelar, peligro, conEntrada: true, placeholder });
}

// Mostrar el aviso que haya quedado pendiente antes de una recarga
function mostrarPendiente() {
    try {
        const pendiente = JSON.parse(sessionStorage.getItem(CLAVE_PENDIENTE));
        if (!pendiente) return;
        sessionStorage.removeItem(CLAVE_PENDIENTE);
        notificar(pendiente.mensaje, pendiente.opciones);
    } catch (err) { /* nada pendiente */ }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mostrarPendiente);
    else mostrarPendiente();
}
