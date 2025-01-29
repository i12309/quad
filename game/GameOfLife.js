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
        this.gridManager.selectedTiles = {};
        this.gridManager.updateVisibleTiles();
    }

    update() {
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
                    newSelectedTiles[key] = { type: 'pixel', color: '#CCCCCC' };
                }
            } else {
                if (neighbors === 3) {
                    newSelectedTiles[key] = { type: 'pixel', color: '#FFFF00' };
                }
            }
        });

        this.gridManager.selectedTiles = newSelectedTiles;
        this.gridManager.updateVisibleTiles();
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

    toggleCell(x, y) {
        const cellKey = `${x},${y}`;
        if (this.gridManager.selectedTiles[cellKey]) {
            delete this.gridManager.selectedTiles[cellKey];
        } else {
            this.gridManager.selectedTiles[cellKey] = { type: 'pixel', color: '#CCCCCC' };
        }
        this.gridManager.updateVisibleTiles();
    }

    handleLeftClick(x, y) {
        this.toggleCell(x, y);
    }

    handleRightClick(x, y) {
        this.showContextMenu(x, y);
    }

    bindMouseEvents() {
        this.gridManager.stage.on('click', (event) => {
            const pos = this.gridManager.stage.getPointerPosition();
            if (!pos) return;

            const x = Math.floor((pos.x - this.gridManager.stage.x()) / this.gridManager.totalSize);
            const y = Math.floor((pos.y - this.gridManager.stage.y()) / this.gridManager.totalSize);

            if (event.evt.button === 0) {
                this.handleLeftClick(x, y);
            } else if (event.evt.button === 2) {
                this.handleRightClick(x, y);
            }
        });
    }

    showContextMenu(x, y) {
        const contextMenu = document.createElement('div');
        contextMenu.style.position = 'absolute';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.backgroundColor = '#fff';
        contextMenu.style.border = '1px solid #ccc';
        contextMenu.style.padding = '5px';
        contextMenu.innerHTML = '<p>Контекстное меню</p>';
        document.body.appendChild(contextMenu);

        document.addEventListener('click', () => contextMenu.remove(), { once: true });
    }

    setup() {
        this.bindMouseEvents(); // Привязываем события мыши
        this.clear(); // Очищаем поле при настройке
    }
}