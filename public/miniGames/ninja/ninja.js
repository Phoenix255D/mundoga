export { initNinja, update };

import { teclas, getMousePosition } from "../../main.js";

let juega = false;
let canvas, ctx;

// Estados del juego Ninja
const STATES = { MENU: 0, GAME: 1, GAMEOVER: 2 };
let currentState = STATES.MENU;

// Elementos del juego de cartas
const ELEMENTS = { FIRE: 'fire', WATER: 'water', SNOW: 'snow' };
const COLORS = ['#FF0000', '#0000FF', '#008000', '#FFFF00', '#800080', '#FFA500'];
const MAX_HAND_SIZE = 5;

// Variables del jugador
let playerHand = [];
let playerWonCards = [];
let opponentWonCards = [];

let isMyTurn = true;

// Variables para mensajes
let gameMessage = '';
let messageTimeout = null;

// Variables de animación
let press = false;
let clickCooldown = 0;

// Variables del mouse
let mouseX = 0;
let mouseY = 0;

// Inicializar el juego Ninja
function initNinja() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    
    juega = true;
    currentState = STATES.MENU;
    
    // Inicializar manos de cartas
    playerHand = dealCards(MAX_HAND_SIZE);
    playerWonCards = [];
    opponentWonCards = [];
    
    isMyTurn = true;
    gameMessage = '';
    press = false;
    clickCooldown = 0;
    
    console.log('Ninja Card Game inicializado');
}

// Actualizar el juego Ninja
function update() {
    if (!juega) return false;
    
    // Obtener posición del mouse desde main.js
    const mousePos = getMousePosition();
    mouseX = mousePos.x;
    mouseY = mousePos.y;
    
    // Decrementar cooldown
    if (clickCooldown > 0) {
        clickCooldown--;
    }
    
    // Tecla ESC para salir
    if (teclas["Escape"]) {
        juega = false;
        teclas["Escape"] = false;
        return false;
    }
    
    // Tecla ESPACIO para interacción (con cooldown)
    if (teclas[" "] && !press && clickCooldown === 0) {
        press = true;
        clickCooldown = 15;
        
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
    
    // Verificar clic en botón JUGAR
    if (mouseX >= centerX - 100 && mouseX <= centerX + 100 &&
        mouseY >= 350 && mouseY <= 400) {
        startGame();
        return;
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
            return;
        }
    }
}

// Manejar clics en game over
function handleGameOverClick() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    if (mouseX >= centerX - 100 && mouseX <= centerX + 100 &&
        mouseY >= centerY + 80 && mouseY <= centerY + 130) {
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
        h: 100
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
function startGame() {
    currentState = STATES.GAME;
    playerHand = dealCards(MAX_HAND_SIZE);
    playerWonCards = [];
    opponentWonCards = [];
    isMyTurn = true;
    clickCooldown = 30;
    showMessage('¡Comienza el juego!');
}

// Jugar carta
function playCard(index) {
    if (index < 0 || index >= playerHand.length || !isMyTurn) {
        return;
    }
    
    // Marcar que no es el turno del jugador
    isMyTurn = false;
    clickCooldown = 60;
    
    const card = playerHand[index];
    
    // Remover carta jugada
    playerHand.splice(index, 1);
    
    // IA juega una carta
    const aiCard = generateRandomCard();
    
    // Determinar ganador
    const winner = determineWinner(card, aiCard);
    
    if (winner === 'player') {
        playerWonCards.push(card);
        showMessage(`¡Ganaste! ${getElementEmoji(card.element)}${card.value} vs ${getElementEmoji(aiCard.element)}${aiCard.value}`);
    } else if (winner === 'opponent') {
        opponentWonCards.push(aiCard);
        showMessage(`¡Perdiste! ${getElementEmoji(card.element)}${card.value} vs ${getElementEmoji(aiCard.element)}${aiCard.value}`);
    } else {
        showMessage(`¡Empate! ${getElementEmoji(card.element)}${card.value} vs ${getElementEmoji(aiCard.element)}${aiCard.value}`);
    }
    
    // Restaurar turno y añadir nueva carta
    setTimeout(() => {
        if (juega && currentState === STATES.GAME) {
            playerHand.push(generateRandomCard());
            isMyTurn = true;
            clickCooldown = 0;
            checkWinCondition();
        }
    }, 1800);
}

// Determinar ganador
function determineWinner(c1, c2) {
    // Verificar ventaja de tipo elemental
    if (c1.element === ELEMENTS.FIRE && c2.element === ELEMENTS.SNOW) return 'player';
    if (c1.element === ELEMENTS.SNOW && c2.element === ELEMENTS.WATER) return 'player';
    if (c1.element === ELEMENTS.WATER && c2.element === ELEMENTS.FIRE) return 'player';
    
    if (c2.element === ELEMENTS.FIRE && c1.element === ELEMENTS.SNOW) return 'opponent';
    if (c2.element === ELEMENTS.SNOW && c1.element === ELEMENTS.WATER) return 'opponent';
    if (c2.element === ELEMENTS.WATER && c1.element === ELEMENTS.FIRE) return 'opponent';
    
    // Si son del mismo elemento, comparar valores
    if (c1.element === c2.element) {
        if (c1.value > c2.value) return 'player';
        if (c2.value > c1.value) return 'opponent';
        return 'tie';
    }
    
    // Por defecto, comparar valores
    if (c1.value > c2.value) return 'player';
    if (c2.value > c1.value) return 'opponent';
    return 'tie';
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
    }, 2500);
}

