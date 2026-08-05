import test from 'node:test';
import assert from 'node:assert/strict';

class FakeNode {
    constructor(config = {}) {
        this.config = config;
        this.children = [];
    }

    add(child) {
        this.children.push(child);
    }
}

class FakeStage extends FakeNode {
    constructor(config) {
        super(config);
        this._width = config.width;
        this._height = config.height;
        this._x = 0;
        this._y = 0;
    }

    width(value) { if (value === undefined) return this._width; this._width = value; }
    height(value) { if (value === undefined) return this._height; this._height = value; }
    x(value) { if (value === undefined) return this._x; this._x = value; }
    y(value) { if (value === undefined) return this._y; this._y = value; }
    destroy() {}
}

class FakeLayer extends FakeNode {
    destroyChildren() { this.children = []; }
    batchDraw() {}
}

globalThis.window = {
    innerWidth: 320,
    innerHeight: 240,
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

const { GridManager } = await import('../src/GridManager.js');

test('GridManager renders text inside a normal grid cell', () => {
    const manager = new GridManager(null);
    manager.selectedTiles['2,3'] = {
        type: 'tile',
        color: '#00ff00',
        text: '15',
        textColor: '#001100',
    };

    manager.updateVisibleTiles();

    assert.equal(manager.layer.children.length, 1);
    const group = manager.layer.children[0];
    assert.equal(group.config.x, 2 * manager.totalSize);
    assert.equal(group.config.y, 3 * manager.totalSize);
    assert.equal(group.children.length, 2);
    assert.equal(group.children[1].config.text, '15');
    assert.equal(group.children[1].config.fill, '#001100');
});

test('GridManager accepts HUD descriptors with explicit coordinates', () => {
    const manager = new GridManager(null);
    manager.selectedTiles.score = {
        type: 'text',
        x: 1,
        y: 2,
        text: 'Score: 40',
        color: '#ffffff',
    };

    manager.updateVisibleTiles();

    assert.equal(manager.layer.children.length, 1);
    const text = manager.layer.children[0];
    assert.equal(text.config.x, manager.totalSize);
    assert.equal(text.config.y, 2 * manager.totalSize);
    assert.equal(text.config.text, 'Score: 40');
});
