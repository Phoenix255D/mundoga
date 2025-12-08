// miniGames/flappy/script.js
export { initFlappy, update };
import { teclas } from "/main.js";

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let juega = true;
let score = 0;
let frameCount = 0;

// Pájaro
const bird = {
    x: 150,
    y: 200,
    dy: 0,
    width: 32,
    height: 32,
    gravity: 0.35,
    jumpForce: -4.5,
    rotation: 0
};

// Tubos
let pipes = [];
const pipeWidth = 60;
const pipeGap = 140;
const pipeSpeed = 2;
let pipeSpawnTimer = 0;
const pipeSpawnInterval = 120; // frames entre tubos

// Imágenes
const birdImage = new Image();
birdImage.src = 'sprites/3.png'; // Usa el sprite del pingüino

const backgroundImage = new Image();
backgroundImage.src = 'imagenes/fondo.png';

const pipeImage = new Image();
pipeImage.src = 'imagenes/tubo.png';

// Monedas
let coins = [];
const coinImage = new Image();
coinImage.src = 'imagenes/huevomoneda.webp';

function initFlappy() {
    juega = true;
    score = 0;
    frameCount = 0;
    pipeSpawnTimer = 0;
    
    // Reset pájaro
    bird.x = 150;
    bird.y = 200;
    bird.dy = 0;
    bird.rotation = 0;
    
    // Limpiar arrays
    pipes = [];
    coins = [];
    
    console.log('Flappy Bird inicializado');
}

function update() {
    if (!juega) return false;
    
    frameCount++;
    
    // Input - Saltar
    if (teclas["ArrowUp"] || teclas[" "]) {
        bird.dy = bird.jumpForce;
        bird.rotation = -20;
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
    
    // Rotación basada en velocidad
    if (bird.dy > 0) {
        bird.rotation += 2;
        if (bird.rotation > 90) bird.rotation = 90;
    }
    
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
        
        // Eliminar tubos fuera de pantalla
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
        
        // Eliminar monedas fuera de pantalla
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
    // Altura aleatoria para el hueco
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
    
    // 50% de probabilidad de spawnar moneda
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
    
    // Fondo
    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Dibujar tubos
    pipes.forEach(pipe => {
        if (pipeImage.complete) {
            if (pipe.isTop) {
                // Tubo superior (volteado)
                ctx.save();
                ctx.translate(pipe.x + pipe.width / 2, pipe.height);
                ctx.scale(1, -1);
                ctx.drawImage(pipeImage, -pipe.width / 2, 0, pipe.width, pipe.height);
                ctx.restore();
            } else {
                // Tubo inferior
                ctx.drawImage(pipeImage, pipe.x, pipe.y, pipe.width, pipe.height);
            }
        } else {
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
            ctx.strokeStyle = '#27ae60';
            ctx.lineWidth = 3;
            ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);
        }
    });
    
    // Dibujar monedas
    coins.forEach(coin => {
        if (coinImage.complete) {
            ctx.drawImage(coinImage, coin.x, coin.y, coin.size, coin.size);
        } else {
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(coin.x + coin.size / 2, coin.y + coin.size / 2, coin.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Dibujar pájaro con rotación
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate((bird.rotation * Math.PI) / 180);
    
    if (birdImage.complete) {
        // Usar frame 1 del sprite (posición neutral)
        ctx.drawImage(
            birdImage,
            32, // frame 1 en x
            0,  // dirección 0 (abajo)
            32, 32,
            -bird.width / 2, -bird.height / 2,
            bird.width, bird.height
        );
    } else {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);
    }
    
    ctx.restore();
    
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