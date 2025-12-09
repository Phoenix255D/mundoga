export { initNinja, update };

import { teclas, getMousePosition } from "../../main.js";

let juega = false;
let canvas, ctx;

// Estados del juego
const STATES = { MENU: 0, GAME: 1, GAMEOVER: 2 };
let currentState = STATES.MENU;

// Elementos del juego
const ELEMENTS = { FIRE: 'fire', WATER: 'water', SNOW: 'snow' };

// Variables del jugador
let playerHand = [];
let playerWonCards = [];
let opponentWonCards = [];
let isMyTurn = true;
let gameMessage = '';
let clickCooldown = 0;

// Variables del mouse
let mouseX = 0;
let mouseY = 0;

// Inicializar el juego
function initNinja() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    
    juega = true;
    currentState = STATES.MENU;
    resetGame();
    
    console.log('Ninja Card Game inicializado');
}

// Actualizar el juego
function update() {
    if (!juega) return false;
    
    // Obtener posición del mouse
    const mousePos = getMousePosition();
    mouseX = mousePos.x;
    mouseY = mousePos.y;
    
    // Decrementar cooldown
    if (clickCooldown > 0) clickCooldown--;
    
    // ESC para salir
    if (teclas["Escape"]) {
        juega = false;
        teclas["Escape"] = false;
        return false;
    }
    
    // ESPACIO para clic
    if (teclas[" "] && clickCooldown === 0) {
        clickCooldown = 15;
        handleClick();
        teclas[" "] = false;
    }
    
    draw();
    return true;
}

// Manejar clics
function handleClick() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    if (currentState === STATES.MENU) {
        // Botón JUGAR
        if (mouseX >= centerX - 100 && mouseX <= centerX + 100 &&
            mouseY >= 350 && mouseY <= 400) {
            startGame();
        }
    } else if (currentState === STATES.GAME && isMyTurn) {
        // Verificar clic en cartas
        for (let i = 0; i < playerHand.length; i++) {
            const c = playerHand[i];
            if (mouseX >= c.x && mouseX <= c.x + 70 && 
                mouseY >= c.y && mouseY <= c.y + 100) {
                playCard(i);
                break;
            }
        }
    } else if (currentState === STATES.GAMEOVER) {
        // Botón volver al menú
        if (mouseX >= centerX - 100 && mouseX <= centerX + 100 &&
            mouseY >= centerY + 80 && mouseY <= centerY + 130) {
            currentState = STATES.MENU;
            resetGame();
        }
    }
}

// Generar carta aleatoria
function generateCard() {
    const elements = [ELEMENTS.FIRE, ELEMENTS.WATER, ELEMENTS.SNOW];
    return { 
        element: elements[Math.floor(Math.random() * 3)],
        value: Math.floor(Math.random() * 10) + 1,
        x: 0, 
        y: 0
    };
}

// Iniciar juego
function startGame() {
    currentState = STATES.GAME;
    playerHand = [generateCard(), generateCard(), generateCard(), generateCard(), generateCard()];
    playerWonCards = [];
    opponentWonCards = [];
    isMyTurn = true;
    gameMessage = '¡Comienza el juego!';
    setTimeout(() => gameMessage = '', 2000);
}

// Jugar carta
function playCard(index) {
    if (!isMyTurn) return;
    
    isMyTurn = false;
    const playerCard = playerHand[index];
    const opponentCard = generateCard();
    
    // Determinar ganador
    const winner = getWinner(playerCard, opponentCard);
    
    if (winner === 'player') {
        playerWonCards.push(playerCard);
        gameMessage = `¡Ganaste! ${getEmoji(playerCard.element)}${playerCard.value} vs ${getEmoji(opponentCard.element)}${opponentCard.value}`;
    } else if (winner === 'opponent') {
        opponentWonCards.push(opponentCard);
        gameMessage = `Perdiste. ${getEmoji(playerCard.element)}${playerCard.value} vs ${getEmoji(opponentCard.element)}${opponentCard.value}`;
    } else {
        gameMessage = `Empate. ${getEmoji(playerCard.element)}${playerCard.value} vs ${getEmoji(opponentCard.element)}${opponentCard.value}`;
    }
    
    // Remover carta jugada y añadir nueva
    playerHand.splice(index, 1);
    
    setTimeout(() => {
        if (currentState === STATES.GAME) {
            playerHand.push(generateCard());
            isMyTurn = true;
            
            // Verificar victoria
            if (checkWin(playerWonCards)) {
                currentState = STATES.GAMEOVER;
                gameMessage = '¡GANASTE EL JUEGO!';
            } else if (checkWin(opponentWonCards)) {
                currentState = STATES.GAMEOVER;
                gameMessage = 'PERDISTE EL JUEGO';
            } else {
                gameMessage = '';
            }
        }
    }, 1500);
}

// Determinar ganador
function getWinner(c1, c2) {
    // Ventajas elementales: Fuego > Nieve, Nieve > Agua, Agua > Fuego
    if (c1.element === ELEMENTS.FIRE && c2.element === ELEMENTS.SNOW) return 'player';
    if (c1.element === ELEMENTS.SNOW && c2.element === ELEMENTS.WATER) return 'player';
    if (c1.element === ELEMENTS.WATER && c2.element === ELEMENTS.FIRE) return 'player';
    
    if (c2.element === ELEMENTS.FIRE && c1.element === ELEMENTS.SNOW) return 'opponent';
    if (c2.element === ELEMENTS.SNOW && c1.element === ELEMENTS.WATER) return 'opponent';
    if (c2.element === ELEMENTS.WATER && c1.element === ELEMENTS.FIRE) return 'opponent';
    
    // Mismo elemento o sin ventaja: comparar valores
    if (c1.value > c2.value) return 'player';
    if (c2.value > c1.value) return 'opponent';
    return 'tie';
}

