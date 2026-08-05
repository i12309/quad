import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakeGrid, installDomStubs } from './helpers.js';
import { Snake } from '../game/Snake.js';
import { GameOfLife } from '../game/GameOfLife.js';
import { PingPong } from '../game/PingPong.js';
import { Arkanoid } from '../game/Arkanoid.js';

installDomStubs();

test('Snake renders an initial state and permits moving into the released tail', () => {
    const game = new Snake(createFakeGrid());
    game.setup();

    assert.equal(Object.values(game.gridManager.selectedTiles).filter((tile) => tile.type === 'snake').length, 3);
    assert.equal(Object.values(game.gridManager.selectedTiles).filter((tile) => tile.type === 'food').length, 1);

    game.fieldWidth = 4;
    game.fieldHeight = 4;
    game.offsetX = 0;
    game.offsetY = 0;
    game.snake = [
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 0, y: 2 },
        { x: 0, y: 1 },
    ];
    game.food = { x: 3, y: 3 };
    game.direction = 'left';
    game.queuedDirection = 'left';
    game.isRunning = true;
    game.update();

    assert.deepEqual(game.snake[0], { x: 0, y: 1 });
    assert.equal(game.gameOver, false);
});

test('Snake queues only a legal turn between ticks', () => {
    const game = new Snake(createFakeGrid());
    game.setup();
    game.isRunning = true;
    const keydown = document.listeners.get('keydown');
    const event = (key) => ({ key, preventDefault() {} });

    keydown(event('ArrowUp'));
    keydown(event('ArrowLeft'));

    assert.equal(game.queuedDirection, 'up');
});

test('Game of Life keeps a block stable and oscillates a blinker', () => {
    const game = new GameOfLife(createFakeGrid());
    game.gridManager.selectedTiles = {
        '1,1': { type: 'pixel', age: 1 },
        '2,1': { type: 'pixel', age: 1 },
        '1,2': { type: 'pixel', age: 1 },
        '2,2': { type: 'pixel', age: 1 },
    };
    game.isRunning = true;
    game.update();
    assert.deepEqual(Object.keys(game.gridManager.selectedTiles).sort(), ['1,1', '1,2', '2,1', '2,2']);

    game.gridManager.selectedTiles = {
        '2,1': { type: 'pixel', age: 1 },
        '2,2': { type: 'pixel', age: 1 },
        '2,3': { type: 'pixel', age: 1 },
    };
    game.update();
    assert.deepEqual(Object.keys(game.gridManager.selectedTiles).sort(), ['1,2', '2,2', '3,2']);
    game.update();
    assert.deepEqual(Object.keys(game.gridManager.selectedTiles).sort(), ['2,1', '2,2', '2,3']);
});

test('PingPong detects a fast paddle crossing and a miss', () => {
    const hit = new PingPong(createFakeGrid());
    hit.setup();
    const paddleY = hit.fieldHeight - 5;
    hit.platform = { x: 2, width: 6 };
    hit.ball = { x: 4, y: paddleY - 2, dx: 1, dy: 4 };
    hit.isRunning = true;
    hit.update();
    assert.equal(hit.score, 1);
    assert.ok(hit.ball.dy < 0);

    const miss = new PingPong(createFakeGrid());
    miss.setup();
    miss.platform = { x: 0, width: 2 };
    miss.ball = { x: 5, y: miss.fieldHeight - 7, dx: 0, dy: 4 };
    miss.isRunning = true;
    miss.update();
    assert.equal(miss.gameOver, true);
    assert.equal(miss.isRunning, false);
});

test('Arkanoid removes every pixel of a hit block', () => {
    const game = new Arkanoid(createFakeGrid());
    game.setup();
    const target = { ...game.blocks[0] };
    const before = game.blocks.length;
    game.ball = { x: target.x, y: target.y + 1, dx: 0, dy: -1 };
    game.isRunning = true;
    game.update();

    assert.equal(game.blocks.length, before - 1);
    for (let x = 0; x < target.width; x++) {
        assert.notEqual(
            game.gridManager.selectedTiles[`${game.offsetX + target.x + x},${game.offsetY + target.y}`]?.type,
            'block'
        );
    }
});
