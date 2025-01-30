// Файл: ./game/Arkanoid.js
import { BaseModule } from './BaseModule.js';

export class Arkanoid extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '🕹️';
        this.gameDescription = 'Классический Арканоид. Разбейте все блоки, управляя платформой.';
        this.name = 'Arkanoid';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.ball = { x: 0, y: 0, dx: 1, dy: -1 };
        this.platform = { x: 0, width: 6 };
        this.interval = null;
        this.speed = 50; // Скорость игры
        this.score = 0;
        this.lives = 3; // Количество жизней
        this.fieldWidth = 0;
        this.fieldHeight = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.blocks = []; // Массив блоков
    }

    setup() {
        this.clear();
        this.initBlocks(); // Инициализация блоков
        this.ball = { x: Math.floor(this.fieldWidth / 2), y: this.fieldHeight - 5, dx: 1, dy: -1 };
        this.platform = { x: Math.floor(this.fieldWidth / 2) - Math.floor(this.platform.width / 2), width: 6 };
        this.drawBorder();
        this.bindMouseEvents();
        this.drawScoreAndLives();
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
        this.lives = 3;
        this.gridManager.selectedTiles = {};
        this.ball = { x: Math.floor(this.fieldWidth / 2), y: this.fieldHeight - 5, dx: 1, dy: -1 };
        this.platform = { x: Math.floor(this.fieldWidth / 2) - Math.floor(this.platform.width / 2), width: 6 };
        this.drawBorder();
        this.initBlocks();
        this.gridManager.updateVisibleTiles();
    }

    initBlocks() {
        this.blocks = [];
        const rows = 4; // Количество рядов блоков
        const cols = 8; // Количество блоков в ряду
        const blockWidth = Math.floor(this.fieldWidth / cols);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.blocks.push({
                    x: col * blockWidth,
                    y: row * 2 + 2, // Отступ сверху
                    width: blockWidth,
                    height: 1,
                    color: this.getRandomColor(),
                    active: true
                });
            }
        }
    }

    getRandomColor() {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        const oldBallKey = `${this.offsetX + this.ball.x},${this.offsetY + this.ball.y}`;
        delete this.gridManager.selectedTiles[oldBallKey];

        // Движение мяча
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Отскок от стен
        if (this.ball.x <= 0 || this.ball.x >= this.fieldWidth - 1) {
            this.ball.dx *= -1;
        }
        if (this.ball.y <= 0) {
            this.ball.dy *= -1;
        }

        // Проверка столкновения с платформой
        if (this.ball.y >= this.fieldHeight - 2) {
            if (this.ball.x >= this.platform.x && this.ball.x < this.platform.x + this.platform.width) {
                this.ball.dy *= -1;
            } else {
                this.lives--;
                if (this.lives <= 0) {
                    this.pause();
                    alert(`Игра окончена! Ваш счёт: ${this.score}`);
                    this.clear();
                } else {
                    this.ball = { x: Math.floor(this.fieldWidth / 2), y: this.fieldHeight - 5, dx: 1, dy: -1 };
                }
            }
        }

        // Проверка столкновения с блоками
        this.blocks.forEach(block => {
            if (block.active &&
                this.ball.x >= block.x && this.ball.x < block.x + block.width &&
                this.ball.y >= block.y && this.ball.y < block.y + block.height) {
                block.active = false;
                this.ball.dy *= -1;
                this.score += 10;
            }
        });

        // Отрисовка мяча
        const ballKey = `${this.offsetX + this.ball.x},${this.offsetY + this.ball.y}`;
        this.gridManager.selectedTiles[ballKey] = { type: 'ball', color: '#FFFF00' };

        // Отрисовка платформы
        for (let i = 0; i < this.platform.width; i++) {
            const platformKey = `${this.offsetX + this.platform.x + i},${this.offsetY + this.fieldHeight - 2}`;
            this.gridManager.selectedTiles[platformKey] = { type: 'platform', color: '#0000FF' };
        }

        // Отрисовка блоков
        this.blocks.forEach(block => {
            if (block.active) {
                for (let i = 0; i < block.width; i++) {
                    const blockKey = `${this.offsetX + block.x + i},${this.offsetY + block.y}`;
                    this.gridManager.selectedTiles[blockKey] = { type: 'block', color: block.color };
                }
            }
        });

        // Очистка неактивных блоков
        this.blocks = this.blocks.filter(block => block.active);

        // Проверка победы
        if (this.blocks.length === 0) {
            this.pause();
            alert(`Победа! Ваш счёт: ${this.score}`);
            this.clear();
        }

        this.drawScoreAndLives();
        this.gridManager.updateVisibleTiles();
    }

    drawBorder() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.fieldWidth = Math.floor(visibleWidth * 0.9); // 90% ширины
        this.fieldHeight = Math.floor(visibleHeight * 0.8); // 80% высоты
        this.offsetX = Math.floor((visibleWidth - this.fieldWidth) / 2);
        this.offsetY = Math.floor((visibleHeight - this.fieldHeight) / 2);

        // Рисуем границы поля
        for (let x = this.offsetX - 1; x < this.offsetX + this.fieldWidth + 1; x++) {
            for (let y = this.offsetY - 1; y < this.offsetY + this.fieldHeight + 1; y++) {
                const key = `${x},${y}`;
                if (x === this.offsetX - 1 || x === this.offsetX + this.fieldWidth ||
                    y === this.offsetY - 1 || y === this.offsetY + this.fieldHeight) {
                    this.gridManager.selectedTiles[key] = { type: 'wall', color: '#CCCCCC' };
                }
            }
        }
    }

    drawScoreAndLives() {
        const scoreKey = `${this.offsetX + this.fieldWidth + 2},${this.offsetY + 1}`;
        this.gridManager.selectedTiles[scoreKey] = {
            type: 'text',
            text: `Score: ${this.score}`,
            color: '#FFFFFF'
        };

        const livesKey = `${this.offsetX + this.fieldWidth + 2},${this.offsetY + 2}`;
        this.gridManager.selectedTiles[livesKey] = {
            type: 'text',
            text: `Lives: ${this.lives}`,
            color: '#FFFFFF'
        };
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

    handleLeftClick(x, y) {
        // Не используется в Арканоиде
    }

    handleRightClick(x, y) {
        // Не используется в Арканоиде
    }
}