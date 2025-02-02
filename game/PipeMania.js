// Файл: ./game/PipeMania.js
import { BaseModule } from './BaseModule.js';

export class PipeMania extends BaseModule {
    constructor(gridManager) {
        super();
        this.name = 'PipeMania';
        this.gameIcon = '🔄';
        this.gameDescription = 'Соедините трубы от старта до финиша!';
        this.gridManager = gridManager;
        
        this.gridSize = 8;
        this.timer = 60;
        this.isRunning = false;
        this.interval = null;
        this.pipes = [];
        this.startPos = { x: 0, y: 0 };
        this.endPos = { x: this.gridSize - 1, y: this.gridSize - 1 }; // Исправление координат
        this.flowPath = [];
        
        this.pipeTypes = {
            '┼': [1,1,1,1],
            '─': [0,1,0,1],
            '│': [1,0,1,0],
            '┌': [0,1,1,0],
            '┐': [0,0,1,1],
            '└': [1,1,0,0],
            '┘': [1,0,0,1]
        };
    }

    // Реализация абстрактных методов BaseModule
    setup() {
        this.clear();
        this.generatePipes();
        this.startFlow();
        this.bindMouseEvents(this.gridManager);
        this.gridManager.updateVisibleTiles();
        this.update(); // Добавлено принудительное обновление
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.interval = setInterval(() => this.update(), 1000);
        }
    }

    pause() {
        clearInterval(this.interval);
        this.isRunning = false;
    }

    clear() {
        this.pause();
        this.timer = 60;
        this.flowPath = [];
        this.gridManager.selectedTiles = {};
        this.pipes = [];
    }

    update() {
        //super.update(); // Важно вызывать метод родителя
        this.gridManager.selectedTiles = {};

        // Исправление: Учет смещения поля
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        const offsetX = Math.floor((visibleWidth - this.gridSize) / 2);
        const offsetY = Math.floor((visibleHeight - this.gridSize) / 2);

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const pipe = this.pipes[y][x];
                const screenX = offsetX + x;
                const screenY = offsetY + y;
                this.gridManager.selectedTiles[`${screenX},${screenY}`] = { 
                    type: 'text',
                    text: pipe.type === 'S' ? '🚀' : pipe.type === 'E' ? '🏁' : pipe.type,
                    color: this.flowPath.some(p => p.x === x && p.y === y) ? '#00FF00' : '#FFFFFF',
                    rotation: pipe.rotation * 90
                };
            }
        }

        this.gridManager.updateVisibleTiles();
    }

    bindMouseEvents(gridManager) {
        gridManager.stage.on('click', (e) => {
            const pos = gridManager.stage.getPointerPosition();
            if (!pos) return;

            // Учет смещения поля
            const visibleWidth = Math.ceil(gridManager.stage.width() / gridManager.totalSize);
            const visibleHeight = Math.ceil(gridManager.stage.height() / gridManager.totalSize);
            const offsetX = Math.floor((visibleWidth - this.gridSize) / 2);
            const offsetY = Math.floor((visibleHeight - this.gridSize) / 2);

            const x = Math.floor(pos.x / gridManager.totalSize) - offsetX;
            const y = Math.floor(pos.y / gridManager.totalSize) - offsetY;

            if (this.isValidPosition(x, y)) {
                this.rotatePipe(x, y);
                this.update(); // Принудительное обновление после действия
            }
        });
    }

    // Остальные методы
    generatePipes() {
        this.pipes = Array.from({ length: this.gridSize }, (_, y) => 
            Array.from({ length: this.gridSize }, (_, x) => ({
                type: this.getRandomPipeType(),
                rotation: 0,
                x,
                y
            }))
        );
        this.pipes[0][0] = { type: 'S', rotation: 0 };
        this.pipes[this.gridSize-1][this.gridSize-1] = { type: 'E', rotation: 0 };
    }

    getRandomPipeType() {
        return Object.keys(this.pipeTypes)[Math.floor(Math.random() * 7)];
    }

    rotatePipe(x, y) {
        const pipe = this.pipes[y][x];
        if (['S', 'E'].includes(pipe.type)) return;
        
        pipe.rotation = (pipe.rotation + 1) % 4;
        this.checkFlow();
    }

    startFlow() {
        this.flowPath = [this.startPos];
        this.isRunning = true;
        this.interval = setInterval(() => {
            this.timer--;
            if (this.timer <= 0) this.gameOver(false);
        }, 1000);
    }

    checkFlow() {
        const visited = new Set();
        const queue = [this.startPos];
        let foundEnd = false;

        while (queue.length > 0 && !foundEnd) {
            const current = queue.shift();
            const key = `${current.x},${current.y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            if (current.x === this.endPos.x && current.y === this.endPos.y) {
                foundEnd = true;
                break;
            }

            this.getConnectedNeighbors(current.x, current.y).forEach(neighbor => {
                queue.push(neighbor);
            });
        }

        if (foundEnd) this.gameOver(true);
    }

    getConnectedNeighbors(x, y) {
        const pipe = this.pipes[y][x];
        const connectors = this.getRotatedConnectors(pipe);
        const neighbors = [];

        [
            { dx: 0, dy: -1, dir: 0 },
            { dx: 1, dy: 0, dir: 1 },
            { dx: 0, dy: 1, dir: 2 },
            { dx: -1, dy: 0, dir: 3 }
        ].forEach(({ dx, dy, dir }) => {
            if (connectors[dir] && this.isValidPosition(x + dx, y + dy)) {
                const neighbor = this.pipes[y + dy][x + dx];
                const neighborConnectors = this.getRotatedConnectors(neighbor);
                if (neighborConnectors[(dir + 2) % 4]) {
                    neighbors.push({ x: x + dx, y: y + dy });
                }
            }
        });

        return neighbors;
    }

    getRotatedConnectors(pipe) {
        const connectors = [...this.pipeTypes[pipe.type]];
        return Array.from({ length: pipe.rotation }, () => connectors.unshift(connectors.pop())) && connectors;
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize;
    }

    gameOver(success) {
        this.pause();
        alert(success ? 'Победа! Путь построен!' : 'Поражение! Время вышло!');
        this.setup();
    }

    // Заглушки для неиспользуемых методов
    toggleCell(x, y) {}
    handleLeftClick(x, y) {}
    handleRightClick(x, y) {}
    showContextMenu(x, y) {}
}