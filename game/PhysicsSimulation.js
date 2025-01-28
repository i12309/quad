// Файл: ./game/PhysicsSimulation.js
import { BaseModule } from './BaseModule.js';

export class PhysicsSimulation extends BaseModule {
    constructor(gridManager) {
        super();
        this.name = 'PhysicsSimulation';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.interval = null;

        this.colors = ['#CCCCCC', '#00FF00', '#0000FF']; // Серый, Зеленый, Синий
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

            if (cellType === 'gray') {
                // Клетка серого цвета — падает вниз
                const newY = y + 1;
                const newKey = `${x},${newY}`;

                // Проверяем, можно ли переместить клетку вниз
                if (!this.gridManager.selectedTiles[newKey]) {
                    newSelectedTiles[newKey] = { type: 'gray' };
                } else {
                    // Если клетка внизу занята, оставляем на месте
                    newSelectedTiles[key] = { type: 'gray' };
                }
            } else if (cellType === 'yellow') {
                // Клетка желтого цвета — остается на месте
                newSelectedTiles[key] = { type: 'yellow' };
            }
        }

        // Обновляем состояние клеток
        Object.keys(this.gridManager.selectedTiles).forEach((key) => delete this.gridManager.selectedTiles[key]);
        Object.assign(this.gridManager.selectedTiles, newSelectedTiles);

        // Обновляем отображение
        this.gridManager.updateVisibleTiles();
    }

// ==========================================================================

    showContextMenu(x, y) {
        const contextMenu = document.createElement('div');
        contextMenu.style.position = 'absolute';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.backgroundColor = 'white';
        contextMenu.style.border = '1px solid black';
        contextMenu.style.padding = '10px';
        contextMenu.style.zIndex = '1000';

        const colors = ['Серый', 'Зеленый', 'Синий'];
        colors.forEach((color, index) => {
            const item = document.createElement('div');
            item.textContent = color;
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                this.gridManager.selectedTiles[`${x},${y}`] = { type: this.colors[index] };
                this.gridManager.updateVisibleTiles();
                contextMenu.remove();
            });
            contextMenu.appendChild(item);
        });

        document.body.appendChild(contextMenu);

        // Удаляем меню при клике вне его
        document.addEventListener('click', (event) => {
            if (!contextMenu.contains(event.target)) {
                contextMenu.remove();
            }
        }, { once: true });
    }

    handleLeftClick(x, y) {
        const cellKey = `${x},${y}`;
        if (this.gridManager.selectedTiles[cellKey]) {
            this.colorIndex = (this.colorIndex + 1) % this.colors.length;
            this.gridManager.selectedTiles[cellKey].type = this.colors[this.colorIndex];
        } else {
            this.gridManager.selectedTiles[cellKey] = { type: this.colors[this.colorIndex] };
        }
        this.gridManager.updateVisibleTiles();
    }

// ==========================================================================

}