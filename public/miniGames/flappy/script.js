// miniGames/flappy/script.js
import { teclas } from "/main.js";

let canvas, ctx;
let juega = true;
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
// Al inicio del archivo, después de las importaciones
let requestId = null; // Para controlar el loop de animación

export function initFlappy() {
    console.log('Iniciando Flappy Bird...');
    
    // Cancelar cualquier animación previa
    if (requestId) {
        cancelAnimationFrame(requestId);
        requestId = null;
    }
    
    canvas = document.getElementById("game");
    ctx = canvas.getContext("2d");
    
    juega = true;
    
    bird.x = 150;
    bird.y = 200;
    bird.dy = 0;
    bird.width = 34;
    bird.height = 24;
    bird.visible = true;
    bird.image = new Image();
    bird.imageFlap = new Image();
    bird.image.src = 'sprites/3.png';
    bird.imageFlap.src = 'sprites/3.png';
    
    pipes = [];
    coins = [];
    score_val = 0;
    isFlapping = false;
    pipe_separation = 0;
    
    // Limpiar todas las teclas al iniciar
    Object.keys(teclas).forEach(key => teclas[key] = false);
    
    console.log('Flappy Bird iniciado');
}

export function update() {
    if (!juega) {
        // Limpiar teclas al salir
        teclas["ArrowUp"] = false;
        teclas["Escape"] = false;
        teclas["x"] = false;
        teclas["X"] = false;
        return false;
    }
    
    // Control de salto - Verifica que la tecla esté presionada Y que el pájaro no esté en el tope
    if (teclas["ArrowUp"] && bird.y > 10) {
        bird.dy = -4.5;
        isFlapping = true;
        setTimeout(() => { isFlapping = false; }, 100);
        // IMPORTANTE: Limpiar inmediatamente para evitar saltos múltiples
        teclas["ArrowUp"] = false;
    }
    
    // Salir del juego
    if (teclas["Escape"] || teclas["x"] || teclas["X"]) {
        juega = false;
        // Limpiar teclas
        teclas["Escape"] = false;
        teclas["x"] = false;
        teclas["X"] = false;
        return false;
    }
    
    // Aplicar gravedad
    const gravity = 0.35;
    bird.dy += gravity;
    bird.y += bird.dy;
    
    // Límite superior con pequeño margen
    if (bird.y <= 0) {
        bird.y = 0;
        bird.dy = 0;
    }
    
    // Límite inferior (game over)
    if (bird.y + bird.height >= canvas.height) {
        juega = false;
        teclas["ArrowUp"] = false;
        return false;
    }
    
    // Crear nuevos pipes (reducir frecuencia para evitar sobrecarga)
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
        
        // Monedas opcionales
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
    
    // Limitar número de pipes para evitar sobrecarga
    if (pipes.length > 20) {
        pipes.splice(0, pipes.length - 20);
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
            teclas["ArrowUp"] = false;
            return false;
        }
        
        // Score
        if (!pipes[i].scored && !pipes[i].isTop && pipes[i].x + pipes[i].width < bird.x) {
            score_val++;
            pipes[i].scored = true;
        }
    }
    
    // Limitar número de monedas
    if (coins.length > 10) {
        coins.splice(0, coins.length - 10);
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