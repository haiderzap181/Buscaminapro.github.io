// --- DICCIONARIO DE IDIOMAS ---
const idiomas = {
    es: {
        optAprendiz: "Mono Aprendiz (8x8)",
        optGorila: "Gorila Plateado (10x10)",
        limiteAprendiz: "Límites: 10 a 63 bananas",
        limiteGorila: "Límites: 15 a 99 bananas",
        reiniciar: "REINICIAR PARTIDA",
        opciones: "Opciones",
        idiomaBtn: "Idioma / Language",
        sonidosBtn: "Sonidos",
        musicaLbl: '<i class="fas fa-headphones"></i> Música General',
        efectosLbl: '<i class="fas fa-volume-up"></i> Efectos Especiales',
        cerrarBtn: "GUARDAR Y CERRAR",
        recordsBtn: '<i class="fas fa-medal"></i> Mejores Récords <i class="fas fa-chevron-down icon-arrow"></i>',
        logrosBtn: '<i class="fas fa-award"></i> Logros y Medallas <i class="fas fa-chevron-down icon-arrow"></i>',
        guiaBtn: '<i class="fas fa-book-open"></i> Guía del Explorador <i class="fas fa-chevron-down icon-arrow"></i>',
        volverBtn: "VOLVER A INTENTAR",
        jugarBtn: "JUGAR DE NUEVO",
        
        thPuntos: "Puntos",
        thTiempo: "Tiempo",
        thBananas: "Bananas",
        thRango: "Rango",
        sinRecords: "Sin récords aún",
        borrarBtn: '<i class="fas fa-trash-alt"></i> Restablecer Récords',
        alertaBorrar: '¿Estás seguro de que deseas restablecer todos los récords y logros? Esta acción no se puede deshacer.',

        bananasLbl: "Bananas:",
        tableroLbl: "Tablero:",
        puntuacionLbl: "Puntuación:",
        configTitle: "Configuración",
        muteTitle: "Música Ambiente",
        
        // NUEVO: Descripciones para el menú de configuración
        descIdioma: "Selecciona el idioma del juego.",
        descSonidos: "Ajusta el volumen a tu gusto.",
        
        htmlLogros: `
            <div class="instruccion-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i id="icono-primer-paso" class="fas fa-leaf" style="font-size: 1.5rem; color: #a0a0a0; transition: color 0.5s;"></i>
                    <div>
                        <p><strong>Primeros Pasos</strong></p>
                        <p style="font-size: 0.8rem; opacity: 0.8;">Gana tu primera partida en el tablero Mono Aprendiz.</p>
                    </div>
                </div>
            </div>
            <div class="instruccion-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i id="icono-aprendiz-veloz" class="fas fa-running" style="font-size: 1.5rem; color: #a0a0a0; transition: color 0.5s;"></i>
                    <div>
                        <p><strong>Aprendiz Veloz</strong></p>
                        <p style="font-size: 0.8rem; opacity: 0.8;">Gana en Mono Aprendiz en menos de 30 segundos.</p>
                    </div>
                </div>
            </div>
            <div class="instruccion-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i id="icono-velocista" class="fas fa-bolt" style="font-size: 1.5rem; color: #a0a0a0; transition: color 0.5s;"></i>
                    <div>
                        <p><strong>Velocista Plateado</strong></p>
                        <p style="font-size: 0.8rem; opacity: 0.8;">Gana una partida en Gorila Plateado en menos de 40 segundos.</p>
                    </div>
                </div>
            </div>
            <div class="instruccion-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i id="icono-purista" class="fas fa-flag-checkered" style="font-size: 1.5rem; color: #a0a0a0; transition: color 0.5s;"></i>
                    <div>
                        <p><strong>Purista Extremo</strong></p>
                        <p style="font-size: 0.8rem; opacity: 0.8;">Gana una partida sin colocar ni una sola bandera (clic derecho).</p>
                    </div>
                </div>
            </div>
            <div class="instruccion-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i id="icono-locura" class="fas fa-skull-crossbones" style="font-size: 1.5rem; color: #a0a0a0; transition: color 0.5s;"></i>
                    <div>
                        <p><strong>Locura Tropical</strong></p>
                        <p style="font-size: 0.8rem; opacity: 0.8;">Gana una partida en Gorila Plateado con más de 50 bananas.</p>
                    </div>
                </div>
            </div>
        `,

        htmlGuia: `
            <div class="instruccion-item">
                <p><strong><i class="fas fa-star"></i> Sistema de Rangos:</strong></p>
                <p>¡Los rangos ahora se adaptan a la dificultad del tablero!</p>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="img/rango03.png" class="icono-rango" alt="Rango Épico">
                        <span style="font-size: 0.8rem;"><strong>Épico:</strong> <br>Gorila (10x10): 30+ bananas o 20+ en &le; 60s.<br>Aprendiz (8x8): 25+ bananas o 15+ en &le; 40s.</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="img/rango02.png" class="icono-rango" alt="Rango Avanzado">
                        <span style="font-size: 0.8rem;"><strong>Avanzado:</strong> <br>Gorila (10x10): 20+ bananas o 15+ en &le; 90s.<br>Aprendiz (8x8): 15+ bananas o 10+ en &le; 60s.</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="img/rango01.png" class="icono-rango" alt="Rango Básico">
                        <span style="font-size: 0.8rem;"><strong>Explorador:</strong> Supera cualquier otro desafío estándar en tu tablero.</span>
                    </div>
                </div>
            </div>
            <div class="instruccion-item">
                <p><strong><i class="fas fa-sliders-h"></i> Límites de Dificultad:</strong></p>
                <p>Puedes personalizar la cantidad de bananas, pero cada tablero tiene sus límites para mantener el reto:</p>
                <ul style="margin-left: 25px; margin-top: 8px; font-size: 0.8rem; line-height: 1.6;">
                    <li><strong>Mono Aprendiz (8x8):</strong> De 10 a 63 bananas.</li>
                    <li><strong>Gorila Plateado (10x10):</strong> De 15 a 99 bananas.</li>
                </ul>
            </div>
            <div class="instruccion-item">
                <p><strong><i class="fas fa-sort-numeric-up"></i> El Secreto de los Números:</strong></p>
                <p>Cada número indica exactamente cuántas bananas 🍌 hay ocultas en las 8 casillas vecinas. <br><br><em>Tip: Si ves un "1" y solo hay una casilla sin revelar tocándolo, ¡esa casilla es una banana segura!</em></p>
                <div class="guia-colores"><span class="numero-1">1</span> | <span class="numero-2">2</span> | <span class="numero-3">3</span></div>
            </div>
            <div class="instruccion-item">
                <p><strong><i class="fas fa-mobile-alt"></i> ¿Juegas en celular?</strong> En lugar de hacer clic derecho, <strong>mantén presionada</strong> la casilla durante un segundo para colocar marcas.</p>
            </div>
            <div class="instruccion-item"><p><strong><i class="fas fa-flag"></i> Clic Derecho (x1):</strong> Coloca una bandera 🚩 donde estés seguro de que hay una banana.</p></div>
            <div class="instruccion-item"><p><strong><i class="fas fa-question-circle"></i> Clic Derecho (x2):</strong> Coloca un signo de interrogación ❓ si sospechas de una banana.</p></div>
            <div class="instruccion-item"><p><strong><i class="fas fa-eraser"></i> Clic Derecho (x3):</strong> Limpia la casilla y quita cualquier marca.</p></div>
        `
    },
    en: {
        optAprendiz: "Apprentice Monkey (8x8)",
        optGorila: "Silverback Gorilla (10x10)",
        limiteAprendiz: "Limits: 10 to 63 bananas",
        limiteGorila: "Limits: 15 to 99 bananas",
        reiniciar: "RESTART GAME",
        opciones: "Options",
        idiomaBtn: "Language / Idioma",
        sonidosBtn: "Sounds",
        musicaLbl: '<i class="fas fa-headphones"></i> Main Music',
        efectosLbl: '<i class="fas fa-volume-up"></i> Sound Effects',
        cerrarBtn: "SAVE & CLOSE",
        recordsBtn: '<i class="fas fa-medal"></i> Best Records <i class="fas fa-chevron-down icon-arrow"></i>',
        logrosBtn: '<i class="fas fa-award"></i> Achievements & Medals <i class="fas fa-chevron-down icon-arrow"></i>',
        guiaBtn: '<i class="fas fa-book-open"></i> Explorer\'s Guide <i class="fas fa-chevron-down icon-arrow"></i>',
        volverBtn: "TRY AGAIN",
        jugarBtn: "PLAY AGAIN",
        
        thPuntos: "Score",
        thTiempo: "Time",
        thBananas: "Bananas",
        thRango: "Rank",
        sinRecords: "No records yet",
        borrarBtn: '<i class="fas fa-trash-alt"></i> Reset Records',
        alertaBorrar: 'Are you sure you want to reset all records and achievements? This action cannot be undone.',

        bananasLbl: "Bananas:",
        tableroLbl: "Board:",
        puntuacionLbl: "Score:",
        configTitle: "Settings",
        muteTitle: "Background Music",
        
        // NUEVO: Descripciones para el menú de configuración
        descIdioma: "Select the game language.",
        descSonidos: "Adjust the volume to your liking.",

        htmlLogros: `
            <div class="instruccion-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i id="icono-primer-paso" class="fas fa-leaf" style="font-size: 1.5rem; color: #a0a0a0; transition: color 0.5s;"></i>
                    <div>
                        <p><strong>First Steps</strong></p>
                        <p style="font-size: 0.8rem; opacity: 0.8;">Win your first game on the Apprentice Monkey board.</p>
                    </div>
                </div>
            </div>
            <div class="instruccion-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i id="icono-aprendiz-veloz" class="fas fa-running" style="font-size: 1.5rem; color: #a0a0a0; transition: color 0.5s;"></i>
                    <div>
                        <p><strong>Speedy Apprentice</strong></p>
                        <p style="font-size: 0.8rem; opacity: 0.8;">Win on Apprentice Monkey in under 30 seconds.</p>
                    </div>
                </div>
            </div>
            <div class="instruccion-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i id="icono-velocista" class="fas fa-bolt" style="font-size: 1.5rem; color: #a0a0a0; transition: color 0.5s;"></i>
                    <div>
                        <p><strong>Silver Sprinter</strong></p>
                        <p style="font-size: 0.8rem; opacity: 0.8;">Win a game on Silverback Gorilla in under 40 seconds.</p>
                    </div>
                </div>
            </div>
            <div class="instruccion-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i id="icono-purista" class="fas fa-flag-checkered" style="font-size: 1.5rem; color: #a0a0a0; transition: color 0.5s;"></i>
                    <div>
                        <p><strong>Extreme Purist</strong></p>
                        <p style="font-size: 0.8rem; opacity: 0.8;">Win a game without placing a single flag (right-click).</p>
                    </div>
                </div>
            </div>
            <div class="instruccion-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i id="icono-locura" class="fas fa-skull-crossbones" style="font-size: 1.5rem; color: #a0a0a0; transition: color 0.5s;"></i>
                    <div>
                        <p><strong>Tropical Madness</strong></p>
                        <p style="font-size: 0.8rem; opacity: 0.8;">Win on Silverback Gorilla with more than 50 bananas.</p>
                    </div>
                </div>
            </div>
        `,

        htmlGuia: `
            <div class="instruccion-item">
                <p><strong><i class="fas fa-star"></i> Rank System:</strong></p>
                <p>Ranks now adapt to the board difficulty!</p>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="img/rango03.png" class="icono-rango" alt="Epic Rank">
                        <span style="font-size: 0.8rem;"><strong>Epic:</strong> <br>Gorilla (10x10): 30+ bananas or 20+ in &le; 60s.<br>Apprentice (8x8): 25+ bananas or 15+ in &le; 40s.</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="img/rango02.png" class="icono-rango" alt="Advanced Rank">
                        <span style="font-size: 0.8rem;"><strong>Advanced:</strong> <br>Gorilla (10x10): 20+ bananas or 15+ in &le; 90s.<br>Apprentice (8x8): 15+ bananas or 10+ in &le; 60s.</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="img/rango01.png" class="icono-rango" alt="Basic Rank">
                        <span style="font-size: 0.8rem;"><strong>Explorer:</strong> Beat any other standard challenge.</span>
                    </div>
                </div>
            </div>
            <div class="instruccion-item">
                <p><strong><i class="fas fa-sliders-h"></i> Difficulty Limits:</strong></p>
                <p>You can customize the amount of bananas, but each board has its limits:</p>
                <ul style="margin-left: 25px; margin-top: 8px; font-size: 0.8rem; line-height: 1.6;">
                    <li><strong>Apprentice Monkey (8x8):</strong> 10 to 63 bananas.</li>
                    <li><strong>Silverback Gorilla (10x10):</strong> 15 to 99 bananas.</li>
                </ul>
            </div>
            <div class="instruccion-item">
                <p><strong><i class="fas fa-sort-numeric-up"></i> The Secret of Numbers:</strong></p>
                <p>Each number indicates exactly how many bananas 🍌 are hidden in the 8 neighboring cells. <br><br><em>Tip: If you see a "1" and there is only one unrevealed cell touching it, that cell is definitely a banana!</em></p>
                <div class="guia-colores"><span class="numero-1">1</span> | <span class="numero-2">2</span> | <span class="numero-3">3</span></div>
            </div>
            <div class="instruccion-item">
                <p><strong><i class="fas fa-mobile-alt"></i> Playing on mobile?</strong> Instead of right-clicking, <strong>tap and hold</strong> the cell for a second to place marks.</p>
            </div>
            <div class="instruccion-item"><p><strong><i class="fas fa-flag"></i> Right Click (x1):</strong> Place a flag 🚩 where you are 100% sure there is a banana.</p></div>
            <div class="instruccion-item"><p><strong><i class="fas fa-question-circle"></i> Right Click (x2):</strong> Place a question mark ❓ if you suspect a banana.</p></div>
            <div class="instruccion-item"><p><strong><i class="fas fa-eraser"></i> Right Click (x3):</strong> Clear the cell and remove any marks.</p></div>
        `
    }
};