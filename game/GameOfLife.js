// Файл: ./game/GameOfLife.js
import { BaseModule } from './BaseModule.js';

export class GameOfLife extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '🎮';
        this.gameDescription = 'Классическая игра "Жизнь". Наблюдайте за эволюцией клеток.';
        this.name = 'GameOfLife';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.interval = null;

        this.isDragging = false;
        this.lastPointerPosition = { x: 0, y: 0 };
        // Объект для отслеживания состояния клавиш
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false,
        };
    }

    setup() {
        this.bindMouseEvents(); // Привязываем события мыши
        this.clear(); // Очищаем поле при настройке
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

        // Перемещение сцены мышью (правая кнопка)
        this.gridManager.stage.on('mousedown', (event) => {
            if (event.evt.button === 2) { // Правая кнопка
                this.isDragging = true;
                this.lastPointerPosition = this.gridManager.stage.getPointerPosition();
            }
        });

        this.gridManager.stage.on('mousemove', (event) => {
            if (this.isDragging) {
                const pos = this.gridManager.stage.getPointerPosition();
                if (pos) {
                    const dx = pos.x - this.lastPointerPosition.x;
                    const dy = pos.y - this.lastPointerPosition.y;
                    this.gridManager.stage.x(this.gridManager.stage.x() + dx);
                    this.gridManager.stage.y(this.gridManager.stage.y() + dy);
                    this.lastPointerPosition = pos;
                    this.gridManager.updateVisibleTiles(); 
                }
            }
        });
        this.gridManager.stage.on('mouseup', () => {
            this.isDragging = false;
        });

        // Изменение размера окна
        window.addEventListener('resize', () => {
            this.gridManager.stage.width(window.innerWidth);
            this.gridManager.stage.height(window.innerHeight);
            this.gridManager.updateVisibleTiles(); 
        });

        // Обработка нажатия клавиш
        window.addEventListener('keydown', (event) => {
            if (this.keys.hasOwnProperty(event.key)) {
                this.keys[event.key] = true; // Отмечаем клавишу как нажатую
                this.moveStage();
            }
        });

        // Обработка отпускания клавиш
        window.addEventListener('keyup', (event) => {
            if (this.keys.hasOwnProperty(event.key)) {
                this.keys[event.key] = false; // Отмечаем клавишу как отпущенную
            }
        });
    }


    // Функция для перемещения сцены
    moveStage() {
        const moveStep = 10;
        if (this.keys.ArrowLeft) {
            this.gridManager.stage.x(this.gridManager.stage.x() + moveStep);
        }
        if (this.keys.ArrowRight) {
            this.gridManager.stage.x(this.gridManager.stage.x() - moveStep);
        }
        if (this.keys.ArrowUp) {
            this.gridManager.stage.y(this.gridManager.stage.y() + moveStep);
        }
        if (this.keys.ArrowDown) {
            this.gridManager.stage.y(this.gridManager.stage.y() - moveStep);
        }
        this.gridManager.updateVisibleTiles();
    }

    showContextMenu(x, y) {

    }


}