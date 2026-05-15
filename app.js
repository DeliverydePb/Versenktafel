document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const comandante = document.getElementById('comandante').value.trim();
    const password = document.getElementById('password').value;
    const mensajeDiv = document.getElementById('mensaje');
    
    mensajeDiv.style.color = "#00ff00";
    mensajeDiv.innerText = "Verificando credenciales...";

    try {
        // Enviamos los datos como parámetros en la URL (GET) de forma simple
        const url = `${CONFIG.API_URL}?comandante=${encodeURIComponent(comandante)}&password=${encodeURIComponent(password)}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "success") {
            mensajeDiv.style.color = "#00ff00";
            mensajeDiv.innerText = `Acceso concedido. Bienvenido Comandante ${data.comandante}.`;
            // Aquí puedes redirigir a la página de puntajes
            // window.location.href = "dashboard.html";
        } else {
            mensajeDiv.style.color = "#ff0000";
            mensajeDiv.innerText = `Error: ${data.message}`;
        }
    } catch (error) {
        mensajeDiv.style.color = "#ff0000";
        mensajeDiv.innerText = "Error de conexión con el cuartel general.";
        console.error(error);
    }
});
