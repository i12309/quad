// Общий жизненный цикл для всех игр QUAD.
export class BaseModule {
    static instanceCounter = 0;

    #name = 'Новая игра';

    constructor() {
        this.gameIcon = '🎮';
        this.gameDescription = '';
        this.isRunning = false;
        this.usesStartStop = true;
        this._domBindings = [];
        this._eventNamespace = `.quadGame${++BaseModule.instanceCounter}`;
    }

    get name() {
        return this.#name;
    }

    set name(value) {
        this.#name = value;
    }

    get controls() {
        return this.gridManager?.controls ?? null;
    }

    setRunning(value) {
        this.isRunning = Boolean(value);
        this.controls?.syncControls();
    }

    setStatus(message = '', tone = 'info') {
        this.controls?.setStatus(message, tone);
    }

    finish(message, tone = 'result') {
        this.pause();
        this.isRunning = false;
        this.setStatus(message, tone);
        this.controls?.syncControls();
    }

    bindDom(target, eventName, handler, options) {
        if (!target?.addEventListener) return;
        target.addEventListener(eventName, handler, options);
        this._domBindings.push(() => target.removeEventListener(eventName, handler, options));
    }

    bindStage(eventNames, handler) {
        const stage = this.gridManager?.stage;
        if (!stage?.on) return;

        const namespacedEvents = eventNames
            .split(/\s+/)
            .filter(Boolean)
            .map((eventName) => eventName.includes('.') ? eventName : `${eventName}${this._eventNamespace}`)
            .join(' ');

        stage.on(namespacedEvents, handler);
    }

    clearBindings() {
        this._domBindings.splice(0).forEach((remove) => remove());
        this.gridManager?.stage?.off?.(this._eventNamespace);
    }

    destroy() {
        this.pause();
        this.clearBindings();
    }

    setup() {}

    start() {
        this.setRunning(true);
    }

    pause() {
        this.setRunning(false);
    }

    clear() {}

    update() {}

    onResize() {}

    toggleCell() {}

    handleLeftClick() {}

    handleRightClick() {}

    showContextMenu() {}

    log(message) {
        console.info(`[${this.name}] ${message}`);
    }
}
