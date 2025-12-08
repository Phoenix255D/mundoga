class TriangleMinesweeper {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.triSize = 40;
        this.rows = 7;
        this.cols = 10;
        this.mineCount = 10;
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.triColors = [];
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
            easy: { rows: 5, cols: 8, mines: 5, size: 60 },
            medium: { rows: 7, cols: 10, mines: 10, size: 60 },
            hard: { rows: 9, cols: 12, mines: 20, size: 60 }
        };

        const config = difficulties[difficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mineCount = config.mines;
        this.triSize = config.size;
        this.difficulty = difficulty;
        
        this.gameOver = false;
        this.gameWon = false;
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.triColors = [];
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
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            this.revealed[row] = [];
            this.flagged[row] = [];
            this.triColors[row] = [];
            this.questionMarks[row] = [];
            
            for (let col = 0; col < this.cols; col++) {
                // Alternar orientación basado en posición
                this.grid[row][col] = {
                    value: 0,
                    pointsUp: (row + col) % 2 === 0
                };
                this.revealed[row][col] = false;
                this.flagged[row][col] = false;
                this.questionMarks[row][col] = false;
                
                if (this.difficulty === 'hard') {
                    this.triColors[row][col] = this.assignTriColor(row, col);
                } else {
                    this.triColors[row][col] = 'white';
                }
            }
        }
    }

    assignTriColor(row, col) {
        const centerRow = this.rows / 2;
        const centerCol = this.cols / 2;
        const relRow = row - centerRow;
        const relCol = col - centerCol;
        
        if (relRow < -1 && relCol < -2) {
            return 'red';
        }
        else if (relRow < -1 && relCol > 2) {
            return 'yellow';
        }
        else if (relRow > 1 && relCol < -2) {
            return 'purple';
        }
        else if (relRow > 1 && relCol > 2) {
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
            
            if (this.grid[row][col].value !== -1) {
                this.grid[row][col].value = -1;
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
            
            if (this.grid[row][col].value !== -1 && 
                !this.questionMarks[row][col]) {
                this.questionMarks[row][col] = true;
                placed++;
            }
        }
    }

    getNeighbors(row, col) {
        const neighbors = [];
        const isPointingUp = this.grid[row][col].pointsUp;
        
        if (col > 0) neighbors.push([row, col - 1]);
        if (col < this.cols - 1) neighbors.push([row, col + 1]);
        
        if (isPointingUp) {
            if (row < this.rows - 1) {
                neighbors.push([row + 1, col]);
            }
        } else {
            if (row > 0) {
                neighbors.push([row - 1, col]);
            }
        }
        
        return neighbors;
    }

    calculateNumbers() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col].value !== -1) {
                    const neighbors = this.getNeighbors(row, col);
                    let count = 0;
                    for (const [nr, nc] of neighbors) {
                        if (this.grid[nr][nc].value === -1) {
                            count++;
                        }
                    }
                    this.grid[row][col].value = count;
                }
            }
        }
    }

    triToPixel(row, col) {
        const height = this.triSize * Math.sqrt(3) / 2;
        const width = this.triSize / 2;
        
        const totalWidth = this.cols * width;
        const totalHeight = this.rows * height;
        const startX = (this.canvas.width - totalWidth) / 2;
        const startY = (this.canvas.height - totalHeight) / 2 + 50;
        
        const x = startX + col * width;
        const y = startY + row * height;
        
        return { x, y };
    }

    pixelToTri(x, y) {
        const height = this.triSize * Math.sqrt(3) / 2;
        const width = this.triSize / 2;
        
        const totalWidth = this.cols * width;
        const totalHeight = this.rows * height;
        const startX = (this.canvas.width - totalWidth) / 2;
        const startY = (this.canvas.height - totalHeight) / 2 + 50;
        
        let col = Math.floor((x - startX) / width);
        let row = Math.floor((y - startY) / height);
        
        col = Math.max(0, Math.min(this.cols - 1, col));
        row = Math.max(0, Math.min(this.rows - 1, row));
        
        return { row, col };
    }

    getTriColorValue(colorName) {
        const colors = {
            'blue': '#3498db',
            'red': '#e74c3c',
            'yellow': '#f1c40f',
            'purple': '#9b59b6',
            'green': '#2ecc71'
        };
        return colors[colorName] || '#3498db';
    }

    drawTriangle(x, y, pointsUp, fillStyle, strokeStyle = '#333') {
        const height = this.triSize * Math.sqrt(3) / 2;
        const width = this.triSize;
        
        this.ctx.beginPath();
        if (pointsUp) {
            this.ctx.moveTo(x - 1, y + height + 1);
            this.ctx.lineTo(x + width / 2, y - 1);
            this.ctx.lineTo(x + width + 1, y + height + 1);
        } else {
            this.ctx.moveTo(x - 1, y - 1);
            this.ctx.lineTo(x + width + 1, y - 1);
            this.ctx.lineTo(x + width / 2, y + height + 1);
        }
        this.ctx.closePath();
        
        this.ctx.fillStyle = fillStyle;
        this.ctx.fill();
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const pos = this.triToPixel(row, col);
                const tri = this.grid[row][col];
                
                let color;
                if (this.revealed[row][col]) {
                    if (tri.value === -1) {
                        color = this.getTriColorValue(this.triColors[row][col]);
                    } else {
                        color = '#ecf0f1';
                    }
                } else if (this.flagged[row][col]) {
                    color = '#e67e22';
                } else {
                    color = this.getTriColorValue(this.triColors[row][col]);
                }
                
                this.drawTriangle(pos.x, pos.y, tri.pointsUp, color);
                
                const height = this.triSize * Math.sqrt(3) / 2;
                const centerX = pos.x + this.triSize / 2;
                const centerY = pos.y + height / 2;
                
                if (this.revealed[row][col]) {
                    if (tri.value === -1) {
                    } else if (this.questionMarks[row][col]) {
                        this.ctx.fillStyle = '#e67e22';
                        this.ctx.font = 'bold 20px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText('❓', centerX, centerY);
                    } else if (tri.value > 0) {
                        const colors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080'];
                        this.ctx.fillStyle = colors[tri.value] || '#000';
                        this.ctx.font = 'bold 16px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(tri.value, centerX, centerY);
                    }
                } else if (this.flagged[row][col]) {
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = 'bold 20px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('⛳', centerX, centerY);
                }
            }
        }
    }

    handleClick(e) {
        if (this.gameOver || this.gameWon) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const { row, col } = this.pixelToTri(x, y);
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.revealTile(row, col);
        }
    }

    handleRightClick(e) {
        if (this.gameOver || this.gameWon) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const { row, col } = this.pixelToTri(x, y);
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.toggleFlag(row, col);
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.touchTimer = setTimeout(() => {
            const { row, col } = this.pixelToTri(x, y);
            if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                this.toggleFlag(row, col);
            }
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
            const { row, col } = this.pixelToTri(x, y);
            if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                this.revealTile(row, col);
            }
            this.touchTimer = null;
        }
    }

    toggleFlag(row, col) {
        if (this.revealed[row][col]) return;
        
        this.flagged[row][col] = !this.flagged[row][col];
        this.updateUI();
        this.draw();
    }

    revealTile(row, col) {
        if (this.revealed[row][col] || this.flagged[row][col]) return;
       
        if (this.grid[row][col].value === -1) {
            this.revealedMines++;
            this.showMineAlert();
            return; 
        }
        
        this.revealed[row][col] = true;
        
        if (this.grid[row][col].value === 0) {
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
        gameOverMessage.textContent = '';
        
        setTimeout(() => {
            this.closeGameOver();
        }, 2000);
    }

    checkWin() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col].value !== -1 && !this.revealed[row][col]) {
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
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.flagged[row][col]) {
                    flagCount++;
                    if (this.difficulty === 'hard') {
                        if (this.triColors[row][col] === 'red') redFlags++;
                        else if (this.triColors[row][col] === 'yellow') yellowFlags++;
                        else if (this.triColors[row][col] === 'purple') purpleFlags++;
                        else if (this.triColors[row][col] === 'green') greenFlags++;
                        else blueFlags++;
                    }
                }
                
                if (this.grid[row][col].value === -1 && this.difficulty === 'hard') {
                    if (this.triColors[row][col] === 'red') redMines++;
                    else if (this.triColors[row][col] === 'yellow') yellowMines++;
                    else if (this.triColors[row][col] === 'purple') purpleMines++;
                    else if (this.triColors[row][col] === 'green') greenMines++;
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

const game = new TriangleMinesweeper();