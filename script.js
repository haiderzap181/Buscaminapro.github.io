const tableroElemento = document.getElementById('tablero');
const puntosElemento = document.getElementById('puntos');
const inputMinas = document.getElementById('input-minas');
const timerElemento = document.getElementById('timer');
const listaRecordsElemento = document.getElementById('lista-records');

const sonidoExplosion = document.getElementById('sonido-explosion');
const sonidoRevelar = document.getElementById('sonido-revelar');
const sonidoVictoria = document.getElementById('sonido-victoria');
const sonidoAmbiente = document.getElementById('sonido-ambiente');
const sonidoRisa = document.getElementById('sonido-risa');

let mapaReal = [], celdasCache = [], juegoTerminado = false;
let tiempo = 0, intervaloTiempo, primerClic = true, puntaje = 0, celdasPorRevelar;
let tamanoGrid = 10; 
let usoBandera = false; 

let volumenMusica = 0.3;
let volumenEfectos = 1.0;
let idiomaActual = 'es'; 

function obtenerRango(bananas, tiempo, tamano) {
    let esGorila = (tamano === 10) || (!tamano && bananas >= 15);
    
    if (esGorila) {
        if (bananas >= 30 || (bananas >= 20 && tiempo <= 60)) return 'img/rango03.png';
        if (bananas >= 20 || (bananas >= 15 && tiempo <= 90)) return 'img/rango02.png';
        return 'img/rango01.png';
    } else {
        if (bananas >= 25 || (bananas >= 15 && tiempo <= 40)) return 'img/rango03.png';
        if (bananas >= 15 || (bananas >= 10 && tiempo <= 60)) return 'img/rango02.png';
        return 'img/rango01.png';
    }
}

function cargarLogros() {
    let logros = JSON.parse(localStorage.getItem('monkey_logros')) || { 
        primerPaso: false, aprendizVeloz: false, velocista: false, purista: false, locura: false 
    };
    
    const iconoPrimerPaso = document.getElementById('icono-primer-paso');
    const iconoAprendizVeloz = document.getElementById('icono-aprendiz-veloz');
    const iconoVelocista = document.getElementById('icono-velocista');
    const iconoPurista = document.getElementById('icono-purista');
    const iconoLocura = document.getElementById('icono-locura');

    if (iconoPrimerPaso) iconoPrimerPaso.style.color = logros.primerPaso ? '#f5c518' : '#a0a0a0';
    if (iconoAprendizVeloz) iconoAprendizVeloz.style.color = logros.aprendizVeloz ? '#f5c518' : '#a0a0a0';
    if (iconoVelocista) iconoVelocista.style.color = logros.velocista ? '#f5c518' : '#a0a0a0';
    if (iconoPurista) iconoPurista.style.color = logros.purista ? '#f5c518' : '#a0a0a0';
    if (iconoLocura) iconoLocura.style.color = logros.locura ? '#f5c518' : '#a0a0a0';
}

function evaluarLogros() {
    let logros = JSON.parse(localStorage.getItem('monkey_logros')) || { 
        primerPaso: false, aprendizVeloz: false, velocista: false, purista: false, locura: false 
    };
    let numMinas = parseInt(inputMinas.value);
    let nuevoDesbloqueo = false;

    if (tamanoGrid === 8 && !logros.primerPaso) {
        logros.primerPaso = true; nuevoDesbloqueo = true;
    }
    if (tamanoGrid === 8 && tiempo < 30 && !logros.aprendizVeloz) {
        logros.aprendizVeloz = true; nuevoDesbloqueo = true;
    }
    if (tamanoGrid === 10 && tiempo < 40 && !logros.velocista) {
        logros.velocista = true; nuevoDesbloqueo = true;
    }
    if (!usoBandera && !logros.purista) {
        logros.purista = true; nuevoDesbloqueo = true;
    }
    if (tamanoGrid === 10 && numMinas > 50 && !logros.locura) {
        logros.locura = true; nuevoDesbloqueo = true;
    }

    if (nuevoDesbloqueo) {
        localStorage.setItem('monkey_logros', JSON.stringify(logros));
        cargarLogros();
    }
}

