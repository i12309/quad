import { GridManager } from './GridManager.js';
import { Controls } from './Controls.js';

export const gameModules = [
    { path: '../game/Snake.js', load: () => import('../game/Snake.js') },
    { path: '../game/GameOfLife.js', load: () => import('../game/GameOfLife.js') },
    { path: '../game/PingPong.js', load: () => import('../game/PingPong.js') },
    { path: '../game/Arkanoid.js', load: () => import('../game/Arkanoid.js') },
    { path: '../game/Minesweeper.js', load: () => import('../game/Minesweeper.js') },
    { path: '../game/SlidingPuzzle.js', load: () => import('../game/SlidingPuzzle.js') },
    { path: '../game/TicTacToe.js', load: () => import('../game/TicTacToe.js') },
    { path: '../game/Tetris.js', load: () => import('../game/Tetris.js') },
    { path: '../game/Galaga.js', load: () => import('../game/Galaga.js') },
    { path: '../game/PipeMania.js', load: () => import('../game/PipeMania.js') },
    { path: '../game/RaceGame.js', load: () => import('../game/RaceGame.js') },
    { path: '../game/PhysicsSimulation.js', load: () => import('../game/PhysicsSimulation.js') },
    { path: '../game/BlockCraft2D.js', load: () => import('../game/BlockCraft2D.js') },
    { path: '../game/SimpleStrategy.js', load: () => import('../game/SimpleStrategy.js') },
    { path: '../game/pole.js', load: () => import('../game/pole.js') },
];

export const gameModulePaths = gameModules.map(({ path }) => path);

export async function startApp() {
    const controls = new Controls();
    const gridManager = new GridManager(controls);
    controls.gridManager = gridManager;

    const loadedModules = await Promise.all(gameModules.map(async ({ path: modulePath, load }) => {
        try {
            const exports = await load();
            const GameClass = exports.default ?? exports[Object.keys(exports)[0]];
            return { modulePath, instance: new GameClass(gridManager) };
        } catch (error) {
            console.error(`Не удалось загрузить ${modulePath}`, error);
            return { modulePath, error };
        }
    }));

    for (const result of loadedModules) {
        if (result.instance) controls.registerModule(result.instance);
    }

    const errors = loadedModules
        .filter((result) => result.error)
        .map((result) => result.modulePath.split('/').pop());
    controls.showLoadingErrors(errors);

    if (controls.modules.size === 0 && errors.length === 0) {
        controls.showLoadingErrors(['игровые модули']);
    }

    return { controls, gridManager, loadedModules };
}

if (typeof document !== 'undefined' && !globalThis.__QUAD_DISABLE_AUTOSTART__) {
    startApp().catch((error) => {
        console.error('QUAD не удалось запустить', error);
        const loadingStatus = document.getElementById('loading-status');
        if (loadingStatus) {
            loadingStatus.hidden = false;
            loadingStatus.dataset.tone = 'error';
            loadingStatus.textContent = `Ошибка запуска: ${error.message}`;
        }
    });
}
