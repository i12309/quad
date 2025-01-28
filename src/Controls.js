// Файл: ./src/Controls.js 
export class Controls {
    constructor() {
        this.modules = {}; // Хранит зарегистрированные модули
        this.currentModule = null; // Текущий выбранный модуль
        this.isRunning = false; // Флаг, указывающий, запущена ли симуляция
        this.setupControls();
    }

    // Регистрация модуля
    registerModule(module) {
        this.modules[module.name] = module;
        this.updateGameSelector();
    }

    // Обновление ниспадающего списка
    updateGameSelector() {
        const gameSelector = document.getElementById('game-selector');
        gameSelector.innerHTML = ''; // Очищаем список

        for (const name in this.modules) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            gameSelector.appendChild(option);
        }

        // Выбираем первый модуль по умолчанию
        if (Object.keys(this.modules).length > 0) {
            this.currentModule = this.modules[Object.keys(this.modules)[0]];
        }
    }

    setupControls() {
        const startStopButton = document.getElementById('start-stop-btn');
        const clearButton = document.getElementById('clear-btn');
        const gameSelector = document.getElementById('game-selector');

        // Обработчик кнопки "Старт/Стоп"
        startStopButton.addEventListener('click', () => {
            if (this.isRunning) {
                this.currentModule.pause(); // Останавливаем текущий модуль
                startStopButton.textContent = 'Старт';
            } else {
                this.currentModule.start(); // Запускаем текущий модуль
                startStopButton.textContent = 'Стоп';
            }
            this.isRunning = !this.isRunning;
        });

        // Обработчик кнопки "Очистить"
        clearButton.addEventListener('click', () => {
            this.currentModule.pause(); // Останавливаем текущий модуль
            this.currentModule.clear(); // Очищаем поле
            startStopButton.textContent = 'Старт';
            this.isRunning = !this.isRunning;
        });

        // Обработчик изменения выбора в ниспадающем списке
        gameSelector.addEventListener('change', (event) => {
            this.currentModule = this.modules[event.target.value]; // Обновляем текущий модуль
        });
    }
}