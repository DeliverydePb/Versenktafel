// Variables globales para recordar el estado del tablero
let datosFlotilla = [];
let columnaActual = '';
let ordenAscendente = true;

// Función que se ejecuta automáticamente al cargar la página
async function cargarTonelaje() {
    const tablaCuerpo = document.getElementById('cuerpoTabla');
    try {
        // Pedimos los datos a Google Sheets
        const response = await fetch(`${CONFIG.API_URL}?action=getTonelaje`);
        datosFlotilla = await response.json();

        // Una vez que tenemos los datos, dibujamos la tabla por primera vez
        dibujarTabla();
    } catch (error) {
        tablaCuerpo.innerHTML = "<tr><td colspan='4'>Error al sincronizar con el puerto.</td></tr>";
        console.error(error);
    }
}

// Función encargada de borrar y redibujar la tabla en la pantalla
function dibujarTabla() {
    const tablaHeaders = document.getElementById('headers');
    const tablaCuerpo = document.getElementById('cuerpoTabla');

    // Limpiamos lo que haya actualmente
    tablaHeaders.innerHTML = "";
    tablaCuerpo.innerHTML = "";

    if (datosFlotilla.length === 0) return;

    // 1. CREAR LAS CABECERAS (TÍTULOS)
    Object.keys(datosFlotilla[0]).forEach(key => {
        const th = document.createElement('th');
        
        // Si es la columna por la que está ordenada, le sumamos una flechita
        let flecha = '';
        if (key === columnaActual) {
            flecha = ordenAscendente ? ' ▲' : ' ▼';
        }
        
        th.innerText = key + flecha;
        
        // Le asignamos la orden de "ordenar" cuando el usuario haga clic
        th.addEventListener('click', () => ordenarPor(key));
        tablaHeaders.appendChild(th);
    });

    // 2. CREAR LAS FILAS CON LOS DATOS
    datosFlotilla.forEach(fila => {
        const tr = document.createElement('tr');
        Object.values(fila).forEach(valor => {
            const td = document.createElement('td');
            td.innerText = valor;
            tr.appendChild(td);
        });
        tablaCuerpo.appendChild(tr);
    });
}

// Lógica para reordenar la lista de datos
function ordenarPor(columna) {
    if (columnaActual === columna) {
        // Si el usuario hizo clic en la misma columna, invertimos el orden
        ordenAscendente = !ordenAscendente;
    } else {
        // Si hizo clic en una columna nueva, ordenamos de forma ascendente por defecto
        columnaActual = columna;
        ordenAscendente = true;
    }

    // Algoritmo de ordenamiento
    datosFlotilla.sort((a, b) => {
        let valorA = a[columna];
        let valorB = b[columna];

        // Intentamos transformarlos en números por si son Tonelaje o Patrullas
        let numA = parseFloat(valorA);
        let numB = parseFloat(valorB);

        if (!isNaN(numA) && !isNaN(numB)) {
            // Si ambos son números, los restamos para ordenarlos
            return ordenAscendente ? numA - numB : numB - numA;
        } else {
            // Si es texto (como el nombre del Comandante), usamos orden alfabético
            valorA = valorA.toString().toLowerCase();
            valorB = valorB.toString().toLowerCase();
            
            if (valorA < valorB) return ordenAscendente ? -1 : 1;
            if (valorA > valorB) return ordenAscendente ? 1 : -1;
            return 0;
        }
    });

    // Volvemos a dibujar la tabla con el nuevo orden aplicado
    dibujarTabla();
}

// Ejecutar al cargar la página por primera vez
window.onload = cargarTonelaje;
