export let juegoNinjaActivo = false;
export let canvasNinja = null;
export let ctxNinja = null;

// Variables del juego Ninja
const STATES = { MENU: 0, SEARCHING: 1, GAME: 2, GAMEOVER: 3 };
let currentState = STATES.MENU;
let gameMode = 'single';

const ELEMENTS = { FIRE: 'fire', WATER: 'water', SNOW: 'snow' };
const COLORS = ['#FF0000', '#0000FF', '#008000', '#FFFF00', '#800080', '#FFA500'];
const MAX_HAND_SIZE = 5;

let playerHand = [];
let opponentHandCount = 5;
let playerWonCards = [];
let opponentWonCards = [];

let playerRole = null;
let roomId = null;
let isMyTurn = true;
let opponentMoved = false;

let socket = null;
let ninjaSocket = null;

// Inicializar el juego Ninja
export function initNinja() {
    juegoNinjaActivo = true;
    
    // Crear canvas para el Ninja
    canvasNinja = document.createElement('canvas');
    canvasNinja.id = 'ninja-canvas';
    canvasNinja.width = 800;
    canvasNinja.height = 600;
    canvasNinja.style.position = 'absolute';
    canvasNinja.style.top = '50%';
    canvasNinja.style.left = '50%';
    canvasNinja.style.transform = 'translate(-50%, -50%)';
    canvasNinja.style.backgroundColor = '#1a1a2e';
    canvasNinja.style.border = '3px solid #FF4500';
    canvasNinja.style.borderRadius = '10px';
    canvasNinja.style.zIndex = '1000';
    canvasNinja.style.boxShadow = '0 0 20px rgba(255, 69, 0, 0.5)';
    canvasNinja.style.cursor = 'pointer';
    
    document.body.appendChild(canvasNinja);
    ctxNinja = canvasNinja.getContext('2d');
    
    // Inicializar socket para modo online (opcional)
    try {
        if (window.io) {
            ninjaSocket = io('/ninja');
            setupSocketEvents();
        }
    } catch (e) {
        console.log('Socket no disponible para Ninja:', e);
    }
    
    // Inicializar juego
    resetGame();
    
    // Agregar eventos
    canvasNinja.addEventListener('click', handleCanvasClick);
    
    // Crear botón de cerrar
    crearBotonCerrarNinja();
    
    // Iniciar bucle del juego
    gameLoop();
    
    return true;
}

// Configurar eventos del socket
function setupSocketEvents() {
    if (!ninjaSocket) return;
    
    ninjaSocket.on('connect', () => {
        console.log('Conectado al servidor Ninja');
    });
    
    ninjaSocket.on('waiting_for_opponent', () => {
        currentState = STATES.SEARCHING;
    });
    
    ninjaSocket.on('game_start', (data) => {
        roomId = data.roomID;
        currentState = STATES.GAME;
        playerHand = dealCards(MAX_HAND_SIZE);
        playerWonCards = [];
        opponentWonCards = [];
        opponentMoved = false;
    });
    
    ninjaSocket.on('player_assignment', (data) => {
        playerRole = data.role;
    });
    
    ninjaSocket.on('opponent_moved', () => {
        opponentMoved = true;
    });
    
    ninjaSocket.on('round_result', (data) => {
        resolveRound(data.moves);
    });
}

// Generar carta aleatoria
function generateRandomCard() {
    const keys = Object.values(ELEMENTS);
    const element = keys[Math.floor(Math.random() * keys.length)];
    const value = Math.floor(Math.random() * 10) + 1;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return { element, value, color, x: 0, y: 0, w: 70, h: 100, selected: false };
}

// Repartir cartas
function dealCards(count) {
    const cards = [];
    for (let i = 0; i < count; i++) cards.push(generateRandomCard());
    return cards;
}

