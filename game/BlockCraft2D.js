// Файл: ./game/BlockCraft2D.js
import { BaseModule } from './BaseModule.js';

export class BlockCraft2D extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '⛏️';
        this.gameDescription = 'BlockCraft 2D. Собирайте ресурсы и стройте!';
        this.name = 'BlockCraft 2D';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.mapWidth = 100; // Ширина карты
        this.mapHeight = 100; // Высота карты
        this.visibleWidth = 0; // Видимая ширина
        this.visibleHeight = 0; // Видимая высота
        this.offsetX = 0; // Смещение по X
        this.offsetY = 0; // Смещение по Y
        this.selectedTiles = {}; // Текущие видимые блоки
        this.blockTypes = {
            dirt: { color: '#8B4513', breakable: true },
            stone: { color: '#A9A9A9', breakable: true },
            water: { color: '#1E90FF', breakable: false },
            grass: { color: '#228B22', breakable: true }
        };
    }

    setup() {
        this.generateMap(); // Генерация карты
        this.calculateVisibleArea(); // Расчёт видимой области
        this.drawVisibleArea(); // Отрисовка видимой области
        this.bindMouseEvents(); // Привязка событий мыши
    }

    generateMap() {
        // Генерация случайной карты
        for (let x = 0; x < this.mapWidth; x++) {
            for (let y = 0; y < this.mapHeight; y++) {
                const blockType = this.getRandomBlockType();
                const key = `${x},${y}`;
                this.gridManager.selectedTiles[key] = { type: blockType, color: this.blockTypes[blockType].color };
            }
        }
    }

    getRandomBlockType() {
        const blockTypes = ['dirt', 'stone', 'water', 'grass'];
        return blockTypes[Math.floor(Math.random() * blockTypes.length)];
    }

    calculateVisibleArea() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.visibleWidth = visibleWidth;
        this.visibleHeight = visibleHeight;
    }

    drawVisibleArea() {
        this.gridManager.selectedTiles = {};
        for (let x = this.offsetX; x < this.offsetX + this.visibleWidth; x++) {
            for (let y = this.offsetY; y < this.offsetY + this.visibleHeight; y++) {
                const key = `${x},${y}`;
                if (this.gridManager.selectedTiles[key]) {
                    continue;
                }
                const blockType = this.getBlockType(x, y);
                this.gridManager.selectedTiles[key] = { type: blockType, color: this.blockTypes[blockType].color };
            }
        }
        this.gridManager.updateVisibleTiles();
    }

    getBlockType(x, y) {
        const key = `${x},${y}`;
        return this.gridManager.selectedTiles[key]?.type || 'dirt';
    }

    bindMouseEvents() {
        this.gridManager.stage.off();
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

        this.gridManager.stage.on('wheel', (event) => {
            event.evt.preventDefault();
            const delta = event.evt.deltaY;
            if (delta > 0) {
                this.offsetX = Math.min(this.offsetX + 1, this.mapWidth - this.visibleWidth);
                this.offsetY = Math.min(this.offsetY + 1, this.mapHeight - this.visibleHeight);
            } else {
                this.offsetX = Math.max(this.offsetX - 1, 0);
                this.offsetY = Math.max(this.offsetY - 1, 0);
            }
            this.drawVisibleArea();
        });
    }

    handleLeftClick(x, y) {
        const key = `${x},${y}`;
        const block = this.gridManager.selectedTiles[key];
        if (block && this.blockTypes[block.type].breakable) {
            delete this.gridManager.selectedTiles[key];
            this.gridManager.updateVisibleTiles();
        }
    }

    handleRightClick(x, y) {
        const key = `${x},${y}`;
        this.gridManager.selectedTiles[key] = { type: 'dirt', color: this.blockTypes.dirt.color };
        this.gridManager.updateVisibleTiles();
    }

    start() {
        this.isRunning = true;
    }

    pause() {
        this.isRunning = false;
    }

    clear() {
        this.gridManager.selectedTiles = {};
        this.offsetX = 0;
        this.offsetY = 0;
        this.gridManager.updateVisibleTiles();
    }
}