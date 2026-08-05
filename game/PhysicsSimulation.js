import { BaseModule } from './BaseModule.js';

export class PhysicsSimulation extends BaseModule {
    constructor(gridManager) {
        super();
        this.name = 'Песочная физика';
        this.gameIcon = '⌛';
        this.gameDescription = 'Рисуйте песок и стены, а затем наблюдайте за падением.';
        this.gridManager = gridManager;
        this.usesStartStop = true;
        this.interval = null;
        this.tickSpeed = 55;
        this.width = 0;
        this.height = 0;
        this.cells = new Map();
        this.brush = 'sand';
        this.painting = false;

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.tick = this.update.bind(this);
    }

    setup() {
        this.gridManager.setGridMetrics?.(12, 2);
        this.clearBindings();
        this.bindStage('mousedown touchstart', this.onPointerDown);
        this.bindStage('mousemove touchmove', this.onPointerMove);
        this.bindStage('mouseup touchend mouseleave', this.onPointerUp);
        this.bindStage('contextmenu', this.onContextMenu);
        this.bindDom(document, 'keydown', this.onKeyDown);
        this.resetField();
    }

    resetField() {
        this.pause();
        const columns = Math.floor(this.gridManager.stage.width() / this.gridManager.totalSize);
        const rows = Math.floor(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.width = Math.max(12, Math.min(48, columns));
        this.height = Math.max(10, Math.min(30, rows - 2));
        this.gridManager.stage.x(Math.max(0, Math.floor(
            (this.gridManager.stage.width() - this.width * this.gridManager.totalSize) / 2
        )));
        this.cells = new Map();
        this.brush = 'sand';
        this.painting = false;

        for (let x = 0; x < this.width; x++) {
            this.cells.set(`${x},${this.height + 1}`, 'wall');
        }
        for (let y = 2; y <= this.height + 1; y++) {
            this.cells.set(`0,${y}`, 'wall');
            this.cells.set(`${this.width - 1},${y}`, 'wall');
        }
        this.render();
        this.setStatus('1 — песок, 2 — стена, 3 — ластик. Рисуйте мышью и нажмите «Старт».', 'info');
    }

    start() {
        if (this.isRunning) return;
        this.setRunning(true);
        this.interval = setInterval(this.tick, this.tickSpeed);
        this.setStatus('Симуляция запущена. Рисовать можно прямо во время движения.', 'info');
    }

    pause() {
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.setRunning(false);
    }

    clear() {
        this.resetField();
    }

    onPointerDown(event) {
        event?.evt?.preventDefault?.();
        this.painting = true;
        if (event?.evt?.button === 2) this.brush = 'wall';
        this.paintAtPointer();
    }

    onPointerMove() {
        if (this.painting) this.paintAtPointer();
    }

    onPointerUp() {
        this.painting = false;
    }

    onContextMenu(event) {
        event?.evt?.preventDefault?.();
    }

    onKeyDown(event) {
        const brushes = { Digit1: 'sand', Digit2: 'wall', Digit3: 'eraser' };
        if (!brushes[event.code]) return;
        this.brush = brushes[event.code];
        this.render();
        this.setStatus(`Инструмент: ${this.brushName()}.`, 'info');
    }

    brushName() {
        return { sand: 'песок', wall: 'стена', eraser: 'ластик' }[this.brush];
    }

    paintAtPointer() {
        const cell = this.gridManager.getGridPosition?.();
        if (!cell || cell.x <= 0 || cell.x >= this.width - 1 || cell.y < 2 || cell.y > this.height) return;
        const key = `${cell.x},${cell.y}`;
        if (this.brush === 'eraser') this.cells.delete(key);
        else this.cells.set(key, this.brush);
        this.render();
    }

    update() {
        if (!this.isRunning) return;
        let moved = false;

        // Снизу вверх: одна песчинка делает не более одного шага за тик.
        for (let y = this.height; y >= 2; y--) {
            const direction = Math.random() < 0.5 ? -1 : 1;
            const start = direction === 1 ? 1 : this.width - 2;
            const end = direction === 1 ? this.width - 1 : 0;
            for (let x = start; x !== end; x += direction) {
                const key = `${x},${y}`;
                if (this.cells.get(key) !== 'sand') continue;

                const candidates = [
                    [x, y + 1],
                    [x + direction, y + 1],
                    [x - direction, y + 1],
                ];
                const target = candidates.find(([nx, ny]) =>
                    nx > 0 && nx < this.width - 1 && ny <= this.height && !this.cells.has(`${nx},${ny}`)
                );
                if (!target) continue;

                this.cells.delete(key);
                this.cells.set(`${target[0]},${target[1]}`, 'sand');
                moved = true;
            }
        }
        if (moved) this.render();
    }

    render() {
        const tiles = {};
        for (const [key, type] of this.cells) {
            tiles[key] = {
                type,
                color: type === 'sand' ? '#f3c969' : '#64707d',
            };
        }
        tiles['0,0'] = {
            type: 'text',
            text: `Инструмент: ${this.brushName()}  •  1 песок  2 стена  3 ластик`,
            color: this.brush === 'sand' ? '#f3c969' : '#d9e2ec',
            widthCells: 28,
        };
        this.gridManager.selectedTiles = tiles;
        this.gridManager.updateVisibleTiles();
    }

    onResize() {
        this.resetField();
    }
}
