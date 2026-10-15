// ui-utils.js - Control de Interfaz Compartida

export function inicializarToggleHeader() {
    const btnToggleHeader = document.getElementById('btn-toggle-header');
    const mainHeader = document.getElementById('main-header');
    const iconoToggle = document.getElementById('icono-toggle');
    const textoToggle = document.getElementById('texto-toggle');

    if (!btnToggleHeader || !mainHeader) return;

    btnToggleHeader.addEventListener('click', () => {
        const estaOculto = mainHeader.classList.contains('hidden');

        if (estaOculto) {
            mainHeader.classList.remove('hidden');
            if (iconoToggle) iconoToggle.className = 'fa-solid fa-eye-slash';
            if (textoToggle) textoToggle.textContent = 'Ocultar Menú';
        } else {
            mainHeader.classList.add('hidden');
            if (iconoToggle) iconoToggle.className = 'fa-solid fa-bars';
            if (textoToggle) textoToggle.textContent = 'Menú';
        }
    });
}

export function inicializarSwitchEstadoFase(btnAvanzar) {
    const switchEstado = document.getElementById('switch-estado-fase');
    const ledFase = document.getElementById('led-fase');
    const textoEstadoFase = document.getElementById('texto-estado-fase');

    function actualizarEstadoFaseUI() {
        if (!switchEstado) return;
        const enCurso = switchEstado.checked;

        if (enCurso) {
            if (ledFase) ledFase.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse";
            if (textoEstadoFase) {
                textoEstadoFase.textContent = "EN CURSO";
                textoEstadoFase.className = "font-orbitron text-xs font-bold text-emerald-400 uppercase tracking-wider";
            }
            if (btnAvanzar) btnAvanzar.disabled = true;
        } else {
            if (ledFase) ledFase.className = "w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]";
            if (textoEstadoFase) {
                textoEstadoFase.textContent = "CONCLUIDA";
                textoEstadoFase.className = "font-orbitron text-xs font-bold text-rose-400 uppercase tracking-wider";
            }
            if (btnAvanzar) btnAvanzar.disabled = false;
        }
    }

    if (switchEstado) {
        switchEstado.addEventListener('change', actualizarEstadoFaseUI);
        actualizarEstadoFaseUI();
    }
}