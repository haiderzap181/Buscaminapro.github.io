const tableroElemento = document.getElementById('tablero');
const puntosElemento = document.getElementById('puntos');
const inputMinas = document.getElementById('input-minas');
const timerElemento = document.getElementById('timer');

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

// --- LÓGICA DEL SISTEMA DE XP (Niveles) ---
let totalXP = parseInt(localStorage.getItem('monkey_xp')) || 0;
const MAX_LEVEL = 50;

function getLevelInfo(xp) {
    let level = 1; let currentLevelXP = xp; let xpNeeded = level * 500;
    while (currentLevelXP >= xpNeeded && level < MAX_LEVEL) {
        currentLevelXP -= xpNeeded; level++; xpNeeded = level * 500;
    }
    if (level === MAX_LEVEL) currentLevelXP = xpNeeded; 
    return { level, currentLevelXP, xpNeeded };
}

function updateXPUI(isLevelUp = false) {
    const info = getLevelInfo(totalXP);
    document.getElementById('player-level').innerText = info.level;
    const porcentaje = (info.level === MAX_LEVEL) ? 100 : (info.currentLevelXP / info.xpNeeded) * 100;
    document.getElementById('xp-bar').style.width = `${porcentaje}%`;
    
    if (info.level === MAX_LEVEL) {
        document.getElementById('xp-text').innerText = "MAX";
    } else {
        document.getElementById('xp-text').innerText = `${Math.floor(info.currentLevelXP)} / ${info.xpNeeded} ${idiomas[idiomaActual].xpTexto}`;
    }

    if (isLevelUp) {
        const badge = document.querySelector('.xp-badge');
        badge.classList.add('level-up-anim');
        setTimeout(() => badge.classList.remove('level-up-anim'), 1000);
    }
}

function addXP(amount) {
    const infoAnterior = getLevelInfo(totalXP);
    totalXP += amount;
    localStorage.setItem('monkey_xp', totalXP);
    const infoNueva = getLevelInfo(totalXP);
    updateXPUI(infoNueva.level > infoAnterior.level);
}

// --- LÓGICA DEL SISTEMA DE PD (Rangos/Grados 1 al 30) ---
let totalPD = parseInt(localStorage.getItem('monkey_pd')) || 0;

const rangosPDData = [
    // PLATA
    { pd: 0, icon: "img/ramg_plata01.png" },
    { pd: 1000, icon: "img/ramg_plata02.png" },
    { pd: 3000, icon: "img/ramg_plata03.png" },
    { pd: 6000, icon: "img/ramg_plata04.png" },
    { pd: 10000, icon: "img/ramg_plata05.png" },
    { pd: 15000, icon: "img/ramg_plata06.png" },
    { pd: 22000, icon: "img/ramg_plata07.png" },
    { pd: 30000, icon: "img/ramg_plata08.png" },
    { pd: 40000, icon: "img/ramg_plata09.png" },
    { pd: 55000, icon: "img/ramg_plata10.png" },
    // ORO
    { pd: 75000, icon: "img/ramg_oro01.png" },
    { pd: 100000, icon: "img/ramg_oro02.png" },
    { pd: 130000, icon: "img/ramg_oro03.png" },
    { pd: 165000, icon: "img/ramg_oro04.png" },
    { pd: 205000, icon: "img/ramg_oro05.png" },
    { pd: 250000, icon: "img/ramg_oro06.png" },
    { pd: 300000, icon: "img/ramg_oro07.png" },
    { pd: 360000, icon: "img/ramg_oro08.png" },
    { pd: 430000, icon: "img/ramg_oro09.png" },
    { pd: 510000, icon: "img/ramg_oro10.png" },
    // ESMERALDA
    { pd: 600000, icon: "img/ramg_emeralda01.png" },
    { pd: 700000, icon: "img/ramg_emeralda02.png" },
    { pd: 810000, icon: "img/ramg_emeralda03.png" },
    { pd: 930000, icon: "img/ramg_emeralda04.png" },
    { pd: 1060000, icon: "img/ramg_emeralda05.png" },
    { pd: 1200000, icon: "img/ramg_emeralda06.png" },
    { pd: 1350000, icon: "img/ramg_emeralda07.png" },
    { pd: 1510000, icon: "img/ramg_emeralda08.png" },
    { pd: 1680000, icon: "img/ramg_emeralda09.png" },
    { pd: 2000000, icon: "img/ramg_emeralda10.png" }
];

