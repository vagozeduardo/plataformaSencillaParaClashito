// registro.js
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-registro");
    const btnSubmit = document.getElementById("btn_submit");
    const inputs = [
        document.getElementById("nombre"),
        document.getElementById("gamertag"),
        document.getElementById("id_jugador")
    ];
    const selectTorneo = document.getElementById("torneo_select");
    const equipoContainer = document.getElementById("equipo_container");
    const equipoInput = document.getElementById("equipo_input");
    const datalistEquipos = document.getElementById("lista_equipos");
    const mensajeExito = document.getElementById("mensaje_exito");

    // 1. CARGAR EQUIPOS EXISTENTES DE LOCALSTORAGE
    function cargarEquiposDatalist() {
        const equiposBs = JSON.parse(localStorage.getItem("equipos_bs")) || [];
        datalistEquipos.innerHTML = "";
        equiposBs.forEach(equipo => {
            const option = document.createElement("option");
            option.value = equipo.nombre;
            datalistEquipos.appendChild(option);
        });
    }

    // 2. VALIDAR FORMULARIO EN TIEMPO REAL
    function validarFormulario() {
        // Checar que campos base no estén vacíos
        let esValido = inputs.every(input => input.value.trim() !== "");
        
        // Si es Brawl Stars, el equipo también es obligatorio
        if (selectTorneo.value === "bs" && equipoInput.value.trim() === "") {
            esValido = false;
        }

        // Habilitar o deshabilitar botón
        btnSubmit.disabled = !esValido;
    }

    // 3. MOSTRAR/OCULTAR CAMPO DE EQUIPO
    selectTorneo.addEventListener("change", (e) => {
        if (e.target.value === "bs") {
            equipoContainer.classList.remove("hidden");
            cargarEquiposDatalist(); // Refrescar lista por si se creó uno nuevo
        } else {
            equipoContainer.classList.add("hidden");
            equipoInput.value = ""; // Limpiar campo si se oculta
        }
        validarFormulario();
    });

    // Escuchar escritura para validar
    inputs.forEach(input => input.addEventListener("input", validarFormulario));
    equipoInput.addEventListener("input", validarFormulario);

    // 4. GUARDAR EN LOCALSTORAGE AL ENVIAR
    form.addEventListener("submit", (e) => {
        e.preventDefault(); // Evitar que la página recargue

        const nuevoJugador = {
            id: Date.now().toString(), // Generar un ID único
            nombre: document.getElementById("nombre").value.trim(),
            gamertag: document.getElementById("gamertag").value.trim(),
            tag_jugador: document.getElementById("id_jugador").value.trim()
        };

        const juegoSeleccionado = selectTorneo.value;

        if (juegoSeleccionado === "cr") {
            // Lógica Clash Royale
            nuevoJugador.victorias = 0;
            nuevoJugador.estado = "activo"; // activo o eliminado
            
            const jugadoresCR = JSON.parse(localStorage.getItem("jugadores_cr")) || [];
            jugadoresCR.push(nuevoJugador);
            localStorage.setItem("jugadores_cr", JSON.stringify(jugadoresCR));

        } else if (juegoSeleccionado === "bs") {
            // Lógica Brawl Stars
            const nombreEquipo = equipoInput.value.trim().toUpperCase();
            nuevoJugador.equipo = nombreEquipo;

            // 1. Guardar Jugador
            const jugadoresBS = JSON.parse(localStorage.getItem("jugadores_bs")) || [];
            jugadoresBS.push(nuevoJugador);
            localStorage.setItem("jugadores_bs", JSON.stringify(jugadoresBS));

            // 2. Revisar si el Equipo ya existe, si no, crearlo
            const equiposBS = JSON.parse(localStorage.getItem("equipos_bs")) || [];
            const equipoExiste = equiposBS.find(eq => eq.nombre === nombreEquipo);
            
            if (!equipoExiste) {
                equiposBS.push({
                    nombre: nombreEquipo,
                    puntos: 0,
                    estado: "activo"
                });
                localStorage.setItem("equipos_bs", JSON.stringify(equiposBS));
            }
        }

        // 5. FEEDBACK VISUAL Y RESET
        form.reset();
        validarFormulario(); // Vuelve a deshabilitar el botón
        if (juegoSeleccionado === "cr") equipoContainer.classList.add("hidden");

        mensajeExito.classList.remove("hidden");
        setTimeout(() => {
            mensajeExito.classList.add("hidden");
        }, 3000);
    });
});