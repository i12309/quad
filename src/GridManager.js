// Файл: ./game/GridManager.js

export class GridManager {
    constructor() {
        this.tileSize = 10;
        this.gap = 1;
        this.totalSize = this.tileSize + this.gap;
        this.minTileSize = 3;
        this.maxTileSize = 10;
        this.backgroundColor = '#2C2C2C';
        this.selectedColor = '#CCCCCC'; // Серый цвет
        this.yellowColor = '#FFFF99'; // Желтый цвет
        this.stage = new Konva.Stage({
            container: 'container',
            width: window.innerWidth,
            height: window.innerHeight,
            type: 'webgl', // Включаем WebGL
        });
        this.layer = new Konva.Layer();
        this.stage.add(this.layer);
        this.selectedTiles = {}; // Хранит состояние клеток: { "x,y": { type: 'gray' | 'yellow' } }
        this.isDrawing = false;
        this.currentAction = null; // 'draw' или 'erase'
        this.tilePool = [];
        this.updateScheduled = false;
        
        this.bindMouseEvents();
        this.updateVisibleTiles();
    }

    scheduleUpdate() {
        if (!this.updateScheduled) {
            this.updateScheduled = true;
            requestAnimationFrame(() => {
                this.updateVisibleTiles();
                this.updateScheduled = false;
            });
        }
    }

    createTile(x, y) {
        let tile;
        if (this.tilePool.length > 0) {
            tile = this.tilePool.pop();
            tile.setAttrs({
                id: `${x},${y}`,
                x: x * this.totalSize,
                y: y * this.totalSize,
                fill: this.backgroundColor,
                visible: true,
            });
        } else {
            tile = new Konva.Rect({
                id: `${x},${y}`,
                x: x * this.totalSize,
                y: y * this.totalSize,
                width: this.tileSize,
                height: this.tileSize,
                fill: this.backgroundColor,
                stroke: null,
                strokeWidth: 0,
                listening: true,
            });
            tile.on('click', () => {
                this.toggleCell(x, y);
            });
        }
        const cellKey = `${x},${y}`;
        if (this.selectedTiles[cellKey]) {
            //tile.fill(this.selectedTiles[cellKey].type === 'gray' ? this.selectedColor : this.yellowColor);
            tile.fill(this.selectedTiles[cellKey].color);
            console.log(this.selectedTiles[cellKey].color);
        }
        return tile;
    }

    toggleCell(x, y) {
        const cellKey = `${x},${y}`;
        let tile = this.layer.findOne(`#${cellKey}`);
        if (!tile) {
            tile = this.createTile(x, y);
            this.layer.add(tile);
        }
        if (this.selectedTiles[cellKey]) {
                // Удаляем клетку
                delete this.selectedTiles[cellKey];
                tile.fill(this.backgroundColor);
            /*if (this.selectedTiles[cellKey].type === 'gray') {
                // Меняем тип клетки на желтый
                this.selectedTiles[cellKey].type = 'yellow';
                tile.fill(this.yellowColor);
            } else {
                // Удаляем клетку
                delete this.selectedTiles[cellKey];
                tile.fill(this.backgroundColor);
            }*/
        } else {
            // Создаем новую серую клетку
            this.selectedTiles[cellKey] = { type: 'gray' };
            tile.fill(this.selectedColor);
        }
        this.scheduleUpdate();
    }

    updateVisibleTiles(newTileSize) {
        this.tileSize = newTileSize || this.tileSize;
        this.totalSize = this.tileSize + this.gap;
        this.layer.destroyChildren();
        const visibleWidth = Math.ceil(this.stage.width() / this.totalSize) + 1;
        const visibleHeight = Math.ceil(this.stage.height() / this.totalSize) + 1;
        const startX = Math.floor(-this.stage.x() / this.totalSize);
        const startY = Math.floor(-this.stage.y() / this.totalSize);
        for (let x = startX; x < startX + visibleWidth; x++) {
            for (let y = startY; y < startY + visibleHeight; y++) {
                const tile = this.createTile(x, y);
                this.layer.add(tile);
            }
        }
        this.layer.batchDraw();
    }

    bindMouseEvents() {
        this.stage.on('mousedown', (e) => {
            if (e.evt.button !== 0) return;
            
            const pos = this.stage.getPointerPosition();
            if (!pos) return;
            
            // Учитываем смещение сцены
            const x = Math.floor((pos.x - this.stage.x()) / this.totalSize);
            const y = Math.floor((pos.y - this.stage.y()) / this.totalSize);
            
            this.currentAction = this.selectedTiles[`${x},${y}`] ? 'erase' : 'draw';
            this.handleCellAction(x, y, this.currentAction);
            this.isDrawing = true;
        });
        this.stage.on('mousemove', (e) => {
            if (!this.isDrawing) return;
            
            const pos = this.stage.getPointerPosition();
            if (!pos) return;
            
            // Учитываем смещение сцены
            const x = Math.floor((pos.x - this.stage.x()) / this.totalSize);
            const y = Math.floor((pos.y - this.stage.y()) / this.totalSize);
            
            this.handleCellAction(x, y, this.currentAction);
        });
        this.stage.on('mouseup', () => {
            this.isDrawing = false;
        });
        this.stage.container().addEventListener('contextmenu', (e) => e.preventDefault());
    }

    handleCellAction(x, y, action) {
        const cellKey = `${x},${y}`;
        let tile = this.layer.findOne(`#${cellKey}`);
        // Если клетка не существует и действие - рисование, создаем её
        if (!tile && action === 'draw') {
            tile = this.createTile(x, y);
            this.layer.add(tile);
        }
        if (!tile) return;
        if (action === 'draw') {
            //this.selectedTiles[cellKey] = { type: 'gray' };
            this.selectedTiles[cellKey].type = 'none'; // Меняем тип
            this.selectedTiles[cellKey].color = this.selectedColor;
            tile.fill(this.selectedColor);
        } else if (action === 'erase') {
            delete this.selectedTiles[cellKey];
            tile.fill(this.backgroundColor);
        }
        
        this.scheduleUpdate();
    }

    clearGrid() {
        this.selectedTiles = {};
        this.tilePool.push(...this.layer.getChildren().toArray());
        this.layer.destroyChildren();
        this.updateVisibleTiles();
    }
}