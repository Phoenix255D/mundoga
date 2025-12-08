class HexagonalMinesweeper {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.hexSize = 30;
        this.rows = 8;
        this.cols = 8;
        this.mineCount = 12;
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.hexColors = [];
        this.questionMarks = [];
        this.gameOver = false;
        this.gameWon = false;
        this.timer = 0;
        this.timerInterval = null;
        this.touchTimer = null;
        this.difficulty = 'medium';
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
            easy: { rows: 8, cols: 8, mines: 8, radius: 3 },
            medium: { rows: 12, cols: 12, mines: 18, radius: 5 },
            hard: { rows: 16, cols: 16, mines: 35, radius: 7 }
        };

        const config = difficulties[difficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mineCount = config.mines;
        this.radius = config.radius;
        this.difficulty = difficulty;
        
        this.gameOver = false;
        this.gameWon = false;
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.hexColors = [];
        this.questionMarks = [];
        this.timer = 0;
        this.revealedMines = 0;
        
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
        
        if (this.difficulty === 'hard') {
            this.placeQuestionMarks();
        }
        
        this.updateUI();
        this.draw();
        this.closeGameOver();
    }

    initGrid() {
        for (let i = 0; i < this.rows; i++) {
            this.grid[i] = [];
            this.revealed[i] = [];
            this.flagged[i] = [];
            this.hexColors[i] = [];
            this.questionMarks[i] = [];
            for (let j = 0; j < this.cols; j++) {
                const centerRow = this.rows / 2;
                const centerCol = this.cols / 2;
                const distance = Math.sqrt(Math.pow(i - centerRow, 2) + Math.pow(j - centerCol, 2));
                
                if (distance <= this.radius) {
                    this.grid[i][j] = 0;
                    this.revealed[i][j] = false;
                    this.flagged[i][j] = false;
                    this.questionMarks[i][j] = false;
                    
                    if (this.difficulty === 'hard') {
                        this.hexColors[i][j] = this.assignHexColor(i, j);
                    } else {
                        this.hexColors[i][j] = 'blue';
                    }
                } else {
                    this.grid[i][j] = null;
                    this.hexColors[i][j] = null;
                }
            }
        }
    }

    assignHexColor(row, col) {
        const centerRow = this.rows / 2;
        const centerCol = this.cols / 2;
        const relRow = row - centerRow;
        const relCol = col - centerCol;
        
        if (relRow < -1 && relCol < -1) {
            return 'red';
        }
        else if (relRow < -1 && relCol > 1) {
            return 'yellow';
        }
        else if (relRow > 1 && relCol < -1) {
            return 'purple';
        }
        else if (relRow > 1 && relCol > 1) {
            return 'green';
        }
        else {
            return 'blue';
        }
    }

    placeMines() {
        let placed = 0;
        while (placed < this.mineCount) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            if (this.grid[row][col] !== null && this.grid[row][col] !== -1) {
                this.grid[row][col] = -1;
                placed++;
            }
        }
    }

    placeQuestionMarks() {
        let placed = 0;
        const minQuestions = 5;
        
        while (placed < minQuestions) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            if (this.grid[row][col] !== null && 
                this.grid[row][col] !== -1 && 
                !this.questionMarks[row][col]) {
                this.questionMarks[row][col] = true;
                placed++;
            }
        }
    }

    getNeighbors(row, col) {
        const neighbors = [];
        const isEvenRow = row % 2 === 0;
        
        const offsets = isEvenRow ? [
            [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
        ] : [
            [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
        ];

        for (const [dr, dc] of offsets) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols && this.grid[newRow][newCol] !== null) {
                neighbors.push([newRow, newCol]);
            }
        }

        return neighbors;
    }

    calculateNumbers() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.grid[i][j] !== null && this.grid[i][j] !== -1) {
                    const neighbors = this.getNeighbors(i, j);
                    let count = 0;
                    for (const [nr, nc] of neighbors) {
                        if (this.grid[nr][nc] === -1) {
                            count++;
                        }
                    }
                    this.grid[i][j] = count;
                }
            }
        }
    }

    hexToPixel(row, col) {
        const size = this.hexSize;
        const width = Math.sqrt(3) * size;
        const height = 2 * size * 0.75;
        
        const x = col * width + (row % 2) * (width / 2) + width;
        const y = row * height + size * 1.5;
        
        return { x, y };
    }

    pixelToHex(x, y) {
        const size = this.hexSize;
        const width = Math.sqrt(3) * size;
        const height = 2 * size * 0.75;
        
        let row = Math.round((y - size * 1.5) / height);
        let col = Math.round((x - width - (row % 2) * (width / 2)) / width);
        
        row = Math.max(0, Math.min(this.rows - 1, row));
        col = Math.max(0, Math.min(this.cols - 1, col));
        
        return { row, col };
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
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    getHexColorValue(colorName) {
        const colors = {
            'blue': '#3498db',
            'red': '#e74c3c',
            'yellow': '#f1c40f',
            'purple': '#9b59b6',
            'green': '#2ecc71'
        };
        return colors[colorName] || '#3498db';
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.grid[i][j] === null) continue;
                const pos = this.hexToPixel(i, j);
                
                let color;
                if (this.revealed[i][j]) {
                    // MODIFICADO: Las minas no cambian de color cuando se revelan
                    if (this.grid[i][j] === -1) {
                        color = this.getHexColorValue(this.hexColors[i][j]);
                    } else {
                        color = '#ecf0f1';
                    }
                } else if (this.flagged[i][j]) {
                    color = '#e67e22';
                } else {
                    color = this.getHexColorValue(this.hexColors[i][j]);
                }
                
                this.drawHexagon(pos.x, pos.y, color);
                
                if (this.revealed[i][j]) {
                    // MODIFICADO: Las minas ya no muestran el emoji de bomba
                    if (this.grid[i][j] === -1) {
                        // No mostrar nada, dejar la casilla vacía
                    } else if (this.questionMarks[i][j]) {
                        this.ctx.fillStyle = '#e67e22';
                        this.ctx.font = 'bold 20px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText('❓', pos.x, pos.y);
                    } else if (this.grid[i][j] > 0) {
                        const colors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000'];
                        this.ctx.fillStyle = colors[this.grid[i][j]] || '#000';
                        this.ctx.font = 'bold 16px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(this.grid[i][j], pos.x, pos.y);
                    }
                } else if (this.flagged[i][j]) {
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = 'bold 20px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('⛳', pos.x, pos.y);
                }
            }
        }
    }

    handleClick(e) {
        if (this.gameOver || this.gameWon) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const { row, col } = this.pixelToHex(x, y);
        this.revealTile(row, col);
    }

    handleRightClick(e) {
        if (this.gameOver || this.gameWon) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const { row, col } = this.pixelToHex(x, y);
        this.toggleFlag(row, col);
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.touchTimer = setTimeout(() => {
            const { row, col } = this.pixelToHex(x, y);
            this.toggleFlag(row, col);
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
            const { row, col } = this.pixelToHex(x, y);
            this.revealTile(row, col);
            this.touchTimer = null;
        }
    }

    toggleFlag(row, col) {
        if (this.grid[row][col] === null || this.revealed[row][col]) return;
        
        this.flagged[row][col] = !this.flagged[row][col];
        this.updateUI();
        this.draw();
    }

    revealTile(row, col) {
        if (this.grid[row][col] === null || this.revealed[row][col] || this.flagged[row][col]) return;
        
        // MODIFICADO: Si es una mina, NO marcarla como revelada, solo dar aviso
        if (this.grid[row][col] === -1) {
            this.revealedMines++;
            this.showMineAlert();
            return; // No revelar la casilla
        }
        
        // Solo revelar si NO es una mina
        this.revealed[row][col] = true;
        
        if (this.grid[row][col] === 0) {
            const neighbors = this.getNeighbors(row, col);
            for (const [nr, nc] of neighbors) {
                if (!this.revealed[nr][nc]) {
                    this.revealTile(nr, nc);
                }
            }
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
        
        setTimeout(() => {
            this.closeGameOver();
        }, 2000);
    }

    checkWin() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.grid[i][j] !== null && this.grid[i][j] !== -1 && !this.revealed[i][j]) {
                    return;
                }
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
        
        gameOverText.textContent = 'Ganaste, yipiee';
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
        let redMines = 0, yellowMines = 0, purpleMines = 0, blueMines = 0, greenMines = 0;
        let redFlags = 0, yellowFlags = 0, purpleFlags = 0, blueFlags = 0, greenFlags = 0;
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.grid[i][j] === null) continue;
                
                if (this.flagged[i][j]) {
                    flagCount++;
                    if (this.difficulty === 'hard') {
                        if (this.hexColors[i][j] === 'red') redFlags++;
                        else if (this.hexColors[i][j] === 'yellow') yellowFlags++;
                        else if (this.hexColors[i][j] === 'purple') purpleFlags++;
                        else if (this.hexColors[i][j] === 'green') greenFlags++;
                        else blueFlags++;
                    }
                }
                
                if (this.grid[i][j] === -1 && this.difficulty === 'hard') {
                    if (this.hexColors[i][j] === 'red') redMines++;
                    else if (this.hexColors[i][j] === 'yellow') yellowMines++;
                    else if (this.hexColors[i][j] === 'purple') purpleMines++;
                    else if (this.hexColors[i][j] === 'green') greenMines++;
                    else blueMines++;
                }
            }
        }
        
        document.getElementById('flagCount').textContent = flagCount;
        document.getElementById('totalMines').textContent = this.mineCount;
        
        if (this.difficulty === 'hard') {
            const colorCounters = document.getElementById('colorCounters');
            const redCounter = document.getElementById('redCount');
            const yellowCounter = document.getElementById('yellowCount');
            const purpleCounter = document.getElementById('purpleCount');
            const greenCounter = document.getElementById('greenCount');
            
            if (colorCounters) colorCounters.style.display = 'inline';
            if (redCounter) redCounter.textContent = `${redFlags}/${redMines}`;
            if (yellowCounter) yellowCounter.textContent = `${yellowFlags}/${yellowMines}`;
            if (purpleCounter) purpleCounter.textContent = `${purpleFlags}/${purpleMines}`;
            if (greenCounter) greenCounter.textContent = `${greenFlags}/${greenMines}`;
        } else {
            const colorCounters = document.getElementById('colorCounters');
            if (colorCounters) colorCounters.style.display = 'none';
        }
    }
}

const game = new HexagonalMinesweeper();