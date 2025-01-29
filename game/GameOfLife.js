// Файл: ./game/GameOfLife.js
import { BaseModule } from './BaseModule.js';

export class GameOfLife extends BaseModule {
    constructor(gridManager) {
        super();
        this.name = 'GameOfLife';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.interval = null;
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.interval = setInterval(() => this.updateGame(), 100);
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

    countNeighbors(x, y) {
        let count = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (this.gridManager.selectedTiles[`${nx},${ny}`]) {
                    count++;
                }
            }
        }
        return count;
    }

    /*
    updateGame() {
        const newSelectedTiles = {};
        const cellsToCheck = new Set();

        for (const key in this.gridManager.selectedTiles) {
            const [x, y] = key.split(',').map(Number);
            cellsToCheck.add(`${x},${y}`);
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx;
                    const ny = y + dy;
                    cellsToCheck.add(`${nx},${ny}`);
                }
            }
        }

        cellsToCheck.forEach((key) => {
            const [x, y] = key.split(',').map(Number);
            const neighbors = this.countNeighbors(x, y);

            if (this.gridManager.selectedTiles[key]) {
                if (neighbors === 2 || neighbors === 3) {
                    newSelectedTiles[key] = true;
                }
            } else {
                if (neighbors === 3) {
                    newSelectedTiles[key] = true;
                }
            }
        });

        Object.keys(this.gridManager.selectedTiles).forEach((key) => delete this.gridManager.selectedTiles[key]);
        Object.assign(this.gridManager.selectedTiles, newSelectedTiles);
        this.gridManager.updateVisibleTiles();
    }
        */

    updateGame() {
        const newSelectedTiles = {};
        const cellsToCheck = new Set(Object.keys(this.gridManager.selectedTiles));
        for (const key of cellsToCheck) {
            const [x, y] = key.split(',').map(Number);
            const neighbors = this.countNeighbors(x, y);
            if (this.gridManager.selectedTiles[key]) {
                if (neighbors === 2 || neighbors === 3) {
                    newSelectedTiles[key] = { type: 'pixel', color: '#CCCCCC' }; // Серый цвет
                }
            } else {
                if (neighbors === 3) {
                    newSelectedTiles[key] = { type: 'pixel', color: '#CCCCCC' }; // Серый цвет
                }
            }
        }
        this.gridManager.selectedTiles = newSelectedTiles;
        this.gridManager.updateVisibleTiles();
    }

    randomize() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize) + 1;
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize) + 1;
        const startX = Math.floor(-this.gridManager.stage.x() / this.gridManager.totalSize);
        const startY = Math.floor(-this.gridManager.stage.y() / this.gridManager.totalSize);

        for (let x = startX; x < startX + visibleWidth; x++) {
            for (let y = startY; y < startY + visibleHeight; y++) {
                if (Math.random() > 0.8) {
                    this.gridManager.selectedTiles[`${x},${y}`] = true;
                }
            }
        }
        this.gridManager.updateVisibleTiles();
    }


// ========================================================



    showContextMenu(x, y) {
        // Пустое меню
    }

    handleLeftClick(x, y) {
        const cellKey = `${x},${y}`;
        if (this.gridManager.selectedTiles[cellKey]) {
            delete this.gridManager.selectedTiles[cellKey];
        } else {
            this.gridManager.selectedTiles[cellKey] = { type: '#CCCCCC' }; // Светло-серый цвет
        }
        this.gridManager.updateVisibleTiles();
    }

    
}