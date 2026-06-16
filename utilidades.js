	function aleatorioEntre(min,max,decim) {
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