// Manejar clics en el canvas
function handleCanvasClick(e) {
    if (currentState !== STATES.GAME || !isMyTurn) return;
    
    const rect = canvasNinja.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Botones del menú
    if (currentState === STATES.MENU) {
        const btnSingleX = canvasNinja.width / 2 - 100;
        const btnSingleY = 300;
        const btnMultiX = canvasNinja.width / 2 - 100;
        const btnMultiY = 400;
        
        if (x >= btnSingleX && x <= btnSingleX + 200 && y >= btnSingleY && y <= btnSingleY + 50) {
            startGame('single');
        } else if (x >= btnMultiX && x <= btnMultiX + 200 && y >= btnMultiY && y <= btnMultiY + 50) {
            startGame('multi');
        }
        return;
    }
    
    // Cartas del jugador
    for (let i = 0; i < playerHand.length; i++) {
        const c = playerHand[i];
        if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
            playCard(i);
            break;
        }
    }
}

// Iniciar juego
function startGame(mode) {
    gameMode = mode;
    
    if (mode === 'single') {
        currentState = STATES.GAME;
        playerHand = dealCards(MAX_HAND_SIZE);
        opponentHandCount = 5;
        playerWonCards = [];
        opponentWonCards = [];
        isMyTurn = true;
    } else if (mode === 'multi' && ninjaSocket) {
        currentState = STATES.SEARCHING;
        ninjaSocket.emit('join_game');
    } else {
        alert("Modo online no disponible");
        return;
    }
}

// Jugar carta
function playCard(index) {
    const card = playerHand[index];
    
    if (gameMode === 'single') {
        playerHand.splice(index, 1);
        playerHand.push(generateRandomCard());
        
        const aiCard = generateRandomCard();
        resolveRoundLocal(card, aiCard);
        
    } else if (gameMode === 'multi' && ninjaSocket) {
        ninjaSocket.emit('play_card', { 
            roomID: roomId, 
            card: card, 
            playerRole: playerRole 
        });
        playerHand.splice(index, 1);
        playerHand.push(generateRandomCard());
        isMyTurn = false;
    }
}

// Resolver ronda local (vs PC)
function resolveRoundLocal(pCard, aiCard) {
    const winner = determineWinner(pCard, aiCard);
    
    if (winner === 'player') {
        playerWonCards.push(pCard);
        showMessage(`¡Ganaste! ${getElementEmoji(pCard.element)} vs ${getElementEmoji(aiCard.element)}`);
    } else if (winner === 'opponent') {
        opponentWonCards.push(aiCard);
        showMessage(`¡Perdiste! ${getElementEmoji(pCard.element)} vs ${getElementEmoji(aiCard.element)}`);
    } else {
        showMessage(`¡Empate! ${getElementEmoji(pCard.element)} vs ${getElementEmoji(aiCard.element)}`);
    }
    
    checkWinCondition();
}

// Resolver ronda online
function resolveRound(moves) {
    if (!ninjaSocket) return;
    
    const myId = ninjaSocket.id;
    const myMove = moves.find(m => m.playerId === myId);
    const oppMove = moves.find(m => m.playerId !== myId);
    
    if (!myMove || !oppMove) return;
    
    const winner = determineWinner(myMove.card, oppMove.card);
    
    if (winner === 'player') {
        playerWonCards.push(myMove.card);
        showMessage('¡Ganaste la ronda!');
    } else if (winner === 'opponent') {
        opponentWonCards.push(oppMove.card);
        showMessage('¡Perdiste la ronda!');
    } else {
        showMessage('¡Empate!');
    }
    
    opponentMoved = false;
    isMyTurn = true;
    checkWinCondition();
}

// Determinar ganador
function determineWinner(c1, c2) {
    if (c1.element === c2.element) {
        if (c1.value > c2.value) return 'player';
        if (c2.value > c1.value) return 'opponent';
        return 'tie';
    }
    
    if (c1.element === ELEMENTS.FIRE && c2.element === ELEMENTS.SNOW) return 'player';
    if (c1.element === ELEMENTS.SNOW && c2.element === ELEMENTS.WATER) return 'player';
    if (c1.element === ELEMENTS.WATER && c2.element === ELEMENTS.FIRE) return 'player';
    
    return 'opponent';
}

