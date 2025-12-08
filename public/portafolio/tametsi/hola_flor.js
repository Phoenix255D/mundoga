class FlowerMinesweeper {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.hexSize = 60;
        this.mineCount = 2;
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.gameWon = false;
        this.timer = 0;
        this.timerInterval = null;
        this.touchTimer = null;
        this.centerX = 350;
        this.centerY = 350;
        this.revealedMines = 0;
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
        
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchend', () => this.handleTouchEnd());
        this.canvas.addEventListener('touchcancel', () => this.handleTouchEnd());
        
        this.restart('medium');
    }

    restart(difficulty = 'medium') {
        const difficulties = {
            easy: { mines: 1 },
            medium: { mines: 2 },
            hard: { mines: 3 }
        };

        const config = difficulties[difficulty];
        this.mineCount = config.mines;
        
        this.gameOver = false;
        this.gameWon = false;
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.timer = 0;
        this.revealedMines = 0; // NUEVO: Reiniciar contador
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timerInterval = setInterval(() => {
            if (!this.gameOver && !this.gameWon) {
                this.timer++;
                document.getElementById('timer').textContent = this.timer;
            }
        }, 1000);
        
        this.initGrid();
        this.placeMines();
        this.calculateNumbers();
        this.updateUI();
        this.draw();
        this.closeGameOver();
    }

    initGrid() {
        // Centro
        this.grid[0] = { value: 0, x: this.centerX, y: this.centerY };
        this.revealed[0] = false;
        this.flagged[0] = false;
        
        // 6 hexágonos alrededor
        const radius = this.hexSize * Math.sqrt(3);
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = this.centerX + radius * Math.cos(angle);
            const y = this.centerY + radius * Math.sin(angle);
            
            this.grid[i + 1] = { value: 0, x, y };
            this.revealed[i + 1] = false;
            this.flagged[i + 1] = false;
        }
    }

    placeMines() {
        let placed = 0;
        while (placed < this.mineCount) {
            const index = Math.floor(Math.random() * 7);
            if (this.grid[index].value !== -1) {
                this.grid[index].value = -1;
                placed++;
            }
        }
    }

    getNeighbors(index) {
        const neighbors = [];
        
        if (index === 0) {
            // Centro: todos los demás son vecinos
            for (let i = 1; i <= 6; i++) {
                neighbors.push(i);
            }
        } else {
            // Pétalos: el centro y los dos adyacentes
            neighbors.push(0);
            const prev = index === 1 ? 6 : index - 1;
            const next = index === 6 ? 1 : index + 1;
            neighbors.push(prev, next);
        }
        
        return neighbors;
    }

    calculateNumbers() {
        for (let i = 0; i < 7; i++) {
            if (this.grid[i].value !== -1) {
                const neighbors = this.getNeighbors(i);
                let count = 0;
                for (const n of neighbors) {
                    if (this.grid[n].value === -1) {
                        count++;
                    }
                }
                this.grid[i].value = count;
            }
        }
    }

    pixelToHex(x, y) {
        let closest = 0;
        let minDist = Infinity;
        
        for (let i = 0; i < 7; i++) {
            const dx = x - this.grid[i].x;
            const dy = y - this.grid[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minDist && dist < this.hexSize) {
                minDist = dist;
                closest = i;
            }
        }
        
        return closest;
    }

    drawHexagon(x, y, fillStyle, strokeStyle = '#333') {
        const size = this.hexSize;
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + Math.PI / 6;
            const hx = x + size * Math.cos(angle);
            const hy = y + size * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(hx, hy);
            } else {
                this.ctx.lineTo(hx, hy);
            }
        }
        this.ctx.closePath();
        this.ctx.fillStyle = fillStyle;
        this.ctx.fill();
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = 0; i < 7; i++) {
            const hex = this.grid[i];
            
            let color = '#3498db';
            if (this.revealed[i]) {
                // MODIFICADO: Las minas mantienen su color original
                if (hex.value === -1) {
                    color = '#3498db';
                } else {
                    color = '#ecf0f1';
                }
            } else if (this.flagged[i]) {
                color = '#f39c12';
            }
            
            this.drawHexagon(hex.x, hex.y, color);
            
            if (this.revealed[i]) {
                // MODIFICADO: Las minas no muestran el emoji
                if (hex.value === -1) {
                    // No mostrar nada
                } else if (hex.value > 0) {
                    const colors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080'];
                    this.ctx.fillStyle = colors[hex.value] || '#000';
                    this.ctx.font = 'bold 32px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(hex.value, hex.x, hex.y);
                }
            } else if (this.flagged[i]) {
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 36px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('⛳', hex.x, hex.y);
            }
        }
    }

    handleClick(e) {
        if (this.gameOver || this.gameWon) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const index = this.pixelToHex(x, y);
        this.revealTile(index);
    }

    handleRightClick(e) {
        if (this.gameOver || this.gameWon) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const index = this.pixelToHex(x, y);
        this.toggleFlag(index);
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.touchTimer = setTimeout(() => {
            const index = this.pixelToHex(x, y);
            this.toggleFlag(index);
            this.touchTimer = null;
        }, 500);
    }

    handleTouchEnd() {
        if (this.touchTimer) {
            clearTimeout(this.touchTimer);
            const e = event;
            const touch = e.changedTouches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            const index = this.pixelToHex(x, y);
            this.revealTile(index);
            this.touchTimer = null;
        }
    }

    toggleFlag(index) {
        if (this.revealed[index]) return;
        
        this.flagged[index] = !this.flagged[index];
        this.updateUI();
        this.draw();
    }

    revealTile(index) {
        if (this.revealed[index] || this.flagged[index]) return;
        if (this.grid[index].value === -1) {
            this.revealedMines++;
            this.showMineAlert();
            return;
        }
        
        this.revealed[index] = true;
        
        if (this.grid[index].value === 0) {
            const neighbors = this.getNeighbors(index);
            for (const n of neighbors) {
                if (!this.revealed[n]) {
                    this.revealTile(n);
                }
            }
        }
        
        this.checkWin();
        this.draw();
    }

    // NUEVO: Mostrar alerta temporal cuando descubres una mina
    showMineAlert() {
        const overlay = document.getElementById('overlay');
        const gameOverDiv = document.getElementById('gameOver');
        const gameOverText = document.getElementById('gameOverText');
        const gameOverMessage = document.getElementById('gameOverMessage');
        
        overlay.classList.add('show');
        gameOverDiv.classList.add('show');
        gameOverDiv.className = 'game-over show lose';
        
        gameOverText.textContent = 'Dou,encontraste una mina';
        
        setTimeout(() => {
            this.closeGameOver();
        }, 2000);
    }

    checkWin() {
        for (let i = 0; i < 7; i++) {
            if (this.grid[i].value !== -1 && !this.revealed[i]) {
                return;
            }
        }
        this.endGame(true);
    }

    endGame(won) {
        this.gameWon = true;
        clearInterval(this.timerInterval);
        this.draw();
        this.showGameOverDialog(won);
    }

    showGameOverDialog(won) {
        const overlay = document.getElementById('overlay');
        const gameOverDiv = document.getElementById('gameOver');
        const gameOverText = document.getElementById('gameOverText');
        const gameOverMessage = document.getElementById('gameOverMessage');
        
        overlay.classList.add('show');
        gameOverDiv.classList.add('show');
        gameOverDiv.className = 'game-over show win';
        
        gameOverText.textContent = 'ganaste';
        gameOverMessage.textContent = `Completaste el juego en ${this.timer} segundos. Minas descubiertas: ${this.revealedMines}`;
    }

    closeGameOver() {
        const overlay = document.getElementById('overlay');
        const gameOverDiv = document.getElementById('gameOver');
        overlay.classList.remove('show');
        gameOverDiv.classList.remove('show');
    }

    updateUI() {
        let flagCount = 0;
        for (let i = 0; i < 7; i++) {
            if (this.flagged[i]) flagCount++;
        }
        document.getElementById('flagCount').textContent = flagCount;
        document.getElementById('totalMines').textContent = this.mineCount;
    }
}

const game = new FlowerMinesweeper();