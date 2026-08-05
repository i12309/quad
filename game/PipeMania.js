// Файл: ./game/PipeMania.js
import { BaseModule } from './BaseModule.js';

const DIRECTIONS = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 }
];

const PIPE_SHAPES = [
    [0, 1, 0, 1], // прямая
    [0, 1, 1, 0], // угол
    [1, 1, 1, 1]  // крест
];

export class PipeMania extends BaseModule {
    constructor(gridManager) {
        super();
        this.name = 'PipeMania';
        this.gameIcon = '🔄';
        this.gameDescription = 'Поворачивайте трубы и проложите поток от S до E.';
        this.usesStartStop = true;
        this.gridManager = gridManager;

        this.gridSize = 8;
        this.duration = 60;
        this.timer = this.duration;
        this.isRunning = false;
        this.interval = null;
        this.pipes = [];
        this.startPos = { x: 0, y: 0 };
        this.endPos = { x: this.gridSize - 1, y: this.gridSize - 1 };
        this.flowPath = [];
        this.solutionPath = [];
        this.offsetX = 0;
        this.offsetY = 0;
        this.finished = false;
    }

    setup() {
        this.pause();
        this.clearBindings();
        this.gridManager.setGridMetrics?.(32, 4);
        this.resetState();
        this.bindMouseEvents();
        this.render();
        this.setStatus('Нажимайте на трубы, чтобы поворачивать их по часовой стрелке.');
    }

    resetState() {
        this.timer = this.duration;
        this.finished = false;
        this.calculateOffset();
        this.generateSolvableBoard();
        this.updateFlow(false);
    }

