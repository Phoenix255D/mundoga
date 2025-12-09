document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const startButton2 = document.getElementById('startButton2');
    const resetButton = document.getElementById('resetButton');

    let gameRunning = false; 
    let gameOver = false; 
    let animationFrameId; 
    let score = 0;
    let de_a_dos = false;

    const chicken = new Image();
    const car1 = new Image();
    const car2 = new Image();
    const car3 = new Image();
    const car4 = new Image();
    const car5 = new Image();

    chicken.src = "si1.png";
    car5.src = "si2.png";
    car1.src = "carro1.png";
    car2.src = "carro2.png";
    car3.src = "carro3.png";
    car4.src = "carro4.png";

    const carritos = [car1, car2, car3, car4];

    const player = { x: canvas.width / 2, y: canvas.height - 120, radius: 20, speed: 35 };
    const player2 = { x: canvas.width / 2, y: canvas.height - 50, radius: 20, speed: 35 };

    const backgroundImage = new Image();
    backgroundImage.src = "carriles.png";

    function drawPlayer() { ctx.drawImage(chicken, player.x - 20, player.y - 20, 100, 80); }
    function drawPlayer2() { if (de_a_dos) ctx.drawImage(car5, player2.x - 20, player2.y - 20, 100, 80); }

    class Block {
        constructor(x, y, dy, img) { 
            this.x = x;
            this.y = y;
            this.width = 100;
            this.height = 80;
            this.dy = dy;
            this.img = img;
        }
        draw() { ctx.drawImage(this.img, this.x, this.y, this.width, this.height); }
        update() {
            this.y += this.dy;
            if (this.y > canvas.height) {
                this.y = -this.height;
                const columnWidth = canvas.width / 4;
                const columnIndex = Math.floor(Math.random() * 3);
                this.x = columnIndex * columnWidth + (columnWidth - this.width) / 2;
                this.img = carritos[Math.floor(Math.random() * carritos.length)];
                this.dy = 2;
                score += 1;
            }
        }
        collides(player) {
            return player.x + player.radius > this.x && player.x - player.radius < this.x + this.width &&
                   player.y + player.radius > this.y && player.y - player.radius < this.y + this.height;
        }
    }

    const blocks = [];
    const blockCount = 10;

    function initializeBlocks() {
        blocks.length = 0;
        for (let i = 0; i < blockCount; i++) {
            const columnWidth = canvas.width / 4;
            const columnIndex = Math.floor(Math.random() * 3);
            const x = columnIndex * columnWidth + (columnWidth - 100) / 2;
            const y = -80 - (i * 120); 
            const dy = 2;
            const img = carritos[Math.floor(Math.random() * carritos.length)];
            blocks.push(new Block(x, y, dy, img));
        }
    }

    function gameLoop() {
        if (!gameRunning) return;
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        for (const block of blocks) {
            block.update();
            block.draw();
            if (block.collides(player) || (de_a_dos && block.collides(player2))) {
                gameOver = true;
                gameRunning = false;
                cancelAnimationFrame(animationFrameId);
                startButton.disabled = true;
                startButton2.disabled = true;
                alert('Ya vete del ciber 8B, obtuviste: ' + score + ' puntos');
                return;
            }
        }
        drawPlayer();
        drawPlayer2();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    document.addEventListener('keydown', (e) => {
        if (!gameRunning || gameOver) return;
        const columnWidth = canvas.width / 4;
        const laneCenters = [columnWidth/2, columnWidth*1.5, columnWidth*2.5, columnWidth*3.5];

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            let currentLane = laneCenters.reduce((closest, x, i) => Math.abs(player.x - x) < Math.abs(player.x - laneCenters[closest]) ? i : closest, 0);
            if (e.key === 'ArrowLeft' && currentLane > 0) currentLane--;
            if (e.key === 'ArrowRight' && currentLane < 3) currentLane++;
            player.x = laneCenters[currentLane];
        }

        if (de_a_dos && ['a','d'].includes(e.key)) {
            let currentLane2 = laneCenters.reduce((closest, x, i) => Math.abs(player2.x - x) < Math.abs(player2.x - laneCenters[closest]) ? i : closest, 0);
            if (e.key === 'a' && currentLane2 > 0) currentLane2--;
            if (e.key === 'd' && currentLane2 < 3) currentLane2++;
            player2.x = laneCenters[currentLane2];
        }
    });

    startButton.addEventListener('click', () => {
        if (!gameRunning && !gameOver) {
            de_a_dos = false;
            initializeBlocks();
            if (backgroundImage.complete) {
                gameRunning = true;
                startButton.disabled = true;
                startButton2.disabled = true;
                gameLoop();
            }
        }
    });

    startButton2.addEventListener('click', () => {
        if (!gameRunning && !gameOver) {
            de_a_dos = true;
            initializeBlocks();
            if (backgroundImage.complete) {
                gameRunning = true;
                startButton.disabled = true;
                startButton2.disabled = true;
                gameLoop();
            }
        }
    });

    resetButton.addEventListener('click', () => { location.reload(); score = 0; });

    function drawInitialScreen() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = '25px Papyrus';
        ctx.textAlign = 'center';
        ctx.fillText('Pulsa "Iniciar Juego" para 1 jugador o "Iniciar 2 jugadores" para 2 jugadores', canvas.width / 2, canvas.height / 2);
    }

    drawInitialScreen();
});
