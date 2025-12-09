export { initNinja, update };

import { teclas, getMousePosition } from "../../main.js";

let juega = false;
let canvas, ctx;

// Elementos del juego
const ELEMENTS = { FIRE: 'fire', WATER: 'water', SNOW: 'snow' };
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const MAX_HAND_SIZE = 5;

// Variables del juego
let playerHand = [];
let playerWonCards = [];
let opponentWonCards = [];
let gameMessage = '';
let messageTimer = 0;

// Variables del mouse
let mouseX = 0;
let mouseY = 0;

// Inicializar juego
function initNinja() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    
    juega = true;
    playerHand = dealCards(MAX_HAND_SIZE);
    playerWonCards = [];
    opponentWonCards = [];
    gameMessage = '¡Comienza el juego!';
    messageTimer = 120;
    
    console.log('Ninja Card Game inicializado');
}

// Generar carta aleatoria
function generateRandomCard() {
    const elements = [ELEMENTS.FIRE, ELEMENTS.WATER, ELEMENTS.SNOW];
    const element = elements[Math.floor(Math.random() * 3)];
    const value = Math.floor(Math.random() * 10) + 1;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return { element, value, color, x: 0, y: 0, w: 60, h: 90 };
}

// Repartir cartas
function dealCards(count) {
    const cards = [];
    for (let i = 0; i < count; i++) {
        cards.push(generateRandomCard());
    }
    return cards;
}

// Actualizar juego
function update() {
    if (!juega) return false;
    
    // Obtener posición del mouse
    const mousePos = getMousePosition();
    mouseX = mousePos.x;
    mouseY = mousePos.y;
    
    // Decrementar timer del mensaje
    if (messageTimer > 0) messageTimer--;
    if (messageTimer === 0) gameMessage = '';
    
    // ESC para salir
    if (teclas["Escape"]) {
        juega = false;
        teclas["Escape"] = false;
        return false;
    }
    
    // ESPACIO para jugar carta
    if (teclas[" "]) {
        teclas[" "] = false;
        handleClick();
    }
    
    draw();
    return true;
}

// Manejar clics
function handleClick() {
    // Verificar si ganó alguien
    if (hasWinningSet(playerWonCards) || hasWinningSet(opponentWonCards)) {
        // Reiniciar juego
        playerHand = dealCards(MAX_HAND_SIZE);
        playerWonCards = [];
        opponentWonCards = [];
        gameMessage = '¡Nuevo juego!';
        messageTimer = 120;
        return;
    }
    
    // Buscar carta clickeada
    for (let i = 0; i < playerHand.length; i++) {
        const c = playerHand[i];
        if (mouseX >= c.x && mouseX <= c.x + c.w && 
            mouseY >= c.y && mouseY <= c.y + c.h) {
            playCard(i);
            return;
        }
    }
}

// Jugar carta
function playCard(index) {
    const playerCard = playerHand[index];
    const aiCard = generateRandomCard();
    
    // Quitar carta jugada y añadir nueva
    playerHand.splice(index, 1);
    playerHand.push(generateRandomCard());
    
    // Determinar ganador
    const winner = determineWinner(playerCard, aiCard);
    
    if (winner === 'player') {
        playerWonCards.push(playerCard);
        gameMessage = `¡Ganaste! ${getIcon(playerCard.element)}${playerCard.value} vs ${getIcon(aiCard.element)}${aiCard.value}`;
    } else if (winner === 'opponent') {
        opponentWonCards.push(aiCard);
        gameMessage = `Perdiste. ${getIcon(playerCard.element)}${playerCard.value} vs ${getIcon(aiCard.element)}${aiCard.value}`;
    } else {
        gameMessage = `Empate. ${getIcon(playerCard.element)}${playerCard.value} vs ${getIcon(aiCard.element)}${aiCard.value}`;
    }
    
    messageTimer = 120;
    
    // Verificar victoria
    if (hasWinningSet(playerWonCards)) {
        gameMessage = '¡GANASTE EL JUEGO! Presiona ESPACIO para jugar de nuevo';
        messageTimer = 600;
    } else if (hasWinningSet(opponentWonCards)) {
        gameMessage = '¡PERDISTE EL JUEGO! Presiona ESPACIO para jugar de nuevo';
        messageTimer = 600;
    }
}

// Determinar ganador
function determineWinner(c1, c2) {
    // Mismo elemento: comparar valores
    if (c1.element === c2.element) {
        if (c1.value > c2.value) return 'player';
        if (c2.value > c1.value) return 'opponent';
        return 'tie';
    }
    
    // Ventajas elementales
    if (c1.element === ELEMENTS.FIRE && c2.element === ELEMENTS.SNOW) return 'player';
    if (c1.element === ELEMENTS.SNOW && c2.element === ELEMENTS.WATER) return 'player';
    if (c1.element === ELEMENTS.WATER && c2.element === ELEMENTS.FIRE) return 'player';
    
    return 'opponent';
}

