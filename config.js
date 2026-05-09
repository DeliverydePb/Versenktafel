/* ============================================================
   config.js — Configuración central del sitio
   
   IMPORTANTE: Este es el único archivo que tenés que editar
   cuando hagas cambios en Google Apps Script.
   
   Todos los demás archivos JS importan este archivo para
   saber a qué dirección enviar los pedidos al servidor.
   ============================================================ */

/* ── URL del servidor (Google Apps Script) ───────────────────
   
   Cuando publiques tu código en Google Apps Script, Google te
   da una URL que se ve más o menos así:
   
   https://script.google.com/macros/s/XXXXXX.../exec
   
   Pegá esa URL aquí. Mientras la tengas como está abajo, 
   el sitio NO va a funcionar (es solo un placeholder).
   ─────────────────────────────────────────────────────────── */
const CONFIG = {
  
  /* URL del Google Apps Script desplegado como Web App.
     Reemplazá este valor con tu URL real. */
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/TU_URL_AQUI/exec',

  /* Nombre del sitio (aparece en algunos mensajes) */
  NOMBRE_SITIO: 'Silent Hunters League',

  /* Tiempo (en milisegundos) que dura la sesión del usuario.
     86400000 ms = 24 horas.
     Después de este tiempo, el usuario tiene que loguearse de nuevo. */
  DURACION_SESION: 86400000,

  /* Clave con la que guardamos los datos del usuario en el navegador.
     Es solo un nombre interno; el usuario no lo ve. */
  CLAVE_SESION: 'shl_sesion',
};
