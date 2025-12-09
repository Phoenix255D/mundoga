export { initTametsi, update }
import { teclas } from "/main.js";

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// configurar variables globales
let grid = [];
let cols = 10;
let rows = 10;
let w = 40; // ancho de celda
let totalMines = 15;
let juega = true;
let gameOver = false;
let gameWon = false;

// definir estado del mouse
const mouse = { x: 0, y: 0, clicked: false, rightClicked: false };

// escuchar evento de click izquierdo
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    
    if (e.button === 0) {
        mouse.clicked = true;
    } else if (e.button === 2) {
        mouse.rightClicked = true;
    }
});

// prevenir menu contextual con click derecho
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

function initTametsi() {
    // reiniciar variables
    grid = [];
    juega = true;
    gameOver = false;
    gameWon = false;
    mouse.clicked = false;
    mouse.rightClicked = false;

    // crear matriz de celdas
    for (let i = 0; i < cols; i++) {
        grid[i] = [];
        for (let j = 0; j < rows; j++) {
            grid[i][j] = {
                x: i * w,
                y: j * w,
                mine: false,
                revealed: false,
                flagged: false,
                neighborCount: 0
            };
        }
    }

    // colocar minas aleatoriamente
    let minesPlaced = 0;
    while (minesPlaced < totalMines) {
        let i = Math.floor(Math.random() * cols);
        let j = Math.floor(Math.random() * rows);
        if (!grid[i][j].mine) {
            grid[i][j].mine = true;
            minesPlaced++;
        }
    }

    // calcular numeros de vecinos
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (!grid[i][j].mine) {
                let total = 0;
                // recorrer vecinos
                for (let xoff = -1; xoff <= 1; xoff++) {
                    for (let yoff = -1; yoff <= 1; yoff++) {
                        let iOff = i + xoff;
                        let jOff = j + yoff;
                        if (iOff > -1 && iOff < cols && jOff > -1 && jOff < rows) {
                            if (grid[iOff][jOff].mine) {
                                total++;
                            }
                        }
                    }
                }
                grid[i][j].neighborCount = total;
            }
        }
    }
}

function update() {
    // salir del juego
    if (teclas["Escape"] || teclas["x"] || teclas["X"]) {
        juega = false;
    }

    // reiniciar juego con tecla r
    if ((gameOver || gameWon) && (teclas["r"] || teclas["R"])) {
        initTametsi();
    }

    // procesar click del usuario
    if (!gameOver && !gameWon) {
        if (mouse.clicked || mouse.rightClicked) {
            // obtener indices de la celda
            let i = Math.floor(mouse.x / w);
            let j = Math.floor(mouse.y / w);

            if (i >= 0 && i < cols && j >= 0 && j < rows) {
                let cell = grid[i][j];

                if (mouse.rightClicked) {
                    // alternar bandera
                    if (!cell.revealed) {
                        cell.flagged = !cell.flagged;
                    }
                } else if (mouse.clicked && !cell.flagged) {
                    // revelar celda
                    reveal(cell, i, j);
                    checkWin();
                }
            }
            // limpiar flags de mouse
            mouse.clicked = false;
            mouse.rightClicked = false;
        }
    }

    draw();
    return juega;
}

function reveal(cell, i, j) {
    if (cell.revealed || cell.flagged) return;
    
    cell.revealed = true;

    if (cell.mine) {
        // perder juego
        gameOver = true;
        revealAll();
    } else if (cell.neighborCount === 0) {
        // aplicar expansion recursiva
        for (let xoff = -1; xoff <= 1; xoff++) {
            for (let yoff = -1; yoff <= 1; yoff++) {
                let iOff = i + xoff;
                let jOff = j + yoff;
                if (iOff > -1 && iOff < cols && jOff > -1 && jOff < rows) {
                    let neighbor = grid[iOff][jOff];
                    if (!neighbor.revealed) {
                        reveal(neighbor, iOff, jOff);
                    }
                }
            }
        }
    }
}

function revealAll() {
    // mostrar todas las celdas
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            grid[i][j].revealed = true;
        }
    }
}

function checkWin() {
    let revealedCount = 0;
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (grid[i][j].revealed) {
                revealedCount++;
            }
        }
    }
    // verificar condicion de victoria
    if (revealedCount === (cols * rows - totalMines)) {
        gameWon = true;
        revealAll();
    }
}

function draw() {
    // limpiar pantalla
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // centrar tablero visualmente
    const offsetX = (canvas.width - (cols * w)) / 2;
    const offsetY = (canvas.height - (rows * w)) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let cell = grid[i][j];
            let x = cell.x;
            let y = cell.y;

            ctx.strokeStyle = '#555';
            ctx.strokeRect(x, y, w, w);

            if (cell.revealed) {
                if (cell.mine) {
                    // dibujar mina
                    ctx.fillStyle = '#e74c3c';
                    ctx.fillRect(x, y, w, w);
                    ctx.fillStyle = 'black';
                    ctx.beginPath();
                    ctx.arc(x + w * 0.5, y + w * 0.5, w * 0.25, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // dibujar celda vacia
                    ctx.fillStyle = '#ecf0f1';
                    ctx.fillRect(x, y, w, w);
                    if (cell.neighborCount > 0) {
                        ctx.fillStyle = 'black';
                        ctx.font = '20px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(cell.neighborCount, x + w * 0.5, y + w * 0.5);
                    }
                }
            } else {
                // dibujar celda oculta
                ctx.fillStyle = '#34495e';
                ctx.fillRect(x, y, w, w);
                
                if (cell.flagged) {
                    // dibujar bandera
                    ctx.fillStyle = '#f1c40f';
                    ctx.beginPath();
                    ctx.moveTo(x + w * 0.3, y + w * 0.8);
                    ctx.lineTo(x + w * 0.3, y + w * 0.2);
                    ctx.lineTo(x + w * 0.7, y + w * 0.5);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            ctx.strokeRect(x, y, w, w);
        }
    }
    ctx.restore();

    // dibujar textos de estado
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText('Click Izq: Revelar | Click Der: Bandera', 10, 10);

    if (gameOver) {
        ctx.fillStyle = 'red';
        ctx.font = '30px Arial';
        ctx.fillText('PERDISTE - Presiona R', 10, 40);
    } else if (gameWon) {
        ctx.fillStyle = 'green';
        ctx.font = '30px Arial';
        ctx.fillText('GANASTE! - Presiona R', 10, 40);
    }
}