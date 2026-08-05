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
    destroyChildren() { this.children = []; }
    batchDraw() {}
}

test('the application loader registers all games and can open/close one', async () => {
    const ids = [
        'game-buttons-container', 'loading-status', 'start-menu', 'game-controls',
        'game-title', 'game-icon', 'game-description', 'start-stop-btn',
        'clear-btn', 'back-to-menu-btn', 'game-status', 'container',
    ];
    const elements = new Map(ids.map((id) => [id, new FakeElement('div', id)]));
    elements.get('game-controls').hidden = true;

    globalThis.document = {
        getElementById(id) { return elements.get(id) ?? null; },
        createElement(tagName) { return new FakeElement(tagName); },
    };
    globalThis.window = {
        innerWidth: 960,
        innerHeight: 640,
        addEventListener() {},
        removeEventListener() {},
    };
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

    elements.get('back-to-menu-btn').click();
    assert.equal(app.controls.currentModule, null);
    assert.equal(elements.get('start-menu').hidden, false);
    assert.equal(app.gridManager.stage.handlers.size, 0);
    app.gridManager.destroy();

    delete globalThis.__QUAD_DISABLE_AUTOSTART__;
});
