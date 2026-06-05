// js/scripts.js

// 1. PERSISTENCIA DE SESIÓN LOCAL
document.addEventListener("DOMContentLoaded", () => {
    // Verificar si hay sesión guardada al cargar la página
    const usuarioGuardado = localStorage.getItem("comandante_session");
    if (usuarioGuardado) {
        const user = JSON.parse(usuarioGuardado);
        if (document.getElementById("user-display")) {
            document.getElementById("user-display").textContent = user.nombre;
        }
    }

    // Inicializar listeners según la página en la que estemos
    if (document.getElementById("tabla-tonelaje")) cargarTablaPosiciones();
    if (document.getElementById("btn-registrar")) initAuthListeners();
});

// 2. ORDENAMIENTO DE LA TABLA DE TONELAJE
let direccionOrden = false;
function ordenarTabla(columnaIndex) {
    const tabla = document.getElementById("tabla-tonelaje");
    const filas = Array.from(tabla.rows).slice(1); // Excluir el thead
    direccionOrden = !direccionOrden;

    filas.sort((filaA, filaB) => {
        let celdaA = filaA.cells[columnaIndex].innerText;
        let celdaB = filaB.cells[columnaIndex].innerText;

        // Si es número, parsear para ordenar correctamente
        if (!isNaN(celdaA) && !isNaN(celdaB)) {
            return direccionOrden ? celdaA - celdaB : celdaB - celdaA;
        }
        // Si es texto (Nombre de jugador)
        return direccionOrden ? celdaA.localeCompare(celdaB) : celdaB.localeCompare(celdaA);
    });

    const tbody = document.getElementById("tabla-body");
    tbody.innerHTML = "";
    filas.forEach(fila => tbody.appendChild(fila));
}

// 3. CONEXIÓN CON GOOGLE APPS SCRIPT (Fetch API)
async function llamarGoogleScript(accion, datos = {}) {
    try {
        const respuesta = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "text/plain" }, // Evita problemas de CORS preflight con Apps Script
            body: JSON.stringify({ accion: accion, ...datos })
        });
        return await respuesta.json();
    } catch (error) {
        console.error("Error de comunicación con el Cuartel General:", error);
    }
}

// Ejemplo: Cargar datos en la tabla
async function cargarTablaPosiciones() {
    const data = await llamarGoogleScript("obtenerLeaderboard");
    const tbody = document.getElementById("tabla-body");
    tbody.innerHTML = "";

    data.forEach(jugador => {
        // Cálculo del índice de toneladas por patrulla en tiempo real si es necesario
        const indice = jugador.patrullasCarrera > 0 ? (jugador.tonsCarrera / jugador.patrullasCarrera).toFixed(1) : 0;

        const fila = `<tr>
            <td>${jugador.nombre}</td>
            <td>${jugador.patrullasCarrera}</td>
            <td>${jugador.tonsCarrera} t</td>
            <td>${indice} t/p</td>
            <td>${jugador.maxTonsCarrera} t</td>
            <td>${jugador.maxPatrullasCarrera}</td>
        </tr>`;
        tbody.innerHTML += fila;
    });
}