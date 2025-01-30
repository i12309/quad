// Файл: ./game/TicTacToe.js
import { BaseModule } from './BaseModule.js';

export class TicTacToe extends BaseModule {
    constructor(gridManager) {
        super();
        this.gameIcon = '❌⭕';
        this.gameDescription = 'Крестики-нолики. Соберите три в ряд!';
        this.name = 'TicTacToe';
        this.gridManager = gridManager;
        this.isRunning = false;
        this.fieldWidth = 3;
        this.fieldHeight = 3;
        this.board = Array(3).fill().map(() => Array(3).fill(null));
        this.currentPlayer = 'X';
        this.offsetX = 0;
        this.offsetY = 0;
    }

    setup() {
        this.clear();
        this.drawBorder();
    }

    drawBorder() {
        const visibleWidth = Math.ceil(this.gridManager.stage.width() / this.gridManager.totalSize);
        const visibleHeight = Math.ceil(this.gridManager.stage.height() / this.gridManager.totalSize);
        this.offsetX = Math.floor((visibleWidth - this.fieldWidth) / 2);
        this.offsetY = Math.floor((visibleHeight - this.fieldHeight) / 2);

        for (let y = 0; y < this.fieldHeight; y++) {
            for (let x = 0; x < this.fieldWidth; x++) {
                const key = `${this.offsetX + x},${this.offsetY + y}`;
                this.gridManager.selectedTiles[key] = {
                    type: 'cell',
                    text: this.board[y][x] || '',
                    color: '#FFFFFF'
                };
            }
        }
        this.gridManager.updateVisibleTiles();
    }

    handleLeftClick(x, y) {
        if (this.board[y][x] === null) {
            this.board[y][x] = this.currentPlayer;
            this.drawBorder();
            if (this.checkWin(this.currentPlayer)) {
                alert(`Победил ${this.currentPlayer}!`);
                this.clear();
            } else if (this.board.flat().every(cell => cell !== null)) {
                alert('Ничья!');
                this.clear();
            } else {
                this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            }
        }
    }

    checkWin(player) {
        // Проверка строк и столбцов
        for (let i = 0; i < 3; i++) {
            if (this.board[i][0] === player && this.board[i][1] === player && this.board[i][2] === player) return true;
            if (this.board[0][i] === player && this.board[1][i] === player && this.board[2][i] === player) return true;
        }
        // Проверка диагоналей
        if (this.board[0][0] === player && this.board[1][1] === player && this.board[2][2] === player) return true;
        if (this.board[0][2] === player && this.board[1][1] === player && this.board[2][0] === player) return true;
        return false;
    }
}