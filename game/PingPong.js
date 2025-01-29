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
        this.calculateFieldDimensions();
        this.bindMouseEvents(gridManager);
    }

    calculateFieldDimensions() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.fieldWidth = Math.floor(visibleWidth / 3);
        this.fieldHeight = Math.floor(visibleHeight * 0.9);
        this.offsetX = Math.floor((visibleWidth - this.fieldWidth) / 2);
        this.offsetY = Math.floor((visibleHeight - this.fieldHeight) / 2);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.resetGame();
            this.drawFieldBorder();
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
        this.gridManager.selectedTiles = {};
        this.gridManager.updateVisibleTiles();
        this.resetGame();
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
            delete this.gridManager.selectedTiles[oldPlatformKey];
        }

        for (let i = 0; i < this.platform.width; i++) {
            const platformKey = `${this.offsetX + this.platform.x + i},${this.offsetY + this.fieldHeight - 5}`;
            this.gridManager.selectedTiles[platformKey] = { type: 'platform', color: '#0000FF' };
        }

        this.gridManager.updateVisibleTiles();
    }

    toggleCell(x, y) {
        // В PingPong нет необходимости переключать клетки
    }

    handleLeftClick(x, y) {
        // В PingPong левый клик не используется
    }

    handleRightClick(x, y) {
        this.showContextMenu(x, y);
    }

    bindMouseEvents(gridManager) {
        gridManager.stage.on('mousemove', (event) => {
            const pos = gridManager.stage.getPointerPosition();
            if (!pos) return;

            const platformX = Math.floor((pos.x - gridManager.stage.x()) / gridManager.totalSize) - this.offsetX;
            this.platform.x = Math.max(0, Math.min(platformX - Math.floor(this.platform.width / 2), this.fieldWidth - this.platform.width));
        });

        gridManager.stage.on('click', (event) => {
            const pos = gridManager.stage.getPointerPosition();
            if (!pos) return;

            const x = Math.floor((pos.x - gridManager.stage.x()) / gridManager.totalSize);
            const y = Math.floor((pos.y - gridManager.stage.y()) / gridManager.totalSize);

            if (event.evt.button === 0) {
                this.handleLeftClick(x, y);
            } else if (event.evt.button === 2) {
                this.handleRightClick(x, y);
            }
        });
    }

    showContextMenu(x, y) {
        const contextMenu = document.createElement('div');
        contextMenu.style.position = 'absolute';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.backgroundColor = '#fff';
        contextMenu.style.border = '1px solid #ccc';
        contextMenu.style.padding = '5px';
        contextMenu.innerHTML = '<p>Контекстное меню</p>';
        document.body.appendChild(contextMenu);

        document.addEventListener('click', () => contextMenu.remove(), { once: true });
    }
}