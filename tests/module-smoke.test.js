import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createFakeGrid, installDomStubs } from './helpers.js';
import { Snake } from '../game/Snake.js';
import { GameOfLife } from '../game/GameOfLife.js';
import { PingPong } from '../game/PingPong.js';
import { Arkanoid } from '../game/Arkanoid.js';
import { Minesweeper } from '../game/Minesweeper.js';
import { SlidingPuzzle } from '../game/SlidingPuzzle.js';
import { TicTacToe } from '../game/TicTacToe.js';
import { Tetris } from '../game/Tetris.js';
import { Galaga } from '../game/Galaga.js';
import { PipeMania } from '../game/PipeMania.js';
import { RaceGame } from '../game/RaceGame.js';
import { PhysicsSimulation } from '../game/PhysicsSimulation.js';
import { BlockCraft2D } from '../game/BlockCraft2D.js';
import { SimpleStrategy } from '../game/SimpleStrategy.js';
import { pole as LivingField } from '../game/pole.js';
import { gameModulePaths } from '../src/app.js';

installDomStubs();

const gameClasses = [
    Snake,
    GameOfLife,
    PingPong,
    Arkanoid,
    Minesweeper,
    SlidingPuzzle,
    TicTacToe,
    Tetris,
    Galaga,
    PipeMania,
    RaceGame,
    PhysicsSimulation,
    BlockCraft2D,
    SimpleStrategy,
    LivingField,
];

test('all menu games complete setup, render, clear and destroy', () => {
    for (const GameClass of gameClasses) {
        const grid = createFakeGrid();
        const game = new GameClass(grid);
        assert.doesNotThrow(() => game.setup(), `${game.name}: setup`);
        assert.ok(grid.drawCount > 0, `${game.name}: initial render`);
        const drawsAfterSetup = grid.drawCount;
        assert.doesNotThrow(() => game.clear(), `${game.name}: clear`);
        assert.ok(grid.drawCount > drawsAfterSetup, `${game.name}: render after clear`);
        assert.doesNotThrow(() => game.destroy(), `${game.name}: destroy`);
        assert.equal(grid.stage.handlers.size, 0, `${game.name}: stage handlers cleaned`);
    }
});

test('every local module referenced by index.html exists', async () => {
    const testsDirectory = dirname(fileURLToPath(import.meta.url));
    const projectRoot = resolve(testsDirectory, '..');
    const html = await readFile(resolve(projectRoot, 'index.html'), 'utf8');
    const paths = [...html.matchAll(/['"](\.\/(?:game|src)\/[^'"]+\.js)['"]/g)]
        .map((match) => match[1]);

    assert.ok(paths.length >= 2);
    for (const path of paths) {
        await assert.doesNotReject(readFile(resolve(projectRoot, path), 'utf8'), path);
    }

    assert.equal(gameModulePaths.length, gameClasses.length);
    for (const path of gameModulePaths) {
        await assert.doesNotReject(readFile(resolve(projectRoot, 'src', path), 'utf8'), path);
    }
});
