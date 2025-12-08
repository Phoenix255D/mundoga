class MinesweeperGame {
    constructor() {
        this.board = [];
        this.size = 8;
        this.mineCount = 10;
        this.flagCount = 0;
        this.revealedCount = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.timerInterval = null;
        this.startTime = null;
        this.difficulty = 'medium';
        this.revealedMines = 0;
        this.cellColors = [];
        this.questionMarks = [];
        this.restart('medium');
    }
    
    restart(difficulty) {
        const difficulties = {
            easy: { size: 8, mines: 10 },
            medium: { size: 10, mines: 15 },
            hard: { size: 12, mines: 20 }
        };
        
        const config = difficulties[difficulty];
        this.size = config.size;
        this.mineCount = config.mines;
        this.difficulty = difficulty;
        this.flagCount = 0;
        this.revealedCount = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.startTime = null;
        this.revealedMines = 0;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        document.getElementById('flagCount').textContent = '0';
        document.getElementById('totalMines').textContent = this.mineCount;
        document.getElementById('timer').textContent = '0';
        
        this.initBoard();
        this.placeMines();
        this.calculateNumbers();
        
        if (this.difficulty === 'hard') {
            this.placeQuestionMarks();
        }
        
        this.updateUI();
        this.render();
        this.closeGameOver();
    }
    
    initBoard() {
        this.board = [];
        this.cellColors = [];
        this.questionMarks = [];
        
        for (let row = 0; row < this.size; row++) {
            this.board[row] = [];
            this.cellColors[row] = [];
            this.questionMarks[row] = [];
            
            for (let col = 0; col < this.size; col++) {
                this.board[row][col] = {
                    mine: false,
                    revealed: false,
                    flagged: false,
                    adjacentMines: 0
                };
                this.questionMarks[row][col] = false;
                
                if (this.difficulty === 'hard') {
                    this.cellColors[row][col] = this.assignCellColor(row, col);
                } else {
                    this.cellColors[row][col] = 'blue';
                }
            }
        }
    }
    
    assignCellColor(row, col) {
        const centerRow = this.size / 2;
        const centerCol = this.size / 2;
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
            const row = Math.floor(Math.random() * this.size);
            const col = Math.floor(Math.random() * this.size);
            
            if (!this.board[row][col].mine) {
                this.board[row][col].mine = true;
                placed++;
            }
        }
    }
    
    placeQuestionMarks() {
        let placed = 0;
        const minQuestions = 5;
        
        while (placed < minQuestions) {
            const row = Math.floor(Math.random() * this.size);
            const col = Math.floor(Math.random() * this.size);
            
            if (!this.board[row][col].mine && !this.questionMarks[row][col]) {
                this.questionMarks[row][col] = true;
                placed++;
            }
        }
    }
    
    calculateNumbers() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (!this.board[row][col].mine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const newRow = row + dr;
                            const newCol = col + dc;
                            if (newRow >= 0 && newRow < this.size && 
                                newCol >= 0 && newCol < this.size &&
                                this.board[newRow][newCol].mine) {
                                count++;
                            }
                        }
                    }
                    this.board[row][col].adjacentMines = count;
                }
            }
        }
    }
    
    countMinesInRow(row) {
        let count = 0;
        for (let col = 0; col < this.size; col++) {
            if (this.board[row][col].mine) count++;
        }
        return count;
    }
    
    countMinesInCol(col) {
        let count = 0;
        for (let row = 0; row < this.size; row++) {
            if (this.board[row][col].mine) count++;
        }
        return count;
    }
    
    startTimer() {
        if (!this.startTime) {
            this.startTime = Date.now();
            this.timerInterval = setInterval(() => {
                if (!this.gameOver && !this.gameWon) {
                    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                    document.getElementById('timer').textContent = elapsed;
                }
            }, 1000);
        }
    }
    
    handleClick(row, col) {
        if (this.gameOver || this.gameWon || this.board[row][col].revealed || this.board[row][col].flagged) {
            return;
        }
        
        this.startTimer();
       
        if (this.board[row][col].mine) {
            this.revealedMines++;
            this.showMineAlert();
            return;
        }
        
        this.revealCell(row, col);
        this.checkWin();
        this.render();
    }
    
    handleRightClick(row, col, event) {
        event.preventDefault();
        
        if (this.gameOver || this.gameWon || this.board[row][col].revealed) {
            return;
        }
        
        this.startTimer();
        
        this.board[row][col].flagged = !this.board[row][col].flagged;
        this.flagCount += this.board[row][col].flagged ? 1 : -1;
        
        this.updateUI();
        this.checkWin();
        this.render();
    }
    
    revealCell(row, col) {
        if (row < 0 || row >= this.size || col < 0 || col >= this.size ||
            this.board[row][col].revealed || this.board[row][col].flagged) {
            return;
        }
        
        this.board[row][col].revealed = true;
        this.revealedCount++;
        
        if (this.board[row][col].adjacentMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr !== 0 || dc !== 0) {
                        this.revealCell(row + dr, col + dc);
                    }
                }
            }
        }
    }
    
    showMineAlert() {
        const overlay = document.getElementById('overlay');
        const gameOverDiv = document.getElementById('gameOver');
        const gameOverText = document.getElementById('gameOverText');
        const gameOverMessage = document.getElementById('gameOverMessage');
        
        overlay.style.display = 'block';
        gameOverDiv.style.display = 'block';
        gameOverText.textContent = 'Dou, encontraste una mina';
        gameOverText.style.color = '#f44336';
        gameOverMessage.textContent = '';
        
        setTimeout(() => {
            this.closeGameOver();
        }, 2000);
    }
    
    checkWin() {
        const totalSafeCells = this.size * this.size - this.mineCount;
        if (this.revealedCount === totalSafeCells) {
            this.endGame(true);
        }
    }
    
    endGame(won) {
        this.gameWon = true;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.render();
        
        const overlay = document.getElementById('overlay');
        const gameOverDiv = document.getElementById('gameOver');
        const gameOverText = document.getElementById('gameOverText');
        const gameOverMessage = document.getElementById('gameOverMessage');
        
        overlay.style.display = 'block';
        gameOverDiv.style.display = 'block';
        gameOverText.textContent = 'Ganaste, yipiee';
        gameOverText.style.color = '#4CAF50';
        gameOverMessage.textContent = `Completaste el juego en ${document.getElementById('timer').textContent} segundos. Minas descubiertas: ${this.revealedMines}`;
    }
    
    closeGameOver() {
        document.getElementById('overlay').style.display = 'none';
        document.getElementById('gameOver').style.display = 'none';
    }
    
    updateUI() {
        let redMines = 0, yellowMines = 0, purpleMines = 0, blueMines = 0, greenMines = 0;
        let redFlags = 0, yellowFlags = 0, purpleFlags = 0, blueFlags = 0, greenFlags = 0;
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col].flagged) {
                    if (this.difficulty === 'hard') {
                        if (this.cellColors[row][col] === 'red') redFlags++;
                        else if (this.cellColors[row][col] === 'yellow') yellowFlags++;
                        else if (this.cellColors[row][col] === 'purple') purpleFlags++;
                        else if (this.cellColors[row][col] === 'green') greenFlags++;
                        else blueFlags++;
                    }
                }
                
                if (this.board[row][col].mine && this.difficulty === 'hard') {
                    if (this.cellColors[row][col] === 'red') redMines++;
                    else if (this.cellColors[row][col] === 'yellow') yellowMines++;
                    else if (this.cellColors[row][col] === 'purple') purpleMines++;
                    else if (this.cellColors[row][col] === 'green') greenMines++;
                    else blueMines++;
                }
            }
        }
        
        document.getElementById('flagCount').textContent = this.flagCount;
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
    
    getCellColorValue(colorName) {
        const colors = {
            'blue': '#3498db',
            'red': '#e74c3c',
            'yellow': '#f1c40f',
            'purple': '#9b59b6',
            'green': '#2ecc71'
        };
        return colors[colorName] || '#3498db';
    }
    
    render() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        
        const gridSize = this.size + 1;
        gameBoard.style.display = 'grid';
        gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 40px)`;
        gameBoard.style.gridTemplateRows = `repeat(${gridSize}, 40px)`;
        gameBoard.style.gap = '1px';
        
        const corner = document.createElement('div');
        corner.className = 'counter-cell corner';
        gameBoard.appendChild(corner);
        
        for (let col = 0; col < this.size; col++) {
            const counterCell = document.createElement('div');
            counterCell.className = 'counter-cell';
            if (col % 2 === 0) {
                const count = this.countMinesInCol(col);
                if (count > 0) {
                    counterCell.textContent = count;
                    counterCell.style.color = '#764ba2';
                }
            }
            gameBoard.appendChild(counterCell);
        }
        
        for (let row = 0; row < this.size; row++) {
            const rowCounter = document.createElement('div');
            rowCounter.className = 'counter-cell';
            if (row % 2 === 0) {
                const count = this.countMinesInRow(row);
                if (count > 0) {
                    rowCounter.textContent = count;
                    rowCounter.style.color = '#764ba2';
                }
            }
            gameBoard.appendChild(rowCounter);
            
            // Celdas de la fila
            for (let col = 0; col < this.size; col++) {
                const cell = this.board[row][col];
                const cellDiv = document.createElement('div');
                cellDiv.className = 'cell';
                
                if (row % 2 === 0 || col % 2 === 0) {
                    cellDiv.classList.add('marker');
                }
                
                if (this.difficulty === 'hard' && !cell.revealed && !cell.flagged) {
                    const color = this.getCellColorValue(this.cellColors[row][col]);
                    cellDiv.style.backgroundColor = color;
                }
                
                if (cell.revealed) {
                    cellDiv.classList.add('revealed');
                    if (cell.mine) {
                        if (this.difficulty === 'hard') {
                            const color = this.getCellColorValue(this.cellColors[row][col]);
                            cellDiv.style.backgroundColor = color;
                        }
                    } else if (this.questionMarks[row][col]) {
                        cellDiv.textContent = '❓';
                        cellDiv.style.color = '#e67e22';
                        cellDiv.style.fontSize = '20px';
                    } else if (cell.adjacentMines > 0) {
                        cellDiv.textContent = cell.adjacentMines;
                        cellDiv.classList.add(`num-${cell.adjacentMines}`);
                    }
                } else if (cell.flagged) {
                    cellDiv.classList.add('flagged');
                    cellDiv.textContent = '🚩';
                    cellDiv.style.backgroundColor = '#e67e22';
                }
                
                cellDiv.addEventListener('click', () => this.handleClick(row, col));
                cellDiv.addEventListener('contextmenu', (e) => this.handleRightClick(row, col, e));
                
                gameBoard.appendChild(cellDiv);
            }
        }
    }
}

const game = new MinesweeperGame();