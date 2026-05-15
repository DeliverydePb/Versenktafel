document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const comandante = document.getElementById('comandante').value.trim();
    const password = document.getElementById('password').value;
    const mensajeDiv = document.getElementById('mensaje');
    
    mensajeDiv.style.color = "#00ff00";
    mensajeDiv.innerText = "Verificando credenciales...";

    try {
        // Enviamos los datos como parámetros en la URL (GET) de forma simple
        const url = `${CONFIG.API_URL}?action=login&comandante=${encodeURIComponent(comandante)}&password=${encodeURIComponent(password)}`;
        
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
// 2. Nueva función para cargar el Tonelaje (Leaderboard)
async function cargarTonelaje() {
    const tablaCuerpo = document.getElementById('cuerpoTabla');
    const tablaHeaders = document.getElementById('headers');

    try {
        const response = await fetch(`${CONFIG.API_URL}?action=getTonelaje`);
        const data = await response.json();

        // Limpiar tabla
        tablaHeaders.innerHTML = "";
        tablaCuerpo.innerHTML = "";

        if (data.length > 0) {
            // Crear cabeceras dinámicamente según tu Excel
            Object.keys(data[0]).forEach(key => {
                const th = document.createElement('th');
                th.innerText = key;
                tablaHeaders.appendChild(th);
            });

            // Llenar filas
            data.forEach(fila => {
                const tr = document.createElement('tr');
                Object.values(fila).forEach(valor => {
                    const td = document.createElement('td');
                    td.innerText = valor;
                    tr.appendChild(td);
                });
                tablaCuerpo.appendChild(tr);
            });
        }
    } catch (error) {
        tablaCuerpo.innerHTML = "<tr><td colspan='4'>Error al sincronizar con el puerto.</td></tr>";
    }
}

// Ejecutar al cargar la página
window.onload = cargarTonelaje;
