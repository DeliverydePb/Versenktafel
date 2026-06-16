async function eleccionMision() {
    const listaMisiones = [misionAleatoria];
    const misionElegida = extraerAleatorios(listaMisiones, 1)[0];
    const datosMision = await misionElegida();

    const textoMision = await escribeMision(
        datosMision.textoMision,
        datosMision.ordenesMision,
        datosMision.fecha,
        datosMision.oceano,
        datosMision.clima,
        datosMision.conv,
        datosMision.sub
    );

    const copiaExitosa = await copiarTextoAlPortapapeles(textoMision);
    if (!copiaExitosa) {
        console.warn("No se pudo copiar la misión al portapapeles automáticamente.");
    }

    return textoMision;
}

async function escribeMision(texto, ordenes, fecha, oceano, clima, conv, sub) {
    const objectiveVisibility = (typeof Texto !== 'undefined' && Texto && Texto.objectivoVisibilidad !== undefined)
        ? Texto.objectivoVisibilidad
        : 0;

    const missionObject = {
        readme: "Mission file for the game Wolfpack. https://store.steampowered.com/app/490920/Wolfpack/, for instructions on how to use this file or develop your own mission, see the wolfpack manual on Steam.",
        metaData: {
            author: "Delivery de Pb",
            version: "Pre beta testing branch",
            missionTitle: texto.titulo,
            missionDescription: texto.misionDescripcion,
            workshopDescription: texto.workshopDescripcion,
            victoryMessage: texto.victoria,
            defeatMessage: texto.derrota,
            abortMessage: texto.aborto,
            objectiveVisibility: objectiveVisibility,
            seed: Math.floor(Math.random() * 100000000),
            languages: [23],
            forceManualNavigation: false,
            forceRealMorse: false
        },
        location: {
            day: parseInt(fecha.diaNumero, 10),
            time: parseInt(fecha.hora, 10) + (parseInt(fecha.minuto, 10) / 60),
            location: oceano.numero,
            aob: [
                sub.u96AOB,
                sub.u552AOB,
                sub.u564AOB,
                sub.u307AOB
            ]
        },
        weather: {
            windSpeed: clima.vientoVelocidad,
            windDirection: clima.vientoDireccion,
            fog: clima.niebla
        },
        difficulty: {
            enableBots: true,
            enableQuickEncounter: false,
            enableAutomaticRadio: true,
            enableRealisticAttenuation: true,
            enableFriendlyFire: true,
            enableRealisticTorpedoReload: false,
            enableFaultyTorpedoes: false,
            enableLimitedTorpedoAccuracy: true,
            enableTorpedoTriggerDependsOnAngle: true,
            enableAutomaticNavigation: true,
            enableConvoyChangesDirection: conv.cambRmb === "true",
            enableEscortsAlwaysPing: conv.sonar === "true",
            enableAutomaticEngineGovernment: true,
            chaseTime: 0,
            objectiveDisplayMode: 0
        },
        objectives: {
            tonnageGoal: 0.0,
            timeLimit: 0.0,
            beingDiscoveredFailsMission: false
        },
        targets: {
            targets: [],
            antiTargets: [],
            merchants: conv.mercantes,
            convoyCourse: conv.curso,
            convoySpeed: conv.vel,
            convoySpawnDistance: conv.dist,
            destroyerCount: conv.destro,
            corvetteCount: conv.corvet,
            sloopCount: conv.sloop
        },
        orders: {
            orders: ordenes
        },
        equipment: {
            type1TorpedoCount: sub.tI,
            type2TorpedoCount: sub.tII
        }
    };

    return JSON.stringify(missionObject, null, 4);
}

async function copiarTextoAlPortapapeles(texto) {
    if (!texto) return false;

    try {
        await navigator.clipboard.writeText(texto);
        return true;
    } catch (error) {
        const textarea = document.createElement("textarea");
        textarea.value = texto;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        return successful;
    }
}
