// --- 1. CONFIGURACIÓN DE FIREBASE (¡Tus datos reales!) ---
const firebaseConfig = {
    apiKey: "AIzaSyB5EksvFNNwG6b1lruInOk95Bc8-ghiaF0",
    authDomain: "monkey-banana-90817.firebaseapp.com",
    projectId: "monkey-banana-90817",
    storageBucket: "monkey-banana-90817.firebasestorage.app",
    messagingSenderId: "633443523746",
    appId: "1:633443523746:web:b1101928dec073d34b0bfb"
};

// Inicializa Firebase de forma segura (si hay error de config, no rompe el juego local)
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (e) {
    console.log("Firebase no configurado aún. Funcionando en modo local.");
}
// ------------------------------------------------------------------------------------------------

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
    { pd: 0, icon: "img/ramg_plata01.png" }, { pd: 1000, icon: "img/ramg_plata02.png" }, { pd: 3000, icon: "img/ramg_plata03.png" },
    { pd: 6000, icon: "img/ramg_plata04.png" }, { pd: 10000, icon: "img/ramg_plata05.png" }, { pd: 15000, icon: "img/ramg_plata06.png" },
    { pd: 22000, icon: "img/ramg_plata07.png" }, { pd: 30000, icon: "img/ramg_plata08.png" }, { pd: 40000, icon: "img/ramg_plata09.png" },
    { pd: 55000, icon: "img/ramg_plata10.png" }, { pd: 75000, icon: "img/ramg_oro01.png" }, { pd: 100000, icon: "img/ramg_oro02.png" },
    { pd: 130000, icon: "img/ramg_oro03.png" }, { pd: 165000, icon: "img/ramg_oro04.png" }, { pd: 205000, icon: "img/ramg_oro05.png" },
    { pd: 250000, icon: "img/ramg_oro06.png" }, { pd: 300000, icon: "img/ramg_oro07.png" }, { pd: 360000, icon: "img/ramg_oro08.png" },
    { pd: 430000, icon: "img/ramg_oro09.png" }, { pd: 510000, icon: "img/ramg_oro10.png" }, { pd: 600000, icon: "img/ramg_emeralda01.png" },
    { pd: 700000, icon: "img/ramg_emeralda02.png" }, { pd: 810000, icon: "img/ramg_emeralda03.png" }, { pd: 930000, icon: "img/ramg_emeralda04.png" },
    { pd: 1060000, icon: "img/ramg_emeralda05.png" }, { pd: 1200000, icon: "img/ramg_emeralda06.png" }, { pd: 1350000, icon: "img/ramg_emeralda07.png" },
    { pd: 1510000, icon: "img/ramg_emeralda08.png" }, { pd: 1680000, icon: "img/ramg_emeralda09.png" }, { pd: 2000000, icon: "img/ramg_emeralda10.png" }
];

function updateTopRankIcon() {
    let currentRankIdx = 0;
    for (let i = 0; i < rangosPDData.length; i++) {
        if (totalPD >= rangosPDData[i].pd) { currentRankIdx = i; } else { break; }
    }
    document.getElementById('icono-rango-top').src = rangosPDData[currentRankIdx].icon;
    return rangosPDData[currentRankIdx].icon;
}