function cargarRecords() {
    const records = JSON.parse(localStorage.getItem('monkey_records')) || [];
    listaRecordsElemento.innerHTML = '';
    
    if (records.length === 0) { 
        listaRecordsElemento.innerHTML = `<tr><td colspan="4" style="padding:20px; opacity:0.6">${idiomas[idiomaActual].sinRecords}</td></tr>`; 
        return; 
    }
    
    records.sort((a, b) => b.puntaje - a.puntaje);
    
    records.slice(0, 5).forEach(rec => {
        const iconoRango = obtenerRango(rec.bananas, rec.tiempo, rec.tamano);
        listaRecordsElemento.innerHTML += `<tr>
            <td>${rec.puntaje}</td>
            <td>${rec.tiempo}s</td>
            <td>${rec.bananas}</td>
            <td><img src="${iconoRango}" class="icono-rango" alt="Rango"></td>
        </tr>`;
    });
}

function guardarRecord() {
    const records = JSON.parse(localStorage.getItem('monkey_records')) || [];
    records.push({ puntaje, tiempo, bananas: parseInt(inputMinas.value), tamano: tamanoGrid });
    localStorage.setItem('monkey_records', JSON.stringify(records));
    cargarRecords();
}

document.getElementById('select-dificultad').addEventListener('change', function() {
    const nuevoTamano = parseInt(this.value);
    const textoLimites = document.getElementById('texto-limites');
    
    if (nuevoTamano === 8) {
        inputMinas.min = 10;
        inputMinas.value = 10;
        textoLimites.innerText = idiomas[idiomaActual].limiteAprendiz;
    } else if (nuevoTamano === 10) {
        inputMinas.min = 15;
        inputMinas.value = 15;
        textoLimites.innerText = idiomas[idiomaActual].limiteGorila;
    }
});

function crearTablero() {
    cargarRecords();
    cargarLogros(); 
    document.getElementById('modal-derrota').classList.remove('mostrar');
    document.getElementById('modal-victoria').classList.remove('mostrar'); 
    
    tamanoGrid = parseInt(document.getElementById('select-dificultad').value) || 10;
    let totalCeldas = tamanoGrid * tamanoGrid;
    
    tableroElemento.style.setProperty('grid-template-columns', `repeat(${tamanoGrid}, 1fr)`, 'important');

    let numMinas = parseInt(inputMinas.value) || 15;
    let minRequerido = parseInt(inputMinas.min) || 15; 
    
    inputMinas.max = totalCeldas - 1;
    
    if (numMinas < minRequerido) {
        numMinas = minRequerido;
        inputMinas.value = numMinas;
    } else if (numMinas >= totalCeldas) {
        numMinas = Math.floor(totalCeldas / 4); 
        inputMinas.value = numMinas;
    }

    tableroElemento.innerHTML = '';
    celdasCache = []; juegoTerminado = false; primerClic = true;
    puntaje = 0; puntosElemento.innerText = '0';
    usoBandera = false; 
    clearInterval(intervaloTiempo); tiempo = 0; timerElemento.innerText = '0';
    
    celdasPorRevelar = totalCeldas - numMinas; 
    
    mapaReal = [...Array(numMinas).fill('mina'), ...Array(totalCeldas - numMinas).fill('vacio')].sort(() => Math.random() - 0.5);

    if(sonidoAmbiente) {
        sonidoAmbiente.pause();
        sonidoAmbiente.currentTime = 0;
    }

    for (let i = 0; i < totalCeldas; i++) {
        const celda = document.createElement('div');
        celda.classList.add('celda');
        celda.dataset.id = i;

        let tiempoPresionado;
        let esPulsacionLarga = false;
        let movioElDedo = false;

        const alternarBandera = () => {
            if (juegoTerminado || celda.classList.contains('revelada')) return;
            if (celda.innerHTML === '') {
                celda.innerHTML = '<i class="fas fa-flag"></i>';
                usoBandera = true; 
            } else if (celda.querySelector('.fa-flag')) {
                celda.innerHTML = '<i class="fas fa-question" style="color:white"></i>';
            } else {
                celda.innerHTML = '';
            }
        };

        celda.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            alternarBandera();
        });

        celda.addEventListener('touchstart', (e) => {
            if (juegoTerminado || celda.classList.contains('revelada')) return;
            esPulsacionLarga = false;
            movioElDedo = false;
            
            tiempoPresionado = setTimeout(() => {
                if (!movioElDedo) {
                    esPulsacionLarga = true;
                    alternarBandera();
                    if (navigator.vibrate) { navigator.vibrate(50); }
                }
            }, 400); 
        });

        celda.addEventListener('touchmove', () => {
            movioElDedo = true;
            clearTimeout(tiempoPresionado);
        });

        celda.addEventListener('touchend', (e) => {
            clearTimeout(tiempoPresionado);
            if (esPulsacionLarga) {
                e.preventDefault(); 
            }
        });

        celda.addEventListener('touchcancel', () => {
            clearTimeout(tiempoPresionado);
        });

        celda.addEventListener('click', (e) => {
            if (esPulsacionLarga) return; 

            if (primerClic && !juegoTerminado) { 
                intervaloTiempo = setInterval(() => { tiempo++; timerElemento.innerText = tiempo; }, 1000);
                if(sonidoAmbiente) { 
                    sonidoAmbiente.volume = volumenMusica; 
                    sonidoAmbiente.play().catch(()=>{}); 
                }
                primerClic = false; 
            }
            revelarCelda(celda);
        });
        
        tableroElemento.appendChild(celda);
        celdasCache.push(celda);
    }
}

