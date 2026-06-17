function aleatorioEntre(min, max, decim) {
	let numero = Math.random() * (max - min) + min;
	return parseFloat(numero.toFixed(decim));
}

function extraerAleatorios(lista, cantidad) {

	// Regla de seguridad: si piden más de lo que hay, devolvemos la lista completa limpia
	if (cantidad >= lista.length) {
		return [...lista]; // Devuelve una copia de la lista original
	}

	// Creamos una copia de la lista original para no alterarla o romperla
	let copia = [...lista];
	let resultado = [];

	// "Pescamos" elementos al azar hasta cumplir la cantidad pedida
	for (let i = 0; i < cantidad; i++) {
		// Elegimos un índice al azar basado en los elementos que quedan disponibles
		let indiceAleatorio = Math.floor(Math.random() * copia.length);

		// .splice saca el elemento de la copia (así no se repite) y lo mete en el resultado
		let elementoSacado = copia.splice(indiceAleatorio, 1)[0];
		resultado.push(elementoSacado);
	}

	return resultado;
}

function textoGenerico(fecha, oceano, clima) {

	let texto = {
		titulo: "",
		misionDescripcion: "",
		workshopDescripcion: "",
		victoria: "",
		derrota: "",
		aborto: ""
	};

	texto.titulo = "Misión Aleatoria";
	texto.misionDescripcion = `Orden de Patrulla: ${fecha.dia} de ${fecha.mesNombre} de ${fecha.anio}
De: Befehlshaber der Unterseeboote
Asunto: Órdenes de Operación
Kapitänleutnant:

Su área de patrulla asignada será en el ${oceano.nombre}.
Objetivo de la Misión:
Interrupción y destrucción de convoyes aliados y buques mercantes solitarios que transiten por su área. Cada tonelada hundida contribuye directamente a la asfixia de la máquina de guerra enemiga.
Inteligencia Reciente:
Nuestra inteligencia indica un aumento en la actividad de convoyes. Se sospecha la mayor presencia de escoltas.
Tácticas y Prioridades:
Ataque a Convoyes: La prioridad máxima es la intercepción y ataque a convoyes. Reporte contactos y este alerta a la coordinacion para la formacion de manadas de lobos.
Buques Solitarios: Los buques solitarios que ofrezcan blancos fáciles deben ser atacados con el cañon de cubierta siempre que las condiciones lo permitan y no ponga en riesgo la seguridad del submarino.
Meteorología: En las próximas horas se esperan vientos de ${clima.vientoVelocidad} nudos provenientes del ${clima.vientoDireccion} grados. La temperatura sera de ${clima.temperatura} grados con un punto de rocío de ${clima.puntoRocio} grados.
Amanecer: ${clima.amanecer}
Atardecer: ${clima.atardecer}
Confío en su experiencia y determinación, Kapitänleutnant. Que la fortuna lo acompañe. La Patria espera resultados.`;
	texto.workshopDescripcion = "Misión generada aleatoriamente.";
	texto.victoria = "Las operaciones han concluido.";
	texto.derrota = "Las operaciones han concluido.";
	texto.aborto = "Las operaciones han concluido.";

	return texto;
}


async function consultaClima(fecha, oceano) {

	let clima = {
		vientoVelocidad: "",
		vientoDireccion: "",
		temperatura: "",
		puntoRocio: "",
		precipitacion: "",
		niebla: "0.0",
		amanecer: "",
		atardecer: ""
	}

	// Formateamos la hora para que tenga dos digitos 
	let horaMision = fecha.hora;
	let horaFormateada = String(horaMision).padStart(2, '0');

	let apiUrl = "https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=" + oceano.lat +
		"&longitude=" + oceano.lon +
		"&start_date=" + (fecha.anio + 80) + "-" + fecha.mes + "-" + fecha.dia +
		"&end_date=" + (fecha.anio + 80) + "-" + fecha.mes + "-" + fecha.dia +
		"&daily=sunrise,sunset&hourly=dew_point_2m,wind_speed_10m,wind_direction_10m,temperature_2m,precipitation&timezone=Europe%2FBerlin";

	// Usamos el fetch nativo del navegador
	let response = await fetch(apiUrl);
	let datosClimaticos = await response.json();

	// Fabricamos el formato de hora que usa la API: "AÑO-MES-DIAThora:00"
	let horaEspecifica = `${(fecha.anio + 80)}-${fecha.mes}-${fecha.dia}T${horaFormateada}:00`;
	let indiceHora = datosClimaticos.hourly.time.indexOf(horaEspecifica);

	// Guardamos los datos DIRECTAMENTE en tu objeto global 'clima'
	clima.vientoVelocidad = Math.round(Math.min(15, (datosClimaticos.hourly.wind_speed_10m[indiceHora]) / 3.33));
	clima.vientoDireccion = datosClimaticos.hourly.wind_direction_10m[indiceHora];

	// Extraemos las horas de sol
	let salidaSolISO = datosClimaticos.daily.sunrise[0];
	let puestaSolISO = datosClimaticos.daily.sunset[0];

	clima.amanecer = salidaSolISO.split("T")[1];
	clima.atardecer = puestaSolISO.split("T")[1];

	// Calulamos la temperatura de punto de rocío para determinar si hay niebla. Si el punto de rocío es igual o mayor a la temperatura, hay niebla.
	// Si la diferencia entre la temperatura y el punto de rocío es menor o igual a este valor, consideramos que hay niebla.
	// Si hay presipitacion, esto también contribuye a la formación de niebla, por lo que se toma el máximo entre la contribución de la temperatura/punto de rocío y la precipitación.
	clima.temperatura = datosClimaticos.hourly.temperature_2m[indiceHora];
	clima.puntoRocio = datosClimaticos.hourly.dew_point_2m[indiceHora];
	clima.precipitacion = datosClimaticos.hourly.precipitation[indiceHora];

	let limiteNiebla = 3;

	// Si la temperatura y el punto de rocío están muy cerca (diferencia menor o igual a 5 grados), consideramos que hay niebla.
	// Además, si hay precipitación, esto también contribuye a la formación de niebla, por lo que se toma el máximo entre la contribución de
	// la temperatura/punto de rocío y la precipitación.

	if (limiteNiebla <= clima.temperatura - clima.puntoRocio) {
		clima.niebla = Math.max(Math.min(clima.precipitacion / 100, 1.0), 0.0);
	} else {
		clima.niebla = Math.max((clima.temperatura - clima.puntoRocio) / limiteNiebla, Math.max(Math.min(clima.precipitacion / 100, 1.0), 0.0));
	}

	clima.niebla = Math.round(clima.niebla * 10) / 10; // Redondeamos a un decimal para que sea más legible

	console.log("Viento Velocidad", clima.vientoVelocidad);
	console.log("Viento Dirección", clima.vientoDireccion);
	console.log("Temperatura", clima.amanecer + " " + clima.temperatura);
	console.log("Punto de Rocío", clima.puntoRocio);
	console.log("Precipitación", clima.precipitacion);
	console.log("Niebla", clima.niebla);
	console.log("Amanecer", clima.amanecer);
	console.log("Atardecer", clima.atardecer);

	return clima;
}
