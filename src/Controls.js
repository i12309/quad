// Файл: ./src/Controls.js
export class Controls {
    constructor() {
        this.modules = {}; // Хранит зарегистрированные модули
        this.currentModule = null; // Текущий выбранный модуль
        this.isRunning = false; // Флаг, указывающий, запущена ли симуляция
        this.setupControls();
    }

    registerModule(module) {
        this.modules[module.name] = module;
        this.updateGameSelector();
    }

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
            console.log(this.currentModule);
            this.currentModule.setup(); // Вызываем setup
        }
    }

    setupControls() {
        const startStopButton = document.getElementById('start-stop-btn');
        const clearButton = document.getElementById('clear-btn');
        const gameSelector = document.getElementById('game-selector');

        // Обработчик кнопки "Старт/Стоп"
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

        // Обработчик кнопки "Очистить"
        clearButton.addEventListener('click', () => {
            this.currentModule.pause();
            this.currentModule.clear();
            startStopButton.textContent = 'Старт';
            this.isRunning = false;
        });

        // Обработчик изменения выбора в ниспадающем списке
        gameSelector.addEventListener('change', (event) => {
            this.currentModule.clear();
            this.currentModule = this.modules[event.target.value]; // Обновляем текущий модуль
            this.currentModule.setup(); // Вызываем setup для нового модуля
        });
    }
}