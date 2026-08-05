import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakeGrid, installDomStubs } from './helpers.js';
import { Tetris } from '../game/Tetris.js';
import { Galaga } from '../game/Galaga.js';
import { PipeMania } from '../game/PipeMania.js';
import { pole as LivingField } from '../game/pole.js';

installDomStubs();

const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    L: [[1, 0], [1, 0], [1, 1]],
    J: [[0, 1], [0, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
};

test('Tetris piece type always matches its shape and spawns centered', () => {
    const game = new Tetris(createFakeGrid());
    game.setup();

    for (let i = 0; i < 200; i++) {
        const piece = game.createRandomPiece();
        assert.deepEqual(piece.shape, SHAPES[piece.type]);
        game.nextPiece = piece;
        game.spawnNextPiece();
        assert.equal(
            game.currentPiece.x,
            Math.floor((game.fieldWidth - game.currentPiece.shape[0].length) / 2)
        );
    }
});

test('Tetris clears a full line and awards points', () => {
    const game = new Tetris(createFakeGrid());
    game.setup();
    game.board[game.fieldHeight - 1].fill('#fff');
    game.clearLines();
    assert.equal(game.lines, 1);
    assert.equal(game.score, 100);
    assert.ok(game.board[0].every((cell) => cell === null));
});

test('Galaga safely handles an empty wave and really increases level speed', () => {
    const game = new Galaga(createFakeGrid());
    game.setup();
    game.enemies = [];
    assert.doesNotThrow(() => game.checkEnemyFire());
    const previousSpeed = game.speed;
    game.checkWaveCompletion();
    assert.equal(game.level, 2);
    assert.ok(game.speed < previousSpeed);
    assert.ok(game.enemies.length > 0);
});

test('Galaga removes a hit enemy without skipping collision bookkeeping', () => {
    const game = new Galaga(createFakeGrid());
    game.setup();
    game.enemies = [{ x: 4, y: 5 }];
    game.bullets = [{ x: 4, y: 5 }];
    game.checkCollisions();
    assert.equal(game.enemies.length, 0);
    assert.equal(game.bullets.length, 0);
    assert.equal(game.score, 100);
});

test('Every generated PipeMania board stores a valid S-to-E solution', () => {
    const game = new PipeMania(createFakeGrid());
    game.setup();

    for (let attempt = 0; attempt < 80; attempt++) {
        game.resetState();
        assert.equal(game.findReachable().has(`${game.endPos.x},${game.endPos.y}`), false);

        for (const position of game.solutionPath) {
            const pipe = game.pipes[position.y][position.x];
            pipe.connectors = [...pipe.solution];
        }
        assert.equal(game.findReachable().has(`${game.endPos.x},${game.endPos.y}`), true);
    }
});

test('Living Field keeps every animated cell inside its centered bounds', () => {
    const game = new LivingField(createFakeGrid());
    game.setup();

    const cells = Object.entries(game.gridManager.selectedTiles)
        .filter(([, descriptor]) => descriptor.type === 'cell');
    assert.equal(cells.length, game.fieldWidth * game.fieldHeight);
    for (const [key] of cells) {
        const [x, y] = key.split(',').map(Number);
        assert.ok(x >= game.offsetX && x < game.offsetX + game.fieldWidth);
        assert.ok(y >= game.offsetY && y < game.offsetY + game.fieldHeight);
    }
});
