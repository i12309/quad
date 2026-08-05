// Файл: ./game/pole.js
import { BaseModule } from './BaseModule.js';

export class pole extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '🌌';
        this.gameDescription = 'Спокойная анимация из больших зелёных пикселей.';
        this.name = 'Живое поле';
        this.usesStartStop = true;
        this.gridManager = gridManager;

        this.isRunning = false;
        this.interval = null;
        this.speed = 180;
        this.fieldWidth = 0;
        this.fieldHeight = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.cells = [];
        this.colors = [
            '#39D353',
            '#26A641',
            '#006D32',
            '#0E4429',
            '#2D333B'
        ];
    }

    setup() {
        this.pause();
        this.clearBindings();
        this.resetField();
        this.render();
        this.setStatus('Нажмите «Старт», чтобы оживить поле.');
    }

    calculateBounds() {
        const visibleWidth = Math.max(1, Math.floor(this.gridManager.stage.width() / this.gridManager.totalSize));
        const visibleHeight = Math.max(1, Math.floor(this.gridManager.stage.height() / this.gridManager.totalSize));
        this.fieldWidth = Math.max(1, Math.floor(visibleWidth * 0.82));
        this.fieldHeight = Math.max(1, Math.floor(visibleHeight * 0.30));
        this.offsetX = Math.max(0, Math.floor((visibleWidth - this.fieldWidth) / 2));
        this.offsetY = Math.max(0, Math.floor((visibleHeight - this.fieldHeight) / 2));
    }

    resetField() {
        this.calculateBounds();
        this.cells = Array.from(
            { length: this.fieldHeight },
            () => Array.from({ length: this.fieldWidth }, () => this.randomColorIndex())
        );
    }

    randomColorIndex() {
        // Тёмные клетки встречаются чаще, яркие служат акцентами.
        const value = Math.random();
        if (value < 0.08) return 0;
        if (value < 0.20) return 1;
        if (value < 0.38) return 2;
        if (value < 0.62) return 3;
        return 4;
    }

    start() {
        if (this.isRunning) return;
        this.setRunning(true);
        this.interval = setInterval(() => this.update(), this.speed);
        this.setStatus('Анимация идёт.');
    }

    pause() {
        if (this.interval !== null) clearInterval(this.interval);
        this.interval = null;
        this.setRunning(false);
    }

    clear() {
        this.pause();
        this.resetField();
        this.render();
        this.setStatus('Поле обновлено.');
    }

    update() {
        if (!this.isRunning) return;
        const changes = Math.max(1, Math.floor(this.fieldWidth * this.fieldHeight * 0.08));
        for (let i = 0; i < changes; i++) {
            const x = Math.floor(Math.random() * this.fieldWidth);
            const y = Math.floor(Math.random() * this.fieldHeight);
            this.cells[y][x] = this.randomColorIndex();
        }
        this.render();
    }

    render() {
        const tiles = {};
        const titleY = Math.max(0, this.offsetY - 2);
        tiles[`${this.offsetX},${titleY}`] = {
            type: 'text',
            text: 'ЖИВОЕ ПОЛЕ',
            color: '#8B949E'
        };

        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                tiles[`${this.offsetX + x},${this.offsetY + y}`] = {
                    type: 'cell',
                    color: this.colors[this.cells[y][x]]
                };
            }
        }

        this.gridManager.selectedTiles = tiles;
        this.gridManager.updateVisibleTiles();
    }

    onResize() {
        this.resetField();
        this.render();
    }

    destroy() {
        this.pause();
        super.destroy();
    }

    bindMouseEvents() {}
    toggleCell() {}
    handleLeftClick() {}
    handleRightClick() {}
    showContextMenu() {}
}
