import { BaseModule } from './BaseModule.js';

export class RaceGame extends BaseModule {
    constructor(gridManager) {
        super();
        this.name = 'Гонка';
        this.gameIcon = '🏎️';
        this.gameDescription = 'Уклоняйтесь от машин на бесконечной дороге.';
        this.gridManager = gridManager;
        this.usesStartStop = true;
        this.interval = null;
        this.baseTickSpeed = 145;
        this.width = 0;
        this.height = 0;
        this.roadLeft = 0;
        this.roadRight = 0;
        this.car = { x: 0, y: 0 };
        this.obstacles = [];
        this.score = 0;
        this.tickCount = 0;
        this.finished = false;

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onStageClick = this.onStageClick.bind(this);
        this.tick = this.update.bind(this);
    }

    setup() {
        this.gridManager.setGridMetrics?.(14, 2);
        this.clearBindings();
        this.bindDom(document, 'keydown', this.onKeyDown);
        this.bindStage('click', this.onStageClick);
        this.resetRace();
    }

    resetRace() {
        this.pause();
        const columns = Math.floor(this.gridManager.stage.width() / this.gridManager.totalSize);
        const rows = Math.floor(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.width = Math.max(12, Math.min(28, columns));
        this.height = Math.max(14, Math.min(32, rows - 2));
        this.gridManager.stage.x(Math.max(0, Math.floor(
            (this.gridManager.stage.width() - this.width * this.gridManager.totalSize) / 2
        )));
        const roadWidth = Math.min(15, Math.max(7, this.width - 4));
        this.roadLeft = Math.floor((this.width - roadWidth) / 2);
        this.roadRight = this.roadLeft + roadWidth - 1;
        this.car = {
            x: Math.floor((this.roadLeft + this.roadRight) / 2),
            y: this.height - 2,
        };
        this.obstacles = [];
        this.score = 0;
        this.tickCount = 0;
        this.finished = false;
        this.render();
        this.setStatus('Стрелки ← → или A/D — руль. Нажмите «Старт».', 'info');
    }

    start() {
        if (this.finished) this.resetRace();
        if (this.isRunning) return;
        this.setRunning(true);
        this.scheduleTimer();
        this.setStatus('Гонка началась! Не задевайте серые машины.', 'info');
    }

    scheduleTimer() {
        if (this.interval !== null) clearInterval(this.interval);
        const speed = Math.max(65, this.baseTickSpeed - Math.floor(this.score / 8) * 5);
        this.interval = setInterval(this.tick, speed);
    }

    pause() {
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.setRunning(false);
    }

    clear() {
        this.resetRace();
    }

    onKeyDown(event) {
        const left = event.code === 'ArrowLeft' || event.code === 'KeyA';
        const right = event.code === 'ArrowRight' || event.code === 'KeyD';
        const restart = event.code === 'Enter' || event.code === 'Space';

        if (restart && this.finished) {
            event.preventDefault();
            this.resetRace();
            this.start();
            return;
        }
        if ((!left && !right) || !this.isRunning) return;
        event.preventDefault();
        this.moveCar(left ? -1 : 1);
    }

    onStageClick() {
        if (!this.isRunning) return;
        const cell = this.gridManager.getGridPosition?.();
        if (!cell) return;
        this.moveCar(cell.x < this.car.x ? -1 : 1);
    }

    moveCar(dx) {
        this.car.x = Math.max(this.roadLeft + 1, Math.min(this.roadRight - 1, this.car.x + dx));
        if (this.checkCollision()) {
            this.gameOver();
            return;
        }
        this.render();
    }

    update() {
        if (!this.isRunning) return;
        this.tickCount++;

        for (const obstacle of this.obstacles) obstacle.y++;
        const passed = this.obstacles.filter((obstacle) => obstacle.y > this.height).length;
        this.obstacles = this.obstacles.filter((obstacle) => obstacle.y <= this.height);
        this.score += passed;

        const spawnEvery = Math.max(4, 8 - Math.floor(this.score / 8));
        if (this.tickCount % spawnEvery === 0) this.spawnObstacle();

        if (this.checkCollision()) {
            this.gameOver();
            return;
        }

        if (passed > 0 && this.score % 8 === 0) this.scheduleTimer();
        this.render();
    }

    spawnObstacle() {
        const minX = this.roadLeft + 1;
        const maxX = this.roadRight - 1;
        const occupied = new Set(this.obstacles.filter((item) => item.y < 4).map((item) => item.x));
        const choices = [];
        for (let x = minX; x <= maxX; x += 2) {
            if (!occupied.has(x)) choices.push(x);
        }
        if (choices.length === 0) return;
        const x = choices[Math.floor(Math.random() * choices.length)];
        this.obstacles.push({ x, y: 2 });
    }

    carCells(car = this.car) {
        return [
            [car.x, car.y - 1],
            [car.x - 1, car.y],
            [car.x, car.y],
            [car.x + 1, car.y],
        ];
    }

    obstacleCells(obstacle) {
        return [
            [obstacle.x, obstacle.y],
            [obstacle.x - 1, obstacle.y + 1],
            [obstacle.x, obstacle.y + 1],
            [obstacle.x + 1, obstacle.y + 1],
        ];
    }

    checkCollision() {
        const carKeys = new Set(this.carCells().map(([x, y]) => `${x},${y}`));
        return this.obstacles.some((obstacle) =>
            this.obstacleCells(obstacle).some(([x, y]) => carKeys.has(`${x},${y}`))
        );
    }

    gameOver() {
        this.finished = true;
        this.render();
        this.finish(`Авария! Счёт: ${this.score}. Enter/Пробел — новая гонка.`, 'error');
    }

    render() {
        const tiles = {};
        for (let y = 2; y <= this.height; y++) {
            tiles[`${this.roadLeft},${y}`] = { type: 'edge', color: '#f0f0f0' };
            tiles[`${this.roadRight},${y}`] = { type: 'edge', color: '#f0f0f0' };
            if ((y + this.tickCount) % 4 < 2) {
                const middle = Math.floor((this.roadLeft + this.roadRight) / 2);
                tiles[`${middle},${y}`] = { type: 'marking', color: '#ffd166' };
            }
        }

        for (const obstacle of this.obstacles) {
            for (const [x, y] of this.obstacleCells(obstacle)) {
                if (y >= 2 && y <= this.height) tiles[`${x},${y}`] = { type: 'rival', color: '#7b8794' };
            }
        }
        for (const [x, y] of this.carCells()) {
            tiles[`${x},${y}`] = { type: 'car', color: this.finished ? '#e63946' : '#23c483' };
        }
        tiles['0,0'] = {
            type: 'text',
            text: `Счёт: ${this.score}   Скорость: ${Math.min(9, 1 + Math.floor(this.score / 8))}`,
            color: '#f3f6fb',
            widthCells: 20,
        };
        tiles['0,1'] = {
            type: 'text',
            text: this.finished ? 'АВАРИЯ • Enter — заново' : '← → / A D — управление',
            color: this.finished ? '#ff6b6b' : '#8ecae6',
            widthCells: 20,
        };
        this.gridManager.selectedTiles = tiles;
        this.gridManager.updateVisibleTiles();
    }

    onResize() {
        this.resetRace();
    }
}
