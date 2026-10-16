// celebracion.js - Pantalla de campeón con animación de victoria (Clash Royale o Brawl Stars).
//
//   mostrarCelebracion({
//       juego: 'cr' | 'bs',
//       nombre: 'ValkyrieCR',               // jugador o equipo campeón
//       subtitulo: 'Sofía · #90PLQ',        // opcional
//       datos: ['3 victorias en la final'], // chips opcionales
//       onReiniciar: () => { ... }          // opcional: muestra el botón "Reiniciar torneo"
//   })
//
// Los estilos viven en temas/celebracion.css y se cargan solos la primera vez.

const RUTA_MEDIA = new URL('../media/emblemas/', import.meta.url).href;

const JUEGOS = {
    cr: {
        clase: 'celebracion-clash',
        titulo: '¡Campeón!',
        lugar: '1er lugar · Torneo Clash Royale',
        trofeo: 'clash-corona.svg',
        colores: ['#ffcc33', '#fff3a8', '#e08a00', '#4c8dff', '#ffffff', '#ff4d6d'],
        etiquetaLista: 'Ver clasificación'
    },
    bs: {
        clase: 'celebracion-brawl',
        titulo: '¡Victoria!',
        lugar: '1er lugar · Torneo Brawl Stars',
        trofeo: 'brawl-trofeo.svg',
        colores: ['#ffd400', '#ff1f8f', '#a259ff', '#3ee0ff', '#ffffff', '#22c55e'],
        etiquetaLista: 'Ver clasificación'
    }
};

const ONOMATOPEYAS = [
    { texto: '¡BOOM!', top: '8%', left: '6%', giro: '-14deg', retraso: 0.9 },
    { texto: '¡POW!', top: '14%', left: '74%', giro: '12deg', retraso: 1.5 },
    { texto: '¡GG!', top: '78%', left: '8%', giro: '10deg', retraso: 2.1 },
    { texto: '¡WOW!', top: '72%', left: '72%', giro: '-10deg', retraso: 2.6 }
];

const ESTRELLA_SVG = `
    <svg viewBox="0 0 100 96" aria-hidden="true"><path d="M50 4 L62 36 L96 37 L69 58 L79 91 L50 72 L21 91 L31 58 L4 37 L38 36 Z"
        fill="#ffd400" stroke="#000" stroke-width="7" stroke-linejoin="round"/><path d="M44 22 L38 36 L18 37" fill="none" stroke="#fff6a3" stroke-width="5" stroke-linecap="round"/></svg>`;

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const azar = (min, max) => min + Math.random() * (max - min);
const reducirMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Los estilos se precargan al importar el módulo para que la celebración se vea completa desde el primer cuadro
let estilosListos = null;
function cargarEstilos() {
    if (estilosListos) return estilosListos;
    estilosListos = new Promise((resolver) => {
        const link = document.createElement('link');
        link.id = 'celebracion-estilos';
        link.rel = 'stylesheet';
        link.href = new URL('../temas/celebracion.css', import.meta.url).href;
        link.onload = link.onerror = () => resolver();
        document.head.appendChild(link);
    });
    return estilosListos;
}
if (typeof document !== 'undefined') cargarEstilos();

