/* ============================================================
   utils.js — Funciones de utilidad compartidas
   
   Este archivo contiene "herramientas" que usan todas las
   páginas del sitio. Al tenerlas en un solo lugar, si hay
   que cambiar algo, se cambia una sola vez y afecta a todo.
   ============================================================ */


/* ── FUNCIÓN: Hashear una contraseña ─────────────────────────
   
   ¿Por qué hashear la contraseña?
   Nunca debemos guardar contraseñas en texto plano. Si alguien
   accede a la planilla, vería solo el hash (una cadena de letras
   y números sin sentido), no la contraseña real.
   
   Usamos SHA-256, un algoritmo estándar de la industria.
   La función crypto.subtle viene integrada en todos los 
   navegadores modernos; no necesitamos librerías externas.
   
   Es una función "async" porque el cálculo del hash lleva
   un pequeño tiempo y no queremos que la página se congele.
   
   @param {string} contrasena - La contraseña en texto plano
   @returns {Promise<string>} - El hash en formato hexadecimal
   ─────────────────────────────────────────────────────────── */
async function hashearContrasena(contrasena) {
  
  // Convertimos el texto a bytes (formato que entiende la función de hash)
  const encoder = new TextEncoder();
  const datos = encoder.encode(contrasena);
  
  // Calculamos el hash SHA-256 (esto devuelve un ArrayBuffer)
  const hashBuffer = await crypto.subtle.digest('SHA-256', datos);
  
  // Convertimos el ArrayBuffer a un array normal de números
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Convertimos cada número a hexadecimal y los unimos
  // Ejemplo: 255 → 'ff', 16 → '10', etc.
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex; // Resultado: una cadena de 64 caracteres, ej: "a3f2b1c9..."
}


/* ── FUNCIÓN: Validar formato de email ───────────────────────
   
   Verifica que una dirección de email tenga el formato correcto
   (algo@algo.algo).
   
   Usamos una "expresión regular" (regex) para hacer la validación.
   El patrón /^[^\s@]+@[^\s@]+\.[^\s@]+$/ significa:
   - Empieza con uno o más caracteres que no sean espacios ni @
   - Seguido de @
   - Seguido de uno o más caracteres que no sean espacios ni @
   - Seguido de un punto
   - Termina con uno o más caracteres que no sean espacios ni @
   
   @param {string} email - El email a validar
   @returns {boolean} - true si es válido, false si no
   ─────────────────────────────────────────────────────────── */
function validarEmail(email) {
  const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return patron.test(email); // .test() devuelve true o false
}


/* ── FUNCIÓN: Validar una contraseña ─────────────────────────
   
   Verifica que la contraseña cumpla los requisitos mínimos.
   Acá definimos: al menos 6 caracteres.
   (Podés agregar más reglas después si querés)
   
   @param {string} contrasena - La contraseña a validar
   @returns {object} - { valida: bool, mensaje: string }
   ─────────────────────────────────────────────────────────── */
function validarContrasena(contrasena) {
  
  if (contrasena.length < 6) {
    return {
      valida: false,
      mensaje: 'La clave debe tener al menos 6 caracteres.'
    };
  }
  
  // Si pasa todas las validaciones:
  return { valida: true, mensaje: '' };
}


/* ── FUNCIÓN: Hacer un pedido al servidor (Apps Script) ──────
   
   Todas las comunicaciones con el servidor pasan por aquí.
   
   ¿Cómo funciona?
   1. Le mandamos datos al Apps Script via POST
   2. El Apps Script los procesa (lee/escribe en la planilla)
   3. Nos devuelve un resultado en formato JSON
   
   Es "async" porque el pedido al servidor tarda un tiempo.
   "await" hace que el código espere la respuesta antes de continuar.
   
   @param {string} accion - Qué queremos hacer ('login', 'registro', etc.)
   @param {object} datos - Los datos que enviamos al servidor
   @returns {Promise<object>} - La respuesta del servidor
   ─────────────────────────────────────────────────────────── */
async function pedirAlServidor(accion, datos) {
  
  try {
    // Preparamos el pedido HTTP tipo POST
    const respuesta = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      
      // Importante: Apps Script necesita los datos en este formato
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      
      // JSON.stringify convierte el objeto JS a texto JSON
      // Incluimos la 'accion' para que el servidor sepa qué hacer
      body: JSON.stringify({ accion, ...datos }),
    });
    
    // Convertimos la respuesta de texto JSON a objeto JavaScript
    const resultado = await respuesta.json();
    
    return resultado;
    
  } catch (error) {
    // Si algo sale mal (sin internet, servidor caído, etc.)
    console.error('Error al comunicarse con el servidor:', error);
    
    // Devolvemos un objeto de error estandarizado
    return {
      exito: false,
      mensaje: 'Error de conexión. Verificá tu acceso a internet.'
    };
  }
}


