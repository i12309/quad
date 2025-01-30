// Файл: ./src/GridManager.js
export class GridManager {
    constructor(controls) {
        this.controls = controls;
        this.stage = new Konva.Stage({
            container: 'container',
            width: window.innerWidth,
            height: window.innerHeight,
            type: 'webgl',
        });
        this.setup();
    }

    setup(){
        this.tileSize = 10;
        this.gap = 1;
        this.totalSize = this.tileSize + this.gap;
        this.backgroundColor = '#2C2C2C';
        this.layer = new Konva.Layer();
        this.stage.add(this.layer);
        this.selectedTiles = {};
        this.tilePool = [];
        
        this.stage.off();
        this.updateVisibleTiles();
    }

    createTile(x, y) {
        const cellKey = `${x},${y}`;
        if (this.selectedTiles[cellKey].type == 'text') {
            // Создание текстового элемента
            return new Konva.Text({
                x: (x * this.tileSize), // Позиция по оси X
                y: (y * this.tileSize), // Позиция по оси Y
                text: this.selectedTiles[cellKey].text, // Текст
                fontSize: 12, // Размер шрифта
                fontFamily: 'Arial', // Семейство шрифтов
                fill: '#ccc', // Цвет текста
                align: 'center', // Выравнивание текста (если есть width)
                width: 200, // Ширина области текста (опционально)
                padding: 10, // Внутренний отступ (опционально)
                fontStyle: 'bold', // Стиль шрифта (normal, bold, italic)
            });
        }
        else {
        return new Konva.Rect({
            id: cellKey,
            x: x * this.totalSize,
            y: y * this.totalSize,
            width: this.tileSize,
            height: this.tileSize,
            fill: this.selectedTiles[cellKey].color, // Цвет берем из selectedTiles
            stroke: null,
            strokeWidth: 0,
            listening: true,
        });
        }
    }

    updateVisibleTiles() {
        this.layer.destroyChildren();
        const visibleWidth = Math.ceil(this.stage.width() / this.totalSize) + 1;
        const visibleHeight = Math.ceil(this.stage.height() / this.totalSize) + 1;
        const startX = Math.floor(-this.stage.x() / this.totalSize);
        const startY = Math.floor(-this.stage.y() / this.totalSize);
        for (let x = startX; x < startX + visibleWidth; x++) {
            for (let y = startY; y < startY + visibleHeight; y++) {
                const cellKey = `${x},${y}`;
                // Создаем тайл только если он есть в selectedTiles
                if (this.selectedTiles[cellKey]) {
                    const tile = this.createTile(x, y);
                    this.layer.add(tile);
                }
            }
        }

        this.layer.batchDraw();
    }
}