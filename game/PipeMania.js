// Файл: ./game/PipeMania.js
import { BaseModule } from './BaseModule.js';

export class PipeMania extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '🔄';
        this.gameDescription = 'Соедините трубы от старта до финиша!';
        this.name = 'PipeMania';
        this.gridManager = gridManager;
        
        // Настройки игры
        this.gridSize = 8;
        this.timer = 60;
        this.isRunning = false;
        this.interval = null;
        this.pipes = [];
        this.startPos = { x: 0, y: 0 };
        this.endPos = { x: 7, y: 7 };
        this.flowPath = [];
        
        // Типы труб и их коннекторы (верх, право, низ, лево)
        this.pipeTypes = {
            '┼': [1,1,1,1],  // Крест
            '─': [0,1,0,1],  // Горизонтальная
            '│': [1,0,1,0],  // Вертикальная
            '┌': [0,1,1,0],  // Угол
            '┐': [0,0,1,1],
            '└': [1,1,0,0],
            '┘': [1,0,0,1]
        };
    }

    setup() {
        this.clear();
        this.generatePipes();
        this.startFlow();
        this.bindMouseEvents();
        this.gridManager.updateVisibleTiles();
    }

    generatePipes() {
        // Генерация случайных труб
        this.pipes = Array.from({ length: this.gridSize }, (_, y) => 
            Array.from({ length: this.gridSize }, (_, x) => ({
                type: this.getRandomPipeType(),
                rotation: 0,
                x,
                y
            }))
        );
        
        // Фиксированные старт и финиш
        this.pipes[0][0] = { type: 'S', rotation: 0 };
        this.pipes[this.gridSize-1][this.gridSize-1] = { type: 'E', rotation: 0 };
    }

    getRandomPipeType() {
        const types = Object.keys(this.pipeTypes);
        return types[Math.floor(Math.random() * types.length)];
    }

    rotatePipe(x, y, clockwise = true) {
        const pipe = this.pipes[y][x];
        if (['S', 'E'].includes(pipe.type)) return;
        
        // Поворот коннекторов
        const connectors = this.pipeTypes[pipe.type];
        pipe.rotation = (pipe.rotation + (clockwise ? 1 : 3)) % 4;
        this.pipes[y][x] = pipe;
        
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
        const queue = [{ x: this.startPos.x, y: this.startPos.y }];
        let foundEnd = false;

        while (queue.length > 0) {
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
        const neighbors = [];
        const pipe = this.pipes[y][x];
        
        if (pipe.type === 'S') {
            // Стартовая точка всегда течет вправо и вниз
            return [
                { x: x+1, y },
                { x, y: y+1 }
            ];
        }

        const connectors = this.getRotatedConnectors(pipe);
        
        // Проверка всех направлений
        const directions = [
            { dx: 0, dy: -1, dir: 0 }, // Вверх
            { dx: 1, dy: 0, dir: 1 },  // Вправо
            { dx: 0, dy: 1, dir: 2 },  // Вниз
            { dx: -1, dy: 0, dir: 3 }  // Влево
        ];

        directions.forEach(({ dx, dy, dir }) => {
            if (connectors[dir]) {
                const nx = x + dx;
                const ny = y + dy;
                if (this.isValidPosition(nx, ny)) {
                    const neighbor = this.pipes[ny][nx];
                    if (neighbor.type === 'E') {
                        neighbors.push({ x: nx, y: ny });
                    } else if (neighbor.type in this.pipeTypes) {
                        const neighborConnectors = this.getRotatedConnectors(neighbor);
                        if (neighborConnectors[(dir + 2) % 4]) {
                            neighbors.push({ x: nx, y: ny });
                        }
                    }
                }
            }
        });

        return neighbors;
    }

    getRotatedConnectors(pipe) {
        const connectors = [...this.pipeTypes[pipe.type]];
        for (let i = 0; i < pipe.rotation; i++) {
            connectors.unshift(connectors.pop());
        }
        return connectors;
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize;
    }

    gameOver(success) {
        clearInterval(this.interval);
        this.isRunning = false;
        alert(success ? 'Победа! Путь построен!' : 'Поражение! Время вышло!');
        this.setup();
    }

    update() {
        this.gridManager.selectedTiles = {};

        // Отрисовка труб
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const pipe = this.pipes[y][x];
                const key = `${x},${y}`;
                this.gridManager.selectedTiles[key] = {
                    type: 'text',
                    text: pipe.type === 'S' ? '🚀' : pipe.type === 'E' ? '🏁' : pipe.type,
                    color: this.flowPath.some(p => p.x === x && p.y === y) ? '#00FF00' : '#FFFFFF',
                    rotation: pipe.rotation * 90
                };
            }
        }

        // Отрисовка таймера и счета
        this.gridManager.selectedTiles['timer'] = {
            type: 'text',
            text: `Время: ${this.timer}`,
            color: '#FFA500',
            x: this.gridSize + 1,
            y: 0
        };

        this.gridManager.updateVisibleTiles();
    }

    bindMouseEvents() {
        this.gridManager.stage.on('click', (event) => {
            const pos = this.gridManager.stage.getPointerPosition();
            if (!pos || !this.isRunning) return;

            const x = Math.floor(pos.x / this.gridManager.totalSize);
            const y = Math.floor(pos.y / this.gridManager.totalSize);

            if (this.isValidPosition(x, y)) {
                this.rotatePipe(x, y);
            }
        });
    }

    handleLeftClick(x, y) {}
    handleRightClick(x, y) {}
    toggleCell(x, y) {}
    showContextMenu(x, y) {}

    clear() {
        this.pause();
        this.timer = 60;
        this.flowPath = [];
        this.gridManager.selectedTiles = {};
    }

    pause() {
        clearInterval(this.interval);
        this.isRunning = false;
    }
}