function addPD(amount) {
    totalPD += amount;
    localStorage.setItem('monkey_pd', totalPD);
    const currentIcon = updateTopRankIcon(); 
    
    // Si el jugador está registrado, actualizamos su puntaje en la nube silenciosamente al ganar
    if (nombreJugador && db) {
        db.collection("leaderboard").doc(nombreJugador).set({
            nombre: nombreJugador,
            pd: totalPD,
            icon: currentIcon,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(e => console.log("Error sync:", e));
    }
}

// --- LÓGICA DE CLASIFICACIÓN GLOBAL (CONEXIÓN REAL A LA NUBE) ---
let nombreJugador = localStorage.getItem('monkey_player_name') || "";

function generateGlobalRankHtml(forceEdit = false) {
    if (!nombreJugador || forceEdit) {
        modalScrollContent.innerHTML = `
            <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 15px; border: 1px solid var(--accent); text-align: center;">
                <i class="fas fa-globe-americas" style="font-size: 2.5rem; color: var(--accent); margin-bottom: 15px;"></i>
                <p style="margin-bottom: 20px; font-size: 0.9rem; color: white; line-height: 1.4;">
                    ${idiomas[idiomaActual].msgBienvenida} <br>
                    <span style="opacity: 0.7; font-size: 0.8rem;">Registra tu nombre para guardar tus récords en la nube y competir con otros jugadores.</span>
                </p>
                
                <div style="text-align: left; margin-bottom: 20px;">
                    <label style="display:block; margin-bottom: 8px; color: var(--accent); font-weight: 900; font-size: 0.85rem;">
                        <i class="fas fa-user-astronaut"></i> ${idiomas[idiomaActual].labelNombre}
                    </label>
                    <input type="text" id="input-player-name" maxlength="12" value="${nombreJugador}"
                           style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.1); 
                                  background: rgba(0,0,0,0.5); color: white; font-family: 'Nunito', sans-serif; font-weight: 900; 
                                  font-size: 1rem; outline: none; transition: border-color 0.3s;" 
                           placeholder="Ej: Explorador123" autocomplete="off">
                </div>

                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; margin-bottom: 20px; text-align: left; border-left: 3px solid var(--accent);">
                    <p style="font-size: 0.75rem; color: white; margin-bottom: 5px;"><strong>Tus datos locales actuales:</strong></p>
                    <p style="font-size: 0.75rem; color: #a0a0a0;">Grado actual: <span style="color:white; font-weight:bold;">${totalPD} PD</span></p>
                </div>

                <div style="display: flex; gap: 10px;">
                    ${forceEdit ? `
                    <button id="btn-cancel-profile" 
                            style="flex: 1; padding: 15px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 12px; 
                                   font-weight: 900; font-size: 1rem; cursor: pointer; transition: all 0.2s;">
                        <i class="fas fa-times"></i> ${idiomas[idiomaActual].btnCancelar}
                    </button>` : ''}
                    <button id="btn-save-profile" 
                            style="flex: ${forceEdit ? '1' : '100%'}; padding: 15px; background: linear-gradient(180deg, #f5c518 0%, #e2b300 100%); 
                                   color: #1a1a2e; border: none; border-radius: 12px; font-weight: 900; font-size: 1rem;
                                   cursor: pointer; box-shadow: 0 5px 0 #b38f00; transition: all 0.2s;">
                        <i class="fas fa-save"></i> ${idiomas[idiomaActual].btnGuardarPerfil}
                    </button>
                </div>
            </div>
        `;

        const inputNombre = document.getElementById('input-player-name');
        inputNombre.addEventListener('focus', () => inputNombre.style.borderColor = 'var(--accent)');
        inputNombre.addEventListener('blur', () => inputNombre.style.borderColor = 'rgba(255,255,255,0.1)');

        if (forceEdit) {
            document.getElementById('btn-cancel-profile').onclick = function() {
                modalTitle.innerText = idiomas[idiomaActual].modalGlobalTitle;
                generateGlobalRankHtml(false);
            };
        }

        document.getElementById('btn-save-profile').onclick = async function() {
            let val = inputNombre.value.trim();
            if (val.length >= 3) {
                if (!db) {
                    alert("Firebase no está configurado correctamente.");
                    return;
                }
                
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
                this.style.pointerEvents = 'none';
                
                try {
                    const currentIcon = updateTopRankIcon();
                    // Guardar/Actualizar en Firebase
                    await db.collection("leaderboard").doc(val).set({
                        nombre: val,
                        pd: totalPD,
                        icon: currentIcon,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });

                    nombreJugador = val;
                    localStorage.setItem('monkey_player_name', nombreJugador);
                    modalTitle.innerText = idiomas[idiomaActual].modalGlobalTitle;
                    generateGlobalRankHtml(false); 
                } catch (error) {
                    console.error("Error conectando a Firebase:", error);
                    alert("Error al conectar con la base de datos. Verifica tus reglas de Firestore.");
                    this.innerHTML = `<i class="fas fa-save"></i> ${idiomas[idiomaActual].btnGuardarPerfil}`;
                    this.style.pointerEvents = 'auto';
                }
            } else {
                inputNombre.style.borderColor = '#ff4d4d';
                inputNombre.classList.add('animate__animated', 'animate__headShake');
                setTimeout(() => inputNombre.classList.remove('animate__animated', 'animate__headShake'), 500);
            }
        };
    } else {
        // Pantalla 2: Tabla de Clasificación Global Real de Firestore
        modalScrollContent.innerHTML = `
            <div style="text-align:center; padding: 40px; color: var(--accent);">
                <i class="fas fa-spinner fa-spin fa-3x"></i>
                <p style="margin-top:15px; font-weight:900;">Descargando datos de la nube...</p>
            </div>
        `;

        if (!db) {
            modalScrollContent.innerHTML = `<p style="color:#ff4d4d; text-align:center; font-weight:bold; padding: 20px;">Error interno: Firebase no conectado.</p>`;
            return;
        }

        // Descargar los 10 mejores jugadores de la base de datos
        db.collection("leaderboard").orderBy("pd", "desc").limit(10).get().then((querySnapshot) => {
            let leaderboard = [];
            querySnapshot.forEach((doc) => {
                leaderboard.push(doc.data());
            });

            // Si por alguna razón el usuario local tiene más puntos pero no se ha subido por falta de internet, lo forzamos a estar en la lista localmente
            const userInList = leaderboard.find(p => p.nombre === nombreJugador);
            if (userInList) { userInList.pd = Math.max(userInList.pd, totalPD); } 
            else if (leaderboard.length < 10 || totalPD > leaderboard[leaderboard.length - 1].pd) {
                leaderboard.push({ nombre: nombreJugador, icon: updateTopRankIcon(), pd: totalPD });
            }
            
            leaderboard.sort((a, b) => b.pd - a.pd);

            let tbodyHtml = '';
            leaderboard.slice(0, 10).forEach((player, index) => {
                let isTop1 = index === 0;
                let isUser = player.nombre === nombreJugador;
                let rowStyle = '';
                
                if (isTop1) {
                    rowStyle = 'background: linear-gradient(90deg, rgba(255, 202, 40, 0.3) 0%, rgba(0,0,0,0) 100%); border-left: 4px solid #ffca28; font-size: 0.9rem;';
                } else if (isUser) {
                    rowStyle = 'background: rgba(255, 255, 255, 0.1); border-left: 2px solid #a0a0a0;';
                }
                
                let nameDisplay = isUser ? `${player.nombre} (Tú)` : player.nombre;
                let fontWeight = isUser ? 'font-weight:bold;' : '';
                let textColor = isTop1 ? 'color: #ffca28; font-weight: 900;' : '';
                let rankNum = isTop1 ? '<i class="fas fa-crown" style="color:#ffca28; font-size:1.2rem; filter:drop-shadow(0 2px 2px rgba(0,0,0,0.5));"></i>' : index + 1;
                
                tbodyHtml += `
                    <tr style="${rowStyle}">
                        <td class="rank-pos" style="text-align:center;">${rankNum}</td>
                        <td style="${isTop1 ? 'font-weight:900;' : ''}">${nameDisplay}</td>
                        <td><img src="${player.icon}" class="rank-badge-img"></td>
                        <td style="${fontWeight} ${textColor}">${player.pd.toLocaleString()}</td>
                    </tr>
                `;
            });

            if (leaderboard.length === 0) {
                tbodyHtml = `<tr><td colspan="4" style="text-align:center; padding: 20px; opacity: 0.7;">No hay registros globales todavía. ¡Sé el primero!</td></tr>`;
            }

            modalScrollContent.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 10px;">
                    <div style="font-size: 0.85rem;">
                        <span style="opacity:0.7">Jugador:</span> <strong style="color:var(--accent)">${nombreJugador}</strong>
                    </div>
                    <button id="btn-edit-profile" style="background: transparent; border: none; color: white; cursor: pointer; font-size: 0.85rem; opacity: 0.7;">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>

                <table class="tabla-global">
                    <thead>
                        <tr><th style="text-align:center;">#</th><th>${idiomas[idiomaActual].thJugador}</th><th>${idiomas[idiomaActual].thGrado}</th><th>${idiomas[idiomaActual].pdTexto}</th></tr>
                    </thead>
                    <tbody>
                        ${tbodyHtml}
                    </tbody>
                </table>
                <p style="font-size:0.7rem; margin-top:15px; opacity:0.6; text-align:center; color: #4caf50;"><i class="fas fa-check-circle"></i> Sincronizado con la nube global.</p>
            `;

            document.getElementById('btn-edit-profile').onclick = () => {
                modalTitle.innerText = idiomas[idiomaActual].configPerfilTitle;
                generateGlobalRankHtml(true); 
            };
        }).catch((error) => {
            modalScrollContent.innerHTML = `<p style="color:#ff4d4d; text-align:center; padding:20px;">Error de red: No se pudo descargar la tabla global. Intenta más tarde.</p>`;
            console.log("Firestore error:", error);
        });
    }
}
// -------------------------------------------------------------

function cargarLogros() {
    let logros = JSON.parse(localStorage.getItem('monkey_logros')) || { primerPaso: false, aprendizVeloz: false, velocista: false, purista: false, locura: false };
    const iconoPP = document.getElementById('icono-primer-paso'), iconoAV = document.getElementById('icono-aprendiz-veloz'), iconoVE = document.getElementById('icono-velocista'), iconoPU = document.getElementById('icono-purista'), iconoLO = document.getElementById('icono-locura');
    if (iconoPP) iconoPP.style.color = logros.primerPaso ? '#f5c518' : '#a0a0a0';
    if (iconoAV) iconoAV.style.color = logros.aprendizVeloz ? '#f5c518' : '#a0a0a0';
    if (iconoVE) iconoVE.style.color = logros.velocista ? '#f5c518' : '#a0a0a0';
    if (iconoPU) iconoPU.style.color = logros.purista ? '#f5c518' : '#a0a0a0';
    if (iconoLO) iconoLO.style.color = logros.locura ? '#f5c518' : '#a0a0a0';
}

function evaluarLogros() {
    let logros = JSON.parse(localStorage.getItem('monkey_logros')) || { primerPaso: false, aprendizVeloz: false, velocista: false, purista: false, locura: false };
    let numMinas = parseInt(inputMinas.value), nuevo = false;
    if (tamanoGrid === 8 && !logros.primerPaso) { logros.primerPaso = true; nuevo = true; }
    if (tamanoGrid === 8 && tiempo < 30 && !logros.aprendizVeloz) { logros.aprendizVeloz = true; nuevo = true; }
    if (tamanoGrid === 10 && tiempo < 40 && !logros.velocista) { logros.velocista = true; nuevo = true; }
    if (!usoBandera && !logros.purista) { logros.purista = true; nuevo = true; }
    if (tamanoGrid === 10 && numMinas > 50 && !logros.locura) { logros.locura = true; nuevo = true; }
    if (nuevo) { localStorage.setItem('monkey_logros', JSON.stringify(logros)); cargarLogros(); }
}

document.getElementById('select-dificultad').addEventListener('change', function() {
    const nuevoTamano = parseInt(this.value), textoLimites = document.getElementById('texto-limites');
    if (nuevoTamano === 8) { inputMinas.min = 10; inputMinas.value = 10; textoLimites.innerText = idiomas[idiomaActual].limiteAprendiz; } 
    else if (nuevoTamano === 10) { inputMinas.min = 15; inputMinas.value = 15; textoLimites.innerText = idiomas[idiomaActual].limiteGorila; }
});

function crearTablero() {
    document.getElementById('modal-derrota').classList.remove('mostrar'); document.getElementById('modal-victoria').classList.remove('mostrar'); 
    tamanoGrid = parseInt(document.getElementById('select-dificultad').value) || 10;
    let totalCeldas = tamanoGrid * tamanoGrid;
    tableroElemento.style.setProperty('grid-template-columns', `repeat(${tamanoGrid}, 1fr)`, 'important');
    let numMinas = parseInt(inputMinas.value) || 15, minRequerido = parseInt(inputMinas.min) || 15; 
    inputMinas.max = totalCeldas - 1;
    if (numMinas < minRequerido) { numMinas = minRequerido; inputMinas.value = numMinas; } 
    else if (numMinas >= totalCeldas) { numMinas = Math.floor(totalCeldas / 4); inputMinas.value = numMinas; }
    tableroElemento.innerHTML = ''; celdasCache = []; juegoTerminado = false; primerClic = true; puntaje = 0; puntosElemento.innerText = '0'; usoBandera = false; 
    clearInterval(intervaloTiempo); tiempo = 0; timerElemento.innerText = '0';
    celdasPorRevelar = totalCeldas - numMinas; 
    mapaReal = [...Array(numMinas).fill('mina'), ...Array(totalCeldas - numMinas).fill('vacio')].sort(() => Math.random() - 0.5);
    if(sonidoAmbiente) { sonidoAmbiente.pause(); sonidoAmbiente.currentTime = 0; }

    for (let i = 0; i < totalCeldas; i++) {
        const celda = document.createElement('div'); celda.classList.add('celda'); celda.dataset.id = i;
        let tiempoPresionado, esPulsacionLarga = false, movioElDedo = false;
        const alternarBandera = () => {
            if (juegoTerminado || celda.classList.contains('revelada')) return;
            if (celda.innerHTML === '') { celda.innerHTML = '<i class="fas fa-flag"></i>'; usoBandera = true; } 
            else if (celda.querySelector('.fa-flag')) { celda.innerHTML = '<i class="fas fa-question" style="color:white"></i>'; } 
            else { celda.innerHTML = ''; }
        };
        celda.addEventListener('contextmenu', (e) => { e.preventDefault(); alternarBandera(); });
        celda.addEventListener('touchstart', (e) => {
            if (juegoTerminado || celda.classList.contains('revelada')) return;
            esPulsacionLarga = false; movioElDedo = false;
            tiempoPresionado = setTimeout(() => { if (!movioElDedo) { esPulsacionLarga = true; alternarBandera(); if (navigator.vibrate) navigator.vibrate(50); } }, 400); 
        });
        celda.addEventListener('touchmove', () => { movioElDedo = true; clearTimeout(tiempoPresionado); });
        celda.addEventListener('touchend', (e) => { clearTimeout(tiempoPresionado); if (esPulsacionLarga) e.preventDefault(); });
        celda.addEventListener('click', (e) => {
            if (esPulsacionLarga) return; 
            if (primerClic && !juegoTerminado) { 
                intervaloTiempo = setInterval(() => { tiempo++; timerElemento.innerText = tiempo; }, 1000);
                if(sonidoAmbiente) { sonidoAmbiente.volume = volumenMusica; sonidoAmbiente.play().catch(()=>{}); }
                primerClic = false; 
            }
            revelarCelda(celda);
        });
        tableroElemento.appendChild(celda); celdasCache.push(celda);
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
        gameContainer.classList.add('shake-screen'); setTimeout(() => gameContainer.classList.remove('shake-screen'), 500); 
        celdasCache.forEach((c, idx) => { if(mapaReal[idx] === 'mina') { c.innerHTML = ''; c.classList.add('revelada', 'bomba-revelada'); } });
        let totalCeldas = tamanoGrid * tamanoGrid, numMinas = parseInt(inputMinas.value), celdasReveladas = (totalCeldas - numMinas) - celdasPorRevelar, xpGanada = celdasReveladas * 5; 
        addXP(xpGanada); document.getElementById('xp-ganada-derrota').innerText = Math.floor(xpGanada);
        setTimeout(() => { document.getElementById('puntuacion-final').innerText = puntaje; document.getElementById('modal-derrota').classList.add('mostrar'); }, 600);
    } else {
        if(sonidoRevelar) { sonidoRevelar.volume = 0.2 * volumenEfectos; sonidoRevelar.play().catch(()=>{}); }
        celda.classList.add('revelada'); celdasPorRevelar--; puntaje += 100; puntosElemento.innerText = puntaje;
        const m = contarVecinos(id); if (m > 0) { celda.innerText = m; celda.classList.add('numero-' + m); } else { expandir(id); }
        if (celdasPorRevelar === 0) {
            clearInterval(intervaloTiempo); juegoTerminado = true;
            if(sonidoAmbiente) sonidoAmbiente.pause(); 
            if(sonidoVictoria) { sonidoVictoria.volume = 1.0 * volumenEfectos; sonidoVictoria.play().catch(()=>{}); }
            let numMinas = parseInt(inputMinas.value), xpGanada = (numMinas * 30) + Math.max(0, 800 - (tiempo * 2));
            addXP(xpGanada); addPD(puntaje);  
            document.getElementById('xp-ganada-victoria').innerText = Math.floor(xpGanada);
            evaluarLogros(); 
            if (typeof confetti === 'function') { confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, zIndex: 2000 }); }
            setTimeout(() => { document.getElementById('puntuacion-final-victoria').innerText = puntaje; document.getElementById('modal-victoria').classList.add('mostrar'); }, 600);
        }
    }
}

function contarVecinos(id) {
    let m = 0; const f = Math.floor(id/tamanoGrid), c = id%tamanoGrid;
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) {
        const nf=f+i, nc=c+j; if(nf>=0 && nf<tamanoGrid && nc>=0 && nc<tamanoGrid && mapaReal[nf*tamanoGrid+nc] === 'mina') m++;
    } return m;
}

function expandir(id) {
    const f = Math.floor(id/tamanoGrid), c = id%tamanoGrid;
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) {
        const nf=f+i, nc=c+j; if(nf>=0 && nf<tamanoGrid && nc>=0 && nc<tamanoGrid) {
            const v = celdasCache[nf*tamanoGrid+nc]; if (!v.classList.contains('revelada')) { setTimeout(() => revelarCelda(v), 60); }
        }
    }
}

document.getElementById('btn-reiniciar').addEventListener('click', function() { this.classList.add('animacion-moderna'); crearTablero(); setTimeout(() => this.classList.remove('animacion-moderna'), 400); });
document.getElementById('btn-reintentar-modal').addEventListener('click', function() { this.classList.add('animacion-moderna'); setTimeout(() => { this.classList.remove('animacion-moderna'); crearTablero(); }, 400); });
document.getElementById('btn-jugar-victoria').addEventListener('click', function() { this.classList.add('animacion-moderna'); setTimeout(() => { this.classList.remove('animacion-moderna'); crearTablero(); }, 400); });

const contentModal = document.getElementById('contentModal'), modalTitle = document.getElementById('modalTitle'), modalScrollContent = document.getElementById('modalScrollContent');
function openContentModal(title) { modalTitle.innerText = title; modalScrollContent.scrollTop = 0; contentModal.classList.add('mostrar'); }
function closeContentModal() { contentModal.classList.remove('mostrar'); }
document.getElementById('btn-close-content-x').addEventListener('click', closeContentModal);
document.getElementById('btn-close-content').addEventListener('click', closeContentModal);

document.getElementById('btnclasificacion').addEventListener('click', () => {
    openContentModal(nombreJugador ? idiomas[idiomaActual].modalGlobalTitle : idiomas[idiomaActual].configPerfilTitle);
    generateGlobalRankHtml();
});
document.getElementById('btnrecors').addEventListener('click', () => { openContentModal(idiomas[idiomaActual].modalRecordsTitle); generateRangosHtml(); });
document.getElementById('btnlogros').addEventListener('click', () => { openContentModal(idiomas[idiomaActual].modalLogrosTitle); modalScrollContent.innerHTML = idiomas[idiomaActual].htmlLogros; cargarLogros(); });
document.getElementById('btnguia').addEventListener('click', () => { openContentModal(idiomas[idiomaActual].modalGuiaTitle); modalScrollContent.innerHTML = idiomas[idiomaActual].htmlGuia; });

function generateRangosHtml() {
    let currentRankIdx = 0; for (let i = 0; i < rangosPDData.length; i++) { if (totalPD >= rangosPDData[i].pd) { currentRankIdx = i; } else { break; } }
    let currentRank = rangosPDData[currentRankIdx], nextRank = rangosPDData[currentRankIdx + 1], html = '';
    html += `<div class="rango-actual-box"><h3 style="color: var(--accent); margin-bottom: 10px; font-size: 1.1rem;">${idiomas[idiomaActual].gradoActual}</h3><div style="display: flex; align-items: center; gap: 15px;"><img src="${currentRank.icon}" class="rango-icon-main" alt="Rango Actual"><div style="flex-grow: 1; text-align: left;"><div style="color: white; font-weight: 900; font-size: 1.2rem;">${idiomas[idiomaActual].grado} ${currentRankIdx + 1}</div><div class="pd-bar-bg" style="margin-top: 8px;">`;
    if (nextRank) { let pdProgress = totalPD - currentRank.pd, pdRequired = nextRank.pd - currentRank.pd, percent = Math.min((pdProgress / pdRequired) * 100, 100); html += `<div class="pd-bar-fill" style="width: ${percent}%;"></div><div class="pd-text">${totalPD} / ${nextRank.pd} ${idiomas[idiomaActual].pdTexto}</div>`; } 
    else { html += `<div class="pd-bar-fill" style="width: 100%;"></div><div class="pd-text">${idiomas[idiomaActual].rangoMaximo}</div>`; }
    html += `</div></div></div></div><div class="rango-lock-list">`;
    const txtDes = idiomaActual === 'es' ? '¡Desbloqueado!' : 'Unlocked!';
    for (let i = 0; i < currentRankIdx; i++) { html += `<div class="rango-lock-item" style="filter: none; opacity: 1; border: 1px solid var(--accent); background: rgba(245, 197, 24, 0.1);"><img src="${rangosPDData[i].icon}" class="rango-icon-small"><div style="flex-grow: 1; text-align: left;"><div style="color: var(--accent); font-weight: 900;">${idiomas[idiomaActual].grado} ${i+1}</div><div style="color: #4caf50; font-size: 0.8rem; font-weight: bold;"><i class="fas fa-check-circle"></i> ${txtDes}</div></div></div>`; }
    for (let i = currentRankIdx + 1; i < rangosPDData.length; i++) { html += `<div class="rango-lock-item"><img src="${rangosPDData[i].icon}" class="rango-icon-small"><div style="flex-grow: 1; text-align: left;"><div style="color: white; font-weight: 900;">${idiomas[idiomaActual].grado} ${i+1}</div><div style="color: #a0a0a0; font-size: 0.8rem;"><i class="fas fa-lock"></i> ${idiomas[idiomaActual].requierePD} ${rangosPDData[i].pd} ${idiomas[idiomaActual].pdTexto}</div></div></div>`; }
    html += `</div>`; modalScrollContent.innerHTML = html;
}

const btnConfig = document.getElementById('btn-config'), modalConfig = document.getElementById('modal-config'), btnCerrarConfig = document.getElementById('btn-cerrar-config'), sliderMusica = document.getElementById('slider-musica'), sliderEfectos = document.getElementById('slider-efectos'), btnEs = document.getElementById('btn-es'), btnEn = document.getElementById('btn-en');
let tempIdioma = 'es';
function actualizarBotonesIdioma(idioma) { btnEs.style.background = idioma === 'es' ? 'var(--accent)' : 'transparent'; btnEs.style.color = idioma === 'es' ? 'var(--bg-main)' : 'white'; btnEn.style.background = idioma === 'en' ? 'var(--accent)' : 'transparent'; btnEn.style.color = idioma === 'en' ? 'var(--bg-main)' : 'white'; }
btnConfig.addEventListener('click', () => { tempIdioma = idiomaActual; actualizarBotonesIdioma(tempIdioma); sliderMusica.value = volumenMusica; sliderEfectos.value = volumenEfectos; modalConfig.classList.add('mostrar'); });
sliderMusica.addEventListener('input', (e) => { if(sonidoAmbiente) sonidoAmbiente.volume = parseFloat(e.target.value); });
document.getElementById('btn-cerrar-x').addEventListener('click', () => { if(sonidoAmbiente) sonidoAmbiente.volume = volumenMusica; modalConfig.classList.remove('mostrar'); });
btnCerrarConfig.addEventListener('click', () => { volumenMusica = parseFloat(sliderMusica.value); volumenEfectos = parseFloat(sliderEfectos.value); if(sonidoAmbiente) sonidoAmbiente.volume = volumenMusica; if (idiomaActual !== tempIdioma) { setIdioma(tempIdioma); } modalConfig.classList.remove('mostrar'); });
btnEs.addEventListener('click', () => { tempIdioma = 'es'; actualizarBotonesIdioma(tempIdioma); });
btnEn.addEventListener('click', () => { tempIdioma = 'en'; actualizarBotonesIdioma(tempIdioma); });

function setIdioma(idioma) {
    idiomaActual = idioma; actualizarBotonesIdioma(idioma);
    document.getElementById('btn-reiniciar').innerText = idiomas[idioma].reiniciar; document.getElementById('titulo-opciones').innerText = idiomas[idioma].opciones;
    document.getElementById('txt-idioma-btn').innerHTML = `<i class="fas fa-globe"></i> ` + idiomas[idioma].idiomaBtn; document.getElementById('txt-desc-idioma').innerText = idiomas[idioma].descIdioma;
    document.getElementById('txt-sonidos-btn').innerHTML = `<i class="fas fa-music"></i> ` + idiomas[idioma].sonidosBtn; document.getElementById('txt-desc-sonidos').innerText = idiomas[idioma].descSonidos;
    document.getElementById('lbl-musica').innerHTML = idiomas[idioma].musicaLbl; document.getElementById('lbl-efectos').innerHTML = idiomas[idioma].efectosLbl; document.getElementById('btn-cerrar-config').innerText = idiomas[idioma].cerrarBtn;
    document.getElementById('btn-reintentar-modal').innerText = idiomas[idioma].volverBtn; document.getElementById('btn-jugar-victoria').innerText = idiomas[idioma].jugarBtn; document.getElementById('btn-close-content').innerText = idiomas[idioma].cerrarModalBtn;
    document.getElementById('select-dificultad').options[0].text = idiomas[idioma].optAprendiz; document.getElementById('select-dificultad').options[1].text = idiomas[idioma].optGorila;
    document.getElementById('select-dificultad').dispatchEvent(new Event('change'));
    document.getElementById('txt-bananas').innerText = idiomas[idioma].bananasLbl; document.getElementById('txt-tablero').innerText = idiomas[idioma].tableroLbl;
    document.getElementById('txt-puntuacion-derrota').innerText = idiomas[idioma].puntuacionLbl; document.getElementById('txt-puntuacion-victoria').innerText = idiomas[idioma].puntuacionLbl; document.getElementById('btn-config').title = idiomas[idioma].configTitle;
    document.getElementById('txt-nivel-lbl').innerText = idiomas[idioma].nivel; updateXPUI(); 
    
    if(contentModal.classList.contains('mostrar')){
        if(modalTitle.innerText.includes("RANGOS") || modalTitle.innerText.includes("RANKS")){ 
            modalTitle.innerText = idiomas[idioma].modalRecordsTitle; generateRangosHtml(); 
        } 
        else if (modalTitle.innerText.includes("LOGROS") || modalTitle.innerText.includes("ACHIEVEMENTS")){ 
            modalTitle.innerText = idiomas[idioma].modalLogrosTitle; modalScrollContent.innerHTML = idiomas[idioma].htmlLogros; cargarLogros(); 
        } 
        else if (modalTitle.innerText.includes("TOP 10") || modalTitle.innerText.includes("PERFIL") || modalTitle.innerText.includes("PROFILE") || modalTitle.innerText.includes("SETUP")){ 
            let isEditing = document.getElementById('input-player-name') !== null;
            modalTitle.innerText = (!nombreJugador || isEditing) ? idiomas[idioma].configPerfilTitle : idiomas[idioma].modalGlobalTitle; 
            generateGlobalRankHtml(isEditing); 
        }
        else { 
            modalTitle.innerText = idiomas[idioma].modalGuiaTitle; modalScrollContent.innerHTML = idiomas[idioma].htmlGuia; 
        }
    }
}
window.onload = () => { setIdioma('es'); updateXPUI(); updateTopRankIcon(); crearTablero(); };