// Verificar condición de victoria
function checkWinCondition() {
    if (hasWinningSet(playerWonCards)) {
        currentState = STATES.GAMEOVER;
        isMyTurn = false;
        clickCooldown = 30;
        showMessage('¡GANASTE EL JUEGO!');
    } else if (hasWinningSet(opponentWonCards)) {
        currentState = STATES.GAMEOVER;
        isMyTurn = false;
        clickCooldown = 30;
        showMessage('¡PERDISTE EL JUEGO!');
    }
}

// Verificar si hay conjunto ganador
function hasWinningSet(cards) {
    const fires = cards.filter(c => c.element === ELEMENTS.FIRE).length;
    const waters = cards.filter(c => c.element === ELEMENTS.WATER).length;
    const snows = cards.filter(c => c.element === ELEMENTS.SNOW).length;
    
    // Ganar con 1 de cada elemento
    if (fires >= 1 && waters >= 1 && snows >= 1) return true;
    
    // Ganar con 3 del mismo elemento
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
    clickCooldown = 30;
}

// Dibujar todo
function draw() {
    drawBackground();
    
    switch(currentState) {
        case STATES.MENU:
            drawMenu();
            break;
        case STATES.GAME:
            drawGame();
            break;
        case STATES.GAMEOVER:
            drawGameOver();
            break;
    }
    
    if (gameMessage) {
        drawMessage();
    }
    
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
    ctx.fillText('¡Batalla de elementos!', centerX, 140);
    
    // Reglas del juego
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Arial';
    ctx.fillText('Reglas:', centerX, 200);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('🔥 vence ❄️  |  ❄️ vence 💧  |  💧 vence 🔥', centerX, 240);
    ctx.fillText('Gana consiguiendo:', centerX, 270);
    ctx.fillText('• 3 cartas del mismo elemento', centerX, 295);
    ctx.fillText('• 1 carta de cada elemento', centerX, 320);
    
    // Botón de jugar
    drawButton(centerX - 100, 350, 200, 50, '#2ecc71', 'JUGAR');
}

// Dibujar juego en curso
function drawGame() {
    // Cartas del jugador
    const startX = 100;
    const gap = 120;
    
    playerHand.forEach((card, i) => {
        card.x = startX + i * gap;
        card.y = 400;
        drawCard(card.x, card.y, card);
    });
    
    // Cartas ganadas por jugador (izquierda)
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Tus cartas:', 20, 280);
    
    playerWonCards.forEach((card, i) => {
        drawSmallCard(20 + (i % 3) * 45, 300 + Math.floor(i / 3) * 45, card);
    });
    
    // Cartas ganadas por oponente (derecha)
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('PC:', canvas.width - 20, 180);
    
    opponentWonCards.forEach((card, i) => {
        drawSmallCard(canvas.width - 140 + (i % 3) * 45, 200 + Math.floor(i / 3) * 45, card);
    });
    
    // Dibujar ninjas
    drawNinja(150, 230, true);
    drawNinja(canvas.width - 150, 130, false);
    
    // Indicador de turno
    if (isMyTurn) {
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('¡TU TURNO! Haz clic en una carta', canvas.width/2, 375);
    } else {
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TURNO DEL OPONENTE...', canvas.width/2, 375);
    }
}

