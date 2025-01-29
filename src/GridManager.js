// Файл: ./src/GridManager.js
export class GridManager {
    constructor(controls) {
        this.controls = controls;
        this.tileSize = 10;
        this.gap = 1;
        this.totalSize = this.tileSize + this.gap;
        this.backgroundColor = '#2C2C2C';
        this.stage = new Konva.Stage({
            container: 'container',
            width: window.innerWidth,
            height: window.innerHeight,
            type: 'webgl',
        });
        this.layer = new Konva.Layer();
        this.stage.add(this.layer);
        this.selectedTiles = {};
        this.tilePool = [];
        this.updateScheduled = false;
        
        this.updateVisibleTiles();
    }

    createTile(x, y) {
        let tile;
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

        const cellKey = `${x},${y}`;
        if (this.selectedTiles[cellKey]) {
            tile.fill(this.selectedTiles[cellKey].color);
        }
        return tile;
    }

    updateVisibleTiles() {
        this.layer.destroyChildren();
        const visibleWidth = Math.ceil(this.stage.width() / this.totalSize) + 1;
        const visibleHeight = Math.ceil(this.stage.height() / this.totalSize) + 1;
        const startX = Math.floor(-this.stage.x() / this.totalSize);
        const startY = Math.floor(-this.stage.y() / this.totalSize);
        let c=0;
        for (let x = startX; x < startX + visibleWidth; x++) {
            for (let y = startY; y < startY + visibleHeight; y++) {
                const cellKey = `${x},${y}`;
                // Создаем тайл только если он есть в selectedTiles
                
                if (this.selectedTiles[cellKey]) {
                    const tile = this.createTile(x, y);
                    this.layer.add(tile);
                    c++;
                }
                //const tile = this.createTile(x, y);
                //this.layer.add(tile);
            }
        }
        console.log(c);

        this.layer.batchDraw();
    }
}