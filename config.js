// config.js
const CONFIG = {
    GOOGLE_CLIENT_ID: "653070334239-trc9c573n3e9ji9iu6j4b23ueh7bok9l.apps.googleusercontent.com",
    
    // Dejamos esto listo para cuando configuremos el puente con Google Sheets
    GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzdGfX1xGpVUiRgpg1RClyIouzvY0oXeez7h_1LoQF9nyjyMU1qX4LB3qU9KZg-SUbEZg/exec",
    
    // Opciones de configuración del juego (por si luego quieres cambiar nombres o valores)
    GAME_SETTINGS: {
        START_YEAR: 1939,
        DEFAULT_PORT: "Kiel"
    }
};

// Congelamos el objeto para evitar modificaciones accidentales en tiempo de ejecución
Object.freeze(CONFIG);