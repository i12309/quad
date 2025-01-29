// Файл: ./src/Controls.js
export class Controls {
    constructor(gridManager) {
        this.gridManager = gridManager;
        this.modules = {}; // Хранит зарегистрированные модули
        this.currentModule = null; // Текущий выбранный модуль
        this.isRunning = false; // Флаг, указывающий, запущена ли симуляция
        this.setupStartMenu();
    }

    registerModule(module) {
        this.modules[module.name] = module;
        this.updateStartMenu(); // Обновляем меню при регистрации нового модуля
    }

    setupStartMenu() {
        const startMenuContainer = document.getElementById('game-buttons-container');
        startMenuContainer.innerHTML = ''; // Очищаем контейнер

        for (const name in this.modules) {
            const module = this.modules[name];
            const button = document.createElement('button');
            button.className = 'game-button';
            button.innerHTML = `
                <div class="game-icon">${this.getGameIcon(name)}</div>
                <div class="game-info">
                    <h3>${name}</h3>
                    <p>${this.getGameDescription(name)}</p>
                </div>
            `;
            button.addEventListener('click', () => this.selectGame(module));
            startMenuContainer.appendChild(button);
        }
    }

    updateStartMenu() {
        this.setupStartMenu(); // Пересоздаём меню
    }

    selectGame(module) {
        this.currentModule = module;

        // Инициализируем новую игру
        this.currentModule.setup();

        // Скрываем стартовое меню и показываем кнопки управления
        document.getElementById('start-menu').style.display = 'none';
        document.getElementById('game-controls').style.display = 'block';

        // Настройка кнопок управления
        this.setupGameControls();
    }

    setupGameControls() {
        const startStopButton = document.getElementById('start-stop-btn');
        const clearButton = document.getElementById('clear-btn');
        const backToMenuButton = document.getElementById('back-to-menu-btn');

        startStopButton.addEventListener('click', () => {
            if (this.isRunning) {
                this.currentModule.pause();
                startStopButton.textContent = 'Старт';
            } else {
                this.currentModule.start();
                startStopButton.textContent = 'Стоп';
            }
            this.isRunning = !this.isRunning;
        });

        clearButton.addEventListener('click', () => {
            this.currentModule.pause();
            this.currentModule.clear();
            startStopButton.textContent = 'Старт';
            this.isRunning = false;
        });

        backToMenuButton.addEventListener('click', () => this.backToMainMenu());
    }

    backToMainMenu() {
        if (this.currentModule) {
            this.currentModule.pause(); // Останавливаем игру
            this.currentModule.clear(); // Очищаем игровое поле
            this.currentModule.gridManager.selectedTiles = {};
            this.currentModule.gridManager.updateVisibleTiles();
        }

        // Скрываем кнопки управления и показываем главное меню
        document.getElementById('game-controls').style.display = 'none';
        document.getElementById('start-menu').style.display = 'block';

        // Сбрасываем текущий модуль
        this.currentModule = null;
        this.isRunning = false;
    }

    getGameIcon(name) {
        // Возвращаем иконку для игры (можно заменить на реальные иконки)
        switch (name) {
            case 'GameOfLife':
                return '🎮';
            case 'PingPong':
                return '🏓';
            default:
                return '❓';
        }
    }

    getGameDescription(name) {
        // Возвращаем описание для игры
        switch (name) {
            case 'GameOfLife':
                return 'Классическая игра "Жизнь". Наблюдайте за эволюцией клеток.';
            case 'PingPong':
                return 'Игра в пинг-понг. Управляйте платформой и ловите мяч.';
            default:
                return 'Описание недоступно.';
        }
    }
}