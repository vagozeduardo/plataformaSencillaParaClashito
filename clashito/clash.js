// --- LÓGICA DE NAVEGACIÓN ENTRE FASES ---
    
    const tabs = document.querySelectorAll('.tab-fase');
    const tituloFase = document.getElementById('titulo-fase');
    const descFase = document.getElementById('desc-fase');

    // Textos correspondientes a cada fase
    const infoFases = {
        "1": {
            titulo: "Fase 1: Todos vs Todos",
            desc: "Combate general. <span class='text-amber-400 font-bold'>Solo los primeros 15 avanzan a F2.</span>"
        },
        "2": {
            titulo: "Fase 2: X3 Elixir",
            desc: "Locura de elixir. <span class='text-amber-400 font-bold'>Solo los 10 mejores sobreviven y avanzan a F3.</span>"
        },
        "3": {
            titulo: "Fase 3: Modo Dios",
            desc: "Todos contra todos extremo. <span class='text-amber-400 font-bold'>Pasan los 4 con más victorias.</span>"
        },
        "4": {
            titulo: "Fase 4: Semifinal (Mejor de 3)",
            desc: "Enfrentamiento directo entre los 4 mejores. <span class='text-amber-400 font-bold'>Los 2 ganadores van a la final.</span>"
        },
        "5": {
            titulo: "Fase 5: Gran Final",
            desc: "El duelo definitivo por la corona galáctica. <span class='text-amber-400 font-bold'>Al mejor de 5.</span>"
        }
    };

    let faseActual = "1"; // Empezamos en la fase 1

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // 1. Quitar estilos activos a TODAS las pestañas
            tabs.forEach(t => {
                t.classList.remove('text-[#00d2ff]', 'border-b-2', 'border-[#00d2ff]', 'bg-[#00d2ff]/10');
                if(!t.classList.contains('text-amber-500')){ // No quitarle el dorado a la final
                    t.classList.add('text-slate-500');
                }
            });

            // 2. Poner estilo activo a la pestaña que fue clickeada
            const tabClickeada = e.currentTarget;
            faseActual = tabClickeada.getAttribute('data-fase'); // Obtenemos si es la 1, 2, 3...
            
            tabClickeada.classList.remove('text-slate-500');
            tabClickeada.classList.add('text-[#00d2ff]', 'border-b-2', 'border-[#00d2ff]', 'bg-[#00d2ff]/10');

            // 3. Cambiar los textos de la cabecera dinámicamente
            tituloFase.innerHTML = infoFases[faseActual].titulo;
            descFase.innerHTML = infoFases[faseActual].desc;

            // 4. Volver a renderizar los jugadores (Aquí a futuro pondremos un filtro para que solo salgan los que pasaron)
            renderizarJugadores();
        });
    });