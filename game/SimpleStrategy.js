import { BaseModule } from './BaseModule.js';

export class SimpleStrategy extends BaseModule {
    constructor(gridManager) {
        super();
        this.name = 'Простая стратегия';
        this.gameIcon = '🏰';
        this.gameDescription = 'Назначайте рабочих, добывайте ресурсы и улучшайте замок.';
        this.gridManager = gridManager;
        this.usesStartStop = true;
        this.interval = null;
        this.tickSpeed = 700;
        this.width = 0;
        this.height = 0;
        this.resources = { wood: 15, gold: 5 };
        this.workers = [];
        this.castle = { x: 0, y: 0, level: 1 };
        this.resourceNodes = new Map();
        this.selectedWorker = null;
        this.finished = false;
        this.tickCount = 0;

        this.onStageClick = this.onStageClick.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        this.tick = this.update.bind(this);
    }

    setup() {
        this.gridManager.setGridMetrics?.(16, 2);
        this.clearBindings();
        this.bindStage('click', this.onStageClick);
        this.bindStage('contextmenu', this.onContextMenu);
        this.resetGame();
    }

    resetGame() {
        this.pause();
        const columns = Math.floor(this.gridManager.stage.width() / this.gridManager.totalSize);
        const rows = Math.floor(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.width = Math.max(16, Math.min(32, columns));
        this.height = Math.max(12, Math.min(24, rows - 3));
        this.gridManager.stage.x(Math.max(0, Math.floor(
            (this.gridManager.stage.width() - this.width * this.gridManager.totalSize) / 2
        )));
        this.resources = { wood: 15, gold: 5 };
        this.castle = { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) + 2, level: 1 };
        this.workers = [
            { id: 1, x: this.castle.x - 2, y: this.castle.y, task: null },
            { id: 2, x: this.castle.x + 2, y: this.castle.y, task: null },
        ];
        this.resourceNodes = new Map();
        this.selectedWorker = null;
        this.finished = false;
        this.tickCount = 0;
        this.generateNodes();
        this.render();
        this.setStatus('Рабочий → дерево/рудник: назначить. Замок: улучшить. ПКМ по замку: нанять.', 'info');
    }

    generateNodes() {
        const treePositions = [
            [2, 5], [4, 8], [3, this.height - 2], [7, 4], [7, this.height - 3],
        ];
        const minePositions = [
            [this.width - 3, 5], [this.width - 5, 9], [this.width - 3, this.height - 3],
        ];
        for (const [x, y] of treePositions) {
            if (x > 0 && y > 3 && x < this.width - 1 && y <= this.height && !this.isCastleCell(x, y)) {
                this.resourceNodes.set(`${x},${y}`, { type: 'tree' });
            }
        }
        for (const [x, y] of minePositions) {
            if (x > 0 && y > 3 && x < this.width - 1 && y <= this.height && !this.isCastleCell(x, y)) {
                this.resourceNodes.set(`${x},${y}`, { type: 'mine' });
            }
        }
    }

    start() {
        if (this.finished) this.resetGame();
        if (this.isRunning) return;
        this.setRunning(true);
        this.interval = setInterval(this.tick, this.tickSpeed);
        this.setStatus('Поселение работает. Назначайте рабочих кликами.', 'info');
    }

    pause() {
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.setRunning(false);
    }

    clear() {
        this.resetGame();
    }

    update() {
        if (!this.isRunning || this.finished) return;
        this.tickCount++;
        for (const worker of this.workers) {
            if (!worker.task) continue;
            const node = this.resourceNodes.get(worker.task);
            if (!node) {
                worker.task = null;
                continue;
            }
            if (node.type === 'tree') this.resources.wood += 2;
            if (node.type === 'mine') this.resources.gold += 1;
        }
        this.render();
    }

    onStageClick(event) {
        if (event?.evt?.button !== undefined && event.evt.button !== 0) return;
        const cell = this.gridManager.getGridPosition?.();
        if (!cell) return;
        const worker = this.workers.find((item) => item.x === cell.x && item.y === cell.y);
        if (worker) {
            this.selectedWorker = worker.id;
            this.render();
            this.setStatus(`Рабочий ${worker.id} выбран. Теперь нажмите на дерево или рудник.`, 'info');
            return;
        }

        const nodeKey = `${cell.x},${cell.y}`;
        const node = this.resourceNodes.get(nodeKey);
        if (node) {
            this.assignWorker(nodeKey, node);
            return;
        }

        if (this.isCastleCell(cell.x, cell.y)) this.upgradeCastle();
    }

    onContextMenu(event) {
        event?.evt?.preventDefault?.();
        const cell = this.gridManager.getGridPosition?.();
        if (cell && this.isCastleCell(cell.x, cell.y)) this.hireWorker();
    }

