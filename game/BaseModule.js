// Общий жизненный цикл для всех игр QUAD.
export class BaseModule {
    static instanceCounter = 0;

    #name = 'Новая игра';

    constructor() {
        this.gameIcon = '🎮';
        this.gameDescription = '';
        this.isRunning = false;
        this.usesStartStop = true;
        this.gridScale = null;
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

    applyGridScale(value = this.gridScale?.value ?? this.gridScale?.defaultTileSize) {
        if (!this.gridScale || !this.gridManager) return null;

        const config = this.gridScale;
        const min = Math.max(6, Number(config.min) || 6);
        const max = Math.max(min, Number(config.max) || min);
        const requested = Number(value);
        const tileSize = Math.max(min, Math.min(max,
            Number.isFinite(requested) ? requested : Number(config.defaultTileSize) || min
        ));
        const previousTileSize = this.gridManager.tileSize;
        const previousGap = this.gridManager.gap;
        const previousTotalSize = this.gridManager.totalSize;
        const anchor = this.gridManager.getViewportAnchor?.() ?? null;
        const defaultTileSize = Math.max(1, Number(config.defaultTileSize) || tileSize);
        const defaultGap = Math.max(0, Number(config.defaultGap) || 0);
        const gap = Math.max(0, Math.round(defaultGap * tileSize / defaultTileSize));

        config.value = tileSize;
        if (this.gridManager.setGridMetrics) {
            this.gridManager.setGridMetrics(tileSize, gap);
        } else {
            this.gridManager.tileSize = tileSize;
            this.gridManager.gap = gap;
            this.gridManager.totalSize = tileSize + gap;
        }

        return {
            anchor,
            previousTileSize,
            previousGap,
            previousTotalSize,
            tileSize: this.gridManager.tileSize,
            gap: this.gridManager.gap,
            totalSize: this.gridManager.totalSize,
        };
    }

    onGridScaleChange() {
        this.onResize();
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
