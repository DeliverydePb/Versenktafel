// Variables globales para la sesión actual
let currentUserEmail = "";
let currentUserToken = "";

// 1. Inicializar el botón de Google al cargar la ventana
window.onload = function () {
    google.accounts.id.initialize({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse // Función que se ejecuta tras logearse
    });

    // Renderiza el botón nativo de Google
    google.accounts.id.renderButton(
        document.getElementById("buttonDiv"),
        { theme: "outline", size: "large", type: "standard" }
    );

    cargarTablaTonelaje();
};

// 2. Callback que recibe la respuesta de Google
async function handleCredentialResponse(response) {
    currentUserToken = response.credential;

    // Decodificamos el JWT Payload para obtener el email de manera segura
    const base64Url = currentUserToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('0' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const googleUser = JSON.parse(jsonPayload);
    currentUserEmail = googleUser.email;

    document.getElementById("status-message").innerText = "Verificando credenciales en el cuartel general...";
    document.getElementById("google-login-container").classList.add("hidden");

    // Verificar si el correo ya existe en Google Sheets
    await verificarUsuario(currentUserEmail);
}

// 3. Petición a la API de Google Sheets (Web App)
async function verificarUsuario(email) {
    try {
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=checkUser&email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (data.exists) {
            // Guardamos el nombre del juego localmente para usarlo en las siguientes páginas
            localStorage.setItem("gameName", data.gameName);
            localStorage.setItem("userEmail", email);

            // Registrar el último acceso de forma asíncrona
            fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "cors",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    "action": "updateLastAccess",
                    "email": email
                })
            });

            document.getElementById("status-message").innerText = `¡Bienvenido de vuelta, Comandante ${data.gameName}!`;

            // Redireccionar a la página 2 (Patrullas) tras 1.5 segundos
            setTimeout(() => {
                window.location.href = "patrullas.html";
            }, 1500);
        } else {
            // Si no existe, mostramos el formulario para ingresar el Nombre de Juego
            document.getElementById("status-message").innerText = "Registro requerido.";
            document.getElementById("register-form").classList.remove("hidden");
        }
    } catch (error) {
        console.error("Error al verificar usuario:", error);
        document.getElementById("status-message").innerText = "Error de conexión con el servidor.";
        document.getElementById("google-login-container").classList.remove("hidden");
    }
}

// 4. Evento para registrar al nuevo jugador
// Variable de control para saber si ya se le advirtió sobre el nombre duplicado
let nombreAdvertido = false;
let ultimoNombreVerificado = "";

