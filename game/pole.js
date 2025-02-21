// Файл: ./game/pole.js
import { BaseModule } from './BaseModule.js';

export class pole extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '';
        this.gameDescription = 'Рандом!';
        this.name = 'RANDOM';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.interval = null;
        this.speed = 200; // Скорость игры (меньше = быстрее)
        this.score = 0;
        this.fieldWidth = 0;
        this.fieldHeight = 0;
        this.offsetX = 0;
        this.offsetY = 0;

        // Палитра цветов в HEX
        this.colors = [
            '#39D353', // rgb(57, 211, 83)
            '#26A641', // rgb(38, 166, 65)
            '#006D32', // rgb(0, 109, 50)
            '#0E4429', // rgb(14, 68, 41)
            '#2D333B'  // rgb(45, 51, 59)
        ];
    }

    setup() {
        this.clear();
        this.draw();
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.interval = setInterval(() => this.update(), this.speed);
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
        this.gridManager.selectedTiles = {};
        this.draw();
        this.gridManager.updateVisibleTiles();
    }

    draw() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.fieldWidth = visibleWidth; //Math.floor(visibleWidth * 0.9); // 90% ширины
        this.fieldHeight = visibleHeight; //Math.floor(visibleHeight * 0.8); // 80% высоты
        this.offsetX = Math.floor((visibleWidth - this.fieldWidth) / 2);
        this.offsetY = Math.floor((visibleHeight - this.fieldHeight) / 2);

        // Рисуем границы поля
        for (let x = 1; x < this.fieldWidth + 1; x++) {
            for (let y = 1; y < this.fieldHeight + 1; y++) {
                const key = `${x},${y}`;
                const _color = Math.floor(Math.random() * colors.length);
                this.gridManager.selectedTiles[key] = { type: 'wall', color: _color };
            }
        }
    }

}