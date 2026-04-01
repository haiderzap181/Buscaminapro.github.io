const tableroElemento = document.getElementById('tablero');
const puntosElemento = document.getElementById('puntos');
const statusElemento = document.getElementById('game-status');
const inputMinas = document.getElementById('input-minas');
const timerElemento = document.getElementById('timer');

const sonidoExplosion = document.getElementById('sonido-explosion');
const sonidoRevelar = document.getElementById('sonido-revelar');
const sonidoVictoria = document.getElementById('sonido-victoria');

let filas = 10, columnas = 10, numeroDeMinas = 15;
let juegoTerminado = false, celdasPorRevelar, puntaje = 0;
let ultimoSonidoTime = 0;
let tiempo = 0, intervaloTiempo, primerClic = true;

// Cache de celdas para acceso ultra rápido
let celdasCache = [];

function crearTablero() {
    let cant = parseInt(inputMinas.value) || 15;
    cant = Math.min(Math.max(cant, 15), 99);
    inputMinas.value = cant;
    numeroDeMinas = cant;

    tableroElemento.innerHTML = '';
    celdasCache = []; // Limpiar cache
    juegoTerminado = false;
    puntaje = 0;
    puntosElemento.innerText = puntaje;
    
    detenerTiempo();
    tiempo = 0;
    timerElemento.innerText = tiempo;
    primerClic = true;

    statusElemento.className = 'status-hidden';
    celdasPorRevelar = (filas * columnas) - numeroDeMinas;
    const datos = generarDatos();

    for (let i = 0; i < filas * columnas; i++) {
        const celda = document.createElement('div');
        celda.classList.add('celda');
        celda.dataset.tipo = datos[i]; 
        celda.dataset.id = i;

        celda.addEventListener('click', () => {
            if (primerClic && !juegoTerminado) {
                iniciarTiempo();
                primerClic = false;
            }
            revelarCelda(celda);
        });

        celda.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (celda.classList.contains('revelada') || juegoTerminado) return;
            if (navigator.vibrate) navigator.vibrate(20); 
            celda.innerText = (celda.innerText === '') ? '🚩' : (celda.innerText === '🚩' ? '?' : '');
        });

        tableroElemento.appendChild(celda);
        celdasCache.push(celda); // Guardamos la referencia
    }
}

function iniciarTiempo() {
    intervaloTiempo = setInterval(() => {
        tiempo++;
        timerElemento.innerText = tiempo;
    }, 1000);
}

function detenerTiempo() {
    clearInterval(intervaloTiempo);
}

function generarDatos() {
    const m = Array(numeroDeMinas).fill('mina'), v = Array(100 - numeroDeMinas).fill('vacio');
    return v.concat(m).sort(() => Math.random() - 0.5);
}

function revelarCelda(celda) {
    if (!celda || celda.classList.contains('revelada') || juegoTerminado || celda.innerText === '🚩') return;
    
    const id = parseInt(celda.dataset.id);

    if (celda.dataset.tipo === 'mina') {
        detenerTiempo();
        sonidoExplosion.play().catch(()=>{});
        if (navigator.vibrate) navigator.vibrate([150, 50, 150]);

        celda.classList.add('revelada');
        celda.innerText = '💣';
        juegoTerminado = true;
        statusElemento.innerText = '💥 ¡GAME OVER! 💥';
        statusElemento.className = 'status-lost';
        revelarTodas();
    } else {
        // Optimización de sonido: solo suena si no ha sonado hace 85ms
        const ahora = Date.now();
        if (ahora - ultimoSonidoTime > 85) {
            sonidoRevelar.currentTime = 0;
            sonidoRevelar.volume = 0.3;
            sonidoRevelar.play().catch(()=>{});
            ultimoSonidoTime = ahora;
        }

        celda.classList.add('revelada');
        puntaje += 100;
        puntosElemento.innerText = puntaje;
        celdasPorRevelar--;

        const total = contarVecinos(id);
        if (total > 0) {
            celda.innerText = total;
            celda.classList.add('numero-' + total);
        } else {
            // Solo vibramos una vez al iniciar una expansión masiva
            if (navigator.vibrate) navigator.vibrate(15); 
            expandir(id);
        }

        if (celdasPorRevelar === 0 && !juegoTerminado) {
            detenerTiempo();
            juegoTerminado = true;
            sonidoVictoria.play().catch(()=>{});
            statusElemento.innerText = `🏆 ¡VICTORIA EN ${tiempo}s! 🏆`;
            statusElemento.className = 'status-won';
        }
    }
}

function contarVecinos(id) {
    let m = 0;
    const f = Math.floor(id/10), c = id%10;
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) {
        const nf=f+i, nc=c+j;
        if(nf>=0 && nf<10 && nc>=0 && nc<10) {
            if(celdasCache[nf*10+nc].dataset.tipo === 'mina') m++;
        }
    }
    return m;
}

function expandir(id) {
    const f = Math.floor(id/10), c = id%10;
    let delay = 0;
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) {
        const nf=f+i, nc=c+j;
        if(nf>=0 && nf<10 && nc>=0 && nc<10) {
            const vecino = celdasCache[nf*10+nc];
            if (!vecino.classList.contains('revelada')) {
                // Aumentamos un poco el delay para dar aire al procesador móvil
                setTimeout(() => revelarCelda(vecino), delay);
                delay += 55; 
            }
        }
    }
}

function revelarTodas() {
    celdasCache.forEach(c => {
        if(c.dataset.tipo === 'mina') {
            c.classList.add('revelada');
            c.innerText = '💣';
        }
    });
}

document.getElementById('btn-reiniciar').addEventListener('click', crearTablero);
window.onload = crearTablero;
