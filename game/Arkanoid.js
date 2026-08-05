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
        this.speed = 50;
        this.score = 0;
        this.lives = 3;
        this.fieldWidth = 0;
        this.fieldHeight = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.blocks = [];
        this.roundFinished = false;
        this.statusMessage = '';
    }

    setup() {
        this.gridManager.setGridMetrics?.(12, this.gridManager.gap);
        if (!this.gridManager.setGridMetrics) {
            this.gridManager.tileSize = 12;
            this.gridManager.totalSize = this.gridManager.tileSize + this.gridManager.gap;
        }
        this.bindMouseEvents();
        this.reset();
    }

    reset() {
        this.pause();
        this.score = 0;
        this.lives = 3;
        this.roundFinished = false;
        this.statusMessage = 'Нажмите «Старт»';
        this.calculateFieldGeometry();
        this.initBlocks();
        this.resetBall();
        this.render();
        this.setStatus(this.statusMessage, 'info');
    }

    start() {
        if (this.roundFinished) {
            this.reset();
        }
        if (this.isRunning) return;

        this.isRunning = true;
        this.statusMessage = '';
        this.setStatus('Игра идёт', 'info');
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
        this.reset();
    }

    calculateFieldGeometry() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.fieldWidth = Math.max(10, Math.floor(visibleWidth * 0.9));
        this.fieldHeight = Math.max(14, Math.floor(visibleHeight * 0.8));
        this.offsetX = Math.floor((visibleWidth - this.fieldWidth) / 2);
        this.offsetY = Math.floor((visibleHeight - this.fieldHeight) / 2);
        this.platform = {
            x: Math.floor(this.fieldWidth / 2) - 3,
            width: Math.min(6, this.fieldWidth)
        };
    }

    resetBall() {
        this.ball = {
            x: Math.floor(this.fieldWidth / 2),
            y: Math.max(1, this.fieldHeight - 5),
            dx: Math.random() < 0.5 ? -1 : 1,
            dy: -1
        };
    }

    initBlocks() {
        this.blocks = [];
        const rows = Math.min(4, Math.max(1, Math.floor((this.fieldHeight - 8) / 2)));
        const cols = Math.min(8, this.fieldWidth);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const startX = Math.floor(col * this.fieldWidth / cols);
                const endX = Math.floor((col + 1) * this.fieldWidth / cols);
                this.blocks.push({
                    x: startX,
                    y: row * 2 + 2,
                    width: Math.max(1, endX - startX),
                    height: 1,
                    color: this.getRandomColor()
                });
            }
        }
    }

    getRandomColor() {
        const colors = ['#FF5A5F', '#39D353', '#4D96FF', '#FFD93D', '#C77DFF', '#2EC4B6'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        if (!this.isRunning || this.roundFinished) return;

        let nextX = this.ball.x + this.ball.dx;
        let nextY = this.ball.y + this.ball.dy;

        if (nextX < 0 || nextX >= this.fieldWidth) {
            this.ball.dx *= -1;
            nextX = this.ball.x + this.ball.dx;
        }
        if (nextY < 0) {
            this.ball.dy = Math.abs(this.ball.dy);
            nextY = this.ball.y + this.ball.dy;
        }

        const hitBlockIndex = this.blocks.findIndex((block) =>
            nextX >= block.x && nextX < block.x + block.width &&
            nextY >= block.y && nextY < block.y + block.height
        );

        if (hitBlockIndex !== -1) {
            this.blocks.splice(hitBlockIndex, 1);
            this.score += 10;
            this.ball.dy *= -1;
            // Остаёмся в предыдущей строке: иначе мяч за один такт
            // «перепрыгнет» на две клетки и может затереть соседний блок.
            nextY = this.ball.y;
        }

        const platformY = this.fieldHeight - 2;
        if (this.ball.dy > 0 && nextY >= platformY) {
            const hitsPlatform = nextX >= this.platform.x &&
                nextX < this.platform.x + this.platform.width;

            if (hitsPlatform) {
                const relativeHit = (nextX - this.platform.x) / Math.max(1, this.platform.width - 1);
                this.ball.dx = relativeHit < 0.5 ? -1 : 1;
                this.ball.dy = -1;
                nextY = platformY - 1;
            } else {
                this.loseLife();
                return;
            }
        }

        this.ball.x = nextX;
        this.ball.y = nextY;

        if (this.blocks.length === 0) {
            this.roundFinished = true;
            this.pause();
            this.statusMessage = `Победа! Счёт: ${this.score}`;
            this.render();
            this.finish(this.statusMessage, 'success');
            return;
        }

        this.render();
    }

    loseLife() {
        this.lives--;
        if (this.lives <= 0) {
            this.roundFinished = true;
            this.pause();
            this.statusMessage = `Игра окончена. Счёт: ${this.score}`;
            this.render();
            this.finish(this.statusMessage, 'error');
            return;
        }

        this.resetBall();
        this.statusMessage = `Осталось жизней: ${this.lives}`;
        this.setStatus(this.statusMessage, 'warning');
        this.render();
    }

    render() {
        this.gridManager.selectedTiles = {};
        this.drawBorder();

        for (const block of this.blocks) {
            for (let x = 0; x < block.width; x++) {
                const key = `${this.offsetX + block.x + x},${this.offsetY + block.y}`;
                this.gridManager.selectedTiles[key] = { type: 'block', color: block.color };
            }
        }

        const platformY = this.offsetY + this.fieldHeight - 2;
        for (let x = 0; x < this.platform.width; x++) {
            const key = `${this.offsetX + this.platform.x + x},${platformY}`;
            this.gridManager.selectedTiles[key] = { type: 'platform', color: '#4D96FF' };
        }

        const ballKey = `${this.offsetX + this.ball.x},${this.offsetY + this.ball.y}`;
        this.gridManager.selectedTiles[ballKey] = { type: 'ball', color: '#FFD93D' };

        this.drawHud();
        this.gridManager.updateVisibleTiles();
    }

    drawBorder() {
        for (let x = this.offsetX - 1; x <= this.offsetX + this.fieldWidth; x++) {
            for (let y = this.offsetY - 1; y <= this.offsetY + this.fieldHeight; y++) {
                if (x === this.offsetX - 1 || x === this.offsetX + this.fieldWidth ||
                    y === this.offsetY - 1 || y === this.offsetY + this.fieldHeight) {
                    this.gridManager.selectedTiles[`${x},${y}`] = { type: 'wall', color: '#CCCCCC' };
                }
            }
        }
    }

    drawHud() {
        const hudY = Math.max(0, this.offsetY - 3);
        this.gridManager.selectedTiles[`${Math.max(0, this.offsetX)},${hudY}`] = {
            type: 'text',
            text: `Счёт: ${this.score}`,
            textColor: '#FFFFFF',
            color: '#FFFFFF'
        };
        this.gridManager.selectedTiles[`${Math.max(0, this.offsetX + 12)},${hudY}`] = {
            type: 'text',
            text: `Жизни: ${this.lives}`,
            textColor: '#FFFFFF',
            color: '#FFFFFF'
        };
    }

    bindMouseEvents() {
        this.clearBindings();
        this.bindStage('mousemove', () => {
            const pos = this.gridManager.stage.getPointerPosition();
            if (!pos) return;

            const pointerX = Math.floor(
                (pos.x - this.gridManager.stage.x()) / this.gridManager.totalSize
            ) - this.offsetX;
            const nextX = pointerX - Math.floor(this.platform.width / 2);
            this.platform.x = Math.max(0, Math.min(nextX, this.fieldWidth - this.platform.width));
            if (!this.isRunning) this.render();
        });
    }

    updateVisibleTiles() {
        this.render();
    }

    onResize() {
        this.reset();
        this.controls?.syncControls();
    }

    toggleCell() {}
    handleLeftClick() {}
    handleRightClick() {}
    showContextMenu() {}
}
