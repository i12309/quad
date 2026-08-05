// Файл: ./game/GameOfLife.js
import { BaseModule } from './BaseModule.js';

export class GameOfLife extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '🧬';
        this.gameDescription = 'Классическая игра «Жизнь». Наблюдайте за эволюцией клеток.';
        this.name = 'GameOfLife';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.interval = null;
        this.isDragging = false;
        this.lastPointerPosition = null;
        this.colors = ['#39D353', '#26A641', '#15913A', '#087B35', '#006D32'];
        this.gridScale = {
            min: 8,
            max: 32,
            step: 2,
            defaultTileSize: 12,
            defaultGap: 4,
            value: 12,
        };
    }

    setup() {
        this.applyGridScale();
        this.clearBindings();
        this.bindInputEvents();
        this.clear();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.setStatus('Эволюция запущена.', 'running');
        this.interval = setInterval(() => this.update(), 100);
    }

    pause() {
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
    }

    clear() {
        this.pause();
        this.isDragging = false;
        this.lastPointerPosition = null;
        this.gridManager.selectedTiles = {};
        this.render();
        this.setStatus('Левая кнопка — клетка, правая — перемещение поля.', 'ready');
    }

    update() {
        if (!this.isRunning) return;

        const currentTiles = this.gridManager.selectedTiles;
        const newSelectedTiles = {};
        const cellsToCheck = new Set();

        for (const key of Object.keys(currentTiles)) {
            const [x, y] = key.split(',').map(Number);
            cellsToCheck.add(key);
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx !== 0 || dy !== 0) cellsToCheck.add(`${x + dx},${y + dy}`);
                }
            }
        }

        cellsToCheck.forEach((key) => {
            const [x, y] = key.split(',').map(Number);
            const neighbors = this.countNeighbors(x, y, currentTiles);
            const currentCell = currentTiles[key];

            if (currentCell && (neighbors === 2 || neighbors === 3)) {
                const age = (currentCell.age || 1) + 1;
                newSelectedTiles[key] = { type: 'pixel', age, color: this.colorForAge(age) };
            } else if (!currentCell && neighbors === 3) {
                newSelectedTiles[key] = { type: 'pixel', age: 1, color: this.colorForAge(1) };
            }
        });

        this.gridManager.selectedTiles = newSelectedTiles;
        this.render();
    }

    countNeighbors(x, y, tiles = this.gridManager.selectedTiles) {
        let count = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                if (tiles[`${x + dx},${y + dy}`]) count++;
            }
        }
        return count;
    }

    colorForAge(age) {
        return this.colors[Math.min(Math.max(age - 1, 0), this.colors.length - 1)];
    }

    toggleCell(x, y) {
        const cellKey = `${x},${y}`;
        if (this.gridManager.selectedTiles[cellKey]) {
            delete this.gridManager.selectedTiles[cellKey];
        } else {
            this.gridManager.selectedTiles[cellKey] = {
                type: 'pixel',
                age: 1,
                color: this.colorForAge(1)
            };
        }
        this.render();
    }

    render() {
        this.gridManager.updateVisibleTiles();
    }

    pointerToCell() {
        const pos = this.gridManager.stage.getPointerPosition();
        if (!pos) return null;
        return {
            x: Math.floor((pos.x - this.gridManager.stage.x()) / this.gridManager.totalSize),
            y: Math.floor((pos.y - this.gridManager.stage.y()) / this.gridManager.totalSize)
        };
    }

    bindInputEvents() {
        this.bindStage('click', (event) => {
            if (event.evt.button !== 0) return;
            const cell = this.pointerToCell();
            if (cell) this.toggleCell(cell.x, cell.y);
        });

        this.bindStage('mousedown', (event) => {
            if (event.evt.button !== 2) return;
            event.evt.preventDefault();
            this.isDragging = true;
            this.lastPointerPosition = this.gridManager.stage.getPointerPosition();
        });

        this.bindStage('mousemove', () => {
            if (!this.isDragging || !this.lastPointerPosition) return;
            const pos = this.gridManager.stage.getPointerPosition();
            if (!pos) return;

            this.gridManager.stage.x(this.gridManager.stage.x() + pos.x - this.lastPointerPosition.x);
            this.gridManager.stage.y(this.gridManager.stage.y() + pos.y - this.lastPointerPosition.y);
            this.lastPointerPosition = pos;
            this.render();
        });

        this.bindStage('mouseup mouseleave', () => this.stopDragging());
        this.bindDom(window, 'mouseup', () => this.stopDragging());
        this.bindDom(this.gridManager.stage.container(), 'contextmenu', (event) => event.preventDefault());
        this.bindDom(window, 'keydown', (event) => {
            const moves = {
                ArrowLeft: [10, 0],
                ArrowRight: [-10, 0],
                ArrowUp: [0, 10],
                ArrowDown: [0, -10]
            };
            const move = moves[event.key];
            if (!move) return;
            event.preventDefault();
            this.gridManager.stage.x(this.gridManager.stage.x() + move[0]);
            this.gridManager.stage.y(this.gridManager.stage.y() + move[1]);
            this.render();
        });
    }

    stopDragging() {
        this.isDragging = false;
        this.lastPointerPosition = null;
    }

    onResize() {
        this.render();
    }

    onGridScaleChange(context) {
        this.gridManager.restoreViewportAnchor?.(context?.anchor);
        this.render();
    }

    destroy() {
        this.stopDragging();
        super.destroy();
    }

    handleLeftClick(x, y) { this.toggleCell(x, y); }
    handleRightClick() {}
    showContextMenu() {}
}