document.getElementById("btn-register")?.addEventListener("click", async () => {
    const gameNameInput = document.getElementById("game-name").value.trim();
    const btnRegister = document.getElementById("btn-register");

    if (!gameNameInput) {
        alert("Por favor, ingresa un nombre válido para el juego.");
        return;
    }

    // Si el usuario cambió el nombre después de la advertencia, reiniciamos el flujo de control
    if (gameNameInput !== ultimoNombreVerificado) {
        nombreAdvertido = false;
        btnRegister.innerText = "Completar Registro";
        btnRegister.style.backgroundColor = ""; // Restablecer color original
    }

    // PASO 1: Si no ha sido advertido, verificamos si el nombre ya existe
    if (!nombreAdvertido) {
        document.getElementById("status-message").innerText = "Verificando disponibilidad del nombre de comandante...";
        try {
            const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=checkName&gameName=${encodeURIComponent(gameNameInput)}`);
            const data = await response.json();

            if (data.exists) {
                // El nombre ya existe: Lanzamos advertencia y preparamos el botón para confirmar
                ultimoNombreVerificado = gameNameInput;
                nombreAdvertido = true;

                document.getElementById("status-message").innerText = "⚠️ Advertencia: Nombre en uso.";
                alert(`¡Atención! Ya existe un comandante registrado como "${gameNameInput}". Si continúas, en las tablas se verán dos [${gameNameInput}]. Te sugerimos cambiarlo o añadirle un distintivo (ej. ${gameNameInput}_24F).`);

                // Modificamos visualmente el botón para que sepa que el próximo clic confirma
                btnRegister.innerText = "Confirmar nombre duplicado de todos modos";
                btnRegister.style.backgroundColor = "#dc3545"; // Color rojo de advertencia
                return; // Frenamos la ejecución para que el usuario decida si editar o presionar de nuevo
            }
        } catch (error) {
            console.error("Error al verificar el nombre:", error);
            // Si el servicio de verificación falla, permitimos continuar por seguridad
        }
    }

    // PASO 2: Si el nombre está libre o el usuario decide ignorar la advertencia y presionar por segunda vez
    document.getElementById("status-message").innerText = "Inscribiendo nuevo perfil en la flotilla...";
    document.getElementById("register-form").classList.add("hidden");

    try {
        // Enviamos los datos por POST a la Web App de Google para registrar
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                "action": "registerUser",
                "email": currentUserEmail,
                "gameName": gameNameInput
            })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("gameName", gameNameInput);
            localStorage.setItem("userEmail", currentUserEmail);

            document.getElementById("status-message").innerText = `¡Registro Exitoso! Bienvenido Comandante ${gameNameInput}.`;
            setTimeout(() => {
                window.location.href = "patrullas.html";
            }, 1500);
        } else {
            alert("Error al registrar: " + data.message);
            document.getElementById("register-form").classList.remove("hidden");
            // Restablecer botón en caso de error de inserción
            nombreAdvertido = false;
            btnRegister.innerText = "Completar Registro";
            btnRegister.style.backgroundColor = "";
        }
    } catch (error) {
        console.error("Error en el registro:", error);
        document.getElementById("status-message").innerText = "Error al procesar el registro.";
        document.getElementById("register-form").classList.remove("hidden");
        // Restablecer botón
        nombreAdvertido = false;
        btnRegister.innerText = "Completar Registro";
        btnRegister.style.backgroundColor = "";
    }
});

let tonelajeData = [];

async function cargarTablaTonelaje() {
    const tbody = document.querySelector("#tonelaje-table tbody");

    try {
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getTonelaje`);
        const result = await response.json();

        if (!result.data || !Array.isArray(result.data)) {
            tbody.innerHTML = "<tr><td colspan='4'>No se encontraron datos.</td></tr>";
            return;
        }

        tonelajeData = result.data.map(row => ({
            Comandante: row.Comandante || "",
            Toneladas: parseFloat(row.Toneladas) || 0,
            Patrullas: parseFloat(row.Patrullas) || 0,
            TonPatrulla: parseFloat(row["Ton/Patrulla"] || row.TonPatrulla) || 0
        }));

        renderizarTabla(tonelajeData);
    } catch (error) {
        console.error("Error cargando tabla de tonelaje:", error);
        tbody.innerHTML = "<tr><td colspan='4'>Error al cargar la tabla.</td></tr>";
    }
}

function renderizarTabla(data) {
    const tbody = document.querySelector("#tonelaje-table tbody");
    if (!data.length) {
        tbody.innerHTML = "<tr><td colspan='4'>No hay datos disponibles.</td></tr>";
        return;
    }

    tbody.innerHTML = data.map(row => `
        <tr>
            <td>${row.Comandante}</td>
            <td>${row.Toneladas}</td>
            <td>${row.Patrullas}</td>
            <td>${row.TonPatrulla}</td>
        </tr>
    `).join("");
}

document.querySelectorAll(".table-controls button").forEach(button => {
    button.addEventListener("click", () => {
        const key = button.dataset.sort;
        const sorted = [...tonelajeData].sort((a, b) => {
            if (typeof a[key] === "number" && typeof b[key] === "number") {
                return b[key] - a[key];
            }
            return a[key].localeCompare(b[key]);
        });
        renderizarTabla(sorted);
    });
});