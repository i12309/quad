export class Controls {
    constructor() {
        this.gridManager = null;
        this.modules = new Map();
        this.currentModule = null;
        this.viewportGap = 12;
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
        document.getElementById('start-menu').hidden = true;
        document.getElementById('game-controls').hidden = false;
        document.getElementById('game-title').textContent = module.name;
        document.getElementById('game-icon').textContent = module.gameIcon || '🎮';
        document.getElementById('game-description').textContent = module.gameDescription || '';
        this.syncControls();

        this.gridManager.setViewportTop?.(this.getGameViewportTop(), { notifyModule: false });
        this.gridManager.resetView();
        this.prepareGridScale(module);
        this.setStatus('Подготовка новой игры…');

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
        this.updateGridScaleUi();
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

        document.getElementById('grid-scale-decrease')?.addEventListener('click', () => {
            this.adjustGridScale(-1);
        });
        document.getElementById('grid-scale-increase')?.addEventListener('click', () => {
            this.adjustGridScale(1);
        });

        const scaleInput = document.getElementById('grid-scale-input');
        scaleInput?.addEventListener('input', () => this.applyGridScale(scaleInput.value));
        scaleInput?.addEventListener('change', () => this.applyGridScale(scaleInput.value));
    }

    backToMenu() {
        this.currentModule?.destroy?.();
        this.currentModule = null;

        document.getElementById('game-controls').hidden = true;
        document.getElementById('start-menu').hidden = false;
        const scaleControl = document.getElementById('grid-scale-control');
        if (scaleControl) scaleControl.hidden = true;
        this.gridManager.setViewportTop?.(0, { notifyModule: false });
        this.gridManager.resetView();
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
        this.updateGridScaleUi();
    }

    getGameViewportTop() {
        const toolbar = document.getElementById('game-controls');
        if (!this.currentModule || !toolbar || toolbar.hidden) return 0;
        const bottom = Number(toolbar.getBoundingClientRect?.().bottom) || 0;
        return Math.max(0, Math.ceil(bottom + this.viewportGap));
    }

    getScaleStorage() {
        try {
            return globalThis.localStorage ?? globalThis.window?.localStorage ?? null;
        } catch {
            return null;
        }
    }

    getScaleStorageKey(module = this.currentModule) {
        return module ? `quad:grid-scale:${module.name}` : '';
    }

    getGridScaleBounds(module = this.currentModule) {
        const config = module?.gridScale;
        if (!config) return null;

        const defaultTileSize = Math.max(1, Number(config.defaultTileSize) || 12);
        const defaultGap = Math.max(0, Number(config.defaultGap) || 0);
        const totalRatio = (defaultTileSize + defaultGap) / defaultTileSize;
        let max = Math.max(6, Number(config.max) || defaultTileSize);

        if (config.fitColumns) {
            max = Math.min(max, Math.floor(
                this.gridManager.stage.width() / (Number(config.fitColumns) * totalRatio)
            ));
        }
        if (config.fitRows) {
            max = Math.min(max, Math.floor(
                this.gridManager.stage.height() / (Number(config.fitRows) * totalRatio)
            ));
        }

        max = Math.max(6, max);
        const min = Math.min(max, Math.max(6, Number(config.min) || 6));
        return {
            min,
            max,
            step: Math.max(1, Number(config.step) || 1),
        };
    }

    normalizeGridScale(value, bounds = this.getGridScaleBounds()) {
        if (!bounds) return null;
        const numeric = Number(value);
        const clamped = Math.max(bounds.min, Math.min(bounds.max,
            Number.isFinite(numeric) ? numeric : bounds.min
        ));
        const snapped = bounds.min + Math.round((clamped - bounds.min) / bounds.step) * bounds.step;
        return Math.max(bounds.min, Math.min(bounds.max, snapped));
    }

    prepareGridScale(module) {
        const control = document.getElementById('grid-scale-control');
        if (!module.gridScale) {
            if (control) control.hidden = true;
            return;
        }

        if (control) control.hidden = false;
        const bounds = this.getGridScaleBounds(module);
        let stored = null;
        try {
            stored = this.getScaleStorage()?.getItem(this.getScaleStorageKey(module)) ?? null;
        } catch {
            stored = null;
        }
        const preferred = stored ?? module.gridScale.value ?? module.gridScale.defaultTileSize;
        module.gridScale.value = this.normalizeGridScale(preferred, bounds);
        this.updateGridScaleUi(module, bounds);
    }

    updateGridScaleUi(module = this.currentModule, bounds = this.getGridScaleBounds(module)) {
        const control = document.getElementById('grid-scale-control');
        if (!control) return;
        if (!module?.gridScale || !bounds) {
            control.hidden = true;
            return;
        }

        control.hidden = false;
        const input = document.getElementById('grid-scale-input');
        const value = this.normalizeGridScale(
            module.gridScale.value ?? this.gridManager?.tileSize ?? module.gridScale.defaultTileSize,
            bounds
        );
        module.gridScale.value = value;

        if (input) {
            input.min = String(bounds.min);
            input.max = String(bounds.max);
            input.step = String(bounds.step);
            input.value = String(value);
            input.setAttribute?.('aria-valuenow', String(value));
        }

        const output = document.getElementById('grid-scale-value');
        if (output) output.textContent = `${value} px`;
        const decrease = document.getElementById('grid-scale-decrease');
        const increase = document.getElementById('grid-scale-increase');
        if (decrease) decrease.disabled = value <= bounds.min;
        if (increase) increase.disabled = value >= bounds.max;
    }

    adjustGridScale(direction) {
        const module = this.currentModule;
        const bounds = this.getGridScaleBounds(module);
        if (!module?.gridScale || !bounds) return;
        const value = Number(module.gridScale.value ?? module.gridScale.defaultTileSize);
        this.applyGridScale(value + direction * bounds.step);
    }

    applyGridScale(value) {
        const module = this.currentModule;
        const bounds = this.getGridScaleBounds(module);
        if (!module?.gridScale || !bounds) return;

        const nextValue = this.normalizeGridScale(value, bounds);
        const context = module.applyGridScale(nextValue);
        module.onGridScaleChange?.(context);
        this.updateGridScaleUi(module, bounds);

        try {
            this.getScaleStorage()?.setItem(this.getScaleStorageKey(module), String(nextValue));
        } catch {
            // Масштаб продолжает работать, даже если браузер запретил localStorage.
        }
    }

    reconcileGridScaleToViewport() {
        const module = this.currentModule;
        const bounds = this.getGridScaleBounds(module);
        if (!module?.gridScale || !bounds) return false;

        const currentValue = Number(module.gridScale.value ?? module.gridScale.defaultTileSize);
        const nextValue = this.normalizeGridScale(currentValue, bounds);
        if (nextValue === currentValue && this.gridManager.tileSize === nextValue) {
            this.updateGridScaleUi(module, bounds);
            return false;
        }

        this.applyGridScale(nextValue);
        return true;
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
