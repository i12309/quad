// Файл: ./game/Snake.js
import { BaseModule } from './BaseModule.js';

export class Snake extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '🐍';
        this.gameDescription = 'Классическая змейка. Собирайте еду и увеличивайтесь в размерах!';
        this.name = 'Snake';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.interval = null;
        this.speed = 200; // Скорость игры (меньше = быстрее)
        this.score = 0;
        this.fieldWidth = 0;
        this.fieldHeight = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.snake = []; // Массив сегментов змейки
        this.direction = 'right'; // Направление движения
        this.food = { x: 0, y: 0 }; // Позиция еды
    }

    setup() {
        this.clear();
        this.initSnake(); // Инициализация змейки
        this.generateFood(); // Генерация еды
        this.drawBorder();
        this.bindKeyboardEvents();
        this.drawScore();
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
        this.snake = [];
        this.direction = 'right';
        this.gridManager.selectedTiles = {};
        this.drawBorder();
        this.initSnake();
        this.generateFood();
        this.gridManager.updateVisibleTiles();
    }

    initSnake() {
        // Начальная змейка из 3 сегментов
        const startX = Math.floor(this.fieldWidth / 2);
        const startY = Math.floor(this.fieldHeight / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
    }

    generateFood() {
        let foodX, foodY;
        do {
            foodX = Math.floor(Math.random() * this.fieldWidth);
            foodY = Math.floor(Math.random() * this.fieldHeight);
        } while (this.snake.some(segment => segment.x === foodX && segment.y === foodY));
        this.food = { x: foodX, y: foodY };
    }

    update() {
        // Удаляем старые сегменты змейки
        this.snake.forEach(segment => {
            const key = `${this.offsetX + segment.x},${this.offsetY + segment.y}`;
            delete this.gridManager.selectedTiles[key];
        });

        // Вычисляем новую голову
        const head = { ...this.snake[0] };
        switch (this.direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }

        // Проверка столкновений
        if (head.x < 0 || head.x >= this.fieldWidth || head.y < 0 || head.y >= this.fieldHeight ||
            this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.pause();
            alert(`Игра окончена! Ваш счёт: ${this.score}`);
            this.clear();
            return;
        }

        // Добавляем новую голову
        this.snake.unshift(head);

        // Проверка съедания еды
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.generateFood();
        } else {
            // Удаляем хвост, если еда не съедена
            this.snake.pop();
        }

        // Отрисовка змейки
        this.snake.forEach((segment, index) => {
            const key = `${this.offsetX + segment.x},${this.offsetY + segment.y}`;
            this.gridManager.selectedTiles[key] = {
                type: 'snake',
                color: index === 0 ? '#00FF00' : '#00CC00' // Голова ярче
            };
        });

        // Отрисовка еды
        const foodKey = `${this.offsetX + this.food.x},${this.offsetY + this.food.y}`;
        this.gridManager.selectedTiles[foodKey] = { type: 'food', color: '#FF0000' };

        this.drawScore();
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

    drawScore() {
        const scoreKey = `${this.offsetX + this.fieldWidth + 2},${this.offsetY + 1}`;
        this.gridManager.selectedTiles[scoreKey] = {
            type: 'text',
            text: `Score: ${this.score}`,
            color: '#FFFFFF'
        };
    }

    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;

            switch (e.key) {
                case 'ArrowUp':
                    if (this.direction !== 'down') this.direction = 'up';
                    break;
                case 'ArrowDown':
                    if (this.direction !== 'up') this.direction = 'down';
                    break;
                case 'ArrowLeft':
                    if (this.direction !== 'right') this.direction = 'left';
                    break;
                case 'ArrowRight':
                    if (this.direction !== 'left') this.direction = 'right';
                    break;
            }
        });
    }

    handleLeftClick(x, y) {
        // Не используется в Змейке
    }

    handleRightClick(x, y) {
        // Не используется в Змейке
    }
}