    assignWorker(nodeKey, node) {
        let worker = this.workers.find((item) => item.id === this.selectedWorker);
        if (!worker) worker = this.workers.find((item) => !item.task);
        if (!worker) {
            this.setStatus('Нет свободных рабочих. Выберите занятого рабочего или наймите нового.', 'warning');
            return;
        }

        worker.task = nodeKey;
        const [nodeX, nodeY] = nodeKey.split(',').map(Number);
        worker.x = Math.max(1, Math.min(this.width - 2, nodeX + (nodeX < this.castle.x ? 1 : -1)));
        worker.y = nodeY;
        this.selectedWorker = null;
        this.render();
        this.setStatus(`Рабочий ${worker.id} добывает ${node.type === 'tree' ? 'дерево' : 'золото'}.`, 'success');
    }

    upgradeCost() {
        return this.castle.level === 1 ? { wood: 30, gold: 12 } : { wood: 65, gold: 30 };
    }

    upgradeCastle() {
        if (this.finished) return;
        const cost = this.upgradeCost();
        if (this.resources.wood < cost.wood || this.resources.gold < cost.gold) {
            this.setStatus(`Для уровня ${this.castle.level + 1} нужно ${cost.wood} дерева и ${cost.gold} золота.`, 'warning');
            return;
        }
        this.resources.wood -= cost.wood;
        this.resources.gold -= cost.gold;
        this.castle.level++;
        this.render();

        if (this.castle.level >= 3) {
            this.finished = true;
            this.finish('Победа! Замок достиг 3 уровня — поселение стало королевством.', 'success');
        } else {
            this.setStatus('Замок улучшен до 2 уровня. Соберите ресурсы для финального улучшения.', 'success');
        }
    }

    hireWorker() {
        if (this.finished) return;
        if (this.workers.length >= 6) {
            this.setStatus('В поселении уже максимум рабочих.', 'warning');
            return;
        }
        const cost = { wood: 18, gold: 6 };
        if (this.resources.wood < cost.wood || this.resources.gold < cost.gold) {
            this.setStatus(`Новый рабочий стоит ${cost.wood} дерева и ${cost.gold} золота.`, 'warning');
            return;
        }
        this.resources.wood -= cost.wood;
        this.resources.gold -= cost.gold;
        const id = this.workers.length + 1;
        this.workers.push({ id, x: this.castle.x + (id % 3) - 1, y: this.castle.y + 2, task: null });
        this.render();
        this.setStatus(`Нанят рабочий ${id}.`, 'success');
    }

    isCastleCell(x, y) {
        return Math.abs(x - this.castle.x) <= 1 && Math.abs(y - this.castle.y) <= 1;
    }

    render() {
        const tiles = {};
        for (let x = 0; x < this.width; x++) {
            tiles[`${x},3`] = { type: 'border', color: '#40505f' };
            tiles[`${x},${this.height + 1}`] = { type: 'border', color: '#40505f' };
        }
        for (const [key, node] of this.resourceNodes) {
            tiles[key] = node.type === 'tree'
                ? { type: 'tree', color: '#2f8f4e', text: '♣', textColor: '#d9f7df' }
                : { type: 'mine', color: '#8a6f3d', text: '◆', textColor: '#ffd166' };
        }
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                tiles[`${this.castle.x + dx},${this.castle.y + dy}`] = {
                    type: 'castle',
                    color: '#5d6d7e',
                    text: dx === 0 && dy === 0 ? String(this.castle.level) : '',
                    textColor: '#ffffff',
                };
            }
        }
        for (const worker of this.workers) {
            tiles[`${worker.x},${worker.y}`] = {
                type: 'worker',
                color: worker.id === this.selectedWorker ? '#ffca3a' : '#4dabf7',
                text: String(worker.id),
                textColor: '#102030',
            };
        }

        tiles['0,0'] = {
            type: 'text',
            text: `Дерево: ${this.resources.wood}   Золото: ${this.resources.gold}   Рабочие: ${this.workers.length}`,
            color: '#f3f6fb',
            widthCells: 25,
        };
        const cost = this.upgradeCost();
        tiles['0,1'] = {
            type: 'text',
            text: `Замок: ${this.castle.level}/3   Улучшение: ${cost.wood} дерева + ${cost.gold} золота`,
            color: '#ffd166',
            widthCells: 27,
        };
        tiles['0,2'] = {
            type: 'text',
            text: 'ЛКМ: выбрать/назначить/улучшить • ПКМ по замку: нанять',
            color: '#8ecae6',
            widthCells: 30,
        };
        this.gridManager.selectedTiles = tiles;
        this.gridManager.updateVisibleTiles();
    }

    onResize() {
        this.resetGame();
    }
}
