import test from 'node:test';
import assert from 'node:assert/strict';

class FakeElement {
    constructor(tagName = 'div', id = '') {
        this.tagName = tagName.toUpperCase();
        this.id = id;
        this.children = [];
        this.dataset = {};
        this.style = {};
        this.hidden = false;
        this.className = '';
        this.attributes = new Map();
        this.listeners = new Map();
        this._textContent = '';
        this._innerHTML = '';
        this._clientWidth = 960;
        this._clientHeight = 640;
        this._rect = null;
    }

    set textContent(value) { this._textContent = String(value); }
    get textContent() { return this._textContent; }
    set innerHTML(value) { this._innerHTML = String(value); this.children = []; }
    get innerHTML() { return this._innerHTML; }
    append(...children) { this.children.push(...children); }
    appendChild(child) { this.children.push(child); return child; }
    addEventListener(type, handler) { this.listeners.set(type, handler); }
    removeEventListener(type, handler) {
        if (this.listeners.get(type) === handler) this.listeners.delete(type);
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    click() { this.listeners.get('click')?.({ preventDefault() {} }); }
    dispatch(type) {
        this.listeners.get(type)?.({ target: this, currentTarget: this, preventDefault() {} });
    }
    setBoundingClientRect(rect) { this._rect = { ...rect }; }
    get clientWidth() { return this._clientWidth; }
    set clientWidth(value) { this._clientWidth = value; }
    get clientHeight() {
        if (this.id === 'container') {
            const top = Number.parseFloat(this.style.top) || 0;
            return Math.max(0, this._clientHeight - top);
        }
        return this._clientHeight;
    }
    set clientHeight(value) { this._clientHeight = value; }
    getBoundingClientRect() {
        if (this._rect) return { ...this._rect };
        const top = Number.parseFloat(this.style.top) || 0;
        return {
            top,
            bottom: top + this.clientHeight,
            left: 0,
            right: this.clientWidth,
            width: this.clientWidth,
            height: this.clientHeight,
        };
    }
}

class FakeNode {
    constructor(config = {}) { this.config = config; this.children = []; }
    add(child) { this.children.push(child); }
}

class FakeStage extends FakeNode {
    constructor(config) {
        super(config);
        this._width = config.width;
        this._height = config.height;
        this._x = 0;
        this._y = 0;
        this.handlers = new Map();
        this.containerElement = new FakeElement('div');
    }
    width(value) { if (value === undefined) return this._width; this._width = value; }
    height(value) { if (value === undefined) return this._height; this._height = value; }
    x(value) { if (value === undefined) return this._x; this._x = value; }
    y(value) { if (value === undefined) return this._y; this._y = value; }
    on(events, handler) { for (const event of events.split(/\s+/)) this.handlers.set(event, handler); }
    off(selector = '') {
        if (!selector) return this.handlers.clear();
        for (const event of [...this.handlers.keys()]) {
            if (event === selector || event.endsWith(selector)) this.handlers.delete(event);
        }
    }
    container() { return this.containerElement; }
    getPointerPosition() { return { x: 0, y: 0 }; }
    destroy() { this.handlers.clear(); }
}

class FakeLayer extends FakeNode {
    constructor(config) { super(config); this.drawCount = 0; }
    destroyChildren() { this.children = []; }
    batchDraw() { this.drawCount += 1; }
}

test('the application loader registers all games and can open/close one', async () => {
    const ids = [
        'game-buttons-container', 'loading-status', 'start-menu', 'game-controls',
        'game-title', 'game-icon', 'game-description', 'start-stop-btn',
        'clear-btn', 'back-to-menu-btn', 'game-status', 'container',
        'grid-scale-control', 'grid-scale-decrease', 'grid-scale-input',
        'grid-scale-increase', 'grid-scale-value',
    ];
    const elements = new Map(ids.map((id) => [id, new FakeElement('div', id)]));
    elements.get('game-controls').hidden = true;
    elements.get('grid-scale-control').hidden = true;
    elements.get('game-controls').setBoundingClientRect({
        top: 14,
        bottom: 90,
        left: 20,
        right: 940,
        width: 920,
        height: 76,
    });

    globalThis.document = {
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, new FakeElement('div', id));
            return elements.get(id);
        },
        createElement(tagName) { return new FakeElement(tagName); },
    };
    globalThis.window = {
        innerWidth: 960,
        innerHeight: 640,
        addEventListener() {},
        removeEventListener() {},
    };
    const storedValues = new Map();
    globalThis.localStorage = {
        getItem(key) { return storedValues.get(key) ?? null; },
        setItem(key, value) { storedValues.set(key, String(value)); },
        removeItem(key) { storedValues.delete(key); },
        clear() { storedValues.clear(); },
    };
    globalThis.window.localStorage = globalThis.localStorage;
    globalThis.Konva = {
        Stage: FakeStage,
        Layer: FakeLayer,
        Group: FakeNode,
        Rect: FakeNode,
        Text: FakeNode,
    };
    globalThis.__QUAD_DISABLE_AUTOSTART__ = true;

