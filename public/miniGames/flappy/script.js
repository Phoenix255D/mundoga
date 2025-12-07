// miniGames/flappy/script.js

let canvas, ctx;
let game_state = 'Play';
let bird = {
    x: 150,
    y: 200,
    vy: 0,
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

// Variables para controlar los loops
let animationFrames = {
    move: null,
    gravity: null,
    create: null,
    draw: null
};

let isGameRunning = false;

// Precargar imágenes
backgroundImage.src = 'imagenes/fondo.png';
pipeTopImage.src = 'imagenes/tubo.png';
pipeBottomImage.src = 'imagenes/tubo.png';

export function initFlappy() {
    console.log('Iniciando Flappy Bird...');
    
    // Limpiar cualquier instancia anterior
    cleanup();
    
    // Obtener el canvas del juego principal
    canvas = document.getElementById("game");
    ctx = canvas.getContext("2d");
    
    // Resetear estado del juego
    game_state = 'Play';
    isGameRunning = true;
    
    bird = {
        x: 150,
        y: 200,
        vy: 0,
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
    
    // Iniciar el juego
    startGame();
    
    return true;
}

function startGame() {
    // Configurar controles
    setupControls();
    
    // Iniciar loops del juego
    move_pipes();
    apply_gravity();
    create_pipe();
    draw();
}

function setupControls() {
    // Remover listeners anteriores si existen
    if (window.flappyKeyListener) {
        window.removeEventListener('keydown', window.flappyKeyListener);
    }
    
    // Crear nuevo listener
    const keyListener = (e) => {
        if (!isGameRunning) return;
        
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            bird.dy = -4;
            isFlapping = true;
            setTimeout(() => { isFlapping = false; }, 100);
        }
        
        // ESC para salir
        if (e.code === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            endGame();
        }
    };
    
    window.flappyKeyListener = keyListener;
    window.addEventListener('keydown', keyListener);
}

function endGame() {
    console.log('Finalizando Flappy Bird...');
    game_state = 'End';
    isGameRunning = false;
    cleanup();
}

function cleanup() {
    console.log('Limpiando recursos de Flappy Bird...');
    
    // Limpiar listener
    if (window.flappyKeyListener) {
        window.removeEventListener('keydown', window.flappyKeyListener);
        window.flappyKeyListener = null;
    }
    
    // Cancelar todos los animation frames
    if (animationFrames.move) {
        cancelAnimationFrame(animationFrames.move);
        animationFrames.move = null;
    }
    if (animationFrames.gravity) {
        cancelAnimationFrame(animationFrames.gravity);
        animationFrames.gravity = null;
    }
    if (animationFrames.create) {
        cancelAnimationFrame(animationFrames.create);
        animationFrames.create = null;
    }
    if (animationFrames.draw) {
        cancelAnimationFrame(animationFrames.draw);
        animationFrames.draw = null;
    }
    
    isGameRunning = false;
}

function move_pipes() {
    if (!isGameRunning || game_state !== 'Play') {
        animationFrames.move = null;
        return;
    }
    
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= 2;
        
        if (pipe.x + pipe.width < 0) {
            pipes.splice(i, 1);
            continue;
        }
        
        // Colisión con pipes
        if (
            bird.x < pipe.x + pipe.width &&
            bird.x + bird.width > pipe.x &&
            bird.y < pipe.y + pipe.height &&
            bird.y + bird.height > pipe.y
        ) {
            console.log('¡Colisión con pipe!');
            endGame();
            return;
        }
        
        // Aumentar score
        if (pipe.increase_score === '1' && pipe.x + pipe.width < bird.x && pipe.x + pipe.width > bird.x - 2) {
            score_val++;
            pipe.increase_score = '0'; // Evitar contar múltiples veces
        }
    }
    
    // Mover monedas
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.x -= 2;
        
        if (coin.x + coin.size < 0) {
            coins.splice(i, 1);
            continue;
        }
        
        // Colisión con monedas
        if (
            bird.x < coin.x + coin.size &&
            bird.x + bird.width > coin.x &&
            bird.y < coin.y + coin.size &&
            bird.y + bird.height > coin.y
        ) {
            score_val += 5;
            coins.splice(i, 1);
        }
    }
    
    animationFrames.move = requestAnimationFrame(move_pipes);
}

