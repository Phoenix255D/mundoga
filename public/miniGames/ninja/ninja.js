export { initNinja, update };

import { teclas, getMousePosition } from "../../main.js";

let juega = false;
let canvas, ctx;

// Estados del juego Ninja
const STATES = { MENU: 0, SEARCHING: 1, GAME: 2, GAMEOVER: 3 };
let currentState = STATES.MENU;
let gameMode = 'single';

// Elementos del juego de cartas
const ELEMENTS = { FIRE: 'fire', WATER: 'water', SNOW: 'snow' };
const COLORS = ['#FF0000', '#0000FF', '#008000', '#FFFF00', '#800080', '#FFA500'];
const MAX_HAND_SIZE = 5;

// Variables del jugador
let playerHand = [];
let opponentHandCount = 5;
let playerWonCards = [];
let opponentWonCards = [];

let playerRole = null;
let roomId = null;
let isMyTurn = true;
let opponentMoved = false;

// Variables para mensajes
let gameMessage = '';
let messageTimeout = null;

// Variables de animación
let currentIndex = 0;
let press = false;

// Variables del mouse
let mouseX = 0;
let mouseY = 0;

// Inicializar el juego Ninja
function initNinja() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    
    juega = true;
    currentState = STATES.MENU;
    gameMode = 'single';
    
    // Inicializar manos de cartas
    playerHand = dealCards(MAX_HAND_SIZE);
    opponentHandCount = 5;
    playerWonCards = [];
    opponentWonCards = [];
    
    isMyTurn = true;
    opponentMoved = false;
    gameMessage = '';
    press = false; // IMPORTANTE: Resetear press
    
    console.log('Ninja Card Game inicializado');
}

// Actualizar el juego Ninja
function update() {
    if (!juega) return false;
    
    // CRÍTICO: Obtener posición del mouse desde main.js
    const mousePos = getMousePosition();
    mouseX = mousePos.x;
    mouseY = mousePos.y;
    
    // Tecla ESC para salir
    if (teclas["Escape"]) {
        juega = false;
        teclas["Escape"] = false;
        return false;
    }
    
    // Tecla ESPACIO para interacción
    if (teclas[" "] && !press) {
        press = true;
        
        if (currentState === STATES.MENU) {
            handleMenuClick();
        } else if (currentState === STATES.GAME && isMyTurn) {
            handleGameClick();
        } else if (currentState === STATES.GAMEOVER) {
            handleGameOverClick();
        }
    } else if (!teclas[" "]) {
        press = false;
    }
    
    draw();
    return true;
}

// Manejar clics en el menú
function handleMenuClick() {
    const centerX = canvas.width / 2;
    
    // Verificar clic en botón CONTRA PC
    if (mouseX >= centerX - 100 && mouseX <= centerX + 100) {
        if (mouseY >= 300 && mouseY <= 350) {
            startGame('single');
        } else if (mouseY >= 400 && mouseY <= 450) {
            startGame('multi');
        }
    }
}

// Manejar clics en el juego
function handleGameClick() {
    // Verificar clic en cartas
    for (let i = 0; i < playerHand.length; i++) {
        const c = playerHand[i];
        if (mouseX >= c.x && mouseX <= c.x + c.w && 
            mouseY >= c.y && mouseY <= c.y + c.h) {
            playCard(i);
            break;
        }
    }
}

// Manejar clics en game over
function handleGameOverClick() {
    const centerX = canvas.width / 2;
    if (mouseX >= centerX - 100 && mouseX <= centerX + 100 &&
        mouseY >= canvas.height/2 + 50 && mouseY <= canvas.height/2 + 100) {
        resetGame();
    }
}

// Generar carta aleatoria
function generateRandomCard() {
    const keys = Object.values(ELEMENTS);
    const element = keys[Math.floor(Math.random() * keys.length)];
    const value = Math.floor(Math.random() * 10) + 1;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return { 
        element, 
        value, 
        color, 
        x: 0, 
        y: 0, 
        w: 70, 
        h: 100, 
        selected: false 
    };
}

// Repartir cartas
function dealCards(count) {
    const cards = [];
    for (let i = 0; i < count; i++) {
        cards.push(generateRandomCard());
    }
    return cards;
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
        showMessage('¡Comienza el juego!');
    } else {
        // Modo multi (simulado por ahora)
        currentState = STATES.SEARCHING;
        setTimeout(() => {
            currentState = STATES.GAME;
            playerHand = dealCards(MAX_HAND_SIZE);
            opponentHandCount = 5;
            playerWonCards = [];
            opponentWonCards = [];
            isMyTurn = true;
            showMessage('¡Encontraste un oponente!');
        }, 1500);
    }
}

// Jugar carta
function playCard(index) {
    if (index < 0 || index >= playerHand.length) return;
    
    const card = playerHand[index];
    
    if (gameMode === 'single') {
        // Remover carta jugada y agregar nueva
        playerHand.splice(index, 1);
        playerHand.push(generateRandomCard());
        
        // IA juega una carta
        const aiCard = generateRandomCard();
        opponentHandCount = Math.max(0, opponentHandCount - 1);
        
        // Resolver la ronda
        resolveRoundLocal(card, aiCard);
        
        isMyTurn = false;
        
        // Restaurar turno después de un segundo
        setTimeout(() => {
            isMyTurn = true;
            opponentHandCount = Math.min(5, opponentHandCount + 1);
        }, 1000);
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
    
    // Verificar condición de victoria después de un pequeño delay
    setTimeout(() => {
        checkWinCondition();
    }, 100);
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
    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }
    gameMessage = msg;
    messageTimeout = setTimeout(() => {
        gameMessage = '';
    }, 2000);
}

