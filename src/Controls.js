export class Controls {
    constructor() {
        this.gridManager = null;
        this.modules = new Map();
        this.currentModule = null;
        this.setupButtons();
    }

    registerModule(module) {
        this.modules.set(module.name, module);
        this.renderMenu();
    }

    renderMenu() {
        const container = document.getElementById('game-buttons-container');
        if (!container) return;
        container.innerHTML = '';

        for (const module of this.modules.values()) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'game-button';
            button.dataset.game = module.name;

            const icon = document.createElement('span');
            icon.className = 'game-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = module.gameIcon || '🎮';

            const info = document.createElement('span');
            info.className = 'game-info';

            const title = document.createElement('strong');
            title.textContent = module.name;

            const description = document.createElement('span');
            description.textContent = module.gameDescription || '';

            info.append(title, description);
            button.append(icon, info);
            button.addEventListener('click', () => this.selectGame(module));
            container.appendChild(button);
        }

        const loadingStatus = document.getElementById('loading-status');
        if (loadingStatus && this.modules.size > 0) loadingStatus.hidden = true;
    }

    selectGame(module) {
        if (this.currentModule && this.currentModule !== module) {
            this.currentModule.destroy?.();
        }

        this.currentModule = module;
        this.gridManager.resetView();
        this.setStatus('Подготовка новой игры…');

        document.getElementById('start-menu').hidden = true;
        document.getElementById('game-controls').hidden = false;
        document.getElementById('game-title').textContent = module.name;
        document.getElementById('game-icon').textContent = module.gameIcon || '🎮';
        document.getElementById('game-description').textContent = module.gameDescription || '';
        this.setStatus('');

        try {
            module.clearBindings?.();
            module.setup();
            if (!this.getStatusText()) {
                this.setStatus(module.usesStartStop ? 'Нажмите «Старт»' : 'Новая партия началась');
            }
        } catch (error) {
            console.error(`Не удалось запустить ${module.name}`, error);
            module.isRunning = false;
            this.setStatus(`Ошибка запуска: ${error.message}`, 'error');
        }

        this.syncControls();
    }

    setupButtons() {
        document.getElementById('start-stop-btn').addEventListener('click', () => {
            const module = this.currentModule;
            if (!module) return;

            try {
                if (module.isRunning) module.pause();
                else module.start();
            } catch (error) {
                console.error(`Ошибка управления ${module.name}`, error);
                module.isRunning = false;
                this.setStatus(`Ошибка: ${error.message}`, 'error');
            }
            this.syncControls();
        });

        document.getElementById('clear-btn').addEventListener('click', () => {
            const module = this.currentModule;
            if (!module) return;

            try {
                module.clear();
                this.setStatus(module.usesStartStop ? 'Поле сброшено. Нажмите «Старт»' : 'Новая партия началась');
            } catch (error) {
                console.error(`Ошибка сброса ${module.name}`, error);
                module.isRunning = false;
                this.setStatus(`Ошибка сброса: ${error.message}`, 'error');
            }
            this.syncControls();
        });

        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.backToMenu());
    }

    backToMenu() {
        this.currentModule?.destroy?.();
        this.currentModule = null;
        this.gridManager.resetView();

        document.getElementById('game-controls').hidden = true;
        document.getElementById('start-menu').hidden = false;
        this.setStatus('');
    }

    syncControls() {
        const module = this.currentModule;
        if (!module) return;

        const startStopButton = document.getElementById('start-stop-btn');
        startStopButton.hidden = !module.usesStartStop;
        startStopButton.textContent = module.isRunning ? 'Пауза' : 'Старт';
        startStopButton.setAttribute('aria-pressed', String(module.isRunning));
        document.getElementById('clear-btn').textContent = module.usesStartStop ? 'Заново' : 'Новая игра';
    }

    setStatus(message = '', tone = 'info') {
        const status = document.getElementById('game-status');
        status.textContent = message;
        status.dataset.tone = tone;
    }

    getStatusText() {
        return document.getElementById('game-status')?.textContent?.trim() ?? '';
    }

    showLoadingErrors(errors) {
        if (!errors.length) return;
        const loadingStatus = document.getElementById('loading-status');
        loadingStatus.hidden = false;
        loadingStatus.dataset.tone = 'error';
        loadingStatus.textContent = `Не удалось загрузить: ${errors.join(', ')}`;
    }
}