function apply_gravity() {
    if (!isGameRunning || game_state !== 'Play') {
        animationFrames.gravity = null;
        return;
    }
    
    const gravity = 0.3;
    bird.dy += gravity;
    bird.y += bird.dy;
    
    // Límites del canvas
    if (bird.y <= 0 || bird.y + bird.height >= canvas.height) {
        console.log('¡Colisión con límites!');
        endGame();
        return;
    }
    
    animationFrames.gravity = requestAnimationFrame(apply_gravity);
}

function create_pipe() {
    if (!isGameRunning || game_state !== 'Play') {
        animationFrames.create = null;
        return;
    }
    
    pipe_separation++;
    
    if (pipe_separation > 115) {
        pipe_separation = 0;
        
        let pipe_posi = Math.floor(Math.random() * 70) + pipe_offset;
        
        // Pipe superior
        let topHeight = (pipe_posi - pipe_top_offset) * canvas.height / 100;
        pipes.push({
            x: canvas.width,
            y: 0,
            width: 60,
            height: topHeight,
            increase_score: '0',
            isTop: true
        });
        
        // Pipe inferior
        let bottomY = (pipe_posi + pipe_gap) * canvas.height / 100;
        pipes.push({
            x: canvas.width,
            y: bottomY,
            width: 60,
            height: canvas.height - bottomY,
            increase_score: '1',
            isTop: false
        });
        
        // Agregar moneda ocasionalmente
        if (Math.random() < 0.6) {
            let coinImg = new Image();
            coinImg.src = 'imagenes/huevomoneda.webp';
            coins.push({
                x: canvas.width,
                y: (pipe_posi + (pipe_gap / 2)) * canvas.height / 100 - 15,
                size: 30,
                image: coinImg
            });
        }
    }
    
    animationFrames.create = requestAnimationFrame(create_pipe);
}

function draw() {
    if (!isGameRunning || game_state !== 'Play') {
        animationFrames.draw = null;
        return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar fondo
    if (backgroundImage.complete && backgroundImage.width > 0) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Dibujar pipes
    pipes.forEach(pipe => {
        if (pipe.isTop) {
            if (pipeTopImage.complete && pipeTopImage.width > 0) {
                ctx.save();
                ctx.translate(pipe.x, pipe.height);
                ctx.scale(1, -1);
                let numRepeat = Math.ceil(pipe.height / pipeTopImage.height);
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
                let numRepeat = Math.ceil(pipe.height / pipeBottomImage.height);
                for (let i = 0; i < numRepeat; i++) {
                    ctx.drawImage(pipeBottomImage, pipe.x, pipe.y + (i * pipeBottomImage.height), pipe.width, pipeBottomImage.height);
                }
            } else {
                ctx.fillStyle = '#5cb85c';
                ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
            }
        }
    });
    
    // Dibujar monedas
    coins.forEach(coin => {
        if (coin.image.complete) {
            ctx.drawImage(coin.image, coin.x, coin.y, coin.size, coin.size);
        }
    });
    
    // Dibujar pájaro
    if (bird.visible) {
        let birdImage = isFlapping ? bird.imageFlap : bird.image;
        if (birdImage.complete) {
            ctx.drawImage(birdImage, bird.x, bird.y, bird.width, bird.height);
        } else {
            // Fallback si la imagen no carga
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
        }
    }
    
    // Dibujar score
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = 'bold 24px Arial';
    ctx.strokeText(`Score: ${score_val}`, 10, 30);
    ctx.fillText(`Score: ${score_val}`, 10, 30);
    
    // Instrucciones
    ctx.font = '16px Arial';
    ctx.lineWidth = 2;
    ctx.strokeText('Espacio/↑ para saltar - ESC para salir', 10, canvas.height - 10);
    ctx.fillText('Espacio/↑ para saltar - ESC para salir', 10, canvas.height - 10);
    
    animationFrames.draw = requestAnimationFrame(draw);
}

export function update() {
    return isGameRunning && game_state === 'Play';
}