function revelarCelda(celda) {
    if (!celda || celda.classList.contains('revelada') || juegoTerminado || celda.innerHTML !== '') return;
    const id = parseInt(celda.dataset.id);
    if (mapaReal[id] === 'mina') {
        clearInterval(intervaloTiempo); juegoTerminado = true;
        
        if(sonidoAmbiente) sonidoAmbiente.pause(); 
        
        if(sonidoExplosion) { sonidoExplosion.volume = 0.4 * volumenEfectos; sonidoExplosion.play().catch(()=>{}); }
        if(sonidoRisa) { sonidoRisa.volume = 0.6 * volumenEfectos; sonidoRisa.play().catch(()=>{}); }
        
        const gameContainer = document.querySelector('.game-container');
        gameContainer.classList.add('shake-screen');
        setTimeout(() => gameContainer.classList.remove('shake-screen'), 500); 

        celdasCache.forEach((c, idx) => { if(mapaReal[idx] === 'mina') { c.innerHTML = ''; c.classList.add('revelada', 'bomba-revelada'); } });
        
        setTimeout(() => {
            document.getElementById('puntuacion-final').innerText = puntaje;
            document.getElementById('modal-derrota').classList.add('mostrar');
        }, 600);
        
    } else {
        if(sonidoRevelar) { sonidoRevelar.volume = 0.2 * volumenEfectos; sonidoRevelar.play().catch(()=>{}); }
        
        celda.classList.add('revelada'); celdasPorRevelar--;
        puntaje += 100; puntosElemento.innerText = puntaje;
        const m = contarVecinos(id);
        if (m > 0) { celda.innerText = m; celda.classList.add('numero-' + m); }
        else { expandir(id); }
        
        if (celdasPorRevelar === 0) {
            clearInterval(intervaloTiempo); juegoTerminado = true;
            
            if(sonidoAmbiente) sonidoAmbiente.pause(); 
            
            if(sonidoVictoria) { sonidoVictoria.volume = 1.0 * volumenEfectos; sonidoVictoria.play().catch(()=>{}); }
            
            evaluarLogros(); 
            guardarRecord();
            
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    zIndex: 2000 
                });
            }
            
            setTimeout(() => {
                document.getElementById('puntuacion-final-victoria').innerText = puntaje;
                document.getElementById('modal-victoria').classList.add('mostrar');
            }, 600);
        }
    }
}

