// js/scripts.js

// Variables de Estado de la Aplicación (en memoria)
let usuarioLogueado = null;
let direccionOrden = false;

// ==========================================
// 1. INICIALIZADOR PRINCIPAL (DOM Content Loaded)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
     verificarSesion();

    // Detectar en qué página estamos según los elementos existentes en el DOM
    if (document.getElementById("tabla-tonelaje")) {
        inicializarPaginaInicio();
    }
    
    if (document.getElementById("btn-crear-patrulla")) {
        inicializarPaginaPatrullas();
    }
    
    if (document.getElementById("btn-procesar-archivo")) {
        inicializarPaginaResultados();
    }
});

// Verificación de persistencia mediante LocalStorage
function verificarSesion() {
    const sessionData = localStorage.getItem("u_boot_session");
    if (sessionData) {
        usuarioLogueado = JSON.parse(sessionData);
        
        // Si hay un contenedor para mostrar el nombre del comandante
        const display = document.getElementById("user-display");
        if (display) display.textContent = usuarioLogueado.nombre;
    } else {
        // Si no está logueado y no está en la página de login (index.html), redirigir
        const esIndex = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";
        if (!esIndex) {
            window.location.href = "index.html";
        }
    }
}

// ==========================================
// 2. LÓGICA DE LA PÁGINA 1: INDEX / LOGIN / TABLA
// ==========================================
function inicializarPaginaInicio() {
    cargarTablaPosiciones();

    // Inicializar Google Identity Services
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: CONFIG.GOOGLE_CLIENT_ID,
            callback: handleGoogleLoginResponse
        });
        google.accounts.id.renderButton(
            document.getElementById("buttonDiv"),
            { theme: "dark", size: "large", text: "signin_with" }
        );
    }

    // Listener para el botón de Registro (enviar datos a Google Sheets)
    document.getElementById("btn-registrar").addEventListener("click", registrarNuevoComandante);

    // Alternar entre paneles visuales
    document.getElementById("btn-mostrar-registro").addEventListener("click", () => {
        document.getElementById("login-container").style.display = "none";
        document.getElementById("register-container").style.display = "block";
    });

    document.getElementById("btn-cancelar-registro").addEventListener("click", () => {
        document.getElementById("register-container").style.display = "none";
        document.getElementById("login-container").style.display = "block";
    });
} // <--- Esta llave cierra correctamente la función inicializarPaginaInicio

// Callback cuando Google valida la identidad del usuario
async function handleGoogleLoginResponse(response) {
    // Decodificar el JWT token para obtener el ID de google y el email (opcional)
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    const googleId = payload.sub; 

    // Consultar al backend si el Google ID ya tiene un comandante asignado
    const resultado = await llamarGoogleScript("loginUsuario", { googleId: googleId });

    if (resultado && resultado.registrado) {
        // Usuario ya existe, guardar sesión e ir a la sala de mapas
        guardarSesionLocal(resultado.nombre, googleId);
        window.location.href = "patrullas.html";
    } else {
        // No está registrado en la planilla. Mostrar formulario para capturar su alias de juego
        document.getElementById("login-container").style.display = "none";
        const regContainer = document.getElementById("register-container");
        regContainer.style.display = "block";
        // Guardamos temporalmente el ID verificado en el botón para usarlo al registrar
        document.getElementById("btn-registrar").dataset.googleId = googleId;
    }
}

async function registrarNuevoComandante() {
    const nombreUsuario = document.getElementById("reg-username").value.trim();
    const googleId = document.getElementById("btn-registrar").dataset.googleId;

    if (!nombreUsuario) {
        alert("Por favor, introduzca su nombre de usuario del juego.");
        return;
    }

    const resultado = await llamarGoogleScript("registrarUsuario", {
        googleId: googleId,
        nombre: nombreUsuario
    });

    if (resultado && resultado.exito) {
        guardarSesionLocal(nombreUsuario, googleId);
        window.location.href = "patrullas.html";
    } else {
        alert("Error al registrar: " + (resultado.mensaje || "Nombre ya en uso o fallo del servidor."));
    }
}

function guardarSesionLocal(nombre, googleId) {
    usuarioLogueado = { nombre: nombre, googleId: googleId };
    localStorage.setItem("u_boot_session", JSON.stringify(usuarioLogueado));
}

