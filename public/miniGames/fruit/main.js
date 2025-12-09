export { initFruitNinja, update }
import { teclas } from "/main.js";

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let score = 0;
let juega = true;

// configurar variables del juego
const GRAVITY = 0.15; 
// almacenar frutas activas
let fruits = [];      
// almacenar particulas de corte
let particles = [];   
// contar tiempo para lanzar frutas
let spawnTimer = 0;   

// definir posicion del mouse
const mouse = { x: 0, y: 0, px: 0, py: 0, active: false };

// escuchar movimiento del mouse
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
});

// definir tipos de objetos
const fruitTypes = [
    { color: '#ff4d4d', radius: 30, score: 10, type: 'fruit' }, // definir manzana roja
    { color: '#ffa500', radius: 25, score: 20, type: 'fruit' }, // definir naranja
    { color: '#ffff00', radius: 35, score: 15, type: 'fruit' }, // definir limon amarillo
    { color: '#333333', radius: 40, score: 0, type: 'bomb' }    // definir bomba negra
];

function initFruitNinja() {
    fruits = [];
    particles = [];
    score = 0;
    juega = true;
    spawnTimer = 0;
    
    // reiniciar posicion del mouse
    mouse.active = false;
}

function update() {
    // salir del juego si se presiona escape
    if (teclas["Escape"] || teclas["x"] || teclas["X"]) {
        juega = false;
    }

    // generar nuevas frutas
    spawnTimer++;
    if (spawnTimer > 60) { // ejecutar cada 60 frames
        spawnFruit();
        spawnTimer = 0;
    }

    // limpiar pantalla
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // pintar fondo color madera
    ctx.fillStyle = '#f4e4bc'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // actualizar y dibujar frutas
    for (let i = fruits.length - 1; i >= 0; i--) {
        let f = fruits[i];

        // calcular fisica
        f.x += f.vx;
        f.y += f.vy;
        f.vy += GRAVITY; // aplicar gravedad
        f.rotation += f.vr; // actualizar rotacion

        // dibujar fruta en canvas
        drawFruit(f);

        // detectar corte con el mouse
        if (mouse.active) {
            // calcular distancia mouse objeto
            const dist = Math.hypot(mouse.x - f.x, mouse.y - f.y);
            // calcular velocidad del corte
            const speed = Math.hypot(mouse.x - mouse.px, mouse.y - mouse.py);

            if (dist < f.radius && speed > 5) {
                sliceFruit(i, f);
            }
        }

        // eliminar fruta fuera de pantalla
        if (f.y > canvas.height + 50) {
            fruits.splice(i, 1);
        }
    }

    // actualizar y dibujar particulas
    updateParticles();

    // dibujar rastro de la espada
    drawBlade();

    // dibujar interfaz de usuario
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.font = '16px Arial';
    ctx.fillText('Corta con el Mouse / ESC para salir', 10, 55);

    // actualizar posicion previa del mouse
    mouse.px = mouse.x;
    mouse.py = mouse.y;

    return juega;
}

function spawnFruit() {
    const type = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
    
    // definir posicion inicial abajo
    const x = Math.random() * (canvas.width - 100) + 50;
    const y = canvas.height + 50;

    // calcular velocidad de lanzamiento
    const vx = (Math.random() - 0.5) * 4; // definir velocidad horizontal aleatoria
    const vy = -(Math.random() * 5 + 10); // definir fuerza vertical

    fruits.push({
        x: x, 
        y: y,
        vx: vx,
        vy: vy,
        vr: (Math.random() - 0.5) * 0.2, // definir velocidad de rotacion
        rotation: 0,
        color: type.color,
        radius: type.radius,
        score: type.score,
        type: type.type
    });
}

function sliceFruit(index, f) {
    // eliminar fruta del arreglo
    fruits.splice(index, 1);

    if (f.type === 'bomb') {
        // verificar si es bomba
        score = 0;
        createExplosion(f.x, f.y, '#000');
    } else {
        // sumar puntos al score
        score += f.score;
        createExplosion(f.x, f.y, f.color);
    }
}

function createExplosion(x, y, color) {
    // crear particulas de explosion
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0, // definir vida de la particula
            color: color
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05; // reducir vida de particula

        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 8, 8); // dibujar cuadrado de particula
            ctx.globalAlpha = 1.0;
        }
    }
}

function drawFruit(f) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rotation);

    ctx.beginPath();
    ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
    ctx.fillStyle = f.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // dibujar brillo en la fruta
    ctx.beginPath();
    ctx.arc(-f.radius/3, -f.radius/3, f.radius/4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();

    ctx.restore();
}

function drawBlade() {
    if (mouse.active) {
        ctx.beginPath();
        ctx.moveTo(mouse.px, mouse.py);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}