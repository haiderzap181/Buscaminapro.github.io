const tableroElemento = document.getElementById('tablero');
const puntosElemento = document.getElementById('puntos');
const statusElemento = document.getElementById('game-status');
const inputMinas = document.getElementById('input-minas');

const sonidoExplosion = document.getElementById('sonido-explosion');
const sonidoRevelar = document.getElementById('sonido-revelar');
const sonidoVictoria = document.getElementById('sonido-victoria');

const filas = 10, columnas = 10;
let numeroDeMinas = 15, juegoTerminado = false, celdasPorRevelar, puntaje = 0;

function crearTablero() {
    let cant = parseInt(inputMinas.value);
    if (isNaN(cant) || cant < 15) cant = 15;
    if (cant > 99) cant = 99;
    inputMinas.value = cant;
    numeroDeMinas = cant;

    tableroElemento.innerHTML = '';
    juegoTerminado = false;
    puntaje = 0;
    puntosElemento.innerText = puntaje;
    statusElemento.className = 'status-hidden';
    celdasPorRevelar = (filas * columnas) - numeroDeMinas;
    
    const datos = generarDatos();

    for (let i = 0; i < filas * columnas; i++) {
        const celda = document.createElement('div');
        celda.classList.add('celda');
        celda.dataset.tipo = datos[i]; 
        celda.dataset.id = i;

        celda.addEventListener('click', () => revelarCelda(celda));
        celda.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (celda.classList.contains('revelada') || juegoTerminado) return;
            celda.innerText = (celda.innerText === '') ? '🚩' : (celda.innerText === '🚩' ? '?' : '');
        });

        tableroElemento.appendChild(celda);
    }
}

function generarDatos() {
    const m = Array(numeroDeMinas).fill('mina'), v = Array(100 - numeroDeMinas).fill('vacio');
    return v.concat(m).sort(() => Math.random() - 0.5);
}

function revelarCelda(celda) {
    if (!celda || celda.classList.contains('revelada') || juegoTerminado || celda.innerText === '🚩') return;
    
    const id = parseInt(celda.dataset.id);

    if (celda.dataset.tipo === 'mina') {
        sonidoExplosion.volume = 0.5;
        sonidoExplosion.currentTime = 0;
        sonidoExplosion.play();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

        celda.classList.add('revelada');
        celda.innerText = '💣';
        juegoTerminado = true;
        statusElemento.innerText = '💥 ¡GAME OVER! 💥';
        statusElemento.className = 'status-lost';
        revelarTodas();
    } else {
        const clic = sonidoRevelar.cloneNode();
        clic.volume = 0.4;
        clic.play();

        celda.classList.add('revelada');
        puntaje += 100;
        puntosElemento.innerText = puntaje;
        celdasPorRevelar--;

        const total = contarVecinos(id);
        if (total > 0) {
            celda.innerText = total;
            celda.classList.add('numero-' + total);
        } else expandir(id);

        if (celdasPorRevelar === 0 && !juegoTerminado) {
            juegoTerminado = true;
            sonidoVictoria.volume = 0.6;
            sonidoVictoria.play();
            if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]);
            statusElemento.innerText = '🏆 ¡VICTORIA! 🏆';
            statusElemento.className = 'status-won';
        }
    }
}

function contarVecinos(id) {
    let m = 0;
    const f = Math.floor(id/10), c = id%10;
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) {
        const nf=f+i, nc=c+j;
        if(nf>=0 && nf<10 && nc>=0 && nc<10 && document.querySelectorAll('.celda')[nf*10+nc].dataset.tipo==='mina') m++;
    }
    return m;
}

function expandir(id) {
    const f = Math.floor(id/10), c = id%10;
    let delay = 0;
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) {
        const nf=f+i, nc=c+j;
        if(nf>=0 && nf<10 && nc>=0 && nc<10) {
            const vecino = document.querySelectorAll('.celda')[nf*10+nc];
            if (!vecino.classList.contains('revelada')) {
                setTimeout(() => revelarCelda(vecino), delay);
                delay += 40;
            }
        }
    }
}

function revelarTodas() {
    document.querySelectorAll('.celda').forEach(c => {
        if(c.dataset.tipo === 'mina') { c.classList.add('revelada'); c.innerText = '💣'; }
    });
}

document.getElementById('btn-reiniciar').addEventListener('click', crearTablero);
window.onload = crearTablero;
