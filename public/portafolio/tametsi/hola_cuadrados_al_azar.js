class IrregularMinesweeper {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 45;
        this.gridSize = 12;
        this.mineCount = 10;
        this.cellCount = 50;
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.gameWon = false;
        this.timer = 0;
        this.timerInterval = null;
        this.touchTimer = null;
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
            easy: { cells: 30, mines: 5, size: 50 },
            medium: { cells: 50, mines: 10, size: 50 },
            hard: { cells: 70, mines: 15, size: 50 }
        };

        const config = difficulties[difficulty];
        this.cellCount = config.cells;
        this.mineCount = config.mines;
        this.cellSize = config.size;

        this.gameOver = false;
        this.gameWon = false;
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.timer = 0;
        this.revealedMines = 0;

        if (this.timerInterval) clearInterval(this.timerInterval);

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
        const tempGrid = [];
        for (let i = 0; i < this.gridSize; i++) {
            tempGrid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                const rand = Math.random();
                const distance = Math.sqrt(Math.pow(i - this.gridSize/2, 2) + Math.pow(j - this.gridSize/2, 2));
                if (distance < this.gridSize/2 && rand > 0.3) tempGrid[i][j] = true;
                else if (rand > 0.7) tempGrid[i][j] = true;
                else tempGrid[i][j] = false;
            }
        }

        let activeCells = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (tempGrid[i][j]) activeCells.push({ row: i, col: j, value: 0 });
            }
        }

        while (activeCells.length < this.cellCount) {
            const i = Math.floor(Math.random() * this.gridSize);
            const j = Math.floor(Math.random() * this.gridSize);
            if (!tempGrid[i][j]) {
                tempGrid[i][j] = true;
                activeCells.push({ row: i, col: j, value: 0 });
            }
        }

        while (activeCells.length > this.cellCount) activeCells.pop();

        this.grid = activeCells;
        this.revealed = Array(this.grid.length).fill(false);
        this.flagged = Array(this.grid.length).fill(false);
    }

    placeMines() {
        let placed = 0;
        while (placed < this.mineCount) {
            const index = Math.floor(Math.random() * this.grid.length);
            if (this.grid[index].value !== -1) {
                this.grid[index].value = -1;
                placed++;
            }
        }
    }

    getNeighbors(index) {
        const neighbors = [];
        const current = this.grid[index];
        for (let i = 0; i < this.grid.length; i++) {
            if (i === index) continue;
            const other = this.grid[i];
            const rowDiff = Math.abs(current.row - other.row);
            const colDiff = Math.abs(current.col - other.col);
            if ((rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0)) {
                neighbors.push(i);
            }
        }
        return neighbors;
    }

    calculateNumbers() {
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i].value !== -1) {
                const neighbors = this.getNeighbors(i);
                let count = 0;
                for (const n of neighbors) if (this.grid[n].value === -1) count++;
                this.grid[i].value = count;
            }
        }
    }

    cellToPixel(row, col) {
        const startX = (this.canvas.width - this.gridSize * this.cellSize) / 2;
        const startY = (this.canvas.height - this.gridSize * this.cellSize) / 2;
        return { x: startX + col * this.cellSize, y: startY + row * this.cellSize };
    }

    pixelToCell(x, y) {
        let closest = -1;
        let minDist = Infinity;
        for (let i = 0; i < this.grid.length; i++) {
            const pos = this.cellToPixel(this.grid[i].row, this.grid[i].col);
            const centerX = pos.x + this.cellSize / 2;
            const centerY = pos.y + this.cellSize / 2;
            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist && dist < this.cellSize) {
                minDist = dist;
                closest = i;
            }
        }
        return closest;
    }
    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < this.grid.length; i++) {
            const cell = this.grid[i];
            const pos = this.cellToPixel(cell.row, cell.col);
            let color = '#3498db';
                      if (this.revealed[i]) {
                if (cell.value === -1) {
                    color = '#3498db';
                } else {
                    color = '#ecf0f1';
                }
            } else if (this.flagged[i]) {
                color = '#f39c12';
            }

            const radius = 5;
            ctx.beginPath();
            ctx.moveTo(pos.x + radius, pos.y);
            ctx.lineTo(pos.x + this.cellSize - radius, pos.y);
            ctx.arcTo(pos.x + this.cellSize, pos.y, pos.x + this.cellSize, pos.y + radius, radius);
            ctx.lineTo(pos.x + this.cellSize, pos.y + this.cellSize - radius);
            ctx.arcTo(pos.x + this.cellSize, pos.y + this.cellSize, pos.x + this.cellSize - radius, pos.y + this.cellSize, radius);
            ctx.lineTo(pos.x + radius, pos.y + this.cellSize);
            ctx.arcTo(pos.x, pos.y + this.cellSize, pos.x, pos.y + this.cellSize - radius, radius);
            ctx.lineTo(pos.x, pos.y + radius);
            ctx.arcTo(pos.x, pos.y, pos.x + radius, pos.y, radius);
            ctx.closePath();

            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();

            const centerX = pos.x + this.cellSize / 2;
            const centerY = pos.y + this.cellSize / 2;

            if (this.revealed[i]) {
                if (cell.value === -1) {
                } else if (cell.value > 0) {
                    const colors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000'];
                    ctx.fillStyle = colors[cell.value] || '#000';
                    ctx.font = 'bold 20px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(cell.value, centerX, centerY);
                }
            } else if (this.flagged[i]) {
                ctx.fillStyle = 'white';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⛳', centerX, centerY);
            }
        }
    }

    handleClick(e) {
        if (this.gameOver || this.gameWon) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const index = this.pixelToCell(x, y);
        if (index >= 0) this.revealTile(index);
    }

    handleRightClick(e) {
        if (this.gameOver || this.gameWon) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const index = this.pixelToCell(x, y);
        if (index >= 0) this.toggleFlag(index);
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        this.touchTimer = setTimeout(() => {
            const index = this.pixelToCell(x, y);
            if (index >= 0) this.toggleFlag(index);
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
            const index = this.pixelToCell(x, y);
            if (index >= 0) this.revealTile(index);
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
            for (const n of neighbors) if (!this.revealed[n]) this.revealTile(n);
        }
        
        this.checkWin();
        this.draw();
    }

    showMineAlert() {
        const overlay = document.getElementById('overlay');
        const gameOverDiv = document.getElementById('gameOver');
        const gameOverText = document.getElementById('gameOverText');
        const gameOverMessage = document.getElementById('gameOverMessage');
        
        overlay.classList.add('show');
        gameOverDiv.classList.add('show');
        gameOverDiv.className = 'game-over show lose';
        
        gameOverText.textContent = 'Dou, encontraste una mina';
        gameOverMessage.textContent = '';
        
        setTimeout(() => {
            this.closeGameOver();
        }, 2000);
    }

    checkWin() {
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i].value !== -1 && !this.revealed[i]) return;
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
        
        gameOverText.textContent = 'Ganaste, yipiee';
        gameOverMessage.textContent = `Completaste el juego en ${this.timer} segundos. Minas descubiertas: ${this.revealedMines}`;
    }

    closeGameOver() {
        document.getElementById('overlay').classList.remove('show');
        document.getElementById('gameOver').classList.remove('show');
    }

    updateUI() {
        const flagCount = this.flagged.filter(f => f).length;
        document.getElementById('flagCount').textContent = flagCount;
        document.getElementById('totalMines').textContent = this.mineCount;
    }
}

const game = new IrregularMinesweeper();