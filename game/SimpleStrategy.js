// Файл: ./game/SimpleStrategy.js
import { BaseModule } from './BaseModule.js';

export class SimpleStrategy extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '🏰';
        this.gameDescription = 'Упрощенная стратегическая игра. Стройте базы, собирайте ресурсы и управляйте армией.';
        this.name = 'SimpleStrategy';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.interval = null;
        this.speed = 1000; // Обновление игры каждую секунду
        this.resources = { wood: 0, gold: 0 };
        this.units = [];
        this.buildings = [];
        this.mapWidth = 1000;
        this.mapHeight = 1000;
        this.visibleTiles = {}; // Только видимые тайлы
        this.offsetX = 0;
        this.offsetY = 0;
        this.selectedUnit = null;
    }

    setup() {
        this.clear();
        this.generateMap();
        this.bindMouseEvents();
        this.gridManager.updateVisibleTiles();
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
        this.resources = { wood: 0, gold: 0 };
        this.units = [];
        this.buildings = [];
        this.visibleTiles = {};
        this.gridManager.selectedTiles = {};
        this.gridManager.updateVisibleTiles();
    }

    update() {
        this.updateUnits();
        this.updateBuildings();
        this.updateVisibleTiles();
        this.gridManager.updateVisibleTiles();
    }

    generateMap() {
        // Генерация леса
        for (let x = 0; x < this.mapWidth; x++) {
            for (let y = 0; y < this.mapHeight; y++) {
                if (Math.random() < 0.2) {
                    this.gridManager.selectedTiles[`${x},${y}`] = { type: 'forest', color: '#00FF00' };
                }
            }
        }

        // Генерация воды по границам
        for (let x = 0; x < this.mapWidth; x++) {
            this.gridManager.selectedTiles[`${x},0`] = { type: 'water', color: '#0000FF' };
            this.gridManager.selectedTiles[`${x},${this.mapHeight - 1}`] = { type: 'water', color: '#0000FF' };
        }
        for (let y = 0; y < this.mapHeight; y++) {
            this.gridManager.selectedTiles[`0,${y}`] = { type: 'water', color: '#0000FF' };
            this.gridManager.selectedTiles[`${this.mapWidth - 1},${y}`] = { type: 'water', color: '#0000FF' };
        }
    }

    updateUnits() {
        this.units.forEach(unit => {
            if (unit.type === 'worker' && unit.task === 'gather') {
                this.gatherWood(unit);
            }
        });
    }

    updateBuildings() {
        this.buildings.forEach(building => {
            if (building.type === 'castle') {
                this.produceUnits(building);
            }
        });
    }

    updateVisibleTiles() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.offsetX = Math.floor((this.mapWidth - visibleWidth) / 2);
        this.offsetY = Math.floor((this.mapHeight - visibleHeight) / 2);

        this.visibleTiles = {};
        for (let x = this.offsetX; x < this.offsetX + visibleWidth; x++) {
            for (let y = this.offsetY; y < this.offsetY + visibleHeight; y++) {
                const key = `${x},${y}`;
                if (this.gridManager.selectedTiles[key]) {
                    this.visibleTiles[key] = this.gridManager.selectedTiles[key];
                }
            }
        }
    }

    gatherWood(unit) {
        const forestTile = this.findNearestForest(unit.x, unit.y);
        if (forestTile) {
            unit.task = 'return';
            unit.target = forestTile;
            this.resources.wood += 10;
            delete this.gridManager.selectedTiles[forestTile];
        }
    }

    findNearestForest(x, y) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${x + dx},${y + dy}`;
                if (this.gridManager.selectedTiles[key] && this.gridManager.selectedTiles[key].type === 'forest') {
                    return key;
                }
            }
        }
        return null;
    }

    produceUnits(building) {
        if (this.resources.wood >= 50) {
            this.resources.wood -= 50;
            this.units.push({ type: 'worker', x: building.x + 1, y: building.y + 1, task: 'idle' });
        }
    }

    bindMouseEvents() {
        this.gridManager.stage.off();
        this.gridManager.stage.on('click', (event) => {
            const pos = this.gridManager.stage.getPointerPosition();
            if (!pos) return;

            const tileX = Math.floor((pos.x - this.gridManager.stage.x()) / this.gridManager.totalSize);
            const tileY = Math.floor((pos.y - this.gridManager.stage.y()) / this.gridManager.totalSize);

            this.handleLeftClick(tileX, tileY);
        });

        this.gridManager.stage.on('contextmenu', (event) => {
            event.evt.preventDefault();
            const pos = this.gridManager.stage.getPointerPosition();
            if (!pos) return;

            const tileX = Math.floor((pos.x - this.gridManager.stage.x()) / this.gridManager.totalSize);
            const tileY = Math.floor((pos.y - this.gridManager.stage.y()) / this.gridManager.totalSize);

            this.handleRightClick(tileX, tileY);
        });
    }

    handleLeftClick(x, y) {
        const key = `${x},${y}`;
        if (this.gridManager.selectedTiles[key] && this.gridManager.selectedTiles[key].type === 'worker') {
            this.selectedUnit = this.units.find(unit => unit.x === x && unit.y === y);
        } else if (this.selectedUnit) {
            this.selectedUnit.x = x;
            this.selectedUnit.y = y;
            this.selectedUnit.task = 'idle';
            this.selectedUnit = null;
        }
    }

    handleRightClick(x, y) {
        if (this.selectedUnit && this.selectedUnit.type === 'worker') {
            const forestTile = this.findNearestForest(x, y);
            if (forestTile) {
                this.selectedUnit.task = 'gather';
                this.selectedUnit.target = forestTile;
            }
        }
    }

    toggleCell(x, y) {
        // В стратегии нет необходимости переключать клетки
    }

    showContextMenu(x, y) {
        // Контекстное меню для управления юнитами
    }
}