// --- Confeti en canvas (sin librerías) ---
function iniciarConfeti(canvas, colores) {
    const ctx = canvas.getContext('2d');
    const particulas = [];
    let ancho = 0, alto = 0, animacion = null, activo = true;
    const inicio = performance.now();

    function ajustar() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        ancho = canvas.clientWidth; alto = canvas.clientHeight;
        canvas.width = ancho * dpr; canvas.height = alto * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function lanzar(x, y, cantidad, angulo, apertura, fuerza) {
        if (!ancho) ajustar();
        for (let i = 0; i < cantidad; i++) {
            const a = (angulo + azar(-apertura, apertura)) * Math.PI / 180;
            const v = fuerza * azar(0.55, 1.15);
            particulas.push({
                x, y,
                vx: Math.cos(a) * v, vy: Math.sin(a) * v,
                giro: azar(0, Math.PI * 2), vgiro: azar(-0.25, 0.25),
                tam: azar(6, 12), forma: ['rect', 'rect', 'circulo', 'estrella'][Math.floor(azar(0, 4))],
                color: colores[Math.floor(azar(0, colores.length))],
                vida: 1, desgaste: azar(0.0025, 0.006)
            });
        }
    }

    function estrella(r) {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const ang = (i * Math.PI) / 5 - Math.PI / 2;
            const rad = i % 2 ? r * 0.45 : r;
            ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
        }
        ctx.closePath();
        ctx.fill();
    }

    function cuadro() {
        ctx.clearRect(0, 0, ancho, alto);
        for (let i = particulas.length - 1; i >= 0; i--) {
            const p = particulas[i];
            p.vy += 0.16; p.vx *= 0.992; p.vy *= 0.992;
            p.x += p.vx; p.y += p.vy; p.giro += p.vgiro; p.vida -= p.desgaste;
            if (p.vida <= 0 || p.y > alto + 30) { particulas.splice(i, 1); continue; }
            ctx.save();
            ctx.globalAlpha = Math.min(1, p.vida * 2);
            ctx.translate(p.x, p.y);
            ctx.rotate(p.giro);
            ctx.fillStyle = p.color;
            if (p.forma === 'rect') ctx.fillRect(-p.tam / 2, -p.tam / 4, p.tam, p.tam / 2 * Math.abs(Math.cos(p.giro * 2)) + 2);
            else if (p.forma === 'circulo') { ctx.beginPath(); ctx.arc(0, 0, p.tam / 2.6, 0, Math.PI * 2); ctx.fill(); }
            else estrella(p.tam / 1.6);
            ctx.restore();
        }
        const transcurrido = performance.now() - inicio;
        if (activo && (particulas.length || transcurrido < 5500)) animacion = requestAnimationFrame(cuadro);
    }

    ajustar();
    window.addEventListener('resize', ajustar);

    // Ráfagas: explosión central, cañones laterales y lluvia durante unos segundos
    const temporizadores = [
        setTimeout(() => { ajustar(); lanzar(ancho / 2, alto * 0.38, 170, -90, 180, 13); }, 350),
        setTimeout(() => { lanzar(0, alto * 0.75, 90, -60, 18, 19); lanzar(ancho, alto * 0.75, 90, -120, 18, 19); }, 700),
        ...[1.6, 2.4, 3.2, 4.0].map((s, i) => setTimeout(() => {
            lanzar(i % 2 ? ancho * 0.85 : ancho * 0.15, -10, 45, 90, 35, 5);
        }, s * 1000))
    ];
    animacion = requestAnimationFrame(cuadro);

    return function detener() {
        activo = false;
        temporizadores.forEach(clearTimeout);
        cancelAnimationFrame(animacion);
        window.removeEventListener('resize', ajustar);
    };
}

// --- Decoración propia de cada juego ---
function decoracion(juego) {
    if (juego === 'cr') {
        const piezas = ['clash-corona.svg', 'clash-cofre.svg', 'clash-corona.svg', 'clash-emblema.svg'];
        return Array.from({ length: 12 }, (_, i) => {
            const img = piezas[i % piezas.length];
            const tam = azar(2.2, 4.4).toFixed(1);
            return `<img class="cel-flotante" src="${RUTA_MEDIA}${img}" alt="" style="left:${azar(2, 92).toFixed(1)}%;width:${tam}rem;animation-duration:${azar(7, 13).toFixed(1)}s;animation-delay:${azar(0, 6).toFixed(1)}s">`;
        }).join('');
    }
    const fugaces = Array.from({ length: 7 }, () =>
        `<span class="cel-fugaz" style="top:${azar(-5, 45).toFixed(1)}%;left:${azar(45, 110).toFixed(1)}%;animation-duration:${azar(2.4, 4.2).toFixed(1)}s;animation-delay:${azar(0, 4).toFixed(1)}s"></span>`
    ).join('');
    const sonidos = ONOMATOPEYAS.map(o =>
        `<span class="cel-onomatopeya" aria-hidden="true" style="top:${o.top};left:${o.left};--giro:${o.giro};animation-delay:${o.retraso}s">${o.texto}</span>`
    ).join('');
    return fugaces + sonidos;
}