/* ── FUNCIÓN: Guardar la sesión del usuario ──────────────────
   
   Cuando el usuario se loguea, guardamos su información en
   localStorage. Es como una "cookie" que persiste aunque
   cierren el navegador.
   
   Guardamos también la hora de expiración para que el sistema
   cierre la sesión automáticamente después de 24 horas.
   
   @param {object} datosUsuario - { comandante, email, etc. }
   ─────────────────────────────────────────────────────────── */
function guardarSesion(datosUsuario) {
  
  const sesion = {
    ...datosUsuario,                                        // Copia todos los datos del usuario
    expira: Date.now() + CONFIG.DURACION_SESION,           // Fecha y hora de expiración
  };
  
  // localStorage.setItem guarda un valor en el navegador
  // JSON.stringify convierte el objeto a texto para poder guardarlo
  localStorage.setItem(CONFIG.CLAVE_SESION, JSON.stringify(sesion));
}


/* ── FUNCIÓN: Obtener la sesión actual ───────────────────────
   
   Lee los datos del usuario guardados en el navegador.
   Si no hay sesión o expiró, devuelve null.
   
   @returns {object|null} - Los datos del usuario o null
   ─────────────────────────────────────────────────────────── */
function obtenerSesion() {
  
  // Leemos los datos guardados
  const sesionTexto = localStorage.getItem(CONFIG.CLAVE_SESION);
  
  // Si no hay nada guardado, no hay sesión
  if (!sesionTexto) return null;
  
  // Convertimos el texto JSON a objeto JavaScript
  const sesion = JSON.parse(sesionTexto);
  
  // Verificamos si la sesión expiró
  if (Date.now() > sesion.expira) {
    cerrarSesion(); // La borramos si expiró
    return null;
  }
  
  return sesion;
}


/* ── FUNCIÓN: Cerrar la sesión ───────────────────────────────
   
   Elimina los datos del usuario del navegador.
   Se llama cuando el usuario hace clic en "Salir".
   ─────────────────────────────────────────────────────────── */
function cerrarSesion() {
  localStorage.removeItem(CONFIG.CLAVE_SESION);
}


/* ── FUNCIÓN: Mostrar un mensaje de alerta en la pantalla ────
   
   En lugar de usar alert() (que es feo), usamos nuestros
   propios divs con estilos.
   
   @param {string} elementoId - El id del div alerta en el HTML
   @param {string} mensaje    - El texto a mostrar
   @param {string} tipo       - 'error', 'exito', o 'info'
   ─────────────────────────────────────────────────────────── */
function mostrarAlerta(elementoId, mensaje, tipo) {
  
  const alerta = document.getElementById(elementoId);
  if (!alerta) return; // Si no existe el elemento, salimos
  
  // Limpiamos las clases de tipo anteriores
  alerta.classList.remove('alerta-error', 'alerta-exito', 'alerta-info');
  
  // Agregamos la clase correspondiente al tipo
  alerta.classList.add(`alerta-${tipo}`);
  
  // Ponemos el mensaje
  alerta.textContent = mensaje;
  
  // Hacemos visible la alerta (en CSS está display:none por defecto)
  alerta.classList.add('visible');
}


/* ── FUNCIÓN: Ocultar un mensaje de alerta ───────────────────
   
   @param {string} elementoId - El id del div alerta en el HTML
   ─────────────────────────────────────────────────────────── */
function ocultarAlerta(elementoId) {
  const alerta = document.getElementById(elementoId);
  if (alerta) alerta.classList.remove('visible');
}


/* ── FUNCIÓN: Leer parámetros de la URL ──────────────────────
   
   Cuando el usuario hace clic en el link del email de
   recuperación, la URL tiene un parámetro extra:
   
   reset.html?token=abc123
   
   Esta función extrae ese valor 'abc123'.
   
   @param {string} nombre - El nombre del parámetro a leer
   @returns {string|null} - El valor del parámetro o null
   ─────────────────────────────────────────────────────────── */
function leerParametroURL(nombre) {
  const params = new URLSearchParams(window.location.search);
  return params.get(nombre);
}
