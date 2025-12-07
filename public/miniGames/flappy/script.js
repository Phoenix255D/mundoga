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

// Usar solo la skin del pingüino azul (id 3)
bird.image.src = 'sprites/3.png';
bird.imageFlap.src = 'sprites/3.png';

export function initFlappy() {
    console.log('Iniciando Flappy Bird...');
    
    // Obtener el canvas del juego principal
    canvas = document.getElementById("game");
    ctx = canvas.getContext("2d");
    
    // Resetear estado del juego
    game_state = 'Play';
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
    const oldListener = window.flappyKeyListener;
    if (oldListener) {
        window.removeEventListener('keydown', oldListener);
    }
    
    // Crear nuevo listener
    const keyListener = (e) => {
        if (game_state !== 'Play') return;
        
        if (e.key === ' ' || e.key === 'ArrowUp') {
            e.preventDefault();
            bird.dy = -4;
            isFlapping = true;
            setTimeout(() => { isFlapping = false; }, 100);
        }
        
        // ESC para salir
        if (e.key === 'Escape') {
            game_state = 'End';
            cleanup();
        }
    };
    
    window.flappyKeyListener = keyListener;
    window.addEventListener('keydown', keyListener);
}

function cleanup() {
    // Limpiar listener
    if (window.flappyKeyListener) {
        window.removeEventListener('keydown', window.flappyKeyListener);
        window.flappyKeyListener = null;
    }
}

function move_pipes() {
    if (game_state !== 'Play') return;
    
    pipes.forEach((pipe, index) => {
        pipe.x -= 2;
        
        if (pipe.x + pipe.width < 0) {
            pipes.splice(index, 1);
        }
        
        // Colisión con pipes
        if (
            bird.x < pipe.x + pipe.width &&
            bird.x + bird.width > pipe.x &&
            bird.y < pipe.y + pipe.height &&
            bird.y + bird.height > pipe.y
        ) {
            game_state = 'End';
            cleanup();
            return;
        }
        
        // Aumentar score
        if (pipe.increase_score === '1' && pipe.x + pipe.width < bird.x && pipe.x + pipe.width > bird.x - 2) {
            score_val++;
        }
    });
    
    // Mover monedas
    coins.forEach((coin, index) => {
        coin.x -= 2;
        
        if (coin.x + coin.size < 0) {
            coins.splice(index, 1);
        }
        
        // Colisión con monedas
        if (
            bird.x < coin.x + coin.size &&
            bird.x + bird.width > coin.x &&
            bird.y < coin.y + coin.size &&
            bird.y + bird.height > coin.y
        ) {
            score_val += 5;
            coins.splice(index, 1);
        }
    });
    
    requestAnimationFrame(move_pipes);
}

function apply_gravity() {
    if (game_state !== 'Play') return;
    
    const gravity = 0.3;
    bird.dy += gravity;
    
    // Límites del canvas
    if (bird.y <= 0 || bird.y + bird.height >= canvas.height) {
        game_state = 'End';
        cleanup();
        return;
    }
    
    bird.y = bird.y + bird.dy;
    requestAnimationFrame(apply_gravity);
}

let pipe_separation = 0;

function create_pipe() {
    if (game_state !== 'Play') return;
    
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
    pipe_separation++;
    requestAnimationFrame(create_pipe);
}

function draw() {
    if (game_state !== 'Play') return;
    
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
    ctx.strokeText('Espacio/↑ para saltar - ESC para salir', 10, canvas.height - 10);
    ctx.fillText('Espacio/↑ para saltar - ESC para salir', 10, canvas.height - 10);
    
    requestAnimationFrame(draw);
}

export function update() {
    return game_state === 'Play';
}