// Verificar condición de victoria
function checkWinCondition() {
    if (hasWinningSet(playerWonCards)) {
        currentState = STATES.GAMEOVER;
        showMessage('¡Juego Terminado! ¡TÚ GANAS!');
    } else if (hasWinningSet(opponentWonCards)) {
        currentState = STATES.GAMEOVER;
        showMessage('¡Juego Terminado! ¡OPONENTE GANA!');
    }
}

// Verificar si hay conjunto ganador
function hasWinningSet(cards) {
    const fires = cards.filter(c => c.element === ELEMENTS.FIRE).length;
    const waters = cards.filter(c => c.element === ELEMENTS.WATER).length;
    const snows = cards.filter(c => c.element === ELEMENTS.SNOW).length;
    
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
    press = false;
}

// Dibujar todo
function draw() {
    // Fondo del juego Ninja
    drawBackground();
    
    // Dibujar según el estado actual
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
        drawMessage();
    }
    
    // Dibujar instrucciones de salida
    drawExitInstructions();
}

// Dibujar fondo
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < canvas.width; i += 100) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, 120, 0, Math.PI * 2);
    ctx.strokeStyle = '#FF4500';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 69, 0, 0.1)';
    ctx.fill();
}

// Dibujar menú
function drawMenu() {
    const centerX = canvas.width / 2;
    
    ctx.fillStyle = '#FF4500';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NINJA CARD GAME', centerX, 100);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '24px Arial';
    ctx.fillText('El juego de cartas ninja', centerX, 140);
    
    drawButton(centerX - 100, 300, 200, 50, '#3498db', 'CONTRA PC');
    drawButton(centerX - 100, 400, 200, 50, '#2ecc71', 'ONLINE');
    
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 vence ❄️ | ❄️ vence 💧 | 💧 vence 🔥', centerX, 500);
    ctx.fillText('Gana consiguiendo 3 del mismo elemento o 1 de cada', centerX, 530);
}

// Dibujar búsqueda de oponente
function drawSearching() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Buscando oponente...', centerX, centerY - 50);
    
    const dots = '.'.repeat(Math.floor(Date.now() / 500) % 4);
    ctx.fillText(dots, centerX, centerY);
    
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
    const startX = 100;
    const gap = 120;
    
    playerHand.forEach((card, i) => {
        card.x = startX + i * gap;
        card.y = 400;
        drawCard(card.x, card.y, card);
    });
    
    // Cartas ganadas por jugador
    playerWonCards.forEach((card, i) => {
        drawSmallCard(20, 400 - i * 25, card);
    });
    
    // Cartas ganadas por oponente
    opponentWonCards.forEach((card, i) => {
        drawSmallCard(canvas.width - 60, 100 + i * 25, card);
    });
    
    // Dibujar ninjas
    drawNinja(150, 250, true);
    drawNinja(canvas.width - 150, 150, false);
    
    // Indicador de turno
    if (isMyTurn) {
        ctx.fillStyle = '#00FF00';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TU TURNO', canvas.width/2, 380);
    } else {
        ctx.fillStyle = '#FF0000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TURNO DEL OPONENTE', canvas.width/2, 380);
    }
}

// Dibujar fin del juego
function drawGameOver() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('JUEGO TERMINADO', centerX, centerY);
    
    drawButton(centerX - 100, centerY + 50, 200, 50, '#3498db', 'VOLVER AL MENÚ');
}

// Dibujar botón
function drawButton(x, y, width, height, color, text) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width/2, y + height/2);
}

// Dibujar carta
function drawCard(x, y, card) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, 70, 100);
    
    ctx.strokeStyle = card.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, 70, 100);
    
    ctx.fillStyle = card.color;
    ctx.fillRect(x + 5, y + 5, 60, 20);
    
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(getElementEmoji(card.element), x + 35, y + 55);
    
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(card.value, x + 35, y + 85);
}

// Dibujar reverso de carta
function drawCardBack(x, y) {
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(x, y, 70, 100);
    
    ctx.strokeStyle = '#ECF0F1';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 70, 100);
    
    ctx.fillStyle = '#ECF0F1';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x + 35, y + 50);
}

// Dibujar carta pequeña (ganadas)
function drawSmallCard(x, y, card) {
    ctx.fillStyle = card.color;
    ctx.fillRect(x, y, 40, 40);
    
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, 40, 40);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(getElementEmoji(card.element), x + 20, y + 20);
}

// Dibujar ninja
function drawNinja(x, y, isPlayer) {
    ctx.save();
    ctx.translate(x, y);
    
    if (!isPlayer) {
        ctx.scale(-1, 1);
    }
    
    ctx.fillStyle = isPlayer ? '#3498db' : '#e74c3c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(5, 5, 20, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-10, -20, 8, 0, Math.PI * 2);
    ctx.arc(10, -20, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-10, -20, 4, 0, Math.PI * 2);
    ctx.arc(10, -20, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(25, -5);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = isPlayer ? '#2C3E50' : '#C0392B';
    ctx.fillRect(-25, -35, 50, 10);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(-35, 25, 70, 5);
    
    ctx.restore();
}

// Dibujar mensaje
function drawMessage() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(canvas.width/2 - 200, 150, 400, 50);
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(gameMessage, canvas.width/2, 185);
}

// Dibujar instrucciones de salida
function drawExitInstructions() {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = '16px Arial';
    
    const exitText = 'ESC para salir';
    ctx.strokeText(exitText, 10, 30);
    ctx.fillText(exitText, 10, 30);
    
    ctx.font = '14px Arial';
    const clickText = 'CLIC para jugar cartas';
    ctx.strokeText(clickText, 10, 50);
    ctx.fillText(clickText, 10, 50);
}