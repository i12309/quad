// Файл: ./game/PingPong.js
import { BaseModule } from './BaseModule.js';

export class PingPong extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '🏓';
        this.gameDescription = 'Игра в пинг-понг. Управляйте платформой и ловите мяч.';
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
        this.gameOver = false;
    }

    setup() {
        this.clearBindings();
        this.bindMouseEvents();
        this.clear();
    }

    start() {
        if (this.isRunning) return;

        if (this.gameOver) {
            this.resetState();
            this.render();
        }

        this.isRunning = true;
        this.setStatus('Игра идёт. Двигайте платформу мышью.', 'running');
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
        this.setStatus('Нажмите «Старт» и управляйте платформой мышью.', 'ready');
    }

    resetState() {
        this.calculateLayout();
        this.score = 0;
        this.gameOver = false;
        const platformWidth = Math.min(6, this.fieldWidth);
        this.ball = {
            x: Math.floor(this.fieldWidth / 2),
            y: Math.floor(this.fieldHeight / 2),
            dx: 1,
            dy: -1
        };
        this.platform = {
            x: Math.floor((this.fieldWidth - platformWidth) / 2),
            width: platformWidth
        };
    }

    calculateLayout() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.fieldWidth = Math.max(8, Math.floor(visibleWidth / 3));
        this.fieldHeight = Math.max(10, Math.floor(visibleHeight * 0.8));
        this.offsetX = Math.floor((visibleWidth - this.fieldWidth) / 2);
        this.offsetY = Math.floor((visibleHeight - this.fieldHeight) / 2);
    }

    update() {
        if (!this.isRunning) return;

        const previousX = this.ball.x;
        const previousY = this.ball.y;
        let nextX = previousX + this.ball.dx;
        let nextY = previousY + this.ball.dy;
        const maxX = this.fieldWidth - 1;

        // Preserve overshoot so higher ball speeds cannot tunnel through walls.
        while (nextX < 0 || nextX > maxX) {
            if (nextX < 0) {
                nextX = -nextX;
                this.ball.dx = Math.abs(this.ball.dx);
            } else {
                nextX = 2 * maxX - nextX;
                this.ball.dx = -Math.abs(this.ball.dx);
            }
        }

        if (nextY < 0) {
            nextY = -nextY;
            this.ball.dy = Math.abs(this.ball.dy);
        }

        const paddleY = this.fieldHeight - 5;
        const crossesPaddle = this.ball.dy > 0 && previousY < paddleY && nextY >= paddleY;
        if (crossesPaddle) {
            const progress = (paddleY - previousY) / (nextY - previousY);
            const hitX = previousX + (nextX - previousX) * progress;
            const platformEnd = this.platform.x + this.platform.width;

            if (hitX >= this.platform.x && hitX < platformEnd) {
                nextY = 2 * paddleY - 1 - nextY;
                this.ball.dy = -Math.abs(this.ball.dy);
                this.applyPaddleAngle(hitX);
                this.score++;
            } else {
                this.endGame(`Игра окончена. Счёт: ${this.score}`);
                return;
            }
        } else if (nextY >= this.fieldHeight) {
            this.endGame(`Игра окончена. Счёт: ${this.score}`);
            return;
        }

        this.ball.x = Math.max(0, Math.min(maxX, Math.round(nextX)));
        this.ball.y = Math.round(nextY);
        this.render();
    }

    applyPaddleAngle(hitX) {
        const relativeHit = (hitX - this.platform.x) / this.platform.width;
        const horizontalSpeed = Math.max(1, Math.abs(this.ball.dx));
        if (relativeHit < 1 / 3) {
            this.ball.dx = -horizontalSpeed;
        } else if (relativeHit > 2 / 3) {
            this.ball.dx = horizontalSpeed;
        }
    }

    endGame(message) {
        this.pause();
        this.gameOver = true;
        this.finish(message, 'result');
    }

    render() {
        const tiles = {};
        this.drawBorder(tiles);

        const ballKey = `${this.offsetX + this.ball.x},${this.offsetY + this.ball.y}`;
        tiles[ballKey] = { type: 'ball', color: '#FFFF00' };

        const paddleY = this.offsetY + this.fieldHeight - 5;
        for (let i = 0; i < this.platform.width; i++) {
            tiles[`${this.offsetX + this.platform.x + i},${paddleY}`] = {
                type: 'platform',
                color: '#2F80ED'
            };
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

    bindMouseEvents() {
        this.bindStage('mousemove', () => {
            const pos = this.gridManager.stage.getPointerPosition();
            if (!pos) return;

            const pointerX = Math.floor(
                (pos.x - this.gridManager.stage.x()) / this.gridManager.totalSize
            ) - this.offsetX;
            this.platform.x = Math.max(
                0,
                Math.min(pointerX - Math.floor(this.platform.width / 2), this.fieldWidth - this.platform.width)
            );
            this.render();
        });
    }

    onResize() {
        const oldWidth = this.fieldWidth;
        const oldHeight = this.fieldHeight;
        const oldPaddleRange = Math.max(1, oldWidth - this.platform.width);
        const paddlePosition = this.platform.x / oldPaddleRange;
        const ballXPosition = this.ball.x / Math.max(1, oldWidth - 1);
        const ballYPosition = this.ball.y / Math.max(1, oldHeight - 1);

        this.calculateLayout();
        this.platform.width = Math.min(this.platform.width, this.fieldWidth);
        this.platform.x = Math.round(
            paddlePosition * Math.max(0, this.fieldWidth - this.platform.width)
        );
        this.ball.x = Math.round(ballXPosition * Math.max(0, this.fieldWidth - 1));
        this.ball.y = Math.min(
            this.fieldHeight - 6,
            Math.max(0, Math.round(ballYPosition * Math.max(0, this.fieldHeight - 1)))
        );
        this.render();
    }

    destroy() {
        super.destroy();
    }

    showContextMenu() {}
    toggleCell() {}
    handleLeftClick() {}
    handleRightClick() {}
}