// Obtener emoji
function getEmoji(element) {
    if (element === ELEMENTS.FIRE) return '🔥';
    if (element === ELEMENTS.WATER) return '💧';
    if (element === ELEMENTS.SNOW) return '❄️';
    return '';
}

// Verificar victoria
function checkWin(cards) {
    const fires = cards.filter(c => c.element === ELEMENTS.FIRE).length;
    const waters = cards.filter(c => c.element === ELEMENTS.WATER).length;
    const snows = cards.filter(c => c.element === ELEMENTS.SNOW).length;
    
    // 1 de cada elemento o 3 del mismo
    return (fires >= 1 && waters >= 1 && snows >= 1) || fires >= 3 || waters >= 3 || snows >= 3;
}

// Reiniciar juego
function resetGame() {
    playerHand = [];
    playerWonCards = [];
    opponentWonCards = [];
    gameMessage = '';
    isMyTurn = true;
    clickCooldown = 0;
}

// Dibujar todo
function draw() {
    // Fondo
    ctx.fillStyle = '#1a1a3a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (currentState === STATES.MENU) {
        drawMenu();
    } else if (currentState === STATES.GAME) {
        drawGame();
    } else if (currentState === STATES.GAMEOVER) {
        drawGameOver();
    }
    
    // Mensaje
    if (gameMessage) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(canvas.width/2 - 250, 150, 500, 60);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width/2 - 250, 150, 500, 60);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(gameMessage, canvas.width/2, 185);
    }
    
    // Instrucciones
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('ESC: salir | ESPACIO: clic', 10, 25);
}

// Dibujar menú
function drawMenu() {
    const cx = canvas.width / 2;
    
    ctx.fillStyle = '#FF4500';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NINJA CARD GAME', cx, 100);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Arial';
    ctx.fillText('Reglas:', cx, 200);
    ctx.font = '16px Arial';
    ctx.fillText('🔥 vence ❄️  |  ❄️ vence 💧  |  💧 vence 🔥', cx, 230);
    ctx.fillText('Gana con: 3 del mismo elemento', cx, 260);
    ctx.fillText('o 1 de cada elemento', cx, 285);
    
    // Botón
    const hover = mouseX >= cx - 100 && mouseX <= cx + 100 && mouseY >= 350 && mouseY <= 400;
    ctx.fillStyle = hover ? '#3ae374' : '#2ecc71';
    ctx.fillRect(cx - 100, 350, 200, 50);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 100, 350, 200, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('JUGAR', cx, 380);
}

// Dibujar juego
function drawGame() {
    // Cartas del jugador
    const startX = 100;
    playerHand.forEach((card, i) => {
        card.x = startX + i * 120;
        card.y = 400;
        const hover = mouseX >= card.x && mouseX <= card.x + 70 && 
                      mouseY >= card.y && mouseY <= card.y + 100 && isMyTurn;
        const y = hover ? card.y - 10 : card.y;
        
        // Carta
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(card.x, y, 70, 100);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(card.x, y, 70, 100);
        
        // Emoji
        ctx.font = '35px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(getEmoji(card.element), card.x + 35, y + 45);
        
        // Valor
        ctx.fillStyle = '#000';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(card.value, card.x + 35, y + 80);
    });
    
    // Cartas ganadas - Jugador
    ctx.fillStyle = '#FFD700';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Tus cartas:', 20, 280);
    playerWonCards.forEach((card, i) => {
        ctx.fillStyle = '#DDD';
        ctx.fillRect(20 + (i % 5) * 45, 300 + Math.floor(i / 5) * 45, 40, 40);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(20 + (i % 5) * 45, 300 + Math.floor(i / 5) * 45, 40, 40);
        ctx.font = '25px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(getEmoji(card.element), 40 + (i % 5) * 45, 325 + Math.floor(i / 5) * 45);
    });
    
    // Cartas ganadas - Oponente
    ctx.fillStyle = '#FFD700';
    ctx.font = '16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('PC:', canvas.width - 20, 180);
    opponentWonCards.forEach((card, i) => {
        ctx.fillStyle = '#DDD';
        ctx.fillRect(canvas.width - 180 + (i % 5) * 45, 200 + Math.floor(i / 5) * 45, 40, 40);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(canvas.width - 180 + (i % 5) * 45, 200 + Math.floor(i / 5) * 45, 40, 40);
        ctx.font = '25px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(getEmoji(card.element), canvas.width - 160 + (i % 5) * 45, 225 + Math.floor(i / 5) * 45);
    });
    
    // Indicador de turno
    ctx.fillStyle = isMyTurn ? '#00FF00' : '#FF0000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(isMyTurn ? 'TU TURNO' : 'TURNO DEL OPONENTE', canvas.width/2, 375);
}

// Dibujar game over
function drawGameOver() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('JUEGO TERMINADO', cx, cy - 60);
    
    const won = checkWin(playerWonCards);
    ctx.fillStyle = won ? '#00FF00' : '#FF0000';
    ctx.font = 'bold 56px Arial';
    ctx.fillText(won ? '¡VICTORIA!' : '¡DERROTA!', cx, cy + 10);
    
    // Botón
    const hover = mouseX >= cx - 100 && mouseX <= cx + 100 && mouseY >= cy + 80 && mouseY <= cy + 130;
    ctx.fillStyle = hover ? '#5dade2' : '#3498db';
    ctx.fillRect(cx - 100, cy + 80, 200, 50);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 100, cy + 80, 200, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('VOLVER AL MENÚ', cx, cy + 107);
}