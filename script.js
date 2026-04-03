const tableroElemento = document.getElementById('tablero');
const puntosElemento = document.getElementById('puntos');
const statusElemento = document.getElementById('game-status');
const inputMinas = document.getElementById('input-minas');
const timerElemento = document.getElementById('timer');
const listaRecordsElemento = document.getElementById('lista-records');

const sonidoExplosion = document.getElementById('sonido-explosion');
const sonidoRevelar = document.getElementById('sonido-revelar');
const sonidoVictoria = document.getElementById('sonido-victoria');
const sonidoAmbiente = document.getElementById('sonido-ambiente');

let mapaReal = [], celdasCache = [], juegoTerminado = false;
let tiempo = 0, intervaloTiempo, primerClic = true, puntaje = 0, celdasPorRevelar;

// Nueva variable global para controlar si el jugador muteó el juego
let musicaMutada = false;

function cargarRecords() {
    const records = JSON.parse(localStorage.getItem('monkey_records')) || [];
    listaRecordsElemento.innerHTML = '';
    if (records.length === 0) { listaRecordsElemento.innerHTML = '<tr><td colspan="4" style="padding:20px; opacity:0.6">Sin récords aún</td></tr>'; return; }
    records.sort((a, b) => b.puntaje - a.puntaje);
    records.slice(0, 5).forEach(rec => {
        listaRecordsElemento.innerHTML += `<tr><td>${rec.puntaje}</td><td>${rec.tiempo}s</td><td>${rec.bananas}</td><td>${rec.fecha}</td></tr>`;
    });
}

function guardarRecord() {
    const records = JSON.parse(localStorage.getItem('monkey_records')) || [];
    records.push({ puntaje, tiempo, bananas: parseInt(inputMinas.value), fecha: new Date().toLocaleDateString() });
    localStorage.setItem('monkey_records', JSON.stringify(records));
    cargarRecords();
}

function crearTablero() {
    cargarRecords();
    document.getElementById('modal-derrota').classList.remove('mostrar');
    document.getElementById('modal-victoria').classList.remove('mostrar'); 
    statusElemento.className = 'status-hidden';
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
        celda.addEventListener('click', () => {
            if (primerClic && !juegoTerminado) { 
                intervaloTiempo = setInterval(() => { tiempo++; timerElemento.innerText = tiempo; }, 1000);
                
                // Si el jugador no lo ha mutado, arranca la música
                if(sonidoAmbiente && !musicaMutada) { 
                    sonidoAmbiente.volume = 0.3; 
                    sonidoAmbiente.play().catch(()=>{}); 
                }
                primerClic = false; 
            }
            revelarCelda(celda);
        });
        celda.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (juegoTerminado || celda.classList.contains('revelada')) return;
            if (celda.innerHTML === '') {
                celda.innerHTML = '<i class="fas fa-flag"></i>';
            } else if (celda.querySelector('.fa-flag')) {
                celda.innerHTML = '<i class="fas fa-question" style="color:white"></i>';
            } else {
                celda.innerHTML = '';
            }
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
            statusElemento.innerText = '🏆 ¡HAS GANADO! 🏆'; statusElemento.className = 'status-won';
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

// --- LÓGICA DEL BOTÓN DE MUTEAR ---
const btnMutear = document.getElementById('btn-mutear');
btnMutear.addEventListener('click', () => {
    musicaMutada = !musicaMutada; // Alternar estado
    
    if(sonidoAmbiente) {
        sonidoAmbiente.muted = musicaMutada; // Mutea el elemento de audio directamente
    }
    
    if (musicaMutada) {
        // Estado Apagado
        btnMutear.classList.remove('fa-volume-up');
        btnMutear.classList.add('fa-volume-mute');
        btnMutear.style.color = '#ff4d4d'; // Rojo
    } else {
        // Estado Prendido
        btnMutear.classList.remove('fa-volume-mute');
        btnMutear.classList.add('fa-volume-up');
        btnMutear.style.color = 'var(--accent)'; // Vuelve a amarillo
        
        // Si el juego está corriendo y no está pausado por perder/ganar, forzamos play si estaba mudo
        if (!primerClic && !juegoTerminado && sonidoAmbiente.paused) {
            sonidoAmbiente.play().catch(()=>{});
        }
    }
});

window.onload = crearTablero;
