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
let musicaMutada = false;
let tamanoGrid = 10; 
let usoBandera = false; 

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
    // ACTUALIZADO: Añadimos los dos logros nuevos al objeto inicial
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

    // ACTUALIZADO: Evaluamos los nuevos logros para Mono Aprendiz (8x8)
    if (tamanoGrid === 8 && !logros.primerPaso) {
        logros.primerPaso = true; nuevoDesbloqueo = true;
    }
    if (tamanoGrid === 8 && tiempo < 30 && !logros.aprendizVeloz) {
        logros.aprendizVeloz = true; nuevoDesbloqueo = true;
    }

    // Logros de Gorila Plateado (10x10) y generales
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
    if (records.length === 0) { listaRecordsElemento.innerHTML = '<tr><td colspan="4" style="padding:20px; opacity:0.6">Sin récords aún</td></tr>'; return; }
    
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
        textoLimites.innerText = 'Límites: 10 a 63 bananas';
    } else if (nuevoTamano === 10) {
        inputMinas.min = 15;
        inputMinas.value = 15;
        textoLimites.innerText = 'Límites: 15 a 99 bananas';
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
                if(sonidoAmbiente && !musicaMutada) { 
                    sonidoAmbiente.volume = 0.3; 
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
        
        if(sonidoExplosion) { sonidoExplosion.volume = 0.4; sonidoExplosion.play().catch(()=>{}); }
        if(sonidoRisa) { sonidoRisa.volume = 0.6; sonidoRisa.play().catch(()=>{}); }
        
        const gameContainer = document.querySelector('.game-container');
        gameContainer.classList.add('shake-screen');
        setTimeout(() => gameContainer.classList.remove('shake-screen'), 500); 

        celdasCache.forEach((c, idx) => { if(mapaReal[idx] === 'mina') { c.innerHTML = ''; c.classList.add('revelada', 'bomba-revelada'); } });
        
        setTimeout(() => {
            document.getElementById('puntuacion-final').innerText = puntaje;
            document.getElementById('modal-derrota').classList.add('mostrar');
        }, 600);
        
    } else {
        if(sonidoRevelar) { sonidoRevelar.volume = 0.2; sonidoRevelar.play().catch(()=>{}); }
        celda.classList.add('revelada'); celdasPorRevelar--;
        puntaje += 100; puntosElemento.innerText = puntaje;
        const m = contarVecinos(id);
        if (m > 0) { celda.innerText = m; celda.classList.add('numero-' + m); }
        else { expandir(id); }
        
        if (celdasPorRevelar === 0) {
            clearInterval(intervaloTiempo); juegoTerminado = true;
            
            if(sonidoAmbiente) sonidoAmbiente.pause(); 
            
            if(sonidoVictoria) { sonidoVictoria.play().catch(()=>{}); }
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

document.getElementById('btn-toggle-gui').addEventListener('click', () => {
    document.getElementById('instrucciones-content').classList.toggle('active');
});

document.getElementById('btn-toggle-records').addEventListener('click', () => {
    document.getElementById('records-content').classList.toggle('active');
});

document.getElementById('btn-toggle-logros').addEventListener('click', () => {
    document.getElementById('logros-content').classList.toggle('active');
});

document.getElementById('btn-borrar-records').addEventListener('click', () => {
    if (confirm('¿Estás seguro de que deseas restablecer todos los récords y logros? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('monkey_records');
        localStorage.removeItem('monkey_logros'); 
        cargarRecords(); 
        cargarLogros();
    }
});

const btnMutear = document.getElementById('btn-mutear');
btnMutear.addEventListener('click', () => {
    musicaMutada = !musicaMutada; 
    if(sonidoAmbiente) { sonidoAmbiente.muted = musicaMutada; }
    
    if (musicaMutada) {
        btnMutear.classList.remove('fa-volume-up');
        btnMutear.classList.add('fa-volume-mute');
        btnMutear.style.color = '#ff4d4d'; 
    } else {
        btnMutear.classList.remove('fa-volume-mute');
        btnMutear.classList.add('fa-volume-up');
        btnMutear.style.color = 'var(--accent)'; 
        if (!primerClic && !juegoTerminado && sonidoAmbiente.paused) {
            sonidoAmbiente.play().catch(()=>{});
        }
    }
});

window.onload = crearTablero;
