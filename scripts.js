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
};

// 2. Callback que recibe la respuesta de Google
async function handleCredentialResponse(response) {
    currentUserToken = response.credential;
    
    // Decodificamos el JWT Payload para obtener el email de manera segura
    const base64Url = currentUserToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
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
            
            // Redireccionar a la página 2 (Lobby / Partidas) tras 1.5 segundos
            setTimeout(() => {
                window.location.href = "lobby.html";
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
document.getElementById("btn-register")?.addEventListener("click", async () => {
    const gameNameInput = document.getElementById("game-name").value.trim();
    
    if (!gameNameInput) {
        alert("Por favor, ingresa un nombre válido para el juego.");
        return;
    }

    document.getElementById("status-message").innerText = "Inscribiendo nuevo perfil...";
    document.getElementById("register-form").classList.add("hidden");

    try {
        // Enviamos los datos por POST a la Web App de Google
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
            
            document.getElementById("status-message").innerText = `¡Registro Exitoso! Bienvenido ${gameNameInput}.`;
            setTimeout(() => {
                window.location.href = "lobby.html";
            }, 1500);
        } else {
            alert("Error al registrar: " + data.message);
            document.getElementById("register-form").classList.remove("hidden");
        }
    } catch (error) {
        console.error("Error en el registro:", error);
        document.getElementById("status-message").innerText = "Error al procesar el registro.";
        document.getElementById("register-form").classList.remove("hidden");
    }
});