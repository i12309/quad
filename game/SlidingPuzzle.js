// Файл: ./game/SlidingPuzzle.js
import { BaseModule } from './BaseModule.js';

export class SlidingPuzzle extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '🧩';
        this.gameDescription = 'Пятнашки. Соберите пазл, перемещая плитки!';
        this.name = 'SlidingPuzzle';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.fieldWidth = 4;
        this.fieldHeight = 4;
        this.board = [];
        this.offsetX = 0;
        this.offsetY = 0;
    }

    setup() {
        this.clear();
        this.initBoard();
        this.shuffleBoard();
        this.drawBorder();
    }

    initBoard() {
        this.board = Array(this.fieldHeight)
            .fill()
            .map((_, y) => Array(this.fieldWidth)
                .fill()
                .map((_, x) => y * this.fieldWidth + x + 1)
            );
        this.board[this.fieldHeight - 1][this.fieldWidth - 1] = 0; // Пустая клетка
    }

    shuffleBoard() {
        for (let i = 0; i < 1000; i++) {
            const moves = this.getValidMoves();
            const move = moves[Math.floor(Math.random() * moves.length)];
            this.moveTile(move.x, move.y);
        }
    }

    getValidMoves() {
        const emptyPos = this.findEmptyPosition();
        const moves = [];
        if (emptyPos.x > 0) moves.push({ x: emptyPos.x - 1, y: emptyPos.y });
        if (emptyPos.x < this.fieldWidth - 1) moves.push({ x: emptyPos.x + 1, y: emptyPos.y });
        if (emptyPos.y > 0) moves.push({ x: emptyPos.x, y: emptyPos.y - 1 });
        if (emptyPos.y < this.fieldHeight - 1) moves.push({ x: emptyPos.x, y: emptyPos.y + 1 });
        return moves;
    }

    findEmptyPosition() {
        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                if (this.board[y][x] === 0) return { x, y };
            }
        }
        return { x: -1, y: -1 };
    }

    moveTile(x, y) {
        const emptyPos = this.findEmptyPosition();
        if (Math.abs(x - emptyPos.x) + Math.abs(y - emptyPos.y) === 1) {
            this.board[emptyPos.y][emptyPos.x] = this.board[y][x];
            this.board[y][x] = 0;
        }
    }

    drawBorder() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.offsetX = Math.floor((visibleWidth - this.fieldWidth) / 2);
        this.offsetY = Math.floor((visibleHeight - this.fieldHeight) / 2);

        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                const key = `${this.offsetX + x},${this.offsetY + y}`;
                this.gridManager.selectedTiles[key] = {
                    type: 'tile',
                    text: this.board[y][x] === 0 ? '' : this.board[y][x],
                    color: this.board[y][x] === 0 ? '#1A1A1A' : '#00FF00'
                };
            }
        }
        this.gridManager.updateVisibleTiles();
    }

    handleLeftClick(x, y) {
        this.moveTile(x, y);
        this.drawBorder();
        if (this.checkWin()) {
            alert('Победа!');
            this.clear();
        }
    }

    checkWin() {
        let expected = 1;
        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                if (y === this.fieldHeight - 1 && x === this.fieldWidth - 1) {
                    if (this.board[y][x] !== 0) return false;
                } else if (this.board[y][x] !== expected++) {
                    return false;
                }
            }
        }
        return true;
    }
}