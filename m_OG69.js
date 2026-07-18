async function misionOG69() {

	let fecha = {
		diaNumero: "692",
		anio: "1941",
		mes: "07",
		mesNombre: "Julio",
		dia: "24",
		hora: "00",
		minuto: "00"
	}

	let oceano = {
		numero: 3,
		nombre: "Golfo de Vizcaya",
		lat: 45.47,
		lon: -5.57
	}

	let clima = await consultaClimaOG69(fecha, oceano);
	let conv = convOG69(clima);
	let sub = submarinosOG69();
	let textoMision = textoOG69(fecha, oceano, clima);
	let ordenesMision = ordenesOG69();

	return {
		fecha: fecha,
		oceano: oceano,
		clima: clima,
		conv: conv,
		sub: sub,
		textoMision: textoMision,
		ordenesMision: ordenesMision
	};
}

async function consultaClimaOG69(fecha, oceano) {

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
		"&start_date=" + (parseInt(fecha.anio) + 80) + "-" + fecha.mes + "-" + fecha.dia +
		"&end_date=" + (parseInt(fecha.anio) + 80) + "-" + fecha.mes + "-" + fecha.dia +
		"&daily=sunrise,sunset&hourly=dew_point_2m,wind_speed_10m,wind_direction_10m,temperature_2m,precipitation&timezone=Europe%2FBerlin";

	console.log("URL", apiUrl);

	// Usamos el fetch nativo del navegador
	let response = await fetch(apiUrl);
	let datosClimaticos = await response.json();

	// Fabricamos el formato de hora que usa la API: "AÑO-MES-DIAThora:00"
	let horaEspecifica = `${(parseInt(fecha.anio) + 80)}-${fecha.mes}-${fecha.dia}T${horaFormateada}:00`;
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

function convOG69(clima) {

	let conv = {
		curso: "",
		vel: "",
		mercantes: "",
		destro: "",
		corvet: "",
		sloop: "",
		dist: "",
		cambRmb: "",
		sonar: ""
	}

	//El curso del convoy se define aleatoriamente.
	conv.curso = aleatorioEntre(45, 135, 0);

	//La velocidad del convoy.
	let convVelMin = 5; convVelMax = 15;
	conv.vel = aleatorioEntre(convVelMin, convVelMax, 1);

	// Ahora definimos el convoy

	let cargos = ["HF4", "HF5", "HF6", "HF7", "HF8", "HF9", "HF10", "HF11", "HF12", "HF13", "HF14", "HF15", "HF16", "HF17", "HF18", "HF19", "HF24", "HF25", "HF26", "HF27", "HF28", "HF29", "HF30", "HF41", "HF42", "HF43", "HF44", "HF45", "HF46", "LM1", "LM19", "LM20", "LM21", "LM22", "LM23", "LM24", "LM25", "LM26", "LM27", "LM28", "LM29", "LM30", "LM31", "LM32", "LM33", "LM33", "LM34", "LM35", "LM36", "LM37", "HF1", "HF2", "HF3", "HF31", "HF32", "HF33", "HF34", "HF35", "HF36", "HF37", "HF38", "HF39", "HF40", "LM2", "LM3", "LM4", "LM5", "LM6", "LM7", "LM8", "LM9", "LM10", "LM11", "LM12", "LM13", "LM14", "LM15", "LM16", "LM17", "LM18"];
	let pasageros = ["PL1", "PL2", "PL3", "PL4", "PL5"];
	let tanqueros = ["HT1", "HT2", "HT3", "HT4", "HT5", "HT6", "HT7", "HT8", "HT9", "HT10", "HT11", "HT12", "HT13", "HT14", "HT15", "HT16", "HT17", "HT18", "HT19", "HT20", "HT21", "HT22", "HT23", "HT24", "HT25", "HT26", "HT27", "HT28", "HT29", "HT30", "HT31", "HT32", "HT33", "HT34", "HT35", "MT1", "MT2", "MT3", "MT4", "MT5", "MT6", "MT7", "MT8", "MT9", "MT10", "MT11", "MT12", "MT13", "MT14", "MT15", "MT16", "MT17", "MT18", "MT19", "MT20", "MT21", "MT22", "MT23", "MT24", "MT25", "MT26", "MT27", "MT28", "MT29", "MT30", "MT31", "MT32", "MT33", "MT34", "MT35"];
	let remolcadores = ["RT1", "RT2", "RT3", "RT4", "RT5", "RT6", "RT7", "RT8", "RT9", "RT10"];

	conv.mercantes = extraerAleatorios(cargos, 35)
		.concat(extraerAleatorios(pasageros, 0),
			extraerAleatorios(tanqueros, 2),
			extraerAleatorios(remolcadores, 1));

	conv.corvet = 2;
	conv.sloop = 3;
	conv.destro = 0;

	// Distancia. Vamos a poner la distancia en funcion de la velocidad, cuanto mas lento mas lejos, con un minimo y un máximo.
	let distMin = 8000; let distMax = 18000;
	conv.dist = Math.round(distMax + (conv.vel - convVelMin) * (distMin - distMax) / (convVelMax - convVelMin));

	//Definimos si el convoy cambia de direccion en funcion de la relacion entre de barcos en el conboy y escoltas; y de la niebla.
	// Si un convoy es escoltado por una proporcion menor de 3 mercantes por escolta es posible que no quiera cambiar de curso con frecuencia, con poca o ninguna escolta serán mas precavidos.
	// Si hay mas de 0.5 de niebla el convoy no va a querer cambiar de rumbo, ya que esto dificultaría la navegación y el mantenimiento de la formación. En condiciones de niebla, los convoyes tienden a mantener un rumbo constante para evitar confusiones y colisiones dentro de la formación.

	let probPorTamaño = (conv.corvet + conv.destro + conv.sloop) / (0.33 * conv.mercantes.length);
	let probPorNiebla = clima.niebla;
	if (0.5 < Math.max(probPorTamaño, probPorNiebla)) { conv.cambRmb = "false"; }
	else { conv.cambRmb = "true"; }

	//Definimos el estado de los sonares en funcion del viento reinante. Un oleaje fuerte evitaba el uso del ASDIC. Para el juego cualquier viento por encima de 7 impedirá el uso del ASDIC.
	if (clima.vientoVelocidad < 7) { conv.sonar = "true"; }
	else { conv.sonar = "false"; }

	return conv;
}

function submarinosOG69() {

	let sub = {
		tI: "",
		tII: "",
		u96AOB: aleatorioEntre(0, 359, 0),
		u552AOB: aleatorioEntre(0, 359, 0),
		u564AOB: aleatorioEntre(0, 359, 0),
		u307AOB: aleatorioEntre(0, 359, 0)
	}

	// La carga completa de torpedos del sub es de 14. Se establece el maximo de torpedos entre 4 y 14 de para simular un encuentro en mitad de una patrulla. Primero se establece el total y luego se eligen los tipo 1 aleatoriamente y los tipo 2 seran los suplementarios para llegar al total.
	let totalTorpedos = aleatorioEntre(4, 14, 0);
	sub.tI = aleatorioEntre(0, totalTorpedos, 0);
	sub.tII = totalTorpedos - sub.tI;

	return sub;
}

function textoOG69(fecha, oceano, clima) {

	let texto = {
		titulo: "",
		misionDescripcion: "",
		workshopDescripcion: "",
		victoria: "",
		derrota: "",
		aborto: "",
		objectivoVisibilidad: 0
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

	texto.victoria = `El convoy OG69 navegaba desde las islas Britanicas hacia Gibraltar.
Fue detectado el 24 de julio de 1941 por B-Dienst y confirmado por un avión FW-200 Condor.
El U-68 lo encontró a las 17:45 del mismo día. En la madrugada del 27 los submarinos U-79, U-371, U-561, U-331, U-126 y U-203 iniciaron el ataque.
Los 8 submarinos dispararon 25 torpedos y recibieron 6 ataques con cargas de profundidad y 2 con cañones, solo el U-562 resulto dañado. Se hundieron 8 barcos, 12.762 toneladas.
68 marineros no volvieron a casa.`;

	texto.derrota = "Las operaciones han concluido.";

	texto.aborto = "Las operaciones han concluido.";

	return texto;
}

function ordenesOG69() {
	let ordenes = [
		{
			"title": "Del BDU:",
			"content": "La Luftwaffe informa trafico mercante en la zona.",
			"Trigger": 0,
			"sendTime": aleatorioEntre(300, 600, 0),
			"target": ""
		}
	];
	return ordenes;
}