function updateTopRankIcon() {
    let currentRankIdx = 0;
    for (let i = 0; i < rangosPDData.length; i++) {
        if (totalPD >= rangosPDData[i].pd) {
            currentRankIdx = i;
        } else {
            break;
        }
    }
    document.getElementById('icono-rango-top').src = rangosPDData[currentRankIdx].icon;
}

function addPD(amount) {
    totalPD += amount;
    localStorage.setItem('monkey_pd', totalPD);
    updateTopRankIcon(); 
}
// -------------------------------------------------------

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

    if (tamanoGrid === 8 && !logros.primerPaso) { logros.primerPaso = true; nuevoDesbloqueo = true; }
    if (tamanoGrid === 8 && tiempo < 30 && !logros.aprendizVeloz) { logros.aprendizVeloz = true; nuevoDesbloqueo = true; }
    if (tamanoGrid === 10 && tiempo < 40 && !logros.velocista) { logros.velocista = true; nuevoDesbloqueo = true; }
    if (!usoBandera && !logros.purista) { logros.purista = true; nuevoDesbloqueo = true; }
    if (tamanoGrid === 10 && numMinas > 50 && !logros.locura) { logros.locura = true; nuevoDesbloqueo = true; }

    if (nuevoDesbloqueo) {
        localStorage.setItem('monkey_logros', JSON.stringify(logros));
        cargarLogros();
    }
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

    if(sonidoAmbiente) { sonidoAmbiente.pause(); sonidoAmbiente.currentTime = 0; }

    for (let i = 0; i < totalCeldas; i++) {
        const celda = document.createElement('div');
        celda.classList.add('celda');
        celda.dataset.id = i;

        let tiempoPresionado; let esPulsacionLarga = false; let movioElDedo = false;

        const alternarBandera = () => {
            if (juegoTerminado || celda.classList.contains('revelada')) return;
            if (celda.innerHTML === '') {
                celda.innerHTML = '<i class="fas fa-flag"></i>'; usoBandera = true; 
            } else if (celda.querySelector('.fa-flag')) {
                celda.innerHTML = '<i class="fas fa-question" style="color:white"></i>';
            } else { celda.innerHTML = ''; }
        };

        celda.addEventListener('contextmenu', (e) => { e.preventDefault(); alternarBandera(); });
        celda.addEventListener('touchstart', (e) => {
            if (juegoTerminado || celda.classList.contains('revelada')) return;
            esPulsacionLarga = false; movioElDedo = false;
            tiempoPresionado = setTimeout(() => {
                if (!movioElDedo) { esPulsacionLarga = true; alternarBandera(); if (navigator.vibrate) navigator.vibrate(50); }
            }, 400); 
        });
        celda.addEventListener('touchmove', () => { movioElDedo = true; clearTimeout(tiempoPresionado); });
        celda.addEventListener('touchend', (e) => { clearTimeout(tiempoPresionado); if (esPulsacionLarga) e.preventDefault(); });
        celda.addEventListener('touchcancel', () => clearTimeout(tiempoPresionado));

        celda.addEventListener('click', (e) => {
            if (esPulsacionLarga) return; 
            if (primerClic && !juegoTerminado) { 
                intervaloTiempo = setInterval(() => { tiempo++; timerElemento.innerText = tiempo; }, 1000);
                if(sonidoAmbiente) { sonidoAmbiente.volume = volumenMusica; sonidoAmbiente.play().catch(()=>{}); }
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
        
        let totalCeldas = tamanoGrid * tamanoGrid;
        let numMinas = parseInt(inputMinas.value);
        let celdasReveladas = (totalCeldas - numMinas) - celdasPorRevelar;
        let xpGanada = celdasReveladas * 5; 
        addXP(xpGanada); 
        document.getElementById('xp-ganada-derrota').innerText = Math.floor(xpGanada);

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
            
            let numMinas = parseInt(inputMinas.value);
            let xpGanada = (numMinas * 30) + Math.max(0, 800 - (tiempo * 2));
            addXP(xpGanada); 
            addPD(puntaje);  
            document.getElementById('xp-ganada-victoria').innerText = Math.floor(xpGanada);

            evaluarLogros(); 
            
            if (typeof confetti === 'function') {
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, zIndex: 2000 });
            }
            setTimeout(() => {
                document.getElementById('puntuacion-final-victoria').innerText = puntaje;
                document.getElementById('modal-victoria').classList.add('mostrar');
            }, 600);
        }
    }
}

