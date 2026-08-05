// Файл: ./game/Tetris.js
import { BaseModule } from './BaseModule.js';

const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    L: [[1, 0], [1, 0], [1, 1]],
    J: [[0, 1], [0, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]]
};

const COLORS = {
    I: '#00D9FF',
    O: '#FFD93D',
    T: '#C77DFF',
    L: '#FF9F1C',
    J: '#4D7CFE',
    S: '#39D353',
    Z: '#FF5D73'
};

export class Tetris extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '🧊';
        this.gameDescription = 'Классический Тетрис. Собирайте линии и набирайте очки!';
        this.name = 'Tetris';
        this.usesStartStop = true;
        this.gridManager = gridManager;

        this.fieldWidth = 15;
        this.fieldHeight = 30;
        this.dropInterval = 700;
        this.isRunning = false;
        this.interval = null;
        this.score = 0;
        this.lines = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.nextPiece = null;
        this.currentPiece = null;
        this.board = [];
        this.gameOver = false;
        this.gridScale = {
            min: 8,
            max: 18,
            step: 1,
            defaultTileSize: 12,
            defaultGap: 4,
            value: 12,
            fitColumns: 29,
            fitRows: 32,
        };
    }

    setup() {
        this.pause();
        this.clearBindings();
        this.applyGridScale();
        this.resetState();
        this.bindKeyboardEvents();
        this.render();
        this.setStatus('Стрелки — движение, пробел — быстрый сброс.');
    }

    resetState() {
        this.score = 0;
        this.lines = 0;
        this.gameOver = false;
        this.board = Array.from(
            { length: this.fieldHeight },
            () => Array(this.fieldWidth).fill(null)
        );
        this.currentPiece = null;
        this.nextPiece = this.createRandomPiece();
        this.spawnNextPiece();
        this.calculateOffset();
    }

    calculateOffset() {
        const visibleWidth = Math.floor(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.floor(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.offsetX = Math.max(1, Math.floor((visibleWidth - this.fieldWidth) / 2));
        this.offsetY = Math.max(1, Math.floor((visibleHeight - this.fieldHeight) / 2));
    }

    createRandomPiece() {
        const types = Object.keys(SHAPES);
        const type = types[Math.floor(Math.random() * types.length)];
        return {
            type,
            shape: SHAPES[type].map(row => [...row]),
            x: 0,
            y: 0
        };
    }

    spawnNextPiece() {
        this.currentPiece = this.nextPiece || this.createRandomPiece();
        this.currentPiece.x = Math.floor((this.fieldWidth - this.currentPiece.shape[0].length) / 2);
        this.currentPiece.y = 0;
        this.nextPiece = this.createRandomPiece();
    }

    start() {
        if (this.isRunning) return;
        if (this.gameOver) {
            this.resetState();
            this.render();
        }
        this.setRunning(true);
        this.interval = setInterval(() => this.update(), this.dropInterval);
        this.setStatus('Игра идёт.');
    }

    pause() {
        if (this.interval !== null) clearInterval(this.interval);
        this.interval = null;
        this.setRunning(false);
    }

    clear() {
        this.pause();
        this.resetState();
        this.render();
        this.setStatus('Новая игра готова.');
    }

    update() {
        if (!this.isRunning || this.gameOver) return;
        this.movePiece(0, 1);
    }

    movePiece(dx, dy) {
        if (this.canMove(this.currentPiece, dx, dy)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            this.render();
            return true;
        }
        if (dy > 0) this.lockPiece();
        return false;
    }

    rotatePiece() {
        const rotated = this.currentPiece.shape[0].map((_, column) =>
            this.currentPiece.shape.map(row => row[column]).reverse()
        );

        // Небольшой wall-kick позволяет поворачивать фигуры у стен.
        for (const kick of [0, -1, 1, -2, 2]) {
            const candidate = { ...this.currentPiece, shape: rotated };
            if (this.canMove(candidate, kick, 0)) {
                this.currentPiece.shape = rotated;
                this.currentPiece.x += kick;
                this.render();
                return;
            }
        }
    }

    hardDrop() {
        while (this.canMove(this.currentPiece, 0, 1)) this.currentPiece.y += 1;
        this.lockPiece();
    }

    canMove(piece, dx, dy) {
        return piece.shape.every((row, y) => row.every((cell, x) => {
            if (!cell) return true;
            const newX = piece.x + x + dx;
            const newY = piece.y + y + dy;
            return newX >= 0 &&
                newX < this.fieldWidth &&
                newY >= 0 &&
                newY < this.fieldHeight &&
                !this.board[newY][newX];
        }));
    }

    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (!this.currentPiece.shape[y][x]) continue;
                const boardX = this.currentPiece.x + x;
                const boardY = this.currentPiece.y + y;
                this.board[boardY][boardX] = COLORS[this.currentPiece.type];
            }
        }

        this.clearLines();
        this.spawnNextPiece();

        if (!this.canMove(this.currentPiece, 0, 0)) {
            this.gameOver = true;
            this.pause();
            this.render();
            this.finish(`Игра окончена. Счёт: ${this.score}, линий: ${this.lines}.`);
            return;
        }

        this.render();
    }

    clearLines() {
        let cleared = 0;
        for (let y = this.fieldHeight - 1; y >= 0; y--) {
            if (!this.board[y].every(Boolean)) continue;
            this.board.splice(y, 1);
            this.board.unshift(Array(this.fieldWidth).fill(null));
            cleared += 1;
            y += 1;
        }

        if (cleared > 0) {
            const lineScores = [0, 100, 300, 500, 800];
            this.score += lineScores[cleared] || cleared * 250;
            this.lines += cleared;
        }
    }

    render() {
        this.calculateOffset();
        const tiles = {};

        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                tiles[`${this.offsetX + x},${this.offsetY + y}`] = {
                    type: 'cell',
                    color: this.board[y][x] || '#151A22'
                };
            }
        }

        if (this.currentPiece) {
            this.currentPiece.shape.forEach((row, y) => row.forEach((cell, x) => {
                if (!cell) return;
                const boardX = this.currentPiece.x + x;
                const boardY = this.currentPiece.y + y;
                if (boardY < 0) return;
                tiles[`${this.offsetX + boardX},${this.offsetY + boardY}`] = {
                    type: 'piece',
                    color: COLORS[this.currentPiece.type]
                };
            }));
        }

        const hudX = this.offsetX + this.fieldWidth + 2;
        tiles[`${hudX},${this.offsetY}`] = {
            type: 'text',
            text: 'СЛЕДУЮЩАЯ',
            color: '#AEB7C6'
        };
        this.nextPiece.shape.forEach((row, y) => row.forEach((cell, x) => {
            if (cell) {
                tiles[`${hudX + x},${this.offsetY + 2 + y}`] = {
                    type: 'next',
                    color: COLORS[this.nextPiece.type]
                };
            }
        }));
        tiles[`${hudX},${this.offsetY + 7}`] = {
            type: 'text',
            text: `Счёт: ${this.score}`,
            color: '#FFFFFF'
        };
        tiles[`${hudX},${this.offsetY + 9}`] = {
            type: 'text',
            text: `Линии: ${this.lines}`,
            color: '#FFFFFF'
        };

        this.gridManager.selectedTiles = tiles;
        this.gridManager.updateVisibleTiles();
    }

    bindKeyboardEvents() {
        this.bindDom(document, 'keydown', (event) => {
            if (!this.isRunning || this.gameOver) return;
            if (!['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(event.code)) return;
            event.preventDefault();
            if (event.code === 'ArrowLeft') this.movePiece(-1, 0);
            if (event.code === 'ArrowRight') this.movePiece(1, 0);
            if (event.code === 'ArrowDown') this.movePiece(0, 1);
            if (event.code === 'ArrowUp') this.rotatePiece();
            if (event.code === 'Space') this.hardDrop();
        });
    }

    onResize() {
        this.render();
    }

    destroy() {
        this.pause();
        super.destroy();
    }

    toggleCell() {}
    handleLeftClick() {}
    handleRightClick() {}
    bindMouseEvents() {}
    showContextMenu() {}
}
