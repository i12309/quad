// Файл: ./game/TicTacToe.js
import { BaseModule } from './BaseModule.js';

export class TicTacToe extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '❌⭕';
        this.gameDescription = 'Крестики-нолики. Соберите три в ряд!';
        this.name = 'TicTacToe';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.fieldWidth = 3;
        this.fieldHeight = 3;
        this.board = Array(3).fill().map(() => Array(3).fill(null));
        this.currentPlayer = 'X';
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
        this.board = Array(3).fill().map(() => Array(3).fill(null)); // Очищаем поле
        this.currentPlayer = 'X'; // Сбрасываем текущего игрока
        this.gridManager.selectedTiles = {}; // Очищаем отрисованные клетки
        this.drawBorder(); // Отрисовываем пустое поле
        this.gridManager.updateVisibleTiles(); // Обновляем отображение
        this.log('Игра очищена и готова к новому раунду.');
    }

    update() {
        // В крестиках-ноликах нет непрерывного обновления, как в других играх
        this.log('Обновление состояния игры.');
    }

    toggleCell(x, y) {
        if (this.board[y][x] === null) {
            this.board[y][x] = this.currentPlayer;
            this.drawBorder();
            if (this.checkWin(this.currentPlayer)) {
                alert(`Победил ${this.currentPlayer}!`);
                this.clear();
            } else if (this.board.flat().every(cell => cell !== null)) {
                alert('Ничья!');
                this.clear();
            } else {
                this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            }
        }
    }

    handleLeftClick(x, y) {
        this.toggleCell(x, y);
        this.log(`Левый клик на клетке (${x}, ${y}).`);
    }

    handleRightClick(x, y) {
        // В крестиках-ноликах правый клик не используется
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

    drawBorder() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.offsetX = Math.floor((visibleWidth - this.fieldWidth) / 2);
        this.offsetY = Math.floor((visibleHeight - this.fieldHeight) / 2);

        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                const key = `${this.offsetX + x},${this.offsetY + y}`;
                this.gridManager.selectedTiles[key] = {
                    type: 'cell',
                    text: this.board[y][x] || '',
                    color: '#FFFFFF'
                };
            }
        }
        this.gridManager.updateVisibleTiles();
    }

    checkWin(player) {
        // Проверка строк и столбцов
        for (let i = 0; i < 3; i++) {
            if (this.board[i][0] === player && this.board[i][1] === player && this.board[i][2] === player) return true;
            if (this.board[0][i] === player && this.board[1][i] === player && this.board[2][i] === player) return true;
        }
        // Проверка диагоналей
        if (this.board[0][0] === player && this.board[1][1] === player && this.board[2][2] === player) return true;
        if (this.board[0][2] === player && this.board[1][1] === player && this.board[2][0] === player) return true;
        return false;
    }
}