    calculateOffset() {
        const visibleWidth = Math.floor(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.floor(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.offsetX = Math.max(1, Math.floor((visibleWidth - this.gridSize) / 2));
        this.offsetY = Math.max(2, Math.floor((visibleHeight - this.gridSize) / 2));
    }

    start() {
        if (this.isRunning) return;
        if (this.finished) {
            this.resetState();
            this.render();
        }
        this.setRunning(true);
        this.interval = setInterval(() => {
            this.timer = Math.max(0, this.timer - 1);
            this.render();
            if (this.timer === 0) this.endGame(false);
        }, 1000);
        this.setStatus('Поток запущен.');
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
        this.setStatus('Новая схема готова.');
    }

    update() {
        this.render();
    }

    generateSolvableBoard() {
        // Генерация повторяется, если случайные ложные связи уже соединили S и E.
        for (let attempt = 0; attempt < 40; attempt++) {
            this.buildBoardAttempt();
            const reachable = this.findReachable();
            if (!reachable.has(`${this.endPos.x},${this.endPos.y}`)) return;
        }

        // Практически недостижимый fallback: ломаем гарантированный маршрут в его середине.
        const middle = this.solutionPath[Math.floor(this.solutionPath.length / 2)];
        if (middle && !this.isEndpoint(middle.x, middle.y)) this.rotatePipeData(this.pipes[middle.y][middle.x]);
    }

    buildBoardAttempt() {
        this.pipes = Array.from({ length: this.gridSize }, (_, y) =>
            Array.from({ length: this.gridSize }, (_, x) => {
                const source = PIPE_SHAPES[Math.floor(Math.random() * PIPE_SHAPES.length)];
                const pipe = {
                    type: 'pipe',
                    x,
                    y,
                    connectors: [...source],
                    solution: null
                };
                const rotations = Math.floor(Math.random() * 4);
                for (let i = 0; i < rotations; i++) this.rotatePipeData(pipe);
                return pipe;
            })
        );

        this.solutionPath = this.createSolutionPath();
        for (let index = 0; index < this.solutionPath.length; index++) {
            const current = this.solutionPath[index];
            const needed = [0, 0, 0, 0];
            const previous = this.solutionPath[index - 1];
            const next = this.solutionPath[index + 1];
            if (previous) needed[this.directionFrom(current, previous)] = 1;
            if (next) needed[this.directionFrom(current, next)] = 1;

            const type = index === 0 ? 'start' : index === this.solutionPath.length - 1 ? 'end' : 'pipe';
            this.pipes[current.y][current.x] = {
                type,
                x: current.x,
                y: current.y,
                connectors: [...needed],
                solution: [...needed]
            };

            if (type === 'pipe') {
                const rotations = Math.floor(Math.random() * 4);
                for (let rotation = 0; rotation < rotations; rotation++) {
                    this.rotatePipeData(this.pipes[current.y][current.x]);
                }
            }
        }
    }

    createSolutionPath() {
        const moves = [];
        for (let i = 0; i < this.gridSize - 1; i++) {
            moves.push({ dx: 1, dy: 0 });
            moves.push({ dx: 0, dy: 1 });
        }
        for (let i = moves.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [moves[i], moves[j]] = [moves[j], moves[i]];
        }

        const path = [{ ...this.startPos }];
        let x = this.startPos.x;
        let y = this.startPos.y;
        for (const move of moves) {
            x += move.dx;
            y += move.dy;
            path.push({ x, y });
        }
        return path;
    }

    directionFrom(from, to) {
        return DIRECTIONS.findIndex(direction =>
            from.x + direction.dx === to.x && from.y + direction.dy === to.y
        );
    }

    rotatePipe(x, y) {
        if (!this.isRunning || this.finished || !this.isValidPosition(x, y) || this.isEndpoint(x, y)) return;
        this.rotatePipeData(this.pipes[y][x]);
        this.updateFlow(true);
        this.render();
    }

    rotatePipeData(pipe) {
        pipe.connectors.unshift(pipe.connectors.pop());
    }

    updateFlow(allowFinish) {
        const reachable = this.findReachable();
        this.flowPath = [...reachable].map(key => {
            const [x, y] = key.split(',').map(Number);
            return { x, y };
        });
        if (allowFinish && reachable.has(`${this.endPos.x},${this.endPos.y}`)) this.endGame(true);
    }

    findReachable() {
        const visited = new Set();
        const queue = [{ ...this.startPos }];

        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.x},${current.y}`;
            if (visited.has(key)) continue;
            visited.add(key);
            for (const neighbor of this.getConnectedNeighbors(current.x, current.y)) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                if (!visited.has(neighborKey)) queue.push(neighbor);
            }
        }
        return visited;
    }

    getConnectedNeighbors(x, y) {
        const pipe = this.pipes[y]?.[x];
        if (!pipe) return [];
        const neighbors = [];
        DIRECTIONS.forEach((direction, index) => {
            if (!pipe.connectors[index]) return;
            const neighborX = x + direction.dx;
            const neighborY = y + direction.dy;
            if (!this.isValidPosition(neighborX, neighborY)) return;
            const neighbor = this.pipes[neighborY][neighborX];
            if (neighbor.connectors[(index + 2) % 4]) neighbors.push({ x: neighborX, y: neighborY });
        });
        return neighbors;
    }

    isEndpoint(x, y) {
        return (x === this.startPos.x && y === this.startPos.y) ||
            (x === this.endPos.x && y === this.endPos.y);
    }

    isValidPosition(x, y) {
        return x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize;
    }

    endGame(success) {
        if (this.finished) return;
        this.finished = true;
        this.pause();
        this.render();
        if (success) {
            this.finish(`Путь построен! Осталось ${this.timer} с.`);
        } else {
            this.finish('Время вышло. Нажмите «Старт» для новой схемы.');
        }
    }

    connectorsToGlyph(connectors) {
        const mask = connectors.join('');
        const glyphs = {
            '1111': '┼',
            '1010': '│',
            '0101': '─',
            '0110': '┌',
            '0011': '┐',
            '1100': '└',
            '1001': '┘'
        };
        return glyphs[mask] || '·';
    }

    render() {
        this.calculateOffset();
        const tiles = {};
        const flowing = new Set(this.flowPath.map(position => `${position.x},${position.y}`));

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const pipe = this.pipes[y][x];
                const hasFlow = flowing.has(`${x},${y}`);
                const text = pipe.type === 'start'
                    ? 'S'
                    : pipe.type === 'end'
                        ? 'E'
                        : this.connectorsToGlyph(pipe.connectors);
                tiles[`${this.offsetX + x},${this.offsetY + y}`] = {
                    type: 'cell',
                    color: hasFlow ? '#0E6B3A' : '#1B2430',
                    text,
                    textColor: hasFlow ? '#8CFFAD' : '#D7DEE8'
                };
            }
        }

        const hudX = this.offsetX + this.gridSize + 2;
        tiles[`${hudX},${this.offsetY}`] = {
            type: 'text',
            text: `Время: ${this.timer}`,
            color: this.timer <= 10 ? '#FF5D73' : '#FFFFFF'
        };
        tiles[`${hudX},${this.offsetY + 2}`] = {
            type: 'text',
            text: `Поток: ${this.flowPath.length}/${this.gridSize * this.gridSize}`,
            color: '#AEB7C6'
        };

        this.gridManager.selectedTiles = tiles;
        this.gridManager.updateVisibleTiles();
    }

    bindMouseEvents() {
        const handler = () => {
            if (!this.isRunning || this.finished) return;
            const position = this.gridManager.stage.getPointerPosition();
            if (!position) return;
            const gridX = Math.floor((position.x - this.gridManager.stage.x()) / this.gridManager.totalSize);
            const gridY = Math.floor((position.y - this.gridManager.stage.y()) / this.gridManager.totalSize);
            this.rotatePipe(gridX - this.offsetX, gridY - this.offsetY);
        };
        this.bindStageEvent('click', handler);
    }

    bindStageEvent(eventName, handler) {
        if (this.bindStage.length >= 3) {
            this.bindStage(this.gridManager.stage, eventName, handler);
        } else {
            this.bindStage(eventName, handler);
        }
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
    showContextMenu() {}
}