function contarVecinos(id) {
    let m = 0; const f = Math.floor(id/tamanoGrid), c = id%tamanoGrid;
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

document.getElementById('btn-reiniciar').addEventListener('click', function() { this.classList.add('animacion-moderna'); crearTablero(); setTimeout(() => this.classList.remove('animacion-moderna'), 400); });
document.getElementById('btn-reintentar-modal').addEventListener('click', function() { this.classList.add('animacion-moderna'); setTimeout(() => { this.classList.remove('animacion-moderna'); crearTablero(); }, 400); });
document.getElementById('btn-jugar-victoria').addEventListener('click', function() { this.classList.add('animacion-moderna'); setTimeout(() => { this.classList.remove('animacion-moderna'); crearTablero(); }, 400); });

const contentModal = document.getElementById('contentModal');
const modalTitle = document.getElementById('modalTitle');
const modalScrollContent = document.getElementById('modalScrollContent');

function openContentModal(title) {
    modalTitle.innerText = title;
    modalScrollContent.scrollTop = 0;
    contentModal.classList.add('mostrar');
}

function closeContentModal() {
    contentModal.classList.remove('mostrar');
}

document.getElementById('btn-close-content-x').addEventListener('click', closeContentModal);
document.getElementById('btn-close-content').addEventListener('click', closeContentModal);

document.getElementById('btnrecors').addEventListener('click', () => {
    openContentModal(idiomas[idiomaActual].modalRecordsTitle);
    generateRangosHtml(); 
});

document.getElementById('btnlogros').addEventListener('click', () => {
    openContentModal(idiomas[idiomaActual].modalLogrosTitle);
    modalScrollContent.innerHTML = idiomas[idiomaActual].htmlLogros; 
    cargarLogros(); 
});

document.getElementById('btnguia').addEventListener('click', () => {
    openContentModal(idiomas[idiomaActual].modalGuiaTitle);
    modalScrollContent.innerHTML = idiomas[idiomaActual].htmlGuia; 
});

function generateRangosHtml() {
    let currentRankIdx = 0;
    for (let i = 0; i < rangosPDData.length; i++) {
        if (totalPD >= rangosPDData[i].pd) {
            currentRankIdx = i;
        } else {
            break;
        }
    }

    let currentRank = rangosPDData[currentRankIdx];
    let nextRank = rangosPDData[currentRankIdx + 1];
    let html = '';

    html += `
    <div class="rango-actual-box">
        <h3 style="color: var(--accent); margin-bottom: 10px; font-size: 1.1rem;">${idiomas[idiomaActual].gradoActual}</h3>
        <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${currentRank.icon}" class="rango-icon-main" alt="Rango Actual">
            <div style="flex-grow: 1; text-align: left;">
                <div style="color: white; font-weight: 900; font-size: 1.2rem;">${idiomas[idiomaActual].grado} ${currentRankIdx + 1}</div>
                <div class="pd-bar-bg" style="margin-top: 8px;">
    `;

    if (nextRank) {
        let pdProgress = totalPD - currentRank.pd;
        let pdRequired = nextRank.pd - currentRank.pd;
        let percent = Math.min((pdProgress / pdRequired) * 100, 100);
        html += `
                    <div class="pd-bar-fill" style="width: ${percent}%;"></div>
                    <div class="pd-text">${totalPD} / ${nextRank.pd} ${idiomas[idiomaActual].pdTexto}</div>
        `;
    } else {
        html += `
                    <div class="pd-bar-fill" style="width: 100%;"></div>
                    <div class="pd-text">${idiomas[idiomaActual].rangoMaximo}</div>
        `;
    }

    html += `
                </div>
            </div>
        </div>
    </div>
    <div class="rango-lock-list">
    `;

    const txtDesbloqueado = idiomaActual === 'es' ? '¡Desbloqueado!' : 'Unlocked!';

    // --- 1. MOSTRAR GRADOS DESBLOQUEADOS (A TODO COLOR Y CON CHECK VERDE) ---
    for (let i = 0; i < currentRankIdx; i++) {
        let r = rangosPDData[i];
        html += `
        <div class="rango-lock-item" style="filter: none; opacity: 1; border: 1px solid var(--accent); background: rgba(245, 197, 24, 0.1);">
            <img src="${r.icon}" class="rango-icon-small" alt="Grado ${i+1}">
            <div style="flex-grow: 1; text-align: left;">
                <div style="color: var(--accent); font-weight: 900;">${idiomas[idiomaActual].grado} ${i+1}</div>
                <div style="color: #4caf50; font-size: 0.8rem; font-weight: bold;"><i class="fas fa-check-circle"></i> ${txtDesbloqueado}</div>
            </div>
        </div>
        `;
    }

    // --- 2. MOSTRAR GRADOS BLOQUEADOS (EN GRIS Y CON CANDADO) ---
    for (let i = currentRankIdx + 1; i < rangosPDData.length; i++) {
        let r = rangosPDData[i];
        html += `
        <div class="rango-lock-item">
            <img src="${r.icon}" class="rango-icon-small" alt="Grado ${i+1}">
            <div style="flex-grow: 1; text-align: left;">
                <div style="color: white; font-weight: 900;">${idiomas[idiomaActual].grado} ${i+1}</div>
                <div style="color: #a0a0a0; font-size: 0.8rem;"><i class="fas fa-lock"></i> ${idiomas[idiomaActual].requierePD} ${r.pd} ${idiomas[idiomaActual].pdTexto}</div>
            </div>
        </div>
        `;
    }
    
    html += `</div>`;
    modalScrollContent.innerHTML = html;
}

const btnConfig = document.getElementById('btn-config');
const modalConfig = document.getElementById('modal-config');
const btnCerrarConfig = document.getElementById('btn-cerrar-config');
const sliderMusica = document.getElementById('slider-musica');
const sliderEfectos = document.getElementById('slider-efectos');

const btnEs = document.getElementById('btn-es');
const btnEn = document.getElementById('btn-en');

let tempIdioma = 'es';

function actualizarBotonesIdioma(idioma) {
    btnEs.style.background = idioma === 'es' ? 'var(--accent)' : 'transparent';
    btnEs.style.color = idioma === 'es' ? 'var(--bg-main)' : 'white';
    btnEn.style.background = idioma === 'en' ? 'var(--accent)' : 'transparent';
    btnEn.style.color = idioma === 'en' ? 'var(--bg-main)' : 'white';
}

btnConfig.addEventListener('click', () => {
    tempIdioma = idiomaActual;
    actualizarBotonesIdioma(tempIdioma);
    sliderMusica.value = volumenMusica;
    sliderEfectos.value = volumenEfectos;
    modalConfig.classList.add('mostrar');
});

sliderMusica.addEventListener('input', (e) => {
    if(sonidoAmbiente) sonidoAmbiente.volume = parseFloat(e.target.value);
});

document.getElementById('btn-cerrar-x').addEventListener('click', () => {
    if(sonidoAmbiente) sonidoAmbiente.volume = volumenMusica; 
    modalConfig.classList.remove('mostrar');
});

btnCerrarConfig.addEventListener('click', () => {
    volumenMusica = parseFloat(sliderMusica.value);
    volumenEfectos = parseFloat(sliderEfectos.value);
    if(sonidoAmbiente) sonidoAmbiente.volume = volumenMusica;
    
    if (idiomaActual !== tempIdioma) {
        setIdioma(tempIdioma);
    }
    modalConfig.classList.remove('mostrar');
});

btnEs.addEventListener('click', () => { tempIdioma = 'es'; actualizarBotonesIdioma(tempIdioma); });
btnEn.addEventListener('click', () => { tempIdioma = 'en'; actualizarBotonesIdioma(tempIdioma); });

function setIdioma(idioma) {
    idiomaActual = idioma; 
    actualizarBotonesIdioma(idioma);

    document.getElementById('btn-reiniciar').innerText = idiomas[idioma].reiniciar;
    document.getElementById('titulo-opciones').innerText = idiomas[idioma].opciones;
    
    document.getElementById('txt-idioma-btn').innerHTML = `<i class="fas fa-globe"></i> ` + idiomas[idioma].idiomaBtn;
    document.getElementById('txt-desc-idioma').innerText = idiomas[idioma].descIdioma;
    
    document.getElementById('txt-sonidos-btn').innerHTML = `<i class="fas fa-music"></i> ` + idiomas[idioma].sonidosBtn;
    document.getElementById('txt-desc-sonidos').innerText = idiomas[idioma].descSonidos;
    
    document.getElementById('lbl-musica').innerHTML = idiomas[idioma].musicaLbl;
    document.getElementById('lbl-efectos').innerHTML = idiomas[idioma].efectosLbl;
    document.getElementById('btn-cerrar-config').innerText = idiomas[idioma].cerrarBtn;
    
    document.getElementById('btn-reintentar-modal').innerText = idiomas[idioma].volverBtn;
    document.getElementById('btn-jugar-victoria').innerText = idiomas[idioma].jugarBtn;
    document.getElementById('btn-close-content').innerText = idiomas[idioma].cerrarModalBtn;

    document.getElementById('select-dificultad').options[0].text = idiomas[idioma].optAprendiz;
    document.getElementById('select-dificultad').options[1].text = idiomas[idioma].optGorila;
    document.getElementById('select-dificultad').dispatchEvent(new Event('change'));

    document.getElementById('txt-bananas').innerText = idiomas[idioma].bananasLbl;
    document.getElementById('txt-tablero').innerText = idiomas[idioma].tableroLbl;
    document.getElementById('txt-puntuacion-derrota').innerText = idiomas[idioma].puntuacionLbl;
    document.getElementById('txt-puntuacion-victoria').innerText = idiomas[idioma].puntuacionLbl;
    document.getElementById('btn-config').title = idiomas[idioma].configTitle;
    
    document.getElementById('txt-nivel-lbl').innerText = idiomas[idioma].nivel;
    updateXPUI(); 

    if(contentModal.classList.contains('mostrar')){
        if(modalTitle.innerText === "RANGOS Y GRADOS" || modalTitle.innerText === "RANKS & GRADES" || modalTitle.innerText === "MEJORES RÉCORDS" || modalTitle.innerText === "BEST RECORDS"){
             modalTitle.innerText = idiomas[idioma].modalRecordsTitle; generateRangosHtml();
        } else if (modalTitle.innerText === "ACHIEVEMENTS & MEDALS" || modalTitle.innerText === "LOGROS Y MEDALLAS"){
             modalTitle.innerText = idiomas[idioma].modalLogrosTitle; 
             modalScrollContent.innerHTML = idiomas[idioma].htmlLogros;
             cargarLogros();
        } else {
             modalTitle.innerText = idiomas[idioma].modalGuiaTitle; 
             modalScrollContent.innerHTML = idiomas[idioma].htmlGuia;
        }
    }
}

window.onload = () => {
    setIdioma('es');
    updateXPUI(); 
    updateTopRankIcon(); 
    crearTablero();
};
