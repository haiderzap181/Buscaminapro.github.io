const tableroElemento = document.getElementById('tablero');
const puntosElemento = document.getElementById('puntos');
const statusElemento = document.getElementById('game-status');
const inputMinas = document.getElementById('input-minas');

const filas = 10;
const columnas = 10;
let numeroDeMinas = 15; 
let juegoTerminado = false;
let celdasPorRevelar; 
let puntaje = 0;

function crearTablero() {
    // Validación de entrada
    let cantidadDeseada = parseInt(inputMinas.value);
    if (isNaN(cantidadDeseada) || cantidadDeseada < 15) { cantidadDeseada = 15; inputMinas.value = 15; }
    else if (cantidadDeseada > 99) { cantidadDeseada = 99; inputMinas.value = 99; }
    numeroDeMinas = cantidadDeseada;

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

        // Ciclo de banderas: Bloquea menú del navegador 
        celda.addEventListener('contextmenu', (e) => {
            e.preventDefault(); 
            if (celda.classList.contains('revelada') || juegoTerminado) return;

            if (celda.innerText === '') { celda.innerText = '🚩'; celda.style.color = '#e94560'; }
            else if (celda.innerText === '🚩') { celda.innerText = '?'; celda.style.color = '#f9d423'; }
            else { celda.innerText = ''; }
        });

        tableroElemento.appendChild(celda);
    }
}

function generarDatos() {
    const minas = Array(numeroDeMinas).fill('mina');
    const vacios = Array((filas * columnas) - numeroDeMinas).fill('vacio');
    return vacios.concat(minas).sort(() => Math.random() - 0.5);
}

function revelarCelda(celda) {
    if (celda.classList.contains('revelada') || juegoTerminado || celda.innerText === '🚩') return;

    celda.classList.add('revelada');
    const id = parseInt(celda.dataset.id);

    if (celda.dataset.tipo === 'mina') {
        celda.innerText = '💣';
        juegoTerminado = true;
        statusElemento.innerText = '💥 ¡GAME OVER! 💥';
        statusElemento.className = 'status-lost';
        revelarTodas();
    } else {
        puntaje += 100;
        puntosElemento.innerText = puntaje;
        celdasPorRevelar--;

        const total = contarVecinos(id);
        if (total > 0) {
            celda.innerText = total;
            celda.classList.add('numero-' + total);
        } else {
            expandir(id);
        }

        if (celdasPorRevelar === 0) {
            juegoTerminado = true;
            statusElemento.innerText = '🏆 ¡VICTORIA! 🏆';
            statusElemento.className = 'status-won';
        }
    }
}

function contarVecinos(id) {
    let m = 0;
    const f = Math.floor(id / columnas), c = id % columnas;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const nf = f + i, nc = c + j;
            if (nf >= 0 && nf < filas && nc >= 0 && nc < columnas) {
                const vId = nf * columnas + nc;
                if (document.querySelectorAll('.celda')[vId].dataset.tipo === 'mina') m++;
            }
        }
    }
    return m;
}

function expandir(id) {
    const f = Math.floor(id / columnas), c = id % columnas;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const nf = f + i, nc = c + j;
            if (nf >= 0 && nf < filas && nc >= 0 && nc < columnas) {
                const vId = nf * columnas + nc;
                const vecino = document.querySelectorAll('.celda')[vId];
                if (!vecino.classList.contains('revelada')) revelarCelda(vecino);
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