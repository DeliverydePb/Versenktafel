// Variables temporales para el asistente de dos pasos
let wizardData = {
    modo: "",          // "CREAR" o "UNIRSE"
    patrullaId: "",    // ID de la patrulla si es UNIRSE
    hostNombre: "",    // Nombre del host si es UNIRSE
    submarino: ""      // Submarino elegido
};

async function cargarEstadoPatrullas() {
    mostrarLoading(true);
    try {
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getPatrullasStatus&email=${encodeURIComponent(userEmail)}`);
        const data = await response.json();

        // Ocultar todos los paneles principales
        document.getElementById("panel-libre").classList.add("hidden");
        document.getElementById("panel-host").classList.add("hidden");
        document.getElementById("panel-invitado").classList.add("hidden");

        if (data.userState === "HOST") {
            document.getElementById("panel-host").classList.remove("hidden");
            document.getElementById("info-patrulla-host").innerHTML = `
                <strong>Tu Submarino:</strong> ${data.activePatrulla.creadorSub}<br>\n                <strong>Fecha Inicio:</strong> ${data.activePatrulla.fechaInicio}<br>\n                <strong>Camaradas en la Manada:</strong> ${data.activePatrulla.invitadosNombres || "Ninguno aún (Esperando en puerto)"}\n            `;
            localStorage.setItem("activePatrullaId", data.activePatrulla.id);
        } 
        else if (data.userState === "INVITADO") {
            document.getElementById("panel-invitado").classList.remove("hidden");
            document.getElementById("info-patrulla-invitado").innerHTML = `
                Te has unido a la patrulla de <strong>${data.activePatrulla.creadorNombre}</strong> (${data.activePatrulla.creadorSub}).<br>\n                <strong>Compañeros en la Manada:</strong> ${data.activePatrulla.invitadosNombres || "Solo tú y el Host"}\n            `;
            localStorage.setItem("activePatrullaId", data.activePatrulla.id);
        } 
        else {
            // EL JUGADOR ESTÁ LIBRE: Reseteamos y mostramos el Paso 1 del Wizard
            document.getElementById("panel-libre").classList.remove("hidden");
            resetWizard();
            renderListaPatrullas(data.disponibles);
        }
    } catch (e) {
        console.error(e);
        alert("Error al sincronizar datos con el cuartel general.");
    } finally {
        mostrarLoading(false);
    }
}

// Renderiza los renglones de la tabla de patrullas activas
function renderListaPatrullas(disponibles) {
    const tbody = document.getElementById("lista-patrullas");
    tbody.innerHTML = "";

    if (!disponibles || disponibles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#777;">No hay patrullas activas de otros capitanes en este momento.</td></tr>`;
        return;
    }

    disponibles.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.creadorNombre}</td>\n            <td>${p.creadorSub}</td>\n            <td>${p.tripulacionCount} comandante(s)</td>\n            <td><button class="btn-unirse-wizard" data-id="${p.id}" data-host="${p.creadorNombre}">Seleccionar</button></td>\n        `;
        tbody.appendChild(tr);
    });

    // Eventos para los botones "Seleccionar" de la tabla
    document.querySelectorAll(".btn-unirse-wizard").forEach(btn => {
        btn.addEventListener("click", (e) => {
            wizardData.modo = "UNIRSE";
            wizardData.patrullaId = e.target.getAttribute("data-id");
            wizardData.hostNombre = e.target.getAttribute("data-host");
            
            // Avanzar a la selección de submarino
            document.getElementById("step-2-unirse").classList.add("hidden");
            document.getElementById("txt-submarino-contexto").innerHTML = `Vas a unirte a la patrulla de <strong>${wizardData.hostNombre}</strong>.`;
            document.getElementById("step-submarino").classList.remove("hidden");
        });
    });
}

// --- LÓGICA DE NAVEGACIÓN DEL ASISTENTE (WIZARD) ---

function resetWizard() {
    wizardData = { modo: "", patrullaId: "", hostNombre: "", submarino: "" };
    document.getElementById("step-1").style.display = "block";
    document.getElementById("step-2-unirse").classList.add("hidden");
    document.getElementById("step-submarino").classList.add("hidden");
    document.getElementById("step-confirmacion").style.display = "none";
}

// Botones del Paso 1
document.getElementById("btn-goto-unirse")?.addEventListener("click", () => {
    document.getElementById("step-1").style.display = "none";
    document.getElementById("step-2-unirse").classList.remove("hidden");
});

document.getElementById("btn-goto-crear")?.addEventListener("click", () => {
    wizardData.modo = "CREAR";
    document.getElementById("step-1").style.display = "none";
    document.getElementById("txt-submarino-contexto").innerHTML = `Vas a <strong>crear e iniciar</strong> una nueva patrulla como líder de manada.`;
    document.getElementById("step-submarino").classList.remove("hidden");
});

// Botones de Volver hacia el Paso 1
document.getElementById("btn-back-to-step1-A")?.addEventListener("click", resetWizard);

document.getElementById("btn-back-to-step2")?.addEventListener("click", () => {
    if (wizardData.modo === "CREAR") {
        resetWizard();
    } else {
        document.getElementById("step-submarino").classList.add("hidden");
        document.getElementById("step-2-unirse").classList.remove("hidden");
    }
});

// Paso 2 -> Paso 3 (Siguiente desde Submarino)
document.getElementById("btn-submarino-siguiente")?.addEventListener("click", () => {
    wizardData.submarino = document.getElementById("select-submarino-wizard").value;
    
    // Armamos el texto dinámico de confirmación
    const txtResumen = document.getElementById("resumen-mision");
    if (wizardData.modo === "CREAR") {
        txtResumen.innerHTML = `<strong>Acción:</strong> Crear una nueva patrulla.<br><strong>Tu Nave:</strong> ${wizardData.submarino}<br><strong>Rol:</strong> Líder de Manada (Host)`;
    } else {
        txtResumen.innerHTML = `<strong>Acción:</strong> Unirse a una patrulla existente.<br><strong>Líder de Manada:</strong> ${wizardData.hostNombre}<br><strong>Tu Nave:</strong> ${wizardData.submarino}<br><strong>Rol:</strong> Invitado`;
    }

    document.getElementById("step-submarino").classList.add("hidden");
    document.getElementById("step-confirmacion").style.display = "block";
});

// Botón Volver desde la Confirmación
document.getElementById("btn-back-to-submarino")?.addEventListener("click", () => {
    document.getElementById("step-confirmacion").style.display = "none";
    document.getElementById("step-submarino").classList.remove("hidden");
});

// ACCIÓN FINAL: Ejecución de peticiones al Servidor
document.getElementById("btn-confirmar-zarpe")?.addEventListener("click", async () => {
    mostrarLoading(true);
    document.getElementById("step-confirmacion").style.display = "none";

    try {
        let params = new URLSearchParams();
        params.append("email", userEmail);
        params.append("gameName", gameName);
        params.append("submarino", wizardData.submarino);

        if (wizardData.modo === "CREAR") {
            params.append("action", "crearPatrulla");
        } else {
            params.append("action", "unirsePatrulla");
            params.append("patrullaId", wizardData.patrullaId);
        }

        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        });

        const data = await response.json();
        if (!data.success) {
            alert("Error: " + (data.message || "No se pudo procesar la orden de zarpe."));
        }
        
        // Recargar el estado para bloquear pantallas
        cargarEstadoPatrullas();

    } catch (error) {
        console.error(error);
        alert("Ocurrió un fallo en la transmisión de radio con el servidor.");
        resetWizard();
    } finally {
        mostrarLoading(false);
    }
});


// --- LÓGICA DE CONTROL DE REPORTES (HOST) ---

document.getElementById("btn-terminar-patrulla")?.addEventListener("click", () => finalizarMision("TERMINADA"));
document.getElementById("btn-cancelar-patrulla")?.addEventListener("click", () => finalizarMision("CANCELADA"));

async function finalizarMision(nuevoEstado) {
    const patrullaId = localStorage.getItem("activePatrullaId");

    if (nuevoEstado === "CANCELADA") {
        if (confirm("¿Seguro que deseas cancelar y anular esta patrulla?")) {
            enviarCierrePatrulla(patrullaId, "CANCELADA", {});
        }
        return;
    }

    const textData = document.getElementById("reporte-raw").value.trim();
    if (!textData) {
        alert("Por favor, pega el reporte de misión para poder finalizar.");
        return;
    }

    const subBlocks = textData.split(/(?=U-\d+)/); 
    const resultadosPorSubmarino = {};

    subBlocks.forEach(block => {
        const subMatch = block.match(/(U-\d+)/);
        if (subMatch) {
            const subName = subMatch[1];
            const statusMatch = block.match(/U-\d+\s+is\s+(alive|was\s+sunk|dead)/i);
            const estaVivo = statusMatch ? (statusMatch[1].toLowerCase() === "alive") : true;
            const tonnageMatch = block.match(/Tonnage\s+Sunk:\s*(\d+)/i);
            const tonelaje = tonnageMatch ? parseInt(tonnageMatch[1], 10) : 0;

            resultadosPorSubmarino[subName] = {
                status: estaVivo ? "TERMINADA" : "HUNDIDO",
                tonelaje: tonelaje
            };
        }
    });

    if (Object.keys(resultadosPorSubmarino).length === 0) {
        alert("No se pudo reconocer ningún formato válido de submarino en el texto pegado.");
        return;
    }

    enviarCierrePatrulla(patrullaId, "TERMINADA", resultadosPorSubmarino);
}

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
                "estadoGlobal": estadoGlobal,
                "datosSubmarinos": JSON.stringify(datosSubmarinos)
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