// Файл: ./game/Galaga.js
import { BaseModule } from './BaseModule.js';

export class Galaga extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '🚀';
        this.gameDescription = 'Уничтожайте вражескую эскадрилью и не дайте ей добраться до вас.';
        this.name = 'Galaga';
        this.usesStartStop = true;
        this.gridManager = gridManager;

        this.isRunning = false;
        this.interval = null;
        this.baseSpeed = 100;
        this.speed = this.baseSpeed;
        this.score = 0;
        this.level = 1;
        this.player = { x: 0, y: 0, width: 3, alive: true };
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.patternIndex = 0;
        this.patternTick = 0;
        this.wavePatterns = [];
        this.fieldWidth = 0;
        this.fieldHeight = 0;
        this.lastShotAt = 0;
        this.shotCooldown = 180;
        this.gameOver = false;
    }

    setup() {
        this.pause();
        this.clearBindings();
        this.resetState();
        this.bindMouseEvents();
        this.bindKeyboardEvents();
        this.render();
        this.setStatus('Мышь — движение, пробел — огонь.');
    }

    resetState() {
        this.fieldWidth = Math.max(20, Math.floor(this.gridManager.stage.width() / this.gridManager.totalSize));
        this.fieldHeight = Math.max(20, Math.floor(this.gridManager.stage.height() / this.gridManager.totalSize));
        this.score = 0;
        this.level = 1;
        this.speed = this.baseSpeed;
        this.player.alive = true;
        this.player.x = Math.floor(this.fieldWidth / 2);
        this.player.y = this.fieldHeight - 4;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.patternIndex = 0;
        this.patternTick = 0;
        this.lastShotAt = 0;
        this.gameOver = false;
        this.spawnEnemyWave();
    }

    start() {
        if (this.isRunning) return;
        if (this.gameOver) {
            this.resetState();
            this.render();
        }
        this.setRunning(true);
        this.restartInterval();
        this.setStatus(`Уровень ${this.level}.`);
    }

    restartInterval() {
        if (this.interval !== null) clearInterval(this.interval);
        this.interval = setInterval(() => this.update(), this.speed);
    }

    pause() {
        if (this.interval !== null) clearInterval(this.interval);
        this.interval = null;
        this.setRunning(false);
    }

    clear() {
        this.pause();
        this.resetState();
        this.render();
        this.setStatus('Новая эскадрилья готова.');
    }

    update() {
        if (!this.isRunning || this.gameOver) return;

        this.moveEnemies();
        if (this.gameOver) return;
        this.moveBullets();
        this.moveEnemyBullets();
        this.checkCollisions();
        if (this.gameOver) return;
        this.checkWaveCompletion();
        this.checkEnemyFire();
        this.render();
    }

    spawnEnemyWave() {
        const cols = Math.min(8, Math.max(4, Math.floor((this.fieldWidth - 4) / 4)));
        const formationWidth = (cols - 1) * 4 + 2;
        const startX = Math.max(1, Math.floor((this.fieldWidth - formationWidth) / 2));
        const rows = this.level >= 4 ? 2 : 1;

        for (let row = 0; row < rows; row++) {
            for (let column = 0; column < cols; column++) {
                this.enemies.push({
                    x: startX + column * 4,
                    y: 4 + row * 4
                });
            }
        }

        const horizontalSteps = Math.max(1, Math.min(18, Math.floor((this.fieldWidth - formationWidth) / 2)));
        this.wavePatterns = [
            { dx: 1, dy: 0, steps: horizontalSteps },
            { dx: -1, dy: 0, steps: horizontalSteps },
            { dx: 0, dy: 1, steps: Math.min(3 + Math.floor(this.level / 3), 6) }
        ];
        this.patternIndex = 0;
        this.patternTick = 0;
    }

    moveEnemies() {
        if (this.enemies.length === 0) return;
        const pattern = this.wavePatterns[this.patternIndex];
        const wouldLeaveField = this.enemies.some(enemy =>
            enemy.x + pattern.dx < 0 || enemy.x + 1 + pattern.dx >= this.fieldWidth
        );

        if (!wouldLeaveField) {
            for (const enemy of this.enemies) {
                enemy.x += pattern.dx;
                enemy.y += pattern.dy;
            }
            this.patternTick += 1;
        } else {
            this.patternTick = pattern.steps;
        }

        if (this.patternTick >= pattern.steps) {
            this.patternTick = 0;
            this.patternIndex = (this.patternIndex + 1) % this.wavePatterns.length;
        }

        if (this.enemies.some(enemy => enemy.y + 1 >= this.player.y)) {
            this.endGame('Вражеская эскадрилья прорвалась.');
        }
    }

    moveBullets() {
        this.bullets = this.bullets
            .map(bullet => ({ ...bullet, y: bullet.y - 1 }))
            .filter(bullet => bullet.y >= 0);
    }

    moveEnemyBullets() {
        this.enemyBullets = this.enemyBullets
            .map(bullet => ({ ...bullet, y: bullet.y + 1 }))
            .filter(bullet => bullet.y < this.fieldHeight);
    }

    checkCollisions() {
        for (let bulletIndex = this.bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
            const bullet = this.bullets[bulletIndex];
            const enemyIndex = this.enemies.findIndex(enemy =>
                bullet.x >= enemy.x && bullet.x <= enemy.x + 1 &&
                bullet.y >= enemy.y && bullet.y <= enemy.y + 1
            );
            if (enemyIndex === -1) continue;
            this.enemies.splice(enemyIndex, 1);
            this.bullets.splice(bulletIndex, 1);
            this.score += 100;
        }

        const playerWasHit = this.enemyBullets.some(bullet =>
            bullet.y === this.player.y && Math.abs(bullet.x - this.player.x) <= 1
        );
        if (playerWasHit) this.endGame('Корабль подбит.');
    }

    checkEnemyFire() {
        if (this.enemies.length === 0 || Math.random() >= Math.min(0.012 + this.level * 0.002, 0.04)) return;
        const shooter = this.enemies[Math.floor(Math.random() * this.enemies.length)];
        this.enemyBullets.push({ x: shooter.x + 1, y: shooter.y + 2 });
    }

    checkWaveCompletion() {
        if (this.enemies.length !== 0) return;
        this.level += 1;
        this.speed = Math.max(45, this.baseSpeed - (this.level - 1) * 8);
        this.enemyBullets = [];
        this.spawnEnemyWave();
        if (this.isRunning) this.restartInterval();
        this.setStatus(`Уровень ${this.level}. Скорость выше!`, 'result');
    }

    shoot() {
        if (!this.isRunning || this.gameOver || !this.player.alive) return;
        const now = performance.now();
        if (now - this.lastShotAt < this.shotCooldown) return;
        this.lastShotAt = now;
        this.bullets.push({ x: this.player.x, y: this.player.y - 1 });
    }

    endGame(reason) {
        if (this.gameOver) return;
        this.gameOver = true;
        this.player.alive = false;
        this.pause();
        this.render();
        this.finish(`${reason} Счёт: ${this.score}. Уровень: ${this.level}.`);
    }

    render() {
        const tiles = {};
        tiles['1,1'] = {
            type: 'text',
            text: `Счёт: ${this.score}   Уровень: ${this.level}`,
            color: '#FFFFFF'
        };

        if (this.player.alive) {
            for (let dx = -1; dx <= 1; dx++) {
                tiles[`${this.player.x + dx},${this.player.y}`] = { type: 'player', color: '#39D353' };
            }
            tiles[`${this.player.x},${this.player.y - 1}`] = { type: 'player', color: '#62E37B' };
        }

        for (const enemy of this.enemies) {
            for (let dx = 0; dx < 2; dx++) {
                for (let dy = 0; dy < 2; dy++) {
                    tiles[`${enemy.x + dx},${enemy.y + dy}`] = { type: 'enemy', color: '#FF5D73' };
                }
            }
        }
        for (const bullet of this.bullets) {
            tiles[`${bullet.x},${bullet.y}`] = { type: 'bullet', color: '#FFD93D' };
        }
        for (const bullet of this.enemyBullets) {
            tiles[`${bullet.x},${bullet.y}`] = { type: 'enemyBullet', color: '#FF8C42' };
        }

        this.gridManager.selectedTiles = tiles;
        this.gridManager.updateVisibleTiles();
    }

    bindMouseEvents() {
        const handler = () => {
            if (!this.isRunning || this.gameOver || !this.player.alive) return;
            const position = this.gridManager.stage.getPointerPosition();
            if (!position) return;
            const x = Math.floor((position.x - this.gridManager.stage.x()) / this.gridManager.totalSize);
            this.player.x = Math.max(1, Math.min(this.fieldWidth - 2, x));
        };
        this.bindStageEvent('mousemove', handler);
    }

    bindKeyboardEvents() {
        this.bindDom(document, 'keydown', event => {
            if (event.code !== 'Space') return;
            event.preventDefault();
            if (!event.repeat) this.shoot();
        });
    }

    bindStageEvent(eventName, handler) {
        if (this.bindStage.length >= 3) {
            this.bindStage(this.gridManager.stage, eventName, handler);
        } else {
            this.bindStage(eventName, handler);
        }
    }

    onResize() {
        this.fieldWidth = Math.max(20, Math.floor(this.gridManager.stage.width() / this.gridManager.totalSize));
        this.fieldHeight = Math.max(20, Math.floor(this.gridManager.stage.height() / this.gridManager.totalSize));
        this.player.x = Math.max(1, Math.min(this.fieldWidth - 2, this.player.x));
        this.player.y = this.fieldHeight - 4;
        this.render();
    }

    destroy() {
        this.pause();
        super.destroy();
    }

    handleLeftClick() {}
    handleRightClick() {}
    toggleCell() {}
    showContextMenu() {}
}
