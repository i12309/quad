// Файл: ./src/Controls.js
export class Controls {
    constructor(gridManager) {
        this.gridManager = gridManager;
        this.modules = {}; // Хранит зарегистрированные модули
        this.currentModule = null; // Текущий выбранный модуль
        this.isRunning = false; // Флаг, указывающий, запущена ли симуляция
        this.setupMenu();
        this.setupButtons();
    }

    registerModule(module) {
        this.modules[module.name] = module;
        this.setupMenu(); // Пересоздаём меню
    }

    setupMenu() {
        const startMenuContainer = document.getElementById('game-buttons-container');
        startMenuContainer.innerHTML = ''; // Очищаем контейнер

        for (const name in this.modules) {
            const module = this.modules[name];
            const button = document.createElement('button');
            button.className = 'game-button';
            button.innerHTML = `
                <div class="game-icon">${module.gameIcon}</div>
                <div class="game-info">
                    <h3>${name}</h3>
                    <p>${module.gameDescription}</p>
                </div>
            `;
            button.addEventListener('click', () => this.selectGame(module));
            startMenuContainer.appendChild(button);
        }
    }

    selectGame(module) {
        this.currentModule = module;

        // Инициализируем новую игру
        this.currentModule.setup();

        // Скрываем стартовое меню и показываем кнопки управления
        document.getElementById('start-menu').style.display = 'none';
        document.getElementById('game-controls').style.display = 'block';
    }

    setupButtons() {
        // Настройка кнопок управления
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

        backToMenuButton.addEventListener('click', () => {
            if (this.currentModule) {
                this.currentModule.pause(); // Останавливаем игру
                this.currentModule.clear(); // Очищаем игровое поле
                this.currentModule.gridManager.selectedTiles = {};
                this.currentModule.gridManager.updateVisibleTiles();
            }
            startStopButton.textContent = 'Старт';
    
            // Скрываем кнопки управления и показываем главное меню
            document.getElementById('game-controls').style.display = 'none';
            document.getElementById('start-menu').style.display = 'block';
    
            // Сбрасываем текущий модуль
            this.currentModule = null;
            this.isRunning = false;
            this.gridManager.setup();
            window.location.reload();
        });
    }
}