// Verificar conjunto ganador
function hasWinningSet(cards) {
    const fires = cards.filter(c => c.element === ELEMENTS.FIRE).length;
    const waters = cards.filter(c => c.element === ELEMENTS.WATER).length;
    const snows = cards.filter(c => c.element === ELEMENTS.SNOW).length;
    
    // 1 de cada elemento o 3 del mismo
    if (fires >= 1 && waters >= 1 && snows >= 1) return true;
    if (fires >= 3 || waters >= 3 || snows >= 3) return true;
    
    return false;
}

// Obtener icono del elemento
function getIcon(element) {
    if (element === ELEMENTS.FIRE) return '🔥';
    if (element === ELEMENTS.WATER) return '💧';
    if (element === ELEMENTS.SNOW) return '❄️';
    return '';
}

// Dibujar todo
function draw() {
    // Fondo del dojo
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Líneas decorativas
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 5;
    for (let i = 0; i < canvas.width; i += 100) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    
    // Círculo central
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 100, 0, Math.PI * 2);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
    
    // Barra superior
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(0, 0, canvas.width, 50);
    
    // Dibujar cartas
    drawCards();
    
    // Dibujar pingüinos
    drawPenguin(100, 350, 'blue', true);
    drawPenguin(canvas.width - 100, 250, 'red', false);
    
    // Mensaje
    if (gameMessage) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width/2 - 250, 100, 500, 60);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width/2 - 250, 100, 500, 60);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(gameMessage, canvas.width/2, 135);
    }
    
    // Instrucciones
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('ESC: Salir | ESPACIO: Clic', 10, 25);
}

// Dibujar cartas
function drawCards() {
    const startX = 150;
    const gap = 100;
    
    // Cartas del jugador
    playerHand.forEach((card, i) => {
        card.x = startX + i * gap;
        card.y = 480;
        drawOneCard(card.x, card.y, card);
    });
    
    // Cartas del oponente (reverso)
    for (let i = 0; i < 5; i++) {
        drawCardBack(startX + i * gap, 20);
    }
    
    // Cartas ganadas - jugador
    playerWonCards.forEach((c, i) => {
        drawSmallCard(10, 480 - i * 30, c);
    });
    
    // Cartas ganadas - oponente
    opponentWonCards.forEach((c, i) => {
        drawSmallCard(canvas.width - 50, 50 + i * 30, c);
    });
}

// Dibujar una carta
function drawOneCard(x, y, card) {
    // Hover effect
    const isHover = mouseX >= x && mouseX <= x + card.w && 
                    mouseY >= y && mouseY <= y + card.h;
    
    if (isHover) {
        y -= 10;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 15;
    }
    
    // Fondo blanco
    ctx.fillStyle = 'white';
    ctx.fillRect(x, y, card.w, card.h);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, card.w, card.h);
    
    // Barra de color
    ctx.fillStyle = card.color;
    ctx.fillRect(x + 5, y + 5, card.w - 10, 20);
    
    ctx.shadowBlur = 0;
    
    // Icono del elemento
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(getIcon(card.element), x + card.w / 2, y + 55);
    
    // Valor
    ctx.font = 'bold 20px Arial';
    ctx.fillText(card.value, x + card.w / 2, y + 80);
}

// Dibujar reverso de carta
function drawCardBack(x, y) {
    ctx.fillStyle = '#34495e';
    ctx.fillRect(x, y, 60, 90);
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 60, 90);
    
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('?', x + 30, y + 60);
}

// Dibujar carta pequeña
function drawSmallCard(x, y, card) {
    ctx.fillStyle = card.color;
    ctx.fillRect(x, y, 40, 40);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 40, 40);
    
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(getIcon(card.element), x + 20, y + 28);
}

// Dibujar pingüino
function drawPenguin(x, y, color, isPlayer) {
    ctx.save();
    ctx.translate(x, y);
    if (!isPlayer) ctx.scale(-1, 1);
    
    // Cuerpo
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 60, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Panza blanca
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(5, 5, 25, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Ojos
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(10, -30, 8, 0, Math.PI * 2);
    ctx.arc(25, -30, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Pupilas
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(12, -30, 3, 0, Math.PI * 2);
    ctx.arc(27, -30, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Pico
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(15, -20);
    ctx.lineTo(40, -15);
    ctx.lineTo(15, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Cinturón
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-35, 20);
    ctx.lineTo(35, 20);
    ctx.stroke();
    
    ctx.restore();
}