// Obtener emoji del elemento
function getElementEmoji(element) {
    switch(element) {
        case ELEMENTS.FIRE: return '🔥';
        case ELEMENTS.WATER: return '💧';
        case ELEMENTS.SNOW: return '❄️';
        default: return '';
    }
}

// Mostrar mensaje temporal
function showMessage(msg) {
    if (messageTimeout) clearTimeout(messageTimeout);
    gameMessage = msg;
    messageTimeout = setTimeout(() => {
        gameMessage = '';
    }, 2000);
}

// Verificar condición de victoria
function checkWinCondition() {
    if (hasWinningSet(playerWonCards)) {
        setTimeout(() => {
            showMessage('¡Juego Terminado! ¡TÚ GANAS!');
            setTimeout(() => resetGame(), 2000);
        }, 1000);
    } else if (hasWinningSet(opponentWonCards)) {
        setTimeout(() => {
            showMessage('¡Juego Terminado! ¡OPONENTE GANA!');
            setTimeout(() => resetGame(), 2000);
        }, 1000);
    }
}

// Verificar si hay conjunto ganador
function hasWinningSet(cards) {
    let fires = cards.filter(c => c.element === ELEMENTS.FIRE).length;
    let waters = cards.filter(c => c.element === ELEMENTS.WATER).length;
    let snows = cards.filter(c => c.element === ELEMENTS.SNOW).length;
    
    if (fires >= 1 && waters >= 1 && snows >= 1) return true;
    if (fires >= 3 || waters >= 3 || snows >= 3) return true;
    
    return false;
}

// Reiniciar juego
function resetGame() {
    currentState = STATES.MENU;
    playerHand = [];
    playerWonCards = [];
    opponentWonCards = [];
    gameMessage = '';
    isMyTurn = true;
}

// Variables para dibujo
let gameMessage = '';
let messageTimeout = null;

// Bucle principal del juego
function gameLoop() {
    if (!juegoNinjaActivo || !canvasNinja || !ctxNinja) return;
    
    draw();
    requestAnimationFrame(gameLoop);
}

// Dibujar todo
function draw() {
    ctxNinja.clearRect(0, 0, canvasNinja.width, canvasNinja.height);
    
    // Fondo
    drawBackground();
    
    // Estado actual
    switch(currentState) {
        case STATES.MENU:
            drawMenu();
            break;
        case STATES.SEARCHING:
            drawSearching();
            break;
        case STATES.GAME:
            drawGame();
            break;
        case STATES.GAMEOVER:
            drawGameOver();
            break;
    }
    
    // Dibujar mensaje si existe
    if (gameMessage) {
        ctxNinja.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctxNinja.fillRect(canvasNinja.width/2 - 200, 50, 400, 50);
        ctxNinja.fillStyle = '#FFD700';
        ctxNinja.font = 'bold 24px Arial';
        ctxNinja.textAlign = 'center';
        ctxNinja.fillText(gameMessage, canvasNinja.width/2, 85);
    }
}