function contarVecinos(id) {
    let m = 0; 
    const f = Math.floor(id/tamanoGrid), c = id%tamanoGrid;
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) {
        const nf=f+i, nc=c+j;
        if(nf>=0 && nf<tamanoGrid && nc>=0 && nc<tamanoGrid && mapaReal[nf*tamanoGrid+nc] === 'mina') m++;
    }
    return m;
}

function expandir(id) {
    const f = Math.floor(id/tamanoGrid), c = id%tamanoGrid;
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) {
        const nf=f+i, nc=c+j;
        if(nf>=0 && nf<tamanoGrid && nc>=0 && nc<tamanoGrid) {
            const v = celdasCache[nf*tamanoGrid+nc];
            if (!v.classList.contains('revelada')) { setTimeout(() => revelarCelda(v), 60); }
        }
    }
}

document.getElementById('btn-reiniciar').addEventListener('click', function() {
    this.classList.add('animacion-moderna');
    crearTablero();
    setTimeout(() => { this.classList.remove('animacion-moderna'); }, 400);
});

document.getElementById('btn-reintentar-modal').addEventListener('click', function() {
    this.classList.add('animacion-moderna');
    setTimeout(() => { 
        this.classList.remove('animacion-moderna'); 
        crearTablero();
    }, 400);
});

document.getElementById('btn-jugar-victoria').addEventListener('click', function() {
    this.classList.add('animacion-moderna');
    setTimeout(() => { 
        this.classList.remove('animacion-moderna'); 
        crearTablero();
    }, 400);
});

// --- ACTUALIZADO: Paneles de Acordeón "Limpios" (solo uno abierto a la vez) ---
const panelGui = document.getElementById('instrucciones-content');
const panelRecords = document.getElementById('records-content');
const panelLogros = document.getElementById('logros-content');

document.getElementById('btn-toggle-gui').addEventListener('click', () => {
    panelRecords.classList.remove('active');
    panelLogros.classList.remove('active');
    panelGui.classList.toggle('active');
});

document.getElementById('btn-toggle-records').addEventListener('click', () => {
    panelGui.classList.remove('active');
    panelLogros.classList.remove('active');
    panelRecords.classList.toggle('active');
});

document.getElementById('btn-toggle-logros').addEventListener('click', () => {
    panelGui.classList.remove('active');
    panelRecords.classList.remove('active');
    panelLogros.classList.toggle('active');
});
// -----------------------------------------------------------------------------

document.getElementById('btn-borrar-records').addEventListener('click', () => {
    if (confirm(idiomas[idiomaActual].alertaBorrar)) {
        localStorage.removeItem('monkey_records');
        localStorage.removeItem('monkey_logros'); 
        cargarRecords(); 
        cargarLogros();
    }
});

// --- Lógica de la Pantalla de Configuración ---
const btnConfig = document.getElementById('btn-config');
const modalConfig = document.getElementById('modal-config');
const btnCerrarConfig = document.getElementById('btn-cerrar-config');
const sliderMusica = document.getElementById('slider-musica');
const sliderEfectos = document.getElementById('slider-efectos');

const btnEs = document.getElementById('btn-es');
const btnEn = document.getElementById('btn-en');

// Variables temporales para cuando el modal está abierto pero no guardado
let tempIdioma = 'es';

function actualizarBotonesIdioma(idioma) {
    btnEs.style.background = idioma === 'es' ? 'var(--accent)' : 'transparent';
    btnEs.style.color = idioma === 'es' ? 'var(--bg-main)' : 'white';
    btnEn.style.background = idioma === 'en' ? 'var(--accent)' : 'transparent';
    btnEn.style.color = idioma === 'en' ? 'var(--bg-main)' : 'white';
}

// Al abrir el modal, cargamos las variables actuales a las visuales (por si las cambiaron antes y no guardaron)
btnConfig.addEventListener('click', () => {
    tempIdioma = idiomaActual;
    actualizarBotonesIdioma(tempIdioma);
    sliderMusica.value = volumenMusica;
    sliderEfectos.value = volumenEfectos;
    modalConfig.classList.add('mostrar');
});

