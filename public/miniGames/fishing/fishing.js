export { initFishing, update }
import { teclas } from "/main.js";

function salirDelJuego() {
    if (window.parent && window.parent.cerrarMinijuego) {
        window.parent.cerrarMinijuego();
    } else {
        alert("No se puede cerrar: No estás dentro del juego principal.");
    }
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const GRID = 64;
let score = 0;
let juega = true;

const hook = {
    x: canvas.width / 2,
    y: 100,
    w: 10,
    h: 20,
    speed: 5,
    color: '#ffffff',
    hasFish: null //
};

// config de los pecesitos y basura
const lanes = [
    { y: 200, baseSpeed: 1.5, count: 2, color: '#586cb5ff', value: 10 },
    { y: 250, baseSpeed: -2, count: 1, color: '#555555', value: 0 },
    { y: 300, baseSpeed: -2.5, count: 3, color: '#ff9800', value: 20 },
    { y: 350, baseSpeed: 3, count: 1, color: '#555555', value: 0 },
    { y: 400, baseSpeed: 3, count: 2, color: '#abf436ff', value: 30 },
    { y: 500, baseSpeed: -1.5, count: 2, color: '#e72121ff', value: 50 },
];

let fishes = [];

function initFishing() {
    fishes = [];
    score = 0;
    juega = true;
    hook.y = 100;
    hook.hasFish = null;

    lanes.forEach(lane => {
        for (let i = 0; i < lane.count; i++) {
            fishes.push({
                x: Math.random() * canvas.width,
                y: lane.y,
                w: lane.value === 0 ? 40 : 50,
                h: 30,
                baseSpeed: lane.baseSpeed,
                color: lane.color,
                value: lane.value,
                caught: false
            });
        }
    });
}

function update() {
    const difficultyMultiplier = 1 + (score / 500);

    // Movimiento de la caña
    if (teclas["ArrowUp"]) {
        hook.y -= hook.speed;
    }
    if (teclas["ArrowDown"]) {
        hook.y += hook.speed;
    }

    // Salir del juego
    if (teclas["Escape"] || teclas["x"] || teclas["X"]) {
        juega = false;
    }

    if (hook.y < 100) hook.y = 100;
    if (hook.y > canvas.height - hook.h) hook.y = canvas.height - hook.h;

    if (hook.hasFish) {
        hook.hasFish.x = hook.x - (hook.hasFish.w / 2) + (hook.w / 2);
        hook.hasFish.y = hook.y + hook.h;


        if (hook.y <= 100) {
            if (hook.hasFish.value === 0) {
                // reiniciar puntaje
                score = 0;
            } else {
                score += hook.hasFish.value;
            }

            respawnFish(hook.hasFish);
            hook.hasFish = null;
        }
    }

    // Respawn de los peces
    fishes.forEach(fish => {
        if (!fish.caught) {

            const currentSpeed = fish.baseSpeed * difficultyMultiplier;
            fish.x += currentSpeed;

            if (currentSpeed > 0 && fish.x > canvas.width) fish.x = -fish.w;
            if (currentSpeed < 0 && fish.x + fish.w < 0) fish.x = canvas.width;

            if (!hook.hasFish && checkCollision(hook, fish)) {
                hook.hasFish = fish;
                fish.caught = true;
            }
        }
    });

    draw();
    return juega;
}

function respawnFish(fish) {
    fish.caught = false;
    fish.x = fish.baseSpeed > 0 ? -fish.w : canvas.width;
}

function checkCollision(h, f) {

    return (
        h.x < f.x + f.w &&
        h.x + h.w > f.x &&
        h.y < f.y + f.h &&
        h.y + h.h > f.y
    );
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#006994';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, 100);

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(canvas.width / 2 - 60, 40, 120, 60);

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 40);
    ctx.lineTo(hook.x + hook.w / 2, hook.y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = hook.color;
    ctx.fillRect(hook.x, hook.y, hook.w, hook.h);

    fishes.forEach(fish => {
        ctx.fillStyle = fish.color;

        if (fish.value === 0) {

            ctx.fillRect(fish.x, fish.y, fish.w, fish.h);

            ctx.fillStyle = '#333';
            ctx.fillRect(fish.x + 5, fish.y + 5, fish.w - 10, fish.h - 10);
        } else {
            ctx.fillRect(fish.x, fish.y, fish.w, fish.h);
            ctx.fillStyle = 'white';

            if (fish.baseSpeed > 0) {
                ctx.fillRect(fish.x + fish.w - 10, fish.y + 5, 5, 5);
            } else {
                ctx.fillRect(fish.x + 5, fish.y + 5, 5, 5);
            }
        }
    });

    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + score, 10, 30);

    ctx.font = '16px Arial';
    ctx.fillText('Presiona ESC para salir', 10, 55);
}
