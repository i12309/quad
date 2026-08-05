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
        this.speed = 200;
        this.score = 0;
        this.fieldWidth = 0;
        this.fieldHeight = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.snake = [];
        this.direction = 'right';
        this.queuedDirection = 'right';
        this.food = null;
        this.gameOver = false;
    }

    setup() {
        this.clearBindings();
        this.bindKeyboardEvents();
        this.clear();
    }

    start() {
        if (this.isRunning) return;

        if (this.gameOver) {
            this.resetState();
            this.render();
        }

        this.isRunning = true;
        this.setStatus('Игра идёт. Управление — стрелками.', 'running');
        this.interval = setInterval(() => this.update(), this.speed);
    }

    pause() {
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
    }

    clear() {
        this.pause();
        this.resetState();
        this.render();
        this.setStatus('Нажмите «Старт». Управление — стрелками.', 'ready');
    }

    resetState() {
        this.calculateLayout();
        this.score = 0;
        this.direction = 'right';
        this.queuedDirection = 'right';
        this.gameOver = false;

        const startX = Math.floor(this.fieldWidth / 2);
        const startY = Math.floor(this.fieldHeight / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        this.generateFood();
    }

    calculateLayout() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.fieldWidth = Math.max(3, Math.floor(visibleWidth * 0.9));
        this.fieldHeight = Math.max(3, Math.floor(visibleHeight * 0.8));
        this.offsetX = Math.floor((visibleWidth - this.fieldWidth) / 2);
        this.offsetY = Math.floor((visibleHeight - this.fieldHeight) / 2);
    }

    generateFood() {
        const occupied = new Set(this.snake.map(({ x, y }) => `${x},${y}`));
        const freeCells = [];

        for (let x = 0; x < this.fieldWidth; x++) {
            for (let y = 0; y < this.fieldHeight; y++) {
                if (!occupied.has(`${x},${y}`)) freeCells.push({ x, y });
            }
        }

        if (freeCells.length === 0) {
            this.food = null;
            return false;
        }

        this.food = freeCells[Math.floor(Math.random() * freeCells.length)];
        return true;
    }

    update() {
        if (!this.isRunning) return;

        this.direction = this.queuedDirection;
        const head = { ...this.snake[0] };
        switch (this.direction) {
            case 'up': head.y -= 1; break;
            case 'down': head.y += 1; break;
            case 'left': head.x -= 1; break;
            case 'right': head.x += 1; break;
        }

        const willGrow = this.food !== null && head.x === this.food.x && head.y === this.food.y;
        const bodyToCheck = willGrow ? this.snake : this.snake.slice(0, -1);
        const hitWall = head.x < 0 || head.x >= this.fieldWidth || head.y < 0 || head.y >= this.fieldHeight;
        const hitSnake = bodyToCheck.some(({ x, y }) => x === head.x && y === head.y);

        if (hitWall || hitSnake) {
            this.endGame(`Игра окончена. Счёт: ${this.score}`);
            return;
        }

        this.snake.unshift(head);
        if (willGrow) {
            this.score += 10;
            if (!this.generateFood()) {
                this.render();
                this.endGame(`Победа! Поле заполнено. Счёт: ${this.score}`);
                return;
            }
        } else {
            this.snake.pop();
        }

        this.render();
    }

    endGame(message) {
        this.pause();
        this.gameOver = true;
        this.finish(message, 'result');
    }

    render() {
        const tiles = {};
        this.drawBorder(tiles);

        this.snake.forEach((segment, index) => {
            const key = `${this.offsetX + segment.x},${this.offsetY + segment.y}`;
            tiles[key] = {
                type: 'snake',
                color: index === 0 ? '#00FF00' : '#00CC00'
            };
        });

        if (this.food !== null) {
            const foodKey = `${this.offsetX + this.food.x},${this.offsetY + this.food.y}`;
            tiles[foodKey] = { type: 'food', color: '#FF0000' };
        }

        const scoreKey = `${this.offsetX},${Math.max(0, this.offsetY - 2)}`;
        tiles[scoreKey] = {
            type: 'text',
            text: `Счёт: ${this.score}`,
            color: '#FFFFFF',
            textColor: '#FFFFFF'
        };

        this.gridManager.selectedTiles = tiles;
        this.gridManager.updateVisibleTiles();
    }

    drawBorder(tiles) {
        for (let x = this.offsetX - 1; x <= this.offsetX + this.fieldWidth; x++) {
            for (let y = this.offsetY - 1; y <= this.offsetY + this.fieldHeight; y++) {
                if (x === this.offsetX - 1 || x === this.offsetX + this.fieldWidth ||
                    y === this.offsetY - 1 || y === this.offsetY + this.fieldHeight) {
                    tiles[`${x},${y}`] = { type: 'wall', color: '#CCCCCC' };
                }
            }
        }
    }

    bindKeyboardEvents() {
        this.bindDom(document, 'keydown', (event) => {
            const directions = {
                ArrowUp: 'up',
                ArrowDown: 'down',
                ArrowLeft: 'left',
                ArrowRight: 'right'
            };
            const nextDirection = directions[event.key];
            if (!nextDirection || !this.isRunning) return;

            event.preventDefault();
            const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
            // Compare with the direction of the current tick. This prevents two
            // quick key presses from producing an effective 180° turn.
            if (nextDirection !== opposites[this.direction]) {
                this.queuedDirection = nextDirection;
            }
        });
    }

    onResize() {
        this.calculateLayout();
        const stateFits = this.snake.every(({ x, y }) =>
            x >= 0 && x < this.fieldWidth && y >= 0 && y < this.fieldHeight
        ) && (this.food === null || (
            this.food.x >= 0 && this.food.x < this.fieldWidth &&
            this.food.y >= 0 && this.food.y < this.fieldHeight
        ));

        if (!stateFits) {
            this.pause();
            this.resetState();
            this.render();
            this.finish('Размер поля изменился. Игра начата заново.', 'info');
            return;
        }

        this.render();
    }

    destroy() {
        super.destroy();
    }

    handleLeftClick() {}
    handleRightClick() {}
}
