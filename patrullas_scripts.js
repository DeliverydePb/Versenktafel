const gameName = localStorage.getItem("gameName");
const userEmail = localStorage.getItem("userEmail");

// Verificar si el usuario está logueado legítimamente
if (!gameName || !userEmail) {
    window.location.href = "index.html";
}

document.getElementById("player-display").innerText = `Capitán: ${gameName}`;

// Al cargar la página, buscamos el estado de las patrullas
window.onload = function () {
    cargarEstadoPatrullas();
};

async function cargarEstadoPatrullas() {
    mostrarLoading(true);
    try {
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getPatrullasStatus&email=${encodeURIComponent(userEmail)}`);
        const data = await response.json();

        // Ocultar todos los páneles primero
        document.getElementById("panel-libre").classList.add("hidden");
        document.getElementById("panel-host").classList.add("hidden");
        document.getElementById("panel-invitado").classList.add("hidden");

        if (data.userState === "HOST") {
            document.getElementById("panel-host").classList.remove("hidden");
            document.getElementById("info-patrulla-host").innerHTML = `
                <strong>Tu Submarino:</strong> ${data.activePatrulla.creadorSub}<br>
                <strong>Fecha Inicio:</strong> ${data.activePatrulla.fechaInicio}<br>
                <strong>Camaradas en la Manada:</strong> ${data.activePatrulla.invitadosNombres || "Ninguno aún (Esperando en puerto)"}
            `;
            // Guardamos el ID de la patrulla activa del host
            localStorage.setItem("activePatrullaId", data.activePatrulla.id);
        }
        else if (data.userState === "INVITADO") {
            document.getElementById("panel-invitado").classList.remove("hidden");
            document.getElementById("info-patrulla-invitado").innerHTML = `
                Estás asignado a la patrulla comandada por <strong>${data.activePatrulla.creadorNombre}</strong>.<br>
                <strong>Su submarino:</strong> ${data.activePatrulla.creadorSub} | <strong>Tu submarino:</strong> ${data.mySub}<br>
                <strong>Fecha de zarpe:</strong> ${data.activePatrulla.fechaInicio}
            `;
        }
        else {
            // Usuario LIBRE: Renderizar la lista de patrullas disponibles para unirse
            document.getElementById("panel-libre").classList.remove("hidden");
            const tbody = document.getElementById("lista-patrullas");
            tbody.innerHTML = "";

            if (data.disponibles && data.disponibles.length > 0) {
                data.disponibles.forEach(patrulla => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${patrulla.creadorNombre}</td>
                        <td>${patrulla.creadorSub}</td>
                        <td>${patrulla.tripulacionCount} cap.</td>
                        <td><button onclick="unirseAPatrulla('${patrulla.id}')">Unirse</button></td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay patrullas activas en este momento. ¡Inicia una!</td></tr>`;
            }
        }
    } catch (error) {
        console.error("Error al cargar patrullas:", error);
    } finally {
        mostrarLoading(false);
    }
}

// Evento: Crear Patrulla
document.getElementById("btn-crear-patrulla").addEventListener("click", async () => {
    const subSeleccionado = document.getElementById("select-sub-crear").value;
    mostrarLoading(true);

    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                "action": "crearPatrulla",
                "email": userEmail,
                "gameName": gameName,
                "submarino": subSeleccionado
            })
        });
        const data = await response.json();
        if (data.success) {
            cargarEstadoPatrullas();
        } else {
            alert(data.message);
        }
    } catch (e) {
        alert("Error al conectar con la flotilla.");
    }
});

// Función: Unirse a una Patrulla existente
async function unirseAPatrulla(patrullaId) {
    const subSeleccionado = document.getElementById("select-sub-unirse").value;
    mostrarLoading(true);

    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                "action": "unirsePatrulla",
                "patrullaId": patrullaId,
                "email": userEmail,
                "gameName": gameName,
                "submarino": subSeleccionado
            })
        });
        const data = await response.json();
        if (data.success) {
            cargarEstadoPatrullas();
        } else {
            alert(data.message);
        }
    } catch (e) {
        alert("Error intentando unirse a la patrulla.");
    }
}

// Eventos del Host: Terminar o Cancelar
document.getElementById("btn-terminar-patrulla").addEventListener("click", () => finalizarMision("TERMINADA"));
document.getElementById("btn-cancelar-patrulla").addEventListener("click", () => {
    if (confirm("¿Seguro que deseas cancelar y anular esta patrulla?")) {
        finalizarMision("CANCELADA");
    }
});

async function finalizarMision(nuevoEstado) {
    const patrullaId = localStorage.getItem("activePatrullaId");

    if (nuevoEstado === "CANCELADA") {
        if (confirm("¿Seguro que deseas cancelar y anular esta patrulla?")) {
            enviarCierrePatrulla(patrullaId, "CANCELADA", {});
        }
        return;
    }

    // Si es TERMINADA, procesamos el reporte de texto
    const textData = document.getElementById("reporte-raw").value.trim();
    if (!textData) {
        alert("Por favor, pega el reporte de misión para poder finalizar.");
        return;
    }

    // --- LÓGICA DE PARSEO DE DATOS ---
    // Separamos el bloque por submarinos usando expresiones regulares
    const subBlocks = textData.split(/(?=U-\d+)/);
    const resultadosPorSubmarino = {};

    subBlocks.forEach(block => {
        // Buscamos el nombre del submarino (ej: U-564 o U-307)
        const subMatch = block.match(/(U-\d+)/);
        if (subMatch) {
            const subName = subMatch[1];

            // Extraemos si sobrevivió o fue hundido ("is alive" o "was sunk")
            const statusMatch = block.match(/U-\d+\s+is\s+(alive|was\s+sunk|dead)/i);
            const estaVivo = statusMatch ? (statusMatch[1].toLowerCase() === "alive") : true;

            // Extraemos el tonelaje hundido numérico
            const tonnageMatch = block.match(/Tonnage\s+Sunk:\s*(\d+)/i);
            const tonelaje = tonnageMatch ? parseInt(tonnageMatch[1], 10) : 0;

            resultadosPorSubmarino[subName] = {
                status: estaVivo ? "TERMINADA" : "HUNDIDO",
                tonelaje: tonelaje
            };
        }
    });

    if (Object.keys(resultadosPorSubmarino).length === 0) {
        alert("No se pudo reconocer ningún formato válido de submarino (U-96, U-552...) en el texto pegado.");
        return;
    }

    // Enviamos los datos procesados
    enviarCierrePatrulla(patrullaId, "TERMINADA", resultadosPorSubmarino);
}

// Función auxiliar para despachar los datos al servidor
async function enviarCierrePatrulla(patrullaId, estadoGlobal, datosSubmarinos) {
    mostrarLoading(true);
    try {
        await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                "action": "finalizarPatrulla",
                "patrullaId": patrullaId,
                "estadoGlobal": estadoGlobal, // TERMINADA o CANCELADA
                "datosSubmarinos": JSON.stringify(datosSubmarinos) // Enviamos el JSON estructurado
            })
        });
        localStorage.removeItem("activePatrullaId");
        cargarEstadoPatrullas();
    } catch (e) {
        alert("Error al procesar el fin de la patrulla.");
    } finally {
        mostrarLoading(false);
    }
}

function mostrarLoading(show) {
    document.getElementById("loading-message").classList.toggle("hidden", !show);
}

document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
});