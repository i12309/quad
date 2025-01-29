// Файл: ./game/PingPong.js
import { BaseModule } from './BaseModule.js';

export class PingPong extends BaseModule {
    constructor(gridManager) {
        super();
        this.name = 'PingPong';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.ball = { x: 0, y: 0, dx: 1, dy: -1 };
        this.platform = { x: 0, width: 6 };
        this.interval = null;
        this.speed = 100;
        this.score = 0;
        this.fieldWidth = 0;
        this.fieldHeight = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    setup() {
        this.clear(); // Инициализируем игру
        this.ball = { x: Math.floor(this.fieldWidth / 2), y: Math.floor(this.fieldHeight / 2), dx: 1, dy: -1 };
        this.platform = { x: Math.floor(this.fieldWidth / 2) - Math.floor(this.platform.width / 2), width: 6 };
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
        this.score = 0;
        this.gridManager.selectedTiles = {};
        this.ball = { x: Math.floor(this.fieldWidth / 2), y: Math.floor(this.fieldHeight / 2), dx: 1, dy: -1 };
        this.platform = { x: Math.floor(this.fieldWidth / 2) - Math.floor(this.platform.width / 2), width: 6 };
        this.drawBorder(); // Рассчитываем размеры поля и Рисуем границы поля
        this.bindMouseEvents(); // Привязываем события мыши
        this.gridManager.updateVisibleTiles();
    }

    update() {
        const oldBallKey = `${this.offsetX + this.ball.x},${this.offsetY + this.ball.y}`;
        delete this.gridManager.selectedTiles[oldBallKey];

        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        if (this.ball.x <= 0 || this.ball.x >= this.fieldWidth - 1) {
            this.ball.dx *= -1;
        }
        if (this.ball.y <= 0) {
            this.ball.dy *= -1;
        }

        if (this.ball.y === this.fieldHeight - 6) {
            if (this.ball.x >= this.platform.x && this.ball.x < this.platform.x + this.platform.width) {
                this.ball.dy *= -1;
                this.score++;
            } else {
                this.pause();
                alert(`Игра окончена! Ваш счёт: ${this.score}`);
                this.clear();
            }
        }

        const ballKey = `${this.offsetX + this.ball.x},${this.offsetY + this.ball.y}`;
        this.gridManager.selectedTiles[ballKey] = { type: 'ball', color: '#FFFF00' };

        for (let i = 0; i < this.platform.width; i++) {
            const oldPlatformKey = `${this.offsetX + this.platform.x + i},${this.offsetY + this.fieldHeight - 5}`;
            //console.log(this.gridManager.selectedTiles[oldPlatformKey]);
            //delete this.gridManager.selectedTiles[oldPlatformKey];
            delete this.gridManager.selectedTiles;//[oldPlatformKey] = { type: 'none', color: this.gridManager.backgroundColor };
            //console.log(this.gridManager.selectedTiles[oldPlatformKey]);
        }

        for (let i = 0; i < this.platform.width; i++) {
            const platformKey = `${this.offsetX + this.platform.x + i},${this.offsetY + this.fieldHeight - 5}`;
            this.gridManager.selectedTiles[platformKey] = { type: 'platform', color: '#0000FF' };
        }

        this.gridManager.updateVisibleTiles();
    }

    drawBorder() {
        // Вычисляем размеры поля и его координаты
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.fieldWidth = Math.floor(visibleWidth / 3);
        this.fieldHeight = Math.floor(visibleHeight * 0.8);
        this.offsetX = Math.floor((visibleWidth - this.fieldWidth) / 2);
        this.offsetY = Math.floor((visibleHeight - this.fieldHeight) / 2);
        
        // рисуем игровое поле 
        for (let x = this.offsetX - 1; x < this.offsetX + this.fieldWidth + 1; x++) {
            for (let y = this.offsetY - 1; y < this.offsetY + this.fieldHeight + 1; y++) {
                const key = `${x},${y}`;
                if (x === this.offsetX - 1 || x === this.offsetX + this.fieldWidth ||
                    y === this.offsetY - 1 || y === this.offsetY + this.fieldHeight) {
                    this.gridManager.selectedTiles[key] = { type: 'wall', color: '#CCCCCC' };
                }
            }
        }
        this.gridManager.updateVisibleTiles();
    }

    bindMouseEvents() {
        this.gridManager.stage.off();
        this.gridManager.stage.on('mousemove', (event) => {
            const pos = this.gridManager.stage.getPointerPosition();
            if (!pos) return;

            const platformX = Math.floor((pos.x - this.gridManager.stage.x()) / this.gridManager.totalSize) - this.offsetX;
            this.platform.x = Math.max(0, Math.min(platformX - Math.floor(this.platform.width / 2), this.fieldWidth - this.platform.width));
        });
    }

    showContextMenu(x, y) {
        // 
    }

    toggleCell(x, y) {
        // В PingPong нет необходимости переключать клетки
    }

    handleLeftClick(x, y) {
        // В PingPong левый клик не используется
    }

    handleRightClick(x, y) {
        //this.showContextMenu(x, y);
    }
}