// Al pulsar la X, cerramos sin hacer nada (los cambios visuales se sobreescribirán la próxima vez)
document.getElementById('btn-cerrar-x').addEventListener('click', () => {
    modalConfig.classList.remove('mostrar');
});

// Al pulsar Guardar y Cerrar, aplicamos los cambios
btnCerrarConfig.addEventListener('click', () => {
    volumenMusica = parseFloat(sliderMusica.value);
    volumenEfectos = parseFloat(sliderEfectos.value);
    if(sonidoAmbiente) sonidoAmbiente.volume = volumenMusica;
    
    if (idiomaActual !== tempIdioma) {
        setIdioma(tempIdioma);
    }
    
    modalConfig.classList.remove('mostrar');
});

// Los botones de idioma ahora solo cambian el estado temporal
btnEs.addEventListener('click', () => {
    tempIdioma = 'es';
    actualizarBotonesIdioma(tempIdioma);
});
btnEn.addEventListener('click', () => {
    tempIdioma = 'en';
    actualizarBotonesIdioma(tempIdioma);
});

function setIdioma(idioma) {
    idiomaActual = idioma; 
    actualizarBotonesIdioma(idioma);

    document.getElementById('th-puntos').innerText = idiomas[idioma].thPuntos;
    document.getElementById('th-tiempo').innerText = idiomas[idioma].thTiempo;
    document.getElementById('th-bananas').innerText = idiomas[idioma].thBananas;
    document.getElementById('th-rango').innerText = idiomas[idioma].thRango;

    document.getElementById('btn-reiniciar').innerText = idiomas[idioma].reiniciar;
    document.getElementById('titulo-opciones').innerText = idiomas[idioma].opciones;
    
    document.getElementById('txt-idioma-btn').innerHTML = `<i class="fas fa-globe"></i> ` + idiomas[idioma].idiomaBtn;
    document.getElementById('txt-desc-idioma').innerText = idiomas[idioma].descIdioma;
    
    document.getElementById('txt-sonidos-btn').innerHTML = `<i class="fas fa-music"></i> ` + idiomas[idioma].sonidosBtn;
    document.getElementById('txt-desc-sonidos').innerText = idiomas[idioma].descSonidos;
    
    document.getElementById('lbl-musica').innerHTML = idiomas[idioma].musicaLbl;
    document.getElementById('lbl-efectos').innerHTML = idiomas[idioma].efectosLbl;
    document.getElementById('btn-cerrar-config').innerText = idiomas[idioma].cerrarBtn;
    
    document.getElementById('btn-borrar-records').innerHTML = idiomas[idioma].borrarBtn;
    
    document.getElementById('btn-toggle-records').innerHTML = idiomas[idioma].recordsBtn;
    document.getElementById('btn-toggle-logros').innerHTML = idiomas[idioma].logrosBtn;
    document.getElementById('btn-toggle-gui').innerHTML = idiomas[idioma].guiaBtn;
    
    document.getElementById('btn-reintentar-modal').innerText = idiomas[idioma].volverBtn;
    document.getElementById('btn-jugar-victoria').innerText = idiomas[idioma].jugarBtn;

    document.getElementById('select-dificultad').options[0].text = idiomas[idioma].optAprendiz;
    document.getElementById('select-dificultad').options[1].text = idiomas[idioma].optGorila;
    document.getElementById('select-dificultad').dispatchEvent(new Event('change'));

    document.getElementById('logros-content').innerHTML = idiomas[idioma].htmlLogros;
    document.getElementById('instrucciones-content').innerHTML = idiomas[idioma].htmlGuia;
    
    document.getElementById('txt-bananas').innerText = idiomas[idioma].bananasLbl;
    document.getElementById('txt-tablero').innerText = idiomas[idioma].tableroLbl;
    document.getElementById('txt-puntuacion-derrota').innerText = idiomas[idioma].puntuacionLbl;
    document.getElementById('txt-puntuacion-victoria').innerText = idiomas[idioma].puntuacionLbl;
    document.getElementById('btn-config').title = idiomas[idioma].configTitle;
    
    cargarLogros();
    cargarRecords();
}

window.onload = () => {
    setIdioma('es');
    crearTablero();
};
