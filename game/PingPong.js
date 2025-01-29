// Файл: ./game/PingPong.js
import { BaseModule } from './BaseModule.js';

export class PingPong extends BaseModule {
    constructor(gridManager) {
        super();
        this.name = 'PingPong';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.ball = { x: 75, y: 50, dx: 1, dy: -1 }; // Начальная позиция и направление мяча
        this.platform = { x: 140, width: 6 }; // Платформа (положение и ширина)
        this.interval = null;
        this.speed = 100; // Скорость обновления (мс)
        this.score = 0; // Счёт
        this.fieldWidth = 150; // Ширина поля
        this.fieldHeight = 100; // Высота поля
        this.offsetX = Math.floor((this.gridManager.stage.width() / this.gridManager.totalSize - this.fieldWidth) / 2); // Смещение по X
        this.offsetY = Math.floor((this.gridManager.stage.height() / this.gridManager.totalSize - this.fieldHeight) / 2); // Смещение по Y
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.resetGame();
            this.drawFieldBorder(); // Рисуем границы поля
            this.bindMouseEvents();
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

    resetGame() {
        this.ball = { x: Math.floor(this.fieldWidth / 2), y: Math.floor(this.fieldHeight / 2), dx: 1, dy: -1 };
        this.platform = { x: this.fieldWidth - 10 - this.platform.width, width: 6 }; // Платформа справа
        this.score = 0;
        this.gridManager.selectedTiles = {};
        this.gridManager.updateVisibleTiles();
        this.drawFieldBorder(); // Рисуем границы поля заново
    }

    drawFieldBorder() {
        // Очищаем предыдущие границы
        for (let x = this.offsetX - 1; x < this.offsetX + this.fieldWidth + 1; x++) {
            for (let y = this.offsetY - 1; y < this.offsetY + this.fieldHeight + 1; y++) {
                const key = `${x},${y}`;
                if (this.gridManager.selectedTiles[key] && this.gridManager.selectedTiles[key].type === '#CCCCCC') {
                    delete this.gridManager.selectedTiles[key];
                }
            }
        }

        // Рисуем новые границы (на один квадратик дальше за пределами поля)
        for (let x = this.offsetX - 1; x < this.offsetX + this.fieldWidth + 1; x++) {
            this.gridManager.selectedTiles[`${x},${this.offsetY - 1}`] = { type: '#CCCCCC' }; // Верхняя граница
            this.gridManager.selectedTiles[`${x},${this.offsetY + this.fieldHeight}`] = { type: '#CCCCCC' }; // Нижняя граница
        }
        for (let y = this.offsetY - 1; y < this.offsetY + this.fieldHeight + 1; y++) {
            this.gridManager.selectedTiles[`${this.offsetX - 1},${y}`] = { type: '#CCCCCC' }; // Левая граница
            this.gridManager.selectedTiles[`${this.offsetX + this.fieldWidth},${y}`] = { type: '#CCCCCC' }; // Правая граница
        }
        this.gridManager.updateVisibleTiles();
    }

    bindMouseEvents() {
        this.gridManager.stage.on('mousemove', (event) => {
            const pos = this.gridManager.stage.getPointerPosition();
            if (!pos) return;

            const platformX = Math.floor((pos.x - this.gridManager.stage.x()) / this.gridManager.totalSize) - this.offsetX;
            this.platform.x = Math.max(0, Math.min(platformX - Math.floor(this.platform.width / 2), this.fieldWidth - this.platform.width));
        });
    }

    update() {
        // Очищаем старое положение мяча
        delete this.gridManager.selectedTiles[`${this.offsetX + this.ball.x},${this.offsetY + this.ball.y}`];

        // Обновляем положение мяча
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Проверяем столкновения со стенами
        if (this.ball.x <= 0 || this.ball.x >= this.fieldWidth - 1) {
            this.ball.dx *= -1; // Отскок по горизонтали
        }
        if (this.ball.y <= 0) {
            this.ball.dy *= -1; // Отскок по вертикали
        }

        // Проверяем столкновение с платформой
        if (this.ball.y === this.fieldHeight - 2) {
            if (this.ball.x >= this.platform.x && this.ball.x < this.platform.x + this.platform.width) {
                this.ball.dy *= -1; // Отскок от платформы
                this.score++;
                console.log(`Счёт: ${this.score}`);
            } else {
                // Мяч упал за платформу
                this.pause();
                console.log('Игра окончена!');
                alert(`Игра окончена! Ваш счёт: ${this.score}`);
                this.clear();
            }
        }

        // Рисуем мяч
        this.gridManager.selectedTiles[`${this.offsetX + this.ball.x},${this.offsetY + this.ball.y}`] = { type: '#FFFF00' }; // Жёлтый цвет

        // Очищаем старую позицию платформы
        for (let i = 0; i < this.platform.width; i++) {
            delete this.gridManager.selectedTiles[`${this.offsetX + this.platform.x + i},${this.offsetY + this.fieldHeight - 1}`];
        }

        // Рисуем платформу
        for (let i = 0; i < this.platform.width; i++) {
            this.gridManager.selectedTiles[`${this.offsetX + this.platform.x + i},${this.offsetY + this.fieldHeight - 1}`] = { type: '#0000FF' }; // Синий цвет
        }

        this.gridManager.updateVisibleTiles();
    }

    showContextMenu(x, y) {
        const contextMenu = document.createElement('div');
        contextMenu.style.position = 'absolute';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.backgroundColor = 'white';
        contextMenu.style.border = '1px solid black';
        contextMenu.style.padding = '10px';
        contextMenu.style.zIndex = '1000';

        const restartButton = document.createElement('button');
        restartButton.textContent = 'Начать заново';
        restartButton.addEventListener('click', () => {
            this.clear();
            this.start();
            contextMenu.remove();
        });

        contextMenu.appendChild(restartButton);
        document.body.appendChild(contextMenu);

        document.addEventListener('click', (event) => {
            if (!contextMenu.contains(event.target)) {
                contextMenu.remove();
            }
        }, { once: true });
    }
}