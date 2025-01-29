// Файл: ./game/Tetris.js
import { BaseModule } from './BaseModule.js';

const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    L: [[1, 0], [1, 0], [1, 1]],
    J: [[0, 1], [0, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]]
};

const COLORS = {
    I: '#00FFFF',
    O: '#FFFF00',
    T: '#FF00FF',
    L: '#FFA500',
    J: '#0000FF',
    S: '#00FF00',
    Z: '#FF0000'
};

export class Tetris extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '🎮';
        this.gameDescription = 'Классический Тетрис. Собирайте линии и набирайте очки!';
        this.name = 'Tetris';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.interval = null;
        this.score = 0;
        this.fieldWidth = 10;
        this.fieldHeight = 20;
        this.offsetX = 0;
        this.offsetY = 0;
        this.nextPiece = null;
        this.currentPiece = null;
        this.board = [];
        this.initBoard();
    }

    initBoard() {
        this.board = Array(this.fieldHeight).fill().map(() => 
            Array(this.fieldWidth).fill(0)
        );
    }

    setup() {
        this.clear();
        this.generateNewPiece();
        this.drawBorder();
        this.drawScore();
        this.bindKeyboardEvents();
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.interval = setInterval(() => this.update(), 1000);
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.interval);
        }
    }

    clear() {
        this.pause();
        this.score = 0;
        this.initBoard();
        this.gridManager.selectedTiles = {};
        this.gridManager.updateVisibleTiles();
    }

    generateNewPiece() {
        const shapes = Object.keys(SHAPES);
        const nextType = shapes[Math.floor(Math.random() * shapes.length)];
        
        this.currentPiece = this.nextPiece || {
            type: nextType,
            shape: SHAPES[nextType],
            x: Math.floor(this.fieldWidth / 2) - 1,
            y: 0
        };
        
        this.nextPiece = {
            type: shapes[Math.floor(Math.random() * shapes.length)],
            shape: SHAPES[nextType],
            x: 0,
            y: 0
        };
    }

    drawBorder() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.offsetX = Math.floor((visibleWidth - this.fieldWidth) / 2);
        this.offsetY = Math.floor((visibleHeight - this.fieldHeight) / 2) - 2;

        // Рисуем границы игрового поля
        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                const key = `${this.offsetX + x},${this.offsetY + y}`;
                this.gridManager.selectedTiles[key] = { 
                    type: 'cell', 
                    color: this.board[y][x] || '#1A1A1A' 
                };
            }
        }
    }

    drawNextPiece() {
        const previewOffsetX = this.offsetX + this.fieldWidth + 2;
        const previewOffsetY = this.offsetY;

        // Очищаем область превью
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                const key = `${previewOffsetX + x},${previewOffsetY + y}`;
                delete this.gridManager.selectedTiles[key];
            }
        }

        // Рисуем следующую фигуру
        this.nextPiece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    const key = `${previewOffsetX + x},${previewOffsetY + y}`;
                    this.gridManager.selectedTiles[key] = {
                        type: 'next',
                        color: COLORS[this.nextPiece.type]
                    };
                }
            });
        });
    }

    drawScore() {
        const scoreX = this.offsetX + this.fieldWidth + 2;
        const scoreY = this.offsetY + 6;
        const key = `${scoreX},${scoreY}`;
        this.gridManager.selectedTiles[key] = {
            type: 'text',
            text: `Score: ${this.score}`,
            color: '#FFFFFF'
        };
    }

    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;

            switch(e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
            }
        });
    }

    movePiece(dx, dy) {
        if (this.canMove(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            this.updateDisplay();
        } else if (dy === 1) {
            this.lockPiece();
        }
    }

    rotatePiece() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        
        if (this.canMove({ ...this.currentPiece, shape: rotated }, 0, 0)) {
            this.currentPiece.shape = rotated;
            this.updateDisplay();
        }
    }

    canMove(piece, dx, dy) {
        return piece.shape.every((row, y) =>
            row.every((cell, x) => {
                if (!cell) return true;
                const newX = piece.x + x + dx;
                const newY = piece.y + y + dy;
                return (
                    newX >= 0 &&
                    newX < this.fieldWidth &&
                    newY < this.fieldHeight &&
                    !this.board[newY]?.[newX]
                );
            })
        );
    }

    lockPiece() {
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = COLORS[this.currentPiece.type];
                    }
                }
            });
        });

        this.clearLines();
        this.generateNewPiece();
        
        if (!this.canMove(this.currentPiece, 0, 0)) {
            this.pause();
            alert(`Game Over! Score: ${this.score}`);
            this.clear();
        }
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.fieldHeight - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.fieldWidth).fill(0));
                linesCleared++;
                y++;
            }
        }

        if (linesCleared > 0) {
            this.score += linesCleared * 100;
            this.updateDisplay();
        }
    }

    update() {
        this.movePiece(0, 1);
    }

    updateDisplay() {
        this.gridManager.selectedTiles = {};
        this.drawBorder();
        this.drawCurrentPiece();
        this.drawNextPiece();
        this.drawScore();
        this.gridManager.updateVisibleTiles();
    }

    drawCurrentPiece() {
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    if (boardY >= 0) {
                        const key = `${this.offsetX + boardX},${this.offsetY + boardY}`;
                        this.gridManager.selectedTiles[key] = {
                            type: 'piece',
                            color: COLORS[this.currentPiece.type]
                        };
                    }
                }
            });
        });
    }

    handleLeftClick(x, y) {
        // Не используется в Тетрисе
    }

    handleRightClick(x, y) {
        // Не используется в Тетрисе
    }
}