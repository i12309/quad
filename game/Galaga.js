// Файл: ./game/Galaga.js
import { BaseModule } from './BaseModule.js';

export class Galaga extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '🚀';
        this.gameDescription = 'Классическая аркадная игра. Уничтожайте вражеские корабли и выживайте!';
        this.name = 'Galaga';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.interval = null;
        this.speed = 100; // Скорость обновления игры
        this.score = 0;
        this.level = 1;
        this.player = { x: 0, y: 0, width: 3, alive: true };
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.wavePatterns = [
            // Паттерны движения врагов (x смещение, y смещение, кол-во шагов)
            [1, 0, 30], [-1, 0, 30], [0, 1, 10]
        ];
    }

    setup() {
        this.clear();
        this.spawnPlayer();
        this.spawnEnemyWave();
        this.bindMouseEvents();
        this.bindKeyboardEvents();
        this.gridManager.updateVisibleTiles();
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.interval = setInterval(() => this.update(), this.speed);
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.interval);
        }
    }

    clear() {
        this.pause();
        this.score = 0;
        this.level = 1;
        this.player.alive = true;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.gridManager.selectedTiles = {};
    }

    update() {
        if (!this.player.alive) return;

        this.moveEnemies();
        this.moveBullets();
        this.moveEnemyBullets();
        this.checkCollisions();
        this.checkEnemyFire();
        this.checkWaveCompletion();
        this.updateGrid();
    }

    spawnPlayer() {
        const stageWidth = Math.floor(this.gridManager.stage.width() / this.gridManager.totalSize);
        this.player.x = Math.floor(stageWidth / 2);
        this.player.y = Math.floor(this.gridManager.stage.height() / this.gridManager.totalSize) - 5;
    }

    spawnEnemyWave() {
        const cols = 8;
        const startX = this.player.x - Math.floor(cols / 2) * 4;
        for (let i = 0; i < cols; i++) {
            this.enemies.push({
                x: startX + i * 4,
                y: 5,
                patternStep: 0,
                health: 1
            });
        }
    }

    moveEnemies() {
        this.enemies.forEach(enemy => {
            const pattern = this.wavePatterns[enemy.patternStep % this.wavePatterns.length];
            enemy.x += pattern[0];
            enemy.y += pattern[1];
            if (++enemy.patternStep >= pattern[2]) enemy.patternStep = 0;
        });
    }

    moveBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= 1;
            return bullet.y > 0;
        });
    }

    moveEnemyBullets() {
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.y += 1;
            return bullet.y < this.gridManager.stage.height() / this.gridManager.totalSize;
        });
    }

    checkCollisions() {
        // Проверка попаданий игрока во врагов
        this.bullets.forEach((bullet, idx) => {
            this.enemies.forEach((enemy, eIdx) => {
                if (Math.abs(bullet.x - enemy.x) < 2 && Math.abs(bullet.y - enemy.y) < 2) {
                    this.score += 100;
                    this.enemies.splice(eIdx, 1);
                    this.bullets.splice(idx, 1);
                }
            });
        });

        // Проверка попаданий вражеских пуль в игрока
        this.enemyBullets.forEach(bullet => {
            if (Math.abs(bullet.x - this.player.x) < this.player.width && 
                Math.abs(bullet.y - this.player.y) < 1) {
                this.player.alive = false;
                this.pause();
                alert(`Игра окончена! Счёт: ${this.score}`);
            }
        });
    }

    checkEnemyFire() {
        if (Math.random() < 0.02) {
            const shooter = this.enemies[Math.floor(Math.random() * this.enemies.length)];
            this.enemyBullets.push({ x: shooter.x, y: shooter.y + 1 });
        }
    }

    checkWaveCompletion() {
        if (this.enemies.length === 0) {
            this.level++;
            this.speed = Math.max(50, this.speed - 10);
            this.spawnEnemyWave();
        }
    }

    updateGrid() {
        this.gridManager.selectedTiles = {};

        // Отрисовка игрока
        for (let i = -1; i <= 1; i++) {
            const key = `${this.player.x + i},${this.player.y}`;
            this.gridManager.selectedTiles[key] = { type: 'player', color: '#00FF00' };
        }

        // Отрисовка врагов
        this.enemies.forEach(enemy => {
            const key = `${enemy.x},${enemy.y}`;
            this.gridManager.selectedTiles[key] = { type: 'enemy', color: '#FF0000' };
        });

        // Отрисовка пуль
        this.bullets.forEach(bullet => {
            const key = `${bullet.x},${bullet.y}`;
            this.gridManager.selectedTiles[key] = { type: 'bullet', color: '#FFFF00' };
        });

        this.enemyBullets.forEach(bullet => {
            const key = `${bullet.x},${bullet.y}`;
            this.gridManager.selectedTiles[key] = { type: 'enemyBullet', color: '#FF4500' };
        });

        this.gridManager.updateVisibleTiles();
    }

    bindMouseEvents() {
        this.gridManager.stage.on('mousemove', (event) => {
            const pos = this.gridManager.stage.getPointerPosition();
            if (!pos || !this.player.alive) return;
            this.player.x = Math.floor(pos.x / this.gridManager.totalSize);
        });
    }

    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.player.alive) {
                this.bullets.push({ x: this.player.x, y: this.player.y - 1 });
            }
        });
    }

    handleLeftClick(x, y) {}
    handleRightClick(x, y) {}
    toggleCell(x, y) {}
    showContextMenu(x, y) {}
}