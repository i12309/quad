import { BaseModule } from './BaseModule.js';

// Небольшая строительная песочница. Мир хранится отдельно от отрисовки,
// поэтому добытый блок действительно исчезает, а поставленный остаётся.
export class BlockCraft2D extends BaseModule {
    constructor(gridManager) {
        super();
        this.name = 'BlockCraft 2D';
        this.gameIcon = '⛏️';
        this.gameDescription = 'Добывайте блоки левой кнопкой и стройте правой.';
        this.gridManager = gridManager;
        this.usesStartStop = false;

        this.width = 0;
        this.height = 0;
        this.world = new Map();
        this.inventory = { dirt: 8, stone: 0, wood: 0 };
        this.selectedBlock = 'dirt';
        this.blockTypes = {
            grass: { color: '#4f9d45', drop: 'dirt', name: 'земля' },
            dirt: { color: '#8b5a35', drop: 'dirt', name: 'земля' },
            stone: { color: '#89929b', drop: 'stone', name: 'камень' },
            wood: { color: '#a66b32', drop: 'wood', name: 'дерево' },
            leaves: { color: '#2f7d45', drop: 'wood', name: 'листва' },
            water: { color: '#318bd1', solid: true, name: 'вода' },
            bedrock: { color: '#30343b', solid: true, name: 'граница' },
        };

        this.onStageClick = this.onStageClick.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    setup() {
        this.gridManager.setGridMetrics?.(16, 2);
        this.clearBindings();
        this.bindStage('click', this.onStageClick);
        this.bindStage('contextmenu', this.onContextMenu);
        this.bindDom(document, 'keydown', this.onKeyDown);
        this.newWorld();
    }

    newWorld() {
        this.pause();
        const columns = Math.floor(this.gridManager.stage.width() / this.gridManager.totalSize);
        const rows = Math.floor(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.width = Math.max(14, Math.min(34, columns));
        this.height = Math.max(10, Math.min(24, rows - 2));
        this.gridManager.stage.x(Math.max(0, Math.floor(
            (this.gridManager.stage.width() - this.width * this.gridManager.totalSize) / 2
        )));
        this.world = new Map();
        this.inventory = { dirt: 8, stone: 0, wood: 0 };
        this.selectedBlock = 'dirt';

        for (let x = 0; x < this.width; x++) {
            for (let y = 2; y < this.height + 2; y++) {
                const border = x === 0 || x === this.width - 1 || y === this.height + 1;
                if (border) {
                    this.world.set(`${x},${y}`, 'bedrock');
                    continue;
                }

                const noise = this.hash(x, y);
                if (noise < 0.08) this.world.set(`${x},${y}`, 'water');
                else if (noise < 0.20) this.world.set(`${x},${y}`, 'stone');
                else this.world.set(`${x},${y}`, noise > 0.78 ? 'grass' : 'dirt');
            }
        }

        // Несколько узнаваемых деревьев поверх земли.
        const treeCount = Math.max(2, Math.floor(this.width / 9));
        for (let i = 0; i < treeCount; i++) {
            const x = 3 + ((i * 8 + 3) % Math.max(4, this.width - 6));
            const y = 4 + ((i * 5) % Math.max(3, this.height - 6));
            this.world.set(`${x},${y}`, 'wood');
            this.world.set(`${x - 1},${y}`, 'leaves');
            this.world.set(`${x + 1},${y}`, 'leaves');
            this.world.set(`${x},${y - 1}`, 'leaves');
        }

        this.render();
        this.setStatus('ЛКМ — добыть, ПКМ — поставить. Клавиши 1/2/3: земля, камень, дерево.', 'info');
    }

    hash(x, y) {
        const value = Math.sin(x * 91.7 + y * 47.3) * 43758.5453;
        return value - Math.floor(value);
    }

    start() {
        this.setStatus('Это песочница без паузы: добывайте и стройте мышью.', 'info');
    }

    pause() {
        this.isRunning = false;
    }

    clear() {
        this.newWorld();
    }

    pointerCell() {
        return this.gridManager.getGridPosition?.() ?? null;
    }

    onStageClick(event) {
        if (event?.evt?.button !== undefined && event.evt.button !== 0) return;
        const cell = this.pointerCell();
        if (cell) this.mine(cell.x, cell.y);
    }

    onContextMenu(event) {
        event?.evt?.preventDefault?.();
        const cell = this.pointerCell();
        if (cell) this.place(cell.x, cell.y);
    }

    onKeyDown(event) {
        const choices = { Digit1: 'dirt', Digit2: 'stone', Digit3: 'wood' };
        const choice = choices[event.code];
        if (!choice) return;
        this.selectedBlock = choice;
        this.render();
        this.setStatus(`Выбран блок: ${this.blockTypes[choice].name}. ПКМ — поставить.`, 'info');
    }

    mine(x, y) {
        if (y < 2) return;
        const key = `${x},${y}`;
        const type = this.world.get(key);
        const block = this.blockTypes[type];
        if (!block) {
            this.setStatus('Здесь уже пусто. Выберите материал и поставьте блок ПКМ.', 'info');
            return;
        }
        if (block.solid) {
            this.setStatus(`${block.name[0].toUpperCase()}${block.name.slice(1)} нельзя добыть.`, 'warning');
            return;
        }

        this.world.delete(key);
        this.inventory[block.drop] = (this.inventory[block.drop] ?? 0) + 1;
        this.render();
        this.setStatus(`Получено: ${this.blockTypes[block.drop].name}.`, 'success');
    }

    place(x, y) {
        if (x <= 0 || x >= this.width - 1 || y < 2 || y > this.height) return;
        const key = `${x},${y}`;
        if (this.world.has(key)) {
            this.setStatus('Клетка занята — сначала добудьте этот блок.', 'warning');
            return;
        }
        if ((this.inventory[this.selectedBlock] ?? 0) <= 0) {
            this.setStatus(`Нет материала «${this.blockTypes[this.selectedBlock].name}».`, 'warning');
            return;
        }

        this.world.set(key, this.selectedBlock);
        this.inventory[this.selectedBlock]--;
        this.render();
    }

    render() {
        const tiles = {};
        for (const [key, type] of this.world) {
            tiles[key] = { type, color: this.blockTypes[type].color };
        }
        tiles['0,0'] = {
            type: 'text',
            text: `1 Земля:${this.inventory.dirt}   2 Камень:${this.inventory.stone}   3 Дерево:${this.inventory.wood}`,
            color: '#f3f6fb',
            widthCells: 24,
        };
        tiles['0,1'] = {
            type: 'text',
            text: `Выбрано: ${this.blockTypes[this.selectedBlock].name}`,
            color: '#ffd166',
            widthCells: 18,
        };
        this.gridManager.selectedTiles = tiles;
        this.gridManager.updateVisibleTiles();
    }

    onResize() {
        this.newWorld();
    }
}