// Dibujar fondo
function drawBackground() {
    // Fondo degradado
    const gradient = ctxNinja.createLinearGradient(0, 0, 0, canvasNinja.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#1a1a3a');
    ctxNinja.fillStyle = gradient;
    ctxNinja.fillRect(0, 0, canvasNinja.width, canvasNinja.height);
    
    // Patrón de dojo
    ctxNinja.strokeStyle = 'rgba(255, 215, 0, 0.2)';
    ctxNinja.lineWidth = 2;
    
    for (let i = 0; i < canvasNinja.width; i += 100) {
        ctxNinja.beginPath();
        ctxNinja.moveTo(i, 0);
        ctxNinja.lineTo(i, canvasNinja.height);
        ctxNinja.stroke();
    }
    
    // Círculo central
    ctxNinja.beginPath();
    ctxNinja.arc(canvasNinja.width/2, canvasNinja.height/2, 120, 0, Math.PI * 2);
    ctxNinja.strokeStyle = '#FF4500';
    ctxNinja.lineWidth = 5;
    ctxNinja.stroke();
    ctxNinja.fillStyle = 'rgba(255, 69, 0, 0.1)';
    ctxNinja.fill();
    
    // Título
    ctxNinja.fillStyle = '#FF4500';
    ctxNinja.font = 'bold 48px Arial';
    ctxNinja.textAlign = 'center';
    ctxNinja.fillText('NINJA', canvasNinja.width/2, 60);
    
    // Sombra del título
    ctxNinja.fillStyle = 'rgba(255, 69, 0, 0.3)';
    ctxNinja.fillText('NINJA', canvasNinja.width/2 + 3, 63);
}

// Dibujar menú
function drawMenu() {
    const centerX = canvasNinja.width / 2;
    
    // Subtítulo
    ctxNinja.fillStyle = '#FFD700';
    ctxNinja.font = '24px Arial';
    ctxNinja.fillText('El juego de cartas ninja', centerX, 120);
    
    // Botón CONTRA PC
    drawButton(centerX - 100, 300, 200, 50, '#3498db', 'CONTRA PC');
    
    // Botón ONLINE
    drawButton(centerX - 100, 400, 200, 50, '#2ecc71', 'ONLINE');
    
    // Instrucciones
    ctxNinja.fillStyle = '#AAAAAA';
    ctxNinja.font = '16px Arial';
    ctxNinja.textAlign = 'center';
    ctxNinja.fillText('🔥 vence ❄️ | ❄️ vence 💧 | 💧 vence 🔥', centerX, 500);
    ctxNinja.fillText('Gana consiguiendo 3 del mismo elemento o 1 de cada', centerX, 530);
}

// Dibujar búsqueda de oponente
function drawSearching() {
    const centerX = canvasNinja.width / 2;
    const centerY = canvasNinja.height / 2;
    
    ctxNinja.fillStyle = '#FFD700';
    ctxNinja.font = '28px Arial';
    ctxNinja.textAlign = 'center';
    ctxNinja.fillText('Buscando oponente...', centerX, centerY - 50);
    
    // Animación de puntos
    const dots = '.'.repeat(Math.floor(Date.now() / 500) % 4);
    ctxNinja.fillText(dots, centerX, centerY);
    
    // Dibujar ninjas buscando
    drawNinja(centerX - 100, centerY + 50, true);
    drawNinja(centerX + 100, centerY + 50, false);
}

// Dibujar juego en curso
function drawGame() {
    // Cartas del oponente
    for (let i = 0; i < opponentHandCount; i++) {
        drawCardBack(100 + i * 120, 50);
    }
    
    // Cartas del jugador
    playerHand.forEach((card, i) => {
        card.x = 100 + i * 120;
        card.y = 400;
        drawCard(card.x, card.y, card);
    });
    
    // Cartas ganadas por jugador
    playerWonCards.forEach((card, i) => {
        drawSmallCard(20, 400 - i * 25, card);
    });
    
    // Cartas ganadas por oponente
    opponentWonCards.forEach((card, i) => {
        drawSmallCard(canvasNinja.width - 60, 100 + i * 25, card);
    });
    
    // Dibujar ninjas
    drawNinja(150, 250, true);  // Jugador
    drawNinja(canvasNinja.width - 150, 150, false);  // Oponente
    
    // Indicador de turno
    if (isMyTurn) {
        ctxNinja.fillStyle = '#00FF00';
        ctxNinja.font = '20px Arial';
        ctxNinja.textAlign = 'center';
        ctxNinja.fillText('TU TURNO', canvasNinja.width/2, 380);
    } else {
        ctxNinja.fillStyle = '#FF0000';
        ctxNinja.font = '20px Arial';
        ctxNinja.textAlign = 'center';
        ctxNinja.fillText('TURNO DEL OPONENTE', canvasNinja.width/2, 380);
    }
}

// Dibujar fin del juego
function drawGameOver() {
    const centerX = canvasNinja.width / 2;
    const centerY = canvasNinja.height / 2;
    
    ctxNinja.fillStyle = '#FFD700';
    ctxNinja.font = '36px Arial';
    ctxNinja.textAlign = 'center';
    ctxNinja.fillText('JUEGO TERMINADO', centerX, centerY);
    
    drawButton(centerX - 100, centerY + 50, 200, 50, '#3498db', 'VOLVER AL MENÚ');
}

// Dibujar botón
function drawButton(x, y, width, height, color, text) {
    ctxNinja.fillStyle = color;
    ctxNinja.fillRect(x, y, width, height);
    ctxNinja.strokeStyle = '#FFFFFF';
    ctxNinja.lineWidth = 2;
    ctxNinja.strokeRect(x, y, width, height);
    
    ctxNinja.fillStyle = '#FFFFFF';
    ctxNinja.font = 'bold 20px Arial';
    ctxNinja.textAlign = 'center';
    ctxNinja.textBaseline = 'middle';
    ctxNinja.fillText(text, x + width/2, y + height/2);
}

// Dibujar carta
function drawCard(x, y, card) {
    // Fondo de la carta
    ctxNinja.fillStyle = '#FFFFFF';
    ctxNinja.fillRect(x, y, 70, 100);
    
    // Borde
    ctxNinja.strokeStyle = card.color;
    ctxNinja.lineWidth = 3;
    ctxNinja.strokeRect(x, y, 70, 100);
    
    // Cabecera con color del elemento
    ctxNinja.fillStyle = card.color;
    ctxNinja.fillRect(x + 5, y + 5, 60, 20);
    
    // Elemento (emoji)
    ctxNinja.font = '30px Arial';
    ctxNinja.textAlign = 'center';
    ctxNinja.textBaseline = 'middle';
    ctxNinja.fillText(getElementEmoji(card.element), x + 35, y + 55);
    
    // Valor
    ctxNinja.fillStyle = '#000000';
    ctxNinja.font = 'bold 24px Arial';
    ctxNinja.fillText(card.value, x + 35, y + 85);
}

// Dibujar reverso de carta
function drawCardBack(x, y) {
    ctxNinja.fillStyle = '#2C3E50';
    ctxNinja.fillRect(x, y, 70, 100);
    
    ctxNinja.strokeStyle = '#ECF0F1';
    ctxNinja.lineWidth = 2;
    ctxNinja.strokeRect(x, y, 70, 100);
    
    ctxNinja.fillStyle = '#ECF0F1';
    ctxNinja.font = '40px Arial';
    ctxNinja.textAlign = 'center';
    ctxNinja.textBaseline = 'middle';
    ctxNinja.fillText('?', x + 35, y + 50);
    
    // Patrón ninja
    ctxNinja.beginPath();
    ctxNinja.arc(x + 35, y + 25, 10, 0, Math.PI * 2);
    ctxNinja.fillStyle = '#E74C3C';
    ctxNinja.fill();
}

// Dibujar carta pequeña (ganadas)
function drawSmallCard(x, y, card) {
    ctxNinja.fillStyle = card.color;
    ctxNinja.fillRect(x, y, 40, 40);
    
    ctxNinja.strokeStyle = '#FFFFFF';
    ctxNinja.lineWidth = 1;
    ctxNinja.strokeRect(x, y, 40, 40);
    
    ctxNinja.fillStyle = '#FFFFFF';
    ctxNinja.font = '24px Arial';
    ctxNinja.textAlign = 'center';
    ctxNinja.textBaseline = 'middle';
    ctxNinja.fillText(getElementEmoji(card.element), x + 20, y + 20);
}

// Dibujar ninja
function drawNinja(x, y, isPlayer) {
    ctxNinja.save();
    ctxNinja.translate(x, y);
    
    if (!isPlayer) {
        ctxNinja.scale(-1, 1);
    }
    
    // Cuerpo
    ctxNinja.fillStyle = isPlayer ? '#3498db' : '#e74c3c';
    ctxNinja.beginPath();
    ctxNinja.ellipse(0, 0, 30, 50, 0, 0, Math.PI * 2);
    ctxNinja.fill();
    
    // Panza
    ctxNinja.fillStyle = '#FFFFFF';
    ctxNinja.beginPath();
    ctxNinja.ellipse(5, 5, 20, 35, 0, 0, Math.PI * 2);
    ctxNinja.fill();
    
    // Ojos
    ctxNinja.fillStyle = '#FFFFFF';
    ctxNinja.beginPath();
    ctxNinja.arc(-10, -20, 8, 0, Math.PI * 2);
    ctxNinja.arc(10, -20, 8, 0, Math.PI * 2);
    ctxNinja.fill();
    
    // Pupilas
    ctxNinja.fillStyle = '#000000';
    ctxNinja.beginPath();
    ctxNinja.arc(-10, -20, 4, 0, Math.PI * 2);
    ctxNinja.arc(10, -20, 4, 0, Math.PI * 2);
    ctxNinja.fill();
    
    // Pico
    ctxNinja.fillStyle = '#FFA500';
    ctxNinja.beginPath();
    ctxNinja.moveTo(0, -10);
    ctxNinja.lineTo(25, -5);
    ctxNinja.lineTo(0, 0);
    ctxNinja.closePath();
    ctxNinja.fill();
    
    // Bandana ninja
    ctxNinja.fillStyle = isPlayer ? '#2C3E50' : '#C0392B';
    ctxNinja.fillRect(-25, -35, 50, 10);
    
    // Cinturón
    ctxNinja.fillStyle = '#000000';
    ctxNinja.fillRect(-35, 25, 70, 5);
    
    // Estrella ninja
    ctxNinja.fillStyle = '#FFD700';
    drawStar(-20, -40, 5, 10, 5);
    drawStar(20, -40, 5, 10, 5);
    
    ctxNinja.restore();
}

// Dibujar estrella
function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;
    
    ctxNinja.beginPath();
    ctxNinja.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctxNinja.lineTo(x, y);
        rot += step;
        
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctxNinja.lineTo(x, y);
        rot += step;
    }
    
    ctxNinja.lineTo(cx, cy - outerRadius);
    ctxNinja.closePath();
    ctxNinja.fill();
}

