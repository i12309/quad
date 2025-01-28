// Файл: ./game/StageManager.js

export class StageManager {
    constructor(gridManager) {
        this.gridManager = gridManager;
        this.isDragging = false;
        this.lastPointerPosition = { x: 0, y: 0 };
        // Объект для отслеживания состояния клавиш
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false,
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
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
                    this.gridManager.scheduleUpdate(); // Используем scheduleUpdate для пакетной отрисовки
                }
            }
        });
        this.gridManager.stage.on('mouseup', () => {
            this.isDragging = false;
        });

        // Масштабирование колесом мыши
        this.gridManager.stage.container().addEventListener('wheel', (event) => {
            event.preventDefault();
            const pointerPos = this.gridManager.stage.getPointerPosition();
            if (!pointerPos) return;
            const oldTileSize = this.gridManager.tileSize;
            const newTileSize = event.deltaY < 0 ? oldTileSize + 1 : oldTileSize - 1;
            this.gridManager.tileSize = Math.max(this.gridManager.minTileSize, Math.min(this.gridManager.maxTileSize, newTileSize));
            this.gridManager.updateVisibleTiles(this.gridManager.tileSize);
            const scaleFactor = this.gridManager.tileSize / oldTileSize;
            this.gridManager.stage.x((pointerPos.x - this.gridManager.stage.x()) * (1 - scaleFactor) + this.gridManager.stage.x());
            this.gridManager.stage.y((pointerPos.y - this.gridManager.stage.y()) * (1 - scaleFactor) + this.gridManager.stage.y());
        });

        // Изменение размера окна
        window.addEventListener('resize', () => {
            this.gridManager.stage.width(window.innerWidth);
            this.gridManager.stage.height(window.innerHeight);
            this.gridManager.scheduleUpdate(); // Используем scheduleUpdate для пакетной отрисовки
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
        this.gridManager.scheduleUpdate(); // Используем scheduleUpdate для пакетной отрисовки
    }
}