    const { startApp, gameModulePaths } = await import('../src/app.js');
    const app = await startApp();

    assert.equal(app.loadedModules.filter(({ error }) => error).length, 0);
    assert.equal(app.controls.modules.size, 15);
    assert.equal(elements.get('game-buttons-container').children.length, 15);
    assert.equal(gameModulePaths.length, 15);
    assert.equal(elements.get('loading-status').hidden, true);

    const snake = app.controls.modules.get('Snake');
    app.controls.selectGame(snake);
    assert.equal(elements.get('start-menu').hidden, true);
    assert.equal(elements.get('game-controls').hidden, false);
    assert.equal(elements.get('start-stop-btn').textContent, 'Старт');

    elements.get('start-stop-btn').click();
    assert.equal(snake.isRunning, true);
    assert.equal(elements.get('start-stop-btn').textContent, 'Пауза');
    elements.get('start-stop-btn').click();
    assert.equal(snake.isRunning, false);

    assert.equal(elements.get('grid-scale-control').hidden, true, 'non opt-in games hide scale controls');

    const life = app.controls.modules.get('GameOfLife');
    assert.ok(life, 'Game of Life is registered');
    app.controls.selectGame(life);

    const toolbarBottom = elements.get('game-controls').getBoundingClientRect().bottom;
    const viewportTop = Number.parseFloat(elements.get('container').style.top);
    assert.ok(viewportTop >= toolbarBottom + 12, 'the playable viewport starts below the toolbar');
    assert.equal(app.gridManager.stage.height(), elements.get('container').clientHeight);
    assert.equal(app.gridManager.stage.y(), 0, 'safe-area must not shift game coordinates');
    assert.equal(elements.get('grid-scale-control').hidden, false, 'opt-in games show scale controls');

    const scaleInput = [...elements.values()].find((element) => (
        element.id.includes('scale')
        && (element.listeners.has('input') || element.listeners.has('change'))
        && !element.listeners.has('click')
    ));
    assert.ok(scaleInput, 'scale range input is wired');

    life.toggleCell(2, 2);
    const selectedBeforeScale = app.gridManager.selectedTiles['2,2'];
    const handlersBeforeScale = app.gridManager.stage.handlers.size;
    const drawsBeforeScale = app.gridManager.layer.drawCount;

    scaleInput.value = '1000';
    scaleInput.dispatch('input');
    scaleInput.dispatch('change');
    assert.equal(app.gridManager.tileSize, life.gridScale.max,
        'Game of Life scale is clamped to its maximum');
    assert.ok(life.gridScale.max >= 24 && life.gridScale.max <= 32,
        'Game of Life keeps a practical upper scale limit');

    scaleInput.value = '1';
    scaleInput.dispatch('input');
    scaleInput.dispatch('change');
    assert.equal(app.gridManager.tileSize, life.gridScale.min,
        'Game of Life scale is clamped to its minimum');
    assert.ok(life.gridScale.min >= 6 && life.gridScale.min <= 8,
        'Game of Life keeps a practical lower scale limit');

    scaleInput.value = '32';
    scaleInput.dispatch('input');
    scaleInput.dispatch('change');
    assert.equal(app.gridManager.tileSize, 32);
    assert.ok(app.gridManager.layer.drawCount > drawsBeforeScale, 'scale change redraws the scene');
    assert.equal(app.gridManager.selectedTiles['2,2'], selectedBeforeScale, 'scale keeps game state');
    assert.equal(app.gridManager.stage.handlers.size, handlersBeforeScale, 'scale does not duplicate bindings');

    app.controls.selectGame(snake);
    assert.notEqual(app.gridManager.tileSize, 32, 'scale does not leak into another game');
    app.controls.selectGame(life);
    assert.equal(app.gridManager.tileSize, 32, 'per-game scale is restored');

    elements.get('back-to-menu-btn').click();
    assert.equal(app.controls.currentModule, null);
    assert.equal(elements.get('start-menu').hidden, false);
    assert.equal(Number.parseFloat(elements.get('container').style.top) || 0, 0);
    assert.equal(app.gridManager.stage.height(), elements.get('container').clientHeight);
    assert.equal(app.gridManager.stage.handlers.size, 0);
    app.gridManager.destroy();

    delete globalThis.__QUAD_DISABLE_AUTOSTART__;
});
