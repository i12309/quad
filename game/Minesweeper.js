// Файл: ./game/Minesweeper.js
import { BaseModule } from './BaseModule.js';

export class Minesweeper extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '💣';
        this.gameDescription = 'Классический Сапёр. Найдите все мины, не подорвавшись!';
        this.name = 'Minesweeper';
        this.usesStartStop = false;
        this.gridManager = gridManager;
        this.isRunning = false;
        this.fieldWidth = 10;
        this.fieldHeight = 10;
        this.minesCount = 10;
        this.board = [];
        this.offsetX = 0;
        this.offsetY = 0;
        this.minesPlaced = false;
        this.flagsCount = 0;
        this.revealedSafeCount = 0;
        this.gameOver = false;
        this.explodedCell = null;
        this.resultMessage = '';
        this.gridScale = {
            min: 18,
            max: 48,
            step: 2,
            defaultTileSize: 30,
            defaultGap: 4,
            value: 30,
            fitColumns: 12,
            fitRows: 14,
        };
    }

    setup() {
        this.applyGridScale();
        this.bindMouseEvents();
        this.reset();
    }

    reset() {
        this.initBoard();
        this.minesPlaced = false;
        this.flagsCount = 0;
        this.revealedSafeCount = 0;
        this.gameOver = false;
        this.explodedCell = null;
        this.resultMessage = '';
        this.isRunning = true;
        this.calculateOffsets();
        this.render();
        this.setStatus('Откройте первую клетку', 'info');
    }

    start() {
        if (this.gameOver) this.reset();
        this.isRunning = true;
    }

    pause() {
        this.isRunning = false;
    }

    clear() {
        this.reset();
    }

    update() {
        this.render();
    }

    calculateOffsets() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.offsetX = Math.floor((visibleWidth - this.fieldWidth) / 2);
        this.offsetY = Math.floor((visibleHeight - this.fieldHeight) / 2);
    }

    placeMines(safeX, safeY) {
        const isProtected = (x, y, protectNeighbors) => {
            if (protectNeighbors) {
                return Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1;
            }
            return x === safeX && y === safeY;
        };

        let candidates = [];
        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                if (!isProtected(x, y, true)) candidates.push({ x, y });
            }
        }

        if (candidates.length < this.minesCount) {
            candidates = [];
            for (let y = 0; y < this.fieldHeight; y++) {
                for (let x = 0; x < this.fieldWidth; x++) {
                    if (!isProtected(x, y, false)) candidates.push({ x, y });
                }
            }
        }

        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        for (const { x, y } of candidates.slice(0, this.minesCount)) {
            this.board[y][x].mine = true;
        }
        this.calculateNumbers();
        this.minesPlaced = true;
    }

    calculateNumbers() {
        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                if (this.board[y][x].mine) continue;
                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (this.isInside(nx, ny) && this.board[ny][nx].mine) count++;
                    }
                }
                this.board[y][x].value = count;
            }
        }
    }

    toggleCell(x, y) {
        if (!this.isRunning || this.gameOver || !this.isInside(x, y)) return;
        const cell = this.board[y][x];
        if (cell.state !== 'hidden') return;

        if (!this.minesPlaced) this.placeMines(x, y);

        if (cell.mine) {
            this.explodedCell = { x, y };
            this.finishGame(false);
            return;
        }

        this.revealArea(x, y);
        if (this.revealedSafeCount === this.fieldWidth * this.fieldHeight - this.minesCount) {
            this.finishGame(true);
            return;
        }

        this.render();
        this.setStatus(`Осталось безопасных клеток: ${this.fieldWidth * this.fieldHeight - this.minesCount - this.revealedSafeCount}`, 'info');
    }

    revealArea(startX, startY) {
        const queue = [{ x: startX, y: startY }];
        const queued = new Set([`${startX},${startY}`]);

        while (queue.length > 0) {
            const { x, y } = queue.shift();
            const cell = this.board[y][x];
            if (cell.state !== 'hidden' || cell.mine) continue;

            cell.state = 'revealed';
            this.revealedSafeCount++;

            if (cell.value !== 0) continue;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    const key = `${nx},${ny}`;
                    if (!this.isInside(nx, ny) || queued.has(key)) continue;
                    const neighbor = this.board[ny][nx];
                    if (neighbor.state === 'hidden' && !neighbor.mine) {
                        queued.add(key);
                        queue.push({ x: nx, y: ny });
                    }
                }
            }
        }
    }

    handleLeftClick(x, y) {
        this.toggleCell(x, y);
    }

    handleRightClick(x, y) {
        if (!this.isRunning || this.gameOver || !this.isInside(x, y)) return;
        const cell = this.board[y][x];
        if (cell.state === 'revealed') return;

        if (cell.state === 'flagged') {
            cell.state = 'hidden';
            this.flagsCount--;
        } else {
            cell.state = 'flagged';
            this.flagsCount++;
        }
        this.render();
        this.setStatus(`Флаги: ${this.flagsCount} из ${this.minesCount}`, 'info');
    }

    finishGame(won) {
        this.gameOver = true;
        this.isRunning = false;

        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                const cell = this.board[y][x];
                if (cell.mine) {
                    cell.state = won ? 'flagged' : 'revealed';
                }
            }
        }

        this.flagsCount = won ? this.minesCount : this.flagsCount;
        this.resultMessage = won ? 'Победа! Все мины найдены.' : 'Вы подорвались.';
        this.render();
        this.finish(this.resultMessage, won ? 'success' : 'error');
    }

    render() {
        this.gridManager.selectedTiles = {};
        const numberColors = {
            1: '#1F6FEB',
            2: '#2DA44E',
            3: '#CF222E',
            4: '#8250DF',
            5: '#A40E26',
            6: '#0A7F85',
            7: '#24292F',
            8: '#57606A'
        };

        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                const cell = this.board[y][x];
                const key = `${this.offsetX + x},${this.offsetY + y}`;
                const isExploded = this.explodedCell?.x === x && this.explodedCell?.y === y;

                if (this.gameOver && cell.state === 'flagged' && !cell.mine) {
                    this.gridManager.selectedTiles[key] = {
                        type: 'wrong-flag',
                        text: '❌',
                        textColor: '#FFFFFF',
                        color: '#CF222E'
                    };
                } else if (cell.state === 'flagged') {
                    this.gridManager.selectedTiles[key] = {
                        type: 'flagged',
                        text: '🚩',
                        textColor: '#FFFFFF',
                        color: '#F59E0B'
                    };
                } else if (cell.state === 'revealed' && cell.mine) {
                    this.gridManager.selectedTiles[key] = {
                        type: 'mine',
                        text: '💣',
                        textColor: '#FFFFFF',
                        color: isExploded ? '#FF0000' : '#8B1E2D'
                    };
                } else if (cell.state === 'revealed') {
                    this.gridManager.selectedTiles[key] = {
                        type: 'revealed',
                        text: cell.value === 0 ? '' : String(cell.value),
                        textColor: numberColors[cell.value] || '#24292F',
                        color: '#DDE7EE'
                    };
                } else {
                    this.gridManager.selectedTiles[key] = {
                        type: 'hidden',
                        text: '',
                        color: '#9AA6B2'
                    };
                }
            }
        }

        const hudY = Math.max(0, this.offsetY - 2);
        this.gridManager.selectedTiles[`${Math.max(0, this.offsetX)},${hudY}`] = {
            type: 'text',
            text: `Мины: ${this.minesCount}  Флаги: ${this.flagsCount}`,
            textColor: '#FFFFFF',
            color: '#FFFFFF'
        };
        this.gridManager.updateVisibleTiles();
    }

    bindMouseEvents() {
        this.clearBindings();
        this.bindStage('click', () => {
            const cell = this.getPointerCell();
            if (cell) this.handleLeftClick(cell.x, cell.y);
        });
        this.bindStage('contextmenu', (event) => {
            event.evt?.preventDefault();
            const cell = this.getPointerCell();
            if (cell) this.handleRightClick(cell.x, cell.y);
        });
    }

    getPointerCell() {
        const pos = this.gridManager.stage.getPointerPosition();
        if (!pos) return null;
        const x = Math.floor((pos.x - this.gridManager.stage.x()) / this.gridManager.totalSize) - this.offsetX;
        const y = Math.floor((pos.y - this.gridManager.stage.y()) / this.gridManager.totalSize) - this.offsetY;
        return this.isInside(x, y) ? { x, y } : null;
    }

    isInside(x, y) {
        return x >= 0 && x < this.fieldWidth && y >= 0 && y < this.fieldHeight;
    }

    drawBorder() {
        this.render();
    }

    initBoard() {
        this.board = Array.from({ length: this.fieldHeight }, () =>
            Array.from({ length: this.fieldWidth }, () => ({
                mine: false,
                value: 0,
                state: 'hidden'
            }))
        );
    }

    revealNeighbors(x, y) {
        this.revealArea(x, y);
        this.render();
    }

    onResize() {
        this.calculateOffsets();
        this.render();
    }

    showContextMenu() {}
}