// Carga e inserción dinámica de datos de la planilla
async function cargarTablaPosiciones() {
    const tbody = document.getElementById("tabla-body");
    tbody.innerHTML = "<tr><td colspan='6'>Cargando registros del Cuartel General...</td></tr>";
    
    const data = await llamarGoogleScript("obtenerLeaderboard");
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = "<tr><td colspan='6'>No hay comandantes registrados aún.</td></tr>";
        return;
    }

    data.forEach(jugador => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${jugador.nombre}</td>
            <td>${jugador.patrullasCarrera}</td>
            <td>${jugador.tonsCarrera.toLocaleString()} t</td>
            <td>${Number(jugador.indiceTons).toFixed(1)} t/p</td>
            <td>${jugador.maxTonsCarrera.toLocaleString()} t</td>
            <td>${jugador.maxPatrullasCarrera}</td>
        `;
        tbody.innerHTML += fila.innerHTML;
    });
}

// Ordenamiento nativo de la tabla HTML
function ordenarTabla(columnaIndex) {
    const tabla = document.getElementById("tabla-tonelaje");
    const filas = Array.from(tabla.rows).slice(1);
    direccionOrden = !direccionOrden;

    filas.sort((filaA, filaB) => {
        let celdaA = filaA.cells[columnaIndex].innerText.replace(/[\s,t]/g, ''); // Limpiar 't' de toneladas
        let celdaB = filaB.cells[columnaIndex].innerText.replace(/[\s,t]/g, '');

        if (!isNaN(celdaA) && !isNaN(celdaB)) {
            return direccionOrden ? Number(celdaA) - Number(celdaB) : Number(celdaB) - Number(celdaA);
        }
        return direccionOrden ? celdaA.localeCompare(celdaB) : celdaB.localeCompare(celdaA);
    });

    const tbody = document.getElementById("tabla-body");
    tbody.innerHTML = "";
    filas.forEach(fila => tbody.appendChild(fila));
}

// ==========================================
// 3. LÓGICA DE LA PÁGINA 2: GESTIÓN DE PATRULLAS
// ==========================================
function inicializarPaginaPatrullas() {
    actualizarPanelPatrullas();
    
    document.getElementById("btn-crear-patrulla").addEventListener("click", crearPatrulla);
    document.getElementById("btn-cancelar-patrulla").addEventListener("click", cancelarPatrulla);
    document.getElementById("btn-ir-resultados").addEventListener("click", () => {
        window.location.href = "resultados.html";
    });
}

async function actualizarPanelPatrullas() {
    const estadoFlotilla = await llamarGoogleScript("obtenerEstadoPatrullas", { nombre: usuarioLogueado.nombre });
    
    const secCrear = document.getElementById("crear-patrulla-sec");
    const secMiPatrulla = document.getElementById("mi-patrulla-sec");
    const listaPatrullas = document.getElementById("lista-patrullas");

    // Caso 1: El usuario ya está en una patrulla activa (sea creador o invitado)
    if (estadoFlotilla.enPatrulla) {
        secCrear.style.display = "none";
        secMiPatrulla.style.display = "block";
        
        const detalle = document.getElementById("detalle-mi-patrulla");
        detalle.innerHTML = `<p><strong>ID Misión:</strong> ${estadoFlotilla.idPatrulla}</p>
                             <p><strong>Líder de Flotilla:</strong> ${estadoFlotilla.creador}</p>
                             <p><strong>Tu Submarino asignado:</strong> ${estadoFlotilla.miSubmarino}</p>`;

        if (estadoFlotilla.esCreador) {
            document.getElementById("acciones-creador").style.display = "block";
            document.getElementById("txt-espera-invitado").style.display = "none";
        } else {
            document.getElementById("acciones-creador").style.display = "none";
            document.getElementById("txt-espera-invitado").style.display = "block";
        }
    } 
    // Caso 2: El usuario está libre y puede crear o unirse
    else {
        secCrear.style.display = "block";
        secMiPatrulla.style.display = "none";
        
        // Renderizar patrullas creadas por otros a las que se puede unir
        listaPatrullas.innerHTML = "";
        if (estadoFlotilla.patrullasDisponibles && estadoFlotilla.patrullasDisponibles.length > 0) {
            estadoFlotilla.patrullasDisponibles.forEach(p => {
                const card = document.createElement("div");
                card.className = "patrulla-card";
                card.innerHTML = `
                    <div>
                        <strong>Comandante Líder:</strong> ${p.creador} <br>
                        <small>Misión Abierta. Elige tu submarino para unirte:</small>
                        <select id="sub-join-${p.idPatrulla}">
                            <option value="U-96">U-96</option>
                            <option value="U-552">U-552</option>
                            <option value="U-564">U-564</option>
                            <option value="U-307">U-307</option>
                        </select>
                    </div>
                    <button onclick="unirseAPatrulla('${p.idPatrulla}')">Unirse a Misión</button>
                `;
                listaPatrullas.appendChild(card);
            });
        } else {
            listaPatrullas.innerHTML = "<p>No hay operaciones conjuntas activas en este momento.</p>";
        }
    }
}

async function crearPatrulla() {
    const submarino = document.getElementById("select-sub-creador").value;
    const res = await llamarGoogleScript("crearPatrulla", {
        creador: usuarioLogueado.nombre,
        submarino: submarino
    });
    if (res && res.exito) {
        actualizarPanelPatrullas();
    } else {
        alert("No se pudo iniciar la patrulla.");
    }
}

async function unirseAPatrulla(idPatrulla) {
    const selectElement = document.getElementById(`sub-join-${idPatrulla}`);
    const submarinoSeleccionado = selectElement.value;

    const res = await llamarGoogleScript("unirseAPatrulla", {
        idPatrulla: idPatrulla,
        nombre: usuarioLogueado.nombre,
        submarino: submarinoSeleccionado
    });

    if (res && res.exito) {
        actualizarPanelPatrullas();
    } else {
        alert("Error al intentar unirse a la misión.");
    }
}

async function cancelarPatrulla() {
    if (confirm("¿Está seguro de que desea abortar la patrulla? Nadie sumará tonelaje.")) {
        const res = await llamarGoogleScript("cancelarPatrulla", { creador: usuarioLogueado.nombre });
        if (res && res.exito) {
            actualizarPanelPatrullas();
        }
    }
}

// ==========================================
// 4. LÓGICA DE LA PÁGINA 3: CARGA DE RESULTADOS
// ==========================================
function inicializarPaginaResultados() {
    document.getElementById("btn-procesar-archivo").addEventListener("click", procesarArchivoResultados);
}

function procesarArchivoResultados() {
    const fileInput = document.getElementById("file-resultados");
    if (fileInput.files.length === 0) {
        alert("Por favor, seleccione el archivo de bitácora de la partida.");
        return;
    }

    const archivo = fileInput.files[0];
    const lector = new FileReader();

    lector.onload = async function(e) {
        const contenido = e.target.result;
        let datosPartida = null;

        // Intentar parsear como JSON o procesar texto plano según defina el formato de tu juego
        try {
            datosPartida = JSON.parse(contenido);
        } catch (err) {
            // Si es texto plano, puedes armar aquí un parseador customizado. 
            // Para este ejemplo asumimos que logras estructurar un JSON con los resultados.
            alert("El archivo no contiene un formato JSON válido. Asegúrate de procesar la estructura correcta.");
            return;
        }

        // Enviar la estructura del reporte al Google Apps Script para el cálculo matemático final
        const res = await llamarGoogleScript("terminarYProcesarPatrulla", {
            creador: usuarioLogueado.nombre,
            reporte: datosPartida // Ejemplo: { "U-96": { toneladas: 15000, destruido: false }, "U-552": { toneladas: 0, destruido: true } }
        });

        if (res && res.exito) {
            alert("¡Reporte procesado por el BDU con éxito! Retornando a la base.");
            window.location.href = "index.html"; // Retorna a la tabla para ver las nuevas posiciones
        } else {
            alert("Error en el procesamiento del archivo: " + res.mensaje);
        }
    };

    lector.readAsText(archivo);
}

// ==========================================
// 5. MOTOR DE COMUNICACIÓN CON APPS SCRIPT
// ==========================================
async function llamarGoogleScript(accion, datos = {}) {
    try {
        const respuesta = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ accion: accion, ...datos })
        });
        return await respuesta.json();
    } catch (error) {
        console.error("Fallo de comunicación por radio con el Cuartel General:", error);
    }
}