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

function obtenerRango(bananas, tiempo) {
    if (bananas >= 45 || (bananas >= 30 && tiempo <= 60)) {
        return 'img/rango03.png';
    }
    else if (bananas >= 25 || (bananas >= 15 && tiempo <= 90)) {
        return 'img/rango02.png';
    }
    else {
        return 'img/rango01.png';
    }
}

function cargarRecords() {
    const records = JSON.parse(localStorage.getItem('monkey_records')) || [];
    listaRecordsElemento.innerHTML = '';
    if (records.length === 0) { listaRecordsElemento.innerHTML = '<tr><td colspan="4" style="padding:20px; opacity:0.6">Sin récords aún</td></tr>'; return; }
    
    records.sort((a, b) => b.puntaje - a.puntaje);
    
    records.slice(0, 5).forEach(rec => {
        const iconoRango = obtenerRango(rec.bananas, rec.tiempo);
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
    records.push({ puntaje, tiempo, bananas: parseInt(inputMinas.value) });
    localStorage.setItem('monkey_records', JSON.stringify(records));
    cargarRecords();
}

function crearTablero() {
    cargarRecords();
    document.getElementById('modal-derrota').classList.remove('mostrar');
    document.getElementById('modal-victoria').classList.remove('mostrar'); 
    let numMinas = parseInt(inputMinas.value) || 15;
    tableroElemento.innerHTML = '';
    celdasCache = []; juegoTerminado = false; primerClic = true;
    puntaje = 0; puntosElemento.innerText = '0';
    clearInterval(intervaloTiempo); tiempo = 0; timerElemento.innerText = '0';
    celdasPorRevelar = 100 - numMinas;
    mapaReal = [...Array(numMinas).fill('mina'), ...Array(100 - numMinas).fill('vacio')].sort(() => Math.random() - 0.5);

    if(sonidoAmbiente) {
        sonidoAmbiente.pause();
        sonidoAmbiente.currentTime = 0;
    }

    for (let i = 0; i < 100; i++) {
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
            guardarRecord();
            
            setTimeout(() => {
                document.getElementById('puntuacion-final-victoria').innerText = puntaje;
                document.getElementById('modal-victoria').classList.add('mostrar');
            }, 600);
        }
    }
}

function contarVecinos(id) {
    let m = 0; const f = Math.floor(id/10), c = id%10;
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) {
        const nf=f+i, nc=c+j;
        if(nf>=0 && nf<10 && nc>=0 && nc<10 && mapaReal[nf*10+nc] === 'mina') m++;
    }
    return m;
}

function expandir(id) {
    const f = Math.floor(id/10), c = id%10;
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) {
        const nf=f+i, nc=c+j;
        if(nf>=0 && nf<10 && nc>=0 && nc<10) {
            const v = celdasCache[nf*10+nc];
            if (!v.classList.contains('revelada')) { setTimeout(() => revelarCelda(v), 30); }
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

document.getElementById('btn-borrar-records').addEventListener('click', () => {
    if (confirm('¿Estás seguro de que deseas restablecer todos los récords? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('monkey_records');
        cargarRecords(); 
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
