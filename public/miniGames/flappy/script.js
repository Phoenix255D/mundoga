// miniGames/flappy/script.js
export { initFlappy, update };
import { teclas } from "../../main.js";

let canvas, ctx;
let juega = true;
let score = 0;

// Pájaro
const bird = {
    x: 150,
    y: 200,
    dy: 0,
    width: 32,
    height: 32,
    gravity: 0.35,
    jumpForce: -4.5
};

// Tubos
let pipes = [];
const pipeWidth = 60;
const pipeGap = 140;
const pipeSpeed = 2;
let pipeSpawnTimer = 0;
const pipeSpawnInterval = 120;

// Monedas
let coins = [];

function initFlappy() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    
    juega = true;
    score = 0;
    pipeSpawnTimer = 0;
    
    bird.x = 150;
    bird.y = 200;
    bird.dy = 0;
    
    pipes = [];
    coins = [];
    
    console.log('Flappy Bird inicializado');
}

function update() {
    if (!juega) return false;
    
    // Input - Saltar
    if (teclas["ArrowUp"] || teclas[" "]) {
        bird.dy = bird.jumpForce;
        teclas["ArrowUp"] = false;
        teclas[" "] = false;
    }
    
    // Salir del juego
    if (teclas["Escape"] || teclas["x"] || teclas["X"]) {
        juega = false;
        return false;
    }
    
    // Física del pájaro
    bird.dy += bird.gravity;
    bird.y += bird.dy;
    
    // Colisión con límites
    if (bird.y <= 0) {
        bird.y = 0;
        bird.dy = 0;
    }
    
    if (bird.y + bird.height >= canvas.height - 50) {
        juega = false;
        return false;
    }
    
    // Spawn de tubos
    pipeSpawnTimer++;
    if (pipeSpawnTimer >= pipeSpawnInterval) {
        pipeSpawnTimer = 0;
        spawnPipe();
    }
    
    // Actualizar tubos
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= pipeSpeed;
        
        if (pipe.x + pipeWidth < 0) {
            pipes.splice(i, 1);
            continue;
        }
        
        // Colisión con tubos
        if (checkCollision(bird, pipe)) {
            juega = false;
            return false;
        }
        
        // Puntaje
        if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
            if (pipe.isTop) {
                score++;
                pipe.scored = true;
            }
        }
    }
    
    // Actualizar monedas
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.x -= pipeSpeed;
        
        if (coin.x + coin.size < 0) {
            coins.splice(i, 1);
            continue;
        }
        
        // Colisión con monedas
        if (checkCoinCollision(bird, coin)) {
            score += 5;
            coins.splice(i, 1);
        }
    }
    
    draw();
    return true;
}

function spawnPipe() {
    const minHeight = 80;
    const maxHeight = canvas.height - 50 - pipeGap - 80;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    // Tubo superior
    pipes.push({
        x: canvas.width,
        y: 0,
        width: pipeWidth,
        height: topHeight,
        isTop: true,
        scored: false
    });
    
    // Tubo inferior
    pipes.push({
        x: canvas.width,
        y: topHeight + pipeGap,
        width: pipeWidth,
        height: canvas.height - 50 - (topHeight + pipeGap),
        isTop: false,
        scored: false
    });
    
    // 50% moneda
    if (Math.random() < 0.5) {
        coins.push({
            x: canvas.width + pipeWidth / 2,
            y: topHeight + pipeGap / 2 - 15,
            size: 30
        });
    }
}

function checkCollision(bird, pipe) {
    return (
        bird.x < pipe.x + pipe.width &&
        bird.x + bird.width > pipe.x &&
        bird.y < pipe.y + pipe.height &&
        bird.y + bird.height > pipe.y
    );
}

function checkCoinCollision(bird, coin) {
    return (
        bird.x < coin.x + coin.size &&
        bird.x + bird.width > coin.x &&
        bird.y < coin.y + coin.size &&
        bird.y + bird.height > coin.y
    );
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fondo simple
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar tubos
    pipes.forEach(pipe => {
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 3;
        ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);
    });
    
    // Dibujar monedas
    coins.forEach(coin => {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(coin.x + coin.size / 2, coin.y + coin.size / 2, coin.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    
    // Dibujar pájaro
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.strokeRect(bird.x, bird.y, bird.width, bird.height);
    
    // Ojo del pájaro
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(bird.x + 22, bird.y + 12, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(bird.x + 24, bird.y + 12, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Suelo
    ctx.fillStyle = '#7d5a3a';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    
    // UI
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = 'bold 32px Arial';
    
    const scoreText = 'Score: ' + score;
    ctx.strokeText(scoreText, 10, 40);
    ctx.fillText(scoreText, 10, 40);
    
    ctx.font = '16px Arial';
    ctx.strokeText('Espacio/↑ para saltar', 10, 70);
    ctx.fillText('Espacio/↑ para saltar', 10, 70);
    
    ctx.strokeText('ESC para salir', 10, 95);
    ctx.fillText('ESC para salir', 10, 95);
}