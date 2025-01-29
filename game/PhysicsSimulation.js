// Файл: ./game/PhysicsSimulation.js
import { BaseModule } from './BaseModule.js';

export class PhysicsSimulation extends BaseModule {
    constructor(gridManager) {
        super();
        this.name = 'PhysicsSimulation';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.interval = null;

        this.colors = ['#CCCCCC', '#00FF00']; // Серый, Зеленый
        this.type = ['stand', 'fall']; // стоит, падает
        this.colorIndex = 0;
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.interval = setInterval(() => this.update(), 100);
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.interval);
        }
    }

    clear() {
        this.gridManager.selectedTiles = {}; // Очищаем массив клеток
        this.gridManager.updateVisibleTiles(); // Перерисовываем поле
    }

    update() {
        const newSelectedTiles = {};

        // Проходим по всем клеткам
        for (const key in this.gridManager.selectedTiles) {
            const [x, y] = key.split(',').map(Number);
            const cellType = this.gridManager.selectedTiles[key].type;

            if (cellType === 'fall') {
                // Клетка серого цвета — падает вниз
                const newY = y + 1;
                const newKey = `${x},${newY}`;

                // Проверяем, можно ли переместить клетку вниз
                if (!this.gridManager.selectedTiles[newKey]) {
                    newSelectedTiles[newKey] = { type: 'fall', color: '#CCCCCC' };
                } else {
                    // Если клетка внизу занята, оставляем на месте
                    newSelectedTiles[key] = { type: 'fall', color: '#CCCCCC' };
                }
            } else if (cellType === 'stand') {
                // Клетка желтого цвета — остается на месте
                newSelectedTiles[key] = { type: 'stand', color: '#00FF00' };
            }
        }

        // Обновляем состояние клеток
        Object.keys(this.gridManager.selectedTiles).forEach((key) => delete this.gridManager.selectedTiles[key]);
        Object.assign(this.gridManager.selectedTiles, newSelectedTiles);

        // Обновляем отображение
        this.gridManager.updateVisibleTiles();
    }

// ==========================================================================

    handleLeftClick(x, y) {
        const cellKey = `${x},${y}`;
        if (this.gridManager.selectedTiles[cellKey]) {
            this.colorIndex = (this.colorIndex + 1) % this.colors.length;
            this.gridManager.selectedTiles[cellKey].type = this.type[this.colorIndex];
            this.gridManager.selectedTiles[cellKey].color = this.color[this.colorIndex];
        } else {
            this.gridManager.selectedTiles[cellKey] = { type: this.type[this.colorIndex], color: this.color[this.colorIndex] };
        }
        this.gridManager.updateVisibleTiles();
    }

// ==========================================================================

}