// Crear botón de cerrar
function crearBotonCerrarNinja() {
    const btnCerrar = document.createElement('button');
    btnCerrar.textContent = 'X';
    btnCerrar.style.position = 'absolute';
    btnCerrar.style.top = 'calc(50% - 300px)';
    btnCerrar.style.right = 'calc(50% - 400px)';
    btnCerrar.style.zIndex = '1001';
    btnCerrar.style.background = '#FF4500';
    btnCerrar.style.color = 'white';
    btnCerrar.style.border = 'none';
    btnCerrar.style.borderRadius = '50%';
    btnCerrar.style.width = '30px';
    btnCerrar.style.height = '30px';
    btnCerrar.style.cursor = 'pointer';
    btnCerrar.style.fontWeight = 'bold';
    btnCerrar.style.fontSize = '16px';
    
    btnCerrar.onclick = () => {
        cerrarNinja();
    };
    
    document.body.appendChild(btnCerrar);
}

// Actualizar el juego Ninja
export function updateNinja() {
    if (!juegoNinjaActivo) return true;
    
    // Verificar tecla Escape para salir
    if (window.teclas && window.teclas['Escape']) {
        cerrarNinja();
        window.teclas['Escape'] = false;
    }
    
    return true;
}

// Cerrar el juego Ninja
export function cerrarNinja() {
    juegoNinjaActivo = false;
    
    // Cerrar socket si existe
    if (ninjaSocket) {
        ninjaSocket.disconnect();
        ninjaSocket = null;
    }
    
    // Remover canvas
    if (canvasNinja) {
        canvasNinja.remove();
        canvasNinja = null;
        ctxNinja = null;
    }
    
    // Remover botón de cerrar
    const btnCerrar = document.querySelector('button[onclick*="cerrarNinja"]');
    if (btnCerrar) {
        btnCerrar.remove();
    }
    
    return false;
}