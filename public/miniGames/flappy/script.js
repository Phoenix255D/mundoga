// miniGames/flappy/script.js
import { teclas } from "/main.js";

let canvas, ctx;
let juega = true;
let firstFrame = true;
let bird = {
    x: 150,
    y: 200,
    dy: 0,
    width: 34,
    height: 24,
    visible: true,
    image: new Image(),
    imageFlap: new Image()
};

let pipes = [];
let coins = [];
let score_val = 0;
let isFlapping = false;
let pipe_separation = 0;
let wasSpacePressed = false;

const backgroundImage = new Image();
const pipeTopImage = new Image();
const pipeBottomImage = new Image();

// Variables de configuración de pipes
const pipe_gap = 35;
const pipe_offset = 10;
const pipe_top_offset = 12;

// Precargar imágenes
backgroundImage.src = 'imagenes/fondo.png';
pipeTopImage.src = 'imagenes/tubo.png';
pipeBottomImage.src = 'imagenes/tubo.png';

export function initFlappy() {
    console.log('Iniciando Flappy Bird...');
    
    canvas = document.getElementById("game");
    ctx = canvas.getContext("2d");
    
    juega = true;
    firstFrame = true;
    wasSpacePressed = false;
    
    bird = {
        x: 150,
        y: 200,
        dy: 0,
        width: 34,
        height: 24,
        visible: true,
        image: new Image(),
        imageFlap: new Image()
    };
    
    bird.image.src = 'sprites/3.png';
    bird.imageFlap.src = 'sprites/3.png';
    
    pipes = [];
    coins = [];
    score_val = 0;
    isFlapping = false;
    pipe_separation = 0;
    
    console.log('Flappy Bird iniciado');
}

export function update() {
    if (!juega) {
        return false;
    }
    
    // Ignorar input en el primer frame para evitar salto inicial
    if (firstFrame) {
        firstFrame = false;
        wasSpacePressed = teclas[" "];
        draw();
        return true;
    }
    
    // Detectar salto solo cuando se presiona (edge detection)
    const isSpacePressed = teclas[" "] || teclas["ArrowUp"];
    
    if (isSpacePressed && !wasSpacePressed) {
        bird.dy = -4.5;
        isFlapping = true;
        setTimeout(() => { isFlapping = false; }, 100);
    }
    
    wasSpacePressed = isSpacePressed;
    
    // Salir del juego
    if (teclas["Escape"] || teclas["x"] || teclas["X"]) {
        juega = false;
        return false;
    }
    
    // Aplicar gravedad
    const gravity = 0.35;
    bird.dy += gravity;
    bird.y += bird.dy;
    
    // Límite superior
    if (bird.y <= 0) {
        bird.y = 0;
        bird.dy = 0;
    }
    
    // Límite inferior (game over)
    if (bird.y + bird.height >= canvas.height) {
        juega = false;
        return false;
    }
    
    // Crear nuevos pipes
    pipe_separation++;
    if (pipe_separation > 120) {
        pipe_separation = 0;
        
        const pipe_posi = Math.floor(Math.random() * 60) + 15;
        const topHeight = (pipe_posi - pipe_top_offset) * canvas.height / 100;
        const bottomY = (pipe_posi + pipe_gap) * canvas.height / 100;
        
        pipes.push({
            x: canvas.width,
            y: 0,
            width: 60,
            height: topHeight,
            scored: false,
            isTop: true
        });
        
        pipes.push({
            x: canvas.width,
            y: bottomY,
            width: 60,
            height: canvas.height - bottomY,
            scored: false,
            isTop: false
        });
        
        if (Math.random() < 0.5) {
            const coinImg = new Image();
            coinImg.src = 'imagenes/huevomoneda.webp';
            coins.push({
                x: canvas.width + 30,
                y: (pipe_posi + (pipe_gap / 2)) * canvas.height / 100 - 15,
                size: 30,
                image: coinImg
            });
        }
    }
    
    // Mover y colisionar pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= 2;
        
        if (pipes[i].x + pipes[i].width < 0) {
            pipes.splice(i, 1);
            continue;
        }
        
        // Colisión
        if (
            bird.x < pipes[i].x + pipes[i].width &&
            bird.x + bird.width > pipes[i].x &&
            bird.y < pipes[i].y + pipes[i].height &&
            bird.y + bird.height > pipes[i].y
        ) {
            juega = false;
            return false;
        }
        
        // Score
        if (!pipes[i].scored && !pipes[i].isTop && pipes[i].x + pipes[i].width < bird.x) {
            score_val++;
            pipes[i].scored = true;
        }
    }
    
    // Mover y colisionar monedas
    for (let i = coins.length - 1; i >= 0; i--) {
        coins[i].x -= 2;
        
        if (coins[i].x + coins[i].size < 0) {
            coins.splice(i, 1);
            continue;
        }
        
        if (
            bird.x < coins[i].x + coins[i].size &&
            bird.x + bird.width > coins[i].x &&
            bird.y < coins[i].y + coins[i].size &&
            bird.y + bird.height > coins[i].y
        ) {
            score_val += 5;
            coins.splice(i, 1);
        }
    }
    
    draw();
    return juega;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fondo
    if (backgroundImage.complete && backgroundImage.width > 0) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Pipes
    for (const pipe of pipes) {
        if (pipe.isTop) {
            if (pipeTopImage.complete && pipeTopImage.width > 0) {
                ctx.save();
                ctx.translate(pipe.x, pipe.height);
                ctx.scale(1, -1);
                const numRepeat = Math.ceil(pipe.height / pipeTopImage.height);
                for (let i = 0; i < numRepeat; i++) {
                    ctx.drawImage(pipeTopImage, 0, i * pipeTopImage.height, pipe.width, pipeTopImage.height);
                }
                ctx.restore();
            } else {
                ctx.fillStyle = '#5cb85c';
                ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
            }
        } else {
            if (pipeBottomImage.complete && pipeBottomImage.width > 0) {
                const numRepeat = Math.ceil(pipe.height / pipeBottomImage.height);
                for (let i = 0; i < numRepeat; i++) {
                    ctx.drawImage(pipeBottomImage, pipe.x, pipe.y + (i * pipeBottomImage.height), pipe.width, pipeBottomImage.height);
                }
            } else {
                ctx.fillStyle = '#5cb85c';
                ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
            }
        }
    }
    
    // Monedas
    for (const coin of coins) {
        if (coin.image.complete) {
            ctx.drawImage(coin.image, coin.x, coin.y, coin.size, coin.size);
        }
    }
    
    // Pájaro
    if (bird.visible) {
        const birdImage = isFlapping ? bird.imageFlap : bird.image;
        if (birdImage.complete) {
            ctx.drawImage(birdImage, bird.x, bird.y, bird.width, bird.height);
        } else {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
        }
    }
    
    // UI
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = 'bold 24px Arial';
    ctx.strokeText('Score: ' + score_val, 10, 30);
    ctx.fillText('Score: ' + score_val, 10, 30);
    
    ctx.font = '16px Arial';
    ctx.lineWidth = 2;
    const instruccion = 'ESPACIO para saltar - ESC para salir';
    ctx.strokeText(instruccion, 10, canvas.height - 10);
    ctx.fillText(instruccion, 10, canvas.height - 10);
}