// --- Pantalla de celebración ---
export function mostrarCelebracion({ juego = 'cr', nombre, subtitulo = '', datos = [], onReiniciar, onCerrar } = {}) {
    const j = JUEGOS[juego] || JUEGOS.cr;
    document.querySelector('.celebracion')?.remove();

    // <section>: así heredan los botones 3D del tema (temas/*.css)
    const capa = document.createElement('section');
    capa.className = `celebracion ${j.clase}`;
    capa.setAttribute('role', 'dialog');
    capa.setAttribute('aria-modal', 'true');
    capa.setAttribute('aria-labelledby', 'cel-titulo');
    capa.innerHTML = `
        <div class="cel-fondo"></div>
        <div class="cel-rayos"></div>
        <div class="cel-decor">${decoracion(juego)}</div>
        <canvas class="cel-confeti" aria-hidden="true"></canvas>
        <button type="button" class="cel-cerrar" data-cerrar title="Cerrar"><i class="fa-solid fa-xmark"></i></button>

        <div class="cel-contenido">
            <div class="cel-trofeo"><img src="${RUTA_MEDIA}${j.trofeo}" alt=""></div>
            ${juego === 'bs' ? `<div class="cel-estrellas" aria-hidden="true">${ESTRELLA_SVG}${ESTRELLA_SVG}${ESTRELLA_SVG}</div>` : ''}
            <div><span id="cel-titulo" class="cel-titulo">${j.titulo}</span></div>
            <p class="cel-lugar"><i class="fa-solid fa-trophy"></i> ${j.lugar}</p>
            <h2 class="cel-nombre">${esc(nombre)}</h2>
            ${subtitulo ? `<p class="cel-sub">${esc(subtitulo)}</p>` : ''}
            ${datos.length ? `<div class="cel-datos">${datos.map(d => `<span class="cel-dato">${esc(d)}</span>`).join('')}</div>` : '<div class="h-5"></div>'}
            <div class="cel-botones">
                <button type="button" data-cerrar class="btn-juego btn-primario"><i class="fa-solid fa-list-ol mr-1"></i> ${j.etiquetaLista}</button>
                ${onReiniciar ? '<button type="button" data-reiniciar class="btn-juego btn-peligro"><i class="fa-solid fa-power-off mr-1"></i> Reiniciar torneo</button>' : ''}
            </div>
        </div>`;

    // El tema del juego da estilo a los botones aunque la página sea otra
    capa.classList.add(juego === 'bs' ? 'tema-brawl' : 'tema-clash');
    const enfocadoAntes = document.activeElement;
    let detenerConfeti = () => {};

    // Mostrar solo cuando los estilos estén listos (evita ver la pantalla sin formato)
    cargarEstilos().then(() => {
        if (capa.classList.contains('cerrando')) return;
        document.body.appendChild(capa);
        document.body.style.overflow = 'hidden';
        if (!reducirMovimiento()) detenerConfeti = iniciarConfeti(capa.querySelector('.cel-confeti'), j.colores);
        setTimeout(() => capa.querySelector('.cel-botones [data-cerrar]')?.focus({ preventScroll: true }), 50);
    });

    function cerrar(despues) {
        if (capa.classList.contains('cerrando')) return;
        capa.classList.add('cerrando');
        document.removeEventListener('keydown', teclas, true);
        detenerConfeti();
        setTimeout(() => {
            capa.remove();
            document.body.style.overflow = '';
            if (enfocadoAntes && enfocadoAntes.focus) enfocadoAntes.focus();
            if (onCerrar) onCerrar();
            if (despues) despues();
        }, 330);
    }

    function teclas(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(); }
        // Mantener el foco dentro de la celebración
        if (e.key === 'Tab') {
            const botones = [...capa.querySelectorAll('button')];
            const i = botones.indexOf(document.activeElement);
            e.preventDefault();
            botones[(i + (e.shiftKey ? -1 : 1) + botones.length) % botones.length].focus();
        }
    }

    capa.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', () => cerrar()));
    capa.querySelector('[data-reiniciar]')?.addEventListener('click', () => cerrar(onReiniciar));
    document.addEventListener('keydown', teclas, true);

    return { cerrar };
}
