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

    // Реализация обязательных методов из BaseModule

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.log('Игра началась!');
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.log('Игра на паузе.');
        }
    }

    clear() {
        this.pause();
        this.score = 0;
        this.board = [];
        this.gridManager.selectedTiles = {};
        this.initBoard();
        this.placeMines();
        this.calculateNumbers();
        this.drawBorder();
        this.log('Игровое поле очищено и готово к игре.');
    }

    update() {
        // В Сапёре нет непрерывного обновления, как в других играх
        this.log('Обновление состояния игры.');
    }

    toggleCell(x, y) {
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

    handleLeftClick(x, y) {
        this.toggleCell(x, y);
        this.log(`Левый клик на клетке (${x}, ${y}).`);
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
            this.log(`Правый клик на клетке (${x}, ${y}). Установлен флажок.`);
        }
    }

    bindMouseEvents() {
        this.gridManager.stage.off(); // Убираем старые обработчики
        this.gridManager.stage.on('click', (event) => {
            const pos = this.gridManager.stage.getPointerPosition();
            if (!pos) return;

            const x = Math.floor((pos.x - this.gridManager.stage.x()) / this.gridManager.totalSize) - this.offsetX;
            const y = Math.floor((pos.y - this.gridManager.stage.y()) / this.gridManager.totalSize) - this.offsetY;

            if (x >= 0 && x < this.fieldWidth && y >= 0 && y < this.fieldHeight) {
                this.handleLeftClick(x, y);
            }
        });

        this.gridManager.stage.on('contextmenu', (event) => {
            event.evt.preventDefault(); // Отключаем стандартное меню
            const pos = this.gridManager.stage.getPointerPosition();
            if (!pos) return;

            const x = Math.floor((pos.x - this.gridManager.stage.x()) / this.gridManager.totalSize) - this.offsetX;
            const y = Math.floor((pos.y - this.gridManager.stage.y()) / this.gridManager.totalSize) - this.offsetY;

            if (x >= 0 && x < this.fieldWidth && y >= 0 && y < this.fieldHeight) {
                this.handleRightClick(x, y);
            }
        });

        this.log('События мыши привязаны.');
    }

    showContextMenu(x, y) {
        this.log(`Контекстное меню показано на клетке (${x}, ${y}).`);
    }

    setup() {
        this.clear();
        this.bindMouseEvents();
        this.log('Игра настроена и готова к запуску.');
    }

    // Вспомогательные методы

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
}