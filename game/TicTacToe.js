// Файл: ./game/TicTacToe.js
import { BaseModule } from './BaseModule.js';

export class TicTacToe extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '❌⭕';
        this.gameDescription = 'Крестики-нолики. Соберите три в ряд!';
        this.name = 'TicTacToe';
        this.usesStartStop = false;
        this.gridManager = gridManager;
        this.isRunning = false;
        this.fieldWidth = 3;
        this.fieldHeight = 3;
        this.board = [];
        this.currentPlayer = 'X';
        this.offsetX = 0;
        this.offsetY = 0;
        this.gameOver = false;
        this.winningCells = [];
        this.resultMessage = '';
        this.gridScale = {
            min: 36,
            max: 112,
            step: 4,
            defaultTileSize: 72,
            defaultGap: 4,
            value: 72,
            fitColumns: 5,
            fitRows: 7,
        };
    }

    setup() {
        this.applyGridScale();
        this.bindMouseEvents();
        this.reset();
    }

    reset() {
        this.board = Array.from({ length: 3 }, () => Array(3).fill(null));
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winningCells = [];
        this.resultMessage = '';
        this.isRunning = true;
        this.calculateOffsets();
        this.render();
        this.setStatus('Ход игрока X', 'info');
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
        if (!this.isRunning || this.gameOver || this.board[y][x] !== null) return;

        const player = this.currentPlayer;
        this.board[y][x] = player;
        const winningLine = this.getWinningLine(player);

        if (winningLine) {
            this.gameOver = true;
            this.isRunning = false;
            this.winningCells = winningLine;
            this.resultMessage = `Победил игрок ${player}!`;
            this.render();
            this.finish(this.resultMessage, 'success');
            return;
        }

        if (this.board.flat().every((cell) => cell !== null)) {
            this.gameOver = true;
            this.isRunning = false;
            this.resultMessage = 'Ничья!';
            this.render();
            this.finish(this.resultMessage, 'result');
            return;
        }

        this.currentPlayer = player === 'X' ? 'O' : 'X';
        this.render();
        this.setStatus(`Ход игрока ${this.currentPlayer}`, 'info');
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

    render() {
        this.gridManager.selectedTiles = {};
        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                const value = this.board[y][x];
                const isWinner = this.winningCells.some((cell) => cell.x === x && cell.y === y);
                const key = `${this.offsetX + x},${this.offsetY + y}`;
                this.gridManager.selectedTiles[key] = {
                    type: 'cell',
                    text: value || '',
                    textColor: value === 'X' ? '#FF5A5F' : '#4D96FF',
                    color: isWinner ? '#2DA44E' : '#F0F3F6'
                };
            }
        }

        const hudY = Math.max(0, this.offsetY - 2);
        this.gridManager.selectedTiles[`${Math.max(0, this.offsetX)},${hudY}`] = {
            type: 'text',
            text: this.resultMessage || `Ход: ${this.currentPlayer}`,
            textColor: '#FFFFFF',
            color: '#FFFFFF'
        };
        this.gridManager.updateVisibleTiles();
    }

    drawBorder() {
        this.render();
    }

    getWinningLine(player) {
        const lines = [
            [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
            [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
            [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
            [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
            [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
            [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
            [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }],
            [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }]
        ];
        return lines.find((line) => line.every(({ x, y }) => this.board[y][x] === player)) || null;
    }

    checkWin(player) {
        return this.getWinningLine(player) !== null;
    }

    onResize() {
        this.calculateOffsets();
        this.render();
    }

    showContextMenu() {}
}
