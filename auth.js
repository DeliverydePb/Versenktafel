// LÓGICA DE AUTENTICACIÓN Y VERIFICACIÓN EN GOOGLE SHEETS

let usuarioActual = { email: "", name: "" };

// 1. Inicializar el botón de Google utilizando el objeto CONFIG
window.onload = function () {
    google.accounts.id.initialize({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
        document.getElementById("buttonDiv"),
        { theme: "outline", size: "large", type: "standard" }
    );
};

// 2. Procesar la respuesta de autenticación de Google
function handleCredentialResponse(response) {
    const responsePayload = parseJwt(response.credential);
    usuarioActual.email = responsePayload.email;
    usuarioActual.name = responsePayload.name;

    // Ocultar botón de login
    document.getElementById("buttonDiv").classList.add("hidden");

    // Verificar si ya existe en Google Sheets
    verificarUsuarioEnSheets(usuarioActual.email);
}

// Función auxiliar para decodificar el token de Google
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// 3. Buscar el email en la planilla de Google Sheets usando las constantes externas
async function verificarUsuarioEnSheets(email) {
    const rango = "Usuarios!A:B"; 
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${rango}?key=${CONFIG.GOOGLE_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const filas = data.values || [];

        const usuarioEncontrado = filas.find(fila => fila[0].toLowerCase() === email.toLowerCase());

        if (usuarioEncontrado) {
            ingresarAPatrullas(usuarioEncontrado[1]);
        } else {
            document.getElementById("registerForm").classList.remove("hidden");
        }
    } catch (error) {
        console.error("Error al conectar con Google Sheets:", error);
        alert("Error de conexión con la base de datos.");
    }
}

// 4. Registrar nuevo comandante localmente
async function registrarComandante() {
    const comandante = document.getElementById("commanderName").value.trim();
    if (!comandante) {
        alert("Por favor, ingrese un Nombre de Comandante válido.");
        return;
    }
    
    ingresarAPatrullas(comandante);
}

function ingresarAPatrullas(nombreComandante) {
    localStorage.setItem("sesionActiva", "true");
    localStorage.setItem("emailUsuario", usuarioActual.email);
    localStorage.setItem("nombreComandante", nombreComandante);
    
    window.location.href = "patrullas.html";
}