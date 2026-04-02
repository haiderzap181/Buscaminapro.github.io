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

// SEGURIDAD: Datos fuera del alcance del Inspector HTML
let mapaReal = []; 
let celdasCache = [];

function crearTablero() {
    let cant = parseInt(inputMinas.value) || 15;
    cant = Math.min(Math.max(cant, 15), 99);
    inputMinas.value = cant;
    numeroDeMinas = cant;

    tableroElemento.innerHTML = '';
    celdasCache = [];
    juegoTerminado = false;
    puntaje = 0;
    puntosElemento.innerText = puntaje;
    
    detenerTiempo();
    tiempo = 0;
    timerElemento.innerText = tiempo;
    primerClic = true;

    statusElemento.className = 'status-hidden';
    celdasPorRevelar = (filas * columnas) - numeroDeMinas;

    // Generamos el mapa en memoria privada
    mapaReal = generarDatos(); 

    for (let i = 0; i < filas * columnas; i++) {
        const celda = document.createElement('div');
        celda.classList.add('celda');
        celda.dataset.id = i; // Solo el ID es visible

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
            if (navigator.vibrate) navigator.vibrate(30); 
            celda.innerText = (celda.innerText === '') ? '🚩' : (celda.innerText === '🚩' ? '?' : '');
        });

        tableroElemento.appendChild(celda);
        celdasCache.push(celda);
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
    const tipoReal = mapaReal[id]; // Consultamos la variable segura

    if (tipoReal === 'mina') {
        detenerTiempo();
        sonidoExplosion.play().catch(()=>{});
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

        celda.classList.add('revelada');
        celda.innerText = '💣';
        juegoTerminado = true;
        statusElemento.innerText = '💥 ¡GAME OVER! 💥';
        statusElemento.className = 'status-lost';
        revelarTodas();
    } else {
        const ahora = Date.now();
        if (ahora - ultimoSonidoTime > 80) {
            sonidoRevelar.currentTime = 0;
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
            if (navigator.vibrate) navigator.vibrate(15); 
            expandir(id);
        }

        if (celdasPorRevelar === 0 && !juegoTerminado) {
            detenerTiempo();
            juegoTerminado = true;
            sonidoVictoria.play().catch(()=>{});
            if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]);
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
            if(mapaReal[nf*10+nc] === 'mina') m++;
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
                setTimeout(() => revelarCelda(vecino), delay);
                delay += 50; 
            }
        }
    }
}

function revelarTodas() {
    celdasCache.forEach((c, index) => {
        if(mapaReal[index] === 'mina') {
            c.classList.add('revelada');
            c.innerText = '💣';
        }
    });
}

// --- BLOQUEO DE INSPECTOR Y ATAJOS ---
document.onkeydown = function(e) {
    if (e.keyCode == 123) return false; // Bloquear F12
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false;
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false;
    if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false;
};

document.getElementById('btn-reiniciar').addEventListener('click', crearTablero);
window.onload = crearTablero;
