// Файл: ./game/Minesweeper.js
import { BaseModule } from './BaseModule.js';

export class Minesweeper extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '💣';
        this.gameDescription = 'Классический Сапёр. Найдите все мины, не подорвавшись!';
        this.name = 'Minesweeper';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.fieldWidth = 10;
        this.fieldHeight = 10;
        this.minesCount = 10;
        this.board = [];
        this.offsetX = 0;
        this.offsetY = 0;
    }

    setup() {
        this.clear();
        this.initBoard();
        this.placeMines();
        this.calculateNumbers();
        this.drawBorder();
    }

    initBoard() {
        this.board = Array(this.fieldHeight)
            .fill()
            .map(() => Array(this.fieldWidth).fill({ type: 'hidden', value: 0 }));
    }

    placeMines() {
        let minesPlaced = 0;
        while (minesPlaced < this.minesCount) {
            const x = Math.floor(Math.random() * this.fieldWidth);
            const y = Math.floor(Math.random() * this.fieldHeight);
            if (this.board[y][x].value !== 'mine') {
                this.board[y][x].value = 'mine';
                minesPlaced++;
            }
        }
    }

    calculateNumbers() {
        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                if (this.board[y][x].value === 'mine') continue;
                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (ny >= 0 && ny < this.fieldHeight && nx >= 0 && nx < this.fieldWidth && this.board[ny][nx].value === 'mine') {
                            count++;
                        }
                    }
                }
                this.board[y][x].value = count;
            }
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
                    type: 'hidden',
                    color: '#CCCCCC'
                };
            }
        }
        this.gridManager.updateVisibleTiles();
    }

    handleLeftClick(x, y) {
        const cell = this.board[y][x];
        if (cell.type === 'hidden') {
            cell.type = 'revealed';
            const key = `${this.offsetX + x},${this.offsetY + y}`;
            this.gridManager.selectedTiles[key] = {
                type: 'revealed',
                text: cell.value === 'mine' ? '💣' : cell.value,
                color: cell.value === 'mine' ? '#FF0000' : '#FFFFFF'
            };
            this.gridManager.updateVisibleTiles();

            if (cell.value === 'mine') {
                this.pause();
                alert('Вы проиграли!');
                this.clear();
            }
        }
    }

    handleRightClick(x, y) {
        const cell = this.board[y][x];
        if (cell.type === 'hidden') {
            cell.type = 'flagged';
            const key = `${this.offsetX + x},${this.offsetY + y}`;
            this.gridManager.selectedTiles[key] = {
                type: 'flagged',
                text: '🚩',
                color: '#FFA500'
            };
            this.gridManager.updateVisibleTiles();
        }
    }
}