// Dibujar fin del juego
function drawGameOver() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Fondo semitransparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('¡JUEGO TERMINADO!', centerX, centerY - 60);
    
    // Mostrar resultado
    if (hasWinningSet(playerWonCards)) {
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 56px Arial';
        ctx.fillText('¡VICTORIA!', centerX, centerY + 10);
        
        // Mostrar cartas ganadoras
        ctx.fillStyle = '#FFD700';
        ctx.font = '20px Arial';
        ctx.fillText('Tus cartas ganadoras:', centerX, centerY + 60);
        
        const startX = centerX - (playerWonCards.length * 25);
        playerWonCards.forEach((card, i) => {
            drawSmallCard(startX + i * 50, centerY + 75, card);
        });
    } else {
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 56px Arial';
        ctx.fillText('¡DERROTA!', centerX, centerY + 10);
        
        // Mostrar cartas ganadoras del oponente
        ctx.fillStyle = '#FFD700';
        ctx.font = '20px Arial';
        ctx.fillText('El PC ganó con:', centerX, centerY + 60);
        
        const startX = centerX - (opponentWonCards.length * 25);
        opponentWonCards.forEach((card, i) => {
            drawSmallCard(startX + i * 50, centerY + 75, card);
        });
    }
    
    drawButton(centerX - 100, centerY + 140, 200, 50, '#3498db', 'VOLVER AL MENÚ');
}

// Dibujar botón
function drawButton(x, y, width, height, color, text) {
    // Efecto hover
    if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
        ctx.fillStyle = lightenColor(color, 20);
    } else {
        ctx.fillStyle = color;
    }
    
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width/2, y + height/2);
}

// Aclarar color (para efecto hover)
function lightenColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
        (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255))
        .toString(16).slice(1);
}

// Dibujar carta
function drawCard(x, y, card) {
    // Efecto hover
    const isHover = mouseX >= x && mouseX <= x + card.w && 
                    mouseY >= y && mouseY <= y + card.h && isMyTurn;
    
    if (isHover) {
        y -= 10; // Levantar carta
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 15;
    }
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, 70, 100);
    
    ctx.strokeStyle = card.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, 70, 100);
    
    ctx.fillStyle = card.color;
    ctx.fillRect(x + 5, y + 5, 60, 20);
    
    ctx.shadowBlur = 0;
    
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(getElementEmoji(card.element), x + 35, y + 55);
    
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(card.value, x + 35, y + 85);
}

// Dibujar carta pequeña (ganadas)
function drawSmallCard(x, y, card) {
    ctx.fillStyle = card.color;
    ctx.fillRect(x, y, 40, 40);
    
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 40, 40);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
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
    
    // Cuerpo
    ctx.fillStyle = isPlayer ? '#3498db' : '#e74c3c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Panza
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(5, 5, 20, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Ojos
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-10, -20, 8, 0, Math.PI * 2);
    ctx.arc(10, -20, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilas
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-10, -20, 4, 0, Math.PI * 2);
    ctx.arc(10, -20, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Pico
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(25, -5);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    
    // Bandana
    ctx.fillStyle = isPlayer ? '#2C3E50' : '#C0392B';
    ctx.fillRect(-25, -35, 50, 10);
    
    // Cinturón
    ctx.fillStyle = '#000000';
    ctx.fillRect(-35, 25, 70, 5);
    
    ctx.restore();
}

// Dibujar mensaje
function drawMessage() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(canvas.width/2 - 260, 145, 520, 70);
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(canvas.width/2 - 260, 145, 520, 70);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(gameMessage, canvas.width/2, 185);
}

// Dibujar instrucciones de salida
function drawExitInstructions() {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    const exitText = 'ESC para salir';
    ctx.strokeText(exitText, 10, 30);
    ctx.fillText(exitText, 10, 30);
    
    ctx.font = '14px Arial';
    const clickText = 'ESPACIO para clic';
    ctx.strokeText(clickText, 10, 50);
    ctx.fillText(clickText, 10, 50);
}