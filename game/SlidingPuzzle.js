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

    // Реализация всех обязательных методов из BaseModule

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
        this.board = [];
        this.gridManager.selectedTiles = {};
        this.initBoard();
        this.shuffleBoard();
        this.drawBorder();
        this.log('Игра очищена и готова к новому раунду.');
    }

    update() {
        // В пятнашках нет непрерывного обновления, как в других играх
        this.log('Обновление состояния игры.');
    }

    toggleCell(x, y) {
        this.moveTile(x, y);
        this.drawBorder();
        if (this.checkWin()) {
            alert('Победа!');
            this.clear();
        }
    }

    handleLeftClick(x, y) {
        this.toggleCell(x, y);
        this.log(`Левый клик на клетке (${x}, ${y}).`);
    }

    handleRightClick(x, y) {
        // В пятнашках правый клик не используется
        this.log(`Правый клик на клетке (${x}, ${y}).`);
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