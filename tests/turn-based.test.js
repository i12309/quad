import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakeGrid, installDomStubs } from './helpers.js';
import { Minesweeper } from '../game/Minesweeper.js';
import { SlidingPuzzle } from '../game/SlidingPuzzle.js';
import { TicTacToe } from '../game/TicTacToe.js';

installDomStubs();

test('Minesweeper protects the first cell and all of its neighbors', () => {
    const game = new Minesweeper(createFakeGrid());
    game.setup();
    game.toggleCell(5, 5);

    for (let y = 4; y <= 6; y++) {
        for (let x = 4; x <= 6; x++) assert.equal(game.board[y][x].mine, false);
    }
});

test('Minesweeper flag can be placed and removed', () => {
    const game = new Minesweeper(createFakeGrid());
    game.setup();
    game.handleRightClick(0, 0);
    assert.equal(game.board[0][0].state, 'flagged');
    assert.equal(game.flagsCount, 1);
    game.handleRightClick(0, 0);
    assert.equal(game.board[0][0].state, 'hidden');
    assert.equal(game.flagsCount, 0);
});

test('Sliding Puzzle starts solvable but not already solved', () => {
    const game = new SlidingPuzzle(createFakeGrid());
    for (let i = 0; i < 25; i++) {
        game.reset();
        assert.equal(game.checkWin(), false);
    }

    const validMove = game.getValidMoves()[0];
    const before = game.board.flat().join(',');
    assert.equal(game.moveTile(-1, -1), false);
    assert.equal(game.board.flat().join(','), before);
    assert.equal(game.moveTile(validMove.x, validMove.y), true);
});

test('TicTacToe preserves and highlights the winning line', () => {
    const game = new TicTacToe(createFakeGrid());
    game.setup();
    game.toggleCell(0, 0); // X
    game.toggleCell(0, 1); // O
    game.toggleCell(1, 0); // X
    game.toggleCell(1, 1); // O
    game.toggleCell(2, 0); // X

    assert.equal(game.gameOver, true);
    assert.equal(game.board[0].join(''), 'XXX');
    assert.equal(game.winningCells.length, 3);
    assert.equal(game.isRunning, false);
});
