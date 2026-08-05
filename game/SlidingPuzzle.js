// Файл: ./game/SlidingPuzzle.js
import { BaseModule } from './BaseModule.js';

export class SlidingPuzzle extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '🧩';
        this.gameDescription = 'Пятнашки. Соберите пазл, перемещая плитки!';
        this.name = 'SlidingPuzzle';
        this.usesStartStop = false;
        this.gridManager = gridManager;
        this.isRunning = false;
        this.fieldWidth = 4;
        this.fieldHeight = 4;
        this.board = [];
        this.offsetX = 0;
        this.offsetY = 0;
        this.moves = 0;
        this.gameOver = false;
        this.resultMessage = '';
    }

    setup() {
        this.gridManager.setGridMetrics?.(56, this.gridManager.gap);
        if (!this.gridManager.setGridMetrics) {
            this.gridManager.tileSize = 56;
            this.gridManager.totalSize = this.gridManager.tileSize + this.gridManager.gap;
        }
        this.bindMouseEvents();
        this.reset();
    }

    reset() {
        this.initBoard();
        this.shuffleBoard();
        this.moves = 0;
        this.gameOver = false;
        this.resultMessage = '';
        this.isRunning = true;
        this.calculateOffsets();
        this.render();
        this.setStatus('Соберите числа от 1 до 15', 'info');
    }

    start() {
        if (this.gameOver) this.reset();
        this.isRunning = true;
    }

    pause() {
        this.isRunning = false;
    }

    clear() {
        this.reset();
    }

    update() {
        this.render();
    }

    toggleCell(x, y) {
        if (!this.isRunning || this.gameOver) return;
        if (!this.moveTile(x, y)) return;

        this.moves++;
        if (this.checkWin()) {
            this.gameOver = true;
            this.isRunning = false;
            this.resultMessage = `Победа! Ходов: ${this.moves}`;
            this.render();
            this.finish(this.resultMessage, 'success');
            return;
        }

        this.render();
        this.setStatus(`Ходов: ${this.moves}`, 'info');
    }

    handleLeftClick(x, y) {
        this.toggleCell(x, y);
    }

    handleRightClick() {}

    bindMouseEvents() {
        this.clearBindings();
        this.bindStage('click', () => {
            const pos = this.gridManager.stage.getPointerPosition();
            if (!pos) return;

            const x = Math.floor(
                (pos.x - this.gridManager.stage.x()) / this.gridManager.totalSize
            ) - this.offsetX;
            const y = Math.floor(
                (pos.y - this.gridManager.stage.y()) / this.gridManager.totalSize
            ) - this.offsetY;

            if (x >= 0 && x < this.fieldWidth && y >= 0 && y < this.fieldHeight) {
                this.handleLeftClick(x, y);
            }
        });
    }

    calculateOffsets() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.offsetX = Math.floor((visibleWidth - this.fieldWidth) / 2);
        this.offsetY = Math.floor((visibleHeight - this.fieldHeight) / 2);
    }

    initBoard() {
        this.board = Array.from({ length: this.fieldHeight }, (_, y) =>
            Array.from({ length: this.fieldWidth }, (_, x) => y * this.fieldWidth + x + 1)
        );
        this.board[this.fieldHeight - 1][this.fieldWidth - 1] = 0;
    }

    shuffleBoard() {
        do {
            this.initBoard();
            let previousEmpty = null;
            for (let i = 0; i < 320; i++) {
                const empty = this.findEmptyPosition();
                let candidates = this.getValidMoves().filter((move) =>
                    !previousEmpty || move.x !== previousEmpty.x || move.y !== previousEmpty.y
                );
                if (candidates.length === 0) candidates = this.getValidMoves();
                const move = candidates[Math.floor(Math.random() * candidates.length)];
                previousEmpty = empty;
                this.swapWithEmpty(move.x, move.y);
            }
        } while (this.checkWin());
    }

    getValidMoves() {
        const empty = this.findEmptyPosition();
        const moves = [];
        if (empty.x > 0) moves.push({ x: empty.x - 1, y: empty.y });
        if (empty.x < this.fieldWidth - 1) moves.push({ x: empty.x + 1, y: empty.y });
        if (empty.y > 0) moves.push({ x: empty.x, y: empty.y - 1 });
        if (empty.y < this.fieldHeight - 1) moves.push({ x: empty.x, y: empty.y + 1 });
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

    swapWithEmpty(x, y) {
        const empty = this.findEmptyPosition();
        this.board[empty.y][empty.x] = this.board[y][x];
        this.board[y][x] = 0;
    }

    moveTile(x, y) {
        const empty = this.findEmptyPosition();
        const isAdjacent = Math.abs(x - empty.x) + Math.abs(y - empty.y) === 1;
        if (!isAdjacent) return false;
        this.swapWithEmpty(x, y);
        return true;
    }

    render() {
        this.gridManager.selectedTiles = {};
        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                const value = this.board[y][x];
                const key = `${this.offsetX + x},${this.offsetY + y}`;
                this.gridManager.selectedTiles[key] = {
                    type: 'tile',
                    text: value === 0 ? '' : String(value),
                    textColor: '#FFFFFF',
                    color: value === 0 ? '#1A1A1A' : '#2DA44E'
                };
            }
        }

        const hudY = Math.max(0, this.offsetY - 2);
        this.gridManager.selectedTiles[`${Math.max(0, this.offsetX)},${hudY}`] = {
            type: 'text',
            text: this.resultMessage || `Ходов: ${this.moves}`,
            textColor: '#FFFFFF',
            color: '#FFFFFF'
        };
        this.gridManager.updateVisibleTiles();
    }

    drawBorder() {
        this.render();
    }

    checkWin() {
        let expected = 1;
        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                if (y === this.fieldHeight - 1 && x === this.fieldWidth - 1) {
                    return this.board[y][x] === 0;
                }
                if (this.board[y][x] !== expected++) return false;
            }
        }
        return true;
    }

    onResize() {
        this.calculateOffsets();
        this.render();
    }

    showContextMenu() {}
}
