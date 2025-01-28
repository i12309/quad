// Файл: ./game/ColorSpread.js
import { BaseModule } from './BaseModule.js';

export class ColorSpread extends BaseModule {
    constructor(gridManager) {
        super();
        this.name = 'ColorSpread';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.movesLeft = 10; // Ограниченное количество ходов
        this.colors = ['#FF0000', '#00FF00', '#0000FF']; // Цвета для клеток
        this.baseCell = null; // Базовая клетка игрока
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.randomizeGrid(); // Заполняем сетку случайными цветами
            this.selectBaseCell(); // Выбираем начальную базовую клетку
            this.updateMovesCounter(); // Обновляем счётчик ходов
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
        }
    }

    clear() {
        this.gridManager.selectedTiles = {};
        this.gridManager.updateVisibleTiles();
        this.movesLeft = 10;
        this.baseCell = null;
        this.updateMovesCounter();
    }

    randomizeGrid() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        for (let x = 0; x < visibleWidth; x++) {
            for (let y = 0; y < visibleHeight; y++) {
                const color = this.colors[Math.floor(Math.random() * this.colors.length)];
                this.gridManager.selectedTiles[`${x},${y}`] = { type: color };
            }
        }
        this.gridManager.updateVisibleTiles();
    }

    selectBaseCell() {
        const keys = Object.keys(this.gridManager.selectedTiles);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const [x, y] = randomKey.split(',').map(Number);
        this.baseCell = { x, y, color: this.gridManager.selectedTiles[randomKey].type };
        this.highlightBaseCell();
    }

    highlightBaseCell() {
        const baseKey = `${this.baseCell.x},${this.baseCell.y}`;
        const tile = this.gridManager.layer.findOne(`#${baseKey}`);
        if (tile) {
            tile.stroke('#FFFFFF'); // Белая граница для выделения
            tile.strokeWidth(2);
        }
        this.gridManager.layer.batchDraw();
    }

    updateMovesCounter() {
        console.log(`Осталось ходов: ${this.movesLeft}`);
        // Здесь можно добавить отображение счётчика в интерфейсе
    }

    handleLeftClick(x, y) {
        if (!this.isRunning || this.movesLeft <= 0) return;

        const clickedKey = `${x},${y}`;
        const clickedTile = this.gridManager.selectedTiles[clickedKey];
        if (!clickedTile) return;

        if (clickedTile.type === this.baseCell.color) {
            this.spreadColor(x, y, this.baseCell.color);
            this.movesLeft--;
            this.updateMovesCounter();
        }

        if (this.movesLeft === 0) {
            this.pause();
            console.log('Игра окончена!');
        }
    }

    spreadColor(x, y, targetColor) {
        const stack = [[x, y]];
        while (stack.length > 0) {
            const [cx, cy] = stack.pop();
            const key = `${cx},${cy}`;
            const tile = this.gridManager.selectedTiles[key];
            if (!tile || tile.type !== targetColor) continue;

            tile.type = this.baseCell.color;
            stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
        this.gridManager.updateVisibleTiles();
    }

    showContextMenu(x, y) {
        const contextMenu = document.createElement('div');
        contextMenu.style.position = 'absolute';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.backgroundColor = 'white';
        contextMenu.style.border = '1px solid black';
        contextMenu.style.padding = '10px';
        contextMenu.style.zIndex = '1000';

        const restartButton = document.createElement('button');
        restartButton.textContent = 'Начать заново';
        restartButton.addEventListener('click', () => {
            this.clear();
            this.start();
            contextMenu.remove();
        });

        contextMenu.appendChild(restartButton);
        document.body.appendChild(contextMenu);

        document.addEventListener('click', (event) => {
            if (!contextMenu.contains(event.target)) {
                contextMenu.remove();
            }
        }, { once: true });
    }
}